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

export const STATIC_SURVEY_QUESTIONS: AIQuestion[] = [
  {
    id: 'q_1',
    section: 'intro',
    sectionLabel: 'Perkenalan',
    type: 'text',
    question: 'Siapa nama kamu?',
    subtext: "Kalau tidak mau kasih nama, tidak apa-apa — jawab 'Anonim' saja 👋",
    placeholder: 'Tulis nama atau nama panggilanmu...',
  },
  {
    id: 'q_2',
    section: 'intro',
    sectionLabel: 'Perkenalan',
    type: 'single',
    question: 'Sudah berapa lama kamu bergabung di komunitas DLOB?',
    options: [
      { value: 'baru', label: 'Baru (< 1 bulan)' },
      { value: '1_6_bulan', label: '1 – 6 bulan' },
      { value: '6_12_bulan', label: '6 – 12 bulan' },
      { value: '1_2_tahun', label: '1 – 2 tahun' },
      { value: 'gt_2_tahun', label: 'Lebih dari 2 tahun' },
    ],
  },
  {
    id: 'q_3',
    section: 'intro',
    sectionLabel: 'Perkenalan',
    type: 'single',
    question: 'Seberapa sering kamu bermain badminton di sesi DLOB?',
    options: [
      { value: 'setiap_minggu', label: 'Hampir setiap minggu' },
      { value: '2_3x_sebulan', label: '2 – 3x sebulan' },
      { value: '1x_sebulan', label: 'Sekali sebulan' },
      { value: 'jarang', label: 'Jarang / sesekali' },
    ],
  },
  {
    id: 'q_4',
    section: 'A',
    sectionLabel: 'A. Evaluasi Umum',
    type: 'single',
    question: 'Secara keseluruhan, seberapa puas kamu dengan komunitas DLOB?',
    options: [
      { value: '5', label: 'Sangat Puas ⭐⭐⭐⭐⭐' },
      { value: '4', label: 'Puas ⭐⭐⭐⭐' },
      { value: '3', label: 'Cukup ⭐⭐⭐' },
      { value: '2', label: 'Kurang Puas ⭐⭐' },
      { value: '1', label: 'Tidak Puas ⭐' },
    ],
  },
  {
    id: 'q_5',
    section: 'A',
    sectionLabel: 'A. Evaluasi Umum',
    type: 'multiple',
    question: 'Apa saja yang paling kamu sukai dari komunitas DLOB?',
    subtext: 'Bisa pilih lebih dari satu',
    options: [
      { value: 'jadwal_fleksibel', label: 'Jadwal sesi main fleksibel' },
      { value: 'komunitas_solid', label: 'Komunitas solid & ramah' },
      { value: 'level_beragam', label: 'Level pemain beragam' },
      { value: 'fasilitas_gor', label: 'Fasilitas GOR memadai' },
      { value: 'harga_terjangkau', label: 'Biaya iuran terjangkau' },
      { value: 'rotasi_fair', label: 'Sistem rotasi adil & tertib' },
      { value: 'teman_baru', label: 'Mudah berkenalan dengan teman baru' },
    ],
  },
  {
    id: 'q_6',
    section: 'A',
    sectionLabel: 'A. Evaluasi Umum',
    type: 'single',
    question: 'Bagaimana keseimbangan level pemain dalam satu sesi main?',
    options: [
      { value: 'selalu_seimbang', label: 'Selalu seimbang' },
      { value: 'cukup_seimbang', label: 'Cukup seimbang' },
      { value: 'kadang_tidak', label: 'Kadang tidak seimbang' },
      { value: 'sering_tidak', label: 'Sering tidak seimbang' },
      { value: 'tidak_pernah', label: 'Tidak pernah seimbang' },
    ],
  },
  {
    id: 'q_7',
    section: 'A',
    sectionLabel: 'A. Evaluasi Umum',
    type: 'single',
    question: 'Bagaimana kepuasan kamu terhadap komunikasi & informasi dari admin DLOB?',
    subtext: 'Jadwal sesi, info match, keterbukaan biaya, respons pertanyaan',
    options: [
      { value: 'sangat_memuaskan', label: 'Sangat memuaskan' },
      { value: 'memuaskan', label: 'Memuaskan' },
      { value: 'biasa_saja', label: 'Biasa saja' },
      { value: 'kurang_memuaskan', label: 'Kurang memuaskan' },
      { value: 'tidak_memuaskan', label: 'Tidak memuaskan' },
    ],
  },
  {
    id: 'q_8',
    section: 'A',
    sectionLabel: 'A. Evaluasi Umum',
    type: 'single',
    question: 'Apakah biaya/iuran sesi main DLOB sepadan dengan pengalaman yang didapat?',
    options: [
      { value: 'sangat_sepadan', label: 'Sangat sepadan' },
      { value: 'sepadan', label: 'Sepadan' },
      { value: 'lumayan', label: 'Lumayan / cukup' },
      { value: 'kurang_sepadan', label: 'Kurang sepadan' },
      { value: 'tidak_sepadan', label: 'Tidak sepadan' },
    ],
  },
  {
    id: 'q_9',
    section: 'A',
    sectionLabel: 'A. Evaluasi Umum',
    type: 'single',
    question: 'Seberapa besar kemungkinan kamu merekomendasikan DLOB ke teman/kolega?',
    options: [
      { value: 'pasti', label: 'Pasti rekomendasikan' },
      { value: 'kemungkinan_besar', label: 'Kemungkinan besar' },
      { value: 'mungkin', label: 'Mungkin iya, mungkin tidak' },
      { value: 'kemungkinan_tidak', label: 'Kemungkinan tidak' },
      { value: 'tidak_akan', label: 'Tidak akan rekomendasikan' },
    ],
  },
  {
    id: 'q_10',
    section: 'B',
    sectionLabel: 'B. Masukan & Pain Points',
    type: 'multiple',
    question: 'Apakah ada kendala / pain point yang pernah kamu rasakan selama di DLOB?',
    subtext: 'Pilih semua yang sesuai pengalamanmu',
    options: [
      { value: 'level_tidak_seimbang', label: 'Level lawan/kawan tidak seimbang' },
      { value: 'pilihan_jam_kurang', label: 'Pilihan hari/jam main kurang' },
      { value: 'rotasi_tidak_adil', label: 'Waktu tunggu & rotasi terasa kurang adil' },
      { value: 'susah_kenal_member', label: 'Merasa canggung / susah kenal member baru' },
      { value: 'info_sering_telat', label: 'Pengumuman jadwal mepet / kurang jelas' },
      { value: 'tidak_ada_masalah', label: 'Tidak ada masalah, semuanya lancar' },
    ],
  },
  {
    id: 'q_11',
    section: 'B',
    sectionLabel: 'B. Masukan & Pain Points',
    type: 'text',
    question: 'Apa satu hal yang paling ingin kamu tingkatkan atau ubah dari DLOB?',
    placeholder: 'Ceritakan bebas apa saja yang ada di pikiranmu...',
  },
  {
    id: 'q_12',
    section: 'B',
    sectionLabel: 'B. Masukan & Pain Points',
    type: 'text',
    question: 'Kalau DLOB bisa memperbaikinya dalam beberapa bulan ke depan, hasil seperti apa yang kamu harapkan?',
    placeholder: 'Contoh: pembagian level lebih teratur, jadwal main weekend pagi, dll...',
  },
  {
    id: 'q_13',
    section: 'C',
    sectionLabel: 'C. Fitur Platform',
    type: 'single',
    question: 'Dari fitur platform web DLOB, mana yang menurutmu paling bermanfaat?',
    options: [
      { value: 'leaderboard', label: 'Leaderboard & Rekap Statistik Real-time' },
      { value: 'pembayaran', label: 'Histori & Rekap Pembayaran Otomatis' },
      { value: 'ai_coaching', label: 'AI Coaching & Analitik Performa' },
      { value: 'team_optimizer', label: 'Team Optimizer (Penyusun Tim Imbang)' },
      { value: 'semua_bermanfaat', label: 'Semua fitur di atas bermanfaat' },
    ],
  },
  {
    id: 'q_14',
    section: 'D',
    sectionLabel: 'D. Masa Depan Komunitas',
    type: 'single',
    question: 'Seberapa besar kemungkinan kamu tetap aktif bermain bersama DLOB dalam 6 bulan ke depan?',
    options: [
      { value: 'pasti_aktif', label: 'Pasti tetap aktif 💪' },
      { value: 'kemungkinan_besar', label: 'Kemungkinan besar aktif' },
      { value: 'tergantung_waktu', label: 'Tergantung kesibukan / jadwal' },
      { value: 'mungkin_berhenti', label: 'Mungkin jarang / berhenti' },
    ],
  },
];

