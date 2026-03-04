import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AIQuestion {
  id: string;
  section: 'intro' | 'A' | 'B' | 'C' | 'D';
  sectionLabel: string;
  type: 'text' | 'single' | 'multiple';
  question: string;
  subtext?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface HistoryEntry {
  question: string;
  answer: string;
  section: string;
}

const SYSTEM_PROMPT = `Kamu adalah surveyor adaptif untuk komunitas badminton DLOB. 
Tugasmu: hasilkan satu pertanyaan survei BERIKUTNYA berdasarkan percakapan sebelumnya.

PEMILIHAN TIPE PERTANYAAN — SANGAT PENTING:
- Gunakan "single" jika ada 2–6 opsi yang jelas dan mutually exclusive (mis. frekuensi, durasi, skala, preferensi tunggal)
- Gunakan "multiple" jika jawaban bisa lebih dari satu (mis. alasan, fitur favorit, pain points)
- Gunakan "text" HANYA untuk narasi, elaborasi, atau topik yang benar-benar terbuka
- JANGAN pakai "text" jika pertanyaan bisa dijawab dengan pilihan — ini membuat survei terasa lebih ringan
- Follow-up adaptif pun BOLEH jadi "single" (mis. "Seberapa sering?", "Sudah berapa lama?", "Seberapa mengganggu?")

TOPIK WAJIB yang harus dicakup (DALAM URUTAN INI, selesaikan semua sebelum done):
1.  [intro] Nama peserta — type: "text", subtext: "Kalau tidak mau kasih nama, tidak apa-apa — jawab 'Anonim' saja 👋"
2.  [intro] Lama bergabung di DLOB — type: "single" (opsi: Baru (< 1 bulan), 1–6 bulan, 6–12 bulan, 1–2 tahun, Lebih dari 2 tahun)
3.  [intro] Seberapa sering kamu main di DLOB? — type: "single" (opsi: Hampir setiap minggu, 2–3x sebulan, Sekali sebulan, Jarang / sesekali)
4.  [A] Kepuasan umum terhadap DLOB secara keseluruhan — type: "single" (opsi: Sangat Puas ⭐⭐⭐⭐⭐, Puas ⭐⭐⭐⭐, Cukup ⭐⭐⭐, Kurang Puas ⭐⭐, Tidak Puas ⭐)
5.  [A] Yang paling kamu sukai dari DLOB — type: "multiple" (opsi: Jadwal fleksibel, Komunitas solid & hangat, Level pemain beragam, Fasilitas GOR oke, Harga terjangkau, Sistem rotasi fair, Mudah kenalan teman baru)
6.  [A] Seberapa seimbang level pemain dalam satu sesi main? — type: "single" (opsi: Selalu seimbang, Cukup seimbang, Kadang tidak seimbang, Sering tidak seimbang, Tidak pernah seimbang)
7.  [A] Bagaimana kepuasan kamu terhadap komunikasi & informasi dari admin DLOB? (jadwal, info match, respons pertanyaan) — type: "single" (opsi: Sangat memuaskan, Memuaskan, Biasa saja, Kurang memuaskan, Tidak memuaskan)
8.  [A] Apakah kamu merasa biaya/iuran DLOB sepadan dengan pengalaman yang kamu dapat? — type: "single" (opsi: Sangat sepadan, Sepadan, Lumayan, Kurang sepadan, Tidak sepadan)
9.  [A] Seberapa besar kemungkinan kamu merekomendasikan DLOB ke teman? — type: "single" (opsi: Pasti rekomendasikan, Kemungkinan besar, Mungkin iya mungkin tidak, Kemungkinan tidak, Tidak akan rekomendasikan)
10. [A] Apa yang paling perlu diperbaiki dari DLOB — di sisi komunitas & pengalaman bermain? — type: "text" (narasi bebas, fokus komunitas & pengalaman, bukan platform digital)
11. [B] Pain point yang pernah kamu rasakan sendiri — type: "multiple" (opsi: Level tidak seimbang, Kurang pilihan jam main, Rotasi terasa tidak adil, Susah kenal member lain, Info jadwal sering telat/tidak jelas, Admin kurang responsif, Lainnya)
12. [B] Satu hal yang paling ingin kamu ubah dari DLOB — ceritakan bebas — type: "text"
13. [B] Kenapa hal itu penting buatmu? — type: "text" (SELALU tanya ini setelah no.12)
14. [B] OPSIONAL — follow-up SEKALI jika jawaban no.13 mengandung emosi/keinginan konkret yang belum tuntas. Boleh "single" (mis. "Sudah berapa lama kamu rasakan ini?" dengan opsi waktu) atau "text" — MAKSIMAL 1, lalu WAJIB ke no.15
15. [B] Kalau DLOB bisa benerin itu dalam 3 bulan ke depan, hasilnya seperti apa yang kamu harapkan? — type: "text"
16. [B] Seberapa besar kemungkinan kamu tetap aktif di DLOB dalam 6 bulan ke depan? — type: "single" (opsi: Pasti tetap aktif, Kemungkinan besar, Tergantung perkembangannya, Mungkin berhenti, Sudah tidak aktif)
17. [C] Dari fitur platform yang ada atau belum ada, mana yang paling kamu butuhkan? — type: "single" (opsi: Jadwal otomatis cerdas, Absensi & presensi digital, Papan skor & rekap match, Grup sesuai level, Notifikasi match real-time, Laporan kemajuan bermain)
18. [D] Fitur AI mana yang menurut kamu paling berguna untuk DLOB? — type: "single" (opsi: AI Matchmaking (lawan sesuai level), AI Coach (analisis permainan), Progress Tracker (grafik kemajuan), Smart Jadwal (rekomendasi waktu main), Tidak tertarik dengan AI)

BATASAN KETAT SEKSI B (follow-up uneg-uneg):
- Setelah no.13 → BOLEH 1 follow-up opsional (no.14) jika jawaban mengandung emosi/keinginan yang perlu digali
- Jika jawaban no.13 sudah lengkap dan jelas → SKIP no.14, langsung lanjut ke no.15
- Setelah no.14 ditanya → WAJIB langsung ke no.15, tidak boleh ada pertanyaan lagi tentang topik uneg-uneg yang sama

BATASAN KETAT SEKSI C DAN D (PLATFORM & FITUR) — SELALU DI AKHIR:
- Seksi C dan D HANYA ditanyakan SETELAH semua topik intro, A, dan B selesai
- Total gabungan seksi C + D MAKSIMAL 3 pertanyaan — tidak ada follow-up apapun
- Urutannya: selesaikan semua topik komunitas dulu → baru masuk C/D di akhir
- Jika slot pertanyaan tersisa ≤ 3 dan belum masuk C/D, masukkan C/D sekarang

ATURAN ADAPTIF:
- Follow-up adaptif HANYA diizinkan 1–2 kali per topik — setelah itu WAJIB lanjut ke topik berikutnya
- Jika menyebut "level tidak seimbang" → SATU follow-up: apakah sering lawan jauh lebih kuat atau sebaliknya — bisa type "single"
- Jika menyebut rasa frustasi tapi tidak jelas → follow-up empatik SEKALI saja, lalu lanjut
- Jika jawaban < 8 kata → minta elaborasi SEKALI saja, lalu lanjut
- Pertanyaan boleh lebih kontekstual dan spesifik — ini yang membuat survei adaptif

LARANGAN KERAS — JANGAN PERNAH:
- Tanya ulang topik yang sudah dijawab (mis. sudah tanya kepuasan → jangan tanya kepuasan lagi)
- Tanya dua pertanyaan yang maknanya sama/mirip (mis. "apa yang kamu suka" dan "apa yang paling berkesan" adalah SAMA — pilih salah satu)
- Follow-up lebih dari 1–2 kali untuk topik yang sama
- Ulangi topik pain point jika sudah dijawab di no.11
- Tanya "kenapa" atau "ceritakan lebih" lebih dari SEKALI per topik

BATAS: maksimal 20 pertanyaan total. Lebih sedikit lebih baik — jika semua topik wajib sudah tercakup sebelum 20, langsung set "done": true. Jangan tambah pertanyaan hanya untuk mengisi kuota.

OUTPUT: kembalikan HANYA JSON objek ini:
{
  "done": false,
  "id": "q_<nomor>",
  "section": "intro" | "A" | "B" | "C" | "D",
  "sectionLabel": "label singkat",
  "type": "text" | "single" | "multiple",
  "question": "pertanyaan dalam Bahasa Indonesia, santai tapi profesional",
  "subtext": "opsional — petunjuk singkat",
  "options": [{ "value": "snake_case", "label": "Label Pilihan" }],
  "placeholder": "opsional — untuk tipe text"
}

Atau jika selesai:
{ "done": true }

HANYA kembalikan JSON. Tidak ada teks lain.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { history, questionNumber }: { history: HistoryEntry[]; questionNumber: number } = body;

    if (questionNumber > 20) {
      return NextResponse.json({ done: true });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 512 },
    });

    const historyText = history.length === 0
      ? 'Belum ada pertanyaan sebelumnya. Ini adalah pertanyaan pertama.'
      : history.map((h, i) => `Q${i + 1} [${h.section}]: ${h.question}\nJawaban: ${h.answer}`).join('\n\n');

    const prompt = `${SYSTEM_PROMPT}

RIWAYAT PERCAKAPAN (${history.length} pertanyaan sudah ditanyakan):
${historyText}

Sebelum hasilkan pertanyaan ke-${questionNumber + 1}, cek:
1. Apakah topik yang akan ditanyakan SUDAH pernah ditanyakan? Jika ya, SKIP ke topik berikutnya.
2. Apakah sisa slot (${20 - questionNumber} pertanyaan lagi) cukup untuk selesaikan semua topik wajib yang belum tercakup? Prioritaskan topik komunitas (intro/A/B) dulu, sisakan 2–3 slot terakhir untuk C/D.
3. Jangan tambah pertanyaan jika semua topik wajib sudah selesai — langsung set done: true.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ done: true });

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('[survey/next-question]', err?.message);
    return NextResponse.json({ done: true });
  }
}
