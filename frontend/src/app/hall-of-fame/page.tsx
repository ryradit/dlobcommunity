import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HallOfFameSection from '@/components/HallOfFameSection';

export default function HallOfFamePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            DLOB Hall of Fame
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Mengenal lebih dekat para anggota luar biasa komunitas DLOB yang telah berkontribusi 
            membangun komunitas badminton terbaik di Indonesia 🏸
          </p>
          
          {/* Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">19</div>
              <div className="text-sm text-gray-600">Member Aktif</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">5+</div>
              <div className="text-sm text-gray-600">Tahun Berdiri</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">200+</div>
              <div className="text-sm text-gray-600">Match Dimainkan</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">100%</div>
              <div className="text-sm text-gray-600">Semangat</div>
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
      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Bergabung dengan DLOB!
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Ingin menjadi bagian dari Hall of Fame DLOB? Bergabunglah dengan komunitas 
            badminton terbaik dan rasakan pengalaman bermain yang tak terlupakan!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span>Gabung Komunitas</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="/about"
              className="inline-flex items-center justify-center px-6 py-3 bg-transparent text-white border border-white font-medium rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
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