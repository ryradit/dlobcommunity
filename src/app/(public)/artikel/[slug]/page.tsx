'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Eye, 
  Facebook, 
  Twitter, 
  Instagram, 
  Check, 
  BookOpen, 
  Sparkles, 
  ArrowRight 
} from 'lucide-react';
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
          <div className="animate-spin w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 font-semibold text-sm">Memuat artikel...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  const displayAuthorName = (article.author_name?.toLowerCase().includes('ryan') || article.author_name === 'Admin DLOB' || !article.author_name) 
    ? 'Admin Dlob' 
    : article.author_name;

  return (
    <main className="min-h-screen bg-white transition-colors duration-300">
      {/* Immersive Hero Header */}
      <div className="relative w-full h-[55vh] md:h-[65vh] bg-zinc-950 text-white flex items-end overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${article.content.hero_image.url})`,
            backgroundPosition: 'center',
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/60 to-zinc-950/40 z-10" />

        {/* Floating Back Button */}
        <div className="absolute top-6 left-6 z-20">
          <Link 
            href="/artikel"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:text-white border border-white/10 hover:border-white/20 transition-all font-semibold text-sm shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
        </div>

        {/* Content Container */}
        <div className="relative z-15 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
          {/* Category */}
          <div className="mb-4">
            <span className="px-3.5 py-1 bg-teal-650 text-white text-[10px] font-black rounded-full uppercase tracking-wider border border-teal-500/20 shadow-sm">
              {article.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-6">
            {article.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-300 font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2 normal-case">
              <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white font-extrabold text-sm border border-teal-500/30 shadow-inner">
                {displayAuthorName.charAt(0) || 'A'}
              </div>
              <span className="font-extrabold text-white text-sm">{displayAuthorName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span>
                {new Date(article.published_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>{article.read_time_minutes} menit baca</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-teal-400" />
              <span>{article.views} views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article Body */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Intro */}
        <div className="prose prose-lg max-w-none mb-12">
          <div 
            className="text-gray-800 leading-relaxed text-lg border-l-4 border-teal-600 pl-6 py-1 italic font-medium"
            dangerouslySetInnerHTML={{ __html: article.content.intro.replace(/\n/g, '<br />') }}
          />
        </div>

        {/* Sections */}
        {article.content.sections.map((section, index) => (
          <section key={index} className="mb-16 space-y-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-3">
              <span className="w-2 h-8 bg-[#1e4843] rounded-full shrink-0"></span>
              {section.heading}
            </h2>

            <div 
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed font-medium"
              dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br />') }}
            />

            {section.image && (
              <div className="my-10 rounded-2xl overflow-hidden shadow-lg border border-gray-150 group">
                <img
                  src={section.image.url}
                  alt={section.image.alt}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-102"
                />
                {section.image.alt && (
                  <p className="text-center text-xs text-gray-500 py-3 bg-gray-50 border-t border-gray-100 italic font-semibold">
                    {section.image.alt}
                  </p>
                )}
              </div>
            )}
          </section>
        ))}

        {/* Conclusion */}
        <div className="bg-gradient-to-br from-[#1b3e3b]/5 to-[#122826]/5 rounded-3xl p-8 md:p-10 mb-16 border border-teal-600/10">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
            Kesimpulan
          </h2>
          <div 
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed font-medium"
            dangerouslySetInnerHTML={{ __html: article.content.conclusion.replace(/\n/g, '<br />') }}
          />
        </div>

        {/* CTA Section */}
        {article.content.cta && (
          <div className="relative rounded-3xl overflow-hidden mb-16 h-[340px] group shadow-xl">
            <img
              src={article.content.cta.image.url}
              alt={article.content.cta.image.alt}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 md:p-8 border border-white/20 shadow-2xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <p className="text-white text-base md:text-lg font-bold leading-relaxed max-w-2xl text-center md:text-left">
                    {article.content.cta.text}
                  </p>
                  <Link
                    href="/register"
                    className="shrink-0 group/btn inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1e4843] font-black rounded-xl hover:bg-gray-150 transition-all shadow-lg active:scale-[0.98] text-sm"
                  >
                    <span>Bergabung Sekarang</span> 
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Buttons */}
        <div className="py-10 border-t border-b border-gray-150 flex flex-col items-center gap-5">
          <span className="text-gray-500 font-extrabold text-xs tracking-wider uppercase">Bagikan Artikel</span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleFacebookShare}
              className="flex items-center gap-2 px-5 py-3 bg-[#1877F2] text-white rounded-xl hover:bg-[#0c63d4] transition-all hover:scale-105 shadow-md font-bold text-xs uppercase tracking-wider"
              title="Bagikan ke Facebook"
            >
              <Facebook className="w-4 h-4" />
              <span>Facebook</span>
            </button>

            <button
              onClick={handleTwitterShare}
              className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-all hover:scale-105 shadow-md font-bold text-xs uppercase tracking-wider"
              title="Bagikan ke X"
            >
              <Twitter className="w-4 h-4" />
              <span>X (Twitter)</span>
            </button>

            <button
              onClick={handleInstagramShare}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-xl hover:opacity-90 transition-all hover:scale-105 shadow-md font-bold text-xs uppercase tracking-wider"
              title="Salin link"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Instagram className="w-4 h-4" />
                  <span>Salin Link</span>
                </>
              )}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-emerald-600 font-bold animate-pulse">
              Link berhasil disalin! Silakan bagikan ke Story atau Bio Anda.
            </p>
          )}
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="bg-slate-50 py-20 border-t border-gray-150">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center md:text-left">
              <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-extrabold border border-teal-100 tracking-wider uppercase">🔍 Kategori Terkait</span>
              <h2 className="text-3xl font-black text-gray-900 mt-2 tracking-tight">Artikel Terkait</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/artikel/${related.slug}`}
                  className="group relative h-full cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1b3e3b] to-[#122826] rounded-3xl transform group-hover:scale-[1.03] transition-transform duration-300 -z-10 shadow-lg group-hover:shadow-teal-900/10"></div>
                  <div className="relative bg-white rounded-3xl overflow-hidden h-full flex flex-col shadow-xs border border-gray-150 group-hover:border-transparent transition-all duration-300">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={related.content.hero_image.url}
                        alt={related.content.hero_image.alt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-750"
                      />
                    </div>
                    <div className="p-6 flex flex-col grow">
                      <h3 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-teal-650 transition-colors line-clamp-2 leading-snug">
                        {related.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-2">
                        {related.excerpt}
                      </p>
                    </div>
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
