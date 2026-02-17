'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
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
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  }

  const featuredArticle = articles[0]; // Most recent
  const otherArticles = articles.slice(1);

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
      {loading ? (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-12 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-[#3e6461] border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-4">Memuat artikel...</p>
            </div>
          </div>
        </section>
      ) : featuredArticle ? (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                {/* Featured Image */}
                <div className="relative h-96 lg:h-full overflow-hidden rounded-l-2xl">
                  <img 
                    src={featuredArticle.content.hero_image.url} 
                    alt={featuredArticle.content.hero_image.alt}
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
                        {new Date(featuredArticle.published_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{featuredArticle.read_time_minutes} menit baca</span>
                    </div>
                  </div>

                  <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                    {featuredArticle.excerpt}
                  </p>

                  <Link 
                    href={`/artikel/${featuredArticle.slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e4843] text-white font-semibold rounded-full hover:bg-[#162f2c] transition-colors"
                  >
                    Baca Selengkapnya →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-12 text-center">
              <p className="text-gray-500">Belum ada artikel yang dipublish.</p>
            </div>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Artikel Lainnya</h2>
          {otherArticles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherArticles.map((article) => (
                <article key={article.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group">
                  {/* Article Image */}
                  <div className="relative h-48 overflow-hidden bg-gray-200">
                    <img 
                      src={article.content.hero_image.url} 
                      alt={article.content.hero_image.alt}
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
                        {new Date(article.published_at).toLocaleDateString('id-ID', {
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
                      <span className="text-xs text-gray-500">{article.read_time_minutes} menit baca</span>
                      <Link 
                        href={`/artikel/${article.slug}`}
                        className="text-[#3e6461] font-semibold text-sm hover:text-[#2d4a47] transition-colors"
                      >
                        Baca →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            !loading && (
              <p className="text-center text-gray-500 py-12">
                Tidak ada artikel lainnya saat ini.
              </p>
            )
          )}
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
