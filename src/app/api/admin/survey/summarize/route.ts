import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { total, satisfactionCounts, painPoints, featureRequests, aiFeatures, nps, retentionRisk, openTexts } = await req.json();

    const prompt = `Kamu adalah analis komunitas badminton. Buat ringkasan eksekutif singkat dalam Bahasa Indonesia dari hasil survey komunitas DLOB.

DATA SURVEY:
- Total responden: ${total}
- NPS Score: ${nps !== null ? nps : 'tidak tersedia'}
- Member berisiko churn: ${retentionRisk}
- Distribusi kepuasan: ${JSON.stringify(satisfactionCounts)}
- Pain points terbanyak (nilai): ${JSON.stringify(painPoints)}
- Fitur platform diminati: ${JSON.stringify(featureRequests)}
- Fitur AI diminati: ${JSON.stringify(aiFeatures)}
- Kutipan jawaban terbuka member:
${(openTexts as string[]).map((t, i) => `  ${i + 1}. "${t}"`).join('\n')}

Tulis ringkasan dengan format 4 paragraf pendek (masing-masing 1–2 kalimat):
1. 📊 Kondisi Umum — kepuasan keseluruhan dan NPS
2. ⚠️ Masalah Utama — pain point yang paling sering dirasakan
3. 💡 Keinginan Member — fitur atau perubahan yang paling diinginkan
4. ✅ Rekomendasi Aksi — 2 langkah konkrit yang bisa diambil admin

Gunakan bahasa profesional dan ringkas. Tidak perlu pengulangan data angka yang sudah ada di dashboard.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { temperature: 0.6, maxOutputTokens: 600 },
    });
    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();

    return NextResponse.json({ summary });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[survey/summarize]', msg);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
