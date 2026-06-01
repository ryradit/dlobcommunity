'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Newspaper } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  read_time_minutes: number;
  published_at: string;
  content: {
    hero_image: { url: string; alt: string };
  };
  views: number;
}

export default function ArtikelPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  async function fetchArticles() {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (!error && data) {
        // Add hardcoded Refleksi 2025 article
        const hardcodedArticle: Article = {
          id: 'refleksi-2025-hardcoded',
          title: 'Refleksi Tahun 2025: Perjalanan Menakjubkan Komunitas DLOB',
          slug: 'refleksi-2025',
          category: 'Komunitas',
          excerpt: 'Merayakan pencapaian dan mempersiapkan masa depan yang gemilang bersama komunitas DLOB di tahun 2025.',
          read_time_minutes: 5,
          published_at: '2025-12-20T00:00:00Z',
          content: {
            hero_image: {
              url: '/images/nominasi/headerimage.jpeg',
              alt: 'Refleksi Tahun 2025'
            }
          },
          views: 0
        };
        
        // Combine hardcoded article with database articles
        setArticles([hardcodedArticle, ...data]);
      } else if (error) {
        console.error('Error fetching articles:', error);
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  const categories = ['Semua', 'Komunitas', 'Berita', 'Tips & Trik', 'Event'];

  const filteredArticles = articles.filter((article) => {
    const matchesCategory = selectedCategory === 'Semua' || article.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredArticle = articles[0] || null;
  const gridArticles = (selectedCategory === 'Semua' && searchQuery === '') 
    ? filteredArticles.slice(1) 
    : filteredArticles;

  return (
    <main className="min-h-screen bg-slate-50/50">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-[#1e4843] py-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#3e6461_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.2))]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-emerald-300 mb-4 border border-white/10">
            <Newspaper className="w-3.5 h-3.5" />
            DLOB Community Blog
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Artikel & Cerita Terbaru
          </h1>
          <p className="text-slate-200 text-lg max-w-2xl mx-auto mb-8 font-light">
            Temukan tips, trik, berita, dan cerita inspiratif seputar dunia badminton dan komunitas DLOB 🏸
          </p>

          {/* Search Box */}
          <div className="max-w-md mx-auto relative">
            <input
              type="text"
              placeholder="Cari artikel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3.5 pl-12 rounded-2xl bg-white/95 text-gray-900 placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg text-sm transition-all"
            />
            <svg
              className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#1e4843] border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-4 font-medium">Memuat artikel...</p>
          </div>
        ) : (
          <>
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-[#1e4843] text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-[#1e4843] border border-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Featured Article - Horizontal Card */}
            {selectedCategory === 'Semua' && searchQuery === '' && featuredArticle && (
              <div className="mb-12">
                <Link
                  href={`/artikel/${featuredArticle.slug}`}
                  className="group block bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    <div className="lg:col-span-7 relative aspect-16/10 lg:aspect-auto min-h-[300px] lg:min-h-[450px] overflow-hidden">
                      <img
                        src={featuredArticle.content.hero_image.url}
                        alt={featuredArticle.content.hero_image.alt}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                      />
                      <div className="absolute top-6 left-6">
                        <span className="inline-block px-4 py-1.5 bg-yellow-400 text-gray-900 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                          Terbaru & Sorotan
                        </span>
                      </div>
                    </div>
                    <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-4 text-xs">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold uppercase tracking-wider rounded-md border border-emerald-100">
                            {featuredArticle.category}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500 font-medium">
                            {formatDate(featuredArticle.published_at)}
                          </span>
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 group-hover:text-[#1e4843] transition-colors leading-tight">
                          {featuredArticle.title}
                        </h2>
                        <p className="text-gray-600 leading-relaxed font-light mb-6">
                          {featuredArticle.excerpt}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-6 border-t border-gray-100 text-xs text-gray-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {featuredArticle.read_time_minutes} menit baca
                        </span>
                        <span>{featuredArticle.views || 0} pembaca</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Articles List / Grid */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {searchQuery ? 'Hasil Pencarian' : selectedCategory === 'Semua' ? 'Semua Artikel' : `Artikel ${selectedCategory}`}
                </h2>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  {gridArticles.length} Artikel ditemukan
                </span>
              </div>

              {gridArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {gridArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/artikel/${article.slug}`}
                      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                    >
                      <div className="relative aspect-16/10 overflow-hidden bg-gray-100">
                        <img
                          src={article.content.hero_image.url}
                          alt={article.content.hero_image.alt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="inline-block px-3 py-1 bg-white/90 backdrop-blur-xs text-gray-900 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-xs">
                            {article.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2 block">
                            {formatDate(article.published_at)}
                          </span>
                          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#1e4843] transition-colors line-clamp-2 leading-snug">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-3 font-light leading-relaxed mb-4">
                            {article.excerpt}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-[11px] text-gray-400 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {article.read_time_minutes} menit baca
                          </span>
                          <span>{article.views || 0} pembaca</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xs">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <Newspaper className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Tidak Ada Artikel Ditemukan
                  </h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    Coba ubah kata kunci pencarian Anda atau pilih kategori artikel yang lain.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* CTA Section */}
      <section className="bg-linear-to-br from-[#1e4843] via-[#1a3d39] to-[#0f1d1b] py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,#3e6461_0%,transparent_50%)]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Bergabunglah dengan Komunitas DLOB
          </h2>
          <p className="text-base text-slate-300 mb-8 max-w-xl mx-auto font-light">
            Jadilah bagian dari komunitas badminton terbesar dan ikuti update turnamen, sparring, dan artikel edukatif lainnya.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3.5 bg-white text-[#1e4843] font-semibold rounded-xl hover:bg-slate-50 transition-all hover:scale-105 shadow-lg"
          >
            Daftar Sekarang
          </Link>
        </div>
      </section>
    </main>
  );
}
