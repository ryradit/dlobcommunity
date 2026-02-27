'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
      <section className="relative bg-linear-to-b from-gray-50 to-white py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-[#3e6461]/15 text-[#3e6461] rounded-full text-sm font-semibold">📚 Blog & Tips</span>
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">Artikel Terbaru</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Baca tips, teknik, dan berita terkini seputar badminton dari komunitas DLOB kami
            </p>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-[#3e6461] border-t-transparent rounded-full"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-linear-to-b from-gray-50 to-white py-24 overflow-hidden">
      {/* Decorative badminton elements */}
      <div className="absolute top-0 right-10 text-9xl opacity-5 rotate-45">🏸</div>
      <div className="absolute bottom-20 left-5 text-8xl opacity-5 -rotate-12">🎯</div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-20">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-[#3e6461]/15 text-[#3e6461] rounded-full text-sm font-semibold">📚 Blog & Tips</span>
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-6">Artikel Terbaru</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Baca tips, teknik, dan berita terkini seputar badminton dari komunitas DLOB kami
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {articles.map((article, index) => (
            <Link key={article.id} href={`/artikel/${article.slug}`}>
              <div className="group relative h-full cursor-pointer">
                <div className="absolute inset-0 bg-linear-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
                <div className="relative bg-white rounded-3xl overflow-hidden h-full flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  {/* Article Image */}
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={article.content.hero_image.url}
                      alt={article.content.hero_image.alt || article.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-3 left-3">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[#3e6461] text-xs font-semibold rounded-full">
                        {article.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 flex flex-col grow">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#3e6461] transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-6 grow line-clamp-3">
                      {article.excerpt}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[#3e6461] font-semibold text-sm">Baca selengkapnya</span>
                      <span className="text-[#3e6461] group-hover:translate-x-2 transition-transform duration-300">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link href="/artikel">
            <button className="px-10 py-4 bg-[#1e4843] text-white font-bold rounded-full hover:shadow-xl transition-all duration-300 hover:scale-105 text-lg">
              Lihat Semua Artikel
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
