'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Clock, ArrowUpRight, BookOpen } from "lucide-react";

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
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 100, damping: 16 },
  },
};

const headingVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
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
    <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-[#4382C8]/6 to-transparent" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-[#4382C8]/4 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Section Header */}
        <motion.div
          className="mb-16 md:mb-20 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={headingVariants}
        >
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4382C8] mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              Blog & Tips
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Artikel Terbaru
            </h2>
            <p className="text-slate-500 text-base mt-3 max-w-md leading-relaxed">
              Tips, teknik, dan berita terkini seputar badminton dari komunitas DLOB
            </p>
          </div>
          <Link
            href="/artikel"
            className="shrink-0 inline-flex items-center gap-2 text-sm font-bold text-zinc-900 hover:text-[#4382C8] transition-colors group"
          >
            Lihat Semua
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </motion.div>

        {/* Animated Skeleton Loader */}
        {loading && (
          <div className="grid md:grid-cols-3 gap-8">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="h-52 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer bg-[length:400%_100%]" />
                <div className="p-6 space-y-3">
                  <div className="h-3 rounded-full bg-gray-100 animate-pulse w-1/3" />
                  <div className="h-5 rounded-full bg-gray-200 animate-pulse w-4/5" />
                  <div className="h-5 rounded-full bg-gray-200 animate-pulse w-3/5" />
                  <div className="h-3 rounded-full bg-gray-100 animate-pulse w-1/2 mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Article Cards */}
        {!loading && (
          <motion.div
            className="grid md:grid-cols-3 gap-8 mb-14"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {articles.map((article) => (
              <motion.div key={article.id} variants={cardVariants}>
                <Link href={`/artikel/${article.slug}`} className="block h-full">
                  <motion.div
                    className="group relative h-full rounded-3xl overflow-hidden border border-gray-100 shadow-md bg-white"
                    whileHover={{
                      y: -6,
                      boxShadow: '0 20px 48px -8px rgba(67, 130, 200, 0.28), 0 4px 16px -4px rgba(0,0,0,0.08)',
                      borderColor: 'rgba(67, 130, 200, 0.3)',
                      transition: { type: 'spring', stiffness: 300, damping: 22 },
                    }}
                  >

                    {/* Article Image */}
                    <div className="relative w-full h-52 overflow-hidden">
                      <Image
                        src={article.content.hero_image.url}
                        alt={article.content.hero_image.alt || article.title}
                        fill
                        className="object-cover group-hover:scale-[1.07] transition-transform duration-600"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                      {/* Category badge */}
                      <div className="absolute bottom-3 left-3">
                        <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-[#4382C8] text-xs font-bold rounded-full shadow-sm">
                          {article.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col grow">
                      {/* Meta row */}
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mb-3">
                        <span>{formatDate(article.published_at)}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getReadingTime(article.excerpt)} min baca
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#4382C8] transition-colors leading-snug line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed grow line-clamp-2">
                        {article.excerpt}
                      </p>

                      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">
                        <span className="text-[#4382C8] font-bold text-sm">Baca selengkapnya</span>
                        <span className="text-[#4382C8] group-hover:translate-x-2 transition-transform duration-300 font-bold">→</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && articles.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Belum ada artikel yang dipublikasikan</p>
          </div>
        )}

        {/* CTA Button */}
        {!loading && articles.length > 0 && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/artikel">
              <motion.button
                className="px-10 py-4 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-shadow text-sm"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Lihat Semua Artikel
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
