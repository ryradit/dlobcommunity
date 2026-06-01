'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, ArrowLeft, ChevronRight, X, Info, Sparkles, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SmartCropImage from '@/components/SmartCropImage';
import ZoomableImage from '@/components/ZoomableImage';

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
};

interface ColorVariant {
  id: string;
  name: string;
  color: string;
  images: string[];
  bgColor: string;
}

interface SizePrice {
  size: string;
  pendekPrice: number;
  panjangPrice: number;
}

// --- Jersey DLOB Official ---
const officialColorVariants: ColorVariant[] = [
  { 
    id: 'biru',   
    name: 'Biru Navy', 
    color: 'Biru Navy', 
    images: ['/images/members/model/biru3.png','/images/members/model/biru4.png','/images/members/model/biru5.png'], 
    bgColor: '#0b244c',
  },
  { 
    id: 'pink',   
    name: 'Pink',      
    color: 'Pink',      
    images: ['/images/members/model/pink8.png','/images/members/model/pink6.png','/images/members/model/pink7.png','/images/members/model/pink9.png'], 
    bgColor: '#c8a19c',
  },
  { 
    id: 'kuning', 
    name: 'Kuning', 
    color: 'Kuning', 
    images: ['/images/members/model/kuning3.png','/images/members/model/kuning4.png','/images/members/model/kuning 5.png','/images/members/model/kuning6.png'], 
    bgColor: '#fecb00',
  },
];

// --- DLOB Jersey - Noir ---
const circuitNoirColorVariants: ColorVariant[] = [
  { 
    id: 'midnight',  
    name: 'Midnight Black',   
    color: 'Midnight Black',   
    images: ['/images/members/model/hitam1.jpeg','/images/members/model/hitam2.jpeg','/images/members/model/hitam3.jpeg'], 
    bgColor: '#0d0d0d',
  },
  { 
    id: 'charcoal',  
    name: 'Charcoal Grey',    
    color: 'Charcoal Grey',    
    images: ['/images/members/model/grey1.png','/images/members/model/grey2.jpeg','/images/members/model/grey3.png'], 
    bgColor: '#3a3a3a',
  },
  { 
    id: 'steelblue', 
    name: 'Steel Blue Night', 
    color: 'Steel Blue Night', 
    images: ['/images/members/model/bluenight1.jpeg','/images/members/model/bluenight2.jpeg','/images/members/model/bluenight3.jpeg'], 
    bgColor: '#1e2d40',
  },
  { 
    id: 'blossomrose', 
    name: 'Blossom Rose', 
    color: 'Blossom Rose', 
    images: ['/images/members/model/magentaspecial.png','/images/members/model/magentaspecial2.png','/images/members/model/magentaspecial3.png','/images/members/model/magentaspecial4.png','/images/members/model/magentaspecial5.png'], 
    bgColor: '#c8a19c',
  },
];

const sizePrices: SizePrice[] = [
  { size: 'XS',  pendekPrice: 110000, panjangPrice: 120000 },
  { size: 'S',   pendekPrice: 110000, panjangPrice: 120000 },
  { size: 'M',   pendekPrice: 110000, panjangPrice: 120000 },
  { size: 'L',   pendekPrice: 110000, panjangPrice: 120000 },
  { size: 'XL',  pendekPrice: 110000, panjangPrice: 120000 },
  { size: 'XXL', pendekPrice: 120000, panjangPrice: 130000 },
  { size: '3XL', pendekPrice: 130000, panjangPrice: 140000 },
];

const sizeGuide = [
  { size: 'XS',  tinggi: 65, lebar: 45 },
  { size: 'S',   tinggi: 68, lebar: 48 },
  { size: 'M',   tinggi: 71, lebar: 51 },
  { size: 'L',   tinggi: 74, lebar: 54 },
  { size: 'XL',  tinggi: 77, lebar: 57 },
  { size: 'XXL', tinggi: 80, lebar: 62 },
  { size: '3XL', tinggi: 83, lebar: 65 },
];

interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  badgeStyle: string;
  coverImage: string | null;
  coverBg: string;
  colorVariants: ColorVariant[];
  material: string;
  care: string;
  origin: string;
  preOrder: boolean;
  estimatedDelivery: string;
  comingSoon: boolean;
  introductionVideos?: string[];
}

const products: Product[] = [
  {
    id: 'official',
    name: 'Jersey DLOB Official',
    tagline: 'The Classic Edition',
    description: 'Jersey resmi DLOB dengan teknologi Milano Standard premium. Bahan berkualitas tinggi, nyaman dipakai, dan tahan lama. Tersedia dalam 3 pilihan warna eksklusif.',
    badge: 'PRE-ORDER',
    badgeStyle: 'bg-white/95 text-neutral-800 border border-neutral-200/50 shadow-xs',
    coverImage: '/images/members/model/biru3.png',
    coverBg: '#0b244c',
    colorVariants: officialColorVariants,
    material: 'Milano Standard',
    care: 'Cuci dengan air dingin',
    origin: 'Indonesia',
    preOrder: true,
    estimatedDelivery: 'Januari 2026',
    comingSoon: false,
    introductionVideos: [
      SUPABASE_VIDEOS.videomodel1,
      SUPABASE_VIDEOS.videomodel3,
      SUPABASE_VIDEOS.videomodel5,
    ],
  },
  {
    id: 'noir',
    name: 'DLOB Jersey – Noir',
    tagline: 'The Dark Edition',
    description: 'Jersey edisi spesial DLOB Noir dengan desain eksklusif bertema gelap dan modern. Terinspirasi dari sirkuit elektronik, cocok untuk tampilan sporty dan elegan.',
    badge: 'COMING SOON',
    badgeStyle: 'bg-neutral-900/90 text-white border border-neutral-700/30',
    coverImage: null,
    coverBg: '#0d0d0d',
    colorVariants: circuitNoirColorVariants,
    material: 'Milano Standard',
    care: 'Cuci dengan air dingin',
    origin: 'Indonesia',
    preOrder: true,
    estimatedDelivery: 'TBA',
    comingSoon: true,
    introductionVideos: [
      SUPABASE_VIDEOS.videomodel4,
      SUPABASE_VIDEOS.videomodel6,
      SUPABASE_VIDEOS.videopromotionnoirblossom,
    ],
  },
];

