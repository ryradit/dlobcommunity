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
    const { partnerStats, stats, userId } = body;

    if (!partnerStats || !stats) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Create hash of input data for caching
    const statsHash = createHash({ partnerStats, stats });
    console.log('🔍 Stats hash:', statsHash, 'User ID:', userId);

    // Check if we have cached recommendations
    if (userId) {
      const { data: cachedInsight, error: cacheError } = await supabase
        .from('ai_insights')
        .select('response_data, expires_at')
        .eq('user_id', userId)
        .eq('insight_type', 'partner_recommendations')
        .eq('stats_hash', statsHash)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cacheError) {
        console.log('⚠️ Cache lookup error:', cacheError.message);
      }

      if (cachedInsight && !cacheError) {
        console.log('✅ Returning cached partner recommendations');
        return NextResponse.json(cachedInsight.response_data);
      } else {
        console.log('🔄 No cache found, generating new recommendations...');
      }
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
      systemInstruction: 'You are a badminton partnership analyst. Always respond in Bahasa Indonesia. Never use English in your responses.',
    });

    const prompt = `PENTING: Semua respons HARUS dalam Bahasa Indonesia. Jangan gunakan bahasa Inggris sama sekali.

Analisis statistik partner bulu tangkis dan berikan rekomendasi dalam format JSON.

Win Rate Keseluruhan Pemain: ${stats.winRate}%

Statistik Partner:
${partnerStats.map((p: any) => `- ${p.name}: ${p.winRate}% win rate, ${p.wins} menang dalam ${p.matches} pertandingan`).join('\n')}

Respond dengan HANYA objek JSON (tanpa markdown):
{
  "recommendations": [
    {
      "partner": "Nama partner",
      "reason": "Penjelasan singkat dalam Bahasa Indonesia (1 kalimat)",
      "confidence": "high" | "medium" | "low",
      "winRate": angka win rate
    }
  ],
  "summary": "Satu kalimat rekomendasi dalam Bahasa Indonesia"
}

Contoh yang BENAR:
{
  "recommendations": [
    {
      "partner": "John Doe",
      "reason": "Memiliki win rate tertinggi 85% dengan chemistry bermain yang solid.",
      "confidence": "high",
      "winRate": 85
    }
  ],
  "summary": "Bermain dengan John Doe memberikan peluang menang terbaik berdasarkan data historis."
}

Aturan:
1. Rekomendasikan 3 partner teratas
2. Prioritaskan win rate tinggi (>60%) dan pengalaman cukup (>3 pertandingan)
3. Jelaskan kekuatan spesifik partnership

JANGAN gunakan bahasa Inggris. Semua harus Bahasa Indonesia.`;

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
    
    const recommendations = JSON.parse(jsonMatch[0]);
    
    // Save to cache if userId provided
    if (userId) {
      const { data, error: saveError } = await supabase
        .from('ai_insights')
        .upsert({
          user_id: userId,
          insight_type: 'partner_recommendations',
          stats_hash: statsHash,
          response_data: recommendations,
        }, {
          onConflict: 'user_id,insight_type,stats_hash'
        });
      
      if (saveError) {
        console.error('❌ Failed to save recommendations to cache:', saveError.message);
      } else {
        console.log('💾 Saved partner recommendations to cache successfully');
      }
    }

    return NextResponse.json(recommendations);
  } catch (error: any) {
    console.error('Partner Recommendations Error:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to generate recommendations',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
