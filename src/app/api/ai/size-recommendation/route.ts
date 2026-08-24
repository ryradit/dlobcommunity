import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SizeRecommendationRequest {
  age: number;
  height: number;
  weight: number;
  fitPreference?: 'slim' | 'regular' | 'loose';
}

export interface SizeTableSpec {
  category: 'dewasa' | 'kids' | 'balita';
  label: string;
  tinggi: number;
  lebar: number;
  keterangan: string;
  price: number;
}

export const SIZE_TABLE_DATA: Record<string, SizeTableSpec> = {
  // ── 1. SIZE BALITA (Usia 1 - 6 Tahun, Rp 100.000) ──
  'Balita XS': { category: 'balita', label: 'XS', tinggi: 36, lebar: 28, keterangan: '1 - 2 TAHUN', price: 100000 },
  'Balita S':  { category: 'balita', label: 'S',  tinggi: 40, lebar: 31, keterangan: '2 - 3 TAHUN', price: 100000 },
  'Balita M':  { category: 'balita', label: 'M',  tinggi: 43, lebar: 34, keterangan: '3 - 4 TAHUN', price: 100000 },
  'Balita L':  { category: 'balita', label: 'L',  tinggi: 45, lebar: 36, keterangan: '4 - 5 TAHUN', price: 100000 },
  'Balita XL': { category: 'balita', label: 'XL', tinggi: 47, lebar: 38, keterangan: '5 - 6 TAHUN', price: 100000 },

  // ── 2. SIZE KIDS (Usia 7 - 13 Tahun, Rp 100.000) ──
  'Kids S':  { category: 'kids', label: 'S',  tinggi: 57, lebar: 43, keterangan: '7 - 8 TAHUN', price: 100000 },
  'Kids M':  { category: 'kids', label: 'M',  tinggi: 59, lebar: 44, keterangan: '8 - 9 TAHUN', price: 100000 },
  'Kids L':  { category: 'kids', label: 'L',  tinggi: 62, lebar: 46, keterangan: '10 - 11 TAHUN', price: 100000 },
  'Kids XL': { category: 'kids', label: 'XL', tinggi: 65, lebar: 48, keterangan: '12 - 13 TAHUN', price: 100000 },

  // ── 3. SIZE DEWASA (Usia 14+ Tahun / Adult, Rp 110.000 - Rp 130.000) ──
  'XS':  { category: 'dewasa', label: 'XS',  tinggi: 65, lebar: 45, keterangan: 'Dewasa Standar', price: 110000 },
  'S':   { category: 'dewasa', label: 'S',   tinggi: 68, lebar: 48, keterangan: 'Dewasa Standar', price: 110000 },
  'M':   { category: 'dewasa', label: 'M',   tinggi: 71, lebar: 51, keterangan: 'Dewasa Standar', price: 110000 },
  'L':   { category: 'dewasa', label: 'L',   tinggi: 74, lebar: 54, keterangan: 'Dewasa Standar', price: 110000 },
  'XL':  { category: 'dewasa', label: 'XL',  tinggi: 77, lebar: 57, keterangan: 'Dewasa Standar', price: 110000 },
  'XXL': { category: 'dewasa', label: 'XXL', tinggi: 80, lebar: 62, keterangan: 'Dewasa Standar', price: 120000 },
  '3XL': { category: 'dewasa', label: '3XL', tinggi: 83, lebar: 65, keterangan: 'Dewasa Standar', price: 130000 },
};

const SIZE_CHART_CONTEXT = `
TABEL UKURAN RESMI JERSEY BADMINTON DLOB:

1. TABEL SIZE BALITA (Usia 1 - 6 Tahun, Harga Rp 100.000):
| SIZE | KETERANGAN | TINGGI | LEBAR |
| XS | 1 - 2 TAHUN | 36 cm | 28 cm |
| S | 2 - 3 TAHUN | 40 cm | 31 cm |
| M | 3 - 4 TAHUN | 43 cm | 34 cm |
| L | 4 - 5 TAHUN | 45 cm | 36 cm |
| XL | 5 - 6 TAHUN | 47 cm | 38 cm |

2. TABEL SIZE KIDS (Usia 7 - 13 Tahun, Harga Rp 100.000):
| SIZE | KETERANGAN | TINGGI | LEBAR |
| S | 7 - 8 TAHUN | 57 cm | 43 cm |
| M | 8 - 9 TAHUN | 59 cm | 44 cm |
| L | 10 - 11 TAHUN | 62 cm | 46 cm |
| XL | 12 - 13 TAHUN | 65 cm | 48 cm |

3. TABEL SIZE DEWASA (Usia 14+ Tahun / Adult, Harga Mulai Rp 110.000):
| SIZE | KETERANGAN | TINGGI | LEBAR |
| XS | Dewasa | 65 cm | 45 cm |
| S | Dewasa | 68 cm | 48 cm |
| M | Dewasa | 71 cm | 51 cm |
| L | Dewasa | 74 cm | 54 cm |
| XL | Dewasa | 77 cm | 57 cm |
| XXL | Dewasa | 80 cm | 62 cm |
| 3XL | Dewasa | 83 cm | 65 cm |
`;

