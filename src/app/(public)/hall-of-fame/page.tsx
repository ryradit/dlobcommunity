import React from 'react';
import { Trophy, Users, Star } from 'lucide-react';
import Footer from '@/components/Footer';
import HallOfFameSection from '@/components/HallOfFameSection';
import { createClient } from '@supabase/supabase-js';

async function getActiveMemberCount(): Promise<number> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function HallOfFamePage() {
  const activeMemberCount = await getActiveMemberCount();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <Trophy className="h-16 w-16 text-yellow-500 mr-4" />
            <Users className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
            Hall of Fame
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto mb-6 leading-relaxed">
            Mengenal lebih dekat para anggota luar biasa komunitas DLOB yang telah berkontribusi 
            membangun komunitas badminton terbaik di Indonesia 🏸
          </p>
          <div className="flex items-center justify-center space-x-2 text-lg text-gray-600 mb-12">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>Setiap Sabtu • 20:00-23:00 WIB • GOR Wisma Harapan</span>
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
          
          {/* Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-shadow">
              <div className="text-3xl font-bold text-blue-600 mb-2">{activeMemberCount}</div>
              <div className="text-sm text-gray-600 font-medium">Member Aktif</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100 hover:shadow-xl transition-shadow">
              <div className="text-3xl font-bold text-green-600 mb-2">5+</div>
              <div className="text-sm text-gray-600 font-medium">Tahun Berdiri</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-shadow">
              <div className="text-3xl font-bold text-purple-600 mb-2">500+</div>
              <div className="text-sm text-gray-600 font-medium">Match Dimainkan</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow">
              <div className="text-3xl font-bold text-orange-600 mb-2">100%</div>
              <div className="text-sm text-gray-600 font-medium">Semangat</div>
            </div>
          </div>
        </div>
      </section>

      {/* Hall of Fame Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HallOfFameSection showAll={true} />
        </div>
      </section>

      {/* Join Community CTA */}
      <section className="relative min-h-80 overflow-hidden bg-black py-12">
        {/* Gradient blur effects */}
        <div className="flex flex-col items-end absolute -right-60 -top-10 blur-xl z-0">
          <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-purple-600 to-sky-600"></div>
          <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-pink-900 to-yellow-400"></div>
          <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-yellow-600 to-sky-500"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 min-h-96 flex flex-col items-center justify-center">
          {/* Badge */}
          <div className="mb-6 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center gap-2">
            <span className="text-sm font-medium text-white">🏆 Jadilah Bagian</span>
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
            Bergabung dengan DLOB!
          </h2>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-300 mb-8 text-center">
            Ingin menjadi bagian dari Hall of Fame DLOB? Bergabunglah dengan komunitas 
            badminton terbaik dan rasakan pengalaman bermain yang tak terlupakan!
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/pre-order"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-black font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <span>Gabung Komunitas</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="/tentang"
              className="inline-flex items-center justify-center px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full border border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300"
            >
              Pelajari Lebih Lanjut
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