export async function POST(req: NextRequest) {
  let questionIndex = 0;
  try {
    const body = await req.json();
    const { history, questionNumber }: { history: HistoryEntry[]; questionNumber: number } = body;
    questionIndex = questionNumber || (history ? history.length : 0);

    if (questionIndex >= 20 || questionIndex >= STATIC_SURVEY_QUESTIONS.length) {
      return NextResponse.json({ done: true });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
        generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 512 },
      });

      const historyText = (!history || history.length === 0)
        ? 'Belum ada pertanyaan sebelumnya. Ini adalah pertanyaan pertama.'
        : history.map((h, i) => `Q${i + 1} [${h.section}]: ${h.question}\nJawaban: ${h.answer}`).join('\n\n');

      const prompt = `${SYSTEM_PROMPT}

RIWAYAT PERCAKAPAN (${history?.length || 0} pertanyaan sudah ditanyakan):
${historyText}

Sebelum hasilkan pertanyaan ke-${questionIndex + 1}, cek:
1. Apakah topik yang akan ditanyakan SUDAH pernah ditanyakan? Jika ya, SKIP ke topik berikutnya.
2. Apakah sisa slot (${20 - questionIndex} pertanyaan lagi) cukup untuk selesaikan semua topik wajib yang belum tercakup? Prioritaskan topik komunitas (intro/A/B) dulu, sisakan 2–3 slot terakhir untuk C/D.
3. Jangan tambah pertanyaan jika semua topik wajib sudah selesai — langsung set done: true.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.question) {
          return NextResponse.json(parsed);
        }
      }
    }

    // Seamless Fallback: Return standard question in sequence
    const fallbackQ = STATIC_SURVEY_QUESTIONS[questionIndex];
    if (fallbackQ) {
      return NextResponse.json(fallbackQ);
    }
    return NextResponse.json({ done: true });
  } catch (err: any) {
    console.error('[survey/next-question fallback triggered]:', err?.message);
    const fallbackQ = STATIC_SURVEY_QUESTIONS[questionIndex];
    if (fallbackQ) {
      return NextResponse.json(fallbackQ);
    }
    return NextResponse.json({ done: true });
  }
}
