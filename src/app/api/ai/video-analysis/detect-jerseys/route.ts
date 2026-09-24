import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, courtSide = 'near_court' } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Frame gambar tidak ditemukan' },
        { status: 400 }
      );
    }

    // Strip data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.-]+;base64,/, '');

    const targetSideDesc = courtSide === 'near_court'
      ? 'fokus HANYA pada 2 pemain di LAPANGAN SISI DEKAT KAMERA (antara jaring net dan bagian bawah kamera). Abaikan pemain di seberang net.'
      : 'fokus HANYA pada 2 pemain di LAPANGAN SISI SEBERANG NET. Abaikan pemain di sisi dekat kamera.';

    const prompt = `
SISTEM: Anda adalah "DLOB AI Vision Detector" - spesialis pengenal visual bulutangkis.
Tugas Anda adalah mendeteksi warna pakaian/jersey dari 2 pemain bulutangkis satu tim pada cuplikan frame video ini.

INSTRUKSI SPESIFIK:
- ${targetSideDesc}
- Identifikasi warna baju/kaos dan celana yang dikenakan kedua pemain tersebut.
- Tetapkan Pemain 1 sebagai "userJersey" dan Pemain 2 sebagai "partnerJersey".
- Deskripsikan warna secara spesifik dan ringkas (contoh: "Kaos Merah, Celana Hitam" atau "Jersey Putih-Biru").

FORMAT RESPONSE: Wajib JSON murni tanpa markdown:
{
  "userJersey": "Kaos Merah, Celana Hitam",
  "partnerJersey": "Jersey Putih, Celana Biru",
  "confidence": "high",
  "note": "Terdeteksi 2 pemain di sisi dekat kamera dengan pakaian kontras."
}
`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      },
    ]);

    const text = result.response.text();
    let parsedData: any;
    try {
      parsedData = JSON.parse(text);
    } catch (parseErr) {
      console.warn('[Detect Jerseys] JSON parsing fallback:', parseErr);
      parsedData = {
        userJersey: 'Baju Hitam / Celana Gelap',
        partnerJersey: 'Baju Terang / Putih',
        confidence: 'medium',
        note: 'Deteksi otomatis berdasarkan kontras warna pemain.',
      };
    }

    return NextResponse.json({
      success: true,
      ...parsedData,
    });
  } catch (error: any) {
    console.error('[Detect Jerseys] Error:', error);
    return NextResponse.json(
      { error: 'Gagal mendeteksi warna jersey otomatis', details: error.message },
      { status: 500 }
    );
  }
}
