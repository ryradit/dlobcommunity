const XLSX = require('xlsx');
const path = require('path');

// NEW password accounts (created via create-temp-member route)
const NEW_PASSWORD_ACCOUNTS = ['Mustofa', 'Bloro', 'Darmadi', 'Amin', 'Didi'];

// All members (from HallOfFameSection, excluding Ryan/Septian/Kevin)
const EXCLUDE = ['Ryan', 'Septian', 'Septian Dwey', 'Kevin', 'Kevin Haryono'];

const allMembers = [
  'Wahyu', 'Tian', 'Danif', 'Wiwin', 'Adit', 'Kiki', 'Zaka', 'Dimas', 'Eka',
  'Herdan', 'Hendi', 'Murdi', 'Uti', 'Aren', 'Ganex', 'Alex', 'Wien', 'Abdul',
  'Bagas', 'Arifin', 'Iyan', 'Dedi', 'Jonathan', 'Adi', 'Ardo', 'Roy', 'Edi',
  'Bibit', 'Fanis', 'Herry', 'Dinda', 'Yogie', 'Mario', 'Anthony', 'Yaya',
  'Rara', 'Dyas', 'Atna', 'Reyza', 'Gavin', 'Gilbert', 'Northon', 'Agung',
  'Wisnu', 'Ilham', 'Bayu', 'Yudha', 'Yudi', 'Daniel', 'Lorenzo', 'Anan',
  'Mustofa', 'Hasan Khanif', 'Ibenx', 'Peno', 'Bloro', 'Didi', 'Amin', 'Darmadi',
  'Adnan', 'Widi Setiawan', 'Adrian', 'Varrel', 'Daus', 'Dimas Yogi', 'Rizky Muslim', 'Yadie',
];

function toSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '.');
}

function getPassword(name) {
  return NEW_PASSWORD_ACCOUNTS.includes(name) ? 'Dlob2026!' : 'DLOB2026';
}

const filtered = allMembers.filter(n => !EXCLUDE.includes(n));

const rows = filtered.map((name, i) => ({
  'No': i + 1,
  'Nama': name,
  'Email Login': `${toSlug(name)}@temp.dlob.local`,
  'Password': getPassword(name),
  'Keterangan Akun': NEW_PASSWORD_ACCOUNTS.includes(name) ? 'Akun baru (password baru)' : 'Akun lama',
  'Catatan Penting': '⚠️ Wajib ganti email & password setelah login pertama. Verifikasi email sebelum login kembali. Isi nomor WhatsApp untuk notifikasi.',
}));

// === Build workbook ===
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(rows);

// Column widths
ws['!cols'] = [
  { wch: 5 },   // No
  { wch: 22 },  // Nama
  { wch: 32 },  // Email
  { wch: 14 },  // Password
  { wch: 25 },  // Keterangan Akun
  { wch: 75 },  // Catatan Penting
];

// Header style (xlsx lite doesn't support rich styling without xlsx-style, skip)
XLSX.utils.book_append_sheet(wb, ws, 'Akun Member DLOB');

// === Sheet 2: Password Baru ===
const newPassRows = filtered
  .filter(n => NEW_PASSWORD_ACCOUNTS.includes(n))
  .map((name, i) => ({
    'No': i + 1,
    'Nama': name,
    'Email Login': `${toSlug(name)}@temp.dlob.local`,
    'Password': 'Dlob2026!',
  }));

const ws2 = XLSX.utils.json_to_sheet(newPassRows);
ws2['!cols'] = [{ wch: 5 }, { wch: 22 }, { wch: 32 }, { wch: 14 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Password Baru');

// === Sheet 3: Petunjuk / Notes ===
const notes = [
  { '': '� Hai, selamat datang di DLOB Community!' },
  { '': '' },
  { '': '  Dokumen ini berisi info login kamu ke platform dlobcommunity.com.' },
  { '': '  Email & password di bawah ini bersifat sementara — jadi jangan lupa diganti ya!' },
  { '': '  Prosesnya gampang kok, cuma butuh 2 menit. Yuk ikutin langkah-langkahnya 👇' },
  { '': '' },
  { '': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
  { '': '🔐 LANGKAH 1 — Login dulu' },
  { '': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
  { '': '  1. Buka: https://dlobcommunity.com/login' },
  { '': '  2. Masukkan email & password kamu (cek sheet "Akun Member DLOB")' },
  { '': '  3. Klik "Masuk" — done!' },
  { '': '' },
  { '': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
  { '': '⚠️  LANGKAH 2 — Lengkapi profil (penting banget, jangan diskip!)' },
  { '': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
  { '': '  Setelah login, nanti ada banner kuning di dashboard kamu.' },
  { '': '  Klik "Lengkapi Profil Sekarang" terus isi 3 hal ini:' },
  { '': '' },
  { '': '  ✏️  a. Ganti email sementara (xxx@temp.dlob.local) ke email asli kamu' },
  { '': '  🔑  b. Bikin password baru yang lebih aman (minimal 6 karakter)' },
  { '': '  📱  c. Isi nomor WhatsApp — biar bisa dapet notif jadwal main & tagihan!' },
  { '': '' },
  { '': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
  { '': '📧 LANGKAH 3 — Verifikasi email' },
  { '': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
  { '': '  Setelah simpan, kamu akan otomatis logout — ini normal ya!' },
  { '': '  1. Cek inbox email baru kamu (lihat juga folder Spam kalau ga ketemu)' },
  { '': '  2. Klik link verifikasi dari DLOB Community' },
  { '': '  3. Kalau sudah, login lagi pakai email & password baru kamu' },
  { '': '' },
  { '': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
  { '': '📱 Soal nomor WhatsApp...' },
  { '': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
  { '': '  Isi nomor WA aktif kamu ya — ini buat:' },
  { '': '  • Notif jadwal match (biar ga ketinggalan!)' },
  { '': '  • Info tagihan bulanan' },
  { '': '  • Pengumuman dari komunitas' },
  { '': '  Format bebas: 08xxxxxxxxxx atau +628xxxxxxxxxx' },
  { '': '' },
  { '': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
  { '': '🙋 Ada masalah? Hubungi admin aja!' },
  { '': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
  { '': '  📞 +62 822-3045-0433 (WhatsApp)' },
  { '': '  🌐 https://dlobcommunity.com/kontak' },
  { '': '' },
  { '': '  ⚠️  Dokumen ini bersifat pribadi ya — tolong jangan disebarkan ke orang lain.' },
  { '': `  Dibuat: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}` },
];

const ws3 = XLSX.utils.json_to_sheet(notes, { skipHeader: true });
ws3['!cols'] = [{ wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Petunjuk');

const outPath = path.join(__dirname, 'DLOB-Member-Accounts-v3.xlsx');
XLSX.writeFile(wb, outPath);
console.log(`✅ Generated: ${outPath}`);
console.log(`   Total akun: ${rows.length}`);
console.log(`   Password lama (DLOB2026): ${rows.filter(r => r.Password === 'DLOB2026').length}`);
console.log(`   Password baru (Dlob2026!): ${rows.filter(r => r.Password === 'Dlob2026!').length}`);
