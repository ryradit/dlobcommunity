'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight, BookOpen, ArrowUpRight } from 'lucide-react';
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
          excerpt: 'Merayakan pencapaian, evolusi digital, dan menyambut era baru bersama komunitas DLOB di tahun 2025.',
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

  const heroArticles = articles.slice(0, 4);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950 font-sans overflow-x-clip">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-white border-b border-zinc-200/80 overflow-hidden">
        {/* Ambient radial */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-radial from-[#4382C8]/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-mono tracking-wider uppercase">
              Publikasi &amp; Analisis Match
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-950 tracking-tight leading-[1.05]">
              Wawasan Taktik &<br />
              <span className="text-[#4382C8]">Kabar Komunitas.</span>
            </h1>
            <p className="text-zinc-600 text-base sm:text-lg leading-relaxed max-w-2xl">
              Panduan teknik bulu tangkis, sorotan turnamen, rekap mabar rutin mingguan, serta kabar terkini dari keluarga besar DLOB.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. LOADING STATE (SKELETON)
      ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="doppelrand-shell p-1.5 rounded-[2rem] bg-zinc-100 border border-zinc-200/80">
                <div className="p-6 rounded-[calc(2rem-0.375rem)] bg-white space-y-4">
                  <div className="h-52 bg-zinc-200/60 animate-pulse rounded-2xl" />
                  <div className="h-4 bg-zinc-200/60 animate-pulse rounded-full w-1/3" />
                  <div className="h-6 bg-zinc-200/80 animate-pulse rounded-full w-4/5" />
                  <div className="h-4 bg-zinc-100 animate-pulse rounded-full w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* ─────────────────────────────────────────────────────────────
              3. HERO ARTICLES GRID (Magazine Style Bento)
          ───────────────────────────────────────────────────────────── */}
          {heroArticles.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Main Featured Article (Left 7 Cols) */}
                {heroArticles[0] && (
                  <div className="lg:col-span-7">
                    <Link
                      href={`/artikel/${heroArticles[0].slug}`}
                      className="group block h-full"
                    >
                      <div className="doppelrand-shell p-2 rounded-[2.5rem] bg-zinc-100 border border-zinc-200/80 shadow-lg hover:shadow-2xl transition-all duration-500 h-full">
                        <div className="relative h-full min-h-[380px] sm:min-h-[440px] rounded-[calc(2.5rem-0.5rem)] overflow-hidden bg-zinc-950 flex flex-col justify-end p-6 sm:p-10">
                          <Image
                            src={heroArticles[0].content.hero_image.url}
                            alt={heroArticles[0].title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            priority
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent pointer-events-none" />
                          
                          <div className="relative z-10 text-white space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/25">
                                {heroArticles[0].category}
                              </span>
                              <span className="text-xs text-zinc-300 font-mono flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-[#4382C8]" />
                                {heroArticles[0].read_time_minutes || 5} min baca
                              </span>
                              <span className="text-xs text-zinc-400">
                                • {formatDate(heroArticles[0].published_at)}
                              </span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight group-hover:text-blue-300 transition-colors tracking-tight">
                              {heroArticles[0].title}
                            </h2>

                            <p className="text-zinc-300 text-xs sm:text-sm line-clamp-2 max-w-xl">
                              {heroArticles[0].excerpt}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                )}

                {/* Secondary 3-Card Stack (Right 5 Cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                  {heroArticles.slice(1, 4).map((article) => (
                    <Link
                      key={article.id}
                      href={`/artikel/${article.slug}`}
                      className="group block"
                    >
                      <div className="doppelrand-shell p-1.5 rounded-[2rem] bg-white hover:bg-zinc-100 border border-zinc-200/80 shadow-xs hover:shadow-md transition-all duration-300">
                        <div className="p-4 rounded-[calc(2rem-0.375rem)] bg-zinc-50/50 flex gap-4 items-center">
                          <div className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-zinc-950">
                            <Image
                              src={article.content.hero_image.url}
                              alt={article.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-[#4382C8] uppercase tracking-wide">
                                {article.category}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                • {formatDate(article.published_at)}
                              </span>
                            </div>
                            <h3 className="font-bold text-sm text-zinc-950 group-hover:text-[#4382C8] transition-colors line-clamp-2 leading-snug">
                              {article.title}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

              </div>
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              4. ALL ARTICLES SECTION (Doppelrand Grid)
          ───────────────────────────────────────────────────────────── */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-zinc-200/80">
            <div className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
                  Seluruh Publikasi
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Arsip dokumentasi latihan, taktik, dan refleksi perjalanan komunitas.
                </p>
              </div>
            </div>

            {articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/artikel/${article.slug}`}
                    className="group block h-full"
                  >
                    <div className="doppelrand-shell p-1.5 rounded-[2rem] bg-zinc-100/90 hover:bg-zinc-200/70 border border-zinc-200/80 shadow-md hover:shadow-xl hover:shadow-[#4382C8]/10 transition-all duration-300 h-full flex flex-col">
                      <div className="h-full rounded-[calc(2rem-0.375rem)] overflow-hidden bg-white flex flex-col justify-between">
                        
                        {/* Image Preview */}
                        <div className="relative w-full h-52 overflow-hidden bg-zinc-950">
                          <Image
                            src={article.content.hero_image.url}
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute bottom-3 left-3">
                            <span className="px-3 py-1 bg-zinc-950/80 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider rounded-full border border-white/20">
                              {article.category}
                            </span>
                          </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-6 flex flex-col grow justify-between">
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                              <span>{formatDate(article.published_at)}</span>
                              <span>•</span>
                              <span>{article.read_time_minutes || 5} min</span>
                            </div>

                            <h3 className="font-bold text-lg text-zinc-950 group-hover:text-[#4382C8] transition-colors line-clamp-2 leading-snug">
                              {article.title}
                            </h3>

                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                              {article.excerpt}
                            </p>
                          </div>

                          <div className="pt-4 mt-5 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-zinc-900 group-hover:text-[#4382C8] transition-colors">
                            <span>Baca Selengkapnya</span>
                            <div className="w-6 h-6 rounded-full bg-zinc-100 group-hover:bg-[#4382C8] flex items-center justify-center transition-colors">
                              <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-white transition-colors" />
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-zinc-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium text-sm">Belum ada artikel yang dipublikasikan.</p>
              </div>
            )}
          </section>

          {/* ─────────────────────────────────────────────────────────────
              5. BOTTOM CTA (Cinematic Closing)
          ───────────────────────────────────────────────────────────── */}
          <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="p-2 sm:p-2.5 rounded-[2.5rem] bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden relative text-white">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-[#4382C8]/20 to-transparent rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative rounded-[calc(2.5rem-0.625rem)] bg-zinc-900/90 p-8 sm:p-14 text-center max-w-2xl mx-auto space-y-5">
                <h2 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight">
                  Punya Kisah Mabar yang Ingin Dibagikan?
                </h2>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                  Hubungi pengurus untuk mempublikasikan artikel review raket, taktik bermain, atau dokumentasi turnamen Anda.
                </p>
                <div className="pt-2">
                  <Link
                    href="/kontak"
                    className="group inline-flex items-center gap-3 bg-white hover:bg-zinc-100 text-zinc-950 pl-7 pr-3 py-3.5 rounded-full font-bold text-sm tracking-tight transition-all shadow-xl active:scale-[0.98]"
                  >
                    <span>Hubungi Pengurus DLOB</span>
                    <div className="btn-nested-icon w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center group-hover:bg-[#4382C8] transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
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
