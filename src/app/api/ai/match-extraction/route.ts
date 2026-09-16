import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        { 
          error: 'Gemini API key not configured',
          details: 'Please add GEMINI_API_KEY to your .env.local file. Get your free API key from: https://aistudio.google.com/app/apikey'
        },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { imageBase64, branchId } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Gemini 2.5 Flash Lite supports both text and vision
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const isDlbc = branchId === 'dlob-cikupa';

    // Specialized prompt for DLBC (Cikupa) matrix attendance sheet
    const dlbcPrompt = `You are a badminton match data extraction assistant specialized for DLBC (DLOB Cikupa) session forms.
Extract structured information from this printed matrix table image.

THE TABLE STRUCTURE:
- Header contains:
  1. "NO" (Row numbers 1 to 24)
  2. "NAMA" (Member/Player name in each row)
  3. "Pemakaian Kock" with subcolumns: "Match 1", "Match 2", "Match 3", "Match 4", "Match 5", "Match 6", "Match 7", "Match 8", "Match 9", "Match 10"
  4. "Total Pemakaian Kock" with subcolumns: "Pcs", "Rp"
  5. "Lapangan" with subcolumn: "Rp"
  6. "TOTAL" (Rupiah sum of Kock + Lapangan)
  7. "Keterangan" (Notes / Payment status)
- Bottom row: "GRAND TOTAL"

EXTRACTION GOALS:
1. Reconstruct doubles badminton matches from the "Match 1" to "Match 10" columns:
   - For each Match column (e.g., Match 1, Match 2...): Look down the rows to find which 4 players have marks, numbers (shuttlecock counts), or ticks in that Match column.
   - Pair the 4 players into 2 teams:
     team1_player1 = Player 1
     team1_player2 = Player 2
     team2_player1 = Player 3
     team2_player2 = Player 4
   - If shuttlecock amount for the match is marked or implied, use it (default "4" if 4 players played).
   - Set court_number to "1" (or court indicated).
2. ALSO extract each player's row summary from the matrix table:
   - "no": row number
   - "name": player name (read clearly, trim extra marks)
   - "matches_played": list of match numbers they played (e.g., [1, 3])
   - "kok_pcs": number of shuttlecocks from "Pcs" column (or 0 if empty)
   - "kok_rp": rupiah from "Rp" column (or 0 if empty)
   - "lapangan_rp": rupiah from "Lapangan" column (or 0 if empty)
   - "total": total rupiah from "TOTAL" column
   - "keterangan": text from "Keterangan" column

Return ONLY a valid JSON object matching this exact structure:
{
  "matches": [
    {
      "team1_player1": "Player A",
      "team1_player2": "Player B",
      "team2_player1": "Player C",
      "team2_player2": "Player D",
      "court_number": "1",
      "shuttlecock_amount": "4"
    }
  ],
  "matrix_players": [
    {
      "no": 1,
      "name": "Budi",
      "matches_played": [1, 2],
      "kok_pcs": 2,
      "kok_rp": 6000,
      "lapangan_rp": 18000,
      "total": 24000,
      "keterangan": "Lunas"
    }
  ],
  "total_matches": 1,
  "confidence": 85
}

CRITICAL RULES:
- Read handwritten names carefully and keep capitalization clean.
- Ignore blank/empty rows.
- Return ONLY the JSON object, no other text.`;

    // Standard prompt for DLOB Pusat 4-column whiteboard/sheet
    const pusatPrompt = `You are a badminton match data extraction assistant. Extract structured match information from this image.

IMPORTANT: This image contains MULTIPLE MATCH ROWS (typically 15-20 matches). Extract ALL matches, not just one!

The image has 4 columns per row:
- Column 1: Team 1 players (ALWAYS separated by "/" e.g., "Kevin/Solaso" means Kevin AND Solaso)
- Column 2: Team 2 players (ALWAYS separated by "/" e.g., "Khai/William" means Khai AND William)
- Column 3: Court number
- Column 4: Shuttlecock amount

Extract and return ONLY a valid JSON array with ALL matches:
{
  "matches": [
    {
      "team1_player1": "First player name",
      "team1_player2": "Second player name",
      "team2_player1": "First player name",
      "team2_player2": "Second player name",
      "court_number": "Court number",
      "shuttlecock_amount": "Number of shuttlecocks"
    },
    ... (repeat for ALL matches found)
  ],
  "total_matches": number,
  "confidence": 0-100
}

CRITICAL PARSING RULES:
- Extract EVERY row as a separate match
- Team format is ALWAYS "Player1/Player2" (separated by forward slash)
- Example: "Kevin/Solaso" → team1_player1="Kevin", team1_player2="Solaso"
- Example: "Khai/William" → team2_player1="Khai", team2_player2="William"
- Split team names by "/" character to get individual players
- Extract ALL matches visible in the image, typically 15-20 matches
- If data is unclear for a field, use empty string
- Confidence indicates overall extraction quality
- Return ONLY the JSON object, no other text`;

    const prompt = isDlbc ? dlbcPrompt : pusatPrompt;

    const imageParts = [
      {
        inlineData: {
          data: imageBase64.split(',')[1],
          mimeType: 'image/jpeg',
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);

    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse AI response:', text);
      return NextResponse.json(
        { 
          error: 'Failed to extract structured data from AI response',
          details: 'AI returned invalid format. Raw response: ' + text.substring(0, 200)
        },
        { status: 500 }
      );
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      data: extractedData,
      rawResponse: text,
    });
  } catch (error) {
    console.error('Match extraction error:', error);
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    return NextResponse.json(
      { 
        error: 'Failed to extract match data', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
