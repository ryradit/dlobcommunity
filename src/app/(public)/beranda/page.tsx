import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
import GallerySection from '@/components/GallerySection';
import FeaturesSection from '@/components/FeaturesSection';

export default function BerandaPage() {
  const stats = [
    { number: '50+', label: 'Anggota Aktif' },
    { number: '100+', label: 'Pertandingan' },
    { number: '5+', label: 'Tahun' },
    { label: 'Insights AI Bertenaga' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section - About Apps */}
      <FeaturesSection />

      {/* Gallery Section */}
      <GallerySection />

      {/* Artikel Section */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white py-24 overflow-hidden">
        {/* Decorative badminton elements */}
        <div className="absolute top-0 right-10 text-9xl opacity-5 rotate-45">🏸</div>
        <div className="absolute bottom-20 left-5 text-8xl opacity-5 -rotate-12">🎯</div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-[#3e6461]/15 text-[#3e6461] rounded-full text-sm font-semibold">📚 Blog & Tips</span>
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">Artikel Terbaru</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Baca tips, teknik, dan berita terkini seputar badminton dari komunitas DLOB kami
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Article Card 1 */}
            <Link href="/artikel">
              <div className="group relative h-full cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
                <div className="relative bg-white rounded-3xl p-8 h-full flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  {/* Icon with background */}
                  <div className="w-16 h-16 bg-gradient-to-br from-[#3e6461]/20 to-[#3e6461]/10 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    📖
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#3e6461] transition-colors">Teknik Dasar Badminton</h3>
                  <p className="text-gray-600 text-sm mb-6 flex-grow">Pelajari teknik dasar yang perlu dikuasai setiap pemain badminton pemula dan tingkatkan kemampuan Anda</p>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[#3e6461] font-semibold text-sm">Baca selengkapnya</span>
                    <span className="text-[#3e6461] group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Article Card 2 */}
            <Link href="/artikel">
              <div className="group relative h-full cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
                <div className="relative bg-white rounded-3xl p-8 h-full flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  {/* Icon with background */}
                  <div className="w-16 h-16 bg-gradient-to-br from-[#3e6461]/20 to-[#3e6461]/10 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    💪
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#3e6461] transition-colors">Latihan Kondisi Fisik</h3>
                  <p className="text-gray-600 text-sm mb-6 flex-grow">Program latihan intensif untuk meningkatkan stamina, kekuatan, dan kelincahan dalam bermain badminton profesional</p>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[#3e6461] font-semibold text-sm">Baca selengkapnya</span>
                    <span className="text-[#3e6461] group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Article Card 3 */}
            <Link href="/artikel">
              <div className="group relative h-full cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
                <div className="relative bg-white rounded-3xl p-8 h-full flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  {/* Icon with background */}
                  <div className="w-16 h-16 bg-gradient-to-br from-[#3e6461]/20 to-[#3e6461]/10 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    🏆
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#3e6461] transition-colors">Strategi Bermain</h3>
                  <p className="text-gray-600 text-sm mb-6 flex-grow">Strategi dan taktik canggih untuk memenangkan pertandingan badminton dengan efektif dan penuh perhitungan</p>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[#3e6461] font-semibold text-sm">Baca selengkapnya</span>
                    <span className="text-[#3e6461] group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="text-center">
            <Link href="/artikel">
              <button className="px-10 py-4 bg-[#1e4843] text-white font-bold rounded-full hover:shadow-xl transition-all duration-300 hover:scale-105 text-lg">
                Lihat Semua Artikel
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative bg-gradient-to-r from-[#3e6461] to-[#2d4a47] py-16 text-white overflow-hidden">
        {/* Badminton Court Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="none">
            {/* Court outline */}
            <rect x="100" y="50" width="400" height="300" fill="none" stroke="white" strokeWidth="2"/>
            {/* Center line */}
            <line x1="300" y1="50" x2="300" y2="350" stroke="white" strokeWidth="2"/>
            {/* Net line */}
            <line x1="100" y1="200" x2="500" y2="200" stroke="white" strokeWidth="3"/>
            
            {/* Second court */}
            <rect x="700" y="50" width="400" height="300" fill="none" stroke="white" strokeWidth="2"/>
            <line x1="900" y1="50" x2="900" y2="350" stroke="white" strokeWidth="2"/>
            <line x1="700" y1="200" x2="1100" y2="200" stroke="white" strokeWidth="3"/>
          </svg>
        </div>

        {/* Badminton equipment icons scattered */}
        <div className="absolute top-10 right-20 text-4xl opacity-20 rotate-45">🏸</div>
        <div className="absolute bottom-10 left-10 text-5xl opacity-20 -rotate-45">🏸</div>
        <div className="absolute top-20 left-1/4 text-3xl opacity-15">🎯</div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className={`relative text-center p-6 rounded-xl transition-transform hover:scale-105 ${
                  stat.number ? 'bg-white/10 backdrop-blur-sm border border-white/20' : ''
                }`}
              >
                {/* Badminton racket decoration */}
                {stat.number && index < 3 && (
                  <div className="absolute -top-2 -right-2 text-3xl opacity-40">🏸</div>
                )}
                
                {stat.number && <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>}
                <p className="text-white/80 text-sm md:text-base font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hubungi Kami Section */}
      <section className="relative bg-gradient-to-b from-white to-gray-50 py-24 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 text-8xl opacity-5">🏸</div>
        <div className="absolute bottom-10 right-10 text-9xl opacity-5">📞</div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-[#3e6461]/15 text-[#3e6461] rounded-full text-sm font-semibold">💬 Hubungi Kami</span>
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">Mari Bergabung Bersama DLOB</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tertarik bergabung dengan komunitas badminton kami? Punya pertanyaan? Kami dengan senang hati siap mendengar dari Anda!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Schedule Card */}
            <div className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
              <div className="relative bg-white rounded-3xl p-8 h-full flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-[#3e6461]/15 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">📅</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#3e6461] transition-colors">Jadwal Latihan</h3>
                <p className="text-gray-600 text-sm mb-6 flex-grow">Latihan rutin setiap minggu untuk meningkatkan skill dan membangun komunitas yang solid</p>
                <p className="text-gray-900 font-bold text-lg">Setiap Sabtu</p>
                <p className="text-[#3e6461] font-semibold">20:00 - 23:00 WIB</p>
              </div>
            </div>

            {/* WhatsApp Card */}
            <div className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
              <div className="relative bg-white rounded-3xl p-8 h-full flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-[#3e6461]/15 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">💬</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#3e6461] transition-colors">Grup WhatsApp</h3>
                <p className="text-gray-600 text-sm mb-6 flex-grow">Bergabunglah dengan komunitas kami untuk mendapat update, diskusi, dan informasi terbaru</p>
                <a
                  href="https://chat.whatsapp.com/your-group-link"
                  className="inline-block px-6 py-2 bg-[#1e4843] text-white rounded-lg font-semibold hover:bg-[#162f2c] transition-colors text-center"
                >
                  Bergabung Sekarang
                </a>
              </div>
            </div>

            {/* Location Card */}
            <div className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
              <div className="relative bg-white rounded-3xl p-8 h-full flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-[#3e6461]/15 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">📍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#3e6461] transition-colors">Lokasi Kami</h3>
                <p className="text-gray-600 text-sm mb-4 flex-grow">Temui kami di tempat latihan resmi dengan fasilitas lengkap dan nyaman</p>
                <p className="text-gray-900 font-bold">GOR Badminton Wisma Harapan</p>
                <p className="text-gray-600 text-sm">Tangerang, Banten</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Mulai Bergabung */}
      <section className="relative bg-gradient-to-r from-[#3e6461] to-[#2d4a47] py-32 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">Siap Bergabung dengan DLOB?</h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-12">
            Memulai perjalanan badminton Anda bersama kami sangat mudah. Jadilah bagian dari komunitas badminton yang terus berkembang.
          </p>
          
          <Link href="/register">
            <button className="px-12 py-5 bg-[#1e4843] text-white font-bold rounded-full hover:shadow-xl transition-all duration-300 hover:scale-105 text-xl shadow-2xl">
              Daftar Sekarang
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}
