/**
 * DLOB Community — Agent Knowledge Base
 * Edit this file to update what the AI agent knows.
 * Add new sections with a header emoji + title pattern.
 */

export const DLOB_KNOWLEDGE_BASE = `
════════════════════════════════════════
PENGETAHUAN DASAR DLOB COMMUNITY
════════════════════════════════════════

🏸 TENTANG DLOB COMMUNITY
DLOB Community adalah komunitas badminton yang aktif bermain secara rutin.
Anggota bisa mengakses dashboard di https://www.dlobcommunity.com untuk melihat
tagihan, statistik pertandingan, membership, dan lainnya.

────────────────────────────────────────
💰 BIAYA PERTANDINGAN
────────────────────────────────────────
Ada 2 komponen biaya di setiap pertandingan:

1. BIAYA KOK (Shuttlecock Fee)
   - Dibagi rata antar semua pemain yang hadir di sesi tersebut
   - Jumlah bervariasi tergantung jumlah kok yang dipakai & jumlah pemain
   - Berlaku untuk SEMUA member, kecuali yang punya status VIP/Gratis

2. BIAYA HADIR (Attendance Fee)
   - Rp 18.000 per hari main (dikenakan sekali per hari, bukan per game)
   - HANYA berlaku untuk member yang TIDAK punya membership aktif bulan itu
   - Member dengan membership aktif: attendance fee = Rp 0 (gratis)
   - Member VIP/Gratis: semua biaya dibebaskan

────────────────────────────────────────
🎫 MEMBERSHIP BULANAN
────────────────────────────────────────
- Membership adalah iuran bulanan untuk anggota DLOB Community
- Harga:
    • Rp 40.000/bulan → untuk bulan yang punya 4 minggu
    • Rp 45.000/bulan → untuk bulan yang punya 5 minggu
- Keuntungan membership:
    • Attendance fee dibebaskan (Rp 0)
    • Cukup bayar biaya kok saja setiap main
- Tanpa membership: kena attendance fee Rp 18.000 per hari + biaya kok
- Masa berlaku: per bulan kalender (tidak bisa dipindah ke bulan lain)
- Pembayaran membership: tunai ke admin atau transfer, upload bukti di dashboard

────────────────────────────────────────
👑 STATUS VIP / GRATIS (Payment Exempt)
────────────────────────────────────────
- Beberapa member dipilih admin untuk mendapat pembebasan biaya penuh
- Member VIP tidak dikenakan biaya kok maupun attendance fee
- Status ini ditentukan dan diaktifkan oleh admin, tidak bisa diminta sendiri
- Jika tagihan selalu Rp 0, kemungkinan besar karena status VIP ini

────────────────────────────────────────
💳 CARA PEMBAYARAN
────────────────────────────────────────
- Via dashboard: https://www.dlobcommunity.com/dashboard/pembayaran
- Langkah: pilih tagihan → klik bayar → upload bukti transfer → tunggu konfirmasi admin
- Tunai: bayar langsung ke admin di lapangan
- Transfer bank: tanya nomor rekening ke admin
- Setelah transfer, WAJIB upload bukti di dashboard agar admin bisa konfirmasi

────────────────────────────────────────
📊 DASHBOARD MEMBER — FITUR TERSEDIA
────────────────────────────────────────
- Dashboard utama: ringkasan tagihan pending, total paid, status membership
- Pembayaran: daftar tagihan per pertandingan, status (pending/paid/rejected)
- Analitik: statistik pribadi — win rate, total match, partner terbaik, form terkini
- Training Center: video tutorial badminton dari YouTube
- Pengaturan Profil: update nama, nomor HP, foto profil, ganti password

────────────────────────────────────────
🏆 PERTANDINGAN & SISTEM SKOR
────────────────────────────────────────
- Format: double (2 vs 2)
- Skor dicatat per game dalam setiap sesi pertandingan
- Win rate dihitung dari total game yang dimenangkan dibagi total game yang dimainkan
- Setiap pertandingan dicatat: tanggal, pemain, skor, pemenang, jumlah kok
- Hasil pertandingan bisa dilihat di halaman Analitik

────────────────────────────────────────
🔔 NOTIFIKASI WHATSAPP
────────────────────────────────────────
- Setelah pertandingan disimpan admin, member mendapat notifikasi WA otomatis
- Notifikasi berisi: ringkasan tagihan, total yang harus dibayar, link pembayaran
- Reminder WA juga dikirim admin ke member yang belum bayar
- Pastikan nomor HP di profil sudah benar agar notifikasi bisa diterima

────────────────────────────────────────
❓ PERTANYAAN UMUM (FAQ)
────────────────────────────────────────
Q: Kenapa tagihan saya Rp 0?
A: Kemungkinan karena status VIP/Gratis dari admin, atau memang belum ada
   pertandingan yang dicatat bulan ini.

Q: Kenapa attendance fee saya masih ada padahal sudah bayar membership?
A: Pastikan pembayaran membership bulan ini sudah dikonfirmasi admin (status: paid).
   Jika masih bermasalah, hubungi admin.

Q: Tagihan saya terlihat tidak wajar/salah, apa yang harus dilakukan?
A: Hubungi admin langsung untuk klarifikasi. Admin bisa koreksi data pertandingan.

Q: Apakah bisa bayar tagihan bulan lalu?
A: Ya, tagihan lama tetap bisa dibayar kapan saja selama statusnya masih pending.

Q: Bagaimana cara daftar jadi member DLOB?
A: Hubungi admin DLOB via WhatsApp atau temui langsung di lapangan untuk proses
   pendaftaran dan pembuatan akun.

Q: Apa itu match code?
A: Kode unik per pertandingan yang digunakan admin untuk identifikasi sesi.

────────────────────────────────────────
🏆 LEADERBOARD DLOB (PAPAN PERINGKAT PUBLIK)
────────────────────────────────────────
URL: https://www.dlobcommunity.com/leaderboard

Leaderboard adalah halaman PUBLIK yang bisa diakses SIAPA SAJA tanpa perlu login.
Halaman ini menampilkan rekap statistik seluruh member DLOB secara real-time.

APA YANG DITAMPILKAN:
1. SPOTLIGHT CARDS (kartu ringkasan di bagian atas):
   - Total Member: jumlah seluruh member aktif di sistem
   - Pemain Terbaik: member dengan total kemenangan terbanyak
   - Paling Rajin: member dengan pertemuan/kehadiran terbanyak
   - Streak Terpanjang: member dengan rangkaian kemenangan beruntun terpanjang

2. TABEL REKAP SEMUA MEMBER (sortable/bisa diurutkan):
   - Pertemuan: jumlah sesi/hari kehadiran (BUKAN jumlah game)
     → 1 pertemuan = 1 hari main, tidak peduli berapa game dimainkan hari itu
   - Main: total pertandingan (game) yang pernah dimainkan
   - M (Menang): total kemenangan
   - K (Kalah): total kekalahan
   - Win%: persentase kemenangan (0% jika belum pernah main)
   - Avg Skor: rata-rata poin per game
   - Streak Max: rekor rangkaian kemenangan beruntun terpanjang

CARA MENGURUTKAN TABEL:
- Klik judul kolom mana saja untuk mengurutkan berdasarkan kolom itu
- Klik lagi untuk membalik urutan (dari besar ke kecil atau sebaliknya)
- Default: diurutkan berdasarkan total pertandingan terbanyak

BADGE STREAK DI NAMA MEMBER:
- 🔥 angka merah: member sedang dalam rangkaian kemenangan ≥ 3 beruntun
- ❄️ angka biru: member sedang dalam rangkaian kekalahan ≥ 3 beruntun

APAKAH DATA REAL-TIME?
- Ya! Leaderboard otomatis update saat admin menginput pertandingan baru
- Ada indikator LIVE di bagian header → titik hijau = aktif memantau
- Tidak perlu refresh manual — data berubah sendiri dalam ~1-2 detik setelah
  pertandingan baru disimpan

DISCLAIMER / CATATAN PENTING:
- Data dihitung mulai dari pertandingan PERTAMA yang tercatat di sistem
- Jika nama seseorang tidak muncul atau total main = 0, kemungkinan:
  (a) Mereka belum pernah bermain setelah sistem mulai merekam, ATAU
  (b) Mereka bermain sebelum sistem pencatatan diaktifkan
- Data hanya mencakup pertandingan yang sudah diinput admin ke sistem DLOB
- Akun test/dummy tidak ditampilkan di leaderboard

SIAPA YANG BISA AKSES:
- Semua orang, termasuk yang belum/tidak punya akun DLOB
- Cukup buka link: https://www.dlobcommunity.com/leaderboard
- Tidak perlu login

────────────────────────────────────────
❓ FAQ LEADERBOARD
────────────────────────────────────────
Q: Kenapa nama saya tidak muncul di leaderboard?
A: Kemungkinan karena kamu belum pernah bertanding sejak sistem pencatatan
   pertama kali diaktifkan, atau kamu bermain sebelum sistem mulai merekam
   data. Semua pertandingan yang diinput admin akan otomatis terekam.

Q: Kenapa total pertandingan saya 0 padahal sudah sering main?
A: Pertandingan kamu mungkin belum diinput admin ke sistem, atau nama yang
   dicatat di pertandingan berbeda dengan nama di profil akun. Hubungi admin
   untuk pengecekan.

Q: Apa bedanya "Pertemuan" dan "Main" di leaderboard?
A: Pertemuan = jumlah hari/sesi kehadiran kamu (1 hari main = 1 pertemuan,
   berapa pun banyaknya game hari itu). Main = total game/pertandingan.
   Contoh: hadir 4 kali, tiap kali main 3 game → Pertemuan: 4, Main: 12.

Q: Bagaimana cara naik peringkat di leaderboard?
A: Rajin hadir setiap sesi (naikkan Pertemuan), banyak main (naikkan Main),
   dan tingkatkan kemenangan (naikkan Win% dan Menang).

Q: Apakah leaderboard bisa diakses dari yang bukan member?
A: Ya, halaman leaderboard sepenuhnya publik. Siapa pun bisa melihatnya
   tanpa perlu daftar atau login.

Q: Badge 🔥 di nama artinya apa?
A: Artinya member tersebut sedang dalam streak kemenangan — menang 3 kali
   berturut-turut atau lebih dalam pertandingan terakhirnya. Angka di
   sebelah 🔥 menunjukkan panjang streak saat ini.

Q: Badge ❄️ di nama artinya apa?
A: Artinya member tersebut sedang dalam streak kekalahan — kalah 3 kali
   berturut-turut atau lebih dalam pertandingan terakhirnya.

Q: Seberapa cepat leaderboard update setelah admin input pertandingan baru?
A: Dalam sekitar 1-2 detik setelah pertandingan disimpan, leaderboard
   otomatis refresh untuk semua orang yang sedang membuka halaman tersebut.

────────────────────────────────────────
🎯 ALGORITMA PERHITUNGAN LEADERBOARD (TEKHNIS)
────────────────────────────────────────

BAGIAN 1: SCORING PEMAIN TERBAIK (BEST PLAYER SCORE)
────────────────────────────────────────
Leaderboard menggunakan algoritma scoring komprehensif untuk menentukan "Pemain Terbaik".
Bukan hanya berdasarkan kemenangan, tetapi kombinasi 5 metrik penting:

METRIK YANG DIUKUR:
1. Total Pertandingan (Participation & Consistency) — bobot 25%
   - Semakin banyak main = semakin konsisten dan loyal
   - Formula: (jumlah pertandingan pemain ÷ max pertandingan di sistem) × 100

2. Total Kemenangan (Win Count) — bobot 20%
   - Semakin banyak menang = semakin kuat
   - Formula: (jumlah menang pemain ÷ max kemenangan di sistem) × 100

3. Win Rate (Konsistensi Ratio) — bobot 20%
   - Persentase kemenangan dari total pertandingan
   - Formula: (menang ÷ total pertandingan) × 100
   - Range: 0-100%
   - Metrik ini TIDAK dinormalisasi terhadap max (sudah dalam bentuk persen)

4. Rata-rata Skor (Individual Contribution) — bobot 15%
   - Kontribusi poin rata-rata per game
   - Formula: (total poin ÷ jumlah pertandingan) = skor desimal
   - Dinormalisasi: (avg skor pemain ÷ max avg skor di sistem) × 100
   - Menunjukkan kemampuan individu mencetak poin

5. Longest Win Streak (Peak Performance) — bobot 10%
   - Rekor rangkaian kemenangan beruntun terpanjang sepanjang waktu
   - Formula: (longest streak pemain ÷ max longest streak di sistem) × 100
   - Menunjukkan konsistensi & momentum maksimal

RUMUS FINAL BEST PLAYER SCORE:
Score = (norm_matches × 0.25) + (norm_wins × 0.20) + (winRate × 0.20) + (norm_avgScore × 0.15) + (norm_streak × 0.10)

CONTOH PERHITUNGAN:
Anggap pemain "Ardo" dengan data:
- Total: 25 pertandingan, Max di sistem: 50 → norm_matches = (25 ÷ 50) × 100 = 50
- Menang: 17 game, Max di sistem: 30 → norm_wins = (17 ÷ 30) × 100 = 56.67
- Win rate: 17 ÷ 25 = 68% → winRate = 68 (tidak dinormalisasi)
- Avg score: 16.5 poin, Max di sistem: 21 → norm_avgScore = (16.5 ÷ 21) × 100 = 78.57
- Longest streak: 8 game, Max di sistem: 12 → norm_streak = (8 ÷ 12) × 100 = 66.67

Score = (50 × 0.25) + (56.67 × 0.20) + (68 × 0.20) + (78.57 × 0.15) + (66.67 × 0.10)
       = 12.5 + 11.33 + 13.6 + 11.79 + 6.67
       = 55.89 poin

Ardo mendapat score "Pemain Terbaik" = 55.89 (dibulatkan menjadi 55.9)

RANKING BERDASARKAN SCORE:
- Diurutkan dari Score tertinggi ke terendah
- Score tertinggi = Rank 1 (Pemain Terbaik)
- Jika 2 pemain punya score sama, urutan ditentukan oleh sistem (abjad atau ID)

────────────────────────────────────────
BAGIAN 2: HISTORY & PERUBAHAN RANKING
────────────────────────────────────────
Sistem menyimpan score history untuk tracking perubahan rank dan progress.

SCORE HISTORY:
- Disimpan di tabel score_history
- Snapshot diambil minimal 3 hari yang lalu (untuk perbandingan)
- Jika tidak ada history ≥3 hari lalu, tidak ada rankChange/scoreChange
- History otomatis dibuat saat pertandingan baru diinput

KALKULASI RANK CHANGE & SCORE CHANGE:
- Rank kemarin (previousRank) vs Rank hari ini (todayRank)
- rankChange = previousRank - todayRank
  → Positif: naik rank (lebih baik) — contoh dari rank 10 ke 8 = +2
  → Negatif: turun rank (lebih buruk) — contoh dari rank 8 ke 10 = -2
  → Nol: tidak berubah rank
- scoreChange = todayScore - yesterdayScore
  → Positif: score naik (lebih baik performa)
  → Negatif: score turun (performa menurun)

INDICATOR VISUAL:
- ⬆️ Hijau: rank naik atau score naik (improvement)
- ⬇️ Merah: rank turun atau score turun (decline)
- ➡️ Abu: tidak ada perubahan

────────────────────────────────────────
BAGIAN 3: STATUS INACTIVE (7 HARI TIDAK MAIN)
────────────────────────────────────────
Sistem otomatis menandai pemain sebagai "inactive" jika tidak main selama 7 hari.

KRITERIA INACTIVE:
- Jika lastMatchDate kosong → inactive
- Jika hari ini - lastMatchDate > 7 hari → inactive

HANDLING INACTIVE:
- Score frozen (tidak naik, tidak turun) saat inactive
- Tetap ditampilkan di leaderboard
- Badge atau visual khusus bisa diberikan (opsional)
- Saat main lagi, score dan status otomatis update

────────────────────────────────────────
BAGIAN 4: PERHITUNGAN WIN RATE & AVG SCORE
────────────────────────────────────────
Win Rate:
- Formula: (total_menang ÷ total_pertandingan) × 100
- Dibulatkan ke angka bulat (integer)
- Range: 0-100%
- Jika belum main sama sekali (total_pertandingan = 0) → win rate = 0%

Average Score:
- Formula: (total_poin_semua_game ÷ total_pertandingan)
- Dibulatkan ke 1 desimal
- Contoh: 331 poin ÷ 20 game = 16.55, dibulatkan jadi 16.6

────────────────────────────────────────
BAGIAN 5: STREAK CALCULATION (RANGKAIAN KEMENANGAN/KEKALAHAN)
────────────────────────────────────────
Sistem menghitung 2 jenis streak:

1. LONGEST WIN STREAK (Rekor terpanjang):
   - Dihitung dengan scan keseluruhan history pertandingan pemain
   - Mencari urutan kemenangan terpanjang berturut-turut
   - Disimpan sebagai best achievement sepanjang waktu
   - Contoh: WLWWWWLW → longest streak = 4 (WWWW)

2. CURRENT STREAK (Streak terkini):
   - Dihitung dengan scan dari pertandingan PALING BARU ke belakang
   - Berhenti saat hasil berbeda
   - Positif (+): rangkaian menang terkini
   - Negatif (-): rangkaian kalah terkini
   - Contoh: WLWWWWLWWW → current streak = +3 (3 menang terakhir)

ALGORITMA:
Untuk longest streak:
  - Inisialisasi: longest = 0, current = 0
  - Loop setiap game dari awal ke akhir:
    - Jika menang: current++, longest = max(longest, current)
    - Jika kalah: current = 0
  - Return longest

Untuk current streak:
  - Loop dari game terakhir ke belakang
  - Hitung berapa banyak game hasil sama dengan game terakhir
  - Return nilai positif jika menang, negatif jika kalah
  - Contoh: 3 menang berturut-turut terakhir → current streak = +3

VISUAL REPRESENTATION:
- Current streak dipajang di sebelah nama (badge)
- 🔥 Angka merah: jika current streak kemenangan ≥ 3
- ❄️ Angka biru: jika current streak kekalahan ≥ 3
- Angka itu sendiri menunjukkan panjang streak (contoh: 🔥5 = menang 5 beruntun)

────────────────────────────────────────
BAGIAN 6: PARTNERSHIP STATISTICS (STATISTIK PAIR/PASANGAN)
────────────────────────────────────────
Leaderboard menampilkan tab khusus untuk statisitik partnership (kerjasama 2 pemain).

DATA PARTNERSHIP YANG DICATAT:
1. Total Match Pair: berapa kali 2 pemain bermain bersama (sebagai partner)
2. Partnership Wins: total kemenangan saat bermain bersama
3. Partnership Losses: total kekalahan saat bermain bersama
4. Partnership Win Rate: (wins ÷ total matches) × 100
5. Combined Score: total poin yang dicetak pair tsb (gabungan kedua pemain)
6. Longest Pair Streak: rekor kemenangan beruntun terbagi sebagai pasangan

FILTERING:
- Hanya partnership dengan minimal 2 games ditampilkan
- Partnership dengan 1 game saja diabaikan (data tidak signifikan)

SORTING OPTIONS:
- Berdasarkan win rate
- Berdasarkan jumlah wins
- Berdasarkan total matches
- Berdasarkan longest streak
- Berdasarkan combined score

CONTOH:
Partnership "Ardo + Danif":
- Bermain bersama 8 kali
- Menang 6, Kalah 2
- Win rate: 75%
- Combined score: 154 poin (rata-rata 19.25 per game)
- Longest streak: 4 (4 menang berturut-turut)

────────────────────────────────────────
BAGIAN 7: COLUMN SORTING & TIEBREAKERS
────────────────────────────────────────
Leaderboard support sorting dinamis. Saat klik kolom, urutan berubah.

SORTING LOGIC:
- Ascending / Descending: bisa diflip setiap kali klik
- Tiebreaker otomatis jika nilai primary sama:

TIEBREAKER PER KOLOM:
1. Wins → Tiebreaker: Avg Score, lalu Longest Streak
2. Losses → Tiebreaker: Avg Score (ascending/lowest first)
3. Win Rate → Tiebreaker: Total Pertandingan, lalu Attendances
4. Longest Streak → Tiebreaker: Losses (lower is better, independent dari sort direction)

────────────────────────────────────────
BAGIAN 8: METRIK PERTANDINGAN
────────────────────────────────────────
Detail data yang direkam per pertandingan:

DATA PER PERTANDINGAN:
- Match ID: ID unik pertandingan
- Match Date: tanggal pertandingan
- Team 1 (Players + Score): nama pemain team 1 dan skor
- Team 2 (Players + Score): nama pemain team 2 dan skor
- Winner: team mana yang menang (team1 atau team2)
- Shuttlecock Count: berapa banyak kok yang dipakai
- Team Members: semua nama yang ikut serta

PERHITUNGAN PERTANDINGAN:
- Setiap game = 1 pertandingan (bukan 1 sesi)
- Sesi bisa terdiri dari multiple games
- Masing-masing game diinput terpisah dengan score terpisah

────────────────────────────────────────
BAGIAN 9: REAL-TIME SYNC & LIVE UPDATES
────────────────────────────────────────
Leaderboard menggunakan real-time database subscription (Supabase Realtime).

CARA KERJA:
1. Browser user subscribe ke changes di database (matches, match_members, score_history)
2. Saat admin input pertandingan baru → database update
3. Subscription di semua browser membaca perubahan
4. UI otomatis re-render dengan data terbaru dalam 1-2 detik
5. Tidak perlu refresh manual

LIVE INDICATOR:
- Titik hijau di header: menunjukkan sistem sedang aktif monitoring
- Text "LIVE": leaderboard sedang real-time
- Jika koneksi putus, status akan menunjukkan "last updated at..."

────────────────────────────────────────
BAGIAN 10: DATA INTEGRITY & NOTES
────────────────────────────────────────
PENTING:
- Semua dihitung mulai dari pertandingan PERTAMA tercatat di sistem
- Jangan ada retroactive changes tanpa notifikasi user
- Nama yang dicatat harus PERSIS sama dengan profile (case-sensitive bisa jadi issue)
- Akun test/dummy (is_test_account = true) tidak ditampilkan
- Jika admin edit pertandingan lama → leaderboard otomatis recalculate
- Score history selalu tersimpan untuk audit trail

────────────────────────────────────────
📞 KONTAK & BANTUAN
────────────────────────────────────────
- Hubungi admin DLOB via WhatsApp untuk pertanyaan pembayaran, pendaftaran,
  atau masalah akun
- Nomor admin: +62 812-7073-7272 atau +62 822-3045-0433
- Atau temui admin langsung di lapangan saat sesi berlangsung
`;