// -- Auto-rotating catalog card with video support ---------------------
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
    setVideoErrors((prev) => {
      const next = new Set(prev);
      next.add(failedSrc);
      return next;
    });
  };

  const cleanupVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    if (mediaItems.length <= 1) return;
    const duration = currentIsVideo ? 20000 : 8000;
    
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

  return (
    <div
      onClick={() => onOpen(product)}
      className="group bg-white rounded-3xl overflow-hidden border border-neutral-200/50 hover:border-neutral-300 hover:shadow-[0_15px_40px_rgba(0,0,0,0.03)] transition-all duration-700 ease-out flex flex-col h-full cursor-pointer"
    >
      {/* Visual Frame */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-neutral-900">
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
                className="w-full h-full object-cover"
                onError={() => handleVideoError(currentMedia)}
                style={{ width: '100%', height: '100%', display: 'block' }}
              >
                <source src={currentMedia} type="video/mp4" />
              </video>
            ) : (
              <div className="w-full h-full transition-transform duration-1000 ease-out group-hover:scale-102">
                <SmartCropImage 
                  src={currentMedia} 
                  alt={product.name} 
                  name={product.name} 
                  objectPositionOverride={currentMedia.includes('pink8') ? '20% 50%' : undefined} 
                />
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 p-6 text-center">
            <ShoppingBag className="w-10 h-10 text-white/30 mb-3" />
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Edisi Terbatas</p>
          </div>
        )}

        {/* Elegant Top Badge & Color Indicators */}
        <div className="absolute top-5 left-5 z-10">
          <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${product.badgeStyle}`}>
            {product.badge}
          </span>
        </div>

        <div className="absolute top-5 right-5 z-10 flex gap-1.5">
          {product.colorVariants.map((v) => (
            <div 
              key={v.id} 
              className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-xs" 
              style={{ backgroundColor: v.bgColor }} 
            />
          ))}
        </div>

        {/* Slide Indicators */}
        {mediaItems.length > 1 && (
          <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-1.5 z-10">
            {mediaItems.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIdx ? 'w-4 h-1 bg-white' : 'w-1 h-1 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info Content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block mb-1">
            {product.tagline}
          </span>
          <h3 className="text-lg font-medium text-neutral-800 tracking-tight group-hover:text-[#1e4843] transition-colors duration-300">
            {product.name}
          </h3>
          <p className="text-xs text-neutral-500 font-light mt-1.5 leading-relaxed">
            Premium {product.material}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between">
          <div>
            {product.comingSoon ? (
              <span className="text-xs font-medium text-neutral-400">Segera Hadir</span>
            ) : (
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-400 font-semibold uppercase tracking-wider">Mulai dari</span>
                <span className="text-sm font-semibold text-neutral-800 mt-0.5">
                  {formatPrice(sizePrices[0].pendekPrice)}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-500 group-hover:text-[#1e4843] uppercase tracking-wider transition-colors">
            Lihat Detail <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StorePage() {
  const [selectedProductId, setSelectedProductId]   = useState<string | null>(null);
  const [selectedColor, setSelectedColor]           = useState('biru');
  const [selectedSize, setSelectedSize]             = useState('');
  const [selectedSleeve, setSelectedSleeve]         = useState<'pendek' | 'panjang'>('pendek');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSizeGuideModal, setShowSizeGuideModal] = useState(false);
  const router = useRouter();

  const selectedProduct  = products.find((p) => p.id === selectedProductId) ?? null;
  const selectedVariant  = selectedProduct
    ? selectedProduct.colorVariants.find((v) => v.id === selectedColor) ?? selectedProduct.colorVariants[0]
    : null;
  const currentImage     = selectedVariant?.images[selectedImageIndex] ?? selectedVariant?.images[0] ?? null;
  const selectedSizeData = sizePrices.find((sp) => sp.size === selectedSize);
  const currentPrice     = selectedSizeData
    ? (selectedSleeve === 'pendek' ? selectedSizeData.pendekPrice : selectedSizeData.panjangPrice)
    : null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const openProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setSelectedColor(product.colorVariants[0]?.id ?? '');
    setSelectedSize('');
    setSelectedSleeve('pendek');
    setSelectedImageIndex(0);
  };

  const backToCatalog = () => setSelectedProductId(null);

  // Elegant Minimalist Disclaimer Box
  const Disclaimer = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <div className="flex items-start gap-4 bg-neutral-50 border border-neutral-200/50 rounded-2xl p-5 shadow-xs">
        <div className="p-2 bg-white rounded-xl border border-neutral-200/60 text-[#1e4843]">
          <Info className="h-4 w-4" />
        </div>
        <div>
          <p className="font-semibold text-neutral-800 text-xs tracking-wide uppercase">Informasi Pre-Order</p>
          <p className="text-neutral-500 text-xs mt-1 leading-relaxed">
            Jersey ini diproduksi dengan sistem pre-order. Proses produksi akan berjalan setelah kuota minimum sebanyak <span className="font-semibold text-neutral-700">15 pesanan</span> terkumpul.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-neutral-800">

      {/* Size Guide Modal */}
      {showSizeGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-neutral-100 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-neutral-800 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1e4843]" /> Panduan Ukuran Jersey
                </h2>
                <button 
                  onClick={() => setShowSizeGuideModal(false)} 
                  className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400 hover:text-neutral-600" />
                </button>
              </div>

              <div className="overflow-hidden border border-neutral-200/60 rounded-xl">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold">
                      <th className="text-left py-3 px-4">Ukuran</th>
                      <th className="text-right py-3 px-4">Tinggi (cm)</th>
                      <th className="text-right py-3 px-4">Lebar (cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {sizeGuide.map((g, i) => (
                      <tr key={g.size} className={`hover:bg-neutral-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/30'}`}>
                        <td className="py-3.5 px-4 font-semibold text-neutral-800">{g.size}</td>
                        <td className="text-right py-3.5 px-4 text-neutral-600">{g.tinggi}</td>
                        <td className="text-right py-3.5 px-4 text-neutral-600">{g.lebar}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 p-4 bg-neutral-50 rounded-xl border border-neutral-200/40 text-neutral-500 text-[11px] leading-relaxed">
                <span className="font-semibold text-neutral-700">Catatan Pengukuran:</span>
                <ul className="list-disc pl-4 mt-1.5 space-y-1">
                  <li>Toleransi dimensi ukuran sekitar ±2cm karena penyusutan bahan.</li>
                  <li>Untuk kenyamanan lebih saat bermain aktif, kami sarankan memilih 1 tingkat ukuran di atas standard Anda.</li>
                </ul>
              </div>

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setShowSizeGuideModal(false)} 
                  className="px-6 py-2.5 bg-[#1e4843] hover:bg-[#162f2c] text-white transition-all duration-300 rounded-xl text-xs font-semibold tracking-wider uppercase"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -- CATALOG VIEW ----------------------------------------------- */}
      {!selectedProductId && (
        <>
          {/* Editorial Premium Hero Section */}
          <div 
            className="relative w-full overflow-hidden group" 
            style={{ minHeight: '80vh' }}
          >
            {/* Background image */}
            <img
              src="/images/members/model/storeheroimage4.jpeg"
              alt="DLOB Store Hero"
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-102"
              loading="eager"
              draggable={false}
            />
            
            {/* Dark overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/40 to-neutral-900/10 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-end h-full min-h-[80vh] max-w-7xl mx-auto px-6 sm:px-10 pb-20 pt-32">
              <div className="max-w-2xl">
                {/* Eyebrow */}
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 mb-3.5 font-bold">
                  DLOB Community · Official Collection
                </p>

                {/* Headline */}
                <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-white mb-4">
                  DLOB <span className="font-serif italic font-light text-white/90">Apparel</span>
                </h1>

                {/* Sub-copy */}
                <p className="text-sm sm:text-base text-white/80 leading-relaxed mb-8 max-w-md font-light">
                  Koleksi merchandise resmi DLOB Community. Dirancang dengan material berperforma tinggi untuk kenyamanan maksimal di lapangan dan gaya sporty yang premium.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3.5 items-center">
                  <button
                    onClick={() => {
                      document.getElementById('catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-6 py-3 bg-white text-neutral-950 text-xs font-bold uppercase tracking-widest hover:bg-neutral-100 transition-all duration-300 rounded-lg shadow-sm"
                  >
                    Mulai Belanja
                  </button>
                  <button
                    onClick={() => {
                      document.getElementById('catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-6 py-3 border border-white/30 text-white text-xs font-bold uppercase tracking-widest hover:border-white/60 hover:bg-white/10 transition-all duration-300 rounded-lg"
                  >
                    Pre-Order
                  </button>
                </div>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-4 gap-4 max-w-lg mt-12 pt-6 border-t border-white/15">
                <div>
                  <p className="text-lg font-semibold text-white">2</p>
                  <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold mt-0.5">Koleksi</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">3</p>
                  <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold mt-0.5">Warna</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">Milano</p>
                  <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold mt-0.5">Bahan</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">7</p>
                  <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold mt-0.5">Ukuran</p>
                </div>
              </div>
            </div>
          </div>

          <Disclaimer />

          {/* Breadcrumbs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 border-b border-neutral-100">
            <nav className="text-xs flex items-center space-x-2 text-neutral-400 font-medium">
              <span className="hover:text-neutral-600 transition-colors cursor-pointer">Beranda</span>
              <span>/</span>
              <span className="text-neutral-800">Apparel</span>
            </nav>
          </div>

          {/* Catalog Grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="catalog-grid">
            <div className="mb-10">
              <span className="text-[10px] text-[#1e4843] font-bold tracking-widest uppercase block mb-1">
                Kategori Produk
              </span>
              <h2 className="text-2xl font-semibold text-neutral-800 tracking-tight">Apparel & Jersey</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {products.map((product) => (
                <CatalogCard key={product.id} product={product} onOpen={openProduct} formatPrice={formatPrice} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* -- DETAIL VIEW ------------------------------------------------ */}
      {selectedProductId && selectedProduct && selectedVariant && (
        <>
          {/* Breadcrumbs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 border-b border-neutral-100">
            <nav className="text-xs flex items-center space-x-2 text-neutral-400 font-medium">
              <span className="hover:text-neutral-600 transition-colors cursor-pointer">Beranda</span>
              <span>/</span>
              <button onClick={backToCatalog} className="hover:text-neutral-600 transition-colors">Apparel</button>
              <span>/</span>
              <span className="text-neutral-800 font-semibold">{selectedProduct.name}</span>
            </nav>
          </div>

          {/* Back Action */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <button onClick={backToCatalog} className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-800 transition-colors font-semibold uppercase tracking-wider group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              Kembali ke Katalog
            </button>
          </div>

          <Disclaimer />

          {/* Product Detail */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

              {/* Images Carousel Column (7/12 width on large screens) */}
              <div className="lg:col-span-7 space-y-4">
                {!currentImage ? (
                  <div className="w-full aspect-[3/4] flex flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-neutral-50 p-6 text-center">
                    <ShoppingBag className="w-12 h-12 text-neutral-300 mb-3" />
                    <p className="text-neutral-500 text-sm font-semibold uppercase tracking-widest">Foto Belum Tersedia</p>
                    <p className="text-neutral-400 text-xs mt-1">{selectedVariant.color}</p>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <ZoomableImage 
                        src={currentImage} 
                        alt={`${selectedProduct.name} - ${selectedVariant.color}`} 
                        name={selectedVariant.name} 
                        objectPositionOverride={currentImage.includes('pink8') ? '20% 50%' : undefined} 
                        className="rounded-3xl border border-neutral-200/60"
                      />
                    </div>
                    
                    {/* Thumbnail Strip */}
                    <div className="grid grid-cols-4 gap-3.5">
                      {selectedVariant.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`aspect-[3/4] rounded-xl overflow-hidden bg-neutral-50 border-2 transition-all ${selectedImageIndex === index ? 'border-[#1e4843] scale-102' : 'border-transparent opacity-75 hover:opacity-100'}`}
                        >
                          <SmartCropImage src={image} alt={`${selectedProduct.name} ${index + 1}`} name={selectedVariant.name} objectPositionOverride={image.includes('pink8') ? '20% 50%' : undefined} />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Other Color Options Strip */}
                <div className="pt-6 border-t border-neutral-100">
                  <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-3">Varian Warna Lainnya:</p>
                  <div className="grid grid-cols-3 gap-3.5">
                    {selectedProduct.colorVariants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => { setSelectedColor(variant.id); setSelectedImageIndex(0); }}
                        className={`aspect-[3/4] rounded-xl overflow-hidden bg-neutral-50 border-2 transition-all ${selectedColor === variant.id ? 'border-[#1e4843] scale-102' : 'border-transparent opacity-70 hover:opacity-100'}`}
                      >
                        {variant.images[0] ? (
                          <SmartCropImage src={variant.images[0]} alt={`${selectedProduct.name} - ${variant.color}`} name={variant.name} objectPositionOverride={variant.images[0].includes('pink8') ? '20% 50%' : undefined} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-3" style={{ backgroundColor: variant.bgColor }}>
                            <span className="text-white/80 text-[10px] font-bold text-center uppercase tracking-wider">{variant.color}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Info Column (5/12 width on large screens) */}
              <div className="lg:col-span-5 flex flex-col justify-between py-2">
                <div>
                  <span className={`inline-block text-[9px] px-3 py-1 font-bold uppercase tracking-wider rounded-full mb-4 ${selectedProduct.comingSoon ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-700 border border-neutral-200/50 shadow-xs'}`}>
                    {selectedProduct.badge}
                  </span>
                  
                  <h1 className="text-2xl md:text-3xl font-semibold text-neutral-800 tracking-tight mb-2">
                    {selectedProduct.name}
                  </h1>
                  
                  <p className="text-sm font-medium text-neutral-500 mb-6">
                    Warna: {selectedVariant.color}
                  </p>

                  {/* Pricing Box */}
                  {!selectedProduct.comingSoon && currentPrice && (
                    <div className="mb-8 pb-6 border-b border-neutral-100">
                      <span className="text-3xl font-bold text-[#1e4843] tracking-tight">{formatPrice(currentPrice)}</span>
                      {selectedProduct.preOrder && (
                        <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mt-2.5 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-neutral-500" /> Estimasi Pengiriman: {selectedProduct.estimatedDelivery}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedProduct.comingSoon && (
                    <div className="mb-8 p-5 bg-neutral-50 border border-neutral-200/50 rounded-2xl">
                      <p className="text-[#1e4843] font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Segera Hadir
                      </p>
                      <p className="text-neutral-500 text-xs mt-1.5 leading-relaxed">
                        Desain jersey ini sedang dikonfirmasi secara detail. Daftarkan diri Anda pada pre-order segera setelah status dibuka!
                      </p>
                    </div>
                  )}

                  {/* Configurator */}
                  {!selectedProduct.comingSoon && (
                    <>
                      {/* Color Selector */}
                      <div className="mb-6">
                        <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-3">Warna</h3>
                        <div className="flex gap-3">
                          {selectedProduct.colorVariants.map((variant) => (
                            <button
                              key={variant.id}
                              onClick={() => { setSelectedColor(variant.id); setSelectedImageIndex(0); }}
                              className={`relative w-8 h-8 rounded-full transition-all duration-300 border ${selectedColor === variant.id ? 'ring-2 ring-[#1e4843] ring-offset-2 scale-105' : 'border-neutral-300 hover:scale-105'}`}
                            >
                              <div className="w-full h-full rounded-full" style={{ backgroundColor: variant.bgColor }} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sleeve Selector */}
                      <div className="mb-6">
                        <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-3">Lengan</h3>
                        <div className="flex gap-2">
                          {(['pendek', 'panjang'] as const).map((sleeve) => (
                            <button
                              key={sleeve}
                              onClick={() => setSelectedSleeve(sleeve)}
                              className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all duration-300 ${selectedSleeve === sleeve ? 'border-[#1e4843] bg-[#1e4843] text-white shadow-sm' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'}`}
                            >
                              {sleeve === 'pendek' ? 'Lengan Pendek' : 'Lengan Panjang (+10k)'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Size Grid */}
                      <div className="mb-8">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-widest">Ukuran</h3>
                          <button 
                            onClick={() => setShowSizeGuideModal(true)} 
                            className="text-[11px] font-bold text-[#1e4843] uppercase tracking-wider hover:underline"
                          >
                            Panduan Ukuran
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                          {['XS','S','M','L','XL','XXL','3XL'].map((size) => (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={`h-11 rounded-xl text-xs font-bold transition-all duration-300 border ${selectedSize === size ? 'border-[#1e4843] bg-[#1e4843] text-white shadow-xs' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'}`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Description */}
                  <div className="mb-8">
                    <p className="text-xs text-neutral-500 leading-relaxed font-light">
                      {selectedProduct.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions & Specs */}
                <div className="space-y-6">
                  <div>
                    {selectedProduct.comingSoon ? (
                      <button disabled className="w-full py-4 font-bold text-xs uppercase tracking-widest bg-neutral-100 text-neutral-400 rounded-xl cursor-not-allowed border border-neutral-200/50">
                        Segera Hadir
                      </button>
                    ) : (
                      <button 
                        onClick={() => router.push('/pre-order')} 
                        className="w-full py-4 font-bold text-xs uppercase tracking-widest transition-all duration-300 bg-[#1e4843] text-white hover:bg-[#162f2c] rounded-xl shadow-xs hover:shadow-lg"
                      >
                        Pre-Order Sekarang
                      </button>
                    )}
                  </div>

                  <div className="pt-6 border-t border-neutral-100 space-y-3.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400 font-medium">Bahan</span>
                      <span className="font-semibold text-neutral-700">{selectedProduct.material}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400 font-medium">Perawatan</span>
                      <span className="font-semibold text-neutral-700">{selectedProduct.care}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400 font-medium">Asal Produksi</span>
                      <span className="font-semibold text-neutral-700">{selectedProduct.origin}</span>
                    </div>
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
