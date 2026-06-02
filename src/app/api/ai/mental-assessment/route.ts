import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getGenerativeModelWithFallback } from '@/lib/gemini';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, confidenceLevel, pressureSymptoms, decisionStyle, winningMentalityStyle } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('[Mental Assessment API] Starting independent assessment for:', userId);

    const prompt = `
SISTEM: Anda adalah "Dlob Coach Agent" - psikolog olahraga dan pelatih bulu tangkis spesialisasi ketangguhan mental.
Tugas Anda adalah menganalisis jawaban kuesioner psikologi tanding pemain dan memberikan asesmen terstruktur dalam format JSON.

JAWABAN KUESIONER PEMAIN:
1. Kepercayaan Diri: ${confidenceLevel}/100
2. Gejala saat Tekanan (Skor Kritis): ${pressureSymptoms?.join(', ') || 'Tidak ada'}
3. Pengambilan Keputusan saat Tekanan: ${decisionStyle || 'Tidak ditentukan'}
4. Mentalitas Juara (Winning Mentality): ${winningMentalityStyle || 'Tidak ditentukan'}

TUGAS:
Hasilkan objek JSON asesmen psikologis yang komprehensif, logis, dan sangat personal berdasarkan jawaban kuesioner di atas.
Gunakan format JSON yang valid dengan field-field berikut:
{
  "confidence_level": number (skala 1-100, mencerminkan kepercayaan diri),
  "pressure_response_score": number (skala 1-100, mencerminkan kemampuan menangani tekanan),
  "consistency_score": number (skala 1-100, mencerminkan konsistensi mental),
  "winning_mentality_score": number (skala 1-100, mencerminkan mentalitas juara),
  "overall_psychological_score": number (skala 1-100, rata-rata composite),
  "findings": "Penjelasan detail dalam 2-3 kalimat Bahasa Indonesia mengenai kondisi mental pemain berdasarkan kombinasi gejalanya.",
  "mental_strengths": ["Daftar kelebihan mental pemain (min. 2 item) dalam Bahasa Indonesia"],
  "improvement_areas": ["Daftar area mental yang perlu diperbaiki (min. 2 item) dalam Bahasa Indonesia"],
  "recommendations": ["Rekomendasi taktis/latihan mental spesifik untuk mengatasi tekanan saat match point (min. 3 item) dalam Bahasa Indonesia"]
}

JANGAN berikan teks pengantar atau penutup. Berikan HANYA JSON mentah yang valid.
`;

    const model = getGenerativeModelWithFallback({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const responseText = result.response.text();
    console.log('[Mental Assessment API] LLM raw response:', responseText);

    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText.trim().replace(/^```json\s*|```$/g, ''));
    } catch (parseError) {
      console.error('[Mental Assessment API] JSON parse failed, returning fallback structure:', parseError);
      parsedResult = {
        confidence_level: parseInt(confidenceLevel) || 60,
        pressure_response_score: 55,
        consistency_score: 58,
        winning_mentality_score: 60,
        overall_psychological_score: 58,
        findings: "Berdasarkan survei Anda, Anda cenderung tegang di poin kritis. Latihan visualisasi dan pernapasan direkomendasikan.",
        mental_strengths: ["Memiliki kemauan tanding yang kuat", "Fokus yang baik di awal set"],
        improvement_areas: ["Kontrol emosi di poin krusial", "Ketegangan fisik saat menerima servis"],
        recommendations: [
          "Latih pernapasan dalam (4-7-8) sebelum rally saat skor ketat",
          "Visualisasikan service sukses sebelum melangkah ke lapangan",
          "Simulasikan game tanding dengan handicap skor tertinggal"
        ]
      };
    }

    // Save to mental_assessment table
    const { data: insertData, error: insertError } = await supabase
      .from('mental_assessment')
      .insert({
        user_id: userId,
        assessment_type: 'general_psychological',
        confidence_level: parsedResult.confidence_level || 50,
        pressure_response_score: parsedResult.pressure_response_score || 50,
        consistency_score: parsedResult.consistency_score || 50,
        winning_mentality_score: parsedResult.winning_mentality_score || 50,
        overall_psychological_score: parsedResult.overall_psychological_score || 50,
        findings: parsedResult.findings,
        mental_strengths: parsedResult.mental_strengths,
        improvement_areas: parsedResult.improvement_areas,
        recommendations: parsedResult.recommendations,
        performance_notes: `Asesmen Mandiri via Formulir Psikologi Tanding. Gejala tekanan: ${pressureSymptoms?.join(', ')}`,
        recent_matches_analyzed: 0,
        assessed_date: new Date().toISOString()
      })
      .select();

    if (insertError) {
      console.error('[Mental Assessment API] Error saving to DB:', insertError);
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      assessment: insertData?.[0] || parsedResult
    });

  } catch (error: any) {
    console.error('[Mental Assessment API] Error:', error);
    return NextResponse.json(
      { error: error?.message || String(error) || 'Internal server error' },
      { status: 500 }
    );
  }
}
