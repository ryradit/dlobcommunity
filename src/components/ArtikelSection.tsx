'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, BookOpen, ArrowRight, Newspaper } from "lucide-react";

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

      if (!error && data) {
        setArticles(data);
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="relative bg-gradient-to-b from-slate-50 to-white py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-extrabold border border-teal-100 tracking-wider uppercase">📚 Blog & Tips</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">Artikel Terbaru</h2>
            <p className="text-base text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Baca tips, teknik, dan berita terkini seputar badminton dari komunitas DLOB kami.
            </p>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-gradient-to-b from-slate-50 to-white py-24 overflow-hidden">
      {/* Decorative badminton elements */}
      <div className="absolute top-0 right-10 text-9xl opacity-5 rotate-45 pointer-events-none select-none">🏸</div>
      <div className="absolute bottom-20 left-5 text-8xl opacity-5 -rotate-12 pointer-events-none select-none">🎯</div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-20 space-y-4">
          <div className="inline-block">
            <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-extrabold border border-teal-100 tracking-wider uppercase flex items-center gap-2">
              <Newspaper className="w-3.5 h-3.5" /> BLOG & TIPS
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">Artikel Terbaru</h2>
          <p className="text-base text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Baca tips, teknik, dan berita terkini seputar badminton dari komunitas DLOB kami.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {articles.map((article) => {
            const formattedDate = article.published_at 
              ? new Date(article.published_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              : '';
            
            const wordsCount = article.excerpt ? article.excerpt.split(' ').length : 0;
            const readTime = Math.max(1, Math.round(wordsCount / 30));

            return (
              <Link key={article.id} href={`/artikel/${article.slug}`}>
                <div className="group relative h-full cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1b3e3b] to-[#122826] rounded-3xl transform group-hover:scale-[1.03] transition-transform duration-300 -z-10 shadow-lg group-hover:shadow-teal-900/10"></div>
                  <div className="relative bg-white rounded-3xl overflow-hidden h-full flex flex-col shadow-xs border border-gray-150 group-hover:border-transparent transition-all duration-300">
                    {/* Article Image */}
                    <div className="relative w-full h-52 overflow-hidden">
                      <Image
                        src={article.content.hero_image.url}
                        alt={article.content.hero_image.alt || article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-[750ms]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-teal-800 text-[10px] font-extrabold rounded-full tracking-wider uppercase border border-white/10 shadow-sm">
                          {article.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col grow space-y-4">
                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {formattedDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formattedDate}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{readTime} Menit Baca</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xl font-extrabold text-gray-900 leading-snug group-hover:text-teal-650 transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-3">
                          {article.excerpt}
                        </p>
                      </div>
                      
                      <div className="pt-2 mt-auto flex items-center gap-1.5 text-teal-700 font-extrabold text-xs tracking-wider uppercase">
                        <span>Baca Selengkapnya</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center">
          <Link href="/artikel">
            <button className="group inline-flex items-center gap-2 px-10 py-4 bg-[#1e4843] text-white font-extrabold rounded-xl hover:bg-[#162f2c] shadow-md hover:shadow-xl active:scale-[0.98] transition-all duration-300 text-base">
              <span>Lihat Semua Artikel</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
