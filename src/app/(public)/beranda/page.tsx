import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
import GallerySection from '@/components/GallerySection';
import FeaturesSection from '@/components/FeaturesSection';
import { CommunityCTA } from '@/components/ui/community-cta';
import ArtikelSection from '@/components/ArtikelSection';
import { 
  Calendar, 
  MessageSquare, 
  MapPin, 
  ClipboardList, 
  Users, 
  Target, 
  Zap, 
  TrendingUp,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function BerandaPage() {

  const stats = [
    { number: '50+', label: 'Anggota Aktif', icon: Users, desc: 'Pemain terdaftar di sistem' },
    { number: '1,000+', label: 'Pertandingan', icon: Target, desc: 'Total match telah diselesaikan' },
    { number: '5+ Tahun', label: 'Komunitas Solid', icon: TrendingUp, desc: 'Membangun kebersamaan' },
    { number: 'AI Insights', label: 'Bertenaga AI', icon: Zap, desc: 'Analisis performa mendalam' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 transition-colors duration-300">
        {/* Hero Section */}
        <HeroSection />

        {/* Features Section - About Apps */}
        <FeaturesSection />

        {/* Gallery Section */}
        <GallerySection />

        {/* Artikel Section */}
        <ArtikelSection />

        {/* Survey CTA Banner - Premium Glassmorphism Floating Banner */}
        <section className="py-12 bg-white dark:bg-zinc-950 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1b3e3b] via-[#2a5955] to-[#1b3e3b] p-8 md:p-12 shadow-2xl border border-teal-500/20 group">
              {/* Decorative Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-400/25 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-125" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-125" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-start gap-5">
                  <div className="p-4 rounded-2xl bg-white/10 border border-white/20 text-white shadow-inner shrink-0 hidden sm:block animate-pulse">
                    <ClipboardList className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-400/20 text-teal-200 border border-teal-400/30 mb-3">
                      <Sparkles className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      SUARA KAMU PENTING
                    </div>
                    <h2 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                      Bantu DLOB Berkembang Lebih Jauh
                    </h2>
                    <p className="text-teal-100/80 text-sm md:text-base mt-2 max-w-xl font-medium">
                      Ikuti survey komunitas kami. Hanya perlu waktu 5–10 menit, sepenuhnya anonim, dan menggunakan pertanyaan adaptif untuk mendengar masukan terbaik Anda.
                    </p>
                  </div>
                </div>
                <Link
                  href="/survey"
                  className="shrink-0 group/btn inline-flex items-center gap-2 bg-white text-teal-900 font-extrabold px-8 py-4 rounded-2xl hover:bg-teal-50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 text-sm shadow-lg shadow-teal-950/20"
                >
                  Isi Survey Sekarang
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - High End Gradient with Grid Cards */}
        <section className="relative bg-gradient-to-br from-[#122826] via-[#1a3f3b] to-[#122826] py-24 text-white overflow-hidden">
          {/* Badminton Court Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="none">
              <rect x="100" y="50" width="400" height="300" fill="none" stroke="white" strokeWidth="2"/>
              <line x1="300" y1="50" x2="300" y2="350" stroke="white" strokeWidth="2"/>
              <line x1="100" y1="200" x2="500" y2="200" stroke="white" strokeWidth="3"/>
              
              <rect x="700" y="50" width="400" height="300" fill="none" stroke="white" strokeWidth="2"/>
              <line x1="900" y1="50" x2="900" y2="350" stroke="white" strokeWidth="2"/>
              <line x1="700" y1="200" x2="1100" y2="200" stroke="white" strokeWidth="3"/>
            </svg>
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Kekuatan Komunitas Kami</h2>
              <p className="text-teal-200/70 text-sm md:text-base mt-2 max-w-xl mx-auto font-medium">
                Pencapaian komunitas badminton DLOB yang terus tumbuh bersama integrasi teknologi modern.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const StatIcon = stat.icon;
                return (
                  <div 
                    key={index}
                    className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/15 p-6 backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:bg-white/10 hover:border-white/25 group shadow-lg"
                  >
                    {/* Glowing effect inside card */}
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 h-24 w-24 rounded-full bg-white/5 blur-xl pointer-events-none group-hover:bg-white/10 transition-all duration-300" />
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-white/10 text-teal-300 group-hover:scale-110 transition-transform duration-300 border border-white/10">
                        <StatIcon className="w-5 h-5" />
                      </div>
                    </div>
                    
                    <div className="text-3xl md:text-4xl font-black mb-1 tracking-tight text-white">{stat.number}</div>
                    <h3 className="text-base font-bold text-teal-200 mb-2">{stat.label}</h3>
                    <p className="text-xs text-white/60 font-medium leading-relaxed">{stat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Hubungi Kami Section - Premium Card Overlays */}
        <section className="relative bg-gradient-to-b from-white to-slate-50 py-28 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-20 left-10 text-9xl opacity-5 select-none pointer-events-none font-bold">DLOB</div>
          <div className="absolute bottom-20 right-10 text-9xl opacity-5 select-none pointer-events-none font-bold">MABAR</div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-20">
              <div className="inline-block mb-4">
                <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-extrabold border border-teal-100 tracking-wider uppercase">💬 Hubungi Kami</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">Mari Bergabung Bersama DLOB</h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto font-medium">
                Tertarik bergabung dengan komunitas badminton kami? Punya pertanyaan? Kami siap menyambut Anda dengan hangat di lapangan!
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Schedule Card */}
              <div className="group relative h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1b3e3b] to-[#122826] rounded-3xl transform group-hover:scale-[1.03] transition-transform duration-300 -z-10 shadow-lg group-hover:shadow-teal-900/10"></div>
                <div className="relative bg-white rounded-3xl p-8 h-full flex flex-col shadow-xs border border-gray-150 group-hover:border-transparent transition-all duration-300">
                  <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 border border-teal-100/50">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-3 group-hover:text-teal-600 transition-colors">Jadwal Latihan</h3>
                  <p className="text-gray-600 text-sm mb-6 flex-grow leading-relaxed font-medium">Latihan rutin setiap minggu untuk meningkatkan skill, stamina, dan membangun jejaring pertemanan.</p>
                  <div className="mt-auto">
                    <p className="text-gray-900 font-black text-lg">Setiap Sabtu</p>
                    <p className="text-teal-600 font-extrabold text-sm tracking-wide mt-0.5">20:00 - 23:00 WIB</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Card */}
              <div className="group relative h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1b3e3b] to-[#122826] rounded-3xl transform group-hover:scale-[1.03] transition-transform duration-300 -z-10 shadow-lg group-hover:shadow-teal-900/10"></div>
                <div className="relative bg-white rounded-3xl p-8 h-full flex flex-col shadow-xs border border-gray-150 group-hover:border-transparent transition-all duration-300">
                  <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 border border-teal-100/50">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-3 group-hover:text-teal-600 transition-colors">Grup WhatsApp</h3>
                  <p className="text-gray-600 text-sm mb-6 flex-grow leading-relaxed font-medium">Grup WhatsApp kami bersifat privat & eksklusif demi kenyamanan anggota. Hubungi Admin untuk meminta undangan masuk.</p>
                  <a
                    href="https://wa.me/6281387643604?text=Halo%20Admin%20DLOB%2C%20saya%20tertarik%20bergabung%20dengan%20komunitas%20badminton%20DLOB.%20Boleh%20saya%20meminta%20link%20undangan%20untuk%20masuk%20ke%20grup%20WhatsApp%3F"
                    className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-[#1e4843] text-white rounded-xl font-bold hover:bg-[#162f2c] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-sm shadow-md"
                  >
                    <span>Minta Undangan Grup</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Location Card */}
              <div className="group relative h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1b3e3b] to-[#122826] rounded-3xl transform group-hover:scale-[1.03] transition-transform duration-300 -z-10 shadow-lg group-hover:shadow-teal-900/10"></div>
                <div className="relative bg-white rounded-3xl p-8 h-full flex flex-col shadow-xs border border-gray-150 group-hover:border-transparent transition-all duration-300">
                  <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 border border-teal-100/50">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-3 group-hover:text-teal-600 transition-colors">Lokasi Kami</h3>
                  <p className="text-gray-600 text-sm mb-6 flex-grow leading-relaxed font-medium">Temui kami di tempat latihan resmi dengan kualitas lapangan prima dan fasilitas yang lengkap.</p>
                  <div className="mt-auto">
                    <p className="text-gray-900 font-black text-lg">GOR Badminton Wisma Harapan</p>
                    <p className="text-gray-500 font-semibold text-xs mt-0.5">Tangerang, Banten</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Mulai Bergabung */}
        <CommunityCTA />
      </main>
  );
}
