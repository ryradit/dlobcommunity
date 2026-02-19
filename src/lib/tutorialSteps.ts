import { TutorialStep } from '@/components/TutorialOverlay';

/**
 * Tutorial steps for Admin Dashboard page
 */
export const ADMIN_DASHBOARD_TUTORIAL: TutorialStep[] = [
  {
    element: '.stat-card-members',
    title: '📊 Total Anggota',
    description: 'Jumlah total member yang terdaftar dalam sistem. Pantau pertumbuhan komunitas Anda di sini.',
    position: 'bottom',
  },
  {
    element: '.stat-card-pending-payments',
    title: '⏳ Pembayaran Menunggu',
    description: 'Jumlah pembayaran yang sudah diupload member dan menunggu verifikasi Anda. Klik untuk melihat detail.',
    position: 'bottom',
  },
  {
    element: '.revenue-chart',
    title: '📈 Revenue Growth',
    description: 'Grafik pertumbuhan pendapatan bulanan dari pembayaran pertandingan dan membership. Analisis tren pendapatan di sini.',
    position: 'top',
  },
  {
    element: '.activity-feed',
    title: '🔔 Aktivitas Sistem',
    description: 'Pantau aktivitas terbaru termasuk registrasi member, update profil, dan bukti pembayaran baru.',
    position: 'left',
  },
  {
    element: '.top-performers',
    title: '🏆 Performa Terbaik',
    description: 'Lihat member dengan streak kemenangan atau kekalahan terbanyak. Identifikasi top performers komunitas.',
    position: 'left',
  },
  {
    element: '.active-players',
    title: '👥 Pemain Paling Aktif',
    description: 'Daftar pemain yang paling sering bermain. Gunakan untuk memahami engagement member.',
    position: 'left',
  },
];

/**
 * Tutorial steps for Admin Pembayaran page
 */
export const ADMIN_PEMBAYARAN_TUTORIAL: TutorialStep[] = [
  {
    element: '.pembayaran-tab-matches',
    title: '⚽ Menu Pertandingan',
    description: 'Kelola semua data pertandingan, termasuk member yang bermain, biaya, dan bukti pembayaran.',
    position: 'bottom',
  },
  {
    element: '.pembayaran-tab-memberships',
    title: '💳 Menu Membership',
    description: 'Kelola membership bulanan member. Tambah membership baru dengan smart detection minggu otomatis.',
    position: 'bottom',
  },
  {
    element: '.pembayaran-search',
    title: '🔍 Cari Member',
    description: 'Cari member berdasarkan nama untuk melihat detail pembayaran dan riwayat transaksi mereka.',
    position: 'bottom',
  },
  {
    element: '.action-buttons',
    title: '➕ Tombol Aksi',
    description: 'Buat pertandingan baru atau tambah membership. Smart detection akan membantu menentukan jumlah minggu.',
    position: 'bottom',
  },
  {
    element: '.smart-actions-section',
    title: '⚡ Smart Actions',
    description: 'Aksi cepat satu-klik! Auto-confirm pembayaran terverifikasi, kirim reminder otomatis, atau confirm semua pending. Hemat waktu dengan automasi cerdas.',
    position: 'bottom',
  },
  {
    element: '.suggestion-cards-section',
    title: '💡 Suggestion Cards',
    description: 'AI secara proaktif memberikan saran berdasarkan data pembayaran. Dismiss yang tidak relevan, atau klik tombol aksi untuk eksekusi langsung.',
    position: 'top',
  },
  {
    element: '.payment-table',
    title: '📋 Tabel Pembayaran',
    description: 'Lihat status pembayaran, lihat bukti pembayaran, dan kelola konfirmasi pembayaran member di sini.',
    position: 'top',
  },
];

/**
 * Tutorial steps for Admin Members (Kelola Anggota) page
 */
export const ADMIN_MEMBERS_TUTORIAL: TutorialStep[] = [
  {
    element: '.stat-card-total-members',
    title: '👥 Total Anggota',
    description: 'Jumlah total member yang terdaftar dalam sistem komunitas badminton Anda.',
    position: 'bottom',
  },
  {
    element: '.stat-card-active-members',
    title: '✅ Anggota Aktif',
    description: 'Jumlah member yang aktif dan tercatat dalam bulan berjalan. Pantau engagement komunitas di sini.',
    position: 'bottom',
  },
  {
    element: '.stat-card-admin-members',
    title: '🔑 Admin',
    description: 'Jumlah admin yang memiliki akses kelola komunitas. Kelola hak akses di sini.',
    position: 'bottom',
  },
  {
    element: '.members-search',
    title: '🔍 Cari Member',
    description: 'Cari member berdasarkan nama atau email untuk melihat detail profil dan kelola status mereka.',
    position: 'bottom',
  },
  {
    element: '.members-table',
    title: '📋 Tabel Members',
    description: 'Lihat daftar lengkap semua member, status aktif, dan role. Klik untuk melihat detail atau kelola member.',
    position: 'top',
  },
];

