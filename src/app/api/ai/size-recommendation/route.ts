import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SizeRecommendationRequest {
  age: number;
  height: number;
  weight: number;
  fitPreference?: 'slim' | 'regular' | 'loose';
}

const SIZE_CHART_CONTEXT = `
Berikut adalah tabel ukuran resmi Jersey Badminton DLOB Community:

1. KATEGORI BALITA (Usia 1 - 6 Tahun):
- Balita XS: 1-2 Tahun, Tinggi 36 cm, Lebar 28 cm
- Balita S: 2-3 Tahun, Tinggi 40 cm, Lebar 31 cm
- Balita M: 3-4 Tahun, Tinggi 43 cm, Lebar 34 cm
- Balita L: 4-5 Tahun, Tinggi 45 cm, Lebar 36 cm
- Balita XL: 5-6 Tahun, Tinggi 47 cm, Lebar 38 cm

2. KATEGORI KIDS (Usia 7 - 13 Tahun):
- Kids S: 7-8 Tahun, Tinggi 57 cm, Lebar 43 cm
- Kids M: 8-9 Tahun, Tinggi 59 cm, Lebar 44 cm
- Kids L: 10-11 Tahun, Tinggi 62 cm, Lebar 46 cm
- Kids XL: 12-13 Tahun, Tinggi 65 cm, Lebar 48 cm

3. KATEGORI DEWASA (Usia 14+ Tahun / Adult):
- XS: Tinggi 65 cm, Lebar 45 cm (Cocok TB 150-158cm, BB 42-50kg)
- S: Tinggi 68 cm, Lebar 48 cm (Cocok TB 158-166cm, BB 50-58kg)
- M: Tinggi 71 cm, Lebar 51 cm (Cocok TB 165-173cm, BB 58-68kg)
- L: Tinggi 74 cm, Lebar 54 cm (Cocok TB 172-180cm, BB 68-78kg)
- XL: Tinggi 77 cm, Lebar 57 cm (Cocok TB 178-185cm, BB 78-88kg)
- XXL: Tinggi 80 cm, Lebar 62 cm (Cocok TB 180-190cm, BB 88-100kg)
- 3XL: Tinggi 83 cm, Lebar 65 cm (Cocok TB 180cm+, BB 100kg+)
`;

