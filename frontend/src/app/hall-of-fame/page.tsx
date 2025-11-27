import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Users, Star } from 'lucide-react';
import Footer from '@/components/Footer';
import HallOfFameSection from '@/components/HallOfFameSection';

export default function HallOfFamePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Independent Header */}
      <header className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Kembali ke Beranda</span>
              </Link>
            </div>
            
            {/* Page Title */}
            <div className="flex items-center space-x-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <h1 className="text-2xl font-bold text-gray-900">Hall of Fame</h1>
            </div>
            
            {/* Navigation Actions */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/about" 
                className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
              >
                Tentang DLOB
              </Link>
              <Link 
                href="/contact" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Bergabung
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-linear-to-br from-blue-50 to-purple-50 py-20">
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
              <div className="text-3xl font-bold text-blue-600 mb-2">46</div>
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