/**
 * Tutorial steps for Admin Analitik page
 */
export const ADMIN_ANALITIK_TUTORIAL: TutorialStep[] = [
  {
    element: '.analitik-matches-list',
    title: '📊 Daftar Pertandingan',
    description: 'Lihat semua pertandingan yang telah dimainkan dengan urutan terbaru. Klik untuk melihat detail member yang bermain.',
    position: 'bottom',
  },
  {
    element: '.analitik-match-stats',
    title: '⚽ Statistik Pertandingan',
    description: 'Analisis detail untuk setiap pertandingan termasuk score, team composition, dan hasil akhir.',
    position: 'bottom',
  },
  {
    element: '.analitik-edit-scores',
    title: '✏️ Edit Score',
    description: 'Perbarui score dan hasil pertandingan jika ada kesalahan input. Klik tombol Edit untuk mengubah data.',
    position: 'top',
  },
  {
    element: '.analitik-member-selection',
    title: '👥 Pemilihan Member',
    description: 'Lihat member mana saja yang bermain di setiap pertandingan. Gunakan untuk tracking kehadiran dan partner preferences.',
    position: 'top',
  },
];

/**
 * Tutorial steps for Admin Team Optimizer page
 */
export const ADMIN_TEAM_OPTIMIZER_TUTORIAL: TutorialStep[] = [
  {
    element: '.team-optimizer-player-select',
    title: '👥 Pilih Pemain',
    description: 'Pilih pemain-pemain yang akan dioptimalkan dalam formasi tim. Filter berdasarkan ketersediaan dan skill level.',
    position: 'bottom',
  },
  {
    element: '.team-optimizer-mode-select',
    title: '⚙️ Mode Optimasi',
    description: 'Pilih strategi: Balanced (seimbang), Competitive (kompetitif), Training (latihan), atau Exciting (seru).',
    position: 'bottom',
  },
  {
    element: '.team-optimizer-teams-count',
    title: '🔢 Jumlah Tim',
    description: 'Tentukan berapa banyak tim yang ingin dibuat dari pemain yang dipilih.',
    position: 'bottom',
  },
  {
    element: '.team-optimizer-analyze-button',
    title: '🚀 Analisis Tim',
    description: 'Klik untuk memulai optimasi. AI akan menganalisis chemistry dan win probability setiap tim.',
    position: 'top',
  },
  {
    element: '.team-optimizer-results',
    title: '🏆 Hasil Optimasi',
    description: 'Lihat tim-tim yang optimal dengan matchup analysis, chemistry score, dan rekomendasi strategi.',
    position: 'top',
  },
];

/**
 * Tutorial steps for Member Dashboard page
 */
export const MEMBER_DASHBOARD_TUTORIAL: TutorialStep[] = [
  {
    element: '.member-stat-matches',
    title: '💰 Total Pending',
    description: 'Jumlah pembayaran pertandingan yang masih pending (belum lunas). Segera bayar agar tidak menunggak!',
    position: 'bottom',
  },
  {
    element: '.member-stat-membership',
    title: '✅ Total Paid',
    description: 'Total pembayaran pertandingan yang sudah lunas. Ini adalah total yang sudah Anda bayarkan.',
    position: 'bottom',
  },
  {
    element: '.member-stat-winrate',
    title: '🏅 Status Membership',
    description: 'Status membership bulanan Anda. Active jika sudah lunas, Inactive jika belum bayar.',
    position: 'bottom',
  },
  {
    element: '.member-recent-matches',
    title: '📋 Pertandingan Terakhir',
    description: 'Daftar pertandingan terbaru yang Anda ikuti beserta status pembayarannya.',
    position: 'top',
  },
];

/**
 * Tutorial steps for Member Analitik page
 */
