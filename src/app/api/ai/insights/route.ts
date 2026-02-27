import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Use service role key to bypass RLS for server-side caching
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
    const { stats, partnerStats, opponentStats, recentMatches, userId } = body;

    if (!stats || !partnerStats || !opponentStats) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Create hash of input data for caching
    const statsHash = createHash({ stats, partnerStats, opponentStats, recentMatches });
    console.log('🔍 Stats hash:', statsHash, 'User ID:', userId);

    // Check if we have cached insights
    if (userId) {
      const { data: cachedInsight, error: cacheError } = await supabase
        .from('ai_insights')
        .select('response_data, expires_at')
        .eq('user_id', userId)
        .eq('insight_type', 'performance')
        .eq('stats_hash', statsHash)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cacheError) {
        console.log('⚠️ Cache lookup error:', cacheError.message);
      }

      if (cachedInsight && !cacheError) {
        console.log('✅ Returning cached AI insights');
        return NextResponse.json(cachedInsight.response_data);
      } else {
        console.log('🔄 No cache found, generating new insights...');
      }
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
      systemInstruction: 'You are a motivational badminton coach and analytics expert. Always respond in Bahasa Indonesia using "Anda" (you) to directly address the player. Be persuasive, encouraging, and motivational. Never use English or refer to the player as "pemain".',
    });

    const prompt = `PENTING: Semua respons HARUS dalam Bahasa Indonesia. Gunakan "Anda" untuk berbicara langsung kepada pemain. Buat responsnya persuasif, memotivasi, dan personal.

Analisis data performa bulu tangkis dan berikan 3-4 wawasan motivasi dalam format JSON.

Statistik Anda:
- Total Pertandingan: ${stats.totalMatches}
- Win Rate: ${stats.winRate}%
- Streak Saat Ini: ${stats.currentStreak.count} ${stats.currentStreak.type || 'none'}
- Streak Menang Terpanjang: ${stats.longestWinStreak}
- Streak Kalah Terpanjang: ${stats.longestLossStreak}
- Skor Rata-rata: ${stats.averageScore}
- Skor Tertinggi: ${stats.highestScore}
- Margin Kemenangan Terbesar: ${stats.biggestWinMargin}

Partner Terbaik Anda:
${partnerStats.slice(0, 3).map((p: any) => `- ${p.name}: ${p.winRate}% win rate (${p.matches} pertandingan)`).join('\n')}

Lawan yang Anda Hadapi:
${opponentStats.slice(0, 3).map((o: any) => `- ${o.name}: ${o.wins}M-${o.losses}K (${o.matches} pertandingan)`).join('\n')}

Performa Terkini Anda (5 pertandingan terakhir):
${recentMatches.map((m: any, i: number) => `Pertandingan ${i + 1}: ${m.isWinner ? 'Menang' : 'Kalah'} (${m.myScore}-${m.opponentScore})`).join('\n')}

Respond dengan HANYA objek JSON (tanpa markdown):
{
  "insights": [
    {
      "type": "positive" | "negative" | "neutral",
      "title": "Judul motivasi dalam Bahasa Indonesia (maks 6 kata)",
      "description": "Penjelasan detail yang persuasif dan memotivasi menggunakan 'Anda' dengan angka dan saran (2-3 kalimat)",
      "icon": "trophy" | "target" | "trending-up" | "trending-down" | "users" | "flame" | "alert"
    }
  ]
}

Contoh yang BENAR (gunakan "Anda", bukan "pemain"):
{
  "insights": [
    {
      "type": "positive",
      "title": "Performa Anda Meningkat Tajam",
      "description": "Win rate Anda meningkat 15% dalam 10 pertandingan terakhir! Momentum positif ini menunjukkan peningkatan skill yang konsisten. Teruskan fokus dan strategi Anda!",
      "icon": "trending-up"
    },
    {
      "type": "neutral",
      "title": "Kemitraan yang Berhasil",
      "description": "Dengan win rate 100% bersama partner terbaik Anda, komunikasi tim Anda sangat solid. Pertahankan sinergi ini untuk hasil maksimal di turnamen mendatang.",
      "icon": "users"
    }
  ]
}

JANGAN gunakan "pemain". SELALU gunakan "Anda" untuk berbicara langsung. Buat responsnya motivasi dan persuasif.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up the response
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }
    
    const insights = JSON.parse(jsonMatch[0]);
    
    // Save to cache if userId provided
    if (userId) {
      const { data, error: saveError } = await supabase
        .from('ai_insights')
        .upsert({
          user_id: userId,
          insight_type: 'performance',
          stats_hash: statsHash,
          response_data: insights,
        }, {
          onConflict: 'user_id,insight_type,stats_hash'
        });
      
      if (saveError) {
        console.error('❌ Failed to save insights to cache:', saveError.message);
      } else {
        console.log('💾 Saved AI insights to cache successfully');
      }
    }

    return NextResponse.json(insights);
  } catch (error: any) {
    console.error('AI Insights Error:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to generate insights',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