// Deterministic fallback strictly based on table size specifications
function calculateStrictTableRecommendation(
  age: number,
  height: number,
  weight: number,
  fitPreference: 'slim' | 'regular' | 'loose' = 'regular'
) {
  // ── Balita (1 - 6 Tahun)
  if (age <= 6) {
    let sizeKey = 'Balita M';
    if (age <= 2 || height < 90 || weight < 13) sizeKey = 'Balita XS';
    else if (age <= 3 || height < 100 || weight < 16) sizeKey = 'Balita S';
    else if (age <= 4 || height < 110 || weight < 19) sizeKey = 'Balita M';
    else if (age <= 5 || height < 118 || weight < 23) sizeKey = 'Balita L';
    else sizeKey = 'Balita XL';

    const spec = SIZE_TABLE_DATA[sizeKey];
    return {
      recommendedCategory: 'balita',
      recommendedSize: sizeKey,
      measurements: spec,
      alternativeSize: fitPreference === 'loose' ? 'Balita XL' : 'Balita M',
      fitType: fitPreference === 'loose' ? 'Comfort / Loose Fit' : 'Standard Fit',
      reasoning: `Berdasarkan Tabel Size Balita (${spec.keterangan}), untuk usia ${age} tahun (TB ${height} cm, BB ${weight} kg), ukuran ${sizeKey} memiliki spesifikasi Tinggi ${spec.tinggi} cm & Lebar ${spec.lebar} cm yang pas untuk ruang gerak anak.`,
      tips: 'Toleransi jahitan ±2cm. Bahan Milano Standard adem dan lembut untuk kulit anak.',
    };
  }

  // ── Kids (7 - 13 Tahun)
  if (age <= 13) {
    let sizeKey = 'Kids M';
    if (age <= 8 || height < 125 || weight < 28) sizeKey = 'Kids S';
    else if (age <= 9 || height < 135 || weight < 34) sizeKey = 'Kids M';
    else if (age <= 11 || height < 145 || weight < 42) sizeKey = 'Kids L';
    else sizeKey = 'Kids XL';

    const spec = SIZE_TABLE_DATA[sizeKey];
    return {
      recommendedCategory: 'kids',
      recommendedSize: sizeKey,
      measurements: spec,
      alternativeSize: fitPreference === 'loose' ? 'Kids XL' : 'Kids L',
      fitType: fitPreference === 'loose' ? 'Comfort Fit' : 'Regular Fit',
      reasoning: `Berdasarkan Tabel Size Kids (${spec.keterangan}), untuk usia ${age} tahun (TB ${height} cm, BB ${weight} kg), ukuran ${sizeKey} dengan Tinggi ${spec.tinggi} cm & Lebar ${spec.lebar} cm sangat tepat untuk kelincahan bermain badminton.`,
      tips: 'Jika menginginkan jersey lebih longgar untuk pertumbuhan, bisa memilih 1 size di atasnya.',
    };
  }

  // ── Dewasa (Adult)
  let sizeKey = 'M';
  const bmi = weight / Math.pow(height / 100, 2);

  if (height < 158 || (weight < 50 && bmi < 19)) sizeKey = 'XS';
  else if (height < 166 && weight <= 58) sizeKey = 'S';
  else if (height < 174 && weight <= 68) sizeKey = 'M';
  else if (height < 181 && weight <= 78) sizeKey = 'L';
  else if (height < 187 && weight <= 88) sizeKey = 'XL';
  else if (weight <= 100) sizeKey = 'XXL';
  else sizeKey = '3XL';

  if (fitPreference === 'loose') {
    const adultOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    const curIdx = adultOrder.indexOf(sizeKey);
    if (curIdx !== -1 && curIdx < adultOrder.length - 1) {
      sizeKey = adultOrder[curIdx + 1];
    }
  }

  const spec = SIZE_TABLE_DATA[sizeKey] || SIZE_TABLE_DATA['M'];
  return {
    recommendedCategory: 'dewasa',
    recommendedSize: sizeKey,
    measurements: spec,
    alternativeSize: sizeKey === '3XL' ? 'XXL' : sizeKey === 'M' ? 'L' : 'M',
    fitType: fitPreference === 'loose' ? 'Comfort Fit (Longgar)' : 'Athletic Regular Fit',
    reasoning: `Berdasarkan Tabel Size Dewasa, untuk TB ${height} cm dan BB ${weight} kg, ukuran ${sizeKey} (Tinggi ${spec.tinggi} cm, Lebar ${spec.lebar} cm) memberikan proporsi dada dan panjang badan yang pas saat smash dan footwork.`,
    tips: 'Jersey berteknologi Milano Standard tidak membatasi ayunan raket dan cepat kering.',
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
      const fallback = calculateStrictTableRecommendation(age, height, weight, fitPreference);
      return NextResponse.json({ success: true, ...fallback, source: 'fallback_table_matrix' });
    }

    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 600,
          responseMimeType: 'application/json',
        },
      });

      const prompt = `
Anda adalah AI Fitting Specialist Resmi Komunitas DLOB Badminton.
Tugas Anda: WAJIB MEREKOMENDASIKAN UKURAN BERDASARKAN TABEL UKURAN RESMI DLOB DI BAWAH INI SECARA KETAT DAN AKURAT.

${SIZE_CHART_CONTEXT}

DATA PEMESAN:
- Usia: ${age} Tahun
- Tinggi Badan: ${height} cm
- Berat Badan: ${weight} kg
- Preferensi Fitting: ${fitPreference === 'loose' ? 'Lebih Longgar / Nyaman' : fitPreference === 'slim' ? 'Pas Badan / Slim Fit' : 'Standar Pas'}

ATURAN REKOMENDASI BERDASARKAN TABEL:
1. Usia 1 - 6 Tahun -> WAJIB kategori "balita" (Pilih salah satu dari: "Balita XS", "Balita S", "Balita M", "Balita L", "Balita XL" sesuai tabel).
2. Usia 7 - 13 Tahun -> WAJIB kategori "kids" (Pilih salah satu dari: "Kids S", "Kids M", "Kids L", "Kids XL" sesuai tabel).
3. Usia 14+ Tahun / Postur Dewasa -> WAJIB kategori "dewasa" (Pilih salah satu dari: "XS", "S", "M", "L", "XL", "XXL", "3XL").
4. Di bagian "reasoning", sebutkan secara EKSPLISIT dimensi ukuran tabel (Tinggi X cm dan Lebar Y cm) yang direkomendasikan dan hubungkan dengan TB/BB pemesan.

Format Output WAJIB JSON:
{
  "recommendedCategory": "dewasa" | "kids" | "balita",
  "recommendedSize": "M",
  "alternativeSize": "L",
  "fitType": "Athletic Regular Fit",
  "reasoning": "Berdasarkan Tabel Size Dewasa, untuk tinggi 172 cm dan berat 68 kg, ukuran M (Tinggi 71 cm, Lebar 51 cm) memberikan proporsi dada dan kenyamanan terbaik saat berolahraga badminton.",
  "tips": "Tips kenyamanan bahan Milano Standard..."
}
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      const sizeKey = parsed.recommendedSize || 'M';
      const spec = SIZE_TABLE_DATA[sizeKey] || calculateStrictTableRecommendation(age, height, weight, fitPreference).measurements;

      return NextResponse.json({
        success: true,
        recommendedCategory: parsed.recommendedCategory || spec.category || 'dewasa',
        recommendedSize: sizeKey,
        measurements: spec,
        alternativeSize: parsed.alternativeSize || (spec.category === 'dewasa' ? 'L' : 'Kids L'),
        fitType: parsed.fitType || 'Regular Fit',
        reasoning: parsed.reasoning || `Berdasarkan tabel ukuran, size ${sizeKey} (Tinggi ${spec.tinggi} cm, Lebar ${spec.lebar} cm) adalah ukuran paling ideal.`,
        tips: parsed.tips || 'Material Milano Standard premium yang jatuh pas di badan dan sangat menyerap keringat.',
        source: 'gemini_ai_table_grounded',
      });
    } catch (aiErr) {
      console.warn('[AI Size Recommendation] Fallback to table matrix due to Gemini issue:', aiErr);
      const fallback = calculateStrictTableRecommendation(age, height, weight, fitPreference);
      return NextResponse.json({ success: true, ...fallback, source: 'fallback_table_matrix' });
    }
  } catch (error: any) {
    console.error('[AI Size Recommendation Error]:', error);
    return NextResponse.json(
      { error: 'Gagal menganalisis rekomendasi ukuran', details: error.message },
      { status: 500 }
    );
  }
}
