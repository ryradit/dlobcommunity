'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Eye, Facebook, Twitter, Instagram, Copy, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ArticleContent {
  hero_image: { url: string; alt: string; prompt: string };
  intro: string;
  sections: Array<{
    heading: string;
    content: string;
    image: { url: string; alt: string; prompt: string } | null;
  }>;
  conclusion: string;
  cta: {
    text: string;
    image: { url: string; alt: string; prompt: string };
  };
}

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  excerpt: string;
  content: ArticleContent;
  author_name: string;
  read_time_minutes: number;
  published_at: string;
  views: number;
  seo_title: string;
  seo_description: string;
}

export default function ArtikelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (params.slug) {
      fetchArticle(params.slug as string);
    }
  }, [params.slug]);

  async function fetchArticle(slug: string) {
    try {
      // Fetch article (admins can see drafts, public only sees published)
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        router.push('/artikel');
        return;
      }

      setArticle(data);

      // Increment view count
      await supabase.rpc('increment_article_views', { article_id: data.id });

      // Fetch related articles (same category)
      const { data: related } = await supabase
        .from('articles')
        .select('*')
        .eq('category', data.category)
        .eq('status', 'published')
        .neq('id', data.id)
        .limit(3);

      if (related) {
        setRelatedArticles(related);
      }

    } catch (err) {
      console.error('Error fetching article:', err);
      router.push('/artikel');
    } finally {
      setLoading(false);
    }
  }

  const handleFacebookShare = () => {
    if (!article) return;
    const shareUrl = `${window.location.origin}/artikel/${article.slug}`;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleTwitterShare = () => {
    if (!article) return;
    const shareUrl = `${window.location.origin}/artikel/${article.slug}`;
    const shareText = article.title;
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleInstagramShare = async () => {
    if (!article) return;
    const shareUrl = `${window.location.origin}/artikel/${article.slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#3e6461] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat artikel...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/artikel"
            className="inline-flex items-center gap-2 text-[#3e6461] hover:text-[#2d4a47] font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Artikel
          </Link>
        </div>
      </header>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category & Tags */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="px-3 py-1 bg-[#3e6461]/10 text-[#3e6461] text-sm font-semibold rounded-full">
            {article.category}
          </span>
          {article.tags && article.tags.map((tag, idx) => (
            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
              #{tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          {article.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-8 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#3e6461] flex items-center justify-center text-white font-semibold">
              {article.author_name?.charAt(0) || 'A'}
            </div>
            <span className="font-medium">{article.author_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {new Date(article.published_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{article.read_time_minutes} menit baca</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="text-sm">{article.views} views</span>
          </div>
        </div>

        {/* Hero Image (Bagian Atas) */}
        <div className="mb-12 rounded-2xl overflow-hidden">
          <img
            src={article.content.hero_image.url}
            alt={article.content.hero_image.alt}
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Intro (Paragraf Pembuka) */}
        <div className="prose prose-lg max-w-none mb-12">
          <div 
            className="text-gray-700 leading-relaxed text-lg"
            dangerouslySetInnerHTML={{ __html: article.content.intro.replace(/\n/g, '<br />') }}
          />
        </div>

        {/* Sections with Images (Bagian Tengah) */}
        {article.content.sections.map((section, index) => (
          <section key={index} className="mb-12">
            {/* Sub-Heading */}
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {section.heading}
            </h2>

            {/* Section Content */}
            <div 
              className="prose prose-lg max-w-none mb-8 text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br />') }}
            />

            {/* Section Image (Gambar Penjelas - Breaking the Wall) */}
            {section.image && (
              <div className="my-8 rounded-xl overflow-hidden">
                <img
                  src={section.image.url}
                  alt={section.image.alt}
                  className="w-full h-auto object-cover"
                />
                {section.image.alt && (
                  <p className="text-center text-sm text-gray-500 mt-3 italic">
                    {section.image.alt}
                  </p>
                )}
              </div>
            )}
          </section>
        ))}

        {/* Conclusion (Kesimpulan) */}
        <div className="bg-gradient-to-r from-[#3e6461]/5 to-[#2d4a47]/5 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Kesimpulan</h2>
          <div 
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.content.conclusion.replace(/\n/g, '<br />') }}
          />
        </div>

        {/* CTA Section (Bagian Bawah) - Modern Design */}
        {article.content.cta && (
          <div className="relative rounded-3xl overflow-hidden mb-12 h-96 group">
            {/* Background Image */}
            <img
              src={article.content.cta.image.url}
              alt={article.content.cta.image.alt}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Subtle gradient overlay - only at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            
            {/* Content positioned at bottom with glass morphism effect */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="backdrop-blur-md bg-white/10 rounded-2xl p-8 border border-white/20 shadow-2xl">
                <div className="max-w-3xl">
                  <p className="text-white/90 text-lg mb-4 font-medium leading-relaxed">
                    {article.content.cta.text}
                  </p>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1e4843] font-semibold rounded-xl hover:bg-gray-100 hover:gap-3 transition-all shadow-lg hover:shadow-xl"
                  >
                    Bergabung Sekarang 
                    <span className="text-lg">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Buttons */}
        <div className="py-8 border-t border-b border-gray-200">
          <div className="flex flex-col items-center gap-4">
            <span className="text-gray-600 font-medium">Bagikan Artikel:</span>
            <div className="flex items-center gap-3">
              {/* Facebook Share */}
              <button
                onClick={handleFacebookShare}
                className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#0c63d4] transition-colors shadow-md hover:shadow-lg"
                title="Bagikan ke Facebook"
              >
                <Facebook className="w-5 h-5" />
                <span className="font-medium">Facebook</span>
              </button>

              {/* Twitter/X Share */}
              <button
                onClick={handleTwitterShare}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg"
                title="Bagikan ke X (Twitter)"
              >
                <Twitter className="w-5 h-5" />
                <span className="font-medium">X</span>
              </button>

              {/* Instagram Share (Copy Link) */}
              <button
                onClick={handleInstagramShare}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-lg hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
                title="Salin link untuk Instagram"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Instagram className="w-5 h-5" />
                    <span className="font-medium">Instagram</span>
                  </>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-sm text-green-600 font-medium">
                Link berhasil disalin! Bagikan di Instagram Story atau Bio.
              </p>
            )}
          </div>
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Artikel Terkait</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/artikel/${related.slug}`}
                  className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={related.content.hero_image.url}
                      alt={related.content.hero_image.alt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#3e6461] transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {related.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