export const MEMBER_ANALITIK_TUTORIAL: TutorialStep[] = [
  {
    element: '.member-analitik-stats',
    title: '📊 Statistik Keseluruhan',
    description: 'Lihat ringkasan performa Anda: total pertandingan, win rate, dan streak terbaik.',
    position: 'bottom',
  },
  {
    element: '.member-analitik-charts',
    title: '📈 Grafik Performa',
    description: 'Visualisasi performa Anda dalam bentuk grafik. Lihat tren kemenangan dan kekalahan.',
    position: 'bottom',
  },
  {
    element: '.member-analitik-partners',
    title: '👥 Partner Terbaik',
    description: 'Lihat statistik bermain dengan berbagai partner. Temukan partner dengan chemistry terbaik!',
    position: 'top',
  },
  {
    element: '.member-analitik-opponents',
    title: '⚔️ Statistik Lawan',
    description: 'Analisis performa melawan lawan-lawan tertentu. Cari tahu kekuatan dan kelemahan Anda.',
    position: 'top',
  },
  {
    element: '.member-analitik-filter',
    title: '🔍 Filter Pertandingan',
    description: 'Filter pertandingan berdasarkan tanggal atau partner. Klik "Tampilkan" untuk membuka opsi filter.',
    position: 'top',
  },
  {
    element: '.member-analitik-match-history',
    title: '📋 Riwayat Pertandingan',
    description: 'Lihat detail setiap pertandingan: lawan, partner, score, dan hasil. Scroll untuk melihat lebih banyak.',
    position: 'top',
  },
  {
    element: '.member-analitik-ai-insights',
    title: '🤖 AI Insights',
    description: 'Klik tombol ini untuk mendapatkan rekomendasi dan insight berbasis AI. Analisis performa Anda secara otomatis!',
    position: 'left',
  },
];

/**
 * Tutorial steps for Member Pembayaran page
 */
export const MEMBER_PEMBAYARAN_TUTORIAL: TutorialStep[] = [
  {
    element: '.member-payment-stats',
    title: '💰 Ringkasan Pembayaran',
    description: 'Total tagihan dan status pembayaran untuk pertandingan dan membership bulan ini.',
    position: 'bottom',
  },
  {
    element: '.member-payment-matches',
    title: '⚽ Pembayaran Pertandingan',
    description: 'Daftar pembayaran untuk setiap pertandingan yang Anda ikuti. Lihat status dan jumlah tagihan di sini.',
    position: 'bottom',
  },
  {
    element: '.member-payment-membership',
    title: '🏅 Pembayaran Membership',
    description: 'Status pembayaran membership bulanan Anda. Pastikan membership selalu aktif!',
    position: 'bottom',
  },
  {
    element: '.member-payment-actions',
    title: '🎯 Tombol Aksi & Status',
    description: 'Klik "Bayar" untuk upload bukti pembayaran. Status akan berubah setelah admin verifikasi.',
    position: 'top',
  },
  {
    element: '.member-payment-ai-helper',
    title: '✨ AI Helper',
    description: 'Tanyakan apa saja tentang pembayaran ke AI. Bisa cek tagihan, cara bayar, hingga status pembayaran!',
    position: 'bottom',
  },
  {
    element: '.member-payment-status-help',
    title: 'ℹ️ Panduan Pembayaran',
    description: 'Lihat panduan lengkap cara pembayaran, rekening tujuan, dan penjelasan status pembayaran.',
    position: 'bottom',
  },
];

/**
 * Tutorial steps for Member Settings page
 */
export const MEMBER_SETTINGS_TUTORIAL: TutorialStep[] = [
  {
    element: '.member-settings-avatar',
    title: '📸 Foto Profil',
    description: 'Upload atau ubah foto profil Anda. Klik pada foto untuk mengganti gambar.',
    position: 'bottom',
  },
  {
    element: '.member-settings-personal',
    title: '👤 Info Personal',
    description: 'Edit nama lengkap dan nomor telepon Anda. Pastikan data selalu terupdate!',
    position: 'right',
  },
  {
    element: '.member-settings-badminton',
    title: '🏸 Profil Badminton',
    description: 'Atur level bermain, tangan dominan, dan pengalaman bermain Anda.',
    position: 'right',
  },
  {
    element: '.member-settings-achievements',
    title: '🏆 Prestasi',
    description: 'Tambahkan prestasi badminton Anda: turnamen, tahun, dan peringkat yang diraih.',
    position: 'right',
  },
  {
    element: '.member-settings-partner',
    title: '🤝 Preferensi Partner',
    description: 'Tulis preferensi partner bermain Anda dan tambahkan link Instagram untuk koneksi.',
    position: 'right',
  },
];

/**
 * Tutorial steps for Member Training Center page
 */
export const MEMBER_TRAINING_TUTORIAL: TutorialStep[] = [
  {
    element: '.training-search-bar',
    title: '🔍 Tanya Pelatih AI',
    description: 'Ketik pertanyaan tentang teknik badminton Anda. Contoh: "Bagaimana cara meningkatkan smash?" AI akan memberikan saran personalisasi!',
    position: 'bottom',
  },
  {
    element: '.training-popular-topics',
    title: '⚡ Topik Populer',
    description: 'Klik shortcut topik untuk langsung mendapatkan rekomendasi latihan. Hemat waktu dengan topik yang sering dicari!',
    position: 'bottom',
  },
  {
    element: '.training-tips',
    title: '💡 Tips Bertanya',
    description: 'Panduan untuk mendapatkan saran terbaik dari AI. Jelaskan masalah spesifik dan level skill Anda untuk hasil optimal.',
    position: 'left',
  },
  {
    element: '.training-history',
    title: '📚 Riwayat Latihan',
    description: 'Akses kembali sesi latihan sebelumnya. Klik untuk melihat saran dan video lagi. Hover untuk menghapus riwayat.',
    position: 'left',
  },
  {
    element: '.training-main-content',
    title: '🤖 Area Hasil',
    description: 'Setelah bertanya, area ini akan menampilkan saran pelatih AI dan video tutorial YouTube yang relevan dalam bahasa Indonesia!',
    position: 'top',
  },
];

