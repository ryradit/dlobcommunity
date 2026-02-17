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

interface GenerationStep {
  id: string;
  label: string;
  duration: number; // in seconds
  icon: string;
}

const GENERATION_STEPS: GenerationStep[] = [
  { id: 'structure', label: 'Membuat struktur artikel & konten', duration: 10, icon: '📝' },
  { id: 'hero', label: 'Menghasilkan Hero Image', duration: 70, icon: '🎨' },
  { id: 'content1', label: 'Menghasilkan gambar konten 1', duration: 70, icon: '🖼️' },
  { id: 'content2', label: 'Menghasilkan gambar konten 2', duration: 70, icon: '🖼️' },
  { id: 'content3', label: 'Menghasilkan gambar konten 3', duration: 70, icon: '🖼️' },
  { id: 'cta', label: 'Menghasilkan CTA Image', duration: 70, icon: '🎯' },
  { id: 'save', label: 'Menyimpan artikel ke database', duration: 5, icon: '💾' }
];

export default function AdminArtikelPage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<any>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [showArticles, setShowArticles] = useState(true);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [isInQueue, setIsInQueue] = useState(false);

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
      console.log('✅ Loaded articles:', data.length);
      
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

  // Poll queue status
  useEffect(() => {
    if (!queueId || !isInQueue) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/ai/article-queue/status?id=${queueId}`);
        const data = await response.json();

        if (data.queueItem) {
          const item = data.queueItem;
          
          setQueuePosition(item.position || 0);
          setProgressPercent(item.progress_percent || 0);
          setCurrentStep(getCurrentStepFromProgress(item.progress_percent || 0));

          if (item.status === 'completed') {
            clearInterval(pollInterval);
            setIsInQueue(false);
            setIsGenerating(false);
            
            // Load the generated article
            const { data: article } = await supabase
              .from('articles')
              .select('*')
              .eq('id', item.article_id)
              .single();
            
            if (article) {
              setGeneratedArticle(article);
              setPrompt('');
              loadArticles();
            }
          } else if (item.status === 'failed') {
            clearInterval(pollInterval);
            setIsInQueue(false);
            setIsGenerating(false);
            setError(item.error_message || 'Generation failed');
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [queueId, isInQueue]);

  function getCurrentStepFromProgress(progress: number): number {
    // Map progress percentage to step index
    const stepSize = 100 / GENERATION_STEPS.length;
    return Math.min(Math.floor(progress / stepSize), GENERATION_STEPS.length - 1);
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError('Silakan masukkan prompt artikel');
      return;
    }

    setIsGenerating(true);
    setIsInQueue(true);
    setError('');
    setGeneratedArticle(null);
    setCurrentStep(0);
    setProgressPercent(0);
    setElapsedTime(0);
    setQueuePosition(0);

    try {
      console.log('📋 Adding to queue:', prompt);
      
      const response = await fetch('/api/ai/article-queue/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt.trim(),
          userId: user?.id,
          userName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'
        })
      });

      const data = await response.json();
      console.log('📦 Queue Response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menambahkan ke antrian');
      }

      setQueueId(data.queueItem.id);
      setQueuePosition(data.queueItem.position);

      console.log('✅ Added to queue, position:', data.queueItem.position);

    } catch (err) {
      console.error('❌ Queue error:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setIsGenerating(false);
      setIsInQueue(false);
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
          <h1 className="text-3xl font-bold text-white mb-2">🤖 AI Artikel Generator</h1>
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
                <br />✨ Hero Image • 📝 Konten Terstruktur • 🖼️ Gambar Penjelas • 🎯 CTA Visual
              </p>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Contoh: Tulis artikel tentang teknik smash yang efektif untuk pemain pemula, sertakan tips praktis dan kesalahan yang harus dihindari"
                className="w-full bg-zinc-800 border border-white/10 rounded-lg p-4 text-white placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                rows={4}
                disabled={isGenerating}
              />

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Progress Bar Section */}
              {isGenerating && (
                <div className="mb-6 p-6 bg-zinc-800/50 border border-purple-500/30 rounded-xl">
                  {/* Queue Position Indicator */}
                 {queuePosition > 0 && progressPercent === 0 && (
                    <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-yellow-400">
                            Menunggu Antrian
                          </p>
                          <p className="text-xs text-yellow-300/80 mt-1">
                            Posisi antrian Anda: <span className="font-bold">#{queuePosition}</span>
                            {queuePosition > 1 && ` • ${queuePosition - 1} artikel sedang diproses`}
                          </p>
                          <p className="text-xs text-yellow-300/60 mt-1">
                            Estimasi waktu tunggu: ~{queuePosition * 6} menit
                          </p>
                        </div>
                        <Loader className="w-5 h-5 text-yellow-400 animate-spin" />
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">
                        {queuePosition > 0 && progressPercent === 0 ? 'Menunggu Giliran...' : 'Progres Pembuatan Artikel'}
                      </span>
                      {progressPercent > 0 && (
                        <span className="text-sm text-zinc-400">
                          ~{Math.floor(GENERATION_STEPS.reduce((acc, s) => acc + s.duration, 0) / 60)}:{(GENERATION_STEPS.reduce((acc, s) => acc + s.duration, 0) % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="relative w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-center text-sm font-medium text-purple-400">
                      {progressPercent > 0 ? `${progressPercent.toFixed(0)}% Selesai` : 'Menunggu...'}
                    </div>
                  </div>

                  {/* Steps List - Only show when processing */}
                  {progressPercent > 0 && (
                  <div className="space-y-3">
                    {GENERATION_STEPS.map((step, index) => {
                      const isCompleted = index < currentStep;
                      const isCurrent = index === currentStep;
                      const isPending = index > currentStep;
                      
                      return (
                        <div 
                          key={step.id}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                            isCurrent ? 'bg-purple-500/20 border border-purple-500/40' :
                            isCompleted ? 'bg-green-500/10 border border-green-500/20' :
                            'bg-zinc-800/30 border border-zinc-700/30'
                          }`}
                        >
                          {/* Icon/Status */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-green-500' :
                            isCurrent ? 'bg-purple-500 animate-pulse' :
                            'bg-zinc-700'
                          }`}>
                            {isCompleted ? (
                              <Check className="w-5 h-5 text-white" />
                            ) : isCurrent ? (
                              <Loader className="w-5 h-5 text-white animate-spin" />
                            ) : (
                              <Clock className="w-4 h-4 text-zinc-500" />
                            )}
                          </div>
                          
                          {/* Step Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{step.icon}</span>
                              <span className={`text-sm font-medium ${
                                isCurrent ? 'text-purple-400' :
                                isCompleted ? 'text-green-400' :
                                'text-zinc-500'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          </div>
                          
                          {/* Duration */}
                          <div className={`text-xs ${
                            isCompleted ? 'text-green-400' :
                            isCurrent ? 'text-purple-400' :
                            'text-zinc-600'
                          }`}>
                            ~{step.duration}s
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
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
              <p className="text-red-400 font-medium mb-2">⚠️ Database Error</p>
              <p className="text-sm text-red-300/80 mb-3">{loadError}</p>
              <p className="text-xs text-zinc-400">
                💡 Apakah Anda sudah menjalankan migration SQL? 
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
