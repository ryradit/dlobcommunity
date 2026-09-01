'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, ArrowLeft, ChevronRight, Sparkles, ShieldCheck, Truck, Layers, CheckCircle2, Clock, Info, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SmartCropImage from '@/components/SmartCropImage';
import ZoomableImage from '@/components/ZoomableImage';
import { getMemberImageUrl } from '@/lib/membersStorage';

export type SizeCategory = 'dewasa' | 'kids' | 'balita';

// Supabase storage public URLs for videos
const SUPABASE_VIDEOS = {
  videomodel1: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/videomodel1.mp4',
  videomodel2: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/videomodel2.mp4',
  videomodel3: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/videomodel3.mp4',
  videomodel4: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/videomodel4.mp4',
  videomodel5: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/videomodel5.mp4',
  videomodel6: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/videomodel6.mp4',
  videomodel7: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/videomodel7.mp4',
  videopromotionnoirblossom: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/videopromotionnoirblossom.mp4',
  // New Batch Promotion Videos
  nb_biru1: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/new-batch/biru-video1.mp4',
  nb_biru2: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/new-batch/biru-video2.mp4',
  nb_kuning1: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/new-batch/kuning-video1.mp4',
  nb_merah1: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/new-batch/merah-video1.mp4',
  nb_merah2: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/new-batch/merah-video2.mp4',
};

interface ColorVariant {
  id: string;
  name: string;
  color: string;
  images: string[];
  bgColor: string;
}

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

export const allSizeOptions: SizeOption[] = [
  // Dewasa (Adult)
  { id: 'XS', label: 'XS', category: 'dewasa', tinggi: 65, lebar: 45, pendekPrice: 110000, panjangPrice: 120000 },
  { id: 'S', label: 'S', category: 'dewasa', tinggi: 68, lebar: 48, pendekPrice: 110000, panjangPrice: 120000 },
  { id: 'M', label: 'M', category: 'dewasa', tinggi: 71, lebar: 51, pendekPrice: 110000, panjangPrice: 120000 },
  { id: 'L', label: 'L', category: 'dewasa', tinggi: 74, lebar: 54, pendekPrice: 110000, panjangPrice: 120000 },
  { id: 'XL', label: 'XL', category: 'dewasa', tinggi: 77, lebar: 57, pendekPrice: 110000, panjangPrice: 120000 },
  { id: 'XXL', label: 'XXL', category: 'dewasa', tinggi: 80, lebar: 62, pendekPrice: 120000, panjangPrice: 130000 },
  { id: '3XL', label: '3XL', category: 'dewasa', tinggi: 83, lebar: 65, pendekPrice: 130000, panjangPrice: 140000 },

  // Kids (7-13 Tahun) - 100k
  { id: 'Kids S', label: 'S', category: 'kids', keterangan: '7-8 TAHUN', tinggi: 57, lebar: 43, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Kids M', label: 'M', category: 'kids', keterangan: '8-9 TAHUN', tinggi: 59, lebar: 44, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Kids L', label: 'L', category: 'kids', keterangan: '10-11 TAHUN', tinggi: 62, lebar: 46, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Kids XL', label: 'XL', category: 'kids', keterangan: '12-13 TAHUN', tinggi: 65, lebar: 48, pendekPrice: 100000, panjangPrice: 110000 },

  // Balita (1-6 Tahun) - 100k
  { id: 'Balita XS', label: 'XS', category: 'balita', keterangan: '1 - 2 TAHUN', tinggi: 36, lebar: 28, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Balita S', label: 'S', category: 'balita', keterangan: '2 - 3 TAHUN', tinggi: 40, lebar: 31, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Balita M', label: 'M', category: 'balita', keterangan: '3 - 4 TAHUN', tinggi: 43, lebar: 34, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Balita L', label: 'L', category: 'balita', keterangan: '4 - 5 TAHUN', tinggi: 45, lebar: 36, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Balita XL', label: 'XL', category: 'balita', keterangan: '5 - 6 TAHUN', tinggi: 47, lebar: 38, pendekPrice: 100000, panjangPrice: 110000 },
];

// --- Jersey DLOB Official ---
const officialColorVariants: ColorVariant[] = [
  { 
    id: 'biru',   
    name: 'Biru Navy', 
    color: 'Biru Navy', 
    images: ['model/biru3.png','model/biru4.png','model/biru5.png'].map(getMemberImageUrl), 
    bgColor: '#0b244c',
  },
  { 
    id: 'pink',   
    name: 'Pink',      
    color: 'Pink',      
    images: ['model/pink8.png','model/pink6.png','model/pink7.png','model/pink9.png'].map(getMemberImageUrl), 
    bgColor: '#c8a19c',
  },
  { 
    id: 'kuning', 
    name: 'Kuning', 
    color: 'Kuning', 
    images: ['model/kuning3.png','model/kuning4.png','model/kuning 5.png','model/kuning6.png'].map(getMemberImageUrl), 
    bgColor: '#fecb00',
  },
];

// --- DLOB Jersey - Noir ---
const circuitNoirColorVariants: ColorVariant[] = [
  { 
    id: 'midnight',  
    name: 'Midnight Black',   
    color: 'Midnight Black',   
    images: ['model/hitam1.jpeg','model/hitam2.jpeg','model/hitam3.jpeg'].map(getMemberImageUrl), 
    bgColor: '#0d0d0d',
  },
  { 
    id: 'charcoal',  
    name: 'Charcoal Grey',    
    color: 'Charcoal Grey',    
    images: ['model/grey1.png','model/grey2.jpeg','model/grey3.png'].map(getMemberImageUrl), 
    bgColor: '#3a3a3a',
  },
  { 
    id: 'steelblue', 
    name: 'Steel Blue Night', 
    color: 'Steel Blue Night', 
    images: ['model/bluenight1.jpeg','model/bluenight2.jpeg','model/bluenight3.jpeg'].map(getMemberImageUrl), 
    bgColor: '#1e2d40',
  },
  { 
    id: 'blossomrose', 
    name: 'Blossom Rose', 
    color: 'Blossom Rose', 
    images: ['model/magentaspecial.png','model/magentaspecial2.png','model/magentaspecial3.png','model/magentaspecial4.png','model/magentaspecial5.png'].map(getMemberImageUrl), 
    bgColor: '#c8a19c',
  },
];

// --- New Batch Pre-Order Jersey ---
const newBatchColorVariants: ColorVariant[] = [
  {
    id: 'nb-blue',
    name: 'Blue',
    color: 'Blue',
    images: [
      '/images/new jersey promotion/biru-photo1.jpeg',
      '/images/new jersey promotion/biru-photo2.jpeg',
    ],
    bgColor: '#0b244c',
  },
  {
    id: 'nb-yellow',
    name: 'Yellow',
    color: 'Yellow',
    images: [
      '/images/new jersey promotion/kuning-photo1.jpeg',
      '/images/new jersey promotion/kuning-photo2.jpeg',
    ],
    bgColor: '#FFC000',
  },
  {
    id: 'nb-red',
    name: 'Red',
    color: 'Red',
    images: [
      '/images/new jersey promotion/merah-photo1.jpeg',
      '/images/new jersey promotion/merah-photo2.jpeg',
      '/images/new jersey promotion/merah-photo3.jpeg',
      '/images/new jersey promotion/merah-photo4.jpeg',
    ],
    bgColor: '#ff0000',
  },
];

interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  badgeType: 'active-preorder' | 'regular' | 'coming-soon' | 'closed';
  coverImage: string | null;
  coverBg: string;
  colorVariants: ColorVariant[];
  material: string;
  care: string;
  origin: string;
  preOrder: boolean;
  isNewBatch?: boolean;
  isClosed?: boolean;
  estimatedDelivery: string;
  comingSoon: boolean;
  startingPrice: number;
  introductionVideos?: string[];
}