/**
 * Tutorial steps for Admin Artikel Generator page
 */
export const ADMIN_ARTIKEL_TUTORIAL: TutorialStep[] = [
  {
    element: '.artikel-prompt-input',
    title: '✍️ Input Prompt Artikel',
    description: 'Masukkan topik atau prompt artikel yang ingin Anda buat. Contoh: "Tips meningkatkan stamina untuk pemain badminton remaja" atau "Panduan nutrisi untuk atlet bulutangkis".',
    position: 'bottom',
  },
  {
    element: '.artikel-generate-button',
    title: '🚀 Generate Artikel',
    description: 'Klik untuk memulai pembuatan artikel dengan AI. Proses ini menggunakan split API untuk menghindari timeout: 1) Generate struktur teks (~30 detik), 2) Generate gambar AI (~2 menit per gambar).',
    position: 'bottom',
  },
  {
    element: '.artikel-progress-tracker',
    title: '📊 Progress Tracker',
    description: 'Monitor real-time progress pembuatan artikel. Lihat step counter, progress bar, dan countdown cooldown untuk setiap gambar AI yang dihasilkan.',
    position: 'top',
  },
  {
    element: '.artikel-preview',
    title: '👁️ Preview Artikel',
    description: 'Setelah selesai, lihat preview lengkap artikel dengan hero image, konten terstruktur, dan gambar AI. Review sebelum publikasi!',
    position: 'top',
  },
  {
    element: '.artikel-publish-button',
    title: '📤 Publikasikan',
    description: 'Upload artikel ke Supabase Storage untuk gambar, simpan struktur ke database, dan artikel langsung live di halaman publik!',
    position: 'top',
  },
  {
    element: '.artikel-list',
    title: '📚 Daftar Artikel',
    description: 'Lihat semua artikel yang sudah dibuat. Status: Published (hijau), Draft (kuning). Klik Preview untuk melihat, atau Delete untuk menghapus.',
    position: 'left',
  },
  {
    element: '.artikel-tips',
    title: '💡 Tips AI Generator',
    description: 'Image categorization: Artikel nutrisi → food photography, Artikel latihan → atlet DLOB jersey. Training/stamina/teknik HARUS menampilkan atlet, bukan makanan!',
    position: 'left',
  },
];

/**
 * Get tutorial for a specific page
 */
export function getTutorialSteps(page: 'dashboard' | 'pembayaran' | 'members' | 'analitik' | 'team-optimizer' | 'artikel' | 'member-dashboard' | 'member-analitik' | 'member-pembayaran' | 'member-settings' | 'member-training'): TutorialStep[] {
  switch (page) {
    case 'dashboard':
      return ADMIN_DASHBOARD_TUTORIAL;
    case 'pembayaran':
      return ADMIN_PEMBAYARAN_TUTORIAL;
    case 'artikel':
      return ADMIN_ARTIKEL_TUTORIAL;
    case 'members':
      return ADMIN_MEMBERS_TUTORIAL;
    case 'analitik':
      return ADMIN_ANALITIK_TUTORIAL;
    case 'team-optimizer':
      return ADMIN_TEAM_OPTIMIZER_TUTORIAL;
    case 'member-dashboard':
      return MEMBER_DASHBOARD_TUTORIAL;
    case 'member-analitik':
      return MEMBER_ANALITIK_TUTORIAL;
    case 'member-pembayaran':
      return MEMBER_PEMBAYARAN_TUTORIAL;
    case 'member-settings':
      return MEMBER_SETTINGS_TUTORIAL;
    case 'member-training':
      return MEMBER_TRAINING_TUTORIAL;
    default:
      return [];
  }
}

/**
 * Check if tutorial has been shown for a page
 */
export function hasTutorialBeenShown(page: string): boolean {
  if (typeof window === 'undefined') return false;
  return !!(localStorage.getItem(`tutorial_${page}`) || localStorage.getItem(`tutorial_skip_${page}`));
}

/**
 * Get count of incomplete tutorials
 */
export function getIncompletetutorialsCount(): number {
  if (typeof window === 'undefined') return 0;
  
  const pages = ['admin-dashboard', 'admin-pembayaran'];
  return pages.filter(page => !hasTutorialBeenShown(page)).length;
}
