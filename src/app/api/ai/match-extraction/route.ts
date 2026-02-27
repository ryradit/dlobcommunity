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
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Gemini 2.5 Flash Lite supports both text and vision
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `You are a badminton match data extraction assistant. Extract structured match information from this image.

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
