'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Heart,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Lock,
  AlertCircle,
  ShoppingBag,
  Info,
  Camera,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Film,
  Search
} from 'lucide-react';
import SmartCropImage from '@/components/SmartCropImage';
import ZoomableImage from '@/components/ZoomableImage';
import AISizeRecommenderModal from '@/components/store/AISizeRecommenderModal';
import { JerseyBatch, DEFAULT_JERSEY_BATCHES } from '@/lib/jerseyBatches';

export type SizeCategory = 'dewasa' | 'kids' | 'balita';

export interface SizeOption {
  id: string;
  label: string;
  category: SizeCategory;
  keterangan?: string;
  tinggi: number;
  lebar: number;
  pendekPrice: number;
  panjangPrice: number;
}

const allSizeOptions: SizeOption[] = [
  // Dewasa
  { id: 'XS', label: 'XS', category: 'dewasa', keterangan: 'Dewasa Standar', tinggi: 65, lebar: 45, pendekPrice: 110000, panjangPrice: 120000 },
  { id: 'S', label: 'S', category: 'dewasa', keterangan: 'Dewasa Standar', tinggi: 68, lebar: 48, pendekPrice: 110000, panjangPrice: 120000 },
  { id: 'M', label: 'M', category: 'dewasa', keterangan: 'Dewasa Standar', tinggi: 71, lebar: 51, pendekPrice: 110000, panjangPrice: 120000 },
  { id: 'L', label: 'L', category: 'dewasa', keterangan: 'Dewasa Standar', tinggi: 74, lebar: 54, pendekPrice: 110000, panjangPrice: 120000 },
  { id: 'XL', label: 'XL', category: 'dewasa', keterangan: 'Dewasa Standar', tinggi: 77, lebar: 57, pendekPrice: 110000, panjangPrice: 120000 },
  { id: 'XXL', label: 'XXL', category: 'dewasa', keterangan: 'Dewasa Big Size', tinggi: 80, lebar: 62, pendekPrice: 120000, panjangPrice: 130000 },
  { id: '3XL', label: '3XL', category: 'dewasa', keterangan: 'Dewasa Jumbo', tinggi: 83, lebar: 65, pendekPrice: 130000, panjangPrice: 140000 },
  // Kids
  { id: 'Kids S', label: 'Kids S', category: 'kids', keterangan: 'Usia 7-8 Tahun', tinggi: 57, lebar: 43, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Kids M', label: 'Kids M', category: 'kids', keterangan: 'Usia 8-9 Tahun', tinggi: 59, lebar: 44, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Kids L', label: 'Kids L', category: 'kids', keterangan: 'Usia 10-11 Tahun', tinggi: 62, lebar: 46, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Kids XL', label: 'Kids XL', category: 'kids', keterangan: 'Usia 12-13 Tahun', tinggi: 65, lebar: 48, pendekPrice: 100000, panjangPrice: 110000 },
  // Balita
  { id: 'Balita XS', label: 'Balita XS', category: 'balita', keterangan: 'Usia 1-2 Tahun', tinggi: 36, lebar: 28, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Balita S', label: 'Balita S', category: 'balita', keterangan: 'Usia 2-3 Tahun', tinggi: 40, lebar: 31, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Balita M', label: 'Balita M', category: 'balita', keterangan: 'Usia 3-4 Tahun', tinggi: 43, lebar: 34, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Balita L', label: 'Balita L', category: 'balita', keterangan: 'Usia 4-5 Tahun', tinggi: 45, lebar: 36, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Balita XL', label: 'Balita XL', category: 'balita', keterangan: 'Usia 5-6 Tahun', tinggi: 47, lebar: 38, pendekPrice: 100000, panjangPrice: 110000 },
];

export default function DynamicBatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || 'new-batch-2026';

  const [batch, setBatch] = useState<JerseyBatch | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<SizeCategory>('dewasa');
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedSleeve, setSelectedSleeve] = useState<'pendek' | 'panjang'>('pendek');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSizeGuideModal, setShowSizeGuideModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [sizeGuideTab, setSizeGuideTab] = useState<SizeCategory>('dewasa');

  useEffect(() => {
    if (slug === 'new-batch-2026') {
      router.replace('/store/jersey-dlob-new-batch');
      return;
    }

    fetch(`/api/store/batches?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.batch) {
          setBatch(data.batch);
        } else {
          // Fallback to local default if match
          const found = DEFAULT_JERSEY_BATCHES.find((b) => b.slug === slug || b.id === slug);
          if (found) setBatch(found);
        }
      })
      .catch((err) => {
        console.error('Failed to load batch:', err);
        const found = DEFAULT_JERSEY_BATCHES.find((b) => b.slug === slug || b.id === slug);
        if (found) setBatch(found);
      })
      .finally(() => setLoading(false));
  }, [slug, router]);

  if (slug === 'new-batch-2026') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 border-3 border-gray-300 border-t-black rounded-full animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Mengalihkan ke halaman New Batch...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 border-3 border-gray-300 border-t-black rounded-full animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Memuat detail produk...</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Batch Tidak Ditemukan</h2>
          <p className="text-xs text-gray-500">
            Halaman produk jersey batch &ldquo;{slug}&rdquo; tidak tersedia atau telah dipindahkan.
          </p>
          <button
            onClick={() => router.push('/store')}
            className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all"
          >
            Kembali ke Katalog Store
          </button>
        </div>
      </div>
    );
  }

  const selectedVariant = batch.colorVariants[selectedColorIndex] || batch.colorVariants[0];
  const currentImages = selectedVariant?.images?.length > 0 ? selectedVariant.images : ['/images/placeholder-jersey.png'];
  const currentImage = currentImages[selectedImageIndex] || currentImages[0];
  const currentImageDetail = selectedVariant?.imageDetails?.find((d) => d.url === currentImage) 
    || selectedVariant?.imageDetails?.[selectedImageIndex];

  // Grouped unique POVs available for current color variant (derived directly without hook after early return)
  const povMap = new Map<string, { pov: string; label: string; firstIndex: number }>();
  if (selectedVariant?.imageDetails) {
    selectedVariant.imageDetails.forEach((item, idx) => {
      if (!povMap.has(item.pov)) {
        let label = 'Angle';
        if (item.pov === 'depan') label = 'Tampak Depan';
        else if (item.pov === 'belakang') label = 'Tampak Belakang';
        else if (item.pov === 'samping') label = 'Tampak Samping';
        else if (item.pov === 'atas') label = 'Tampak Atas';
        else if (item.pov === 'bahan') label = 'Detail Bahan';
        else if (item.pov === 'promosi') label = 'Mockup Promosi';
        povMap.set(item.pov, { pov: item.pov, label, firstIndex: idx });
      }
    });
  }
  const povFilters = Array.from(povMap.values());

  const currentSizeObj = allSizeOptions.find((s) => s.id === selectedSize) ?? allSizeOptions[2];
  const currentPrice = selectedSleeve === 'pendek' ? currentSizeObj.pendekPrice : currentSizeObj.panjangPrice;
  const availableSizes = allSizeOptions.filter((s) => s.category === selectedCategory);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const handleCategoryChange = (cat: SizeCategory) => {
    setSelectedCategory(cat);
    const firstInCat = allSizeOptions.find((s) => s.category === cat);
    if (firstInCat) setSelectedSize(firstInCat.id);
  };

  const isClosed = batch.status === 'closed';
  const isComingSoon = batch.status === 'coming-soon';

  return (
    <div className="min-h-screen bg-white">
      {/* ── AI Size Recommender Modal ── */}
      <AISizeRecommenderModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onApplySize={(cat, sizeId) => {
          setSelectedCategory(cat);
          setSelectedSize(sizeId);
        }}
        theme="light"
      />

      {/* ── Size Guide Modal ── */}
      {showSizeGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📏 Panduan Ukuran {batch.name}
              </h3>
              <button
                onClick={() => setShowSizeGuideModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 mb-6 border-b border-gray-100 pb-3">
              <button
                type="button"
                onClick={() => setSizeGuideTab('dewasa')}
                className={`py-2 px-3 text-xs font-bold rounded-full transition-all ${
                  sizeGuideTab === 'dewasa' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'
                }`}
              >
                Dewasa (110k)
              </button>
              <button
                type="button"
                onClick={() => setSizeGuideTab('kids')}
                className={`py-2 px-3 text-xs font-bold rounded-full transition-all ${
                  sizeGuideTab === 'kids' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'
                }`}
              >
                Kids (100k)
              </button>
              <button
                type="button"
                onClick={() => setSizeGuideTab('balita')}
                className={`py-2 px-3 text-xs font-bold rounded-full transition-all ${
                  sizeGuideTab === 'balita' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'
                }`}
              >
                Balita 👶 (100k)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50 text-gray-700">
                    <th className="text-left py-3 px-4 font-semibold">Size</th>
                    <th className="text-left py-3 px-4 font-semibold">Kategori / Usia</th>
                    <th className="text-right py-3 px-4 font-semibold">Panjang (cm)</th>
                    <th className="text-right py-3 px-4 font-semibold">Lebar Dada (cm)</th>
                    <th className="text-right py-3 px-4 font-semibold">Harga Pendek</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allSizeOptions
                    .filter((s) => s.category === sizeGuideTab)
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900">{s.label}</td>
                        <td className="py-3 px-4 text-gray-600">{s.keterangan || 'Dewasa Standard'}</td>
                        <td className="text-right py-3 px-4 font-mono">{s.tinggi}</td>
                        <td className="text-right py-3 px-4 font-mono">{s.lebar}</td>
                        <td className="text-right py-3 px-4 font-mono font-bold text-blue-600">
                          {formatPrice(s.pendekPrice)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowSizeGuideModal(false)}
                className="px-8 py-3 bg-black text-white hover:bg-gray-800 rounded-full font-semibold text-sm transition-all shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Header Banner ── */}
      <div className="bg-zinc-950 text-white py-12 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#4382C8]/15 text-[#4382C8] border border-[#4382C8]/30 mb-3">
            {batch.badge || 'Official Collection'}
          </div>
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight mb-2">
            {batch.name.toUpperCase()}
          </h1>
          <p className="text-sm text-zinc-300 max-w-xl mx-auto">{batch.tagline}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => router.push('/store')}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black uppercase tracking-wider mb-8 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Katalog Store</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* ── Left Gallery ── */}
          <div className="relative space-y-4">
            {/* POV Filter Pills if available */}
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-gray-500" />
                POV:
              </span>
              {povFilters.map((p) => {
                const isActive = !showVideo && currentImageDetail?.pov === p.pov;
                return (
                  <button
                    key={p.pov}
                    type="button"
                    onClick={() => {
                      setSelectedImageIndex(p.firstIndex);
                      setShowVideo(false);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-black text-white shadow-sm'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{p.label}</span>
                  </button>
                );
              })}

              {/* Video Showcase Pill for this specific color */}
              {selectedVariant?.videoUrl && (
                <button
                  type="button"
                  onClick={() => setShowVideo(true)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    showVideo
                      ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400/40'
                      : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Video Gerak {selectedVariant.name}</span>
                </button>
              )}
            </div>

            {/* Main Media Container (Image with Zoom or High-Def Video Player) */}
            {showVideo && selectedVariant?.videoUrl ? (
              <div className="relative aspect-3/4 w-full bg-black rounded-3xl overflow-hidden shadow-lg border border-zinc-800 flex items-center justify-center group/video">
                <video
                  ref={videoRef}
                  src={selectedVariant.videoUrl}
                  autoPlay
                  loop
                  muted={isVideoMuted}
                  playsInline
                  className="w-full h-full object-cover"
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                />

                {/* Video status overlay */}
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                  <span className="px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-md flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>Video Gerak · {selectedVariant.name}</span>
                  </span>
                </div>

                {/* Switch to photo zoom button */}
                <button
                  type="button"
                  onClick={() => setShowVideo(false)}
                  className="absolute top-4 right-4 z-20 px-3.5 py-1.5 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
                >
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lihat Foto &amp; Zoom</span>
                </button>

                {/* Video controls bottom bar */}
                <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between p-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 text-white">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (videoRef.current) {
                          if (isVideoPlaying) videoRef.current.pause();
                          else videoRef.current.play();
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
                      title={isVideoPlaying ? 'Pause' : 'Play'}
                    >
                      {isVideoPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsVideoMuted(!isVideoMuted)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
                      title={isVideoMuted ? 'Unmute' : 'Mute'}
                    >
                      {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[11px] font-medium text-zinc-300">
                    Drape &amp; Motion Kain Milano
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                {currentImage ? (
                  <ZoomableImage
                    src={currentImage}
                    alt={`${batch.name} - ${selectedVariant?.name || ''}`}
                    name={selectedVariant?.name || batch.name}
                  />
                ) : (
                  <div className="aspect-3/4 flex items-center justify-center bg-gray-50 text-gray-300">
                    <ShoppingBag className="w-16 h-16" />
                  </div>
                )}

                {/* Status Badge overlay */}
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm ${
                    isClosed
                      ? 'bg-red-500 text-white'
                      : isComingSoon
                      ? 'bg-zinc-800 text-white'
                      : 'bg-emerald-500 text-white'
                  }`}>
                    {batch.badge}
                  </span>
                </div>

                {/* POV Badge overlay */}
                {currentImageDetail && (
                  <div className="absolute bottom-4 left-4 z-20 pointer-events-none max-w-[85%]">
                    <div className="px-3.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/20 text-white text-xs font-medium flex items-center gap-2 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="truncate">{currentImageDetail.label}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Image POV Description Callout */}
            {!showVideo && currentImageDetail?.description && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-950 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block mb-0.5">{currentImageDetail.label}</span>
                  <p className="text-gray-600 leading-relaxed">{currentImageDetail.description}</p>
                </div>
              </div>
            )}

            {/* Thumbnails (Images + Color Video Preview) */}
            <div className="flex gap-2.5 overflow-x-auto pb-2">
              {/* Color Specific Video Thumbnail */}
              {selectedVariant?.videoUrl && (
                <button
                  type="button"
                  onClick={() => setShowVideo(true)}
                  className={`relative w-20 h-24 rounded-2xl overflow-hidden border-2 bg-zinc-950 shrink-0 transition-all cursor-pointer group flex flex-col items-center justify-center text-white ${
                    showVideo ? 'border-red-500 shadow-md ring-2 ring-red-400/40' : 'border-gray-200 hover:border-gray-400'
                  }`}
                  title={`Tonton Video Gerak ${selectedVariant.name}`}
                >
                  <video
                    src={selectedVariant.videoUrl}
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className="relative z-10 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <span className="absolute bottom-1 inset-x-1 py-0.5 px-1 bg-black/80 backdrop-blur-xs text-[9px] font-bold text-white rounded text-center truncate uppercase tracking-tighter">
                    VIDEO
                  </span>
                </button>
              )}

              {/* Photo Thumbnails */}
              {currentImages.map((img, idx) => {
                const detail = selectedVariant?.imageDetails?.[idx];
                const povTag = detail?.pov ? detail.pov.toUpperCase() : null;
                const isSelected = !showVideo && selectedImageIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      setShowVideo(false);
                    }}
                    className={`relative w-20 h-24 rounded-2xl overflow-hidden border-2 bg-gray-50 shrink-0 transition-all cursor-pointer group ${
                      isSelected ? 'border-black shadow-md ring-2 ring-black/10' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {povTag && (
                      <span className="absolute bottom-1 inset-x-1 py-0.5 px-1 bg-black/75 backdrop-blur-xs text-[9px] font-bold text-white rounded text-center truncate uppercase tracking-tighter">
                        {povTag}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Right Product Details ── */}
          <div className="flex flex-col">
            <div className="border-b border-gray-200 pb-6 mb-6">
              <span className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-widest">
                Edisi: {batch.slug}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{batch.name}</h2>
              <div className="flex items-baseline gap-3 mt-3">
                <span className="text-3xl font-extrabold text-blue-600 font-mono">
                  {formatPrice(currentPrice)}
                </span>
                <span className="text-xs text-gray-400">
                  {selectedSleeve === 'panjang' ? '(Lengan Panjang +10k)' : '(Lengan Pendek)'}
                </span>
              </div>
            </div>

            {/* 1. Color Selector */}
            {batch.colorVariants.length > 0 && (
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">
                  Pilihan Warna: <span className="text-blue-600 font-semibold">{selectedVariant?.name}</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {batch.colorVariants.map((v, i) => (
                    <button
                      key={v.id || i}
                      type="button"
                      onClick={() => {
                        setSelectedColorIndex(i);
                        setSelectedImageIndex(0);
                        setShowVideo(false);
                      }}
                      className={`px-4 py-2.5 rounded-2xl border-2 flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                        selectedColorIndex === i
                          ? 'border-black bg-black text-white shadow-md'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: v.color }} />
                      <span>{v.name}</span>
                      {v.videoUrl && (
                        <span className="w-2 h-2 rounded-full bg-red-500" title="Ada Video" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Video Motion Reel Card if available for this color */}
            {selectedVariant?.videoUrl && (
              <div className="mb-6 p-4 rounded-2xl bg-zinc-950 text-white flex items-center justify-between border border-zinc-800 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/90 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Video Motion: {selectedVariant.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-500/20 text-red-400 font-mono font-bold">HD REEL</span>
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Lihat fleksibilitas kain Milano dan aksen warna saat dikenakan bergerak
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVideo(!showVideo)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm active:scale-95"
                >
                  {showVideo ? (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Mode Foto</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Putar Video</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 2. Category Selector */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">
                Kategori Ukuran
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { cat: 'dewasa' as const, label: 'Dewasa', price: 'Rp 110k' },
                  { cat: 'kids' as const, label: 'Kids (7-13 Thn)', price: 'Rp 100k' },
                  { cat: 'balita' as const, label: 'Balita 👶 (1-6 Thn)', price: 'Rp 100k' },
                ].map((item) => (
                  <button
                    key={item.cat}
                    type="button"
                    onClick={() => handleCategoryChange(item.cat)}
                    className={`p-3 rounded-2xl border-2 text-center transition-all ${
                      selectedCategory === item.cat
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className={`text-[10px] mt-0.5 ${selectedCategory === item.cat ? 'text-gray-300' : 'text-gray-400'}`}>
                      {item.price}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Size Picker */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  Ukuran: <span className="font-mono text-blue-600">{selectedSize}</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAIModal(true)}
                    className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>AI Size</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuideModal(true)}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Panduan Ukuran
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSize(s.id)}
                    className={`min-w-12 h-11 px-3 rounded-xl border text-xs font-bold transition-all ${
                      selectedSize === s.id
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Sleeve Picker */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">
                Jenis Lengan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSleeve('pendek')}
                  className={`py-3 px-4 rounded-2xl border-2 text-xs font-bold transition-all text-center ${
                    selectedSleeve === 'pendek'
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Lengan Pendek (Standar)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSleeve('panjang')}
                  className={`py-3 px-4 rounded-2xl border-2 text-xs font-bold transition-all text-center ${
                    selectedSleeve === 'panjang'
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Lengan Panjang (+10k)
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-700 leading-relaxed">
              <p>{batch.description}</p>
            </div>

            {/* ── Action Button (Dedicated Per Batch Link) ── */}
            <div className="space-y-4">
              {isClosed ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-900">Pre-Order {batch.name} Telah Ditutup</p>
                      <p className="mt-0.5 leading-relaxed">
                        {batch.closedMessage || 'Pemesanan untuk batch ini saat ini telah resmi ditutup oleh admin. Nantikan informasi batch berikutnya!'}
                      </p>
                    </div>
                  </div>
                  <button
                    disabled
                    className="w-full py-4 font-bold text-sm uppercase tracking-widest bg-zinc-200 text-zinc-500 rounded-full cursor-not-allowed flex items-center justify-center gap-2 border border-zinc-300"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Pre-Order Telah Ditutup</span>
                  </button>
                </div>
              ) : isComingSoon ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-zinc-100 border border-zinc-200 text-xs text-zinc-700 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-zinc-900">Konsep Segera Hadir</p>
                      <p className="mt-0.5 leading-relaxed">
                        Jersey ini sedang dalam tahap persiapan produksi. Pantau pengumuman resmi untuk pembukaan batch.
                      </p>
                    </div>
                  </div>
                  <button
                    disabled
                    className="w-full py-4 font-bold text-sm uppercase tracking-widest bg-zinc-200 text-zinc-500 rounded-full cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Segera Hadir</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => router.push(`/store/${batch.slug}/pre-order`)}
                  className="w-full py-4 font-bold text-sm uppercase tracking-widest transition-all bg-black hover:bg-gray-800 text-white rounded-full hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Buka Form Pre-Order {batch.name}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Specs */}
            <div className="mt-10 pt-6 border-t border-gray-200 space-y-3 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Material</span>
                <span className="font-semibold text-gray-900">{batch.material || 'Milano Standard'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Perawatan</span>
                <span className="font-semibold text-gray-900">{batch.care || 'Cuci dengan air dingin'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Asal Produksi</span>
                <span className="font-semibold text-gray-900">{batch.origin || 'Indonesia'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Estimasi Pengiriman</span>
                <span className="font-semibold text-gray-900">{batch.estimatedDelivery || 'Sesuai Kuota'}</span>
              </div>
            </div>

            {/* ── POV Guide & Material Quality ── */}
            <div className="mt-8 p-5 rounded-3xl bg-zinc-50 border border-zinc-200 space-y-4">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  Panduan Sudut Pandang (POV) & Detail Produk
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
                  <div className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                    <span>👕</span> Tampak Depan
                  </div>
                  <p className="text-gray-500 leading-relaxed text-[11px]">
                    Potongan athletic fit modern, kerah V-neck presisi, dan penempatan emblem DLOB di dada kiri.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
                  <div className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                    <span>🔄</span> Tampak Belakang
                  </div>
                  <p className="text-gray-500 leading-relaxed text-[11px]">
                    Visual layout nama custom pemain dan logo channel DLOB di bagian pinggang bawah.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
                  <div className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                    <span>📐</span> Tampak Samping / Atas
                  </div>
                  <p className="text-gray-500 leading-relaxed text-[11px]">
                    Jahitan bahu raglan yang ergonomis memberikan fleksibilitas gerak ayunan raket tanpa hambatan.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
                  <div className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                    <span>🔬</span> Detail Bahan Milano
                  </div>
                  <p className="text-gray-500 leading-relaxed text-[11px]">
                    Tekstur rajutan pori mikro (micro-mesh) yang ultra-breathable, lembut di kulit, dan cepat menyerap keringat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
