import Link from 'next/link';

export const metadata = {
  title: 'Syarat & Ketentuan | DLOB Community',
  description: 'Syarat dan ketentuan penggunaan layanan DLOB Community'
};

export default function SyaratLayananPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#3e6461] to-[#2d4a47] bg-clip-text text-transparent">
            Syarat & Ketentuan
          </h1>
          <p className="text-zinc-400 text-sm">Terakhir diperbarui: 4 Februari 2026</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">1. Penerimaan Syarat</h2>
            <p className="text-zinc-300 leading-relaxed">
              Dengan mengakses dan menggunakan platform DLOB Community ("Platform"), Anda menyetujui untuk 
              terikat dengan Syarat dan Ketentuan ini. Jika Anda tidak menyetujui syarat ini, mohon untuk 
              tidak menggunakan Platform kami.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">2. Definisi</h2>
            <ul className="space-y-2 text-zinc-300">
              <li><strong className="text-white">"Platform"</strong> mengacu pada website dan sistem DLOB Community</li>
              <li><strong className="text-white">"Pengguna"</strong> adalah setiap individu yang mengakses atau menggunakan Platform</li>
              <li><strong className="text-white">"Member"</strong> adalah pengguna terdaftar yang telah membayar biaya membership</li>
              <li><strong className="text-white">"Admin"</strong> adalah pengelola dan operator DLOB Community</li>
              <li><strong className="text-white">"Layanan"</strong> mencakup semua fitur dan fasilitas yang disediakan Platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">3. Pendaftaran dan Akun</h2>
            <div className="space-y-4 text-zinc-300">
              <div>
                <h3 className="font-semibold text-white mb-2">3.1. Persyaratan Pendaftaran</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Anda harus berusia minimal 17 tahun atau memiliki izin orang tua/wali</li>
                  <li>Informasi yang diberikan harus akurat, lengkap, dan terkini</li>
                  <li>Satu orang hanya diperbolehkan membuat satu akun</li>
                  <li>Anda bertanggung jawab atas keamanan password akun Anda</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">3.2. Keamanan Akun</h3>
                <p className="leading-relaxed">
                  Anda bertanggung jawab penuh atas semua aktivitas yang terjadi di bawah akun Anda. 
                  Segera laporkan kepada Admin jika ada indikasi penggunaan akun tanpa izin.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">4. Keanggotaan (Membership)</h2>
            <div className="space-y-4 text-zinc-300">
              <h3 className="font-semibold text-white mb-2">4.1. Jenis Membership</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong className="text-white">Member Bulanan:</strong> Rp 40.000 (4 minggu) atau Rp 45.000 (5 minggu)</li>
                <li><strong className="text-white">Non-Member:</strong> Bayar per pertandingan Rp 18.000 + biaya shuttlecock</li>
              </ul>
              <h3 className="font-semibold text-white mb-2">4.2. Benefit Member</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Bebas biaya kehadiran saat main</li>
                <li>Akses penuh ke fitur dashboard dan analitik</li>
                <li>Prioritas dalam pre-order merchandise</li>
                <li>Dapat mengikuti kompetisi internal</li>
              </ul>
              <h3 className="font-semibold text-white mb-2">4.3. Pembayaran</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Pembayaran dilakukan melalui sistem Platform</li>
                <li>Bukti pembayaran harus diupload untuk verifikasi Admin</li>
                <li>Membership aktif setelah pembayaran diverifikasi</li>
                <li>Tidak ada pengembalian uang untuk membership yang telah dibayar</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">5. Aturan Penggunaan Platform</h2>
            <div className="space-y-4 text-zinc-300">
              <p className="leading-relaxed mb-4">
                Pengguna dilarang untuk:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Menggunakan Platform untuk tujuan ilegal atau melanggar hukum</li>
                <li>Membagikan informasi palsu atau menyesatkan</li>
                <li>Mengakses akun orang lain tanpa izin</li>
                <li>Mengganggu operasional Platform atau pengguna lain</li>
                <li>Melakukan scraping, crawling, atau mengekstrak data secara otomatis</li>
                <li>Mengunggah konten yang mengandung virus atau malware</li>
                <li>Melakukan spam atau tindakan promosi tidak wajar</li>
                <li>Menyalahgunakan fitur komunikasi untuk harassment atau hate speech</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">6. Jadwal & Kehadiran</h2>
            <div className="space-y-4 text-zinc-300">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Jadwal rutin: Setiap Sabtu, pukul 20:00 - 23:00 WIB</li>
                <li>Konfirmasi kehadiran dilakukan melalui Platform</li>
                <li>Member yang tidak hadir tanpa pemberitahuan tidak mendapat kompensasi</li>
                <li>Perubahan jadwal akan diinformasikan melalui Platform dan grup WhatsApp</li>
                <li>Keterlambatan lebih dari 30 menit tanpa pemberitahuan dapat mengurangi prioritas main</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">7. Pre-Order & Store</h2>
            <div className="space-y-4 text-zinc-300">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Pre-order jersey dan merchandise dilakukan melalui Platform</li>
                <li>Pembayaran dilakukan di muka (down payment atau full payment)</li>
                <li>Estimasi waktu produksi akan diinformasikan saat pre-order</li>
                <li>Pembatalan pre-order hanya dapat dilakukan sebelum proses produksi dimulai</li>
                <li>Pengembalian dana akan diproses maksimal 14 hari kerja</li>
                <li>Barang yang sudah diterima tidak dapat ditukar/dikembalikan kecuali cacat produksi</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">8. Konten dan Hak Kekayaan Intelektual</h2>
            <div className="space-y-4 text-zinc-300">
              <h3 className="font-semibold text-white mb-2">8.1. Konten DLOB</h3>
              <p className="leading-relaxed mb-4">
                Semua konten di Platform (logo, desain, teks, gambar, video) adalah milik DLOB Community 
                dan dilindungi oleh hak cipta. Penggunaan tanpa izin dilarang.
              </p>
              <h3 className="font-semibold text-white mb-2">8.2. Konten Pengguna</h3>
              <p className="leading-relaxed">
                Dengan mengunggah konten (foto, komentar, dll), Anda memberikan DLOB hak untuk menggunakan, 
                menampilkan, dan mendistribusikan konten tersebut untuk keperluan Platform.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">9. Batasan Tanggung Jawab</h2>
            <div className="space-y-4 text-zinc-300">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Platform disediakan "sebagaimana adanya" tanpa jaminan tersurat atau tersirat</li>
                <li>DLOB tidak bertanggung jawab atas cedera atau kecelakaan saat bermain badminton</li>
                <li>Kami tidak bertanggung jawab atas kehilangan barang pribadi di venue</li>
                <li>DLOB tidak bertanggung jawab atas kerugian akibat gangguan teknis Platform</li>
                <li>Setiap member bermain atas risiko sendiri dan disarankan memiliki asuransi kesehatan</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">10. Penghentian Akun</h2>
            <div className="space-y-4 text-zinc-300">
              <p className="leading-relaxed mb-4">
                DLOB berhak untuk menangguhkan atau menghentikan akun Anda jika:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Melanggar Syarat dan Ketentuan ini</li>
                <li>Memberikan informasi palsu atau menyesatkan</li>
                <li>Melakukan tindakan yang merugikan DLOB atau member lain</li>
                <li>Tidak aktif selama lebih dari 12 bulan berturut-turut</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Anda dapat menghapus akun sendiri melalui menu Settings. Data akan dihapus sesuai 
                Kebijakan Privasi kami.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">11. Perubahan Syarat</h2>
            <p className="text-zinc-300 leading-relaxed">
              Kami berhak mengubah Syarat dan Ketentuan ini kapan saja. Perubahan signifikan akan 
              diinformasikan melalui email atau notifikasi di Platform. Penggunaan Platform setelah 
              perubahan dianggap sebagai penerimaan terhadap syarat yang diperbarui.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">12. Hukum yang Berlaku</h2>
            <p className="text-zinc-300 leading-relaxed">
              Syarat dan Ketentuan ini diatur oleh hukum Republik Indonesia. Setiap perselisihan akan 
              diselesaikan melalui musyawarah terlebih dahulu. Jika tidak tercapai kesepakatan, akan 
              diselesaikan melalui jalur hukum yang berlaku di Indonesia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">13. Hubungi Kami</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami:
            </p>
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2 text-zinc-300">
              <p><strong className="text-white">Email:</strong> info@dlob.community</p>
              <p><strong className="text-white">Telepon:</strong> +62 812-7073-7272</p>
              <p><strong className="text-white">Alamat:</strong> GOR Badminton Wisma Harapan, Jl. Wisma Lantana IV No.D07-No 49, Gembor, Kec. Periuk, Kota Tangerang, Banten 15133</p>
            </div>
          </section>

          <div className="bg-[#3e6461]/10 border border-[#3e6461]/30 rounded-lg p-4 mt-8">
            <p className="text-zinc-300 leading-relaxed text-sm">
              <strong className="text-white">Catatan Penting:</strong> Dengan mendaftar dan menggunakan Platform DLOB Community, 
              Anda mengakui telah membaca, memahami, dan menyetujui semua Syarat dan Ketentuan yang tercantum di atas.
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] hover:from-[#3e6461]/90 hover:to-[#2d4a47]/90 rounded-lg transition-all"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
