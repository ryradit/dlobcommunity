import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

function createHash(data: any): string {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerStats, mode, numTeams, userId } = body;

    if (!playerStats || !mode) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Create hash for caching
    const statsHash = createHash({ playerStats, mode, numTeams });
    console.log('🔍 Team optimizer hash:', statsHash);

    // Check cache
    if (userId) {
      const { data: cachedResult, error: cacheError } = await supabase
        .from('ai_insights')
        .select('response_data, expires_at')
        .eq('user_id', userId)
        .eq('insight_type', 'team_optimizer')
        .eq('stats_hash', statsHash)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cacheError) {
        console.log('⚠️ Cache lookup error:', cacheError.message);
      }

      if (cachedResult && !cacheError) {
        console.log('✅ Returning cached team optimization');
        return NextResponse.json(cachedResult.response_data);
      } else {
        console.log('🔄 No cache found, generating new team composition...');
      }
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
      },
      systemInstruction: 'You are a badminton team composition expert. Always respond in Bahasa Indonesia for descriptions. Analyze partnerships and suggest optimal team pairings.',
    });

    const modeDescriptions = {
      balanced: 'Buat tim yang seimbang dengan skill level merata',
      competitive: 'Maksimalkan kekuatan tim untuk kompetisi',
      training: 'Campur pemain berpengalaman dengan pemula untuk pembelajaran',
      exciting: 'Buat pertandingan yang seru dan kompetitif'
    };

    const prompt = `PENTING: Semua deskripsi dan insight HARUS dalam Bahasa Indonesia.

Analisis data pemain bulu tangkis dan buat komposisi tim optimal.

Mode: ${mode} - ${modeDescriptions[mode as keyof typeof modeDescriptions]}
Jumlah Tim yang Diinginkan: ${numTeams || 'auto'}

Data Pemain:
${playerStats.map((p: any) => `
- ${p.name}:
  * Win Rate: ${p.winRate}%
  * Total Pertandingan: ${p.totalMatches}
  * Skor Rata-rata: ${p.avgScore}
  * Skill Level: ${p.skillLevel}
  * Partnership Terbaik: ${p.bestPartners?.map((bp: any) => `${bp.partner} (${bp.winRate}%)`).join(', ') || 'Belum ada data'}
`).join('\n')}

Respond dengan HANYA objek JSON (tanpa markdown):
{
  "teams": [
    {
      "teamId": 1,
      "player1": "Nama Player 1",
      "player2": "Nama Player 2",
      "skillLevel": angka 1-100,
      "chemistry": "high" | "medium" | "low" | "new",
      "chemistryScore": angka 0-100,
      "winRate": angka (prediksi win rate tim ini),
      "reasoning": "Penjelasan mengapa pasangan ini bagus (Bahasa Indonesia, 1-2 kalimat)"
    }
  ],
  "matchups": [
    {
      "team1Id": 1,
      "team2Id": 2,
      "winProbability": { "team1": 55, "team2": 45 },
      "expectedScore": "21-18",
      "excitement": "high" | "medium" | "low",
      "reasoning": "Analisis matchup dalam Bahasa Indonesia (1-2 kalimat)"
    }
  ],
  "summary": "Ringkasan keseluruhan komposisi tim dalam Bahasa Indonesia (2-3 kalimat)",
  "recommendations": [
    "Rekomendasi 1 dalam Bahasa Indonesia",
    "Rekomendasi 2 dalam Bahasa Indonesia"
  ]
}

Aturan:
1. Maksimalkan chemistry berdasarkan partnership history
2. ${mode === 'balanced' ? 'Pastikan total skill level setiap tim kurang lebih sama' : ''}
3. ${mode === 'competitive' ? 'Pasangkan pemain terkuat bersama' : ''}
4. ${mode === 'training' ? 'Campur pemain berpengalaman (win rate >60%) dengan pemula' : ''}
5. ${mode === 'exciting' ? 'Buat matchup dengan win probability mendekati 50-50' : ''}
6. Pertimbangkan chemistry dari data bestPartners
7. Berikan reasoning yang spesifik dan berbasis data

JANGAN gunakan bahasa Inggris dalam reasoning, summary, atau recommendations.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up response
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }
    
    const optimization = JSON.parse(jsonMatch[0]);
    
    // Save to cache
    if (userId) {
      const { error: saveError } = await supabase
        .from('ai_insights')
        .upsert({
          user_id: userId,
          insight_type: 'team_optimizer',
          stats_hash: statsHash,
          response_data: optimization,
        }, {
          onConflict: 'user_id,insight_type,stats_hash'
        });
      
      if (saveError) {
        console.error('❌ Failed to save team optimization to cache:', saveError.message);
      } else {
        console.log('💾 Saved team optimization to cache successfully');
      }
    }

    return NextResponse.json(optimization);
  } catch (error: any) {
    console.error('Team Optimizer Error:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to generate team composition',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
