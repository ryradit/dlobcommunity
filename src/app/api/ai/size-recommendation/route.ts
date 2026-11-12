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

// Deterministic fallback strictly based on table size specifications with DLOB Downsize rule
function calculateStrictTableRecommendation(
  age: number,
  height: number,
  weight: number,
  fitPreference: 'slim' | 'regular' | 'loose' = 'regular'
) {
  // ── Balita (1 - 6 Tahun)
  if (age <= 6) {
    const balitaOrder = ['Balita XS', 'Balita S', 'Balita M', 'Balita L', 'Balita XL'];
    let usualSize = 'Balita M';
    if (age <= 2 || height < 90 || weight < 13) usualSize = 'Balita XS';
    else if (age <= 3 || height < 100 || weight < 16) usualSize = 'Balita S';
    else if (age <= 4 || height < 110 || weight < 19) usualSize = 'Balita M';
    else if (age <= 5 || height < 118 || weight < 23) usualSize = 'Balita L';
    else usualSize = 'Balita XL';

    const curIdx = balitaOrder.indexOf(usualSize);
    // Downsize 1 level unless loose preference
    const sizeKey = fitPreference === 'loose' ? usualSize : (curIdx > 0 ? balitaOrder[curIdx - 1] : usualSize);
    const spec = SIZE_TABLE_DATA[sizeKey];

    return {
      recommendedCategory: 'balita',
      recommendedSize: sizeKey,
      usualSize,
      measurements: spec,
      alternativeSize: usualSize,
      fitType: fitPreference === 'loose' ? 'Comfort / Loose Fit' : 'Athletic Fit (Downsize 1 Level)',
      reasoning: `Ukuran standar anak diperkirakan ${usualSize}. Karena cutting jersey DLOB cukup lega, disarankan turun 1 size (downsize 1 level) ke ${sizeKey} (${spec.keterangan}, Tinggi ${spec.tinggi} cm & Lebar ${spec.lebar} cm) agar pas dan nyaman.`,
      tips: 'Toleransi jahitan ±2cm. Bahan Milano Standard adem dan lembut untuk kulit anak.',
    };
  }

  // ── Kids (7 - 13 Tahun)
  if (age <= 13) {
    const kidsOrder = ['Kids S', 'Kids M', 'Kids L', 'Kids XL'];
    let usualSize = 'Kids M';
    if (age <= 8 || height < 125 || weight < 28) usualSize = 'Kids S';
    else if (age <= 9 || height < 135 || weight < 34) usualSize = 'Kids M';
    else if (age <= 11 || height < 145 || weight < 42) usualSize = 'Kids L';
    else usualSize = 'Kids XL';

    const curIdx = kidsOrder.indexOf(usualSize);
    // Downsize 1 level unless loose preference
    const sizeKey = fitPreference === 'loose' ? usualSize : (curIdx > 0 ? kidsOrder[curIdx - 1] : usualSize);
    const spec = SIZE_TABLE_DATA[sizeKey];

    return {
      recommendedCategory: 'kids',
      recommendedSize: sizeKey,
      usualSize,
      measurements: spec,
      alternativeSize: usualSize,
      fitType: fitPreference === 'loose' ? 'Comfort Fit' : 'Athletic Fit (Downsize 1 Level)',
      reasoning: `Ukuran biasa diperkirakan ${usualSize}. Karena pola jersey DLOB berpotongan atletik yang cukup longgar, disarankan turun 1 size (downsize 1 level) ke ukuran ${sizeKey} (Tinggi ${spec.tinggi} cm & Lebar ${spec.lebar} cm) agar lincah di lapangan.`,
      tips: 'Jika ingin jersey lebih longgar untuk masa pertumbuhan, bisa memilih ukuran biasa Anda.',
    };
  }

  // ── Dewasa (Adult)
  let usualSize = 'M';
  const bmi = weight / Math.pow(height / 100, 2);

  if (height < 158 || (weight < 50 && bmi < 19)) usualSize = 'XS';
  else if (height < 166 && weight <= 58) usualSize = 'S';
  else if (height < 174 && weight <= 68) usualSize = 'M';
  else if (height < 181 && weight <= 78) usualSize = 'L';
  else if (height < 187 && weight <= 88) usualSize = 'XL';
  else if (weight <= 100) usualSize = 'XXL';
  else usualSize = '3XL';

  const adultOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const curIdx = adultOrder.indexOf(usualSize);

  // DLOB Mandatory Downsize Rule: recommend down size 1 level from usual size
  let sizeKey = usualSize;
  if (fitPreference === 'loose') {
    // If loose preference, usual size is already comfortably loose
    sizeKey = usualSize;
  } else {
    // Regular / slim: down size 1 level
    sizeKey = curIdx > 0 ? adultOrder[curIdx - 1] : usualSize;
  }

  const spec = SIZE_TABLE_DATA[sizeKey] || SIZE_TABLE_DATA['M'];
  return {
    recommendedCategory: 'dewasa',
    recommendedSize: sizeKey,
    usualSize,
    measurements: spec,
    alternativeSize: usualSize,
    fitType: fitPreference === 'loose' ? 'Comfort Fit (Longgar)' : 'Athletic Fit (Downsize 1 Level)',
    reasoning: `Ukuran jersey biasa Anda diperkirakan ${usualSize}. Namun karena cutting pola jersey DLOB memiliki potongan dada dan badan yang cukup lega (oversized athletic fit), kami sangat merekomendasikan untuk turun 1 size (downsize 1 level) ke ukuran ${sizeKey} (Tinggi ${spec.tinggi} cm, Lebar ${spec.lebar} cm) agar pas proporsional saat smash dan footwork.`,
    tips: '💡 Tips DLOB Fitting: Pola jersey DLOB relatif longgar/lebar dibanding kaos biasa. Rekomendasi di atas sudah diturunkan 1 tingkat dari ukuran biasa Anda.',
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
1. Usia 1 - 6 Tahun -> Kategori "balita" (Pilih dari: "Balita XS", "Balita S", "Balita M", "Balita L", "Balita XL").
2. Usia 7 - 13 Tahun -> Kategori "kids" (Pilih dari: "Kids S", "Kids M", "Kids L", "Kids XL").
3. Usia 14+ Tahun / Dewasa -> Kategori "dewasa" (Pilih dari: "XS", "S", "M", "L", "XL", "XXL", "3XL").

ATURAN KHUSUS DLOB (DOWNSIZE 1 LEVEL):
Pola potong jersey DLOB dirancang berpotongan atletik yang cukup lega/oversized dibanding kaos harian biasa.
Oleh karena itu, sistem WAJIB MEREKOMENDASIKAN TURUN 1 UKURAN (DOWNSIZE 1 LEVEL) dari ukuran jersey/kaos biasa pemesan:
- Biasa L -> Rekomendasikan M (Turun 1 size)
- Biasa XL -> Rekomendasikan L (Turun 1 size)
- Biasa XXL -> Rekomendasikan XL (Turun 1 size)
- Biasa 3XL -> Rekomendasikan XXL (Turun 1 size)
- Biasa M -> Rekomendasikan S (Turun 1 size)
- Biasa S -> Rekomendasikan XS (Turun 1 size)
- Biasa XS -> Tetap XS (Ukuran minimum)
*CATATAN: Jika preferensi fitting pemesan adalah "Lebih Longgar / Nyaman", berikan ukuran biasanya tanpa diturunkan.

4. Di bagian "reasoning", sebutkan secara EKSPLISIT:
   - Perkiraan ukuran biasa pemesan (usualSize)
   - Ukuran rekomendasi DLOB (recommendedSize) beserta alasan downsize 1 level karena pola DLOB yang lega
   - Dimensi spesifik tabel (Tinggi X cm dan Lebar Y cm) yang direkomendasikan.

Format Output WAJIB JSON:
{
  "recommendedCategory": "dewasa" | "kids" | "balita",
  "usualSize": "L",
  "recommendedSize": "M",
  "alternativeSize": "L",
  "fitType": "Athletic Fit (Downsize 1 Level)",
  "reasoning": "Ukuran jersey biasa Anda diperkirakan L. Mengingat pola jersey DLOB berpotongan atletik yang cukup lega di dada dan badan, kami merekomendasikan untuk turun 1 size (downsize 1 level) ke ukuran M (Tinggi 71 cm, Lebar 51 cm) agar proporsional dan lincah saat bergerak di lapangan.",
  "tips": "Pola DLOB lebih lebar dibanding kaos biasa. Rekomendasi sudah disesuaikan turun 1 tingkat."
}
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      const tableBaseline = calculateStrictTableRecommendation(age, height, weight, fitPreference);
      const sizeKey = parsed.recommendedSize || tableBaseline.recommendedSize;
      const usualSize = parsed.usualSize || tableBaseline.usualSize;
      const spec = SIZE_TABLE_DATA[sizeKey] || tableBaseline.measurements;

      return NextResponse.json({
        success: true,
        recommendedCategory: parsed.recommendedCategory || spec.category || 'dewasa',
        recommendedSize: sizeKey,
        usualSize: usualSize,
        measurements: spec,
        alternativeSize: parsed.alternativeSize || usualSize || (spec.category === 'dewasa' ? 'L' : 'Kids L'),
        fitType: parsed.fitType || (sizeKey !== usualSize ? 'Athletic Fit (Downsize 1 Level)' : 'Comfort Fit'),
        reasoning: parsed.reasoning || tableBaseline.reasoning,
        tips: parsed.tips || 'Tips DLOB: Pola jersey DLOB cukup lega, rekomendasi telah disesuaikan turun 1 level dari ukuran biasa Anda.',
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
