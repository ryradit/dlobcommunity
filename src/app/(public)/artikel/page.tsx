'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, Newspaper, ArrowRight, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

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
        
        setArticles([hardcodedArticle, ...data]);
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  }

  const heroArticles = articles.slice(0, 5);
  const editorsPicks = articles.slice(5, 13);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <main className="min-h-screen bg-white">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-gradient-to-b from-slate-50 to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4382C8] mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              Blog & Wawasan Komunitas
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
              Artikel & Berita DLOB
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
              Tips teknik bermain badminton, rekap kegiatan mabar mingguan, dan perkembangan terbaru seputar komunitas.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. LOADING STATE (SKELETON)
      ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm p-4 space-y-4">
                <div className="h-52 bg-slate-100 animate-pulse rounded-2xl" />
                <div className="h-4 bg-slate-100 animate-pulse rounded-full w-1/3" />
                <div className="h-6 bg-slate-200 animate-pulse rounded-full w-4/5" />
                <div className="h-4 bg-slate-100 animate-pulse rounded-full w-2/3" />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* ─────────────────────────────────────────────────────────────
              3. HERO ARTICLES GRID
          ───────────────────────────────────────────────────────────── */}
          {heroArticles.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Main Featured Article (Left 7 Cols) */}
                {heroArticles[0] && (
                  <div className="lg:col-span-7">
                    <Link
                      href={`/artikel/${heroArticles[0].slug}`}
                      className="group relative block aspect-[16/11] rounded-3xl overflow-hidden shadow-xl border border-gray-100"
                    >
                      <Image
                        src={heroArticles[0].content.hero_image.url}
                        alt={heroArticles[0].title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#4382C8] text-white shadow-sm">
                            {heroArticles[0].category}
                          </span>
                          <span className="text-xs text-white/80 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {heroArticles[0].read_time_minutes || 5} min baca
                          </span>
                          <span className="text-xs text-white/70">
                            • {formatDate(heroArticles[0].published_at)}
                          </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight group-hover:text-blue-200 transition-colors">
                          {heroArticles[0].title}
                        </h2>
                      </div>
                    </Link>
                  </div>
                )}

                {/* Secondary 4-Card Grid (Right 5 Cols) */}
                <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {heroArticles.slice(1, 4).map((article) => (
                    <Link
                      key={article.id}
                      href={`/artikel/${article.slug}`}
                      className="group flex gap-4 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-gray-200 transition-all items-center"
                    >
                      <div className="relative w-24 h-24 sm:w-28 sm:h-24 shrink-0 rounded-2xl overflow-hidden shadow-sm">
                        <Image
                          src={article.content.hero_image.url}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold text-[#4382C8] uppercase tracking-wide">
                          {article.category}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-[#4382C8] transition-colors line-clamp-2 mt-0.5 leading-snug">
                          {article.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(article.published_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

              </div>
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              4. ALL ARTICLES / EDITOR'S PICKS
          ───────────────────────────────────────────────────────────── */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Semua Artikel
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Kumpulan tulisan dan dokumentasi mabar komunitas
                </p>
              </div>
            </div>

            {articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/artikel/${article.slug}`}
                    className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-[#4382C8]/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Image */}
                    <div className="relative w-full h-48 overflow-hidden bg-slate-100">
                      <Image
                        src={article.content.hero_image.url}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-sm text-[#4382C8] shadow-sm">
                          {article.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col grow">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(article.published_at)}</span>
                      </div>

                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#4382C8] transition-colors line-clamp-2 leading-snug mb-2">
                        {article.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed grow">
                        {article.excerpt}
                      </p>

                      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#4382C8]">
                        <span>Baca Selengkapnya</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Belum ada artikel yang dipublikasikan.</p>
              </div>
            )}
          </section>

          {/* ─────────────────────────────────────────────────────────────
              5. BOTTOM CTA
          ───────────────────────────────────────────────────────────── */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 text-center p-10 sm:p-14">
              <div className="absolute inset-0 bg-gradient-to-br from-[#4382C8] via-[#2f6fae] to-[#1b4372]" />
              <div className="absolute inset-0 bg-white/10 backdrop-blur-md" />

              <div className="relative text-white max-w-xl mx-auto space-y-5">
                <h2 className="text-3xl sm:text-4xl font-black leading-tight drop-shadow-sm">
                  Punya Cerita Mabar yang Ingin Dibagikan?
                </h2>
                <p className="text-white/80 text-sm leading-relaxed">
                  Hubungi admin komunitas untuk mengirimkan tulisan atau dokumentasi match Anda.
                </p>
                <div className="pt-2">
                  <Link
                    href="/kontak"
                    className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-bold px-8 py-3.5 rounded-full text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Hubungi Admin
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