/**
 * DLOB Admin-Only Knowledge Base
 * Injected ONLY into the admin system prompt.
 * Contains operational procedures, admin tools, and internal workflows.
 */
export const DLOB_ADMIN_KNOWLEDGE_BASE = `
════════════════════════════════════════
PENGETAHUAN ADMIN DLOB COMMUNITY
════════════════════════════════════════

────────────────────────────────────────
🛠️ TOOLS YANG TERSEDIA UNTUK ADMIN
────────────────────────────────────────
- get_unpaid_summary          → Lihat semua member dengan tagihan pending, diurutkan terbesar
- get_club_stats              → Statistik bulan ini: total member aktif, jumlah match, total pendapatan
- get_revenue_summary         → Total pendapatan komunitas: bisa semua bulan (all-time), filter bulan tertentu, atau tahun tertentu. Menampilkan totalPaid, totalPending, dan breakdown per bulan
- get_member_billing_summary  → Total tagihan satu member tertentu: bisa semua bulan, atau filter bulan/tahun tertentu. Menampilkan breakdown per pertandingan (paid vs pending) dan ringkasan per bulan
- send_reminder_all_unpaid    → Kirim WA reminder ke SEMUA member yang punya tagihan pending
- send_reminder_to_member     → Kirim WA reminder ke satu member tertentu (sebut nama lengkapnya)
- get_recent_matches          → Lihat daftar pertandingan terbaru (bisa tentukan jumlahnya)
- search_youtube              → Cari video tutorial badminton

Contoh pertanyaan yang memicu get_revenue_summary:
- "Berapa total pendapatan DLOB?" → semua waktu
- "Revenue bulan Februari 2026?" → filter month=2, year=2026
- "Total pendapatan tahun 2025?" → filter year=2025
- "Berapa yang sudah dibayar dan yang belum bulan ini?" → filter bulan saat ini


- "Berapa total tagihan Ardo?" → semua bulan
- "Tagihan Budi bulan Januari 2026?" → filter bulan=1, year=2026
- "Cek tagihan Candra tahun 2025" → filter year=2025
- "Rekap pembayaran Dani dari awal" → semua bulan

────────────────────────────────────────
📋 ALUR KERJA ADMIN — PERTANDINGAN
────────────────────────────────────────
1. Admin foto hasil papan skor setelah sesi selesai
2. Upload ke halaman "Ekstrak dari Gambar" di admin panel
3. AI akan otomatis membaca skor, nama pemain, jumlah kok
4. Admin review → klik Simpan
5. Sistem otomatis:
   - Hitung biaya kok per orang (dibagi rata)
   - Hitung attendance fee (Rp 18.000 untuk non-member, Rp 0 untuk member)
   - Buat record di match_members dengan payment_status = 'pending'
   - Kirim notifikasi WA + email ke semua pemain

────────────────────────────────────────
💳 ALUR KERJA ADMIN — KONFIRMASI PEMBAYARAN
────────────────────────────────────────
1. Member transfer → upload bukti di dashboard mereka
2. Admin menerima notifikasi → masuk ke halaman Admin Pembayaran
3. Admin review bukti transfer → klik Konfirmasi atau Tolak
4. Jika dikonfirmasi: payment_status berubah jadi 'paid'
5. Jika ditolak: member mendapat notifikasi alasan penolakan

────────────────────────────────────────
👥 MANAJEMEN MEMBER
────────────────────────────────────────
- Buat akun member baru: Admin Panel → Manajemen Akun → Buat Akun
- Akun temp (sementara): bisa dibuat langsung dari halaman input pertandingan
  untuk pemain tamu/belum punya akun (email: nama@temp.dlob.local)
- Ubah status VIP/Gratis: edit profil member → toggle is_payment_exempt
- Rollback membership: batalkan membership bulan ini → member kembali kena attendance fee
- Export kredensial member: tersedia di halaman admin untuk export bulk

────────────────────────────────────────
📊 LAPORAN & KEUANGAN
────────────────────────────────────────

SUMBER PENDAPATAN KOMUNITAS:
1. Shuttlecock fee — biaya kok per pertandingan, dibagi rata semua pemain hadir
2. Attendance fee — Rp 18.000/hari untuk non-member (Rp 0 untuk member aktif & VIP)
3. Membership fee — iuran bulanan anggota (Rp 40.000 atau Rp 45.000/bulan)

CARA HITUNG REVENUE PER PERTANDINGAN:
- Total kok cost = harga kok × jumlah kok
- Biaya kok per orang = total kok cost ÷ jumlah pemain
- Attendance fee per orang = Rp 18.000 jika tidak punya membership aktif, Rp 0 jika punya
- Tagihan per orang = biaya kok + attendance fee

REVENUE CHART DI DASHBOARD:
- Grafik pendapatan dikelompokkan berdasarkan match_date (bukan paid_at)
- Hanya menghitung pembayaran dengan status "paid"
- Ditampilkan per bulan di halaman admin dashboard utama

CARA MELIHAT TOTAL PENDAPATAN:
- Dashboard admin → grafik revenue → pilih filter bulan
- Atau minta Dlob Agent: "berapa total pendapatan bulan ini?" → akan memanggil get_revenue_summary
- Data mencakup DUA sumber: (1) tagihan pertandingan (kok + attendance fee) dari match_members, (2) iuran membership dari tabel memberships
- Response akan menampilkan: matchRevenuePaid, membershipRevenuePaid, totalPaid per bulan
- totalPaid = matchRevenuePaid + membershipRevenuePaid (hanya yang sudah dibayar)
- totalPending = matchRevenuePending + membershipRevenuePending (belum dibayar)
- grandTotal = totalPaid + totalPending (semua tagihan terbuat)

LAPORAN OPEX (PENGELUARAN):
- OPEX = biaya operasional lapangan, peralatan, dll (bukan biaya kok)
- Diinput manual per bulan oleh admin di halaman Laporan Keuangan
- Profit bersih = total revenue paid - total OPEX bulan itu

EXPORT & REKAP:
- Export laporan tersedia di halaman admin untuk keperluan pembukuan
- Rekap tagihan per member bisa diminta via Dlob Agent: "tagihan [nama member]"
- Rekap bulan tertentu: "tagihan [nama] bulan [bulan] [tahun]"

CATATAN PENTING:
- Pendapatan hanya dihitung dari tagihan yang sudah PAID, bukan pending
- Jika member belum bayar → tidak masuk ke revenue bulan itu
- Membership fee dicatat terpisah di tabel memberships, bukan di match_members

────────────────────────────────────────
🔔 SISTEM NOTIFIKASI WA (FONNTE)
────────────────────────────────────────
- Provider: Fonnte (api.fonnte.com)
- Notifikasi dikirim otomatis setelah pertandingan disimpan (quickSend mode)
- Format pesan: ringkasan tagihan per member (bukan per game)
- Jika nomor HP member tidak terdaftar di profil → notifikasi WA dilewati (skip)
- Admin bisa kirim manual reminder via tools di atas
- Delay antar pengiriman massal: 300ms per member (mencegah spam block)

────────────────────────────────────────
⚙️ KONFIGURASI BIAYA
────────────────────────────────────────
- Attendance fee default: Rp 18.000 per hari (dikonfigurasi di kode)
- Membership fee: Rp 40.000 (4 minggu) / Rp 45.000 (5 minggu) — dihitung otomatis
- Shuttlecock fee: dihitung dari (harga kok × jumlah kok) ÷ jumlah pemain
- Exempt (VIP): is_payment_exempt = true di tabel profiles

────────────────────────────────────────
🔐 KEAMANAN & AKSES
────────────────────────────────────────
- Role admin: akses penuh ke semua fitur dashboard admin
- Role member: hanya akses data diri sendiri
- Auth via Supabase JWT — token diverifikasi server-side di setiap request
- Service role key hanya digunakan server-side (tidak pernah dikirim ke client)
- Admin bisa "view as member" untuk melihat dashboard dari sudut pandang member

────────────────────────────────────────
❓ FAQ ADMIN
────────────────────────────────────────
Q: Member komplain tagihan salah hitung?
A: Cek halaman Admin Pembayaran → cari pertandingan terkait → edit amount_due
   atau hapus record dan input ulang.

Q: Member tidak terima notifikasi WA?
A: Cek apakah nomor HP sudah diisi di profil member dan formatnya benar
   (08xxx atau 628xxx). Gunakan tool send_reminder_to_member untuk kirim ulang.

Q: Bagaimana cara membatalkan pembayaran yang sudah dikonfirmasi?
A: Gunakan fitur rollback di halaman Admin Pembayaran (ubah status kembali ke pending).

Q: Berapa maksimal match yang bisa diinput sekaligus?
A: Tidak ada batasan — sistem mendukung bulk create dari gambar (multi-match extraction).

Q: Member tidak bisa login?
A: Cek apakah akun aktif (is_active = true) dan email verified. Reset password
   bisa dilakukan via halaman admin atau Supabase dashboard.
`;

