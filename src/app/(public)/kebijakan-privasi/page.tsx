import Link from 'next/link';

export const metadata = {
  title: 'Kebijakan Privasi | DLOB Community',
  description: 'Kebijakan privasi dan perlindungan data pengguna DLOB Community'
};

export default function KebijakanPrivasiPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#3e6461] to-[#2d4a47] bg-clip-text text-transparent">
            Kebijakan Privasi
          </h1>
          <p className="text-zinc-400 text-sm">Terakhir diperbarui: 4 Februari 2026</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">1. Pendahuluan</h2>
            <p className="text-zinc-300 leading-relaxed">
              DLOB Community ("kami", "kita", atau "milik kami") berkomitmen untuk melindungi privasi Anda. 
              Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi 
              pribadi Anda saat menggunakan platform dan layanan kami.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">2. Informasi yang Kami Kumpulkan</h2>
            <div className="space-y-4 text-zinc-300">
              <div>
                <h3 className="font-semibold text-white mb-2">2.1. Informasi Pribadi</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Nama lengkap</li>
                  <li>Alamat email</li>
                  <li>Nomor telepon</li>
                  <li>Foto profil</li>
                  <li>Informasi akun (username, password terenkripsi)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">2.2. Data Aktivitas</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Riwayat kehadiran dan pertandingan</li>
                  <li>Statistik permainan (win rate, streak, performa)</li>
                  <li>Data pembayaran dan transaksi</li>
                  <li>Riwayat pre-order dan pembelian</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">2.3. Informasi Teknis</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Alamat IP</li>
                  <li>Jenis browser dan perangkat</li>
                  <li>Data log aktivitas platform</li>
                  <li>Cookies dan teknologi pelacakan serupa</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">3. Cara Kami Menggunakan Informasi</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Kami menggunakan informasi yang dikumpulkan untuk:
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-4">
              <li>Menyediakan dan mengelola layanan komunitas badminton</li>
              <li>Memproses pembayaran dan transaksi</li>
              <li>Mengelola kehadiran dan pertandingan member</li>
              <li>Mengirimkan notifikasi terkait jadwal dan kegiatan</li>
              <li>Meningkatkan kualitas layanan dan pengalaman pengguna</li>
              <li>Menganalisis statistik dan performa member</li>
              <li>Berkomunikasi dengan Anda terkait layanan kami</li>
              <li>Mematuhi kewajiban hukum</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">4. Pembagian Informasi</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Kami tidak akan menjual, menyewakan, atau membagikan informasi pribadi Anda kepada pihak ketiga, 
              kecuali dalam situasi berikut:
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-4">
              <li>Dengan persetujuan eksplisit dari Anda</li>
              <li>Kepada penyedia layanan yang membantu operasional kami (payment gateway, hosting)</li>
              <li>Ketika diwajibkan oleh hukum atau proses hukum</li>
              <li>Untuk melindungi hak, properti, atau keamanan kami dan pengguna lain</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">5. Keamanan Data</h2>
            <p className="text-zinc-300 leading-relaxed">
              Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang tepat untuk melindungi 
              informasi pribadi Anda dari akses, penggunaan, atau pengungkapan yang tidak sah. Ini termasuk:
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-4 mt-4">
              <li>Enkripsi data sensitif (password, informasi pembayaran)</li>
              <li>Akses terbatas ke informasi pribadi</li>
              <li>Pemantauan keamanan sistem secara berkala</li>
              <li>Backup data reguler</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">6. Hak Anda</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Anda memiliki hak untuk:
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-4">
              <li>Mengakses informasi pribadi Anda yang kami simpan</li>
              <li>Meminta koreksi atau pembaruan informasi yang tidak akurat</li>
              <li>Meminta penghapusan data pribadi Anda</li>
              <li>Menolak atau membatasi pemrosesan data tertentu</li>
              <li>Menarik persetujuan yang telah diberikan</li>
              <li>Mengajukan keluhan kepada otoritas perlindungan data</li>
            </ul>
            <p className="text-zinc-300 leading-relaxed mt-4">
              Untuk menggunakan hak-hak ini, hubungi kami di kontak yang tersedia di bawah.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">7. Cookies</h2>
            <p className="text-zinc-300 leading-relaxed">
              Platform kami menggunakan cookies untuk meningkatkan pengalaman pengguna, mengingat preferensi Anda, 
              dan menganalisis penggunaan platform. Anda dapat mengatur browser untuk menolak cookies, namun 
              beberapa fitur mungkin tidak berfungsi dengan baik.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">8. Penyimpanan Data</h2>
            <p className="text-zinc-300 leading-relaxed">
              Kami menyimpan informasi pribadi Anda selama akun Anda aktif atau selama diperlukan untuk 
              menyediakan layanan. Data akan dihapus atau dianonimkan setelah tidak lagi diperlukan, 
              kecuali jika kami diwajibkan untuk menyimpannya lebih lama sesuai hukum yang berlaku.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">9. Perubahan Kebijakan</h2>
            <p className="text-zinc-300 leading-relaxed">
              Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan signifikan akan 
              kami informasikan melalui email atau notifikasi di platform. Tanggal "Terakhir diperbarui" 
              di bagian atas halaman menunjukkan kapan kebijakan ini terakhir direvisi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#3e6461]">10. Hubungi Kami</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Jika Anda memiliki pertanyaan atau kekhawatiran tentang Kebijakan Privasi ini atau praktik 
              privasi kami, silakan hubungi kami:
            </p>
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2 text-zinc-300">
              <p><strong className="text-white">Email:</strong> privacy@dlob.community</p>
              <p><strong className="text-white">Telepon:</strong> +62 812-7073-7272</p>
              <p><strong className="text-white">Alamat:</strong> GOR Badminton Wisma Harapan, Jl. Wisma Lantana IV No.D07-No 49, Gembor, Kec. Periuk, Kota Tangerang, Banten 15133</p>
            </div>
          </section>
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
