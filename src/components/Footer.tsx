import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-bold">
                D
              </div>
              <span className="font-bold text-lg">DLOB</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">
              Komunitas badminton terdepan dengan teknologi smart untuk mengelola kehadiran, pertandingan, dan pembayaran secara otomatis.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs">👥</span>
              <p className="text-gray-400 text-xs font-medium">50+ Anggota Aktif</p>
            </div>
          </div>

          {/* Contact Person & Follow Us */}
          <div>
            <h3 className="font-bold mb-6 text-white text-sm">Orang Kontak</h3>
            <ul className="space-y-4 text-xs text-gray-400 mb-6">
              <li>
                <div className="flex items-center gap-2 mb-1">
                  <span>☎️</span>
                  <span className="font-semibold text-white">Admin DLOB</span>
                </div>
                <a href="tel:+6281270737272" className="hover:text-blue-400 ml-6">+62 812-7073-7272</a>
              </li>
              <li>
                <div className="flex items-center gap-2 mb-1">
                  <span>💬</span>
                  <span className="font-semibold text-white">Grup WhatsApp</span>
                </div>
                <p className="text-gray-400 ml-6">Bergabunglah dengan chat komunitas kami</p>
              </li>
            </ul>
            
            <h4 className="font-bold text-white text-sm mb-4">Ikuti Kami</h4>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span>📷</span>
                <a href="https://www.instagram.com/dlob.channel/" className="hover:text-blue-400">@dlob.channel</a>
              </div>
              <div className="flex items-center gap-2">
                <span>🎵</span>
                <a href="https://www.tiktok.com/@dlobchannel" className="hover:text-blue-400">@dlobchannel</a>
              </div>
              <div className="flex items-center gap-2">
                <span>📺</span>
                <a href="https://www.youtube.com/@dlobchannel" className="hover:text-blue-400">@dlobchannel</a>
              </div>
            </div>
          </div>

          {/* Location & Schedule */}
          <div>
            <h3 className="font-bold mb-6 text-white text-sm">Lokasi & Jadwal</h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-base">📍</span>
                  <div>
                    <p className="font-semibold text-white text-xs">Venue Utama</p>
                    <p className="text-gray-400 text-xs leading-relaxed mt-1">
                      GOR Badminton Wisma Harapan<br />
                      Jl. Wisma Lantana IV No.D07-No 49<br />
                      RT.006/RW.011, Gembor<br />
                      Kec. Periuk, Kota Tangerang<br />
                      Banten 15133
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-start gap-2">
                  <span className="text-base">📅</span>
                  <div>
                    <p className="font-semibold text-white text-xs">Jadwal Rutin</p>
                    <p className="text-gray-400 text-xs mt-1">Setiap Sabtu, 20:00 - 23:00 WIB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links & Legal */}
          <div className="flex flex-col">
            <div className="mb-8">
              <h3 className="font-bold mb-4 text-white text-sm">Tautan Cepat</h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><Link href="/tentang" className="hover:text-blue-400 transition-colors">Tentang</Link></li>
                <li><Link href="/hall-of-fame" className="hover:text-blue-400 transition-colors">Hall of Fame</Link></li>
                <li><Link href="/galeri" className="hover:text-blue-400 transition-colors">Galeri</Link></li>
                <li><Link href="/store" className="hover:text-blue-400 transition-colors">Toko</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Hukum</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><Link href="/syarat-layanan" className="hover:text-blue-400 transition-colors">Syarat & Ketentuan</Link></li>
                <li><Link href="/kebijakan-privasi" className="hover:text-blue-400 transition-colors">Kebijakan Privasi</Link></li>
              </ul>
            </div>

            {/* Map Section - Compact */}
            <div className="mt-8 pt-8 border-t border-gray-800">
              <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                <span>📍</span> Peta Lokasi
              </h4>
              <div className="rounded-lg overflow-hidden h-40 w-full">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d31733.426831021552!2d106.581261!3d-6.1738!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ffa7e2cd5549%3A0x15c214ab8b458bf3!2sGOR%20Badminton%20Wisma%20Harapan!5e0!3m2!1sen!2sid!4v1769684366841!5m2!1sen!2sid"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-800 my-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
          <p>&copy; 2025 DLOB Community. Semua hak dilindungi.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/syarat-layanan" className="hover:text-blue-400 transition-colors">Syarat & Ketentuan</Link>
            <span>|</span>
            <Link href="/kebijakan-privasi" className="hover:text-blue-400 transition-colors">Kebijakan Privasi</Link>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 mt-6 flex items-center justify-center gap-2">
          <span>Didukung oleh AI & Teknologi Pintar</span>
          <span>•</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Sistem Online</span>
        </div>
      </div>
    </footer>
  );
}
