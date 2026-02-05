'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

export default function ArtikelPage() {
  const articles = [
    {
      id: 1,
      title: 'Refleksi Tahun 2025: Perjalanan Menakjubkan Komunitas DLOB',
      category: 'Komunitas',
      date: '2025-12-20',
      readTime: '5 menit baca',
      excerpt: 'Tahun 2025 telah menjadi tahun yang luar biasa bagi komunitas badminton DLOB. Mari kita merenungkan perjalanan menakjubkan yang telah kita lalui bersama.',
      image: '/images/nominasi/headerimage.jpeg',
      featured: true,
    },
    {
      id: 2,
      title: 'Tips Meningkatkan Teknik Smash',
      category: 'Tips & Trik',
      date: '2024-01-15',
      readTime: '4 menit baca',
      excerpt: 'Pelajari teknik smash yang efektif untuk meningkatkan performa Anda dalam setiap pertandingan.',
      image: '/images/dlob1.jpg',
      featured: false,
    },
    {
      id: 3,
      title: 'Nutrisi untuk Pemain Badminton',
      category: 'Kesehatan',
      date: '2024-01-10',
      readTime: '6 menit baca',
      excerpt: 'Panduan nutrisi lengkap untuk atlet badminton profesional dan pemula.',
      image: '/images/dlob2.jpg',
      featured: false,
    },
    {
      id: 4,
      title: 'Analisis Strategi Pertandingan Modern',
      category: 'Strategi',
      date: '2024-01-05',
      readTime: '7 menit baca',
      excerpt: 'Eksplorasi strategi terbaru yang digunakan pemain top dunia dalam kompetisi internasional.',
      image: '/images/dlob3.jpg',
      featured: false,
    },
  ];

  const featuredArticle = articles.find(a => a.featured);
  const otherArticles = articles.filter(a => !a.featured);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-white py-16 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[#3e6461] hover:text-[#2d4a47] mb-8 transition-colors font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <div className="flex flex-col gap-4">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
              Artikel & Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl">
              Berita terkini, tips, strategi, dan cerita menarik dari komunitas badminton DLOB
            </p>
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {featuredArticle && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                {/* Featured Image */}
                <div className="relative h-96 lg:h-full overflow-hidden rounded-l-2xl">
                  <img 
                    src={featuredArticle.image} 
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>

                {/* Featured Content */}
                <div className="p-8 lg:p-12">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-block px-3 py-1 bg-[#3e6461]/10 text-[#3e6461] text-sm font-semibold rounded-full">
                      {featuredArticle.category}
                    </span>
                    <span className="text-sm text-gray-500">Featured</span>
                  </div>

                  <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    {featuredArticle.title}
                  </h2>

                  <div className="flex items-center gap-6 mb-6 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(featuredArticle.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{featuredArticle.readTime}</span>
                    </div>
                  </div>

                  <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                    {featuredArticle.excerpt}
                  </p>

                  <Link 
                    href={`/artikel/${featuredArticle.id === 1 ? 'refleksi-2025' : 'artikel-' + featuredArticle.id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e4843] text-white font-semibold rounded-full hover:bg-[#162f2c] transition-colors"
                  >
                    Baca Selengkapnya →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Artikel Lainnya</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherArticles.map((article) => (
              <article key={article.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group">
                {/* Article Image */}
                <div className="relative h-48 overflow-hidden bg-gray-200">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* Article Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-block px-2 py-1 bg-[#3e6461]/10 text-[#3e6461] text-xs font-semibold rounded-full">
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(article.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: '2-digit',
                      })}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-[#3e6461] transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{article.readTime}</span>
                    <Link 
                      href={`/artikel/${article.id === 1 ? 'refleksi-2025' : 'artikel-' + article.id}`}
                      className="text-[#3e6461] font-semibold text-sm hover:text-[#2d4a47] transition-colors"
                    >
                      Baca →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#3e6461]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Bergabunglah dengan Komunitas DLOB</h2>
          <p className="text-lg text-slate-100 mb-8">
            Jadilah bagian dari komunitas badminton terbesar dan ikuti update terbaru langsung dari DLOB
          </p>
          <button className="px-8 py-3 bg-white text-[#3e6461] font-semibold rounded-full hover:bg-slate-50 transition-colors">
            Daftar Sekarang
          </button>
        </div>
      </section>
    </main>
  );
}
