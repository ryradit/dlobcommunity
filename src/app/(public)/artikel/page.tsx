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

  const heroArticles = articles.slice(0, 5);
  const editorsPicks = articles.slice(5, 13); // Show next 8 articles after hero section

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#3e6461] transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>

      {loading ? (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-12 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-[#3e6461] border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-4">Memuat artikel...</p>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Hero Grid Section - 5 Images */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-150">
              {/* Main Large Image - Left */}
              {heroArticles[0] && (
                <Link 
                  href={`/artikel/${heroArticles[0].slug}`}
                  className="relative overflow-hidden rounded-lg group cursor-pointer"
                >
                  <img 
                    src={heroArticles[0].content.hero_image.url}
                    alt={heroArticles[0].content.hero_image.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <Newspaper className="w-4 h-4" />
                      <span className="text-sm font-medium uppercase tracking-wide">
                        {heroArticles[0].category}
                      </span>
                      <span className="text-sm opacity-80">
                        • {formatDate(heroArticles[0].published_at)}
                      </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                      {heroArticles[0].title}
                    </h2>
                  </div>
                </Link>
              )}

              {/* Right Grid - 4 Images in 2x2 */}
              <div className="grid grid-cols-2 gap-4">
                {heroArticles.slice(1, 5).map((article) => (
                  <Link 
                    key={article.id}
                    href={`/artikel/${article.slug}`}
                    className="relative overflow-hidden rounded-lg group cursor-pointer"
                  >
                    <img 
                      src={article.content.hero_image.url}
                      alt={article.content.hero_image.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="flex items-center gap-2 mb-2 text-xs">
                        <Newspaper className="w-3 h-3" />
                        <span className="font-medium uppercase tracking-wide">
                          {article.category}
                        </span>
                      </div>
                      <h3 className="text-sm md:text-base font-bold leading-tight line-clamp-2">
                        {article.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Editor's Picks Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-12">
              <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">
                Explore some of our favorite articles
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Editor's Picks
              </h2>
            </div>

            {editorsPicks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Featured Large Card - First Article */}
                {editorsPicks[0] && (
                  <Link 
                    href={`/artikel/${editorsPicks[0].slug}`}
                    className="md:col-span-2 lg:col-span-1 lg:row-span-2 group cursor-pointer"
                  >
                    <article className="h-full flex flex-col">
                      <div className="relative overflow-hidden rounded-lg mb-4 h-80 lg:h-full">
                        <img 
                          src={editorsPicks[0].content.hero_image.url}
                          alt={editorsPicks[0].content.hero_image.alt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="inline-block px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-bold uppercase tracking-wide">
                            Spotlight
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3 text-sm">
                        <span className="text-[#3e6461] font-semibold uppercase tracking-wide">
                          {editorsPicks[0].category}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">
                          {formatDate(editorsPicks[0].published_at)}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#3e6461] transition-colors">
                        {editorsPicks[0].title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed line-clamp-3">
                        {editorsPicks[0].excerpt}
                      </p>
                    </article>
                  </Link>
                )}

                {/* Regular Cards - Rest of Articles */}
                {editorsPicks.slice(1).map((article, index) => (
                  <Link 
                    key={article.id}
                    href={`/artikel/${article.slug}`}
                    className="group cursor-pointer"
                  >
                    <article className="flex gap-4">
                      <div className="relative w-32 h-32 shrink-0 overflow-hidden rounded-lg">
                        <img 
                          src={article.content.hero_image.url}
                          alt={article.content.hero_image.alt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        {index === 0 && (
                          <div className="absolute top-2 left-2">
                            <span className="inline-block px-2 py-0.5 bg-yellow-400 text-gray-900 text-xs font-bold">
                              ★
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 text-xs">
                          <span className="text-[#3e6461] font-semibold uppercase tracking-wide">
                            {article.category}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">
                            {new Date(article.published_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-[#3e6461] transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {article.excerpt}
                        </p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Belum ada artikel yang tersedia.</p>
              </div>
            )}
          </section>

          {/* CTA Section */}
          <section className="bg-linear-to-r from-[#1e4843] to-[#3e6461] py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-4xl font-bold text-white mb-4">
                Bergabunglah dengan Komunitas DLOB
              </h2>
              <p className="text-lg text-slate-100 mb-8">
                Jadilah bagian dari komunitas badminton terbesar dan ikuti update terbaru langsung dari DLOB
              </p>
              <Link 
                href="/register"
                className="inline-block px-8 py-3 bg-white text-[#3e6461] font-semibold rounded-full hover:bg-slate-50 transition-all hover:scale-105"
              >
                Daftar Sekarang
              </Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
