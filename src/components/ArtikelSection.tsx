'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Clock, ArrowUpRight, ArrowRight, BookOpen } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  published_at: string;
  content: {
    hero_image: { url: string; alt: string };
  };
}

function getReadingTime(text: string) {
  const words = text?.split(' ').length ?? 0;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const SKELETON_COUNT = 3;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 18 },
  },
};

export default function ArtikelSection() {
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
        .order('published_at', { ascending: false })
        .limit(3);

      if (!error && data) setArticles(data);
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative py-24 md:py-36 bg-white overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-gradient-radial from-[#4382C8]/6 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Section Header */}
        <div className="mb-14 md:mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-950 tracking-tight leading-[1.08]">
              Wawasan & Taktik<br />
              <span className="text-[#4382C8]">Bulu Tangkis.</span>
            </h2>
            <p className="text-zinc-600 text-base max-w-lg leading-relaxed">
              Panduan latihan, strategi match, dan update kegiatan terbaru dari ekosistem DLOB.
            </p>
          </div>

          <Link
            href="/artikel"
            className="group shrink-0 inline-flex items-center gap-2 text-sm font-bold text-zinc-900 hover:text-[#4382C8] transition-colors"
          >
            <span>Lihat Arsip Lengkap</span>
            <div className="w-7 h-7 rounded-full bg-zinc-100 group-hover:bg-[#4382C8]/10 flex items-center justify-center transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Animated Skeleton Loader (Doppelrand) */}
        {loading && (
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className="p-1.5 rounded-[2rem] bg-zinc-100 border border-zinc-200/80">
                <div className="rounded-[calc(2rem-0.375rem)] overflow-hidden bg-white">
                  <div className="h-52 bg-zinc-200/60 animate-pulse" />
                  <div className="p-6 space-y-3">
                    <div className="h-3 rounded-full bg-zinc-200/60 animate-pulse w-1/3" />
                    <div className="h-5 rounded-full bg-zinc-200/80 animate-pulse w-4/5" />
                    <div className="h-4 rounded-full bg-zinc-100 animate-pulse w-3/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Article Cards (Doppelrand Architecture) */}
        {!loading && (
          <motion.div
            className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {articles.map((article) => (
              <motion.div key={article.id} variants={cardVariants}>
                <Link href={`/artikel/${article.slug}`} className="block h-full group">
                  {/* Outer Shell (Doppelrand) */}
                  <div className="h-full p-1.5 rounded-[2rem] bg-zinc-100/90 hover:bg-zinc-200/70 border border-zinc-200/80 shadow-md group-hover:shadow-xl group-hover:shadow-[#4382C8]/10 transition-all duration-300">
                    {/* Inner Core */}
                    <div className="h-full rounded-[calc(2rem-0.375rem)] overflow-hidden bg-white flex flex-col">
                      
                      {/* Image Preview */}
                      <div className="relative w-full h-52 overflow-hidden bg-zinc-950">
                        <Image
                          src={article.content.hero_image.url}
                          alt={article.content.hero_image.alt || article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent pointer-events-none" />
                        
                        {/* Category Tag */}
                        <div className="absolute bottom-3 left-3">
                          <span className="px-3 py-1 bg-zinc-950/80 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider rounded-full border border-white/20">
                            {article.category}
                          </span>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-6 flex flex-col grow justify-between">
                        <div className="space-y-3">
                          {/* Metadata row */}
                          <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
                            <span>{formatDate(article.published_at)}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              <Clock className="w-3 h-3 text-zinc-400" />
                              {getReadingTime(article.excerpt)} min
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-zinc-950 group-hover:text-[#4382C8] transition-colors leading-snug line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed line-clamp-2">
                            {article.excerpt}
                          </p>
                        </div>

                        {/* Trailing link */}
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-100">
                          <span className="text-xs font-bold text-zinc-900 group-hover:text-[#4382C8] transition-colors">
                            Baca Artikel
                          </span>
                          <div className="w-6 h-6 rounded-full bg-zinc-100 group-hover:bg-[#4382C8] flex items-center justify-center transition-colors">
                            <ArrowRight className="w-3 h-3 text-zinc-700 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && articles.length === 0 && (
          <div className="text-center py-16 text-zinc-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-sm">Belum ada artikel yang dipublikasikan</p>
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && articles.length > 0 && (
          <div className="text-center pt-2">
            <Link
              href="/artikel"
              className="group inline-flex items-center gap-3 bg-zinc-950 hover:bg-zinc-900 text-white pl-6 pr-2.5 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg active:scale-[0.98]"
            >
              <span>Semua Publikasi</span>
              <div className="btn-nested-icon w-7 h-7 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-[#4382C8] transition-colors">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