const products: Product[] = [
  {
    id: 'nb-jersey',
    name: 'Jersey DLOB New Batch',
    tagline: 'Fresh Colors · Dewasa, Kids & Balita Edition',
    description: 'Batch terbaru jersey resmi DLOB! Hadir dalam 3 pilihan warna cerah — Biru (#0b244c), Kuning (#FFC000), dan Merah (#ff0000). Tersedia dalam ukuran Dewasa (Rp 110k), Kids (Rp 100k), dan Balita 👶 (Rp 100k). Menggunakan material Milano Standard premium yang ringan, adem, dan menyerap keringat. Catatan: Logo di gambar dan video hanya contoh, aslinya sekarang sudah menggunakan logo official D\'LOB.',
    badge: 'PRE-ORDER AKTIF',
    badgeType: 'active-preorder',
    coverImage: null,
    coverBg: '#0f172a',
    colorVariants: newBatchColorVariants,
    material: 'Milano Standard Premium',
    care: 'Cuci dengan air dingin, jangan gunakan pemutih',
    origin: 'Indonesia',
    preOrder: true,
    isNewBatch: true,
    isClosed: false,
    estimatedDelivery: 'Kuota 15 Order',
    comingSoon: false,
    startingPrice: 100000,
    introductionVideos: [
      SUPABASE_VIDEOS.nb_biru1,
      SUPABASE_VIDEOS.nb_biru2,
      SUPABASE_VIDEOS.nb_kuning1,
      SUPABASE_VIDEOS.nb_merah1,
      SUPABASE_VIDEOS.nb_merah2,
    ],
  },
  {
    id: 'official',
    name: 'Jersey DLOB Official',
    tagline: 'The Classic Edition · Batch Ditutup',
    description: 'Jersey edisi reguler klasik DLOB dengan teknologi Milano Standard. Pemesanan untuk batch reguler ini saat ini telah resmi ditutup. Silakan ikuti Pre-Order New Batch 2026 yang sedang dibuka!',
    badge: 'BATCH DITUTUP',
    badgeType: 'closed',
    coverImage: getMemberImageUrl('model/biru3.png'),
    coverBg: '#0b244c',
    colorVariants: officialColorVariants,
    material: 'Milano Standard',
    care: 'Cuci dengan air dingin',
    origin: 'Indonesia',
    preOrder: false,
    isNewBatch: false,
    isClosed: true,
    estimatedDelivery: 'Batch Ditutup',
    comingSoon: false,
    startingPrice: 110000,
    introductionVideos: [
      SUPABASE_VIDEOS.videomodel1,
      SUPABASE_VIDEOS.videomodel3,
      SUPABASE_VIDEOS.videomodel5,
    ],
  },
  {
    id: 'noir',
    name: 'DLOB Jersey – Noir',
    tagline: 'The Dark Circuit Edition',
    description: 'Jersey edisi spesial DLOB Noir dengan desain eksklusif bertema gelap dan modern. Terinspirasi dari sirkuit elektronik, cocok untuk tampilan sporty dan elegan.',
    badge: 'SEGERA HADIR',
    badgeType: 'coming-soon',
    coverImage: null,
    coverBg: '#0d0d0d',
    colorVariants: circuitNoirColorVariants,
    material: 'Milano Standard',
    care: 'Cuci dengan air dingin',
    origin: 'Indonesia',
    preOrder: false,
    isNewBatch: false,
    isClosed: false,
    estimatedDelivery: 'TBA (Concept)',
    comingSoon: true,
    startingPrice: 110000,
    introductionVideos: [
      SUPABASE_VIDEOS.videomodel4,
      SUPABASE_VIDEOS.videomodel6,
      SUPABASE_VIDEOS.videopromotionnoirblossom,
    ],
  },
];

