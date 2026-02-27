'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Send, Loader, FileText, Eye, Trash2, Globe, Check, Clock, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTutorial } from '@/hooks/useTutorial';
import { getTutorialSteps } from '@/lib/tutorialSteps';
import TutorialOverlay from '@/components/TutorialOverlay';

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
  const [progressMessage, setProgressMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  // Tutorial
  const tutorialSteps = getTutorialSteps('artikel');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('admin-artikel', tutorialSteps);

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
    setProgressMessage('');
    setCurrentStep(0);
    setTotalSteps(0);

    try {
      // Step 1: Generate article structure with fallback images
      setProgressMessage('📝 Step 1: Membuat struktur artikel...');
      setCurrentStep(1);
      setTotalSteps(1); // Will update when we know image count

      const structureResponse = await fetch('/api/ai/article-generator/create-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt.trim(),
          userId: user?.id,
          userName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'
        }),
      });

      const contentType = structureResponse.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      if (!isJson) {
        const text = await structureResponse.text().catch(() => 'Unable to read response');
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('❌ Server mengembalikan response tidak valid');
      }

      const structureData = await structureResponse.json();

      if (!structureResponse.ok) {
        throw new Error(structureData?.error || 'Failed to create article structure');
      }

      const article = structureData.article;
      const imagesToGenerate = structureData.imagesToGenerate;

      console.log('✅ Article structure created:', article.id);
      console.log('📸 Images to generate:', imagesToGenerate);

      // Calculate total steps: structure + all images
      const bodyImagesCount = imagesToGenerate.body ? imagesToGenerate.body.length : 0;
      const totalImages = 1 + bodyImagesCount + 1; // hero + body + cta
      setTotalSteps(1 + totalImages);

      setProgressMessage(`✅ Artikel dibuat! Sekarang menghasilkan ${totalImages} gambar AI...`);

      // Helper function to wait between image generations (quota cooldown)
      const waitForQuota = async (seconds: number = 65) => {
        for (let i = seconds; i > 0; i--) {
          setProgressMessage(`⏳ Cooldown: menunggu ${i} detik untuk quota Imagen 3...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      };

      // Step 2: Generate hero image
      setCurrentStep(2);
      setProgressMessage('🎨 Step 2: Menghasilkan Hero Image...');

      await generateSingleImage(
        article.id,
        imagesToGenerate.hero.prompt,
        'hero',
        0,
        undefined
      );

      console.log('✅ Hero image generated');

      // Wait for quota before next image
      await waitForQuota();

      // Step 3: Generate body images
      let stepNum = 3;
      if (imagesToGenerate.body && imagesToGenerate.body.length > 0) {
        for (let i = 0; i < imagesToGenerate.body.length; i++) {
          const bodyImage = imagesToGenerate.body[i];
          setCurrentStep(stepNum);
          setProgressMessage(`🎨 Step ${stepNum}: Menghasilkan gambar konten ${i + 1}/${imagesToGenerate.body.length}...`);

          await generateSingleImage(
            article.id,
            bodyImage.prompt,
            'body',
            bodyImage.index,
            bodyImage.sectionIndex
          );

          console.log(`✅ Body image ${i + 1} generated`);

          // Wait for quota before next image (except for last one)
          if (i < imagesToGenerate.body.length - 1 || true) { // Always wait before CTA
            await waitForQuota();
          }

          stepNum++;
        }
      }

      // Step 4: Generate CTA image
      setCurrentStep(stepNum);
      setProgressMessage(`🎨 Step ${stepNum}: Menghasilkan CTA Image...`);

      await generateSingleImage(
        article.id,
        imagesToGenerate.cta.prompt,
        'cta',
        0,
        undefined
      );

      console.log('✅ CTA image generated');

      // Success!
      setProgressMessage('✅ Artikel dan semua gambar berhasil dibuat!');
      setGeneratedArticle(article);
      setPrompt('');
      
      // Reload articles list
      setTimeout(() => {
        loadArticles();
      }, 1000);

    } catch (err) {
      console.error('Generation error:', err);
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('🌐 NETWORK ERROR: Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      } else {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat artikel');
      }
    } finally {
      setIsGenerating(false);
      setProgressMessage('');
    }
  }

  // Helper function to generate a single image
  async function generateSingleImage(
    articleId: string,
    prompt: string,
    type: 'hero' | 'body' | 'cta',
    index: number,
    sectionIndex?: number
  ) {
    const response = await fetch('/api/ai/article-generator/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleId,
        prompt,
        type,
        index,
        sectionIndex
      }),
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!isJson) {
      const text = await response.text().catch(() => 'Unable to read response');
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error('❌ Server mengembalikan response tidak valid saat generate image');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || `Failed to generate ${type} image`);
    }

    return data;
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
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white py-4 lg:py-8 pr-4 lg:pr-8 pl-6 transition-colors duration-300">
      <div>
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gray-900 dark:text-white transition-colors duration-300">AI Artikel Generator</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 font-medium transition-colors duration-300">Buat artikel lengkap dengan satu prompt, lengkap dengan gambar!</p>
          </div>
          
          <button
            onClick={toggleTutorial}
            className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-colors"
            title="Tampilkan panduan fitur"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Tips Section */}
        <div className="artikel-tips mb-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-300 dark:border-purple-500/30 rounded-xl p-4 shadow-sm transition-colors duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-200 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0 transition-colors duration-300">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 transition-colors duration-300">💡 Tips AI Generator</h3>
              <p className="text-xs text-gray-700 dark:text-zinc-400 leading-relaxed transition-colors duration-300">
                <strong className="text-purple-700 dark:text-purple-300 transition-colors duration-300">Image categorization:</strong> Artikel <span className="text-blue-700 dark:text-blue-300 transition-colors duration-300">nutrisi/makanan</span> → food photography, Artikel <span className="text-green-700 dark:text-green-300 transition-colors duration-300">latihan/teknik/stamina</span> → atlet DLOB jersey. Training/stamina/teknik <strong className="text-amber-700 dark:text-amber-300 transition-colors duration-300">HARUS</strong> menampilkan atlet, bukan makanan!
              </p>
            </div>
          </div>
        </div>

        {/* Generator Section */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-2xl p-6 mb-8 shadow-sm transition-colors duration-300">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Generate Artikel Baru</h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4 font-medium transition-colors duration-300">
                Masukkan topik atau deskripsi artikel yang ingin dibuat. AI akan membuat artikel lengkap dengan:
                <br />Hero Image • Konten Terstruktur • Gambar Penjelas • CTA Visual
              </p>

              {/* Production Note */}
              <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-500/10 border-2 border-blue-300 dark:border-blue-500/20 rounded-lg transition-colors duration-300">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs text-blue-800 dark:text-blue-200/90 font-medium transition-colors duration-300">
                    <strong>Split API Approach:</strong> Artikel dibuat dalam beberapa langkah terpisah untuk menghindari timeout. Struktur artikel dibuat dulu (~30 detik), lalu gambar AI dihasilkan satu per satu (~70 detik/gambar + 65 detik cooldown). <strong>Total waktu: ~10-11 menit</strong> untuk artikel dengan 5 gambar. Anda bisa melihat progress real-time di layar.
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
                className="artikel-prompt-input w-full bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-lg p-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4 font-medium transition-colors duration-300"
                rows={4}
                disabled={isGenerating}
              />

              {error && !isGenerating && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-500/10 border-2 border-red-300 dark:border-red-500/30 rounded-lg text-red-700 dark:text-red-400 text-sm font-semibold transition-colors duration-300">
                  {error}
                </div>
              )}

              {isGenerating && (
                <div className="artikel-progress-tracker mb-4 p-6 bg-purple-50 dark:bg-zinc-800/50 border-2 border-purple-300 dark:border-purple-500/30 rounded-xl transition-colors duration-300">
                  <div className="flex flex-col items-center text-center mb-4">
                    <Loader className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4 transition-colors duration-300" />
                    <p className="text-gray-900 dark:text-white font-bold mb-2 transition-colors duration-300">Sedang Membuat Artikel...</p>
                    {totalSteps > 0 && (
                      <div className="text-sm text-gray-700 dark:text-zinc-400 mb-3 font-semibold transition-colors duration-300">
                        Step {currentStep} / {totalSteps}
                      </div>
                    )}
                    {progressMessage && (
                      <p className="text-sm text-purple-700 dark:text-purple-300 mb-3 font-medium transition-colors duration-300">{progressMessage}</p>
                    )}
                  </div>
                  {totalSteps > 0 && (
                    <div className="w-full bg-gray-300 dark:bg-zinc-700 rounded-full h-2 overflow-hidden transition-colors duration-300">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 transition-all duration-500"
                        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-600 dark:text-zinc-500 text-center mt-4 font-medium transition-colors duration-300">
                    ⏱️ Setiap gambar membutuhkan ~70 detik + 65 detik cooldown
                  </p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="artikel-generate-button w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-zinc-700 dark:disabled:to-zinc-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed border-2 border-transparent hover:border-purple-400 shadow-sm"
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

        {/* Generated Article Success & Preview */}
        {generatedArticle && (
          <div className="artikel-preview bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-2xl p-6 mb-8 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center transition-colors duration-300">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400 transition-colors duration-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-300">Artikel Berhasil Dibuat!</h3>
                <p className="text-xs text-gray-600 dark:text-zinc-400 font-medium transition-colors duration-300">Preview artikel dan publikasikan ke halaman publik</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-zinc-400 font-semibold transition-colors duration-300">Judul:</span>
                <p className="text-gray-900 dark:text-white font-bold transition-colors duration-300">{generatedArticle.title}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-zinc-400 font-semibold transition-colors duration-300">Kategori:</span>
                <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 rounded text-xs font-bold border border-purple-300 dark:border-transparent transition-colors duration-300">
                  {generatedArticle.category}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-zinc-400 font-semibold transition-colors duration-300">Waktu Baca:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-bold transition-colors duration-300">{generatedArticle.read_time} menit</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-zinc-400 font-semibold transition-colors duration-300">Status:</span>
                <span className="ml-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded text-xs font-bold border border-yellow-300 dark:border-transparent transition-colors duration-300">
                  {generatedArticle.status}
                </span>
              </div>
              <div>
                <p className="text-gray-600 dark:text-zinc-400 mb-2 font-semibold transition-colors duration-300">Excerpt:</p>
                <p className="text-gray-700 dark:text-white/80 text-sm font-medium transition-colors duration-300">{generatedArticle.excerpt}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t-2 border-gray-200 dark:border-white/10 flex gap-3 transition-colors duration-300">
              <a
                href={`/artikel/${generatedArticle.slug}`}
                target="_blank"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 transition-colors font-bold border-2 border-blue-600 shadow-sm"
              >
                <Eye className="w-4 h-4" />
                Preview
              </a>
              <button
                onClick={() => handlePublish(generatedArticle.id)}
                className="artikel-publish-button px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm flex items-center gap-2 transition-colors font-bold border-2 border-green-600 shadow-sm"
              >
                <Globe className="w-4 h-4" />
                Publish
              </button>
            </div>
          </div>
        )}

        {/* Articles List */}
        <div className="artikel-list bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-2xl p-6 shadow-sm transition-colors duration300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
              <FileText className="w-5 h-5" />
              Artikel yang Telah Dibuat ({articles.length})
            </h3>
            <button
              onClick={() => loadArticles()}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-semibold"
            >
              Refresh
            </button>
          </div>

          {loadError && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-500/10 border-2 border-red-300 dark:border-red-500/30 rounded-lg transition-colors duration-300">
              <p className="text-red-700 dark:text-red-400 font-bold mb-2">Database Error</p>
              <p className="text-sm text-red-600 dark:text-red-300/80 mb-3 font-medium">{loadError}</p>
              <p className="text-xs text-gray-600 dark:text-zinc-400 font-medium">
                Apakah Anda sudah menjalankan migration SQL? 
                <br />
                Jalankan file <code className="text-blue-600 dark:text-blue-400">supabase-articles-table.sql</code> di Supabase SQL Editor.
              </p>
            </div>
          )}

          {articles.length === 0 && !loadError ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 dark:text-zinc-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-zinc-500 font-semibold">Belum ada artikel. Generate yang pertama!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="bg-gray-100 dark:bg-zinc-800/50 border-2 border-gray-200 dark:border-white/5 rounded-lg p-4 hover:border-gray-400 dark:hover:border-white/10 transition-colors duration-300 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-900 dark:text-white font-bold mb-1 truncate transition-colors duration-300">{article.title}</h4>
                      <p className="text-sm text-gray-700 dark:text-zinc-400 line-clamp-2 mb-2 font-medium transition-colors duration-300">{article.excerpt}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-zinc-500 font-medium">
                        <span className={`px-2 py-0.5 rounded border font-semibold ${
                          article.status === 'published' 
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-300 dark:border-transparent' 
                            : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-transparent'
                        } transition-colors duration-300`}>
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
                        className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      {article.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(article.id)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors text-green-600 dark:text-green-400"
                          title="Publish"
                        >
                          <Globe className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors text-red-600 dark:text-red-400"
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

      {/* Tutorial Overlay */}
      {isTutorialActive && (
        <TutorialOverlay
          steps={tutorialSteps}
          isActive={isTutorialActive}
          onClose={closeTutorial}
          tutorialKey="admin-artikel"
        />
      )}
    </div>
  );
}
