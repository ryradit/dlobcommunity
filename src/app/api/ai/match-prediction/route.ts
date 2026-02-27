import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { partner, opponents, stats, partnerStats, opponentStats, recentForm } = await request.json();

    const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
    },
  });

    const partnerData = partnerStats.find((p: any) => p.name === partner);
    const opponentData = opponents.map((opp: string) => 
      opponentStats.find((o: any) => o.name === opp)
    );

    const prompt = `Predict the outcome of an upcoming badminton match based on historical data.

Your Team:
- Your overall win rate: ${stats.winRate}%
- Partner: ${partner}
- Win rate with this partner: ${partnerData?.winRate || 'No history'}% (${partnerData?.matches || 0} matches)
- Your recent form: ${recentForm.filter((r: boolean) => r).length} wins in last ${recentForm.length} matches
- Current streak: ${stats.currentStreak.count} ${stats.currentStreak.type || 'none'}

Opponents:
${opponents.map((opp: string, idx: number) => {
  const data = opponentData[idx];
  return `- ${opp}: Your record ${data?.wins || 0}W-${data?.losses || 0}L (${data?.matches || 0} matches total)`;
}).join('\n')}

Respond with ONLY a JSON object in this exact format:
{
  "winProbability": number between 0-100,
  "confidence": "high" | "medium" | "low",
  "analysis": "2-3 sentences explaining the prediction with specific factors",
  "keyFactors": [
    "Factor 1",
    "Factor 2",
    "Factor 3"
  ],
  "advice": "One actionable tip for this match"
}

Consider:
1. Partnership chemistry (win rate together)
2. Head-to-head records against opponents
3. Current form and momentum
4. Sample size reliability`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : text;
    
    const prediction = JSON.parse(jsonText);

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Match Prediction Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}
