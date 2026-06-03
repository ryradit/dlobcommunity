'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Send, Loader, FileText, Eye, Trash2, Globe, Check, Clock, HelpCircle, Search, Filter, Calendar } from 'lucide-react';
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
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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
          userName: 'Admin Dlob'
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

  // Filtered articles list
  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || 
                            article.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white px-4 lg:px-8 py-6 lg:py-8 transition-colors duration-300">
      <div>
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors duration-300">AI Artikel Generator</h1>
            <p className="text-sm text-gray-600 dark:text-zinc-400 font-semibold mt-1 transition-colors duration-300">Buat artikel lengkap dengan satu prompt, lengkap dengan ilustrasi Imagen 3!</p>
          </div>
          
          <button
            onClick={toggleTutorial}
            className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 transition-colors"
            title="Tampilkan panduan fitur"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Tips Section */}
        <div className="artikel-tips mb-6 bg-gradient-to-br from-purple-500/5 to-blue-500/5 dark:from-purple-500/10 dark:to-blue-500/10 border border-purple-200/60 dark:border-purple-500/20 rounded-2xl p-5 shadow-2xs transition-colors duration-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center flex-shrink-0 transition-colors duration-300">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">💡 Tips AI Generator</h3>
              <p className="text-xs text-gray-700 dark:text-zinc-400 leading-relaxed">
                <strong className="text-purple-700 dark:text-purple-300">Kategorisasi Gambar:</strong> Artikel <span className="text-blue-700 dark:text-blue-400 font-bold">nutrisi/makanan</span> → food photography, Artikel <span className="text-emerald-700 dark:text-emerald-400 font-bold">latihan/teknik/stamina</span> → atlet DLOB dengan jersey club. Latihan/stamina/teknik <strong className="text-amber-700 dark:text-amber-400">HARUS</strong> menampilkan atlet, bukan makanan!
              </p>
            </div>
          </div>
        </div>

        {/* Generator Section */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 mb-8 shadow-xs transition-colors duration-300">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-1.5 tracking-tight">Generate Artikel Baru</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4 font-semibold">
                Masukkan topik atau deskripsi artikel. AI akan membuat draf artikel, hero image, struktur sub-bab, serta Call to Action visual.
              </p>

              {/* Production Note */}
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-200/40 dark:border-blue-500/20 rounded-xl transition-colors duration-300">
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-blue-650 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                    <strong>Split API Flow:</strong> Artikel diproses bertahap agar tidak mengalami timeout. Struktur artikel disiapkan dahulu (~30 detik), disusul pembuatan ilustrasi AI Imagen (~70 detik per gambar + 65 detik quota cooldown). <strong>Total durasi: ~10 menit</strong>.
                  </div>
                </div>
              </div>

              <textarea
                value={prompt}
                onFocus={() => {
                  if (error) setError('');
                }}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Contoh: Tulis artikel tentang teknik smash yang efektif untuk pemain pemula, sertakan tips praktis dan kesalahan yang harus dihindari..."
                className="artikel-prompt-input w-full bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 resize-none focus:outline-hidden focus:border-purple-400 focus:ring-1 focus:ring-purple-400 mb-4 font-semibold transition-colors duration-300 text-sm"
                rows={3}
                disabled={isGenerating}
              />

              {error && !isGenerating && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/25 rounded-xl text-red-700 dark:text-red-455 text-xs font-bold transition-colors duration-300">
                  {error}
                </div>
              )}

              {isGenerating && (
                <div className="artikel-progress-tracker mb-4 p-5 bg-purple-500/5 dark:bg-zinc-800/40 border border-purple-200/40 dark:border-purple-500/20 rounded-2xl transition-colors duration-300">
                  <div className="flex flex-col items-center text-center mb-4">
                    <Loader className="w-10 h-10 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-3" />
                    <p className="text-gray-900 dark:text-white font-extrabold text-sm mb-1">Sedang Memproses Pembuatan Artikel</p>
                    {totalSteps > 0 && (
                      <div className="text-[10px] font-extrabold text-gray-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                        Langkah {currentStep} / {totalSteps}
                      </div>
                    )}
                    {progressMessage && (
                      <p className="text-xs text-purple-700 dark:text-purple-455 font-bold">{progressMessage}</p>
                    )}
                  </div>
                  {totalSteps > 0 && (
                    <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden transition-colors duration-300">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-500"
                        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500 dark:text-zinc-500 text-center mt-3.5 font-bold uppercase tracking-wider">
                    ⏱️ Setiap gambar memerlukan cooldown Imagen 3 demi mencegah rate-limit
                  </p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="artikel-generate-button w-full px-5 py-2.5 sm:py-3 sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-zinc-700 dark:disabled:to-zinc-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed border border-transparent shadow-xs"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Sedang Diproses...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Generate Artikel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Generated Article Success & Preview */}
        {generatedArticle && (
          <div className="artikel-preview bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 mb-8 shadow-xs transition-colors duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center transition-colors duration-300">
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white transition-colors duration-300">Artikel Berhasil Dibuat!</h3>
                <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-semibold mt-0.5 transition-colors duration-300">Preview draf artikel lalu klik publish ke laman utama</p>
              </div>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Judul:</span>
                <p className="text-gray-900 dark:text-white font-extrabold mt-0.5">{generatedArticle.title}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Kategori:</span>
                <span className="ml-2 px-2 py-0.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded text-[10px] font-black uppercase tracking-wider border border-purple-100 dark:border-purple-500/20">
                  {generatedArticle.category}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Estimasi Waktu Baca:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-bold">{generatedArticle.read_time} menit</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Status:</span>
                <span className="ml-2 px-2 py-0.5 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded text-[10px] font-black uppercase tracking-wider border border-yellow-100 dark:border-yellow-500/20">
                  {generatedArticle.status}
                </span>
              </div>
              <div>
                <p className="text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider mb-1">Kutipan (Excerpt):</p>
                <p className="text-gray-700 dark:text-zinc-300 font-medium leading-relaxed">{generatedArticle.excerpt}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-2.5 transition-colors duration-300">
              <a
                href={`/artikel/${generatedArticle.slug}`}
                target="_blank"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors font-black uppercase tracking-wider shadow-xs flex-1 sm:flex-none"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </a>
              <button
                onClick={() => handlePublish(generatedArticle.id)}
                className="artikel-publish-button px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors font-black uppercase tracking-wider shadow-xs flex-1 sm:flex-none"
              >
                <Globe className="w-3.5 h-3.5" />
                Publish
              </button>
            </div>
          </div>
        )}

        {/* Articles List */}
        <div className="artikel-list bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs transition-colors duration-300">
          
          {/* Header & Controls */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6 pb-6 border-b border-gray-150 dark:border-zinc-800">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Daftar Artikel Komunitas ({filteredArticles.length})
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 font-semibold">Kelola dan publikasikan artikel edukasi untuk anggota komunitas</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 sm:min-w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Cari judul atau kutipan artikel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-800/30 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 font-semibold focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => loadArticles()}
                className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-transparent dark:border-zinc-800/40 text-gray-700 dark:text-zinc-300 text-xs font-black uppercase tracking-wider rounded-xl transition-colors shrink-0"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mb-6">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {['All', 'Komunitas', 'Nutrisi', 'Latihan', 'Event', 'Lainnya'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-purple-600 border-purple-600 text-white shadow-xs shadow-purple-600/10'
                    : 'bg-gray-50 dark:bg-zinc-800/40 hover:bg-gray-100 dark:hover:bg-zinc-700 border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-400'
                }`}
              >
                {cat === 'All' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>

          {loadError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/25 rounded-xl transition-colors duration-300">
              <p className="text-red-700 dark:text-red-400 font-bold mb-1 text-sm">Database Error</p>
              <p className="text-xs text-red-600 dark:text-red-300/85 mb-3 font-semibold">{loadError}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-500 font-semibold leading-relaxed">
                Silakan verifikasi file <code className="text-rose-500">supabase-articles-table.sql</code> di database editor.
              </p>
            </div>
          )}

          {filteredArticles.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-150 dark:border-zinc-800/80 rounded-2xl">
              <FileText className="w-12 h-12 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-xs text-gray-500 dark:text-zinc-500 font-bold uppercase tracking-wider">
                {articles.length === 0 ? 'Belum ada artikel. Gunakan generator untuk membuat artikel!' : 'Tidak ditemukan artikel yang sesuai kriteria'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => {
                // Determine Category Styles dynamically
                const getCategoryStyle = (catName: string) => {
                  const name = catName.toLowerCase();
                  if (name.includes('komunitas')) {
                    return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40';
                  }
                  if (name.includes('nutrisi')) {
                    return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
                  }
                  if (name.includes('latihan')) {
                    return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
                  }
                  if (name.includes('kesehatan') || name.includes('cedera')) {
                    return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
                  }
                  if (name.includes('tips') || name.includes('trik')) {
                    return 'bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/40';
                  }
                  return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/80';
                };

                const categoryStyle = getCategoryStyle(article.category);

                return (
                  <div
                    key={article.id}
                    className="relative flex flex-col bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl hover:border-purple-500/50 dark:hover:border-purple-400/50 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 hover:shadow-xs transition-all duration-300 overflow-hidden group min-h-64"
                  >
                    {/* Top Accent Strip */}
                    <div className="h-1 bg-gradient-to-r from-purple-500/60 to-blue-500/60" />

                    <div className="p-5 flex-1 flex flex-col">
                      {/* Meta header */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${categoryStyle}`}>
                          {article.category}
                        </span>
                        
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                          article.status === 'published' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40' 
                            : 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-750 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/40'
                        }`}>
                          {article.status}
                        </span>
                      </div>

                      {/* Content */}
                      <h4 className="text-sm font-extrabold text-gray-900 dark:text-zinc-100 mb-2 line-clamp-2 tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {article.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-3 mb-4 leading-relaxed font-normal">
                        {article.excerpt}
                      </p>

                      {/* Bottom Info Grid */}
                      <div className="mt-auto pt-4 border-t border-gray-150 dark:border-zinc-800/80 flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-1.5 text-gray-500 dark:text-zinc-400 font-medium">
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                            <span>{article.read_time_minutes} menit baca</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <Eye className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                            <span>{article.views} views</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px]">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                            <span>{new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="flex items-center gap-1 shrink-0 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/85 p-1 rounded-xl shadow-2xs">
                          <a
                            href={`/artikel/${article.slug}`}
                            target="_blank"
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-blue-600 dark:text-blue-400 transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          
                          {article.status === 'draft' && (
                            <button
                              onClick={() => handlePublish(article.id)}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-emerald-600 dark:text-emerald-400 transition-colors"
                              title="Publish"
                            >
                              <Globe className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDelete(article.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-red-600 dark:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
