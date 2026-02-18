'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Send, Loader, FileText, Eye, Trash2, Globe, Check, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  status: string;
  read_time_minutes: number;
  created_at: string;
  views: number;
}

export default function AdminArtikelPage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<any>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [showArticles, setShowArticles] = useState(true);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  // Load existing articles
  useEffect(() => {
    if (showArticles) {
      loadArticles();
    }
  }, [showArticles]);

  async function loadArticles() {
    console.log('🔄 Loading articles...');
    setLoadError('');
    
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, category, excerpt, status, read_time_minutes, created_at, views')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error loading articles:', error);
      setLoadError(error.message);
      setArticles([]);
    } else if (data) {
      console.log('Loaded articles:', data.length);
      
      // Add hardcoded Refleksi 2025 article
      const hardcodedArticle: Article = {
        id: 'refleksi-2025-hardcoded',
        title: 'Refleksi Tahun 2025: Perjalanan Menakjubkan Komunitas DLOB',
        slug: 'refleksi-2025',
        category: 'Komunitas',
        excerpt: 'Merayakan pencapaian dan mempersiapkan masa depan yang gemilang bersama komunitas DLOB di tahun 2025.',
        status: 'published',
        read_time_minutes: 5,
        created_at: '2025-12-20T00:00:00Z',
        views: 0
      };
      
      // Combine hardcoded article with database articles
      setArticles([hardcodedArticle, ...data]);
    }
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError('Silakan masukkan prompt artikel');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedArticle(null);

    try {
      const response = await fetch('/api/ai/article-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt.trim(),
          userId: user?.id,
          userName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'
        }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      // Handle various error status codes
      if (response.status === 504) {
        throw new Error('⏱️ TIMEOUT (504): Generasi artikel memakan waktu 5-8 menit, melebihi batas waktu server production. Artikel mungkin masih sedang dibuat di background. Coba refresh halaman dalam beberapa menit untuk melihat hasilnya.');
      }

      if (response.status === 502 || response.status === 503) {
        throw new Error('⚠️ SERVER ERROR: Server sedang sibuk atau restart. Coba lagi dalam beberapa menit.');
      }

      // Parse response based on content type
      let data;
      if (isJson) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          const text = await response.text().catch(() => 'Unable to read response');
          console.error('Response text:', text);
          throw new Error('❌ PARSING ERROR: Server mengembalikan response yang rusak. Ini biasanya terjadi karena timeout atau error di production.');
        }
      } else {
        // If not JSON, it's likely an error page (HTML)
        const text = await response.text().catch(() => 'Unable to read response');
        console.error('Non-JSON response:', text.substring(0, 200));
        
        if (response.status >= 500) {
          throw new Error('⚠️ SERVER ERROR: Server mengalami error internal. Artikel mungkin masih sedang diproses di background. Coba refresh halaman setelah beberapa menit.');
        } else if (response.status === 408 || response.status === 499) {
          throw new Error('⏱️ REQUEST TIMEOUT: Request timeout sebelum selesai. Artikel mungkin masih sedang diproses. Coba refresh halaman setelah beberapa menit.');
        } else {
          throw new Error(`❌ UNEXPECTED ERROR (${response.status}): Server mengembalikan response tidak valid. Periksa console untuk detail.`);
        }
      }

      // Check for API errors
      if (!response.ok) {
        throw new Error(data?.error || data?.details || `HTTP ${response.status}: Failed to generate article`);
      }

      // Success!
      if (data.article) {
        setGeneratedArticle(data.article);
        setPrompt('');
        loadArticles();
      }

    } catch (err) {
      console.error('Generation error:', err);
      
      // Network errors (fetch failed completely)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('🌐 NETWORK ERROR: Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
        return;
      }

      // Custom error messages already formatted
      if (err instanceof Error && (err.message.includes('TIMEOUT') || err.message.includes('ERROR') || err.message.includes('PARSING'))) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat artikel');
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function handlePublish(id: string) {
    // Skip hardcoded articles
    if (id === 'refleksi-2025-hardcoded') {
      alert('Artikel ini adalah artikel sistem dan tidak dapat diubah statusnya.');
      return;
    }
    
    const { error } = await supabase
      .from('articles')
      .update({ 
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', id);

    if (!error) {
      loadArticles();
      alert('Artikel berhasil dipublish!');
    }
  }

  async function handleDelete(id: string) {
    // Skip hardcoded articles
    if (id === 'refleksi-2025-hardcoded') {
      alert('Artikel ini adalah artikel sistem dan tidak dapat dihapus.');
      return;
    }
    
    if (!confirm('Yakin ingin menghapus artikel ini?')) return;

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (!error) {
      loadArticles();
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AI Artikel Generator</h1>
          <p className="text-zinc-400">Buat artikel lengkap dengan satu prompt, lengkap dengan gambar!</p>
        </div>

        {/* Generator Section */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Generate Artikel Baru</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Masukkan topik atau deskripsi artikel yang ingin dibuat. AI akan membuat artikel lengkap dengan:
                <br />Hero Image • Konten Terstruktur • Gambar Penjelas • CTA Visual
              </p>

              {/* Production Timeout Warning */}
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-xs text-amber-200/90">
                    <strong>Production Note:</strong> Generasi artikel memakan waktu 5-8 menit. Di production, Vercel memiliki batas waktu maksimal 5 menit. Jika timeout (504), artikel mungkin masih sedang dibuat di background. <strong>Refresh halaman setelah beberapa menit</strong> untuk melihat hasilnya.
                  </div>
                </div>
              </div>

              <textarea
                value={prompt}
                onFocus={() => {
                  // Clear any stale errors when user focuses on textarea
                  if (error) setError('');
                }}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  // Clear any stale errors when user starts typing
                  if (error) setError('');
                }}
                placeholder="Contoh: Tulis artikel tentang teknik smash yang efektif untuk pemain pemula, sertakan tips praktis dan kesalahan yang harus dihindari"
                className="w-full bg-zinc-800 border border-white/10 rounded-lg p-4 text-white placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                rows={4}
                disabled={isGenerating}
              />

              {error && !isGenerating && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {isGenerating && (
                <div className="mb-4 p-6 bg-zinc-800/50 border border-purple-500/30 rounded-xl text-center">
                  <Loader className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                  <p className="text-white font-medium mb-2">Sedang Membuat Artikel...</p>
                  <p className="text-sm text-zinc-400">Proses ini memakan waktu 5-8 menit untuk menghasilkan artikel lengkap dengan gambar</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-zinc-700 disabled:to-zinc-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Sedang Membuat Artikel...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Generate Artikel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Generated Article Preview */}
        {generatedArticle && (
          <div className="bg-zinc-900 border border-green-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-semibold text-white">Artikel Berhasil Dibuat!</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-zinc-400">Judul:</span>
                <p className="text-white font-medium">{generatedArticle.title}</p>
              </div>
              <div>
                <span className="text-zinc-400">Kategori:</span>
                <span className="ml-2 px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                  {generatedArticle.category}
                </span>
              </div>
              <div>
                <span className="text-zinc-400">Waktu Baca:</span>
                <span className="ml-2 text-white">{generatedArticle.read_time} menit</span>
              </div>
              <div>
                <span className="text-zinc-400">Status:</span>
                <span className="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                  {generatedArticle.status}
                </span>
              </div>
              <div>
                <p className="text-zinc-400 mb-2">Excerpt:</p>
                <p className="text-white/80 text-sm">{generatedArticle.excerpt}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex gap-3">
              <a
                href={`/artikel/${generatedArticle.slug}`}
                target="_blank"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
              </a>
              <button
                onClick={() => handlePublish(generatedArticle.id)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                <Globe className="w-4 h-4" />
                Publish
              </button>
            </div>
          </div>
        )}

        {/* Articles List */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Artikel yang Telah Dibuat ({articles.length})
            </h3>
            <button
              onClick={() => loadArticles()}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Refresh
            </button>
          </div>

          {loadError && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 font-medium mb-2">Database Error</p>
              <p className="text-sm text-red-300/80 mb-3">{loadError}</p>
              <p className="text-xs text-zinc-400">
                Apakah Anda sudah menjalankan migration SQL? 
                <br />
                Jalankan file <code className="text-blue-400">supabase-articles-table.sql</code> di Supabase SQL Editor.
              </p>
            </div>
          )}

          {articles.length === 0 && !loadError ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">Belum ada artikel. Generate yang pertama!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="bg-zinc-800/50 border border-white/5 rounded-lg p-4 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium mb-1 truncate">{article.title}</h4>
                      <p className="text-sm text-zinc-400 line-clamp-2 mb-2">{article.excerpt}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                        <span className={`px-2 py-0.5 rounded ${
                          article.status === 'published' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {article.status}
                        </span>
                        <span>{article.category}</span>
                        <span>{article.read_time_minutes} min baca</span>
                        <span>{article.views} views</span>
                        <span>{new Date(article.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`/artikel/${article.slug}`}
                        target="_blank"
                        className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-blue-400"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      {article.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(article.id)}
                          className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-green-400"
                          title="Publish"
                        >
                          <Globe className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