/**
 * DLOB Member-Only Knowledge Base
 * Injected ONLY into the member system prompt.
 * Contains personal guidance, tips, and member-facing workflows.
 */
export const DLOB_MEMBER_KNOWLEDGE_BASE = `
════════════════════════════════════════
PANDUAN KHUSUS UNTUK MEMBER DLOB
════════════════════════════════════════

────────────────────────────────────────
🛠️ TOOLS YANG TERSEDIA UNTUKMU
────────────────────────────────────────
- get_my_pending_payments    → Cek semua tagihan pertandinganmu yang belum dibayar
- get_my_match_stats         → Lihat statistik pribadi: total match, win rate, menang/kalah
- get_my_membership          → Cek status membership bulan ini (aktif/tidak)
- resend_my_payment_reminder → Kirim ulang notifikasi tagihan ke nomor WA kamu sendiri
- search_youtube             → Cari video tutorial badminton untuk latihan

────────────────────────────────────────
💳 CARA CEK & BAYAR TAGIHAN
────────────────────────────────────────
1. Minta saya cek dengan: "tagihan saya berapa?" atau "cek pending saya"
2. Atau buka langsung: https://www.dlobcommunity.com/dashboard/pembayaran
3. Transfer ke nomor rekening admin → upload bukti di halaman pembayaran
4. Status akan berubah ke "paid" setelah admin konfirmasi
5. Tagihan lama (bulan sebelumnya) tetap bisa dibayar kapan saja

────────────────────────────────────────
📊 MEMAHAMI TAGIHANMU
────────────────────────────────────────
Tagihanmu terdiri dari 2 bagian per pertandingan:
• Biaya kok (shuttlecock fee): dibagi rata semua pemain yang hadir hari itu
• Biaya hadir (attendance fee): Rp 18.000/hari — hanya jika TIDAK punya membership

Contoh: 8 pemain, pakai 6 kok @ Rp 30.000 = Rp 180.000 total
→ Biaya kok per orang = Rp 180.000 ÷ 8 = Rp 22.500
→ Jika tidak punya membership: + Rp 18.000 attendance = total Rp 40.500

Jika punya membership aktif: cukup bayar kok saja (Rp 22.500)
Jika VIP/Gratis: semua Rp 0

────────────────────────────────────────
🎫 CARA DAFTAR MEMBERSHIP
────────────────────────────────────────
1. Hubungi admin untuk konfirmasi ikut membership bulan ini
2. Bayar iuran ke admin: Rp 40.000 (4 minggu) atau Rp 45.000 (5 minggu)
3. Admin akan mengaktifkan membership di sistem
4. Setelah aktif, attendance fee otomatis Rp 0 untuk semua main bulan itu
5. Membership berlaku per bulan kalender, tidak bisa dipindah bulan

────────────────────────────────────────
🏆 MEMAHAMI STATISTIK PERTANDINGANMU
────────────────────────────────────────
- Total match: jumlah pertandingan (game) kamu tercatat di sistem
- Win rate: persentase kemenangan (wins ÷ total × 100)
- Wins / Losses: total game menang dan kalah
- Data diambil dari semua pertandingan yang pernah dicatat admin
- Statistik hanya mencakup pertandingan yang sudah diinput ke sistem DLOB

LEADERBOARD PUBLIK:
- Statistik kamu juga ditampilkan di papan peringkat publik
- URL: https://www.dlobcommunity.com/leaderboard
- Bisa dilihat siapa saja tanpa login
- Kolom yang tampil: Pertemuan (hadir), Main (total game), Menang, Kalah,
  Win%, Avg Skor, Streak Max
- Pertemuan ≠ Main → Pertemuan = jumlah hari hadir, Main = jumlah game

────────────────────────────────────────
🔔 NOTIFIKASI WHATSAPP
────────────────────────────────────────
- Kamu akan dapat WA otomatis setelah admin simpan hasil pertandingan
- Isi notifikasi: total tagihan, jumlah match, link bayar
- Jika tidak terima WA: cek apakah nomor HP sudah diupdate di Pengaturan Profil
- Bisa minta kirim ulang dengan bilang: "kirim ulang tagihan ke WA saya"
- Format nomor yang benar: 08xx atau 628xx (tanpa spasi/tanda hubung)

────────────────────────────────────────
👤 PENGATURAN PROFIL
────────────────────────────────────────
- Ganti nama tampilan: Pengaturan Profil → edit Nama Lengkap
- Update nomor HP: PENTING agar notifikasi WA bisa masuk
- Upload foto profil / avatar: tersedia di halaman Pengaturan Profil
- Ganti password: Pengaturan Profil → Ganti Password
- Nama yang digunakan di sistem harus sama persis dengan yang dicatat admin
  di setiap pertandingan agar tagihan terbaca dengan benar

────────────────────────────────────────
❓ FAQ MEMBER
────────────────────────────────────────
Q: Tagihan saya tidak muncul padahal sudah main?
A: Pertandingan mungkin belum diinput admin ke sistem. Tanya admin kapan
   data akan dimasukkan.

Q: Tagihan saya kelihatan terlalu besar, apa yang salah?
A: Bisa jadi karena nama kamu di pertandingan berbeda dengan profil akun.
   Hubungi admin untuk klarifikasi dan koreksi.

Q: Saya sudah bayar tapi status masih pending?
A: Pastikan bukti transfer sudah diupload di halaman pembayaran. Jika sudah
   upload tapi belum diproses > 1 hari, hubungi admin.

Q: Bisa tidak bayar sebagian dulu?
A: Tagihan per pertandingan harus dibayar penuh, tidak bisa partial.
   Tapi boleh bayar tagihan tertentu dan skip yang lain dulu.

Q: Saya tidak bisa akses dashboard?
A: Coba logout dan login ulang. Jika masih bermasalah, hubungi admin untuk
   reset akses.

Q: Apa bedanya Total Pending dan Total Paid di dashboard?
A: Total Pending = tagihan yang belum dibayar (perlu dibayar).
   Total Paid = total yang sudah pernah kamu bayar di sistem.
`;

