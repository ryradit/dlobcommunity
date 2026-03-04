export type QuestionType = 'text' | 'single' | 'multiple' | 'scale';

export interface Option {
  value: string;
  label: string;
  allowCustom?: boolean; // renders extra text input when selected
}

export interface Question {
  id: string;
  section: string;
  sectionLabel: string;
  type: QuestionType;
  question: string;
  subtext?: string;
  options?: Option[];
  placeholder?: string;
  required?: boolean;
  /** Only show this question if a previous question was answered with one of these values */
  conditionalOn?: {
    questionId: string;
    /** For 'single': check if answer === one of these values.
     *  For 'multiple': check if any of selected values is in this list. */
    values: string[];
  };
}

export const SURVEY_QUESTIONS: Question[] = [
  // ── Intro ────────────────────────────────────────────────────────────────
  {
    id: 'intro_name',
    section: 'intro',
    sectionLabel: 'Perkenalan',
    type: 'text',
    question: 'Halo! Selamat datang di Survey DLOB 👋\nSiapa nama kamu?',
    placeholder: 'Tulis nama kamu...',
    required: true,
  },
  {
    id: 'intro_duration',
    section: 'intro',
    sectionLabel: 'Perkenalan',
    type: 'single',
    question: 'Sudah berapa lama kamu bergabung di DLOB?',
    options: [
      { value: 'lt_1m', label: 'Kurang dari 1 bulan' },
      { value: '1_3m', label: '1 – 3 bulan' },
      { value: '3_6m', label: '3 – 6 bulan' },
      { value: '6_12m', label: '6 – 12 bulan' },
      { value: 'gt_1y', label: 'Lebih dari 1 tahun' },
    ],
  },

  // ── A: Evaluasi Umum ─────────────────────────────────────────────────────
  {
    id: 'a1_satisfaction',
    section: 'A',
    sectionLabel: 'A. Evaluasi Umum',
    type: 'single',
    question: 'Secara keseluruhan, seberapa puas kamu dengan DLOB?',
    options: [
      { value: 'sangat_puas', label: 'Sangat puas 😄' },
      { value: 'cukup_puas', label: 'Cukup puas 🙂' },
      { value: 'biasa', label: 'Biasa saja 😐' },
      { value: 'kurang_puas', label: 'Kurang puas 🙁' },
      { value: 'tidak_puas', label: 'Tidak puas 😞' },
    ],
  },
  {
    id: 'a1_dissatisfaction',
    section: 'A',
    sectionLabel: 'A. Evaluasi Umum',
    type: 'text',
    question: 'Apa yang paling membuat kamu kurang puas?',
    placeholder: 'Ceritakan jujur, semua feedback sangat berharga...',
    conditionalOn: { questionId: 'a1_satisfaction', values: ['kurang_puas', 'tidak_puas'] },
  },
  {
    id: 'a2_favorite',
    section: 'A',
    sectionLabel: 'A. Evaluasi Umum',
    type: 'multiple',
    question: 'Apa yang paling kamu suka dari DLOB?',
    subtext: 'Boleh pilih lebih dari satu',
    options: [
      { value: 'matchmaking', label: 'Matchmaking' },
      { value: 'orang_orang', label: 'Orang-orangnya' },
      { value: 'jadwal_rutin', label: 'Jadwal rutin' },
      { value: 'atmosfer', label: 'Atmosfer' },
      { value: 'admin', label: 'Adminnya' },
      { value: 'lainnya', label: 'Lainnya', allowCustom: true },
    ],
  },
  {
    id: 'a3_improvement',
    section: 'A',
    sectionLabel: 'A. Evaluasi Umum',
    type: 'text',
    question: 'Menurut kamu, apa yang paling perlu diperbaiki di DLOB?',
    placeholder: 'Tulis pendapatmu...',
  },

  // ── B: Uneg-Uneg & Pain Point ────────────────────────────────────────────
  {
    id: 'b4_pain_points',
    section: 'B',
    sectionLabel: 'B. Uneg-Uneg',
    type: 'multiple',
    question: 'Pernah merasa salah satu dari ini?',
    subtext: 'Boleh pilih lebih dari satu',
    options: [
      { value: 'level_tidak_seimbang', label: 'Level permainan tidak seimbang' },
      { value: 'kurang_jam_main', label: 'Kurang dapat jam main' },
      { value: 'rotasi_tidak_nyaman', label: 'Kurang nyaman dengan sistem rotasi' },
      { value: 'kurang_kenal', label: 'Tidak terlalu kenal member lain' },
      { value: 'tidak_pernah', label: 'Tidak pernah merasa begitu' },
    ],
  },
  {
    id: 'b4_imbalance',
    section: 'B',
    sectionLabel: 'B. Uneg-Uneg',
    type: 'single',
    question: 'Kamu lebih sering merasa terlalu kuat atau terlalu kewalahan?',
    conditionalOn: { questionId: 'b4_pain_points', values: ['level_tidak_seimbang'] },
    options: [
      { value: 'terlalu_kuat', label: 'Terlalu kuat — lawan lebih lemah' },
      { value: 'terlalu_kewalahan', label: 'Terlalu kewalahan — lawan terlalu kuat' },
      { value: 'bergantung', label: 'Bergantung situasi' },
    ],
  },
  {
    id: 'b5_hesitation',
    section: 'B',
    sectionLabel: 'B. Uneg-Uneg',
    type: 'multiple',
    question: 'Apa yang membuat kamu kadang ragu untuk ikut sesi DLOB?',
    subtext: 'Boleh pilih lebih dari satu',
    options: [
      { value: 'fee', label: 'Fee' },
      { value: 'jadwal', label: 'Jadwal tidak cocok' },
      { value: 'capek_kerja', label: 'Capek kerja' },
      { value: 'partner_tidak_cocok', label: 'Partner tidak cocok' },
      { value: 'takut_kalah', label: 'Takut kalah terus' },
      { value: 'tidak_ada_teman', label: 'Tidak ada teman dekat' },
    ],
  },
  {
    id: 'b6_change',
    section: 'B',
    sectionLabel: 'B. Uneg-Uneg',
    type: 'text',
    question: 'Kalau kamu boleh jujur, satu hal yang paling ingin kamu ubah dari DLOB apa?',
    placeholder: 'Jujur aja, ini anonim kalau kamu mau...',
  },
  {
    id: 'b6_elaborate',
    section: 'B',
    sectionLabel: 'B. Uneg-Uneg',
    type: 'text',
    question: 'Boleh ceritakan lebih detail? Situasi atau kejadian seperti apa yang pernah kamu rasakan?',
    subtext: 'Semakin detail, semakin mudah kami memahami dan memperbaikinya',
    placeholder: 'Ceritakan pengalaman konkret kamu...',
  },
  {
    id: 'b6_resolution',
    section: 'B',
    sectionLabel: 'B. Uneg-Uneg',
    type: 'text',
    question: 'Kalau DLOB bisa menangani uneg-uneg kamu itu, apa yang kamu harapkan bisa berubah atau terjadi?',
    subtext: 'Tidak ada jawaban salah — ini murni untuk evaluasi internal kami',
    placeholder: 'Misalnya: ingin ada rotasi berdasarkan level, ingin jadwal lebih fleksibel, dll.',
  },

  // ── C: Fitur Platform ────────────────────────────────────────────────────
  {
    id: 'c7_features',
    section: 'C',
    sectionLabel: 'C. Fitur Platform',
    type: 'multiple',
    question: 'Fitur apa yang ingin kamu lihat di platform DLOB?',
    subtext: 'Boleh pilih lebih dari satu',
    options: [
      { value: 'ranking', label: 'Ranking internal' },
      { value: 'statistik', label: 'Statistik pertandingan' },
      { value: 'leaderboard', label: 'Leaderboard' },
      { value: 'jadwal_otomatis', label: 'Jadwal otomatis' },
      { value: 'booking_slot', label: 'Booking slot mandiri' },
      { value: 'notifikasi_pintar', label: 'Notifikasi pintar' },
      { value: 'match_history', label: 'Match history pribadi' },
      { value: 'forum', label: 'Forum diskusi' },
      { value: 'poin_reward', label: 'Sistem poin reward' },
    ],
  },
  {
    id: 'c7_stats_detail',
    section: 'C',
    sectionLabel: 'C. Fitur Platform',
    type: 'multiple',
    question: 'Statistik apa yang ingin kamu lihat?',
    subtext: 'Boleh pilih lebih dari satu',
    conditionalOn: { questionId: 'c7_features', values: ['statistik'] },
    options: [
      { value: 'win_rate', label: 'Win rate' },
      { value: 'smash_point', label: 'Jumlah smash point' },
      { value: 'consistency', label: 'Consistency' },
      { value: 'kesalahan', label: 'Kesalahan sendiri' },
      { value: 'semua', label: 'Semua' },
    ],
  },

  // ── D: Fitur AI ──────────────────────────────────────────────────────────
  {
    id: 'd8_ai_features',
    section: 'D',
    sectionLabel: 'D. Fitur AI',
    type: 'multiple',
    question: 'Jika DLOB menggunakan AI, fitur apa yang paling menarik untuk kamu?',
    subtext: 'Boleh pilih lebih dari satu',
    options: [
      { value: 'ai_matchmaking', label: 'AI matchmaking — partner otomatis sesuai level' },
      { value: 'ai_analisa_performa', label: 'AI analisa performa' },
      { value: 'ai_rekomendasi_latihan', label: 'AI rekomendasi latihan' },
      { value: 'ai_rekomendasi_jadwal', label: 'AI rekomendasi jadwal' },
      { value: 'ai_prediksi_lawan', label: 'AI prediksi lawan seimbang' },
      { value: 'ai_coach', label: 'AI coach virtual' },
      { value: 'tidak_tertarik', label: 'Tidak tertarik fitur AI' },
    ],
  },
  {
    id: 'd8_matchmaking_detail',
    section: 'D',
    sectionLabel: 'D. Fitur AI',
    type: 'multiple',
    question: 'Kamu ingin AI mencocokkan berdasarkan apa?',
    subtext: 'Boleh pilih lebih dari satu',
    conditionalOn: { questionId: 'd8_ai_features', values: ['ai_matchmaking'] },
    options: [
      { value: 'level_skill', label: 'Level skill' },
      { value: 'gaya_bermain', label: 'Gaya bermain' },
      { value: 'tujuan', label: 'Tujuan (fun / kompetitif)' },
      { value: 'personality', label: 'Personality' },
      { value: 'semua', label: 'Semua faktor' },
    ],
  },
  {
    id: 'd9_ai_coach',
    section: 'D',
    sectionLabel: 'D. Fitur AI',
    type: 'multiple',
    question: 'Jika ada AI Coach, kamu ingin dia bisa apa?',
    subtext: 'Boleh pilih lebih dari satu',
    options: [
      { value: 'analisa_video', label: 'Analisa video permainan kamu' },
      { value: 'saran_strategi', label: 'Kasih saran strategi' },
      { value: 'analisa_pola_kalah', label: 'Analisa pola kalah kamu' },
      { value: 'program_latihan', label: 'Buatkan program latihan' },
      { value: 'evaluasi_stamina', label: 'Evaluasi stamina' },
    ],
  },
  {
    id: 'd10_engagement',
    section: 'D',
    sectionLabel: 'D. Fitur AI',
    type: 'single',
    question: 'Jika DLOB punya AI Engagement Tracker yang bisa deteksi kamu jarang main, kirim reminder personal, dan kasih rekomendasi event — apakah kamu nyaman?',
    options: [
      { value: 'sangat_nyaman', label: 'Sangat nyaman 😄' },
      { value: 'cukup_nyaman', label: 'Cukup nyaman 🙂' },
      { value: 'netral', label: 'Netral 😐' },
      { value: 'kurang_nyaman', label: 'Kurang nyaman 🙁' },
      { value: 'tidak_nyaman', label: 'Tidak nyaman 😞' },
    ],
  },
];

/** Returns the ordered list of questions to show given the current answers map */
export function getActiveQuestions(answers: Record<string, string | string[]>): Question[] {
  return SURVEY_QUESTIONS.filter(q => {
    if (!q.conditionalOn) return true;
    const { questionId, values } = q.conditionalOn;
    const ans = answers[questionId];
    if (!ans) return false;
    if (Array.isArray(ans)) return ans.some(v => values.includes(v));
    return values.includes(ans as string);
  });
}

export const SECTIONS = [
  { id: 'intro', label: 'Perkenalan', emoji: '👋' },
  { id: 'A', label: 'Evaluasi Umum', emoji: '🏸' },
  { id: 'B', label: 'Uneg-Uneg', emoji: '🔥' },
  { id: 'C', label: 'Fitur Platform', emoji: '🤖' },
  { id: 'D', label: 'Fitur AI', emoji: '🧠' },
];
