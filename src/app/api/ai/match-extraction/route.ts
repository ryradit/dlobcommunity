import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        { 
          error: 'DLOB AI Engine key not configured',
          details: 'Please ensure AI engine credentials are set in environment variables.'
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
   - Shuttlecock amount: In recreational doubles, 4 players share 1 or 2 shuttlecocks per match. Set "shuttlecock_amount" to "1" by default (or "2" if marked). DO NOT set to "4" just because 4 players played!
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
      "shuttlecock_amount": "1"
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
- Shuttlecock count per match is ALWAYS 1 or 2 (at most 3). NEVER confuse with total rows or players.
- Ignore blank/empty rows.
- Return ONLY the JSON object, no other text.`;

    // Standard prompt for DLOB Pusat whiteboard/sheet
    const pusatPrompt = `You are a badminton match data extraction assistant. Extract structured match information from this DLOB whiteboard/sheet image.

IMPORTANT: This image contains MULTIPLE MATCH ROWS (typically 10-25 matches). Extract ALL matches visible, not just one!

TYPICAL DLOB WHITEBOARD STRUCTURE:
Rows correspond to matches. The columns or entries per row typically include:
- Team 1 players: Two player names separated by "/" (e.g., "Kevin/Solaso")
- Team 2 players: Two player names separated by "/" (e.g., "Khai/William")
- Court number: e.g. "1", "2", "3" (often labeled "Lap" or "Lapangan")
- Match Score (Skor): e.g. "21-19", "30-28", "21/18", "30-22", or points like 21, 30
- Shuttlecock amount (Kok): Usually 1 or 2 (or tallies "|" or "||"). If not written, standard is 1.

CRITICAL RULES - DO NOT CONFUSE MATCH SCORE WITH SHUTTLECOCK AMOUNT:
- In badminton, MATCH SCORES are points (e.g., 21, 30, 21-19, 30-28, 15, 25).
- SHUTTLECOCK AMOUNT (Jumlah Kok) is the number of physical shuttlecocks consumed. In recreational matches, this is ALWAYS a small number: 1, 2, or at most 3-4!
- ABSOLUTELY NEVER put a match score (such as 21, 30, 25, 15, 21-19, 30-28) into "shuttlecock_amount"!
- If a column or cell contains scores (numbers >= 8 or with '-' or '/'):
  * Put them into "team1_score" and "team2_score", or "score" (e.g. "21-19").
  * Do NOT put them into "shuttlecock_amount"!
- If shuttlecock count is not explicitly marked as 1, 2, or 3, ALWAYS default "shuttlecock_amount" to "1".
- "court_number" is usually 1, 2, 3, etc. If not clear, default to "1".

Extract and return ONLY a valid JSON object with ALL matches:
{
  "matches": [
    {
      "team1_player1": "First player name",
      "team1_player2": "Second player name",
      "team2_player1": "First player name",
      "team2_player2": "Second player name",
      "court_number": "1",
      "shuttlecock_amount": "1",
      "team1_score": 21,
      "team2_score": 19,
      "score": "21-19"
    }
  ],
  "total_matches": 1,
  "confidence": 85
}

CRITICAL PARSING RULES:
- Extract EVERY row as a separate match
- Team format is ALWAYS "Player1/Player2" (separated by forward slash)
- Example: "Kevin/Solaso" → team1_player1="Kevin", team1_player2="Solaso"
- Example: "Khai/William" → team2_player1="Khai", team2_player2="William"
- Split team names by "/" character to get individual players
- Extract ALL matches visible in the image, typically 10-25 matches
- "shuttlecock_amount" MUST NEVER BE GREATER THAN 4. If you see numbers like 15-30, that is the MATCH SCORE, NOT the shuttlecock count!
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

    // Sanitize matches to prevent match scores from leaking into shuttlecock_amount
    if (extractedData && Array.isArray(extractedData.matches)) {
      extractedData.matches = extractedData.matches.map((m: any) => {
        let rawKok = String(m.shuttlecock_amount || '').trim();
        let team1Score = m.team1_score ? parseInt(m.team1_score, 10) : undefined;
        let team2Score = m.team2_score ? parseInt(m.team2_score, 10) : undefined;
        let scoreStr = m.score ? String(m.score).trim() : '';

        // Check if rawKok is formatted like a score e.g. "21-19", "30-28", "21/18"
        const scorePatternMatch = rawKok.match(/^(\d{1,2})\s*[-/vs:]\s*(\d{1,2})$/i);
        if (scorePatternMatch) {
          team1Score = parseInt(scorePatternMatch[1], 10);
          team2Score = parseInt(scorePatternMatch[2], 10);
          scoreStr = `${team1Score}-${team2Score}`;
          rawKok = '1'; // Default shuttlecock to 1
        } else {
          const parsedKok = parseInt(rawKok, 10);
          // If rawKok is >= 8 (e.g. 15, 21, 25, 30), it's a match score, NOT shuttlecocks!
          if (!isNaN(parsedKok) && parsedKok >= 8) {
            if (team1Score === undefined) team1Score = parsedKok;
            rawKok = '1'; // Reset shuttlecock to 1
          } else if (isNaN(parsedKok) || parsedKok <= 0) {
            rawKok = '1';
          } else if (parsedKok > 4) {
            // Unusually high shuttlecock count in recreational game
            rawKok = '2';
          }
        }

        return {
          ...m,
          shuttlecock_amount: rawKok,
          team1_score: !isNaN(team1Score as number) ? team1Score : null,
          team2_score: !isNaN(team2Score as number) ? team2Score : null,
          score: scoreStr || (team1Score && team2Score ? `${team1Score}-${team2Score}` : undefined),
        };
      });
    }

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