// Fallback rule-based recommendation if Gemini is rate limited or unavailable
function calculateFallbackRecommendation(
  age: number,
  height: number,
  weight: number,
  fitPreference: 'slim' | 'regular' | 'loose' = 'regular'
) {
  if (age <= 6) {
    let size = 'Balita M';
    if (age <= 2 || height < 90 || weight < 12) size = 'Balita XS';
    else if (age <= 3 || height < 100 || weight < 15) size = 'Balita S';
    else if (age <= 4 || height < 110 || weight < 18) size = 'Balita M';
    else if (age <= 5 || height < 118 || weight < 22) size = 'Balita L';
    else size = 'Balita XL';

    return {
      recommendedCategory: 'balita',
      recommendedSize: size,
      alternativeSize: fitPreference === 'loose' ? 'Balita XL' : 'Balita M',
      fitType: fitPreference === 'loose' ? 'Comfort / Loose Fit' : 'Standard Fit',
      reasoning: `Untuk anak usia ${age} tahun dengan tinggi ${height} cm dan berat ${weight} kg, ukuran ${size} sangat ideal dan nyaman untuk aktivitas bermain aktif.`,
      tips: 'Anak dalam masa pertumbuhan aktif, jika ragu disarankan memilih 1 tingkat lebih besar.',
    };
  }

  if (age <= 13) {
    let size = 'Kids M';
    if (age <= 8 || height < 125 || weight < 27) size = 'Kids S';
    else if (age <= 9 || height < 135 || weight < 33) size = 'Kids M';
    else if (age <= 11 || height < 145 || weight < 40) size = 'Kids L';
    else size = 'Kids XL';

    return {
      recommendedCategory: 'kids',
      recommendedSize: size,
      alternativeSize: fitPreference === 'loose' ? 'Kids XL' : 'Kids L',
      fitType: fitPreference === 'loose' ? 'Comfort / Loose Fit' : 'Regular Fit',
      reasoning: `Untuk usia ${age} tahun dengan tinggi ${height} cm dan berat ${weight} kg, ukuran ${size} memberikan kenyamanan dan keleluasaan bergerak saat bermain badminton.`,
      tips: 'Bahan Milano Standard adem dan fleksibel untuk rally latihan intensif.',
    };
  }

  // Adult (Dewasa)
  let size = 'M';
  const bmi = weight / Math.pow(height / 100, 2);

  if (height < 158 || (weight < 50 && bmi < 19)) size = 'XS';
  else if (height < 166 && weight <= 58) size = 'S';
  else if (height < 174 && weight <= 68) size = 'M';
  else if (height < 181 && weight <= 78) size = 'L';
  else if (height < 187 && weight <= 88) size = 'XL';
  else if (weight <= 100) size = 'XXL';
  else size = '3XL';

  // Adjust for loose preference
  if (fitPreference === 'loose') {
    const adultOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    const curIdx = adultOrder.indexOf(size);
    if (curIdx !== -1 && curIdx < adultOrder.length - 1) {
      size = adultOrder[curIdx + 1];
    }
  }

  return {
    recommendedCategory: 'dewasa',
    recommendedSize: size,
    alternativeSize: size === '3XL' ? 'XXL' : size === 'M' ? 'L' : 'M',
    fitType: fitPreference === 'loose' ? 'Comfort Fit (Longgar)' : 'Athletic Regular Fit',
    reasoning: `Berdasarkan tinggi ${height} cm dan berat ${weight} kg pada usia ${age} tahun, ukuran ${size} Dewasa memberikan proporsi terbaik untuk kelincahan dan kenyamanan gerak badminton.`,
    tips: 'Jersey berbahan Milano Standard premium yang jatuh pas di badan dan sangat menyerap keringat.',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SizeRecommendationRequest = await request.json();
    const { age, height, weight, fitPreference = 'regular' } = body;

    if (!age || !height || !weight || age <= 0 || height <= 0 || weight <= 0) {
      return NextResponse.json(
        { error: 'Mohon masukkan usia, tinggi badan, dan berat badan yang valid.' },
        { status: 400 }
      );
    }

    const geminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_AI_API_KEY;

    if (!geminiKey || geminiKey.trim() === '') {
      // Return smart fallback recommendation immediately
      const fallback = calculateFallbackRecommendation(age, height, weight, fitPreference);
      return NextResponse.json({ success: true, ...fallback, source: 'fallback_rules' });
    }

    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 500,
          responseMimeType: 'application/json',
        },
      });

      const prompt = `
Anda adalah AI Apparel & Fitting Expert untuk Jersey Badminton Komunitas DLOB.
Tugas Anda adalah merekomendasikan ukuran jersey yang paling pas dan nyaman berdasarkan data fisik pemesan.

${SIZE_CHART_CONTEXT}

DATA PEMESAN:
- Usia: ${age} Tahun
- Tinggi Badan: ${height} cm
- Berat Badan: ${weight} kg
- Preferensi Fitting: ${fitPreference === 'loose' ? 'Lebih Longgar / Nyaman' : fitPreference === 'slim' ? 'Pas Badan / Slim' : 'Standar Regular'}

INSTRUKSI:
1. Tentukan kategori yang tepat ("dewasa", "kids", atau "balita").
   - Balita: Usia 1-6 tahun (Pilihan: "Balita XS", "Balita S", "Balita M", "Balita L", "Balita XL").
   - Kids: Usia 7-13 tahun (Pilihan: "Kids S", "Kids M", "Kids L", "Kids XL").
   - Dewasa: Usia 14+ tahun atau postur dewasa (Pilihan: "XS", "S", "M", "L", "XL", "XXL", "3XL").
2. Berikan "recommendedSize" (harus sama persis dengan kode size di atas, misal: "M", "Kids L", atau "Balita M").
3. Berikan "alternativeSize" jika pemesan ingin ukuran cadangan yang lebih longgar/pas.
4. Berikan "reasoning" yang jelas, ramah, dan meyakinkan (2 kalimat dalam Bahasa Indonesia).
5. Berikan "tips" singkat mengenai fitting olahraga badminton.

Format Output WAJIB JSON:
{
  "recommendedCategory": "dewasa" | "kids" | "balita",
  "recommendedSize": "M",
  "alternativeSize": "L",
  "fitType": "Regular Athletic Fit",
  "reasoning": "Penjelasan rekomendasi...",
  "tips": "Tips tambahan..."
}
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      return NextResponse.json({
        success: true,
        recommendedCategory: parsed.recommendedCategory || 'dewasa',
        recommendedSize: parsed.recommendedSize || 'M',
        alternativeSize: parsed.alternativeSize || 'L',
        fitType: parsed.fitType || 'Regular Fit',
        reasoning: parsed.reasoning || 'Ukuran ini memberikan kenyamanan optimal saat bermain badminton.',
        tips: parsed.tips || 'Bahan Milano Standard adem dan fleksibel untuk pergerakan bebas.',
        source: 'gemini_ai',
      });
    } catch (aiErr) {
      console.warn('[AI Size Recommendation] Fallback triggered due to Gemini error:', aiErr);
      const fallback = calculateFallbackRecommendation(age, height, weight, fitPreference);
      return NextResponse.json({ success: true, ...fallback, source: 'fallback_rules' });
    }
  } catch (error: any) {
    console.error('[AI Size Recommendation Error]:', error);
    return NextResponse.json(
      { error: 'Gagal menganalisis rekomendasi ukuran', details: error.message },
      { status: 500 }
    );
  }
}