// -- Auto-rotating catalog card with video support & futuristic glassmorphism ---------------------
function CatalogCard({
  product,
  onOpen,
  formatPrice,
}: {
  product: Product;
  onOpen: (p: Product) => void;
  formatPrice: (n: number) => string;
}) {
  const mediaItems = product.introductionVideos && product.introductionVideos.length > 0
    ? product.introductionVideos
    : Array.from(
        new Set(
          product.colorVariants
            .map((v) => v.images[0])
            .filter(Boolean) as string[],
        ),
      );
  
  if (product.coverImage && !mediaItems.includes(product.coverImage) && !product.introductionVideos) {
    mediaItems.unshift(product.coverImage);
  }

  const [activeIdx, setActiveIdx] = useState(0);
  const [visible, setVisible]     = useState(true);
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideo = (src: string) => src.endsWith('.mp4') || src.endsWith('.webm') || src.endsWith('.mov');
  const currentMedia = mediaItems[activeIdx] ?? null;
  const currentIsVideo = currentMedia ? isVideo(currentMedia) && !videoErrors.has(currentMedia) : false;

  const getFallbackImage = () => {
    return product.coverImage || product.colorVariants[0]?.images[0] || null;
  };

  const handleVideoError = (failedSrc: string) => {
    setVideoErrors((prev) => new Set([...prev, failedSrc]));
  };

  const cleanupVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  }, []);

  useEffect(() => {
    if (mediaItems.length <= 1) return;
    const duration = 10000;
    
    const interval = setInterval(() => {
      setVisible(false);
      timerRef.current = setTimeout(() => {
        cleanupVideo();
        setActiveIdx((i) => (i + 1) % mediaItems.length);
        setTimeout(() => {
          setVisible(true);
        }, 100);
      }, 800);
    }, duration);
    
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mediaItems.length, activeIdx, currentIsVideo, cleanupVideo]);

  // Distinctive Badge Styling
  const renderBadge = () => {
    if (product.badgeType === 'active-preorder') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-lg shadow-emerald-950/50">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>PRE-ORDER DIBUKA</span>
        </div>
      );
    }
    if (product.badgeType === 'closed') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-zinc-900/90 text-zinc-400 border border-white/10 backdrop-blur-md">
          <Lock className="w-3 h-3 text-zinc-400" />
          <span>BATCH DITUTUP</span>
        </div>
      );
    }
    if (product.badgeType === 'coming-soon') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-zinc-800/80 text-zinc-400 border border-white/10 backdrop-blur-md">
          <span>🔒 SEGERA HADIR</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/15 text-white border border-white/20 backdrop-blur-md">
        <span>✨ EDISI REGULER</span>
      </div>
    );
  };

  return (
    <div
      onClick={() => onOpen(product)}
      className="group relative cursor-pointer text-left bg-zinc-900/60 backdrop-blur-xl border border-white/10 hover:border-white/30 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/80 hover:-translate-y-1 flex flex-col"
    >
      {/* Media Canvas */}
      <div className="relative w-full aspect-4/5 overflow-hidden bg-zinc-950">
        {currentMedia ? (
          <div
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: visible ? 1 : 0 }}
          >
            {currentIsVideo ? (
              <video
                key={`${product.id}-${currentMedia}-${activeIdx}`}
                ref={videoRef}
                autoPlay
                muted
                playsInline
                loop={false}
                preload="metadata"
                crossOrigin="anonymous"
                poster={getFallbackImage() || undefined}
                className="w-full h-full object-cover bg-black"
                onError={() => handleVideoError(currentMedia)}
                style={{ width: '100%', height: '100%', display: 'block' }}
              >
                <source src={currentMedia} type="video/mp4" />
              </video>
            ) : (
              <SmartCropImage 
                src={currentMedia} 
                alt={product.name} 
                name={product.name} 
                objectPositionOverride={currentMedia.includes('pink8') ? '20% 50%' : undefined} 
              />
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900">
            <svg viewBox="0 0 200 200" className="w-28 h-28 opacity-20" fill="none" stroke="white" strokeWidth="1.5">
              <rect x="20" y="20" width="60" height="60" rx="4" /><rect x="120" y="20" width="60" height="60" rx="4" />
              <rect x="20" y="120" width="60" height="60" rx="4" /><rect x="120" y="120" width="60" height="60" rx="4" />
            </svg>
            <p className="text-white/40 text-xs tracking-widest uppercase font-semibold">Teaser Concept</p>
          </div>
        )}

        {/* Ambient Dark Gradient Vignette */}
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 z-20">
          {renderBadge()}
        </div>

        {/* Color Swatch Dots */}
        <div className="absolute top-4 right-4 z-20 flex gap-1.5 p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
          {product.colorVariants.map((v) => (
            <div
              key={v.id}
              className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
              style={{ backgroundColor: v.bgColor }}
              title={v.name}
            />
          ))}
        </div>

        {/* Media indicators */}
        {mediaItems.length > 1 && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1.5 z-20">
            {mediaItems.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIdx ? 'w-4 h-1 bg-white' : 'w-1 h-1 bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* Product Title on Media Canvas */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 mb-1 font-semibold">{product.tagline}</p>
          <h3 className="text-2xl font-light tracking-tight text-white">{product.name}</h3>
        </div>
      </div>

      {/* Glassmorphic Card Footer Details */}
      <div className="p-6 bg-zinc-900/80 backdrop-blur-md border-t border-white/5 flex items-center justify-between mt-auto">
        <div>
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <span>{product.material}</span>
            <span>•</span>
            <span>{product.colorVariants.length} Warna</span>
          </div>
          {product.isClosed ? (
            <p className="text-sm font-semibold text-zinc-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              <span>Status: Batch Ditutup</span>
            </p>
          ) : product.comingSoon ? (
            <p className="text-sm font-semibold text-zinc-400 mt-1">Status: Segera Hadir</p>
          ) : (
            <p className="text-sm font-bold text-white mt-1">
              Mulai <span className="text-emerald-400 font-mono">{formatPrice(product.startingPrice)}</span>
            </p>
          )}
        </div>

        <button
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
            product.badgeType === 'active-preorder'
              ? 'bg-white text-black hover:bg-zinc-200 group-hover:scale-105 shadow-md shadow-black/50'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/10 group-hover:scale-105'
          }`}
        >
          <span>{product.isClosed ? 'Detail' : product.comingSoon ? 'Info' : 'Pesan'}</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

import AISizeRecommenderModal from '@/components/store/AISizeRecommenderModal';

export default function StorePage() {
  const [selectedProductId, setSelectedProductId]   = useState<string | null>(null);
  const [selectedColor, setSelectedColor]           = useState('biru');
  const [selectedSize, setSelectedSize]             = useState('');
  const [selectedSleeve, setSelectedSleeve]         = useState<'pendek' | 'panjang'>('pendek');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSizeGuideModal, setShowSizeGuideModal] = useState(false);
  const [showAIModal, setShowAIModal]               = useState(false);
  const [sizeGuideTab, setSizeGuideTab]             = useState<SizeCategory>('dewasa');
  const [filterCategory, setFilterCategory]         = useState<'all' | 'preorder' | 'closed' | 'coming-soon'>('all');
  const router = useRouter();

  const allProducts = products;
  const filteredProducts = allProducts.filter((p) => {
    if (filterCategory === 'preorder') return p.badgeType === 'active-preorder';
    if (filterCategory === 'closed') return p.badgeType === 'closed';
    if (filterCategory === 'coming-soon') return p.badgeType === 'coming-soon';
    return true;
  });

  const selectedProduct = allProducts.find((p) => p.id === selectedProductId) ?? null;
  const selectedVariant = selectedProduct
    ? selectedProduct.colorVariants.find((v) => v.id === selectedColor) ?? selectedProduct.colorVariants[0]
    : null;
  const currentImage = selectedVariant?.images[selectedImageIndex] ?? selectedVariant?.images[0] ?? null;
  const selectedSizeData = allSizeOptions.find((sp) => sp.id === selectedSize);
  const currentPrice = selectedSizeData
    ? (selectedSleeve === 'pendek' ? selectedSizeData.pendekPrice : selectedSizeData.panjangPrice)
    : null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const openProduct = (product: Product) => {
    if (product.id === 'nb-jersey') {
      router.push('/store/jersey-dlob-new-batch');
      return;
    }
    setSelectedProductId(product.id);
    setSelectedColor(product.colorVariants[0]?.id ?? '');
    setSelectedSize('');
    setSelectedSleeve('pendek');
    setSelectedImageIndex(0);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const backToCatalog = () => setSelectedProductId(null);

  // Futuristic Disclaimer Block
  const Disclaimer = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="flex items-start gap-3 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 shadow-lg">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-zinc-300">
          <p className="font-semibold text-white mb-0.5">Informasi Batch &amp; Pemesanan Jersey DLOB</p>
          <p className="text-zinc-400 leading-relaxed">
            Pemesanan jersey saat ini difokuskan pada <strong className="text-emerald-400">Pre-Order New Batch 2026</strong> (tersedia size Dewasa, Kids &amp; Balita 👶). Edisi batch reguler sebelumnya telah resmi ditutup. Produksi batch baru berjalan setelah kuota minimum <strong className="text-white">15 pesanan</strong> terkumpul.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-white selection:text-black">

      {/* ── AI Size Recommender Modal ── */}
      <AISizeRecommenderModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onApplySize={(_cat, sizeId) => {
          setSelectedSize(sizeId);
        }}
        theme="dark"
      />

      {/* ── Size Guide Modal (3 Tables: Dewasa, Kids, Balita) ── */}
      {showSizeGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-white/15 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                📏 Panduan Ukuran Jersey DLOB
              </h2>
              <button
                onClick={() => setShowSizeGuideModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Category Tabs inside Modal */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 border border-white/10 rounded-full mb-6">
              <button
                type="button"
                onClick={() => setSizeGuideTab('dewasa')}
                className={`py-2 px-3 text-xs font-bold rounded-full transition-all ${
                  sizeGuideTab === 'dewasa' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Dewasa (110k)
              </button>
              <button
                type="button"
                onClick={() => setSizeGuideTab('kids')}
                className={`py-2 px-3 text-xs font-bold rounded-full transition-all ${
                  sizeGuideTab === 'kids' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Kids (100k)
              </button>
              <button
                type="button"
                onClick={() => setSizeGuideTab('balita')}
                className={`py-2 px-3 text-xs font-bold rounded-full transition-all ${
                  sizeGuideTab === 'balita' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Balita 👶 (100k)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-zinc-300">
                    <th className="text-left py-3 px-4 font-semibold">Size</th>
                    <th className="text-left py-3 px-4 font-semibold">Keterangan</th>
                    <th className="text-right py-3 px-4 font-semibold">Tinggi (cm)</th>
                    <th className="text-right py-3 px-4 font-semibold">Lebar (cm)</th>
                    <th className="text-right py-3 px-4 font-semibold">Lengan Pendek</th>
                    <th className="text-right py-3 px-4 font-semibold">Lengan Panjang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {allSizeOptions
                    .filter((s) => s.category === sizeGuideTab)
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{item.label}</td>
                        <td className="py-3 px-4 text-zinc-400 text-xs">{item.keterangan || 'Dewasa Standard'}</td>
                        <td className="text-right py-3 px-4 font-mono">{item.tinggi}</td>
                        <td className="text-right py-3 px-4 font-mono">{item.lebar}</td>
                        <td className="text-right py-3 px-4 font-mono text-emerald-400 font-bold">
                          {formatPrice(item.pendekPrice)}
                        </td>
                        <td className="text-right py-3 px-4 font-mono text-emerald-400">
                          {formatPrice(item.panjangPrice)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10 text-xs text-zinc-400 space-y-1">
              <p className="font-semibold text-white">💡 Catatan Pengukuran:</p>
              <p>• Satuan ukuran dalam Centimeter (cm) dengan toleransi jahitan ±2cm.</p>
              <p>• Lengan panjang dikenakan biaya tambahan +Rp 10.000 dari harga lengan pendek.</p>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowSizeGuideModal(false)}
                className="px-8 py-3 bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-full font-semibold text-sm shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CATALOG VIEW ────────────────────────────────────────────── */}
      {!selectedProductId && (
        <>
          {/* Hero with Video on Hover */}
          <div 
            className="relative w-full overflow-hidden group" 
            style={{ minHeight: '85vh' }}
            onMouseEnter={() => {
              const video = document.getElementById('hero-video') as HTMLVideoElement;
              if (video) {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                  playPromise.catch(() => {
                    // Play was interrupted (e.g. quick hover-out) — safe to ignore
                  });
                }
              }
            }}
            onMouseLeave={() => {
              const video = document.getElementById('hero-video') as HTMLVideoElement;
              if (video && !video.paused) video.pause();
            }}
          >
            {/* Background image (default) */}
            <img
              src={getMemberImageUrl('model/storeheroimage4.jpeg')}
              alt="DLOB Store Hero"
              className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 group-hover:opacity-0"
              style={{ imageRendering: 'auto' }}
              loading="eager"
              draggable={false}
            />
            
            {/* Video (on hover) */}
            <video
              id="hero-video"
              src={SUPABASE_VIDEOS.videopromotionnoirblossom}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              muted
              loop
              preload="auto"
              playsInline
              crossOrigin="anonymous"
            />
            
            {/* Ambient Dark Gradients */}
            <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/30 to-zinc-950" />

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-end h-full min-h-[85vh] max-w-7xl mx-auto px-6 sm:px-10 pb-16 pt-32">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs uppercase tracking-widest text-zinc-300 bg-white/10 backdrop-blur-md border border-white/15 mb-4 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>DLOB Community Official Gear</span>
              </div>

              <h1 className="text-5xl sm:text-7xl font-light tracking-tight text-white leading-none mb-4">
                DLOB<br />
                <span className="font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                  STORE
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-300 max-w-md leading-relaxed mb-8">
                Jersey resmi komunitas bulutangkis DLOB. Kualitas material Milano Standard premium, ringan, adem, dan dirancang untuk performa puncak.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 items-center">
                <button
                  onClick={() => {
                    document.getElementById('catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-3.5 bg-white text-black text-sm font-semibold uppercase tracking-widest hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-full shadow-lg shadow-white/10"
                >
                  Lihat Katalog
                </button>
                <button
                  onClick={() => router.push('/store/new-batch-pre-order')}
                  className="px-8 py-3.5 bg-zinc-900/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-sm font-semibold uppercase tracking-widest hover:bg-emerald-500/10 hover:border-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-full flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Pre-Order New Batch
                </button>
              </div>

              {/* Stats strip in glassmorphic pill */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-6 border-t border-white/10 max-w-2xl">
                <div>
                  <p className="text-2xl font-bold text-white">3</p>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-wider mt-0.5">Model Jersey</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">3 Tipe</p>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-wider mt-0.5">Dewasa, Kids &amp; Balita</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">Milano</p>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-wider mt-0.5">Standard Premium</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">16</p>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-wider mt-0.5">Pilihan Ukuran</p>
                </div>
              </div>
            </div>
          </div>

          <Disclaimer />

          {/* Breadcrumbs & Status Filter Bar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="catalog-grid">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-light text-white tracking-tight">Koleksi Jersey DLOB</h2>
                <p className="text-xs text-zinc-400 mt-1">Pilih jersey yang sesuai dengan kebutuhan pertandingan Anda</p>
              </div>

              {/* Filter Pills - Zero Ambiguity */}
              <div className="flex flex-wrap gap-2 p-1.5 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filterCategory === 'all'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Semua ({allProducts.length})
                </button>
                <button
                  onClick={() => setFilterCategory('preorder')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    filterCategory === 'preorder'
                      ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-950'
                      : 'text-emerald-400/80 hover:text-emerald-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Pre-Order Aktif (1)
                </button>
                <button
                  onClick={() => setFilterCategory('closed')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    filterCategory === 'closed'
                      ? 'bg-zinc-700 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Lock className="w-3 h-3 text-zinc-400" />
                  Batch Ditutup (1)
                </button>
                <button
                  onClick={() => setFilterCategory('coming-soon')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filterCategory === 'coming-soon'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Segera Hadir (1)
                </button>
              </div>
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <CatalogCard
                  key={product.id}
                  product={product}
                  onOpen={openProduct}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          </div>

          {/* ── HIGH-TECH GLASSMORPHIC NEW BATCH HIGHLIGHT SECTION ── */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900/90 via-zinc-950/80 to-zinc-900/90 backdrop-blur-2xl border border-white/15 p-8 sm:p-12 shadow-2xl">
              {/* Subtle ambient light glow */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Information Column */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Batch Terbaru · Terbuka Untuk Pemesanan</span>
                  </div>

                  <div>
                    <h3 className="text-3xl sm:text-4xl font-light tracking-tight text-white">
                      Jersey DLOB <span className="font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-100">New Batch 2026</span>
                    </h3>
                    <p className="text-sm sm:text-base text-zinc-300 mt-3 leading-relaxed">
                      Koleksi batch terbaru dengan 3 warna eksklusif (<span className="text-blue-400 font-semibold">Biru</span>, <span className="text-amber-400 font-semibold">Kuning</span>, dan <span className="text-red-400 font-semibold">Merah</span>). Kini tersedia dalam size <strong>Dewasa</strong>, <strong>Kids (7-13 Thn)</strong>, dan <strong>Balita 👶 (1-6 Thn)</strong>!
                    </p>
                    <div className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs text-zinc-300">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>Catatan:</strong> Logo di gambar dan video hanya contoh, aslinya sekarang sudah menggunakan logo official D&apos;LOB.</span>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Model Order</p>
                      <p className="text-sm font-bold text-white mt-0.5">Pre-Order</p>
                      <p className="text-[11px] text-emerald-400 mt-0.5">Min. 15 Kuota</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Tipe Ukuran</p>
                      <p className="text-sm font-bold text-white mt-0.5">Dewasa, Kids &amp; Balita</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Milano Standard</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Harga Mulai</p>
                      <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">Rp 100.000</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Kids/Balita (100k), Dewasa (110k)</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4 pt-2">
                    <button
                      onClick={() => router.push('/store/new-batch-pre-order')}
                      className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm uppercase tracking-widest rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-950 flex items-center gap-2"
                    >
                      <span>Form Pre-Order Online</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => router.push('/store/jersey-dlob-new-batch')}
                      className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold text-sm rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Lihat Foto &amp; Video Detail
                    </button>
                  </div>
                </div>

                {/* Right Visual Swatches Column */}
                <div className="lg:col-span-5 flex flex-col gap-3">
                  {[
                    { name: 'Biru (Blue Milano)', color: 'Blue Edition', hex: '#0b244c', photo: '/images/new jersey promotion/biru-photo1.jpeg' },
                    { name: 'Kuning (Yellow Milano)', color: 'Yellow Edition', hex: '#FFC000', photo: '/images/new jersey promotion/kuning-photo1.jpeg' },
                    { name: 'Merah (Red Milano)', color: 'Red Edition', hex: '#ff0000', photo: '/images/new jersey promotion/merah-photo1.jpeg' },
                  ].map((c) => (
                    <div
                      key={c.name}
                      onClick={() => router.push('/store/jersey-dlob-new-batch')}
                      className="group/item flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-white/30 shadow-md" style={{ backgroundColor: c.hex }} />
                        <div>
                          <p className="text-sm font-semibold text-white group-hover/item:text-emerald-300 transition-colors">{c.name}</p>
                          <p className="text-xs text-zinc-400">{c.color}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-zinc-400 group-hover/item:text-white flex items-center gap-1">
                        Pilih <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── DETAIL VIEW ──────────────────────────────────────────────── */}
      {selectedProductId && selectedProduct && selectedVariant && (
        <>
          <div className="bg-zinc-900/60 backdrop-blur-xl border-b border-white/10 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <span className="text-xs uppercase tracking-[0.25em] text-zinc-400 font-semibold mb-2 block">
                {selectedProduct.badge}
              </span>
              <h1 className="text-4xl font-light text-white mb-2 tracking-tight">{selectedProduct.name}</h1>
              <p className="text-sm text-zinc-400 max-w-xl mx-auto">{selectedProduct.tagline}</p>
            </div>
          </div>

          <Disclaimer />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-b border-white/10">
            <nav className="text-sm flex items-center gap-2">
              <span className="text-zinc-500">Beranda</span>
              <span className="text-zinc-600">/</span>
              <button onClick={backToCatalog} className="text-zinc-400 hover:text-white transition-colors">Jersey</button>
              <span className="text-zinc-600">/</span>
              <span className="text-white font-medium">{selectedProduct.name}</span>
            </nav>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <button
              onClick={backToCatalog}
              className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-all font-semibold group px-4 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Kembali ke Katalog
            </button>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

              {/* Images Column */}
              <div className="relative space-y-4">
                {!currentImage ? (
                  <div className="w-full aspect-3/4 flex flex-col items-center justify-center rounded-3xl bg-zinc-900 border border-white/10" style={{ backgroundColor: selectedVariant.bgColor || '#0f0f1a' }}>
                    <svg viewBox="0 0 200 200" className="w-48 h-48 opacity-20" fill="none" stroke="white" strokeWidth="1.5">
                      <rect x="20" y="20" width="60" height="60" rx="4" /><rect x="120" y="20" width="60" height="60" rx="4" />
                      <rect x="20" y="120" width="60" height="60" rx="4" /><rect x="120" y="120" width="60" height="60" rx="4" />
                    </svg>
                    <p className="text-white/50 text-xs tracking-widest uppercase mt-4">Foto Segera Hadir</p>
                    <p className="text-white/30 text-xs mt-1">{selectedVariant.color}</p>
                  </div>
                ) : (
                  <>
                    <ZoomableImage
                      src={currentImage}
                      alt={`${selectedProduct.name} - ${selectedVariant.color}`}
                      name={selectedVariant.name}
                      objectPositionOverride={currentImage.includes('pink8') ? '20% 50%' : undefined}
                    />
                    <div className="grid grid-cols-4 gap-4">
                      {selectedVariant.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`aspect-3/4 overflow-hidden bg-zinc-900 border-2 rounded-2xl transition-all ${
                            selectedImageIndex === index ? 'border-emerald-400 shadow-lg' : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <SmartCropImage
                            src={image}
                            alt={`${selectedProduct.name} ${index + 1}`}
                            name={selectedVariant.name}
                            objectPositionOverride={image.includes('pink8') ? '20% 50%' : undefined}
                          />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Other Colors Swatches Preview */}
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-zinc-400 mb-3 font-semibold uppercase tracking-wider">Pilihan Varian Warna Lainnya:</p>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedProduct.colorVariants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => { setSelectedColor(variant.id); setSelectedImageIndex(0); }}
                        className={`aspect-3/4 overflow-hidden rounded-2xl bg-zinc-900 border-2 transition-all ${
                          selectedColor === variant.id ? 'border-emerald-400 shadow-md' : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        {variant.images[0] ? (
                          <SmartCropImage
                            src={variant.images[0]}
                            alt={`${selectedProduct.name} - ${variant.color}`}
                            name={variant.name}
                            objectPositionOverride={variant.images[0].includes('pink8') ? '20% 50%' : undefined}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: variant.bgColor }}>
                            <span className="text-white/60 text-xs text-center px-1 font-medium">{variant.color}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Info Column */}
              <div className="py-4">
                <div className="mb-6">
                  <span className={`inline-block text-xs px-3 py-1 font-bold uppercase tracking-wider rounded-full mb-3 ${
                    selectedProduct.isClosed
                      ? 'bg-zinc-800 text-zinc-400 border border-white/10'
                      : selectedProduct.comingSoon
                      ? 'bg-zinc-800 text-zinc-400 border border-white/10'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {selectedProduct.badge}
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-light text-white mb-2">{selectedProduct.name}</h1>
                  <p className="text-base text-zinc-300 font-medium">Varian: {selectedVariant.color}</p>
                </div>

                {/* Closed Notice */}
                {selectedProduct.isClosed && (
                  <div className="mb-8 p-4 bg-zinc-900/90 border border-amber-500/30 rounded-2xl">
                    <p className="text-amber-300 font-semibold text-sm flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Pemesanan Batch Reguler Telah Ditutup</span>
                    </p>
                    <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                      Pemesanan untuk edisi batch reguler klasik saat ini telah ditutup. Silakan memesan edisi terbaru melalui <strong>Pre-Order New Batch 2026</strong> yang saat ini aktif dibuka!
                    </p>
                  </div>
                )}

                {!selectedProduct.comingSoon && !selectedProduct.isClosed && currentPrice && (
                  <div className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-extrabold text-emerald-400 font-mono">{formatPrice(currentPrice)}</span>
                      <span className="text-xs text-zinc-400 font-medium">/ pcs</span>
                    </div>
                    {selectedProduct.preOrder && (
                      <p className="text-xs text-emerald-300 font-medium mt-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Pre-Order Terbuka · Estimasi Produksi: {selectedProduct.estimatedDelivery}</span>
                      </p>
                    )}
                  </div>
                )}

                {selectedProduct.comingSoon && (
                  <div className="mb-8 p-4 bg-zinc-900 border border-white/10 rounded-2xl">
                    <p className="text-zinc-200 font-semibold text-sm flex items-center gap-2">
                      <span>🔒</span> Segera Hadir (Concept Preview)
                    </p>
                    <p className="text-zinc-400 text-xs mt-1">Jersey ini sedang dalam tahap finalisasi desain pabrik. Pantau terus update komunitas untuk pembukaan batch resmi!</p>
                  </div>
                )}

                {/* Choose Color */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Pilih Warna</h3>
                  <div className="flex gap-3">
                    {selectedProduct.colorVariants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedColor(variant.id)}
                        className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                          selectedColor === variant.id ? 'border-emerald-400 scale-110 shadow-lg' : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <div className="w-full h-full rounded-full" style={{ backgroundColor: variant.bgColor }} />
                        {selectedColor === variant.id && (
                          <div className="absolute inset-0 rounded-full border-2 border-white/60" />
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-300 mt-2 font-medium">Warna terpilih: <strong className="text-white">{selectedVariant.color}</strong></p>
                </div>

                {!selectedProduct.comingSoon && !selectedProduct.isClosed && (
                  <>
                    {/* Choose Sleeve */}
                    <div className="mb-8">
                      <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Pilih Tipe Lengan</h3>
                      <div className="flex flex-wrap gap-3">
                        {(['pendek', 'panjang'] as const).map((sleeve) => (
                          <button
                            key={sleeve}
                            onClick={() => setSelectedSleeve(sleeve)}
                            className={`px-6 py-2.5 rounded-full text-xs font-semibold border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                              selectedSleeve === sleeve
                                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-md'
                                : 'border-white/15 text-zinc-300 hover:border-white/30 bg-white/5'
                            }`}
                          >
                            {sleeve === 'pendek' ? 'Lengan Pendek' : 'Lengan Panjang (+Rp 10.000)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Choose Size */}
                    <div className="mb-8">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pilih Ukuran</h3>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setShowAIModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-md shadow-emerald-950/40 hover:scale-105 active:scale-95 transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-black animate-pulse" />
                            <span>D&apos;LOB AI Rekomendasi Ukuran</span>
                          </button>
                          <button
                            onClick={() => { setSizeGuideTab('dewasa'); setShowSizeGuideModal(true); }}
                            className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                          >
                            📏 Panduan Ukuran
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {allSizeOptions.filter((s) => s.category === 'dewasa').map((sizeObj) => (
                          <button
                            key={sizeObj.id}
                            onClick={() => setSelectedSize(sizeObj.id)}
                            className={`py-2.5 rounded-full text-xs font-bold border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                              selectedSize === sizeObj.id
                                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-md'
                                : 'border-white/15 text-zinc-300 hover:border-white/30 bg-white/5'
                            }`}
                          >
                            {sizeObj.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Description */}
                <div className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  <p>{selectedProduct.description}</p>
                </div>

                {/* Submit Pre-Order / Closed State Action */}
                <div className="space-y-4">
                  {selectedProduct.isClosed ? (
                    <button
                      onClick={() => router.push('/store/new-batch-pre-order')}
                      className="w-full py-4 font-bold text-sm uppercase tracking-widest transition-all bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-[1.02] active:scale-[0.98] rounded-full shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2"
                    >
                      <span>Beralih ke Pre-Order New Batch →</span>
                    </button>
                  ) : selectedProduct.comingSoon ? (
                    <button
                      disabled
                      className="w-full py-4 font-bold text-xs uppercase tracking-widest bg-zinc-800 text-zinc-500 cursor-not-allowed rounded-full border border-white/5"
                    >
                      SEGERA HADIR (CONCEPT PREVIEW)
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        router.push(
                          selectedProduct.id === 'nb-jersey'
                            ? '/store/new-batch-pre-order'
                            : '/pre-order'
                        )
                      }
                      className="w-full py-4 font-bold text-sm uppercase tracking-widest transition-all bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-[1.02] active:scale-[0.98] rounded-full shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2"
                    >
                      <span>PRE-ORDER SEKARANG</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Specs */}
                <div className="mt-10 pt-6 border-t border-white/10 space-y-3 text-xs">
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400 font-medium">Material Kain</span>
                    <span className="font-semibold text-white">{selectedProduct.material}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400 font-medium">Perawatan</span>
                    <span className="font-semibold text-white">{selectedProduct.care}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400 font-medium">Asal Produksi</span>
                    <span className="font-semibold text-white">{selectedProduct.origin}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
