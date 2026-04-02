'use client';

import { useState, useEffect, useRef } from 'react';
import { Heart, ArrowLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SmartCropImage from '@/components/SmartCropImage';
import ZoomableImage from '@/components/ZoomableImage';

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
  { id: 'biru',   name: 'Biru Navy', color: 'Biru Navy', images: ['/images/members/model/biru3.png','/images/members/model/biru4.png','/images/members/model/biru5.png'], bgColor: '#0b244c' },
  { id: 'pink',   name: 'Pink',      color: 'Pink',      images: ['/images/members/model/pink8.png','/images/members/model/pink6.png','/images/members/model/pink7.png','/images/members/model/pink9.png'], bgColor: '#c8a19c' },
  { id: 'kuning', name: 'Kuning', color: 'Kuning', images: ['/images/members/model/kuning3.png','/images/members/model/kuning4.png','/images/members/model/kuning 5.png','/images/members/model/kuning6.png'], bgColor: '#fecb00' },
];

// --- DLOB Jersey - Noir ---
const circuitNoirColorVariants: ColorVariant[] = [
  { id: 'midnight',  name: 'Midnight Black',   color: 'Midnight Black',   images: ['/images/members/model/hitam1.jpeg','/images/members/model/hitam2.jpeg','/images/members/model/hitam3.jpeg'], bgColor: '#0d0d0d' },
  { id: 'charcoal',  name: 'Charcoal Grey',    color: 'Charcoal Grey',    images: ['/images/members/model/grey1.png','/images/members/model/grey2.jpeg','/images/members/model/grey3.png'], bgColor: '#3a3a3a' },
  { id: 'steelblue', name: 'Steel Blue Night', color: 'Steel Blue Night', images: ['/images/members/model/bluenight1.jpeg','/images/members/model/bluenight2.jpeg','/images/members/model/bluenight3.jpeg'], bgColor: '#1e2d40' },
  { id: 'blossomrose', name: 'Blossom Rose', color: 'Blossom Rose', images: ['/images/members/model/magentaspecial.png','/images/members/model/magentaspecial2.png','/images/members/model/magentaspecial3.png','/images/members/model/magentaspecial4.png','/images/members/model/magentaspecial5.png'], bgColor: '#c8a19c' },
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
  introductionVideos?: string[]; // New: video carousel for product introduction
}

const products: Product[] = [
  {
    id: 'official',
    name: 'Jersey DLOB Official',
    tagline: 'The Classic Edition',
    description: 'Jersey resmi DLOB dengan teknologi Milano Standard premium. Bahan berkualitas tinggi, nyaman dipakai, dan tahan lama. Tersedia dalam 3 pilihan warna eksklusif.',
    badge: 'NEW',
    badgeStyle: 'bg-white text-black',
    coverImage: '/images/members/model/biru3.png',
    coverBg: '#0b244c',
    colorVariants: officialColorVariants,
    material: 'Milano Standard',
    care: 'Cuci dengan air dingin',
    origin: 'Indonesia',
    preOrder: true,
    estimatedDelivery: 'Januari 2026',
    comingSoon: false,
    // Introductory videos - will shuffle automatically
    introductionVideos: [
      '/images/members/model/videomodel2.mp4',
      '/images/members/model/videomodel3.mp4',
      '/images/members/model/videomodel5.mp4',
    ],
  },
  {
    id: 'noir',
    name: 'DLOB Jersey – Noir',
    tagline: 'The Dark Edition',
    description: 'Jersey edisi spesial DLOB Noir dengan desain eksklusif bertema gelap dan modern. Terinspirasi dari sirkuit elektronik, cocok untuk tampilan sporty dan elegan.',
    badge: 'COMING SOON',
    badgeStyle: 'bg-white/20 text-white border border-white/30',
    coverImage: null,
    coverBg: '#0d0d0d',
    colorVariants: circuitNoirColorVariants,
    material: 'Milano Standard',
    care: 'Cuci dengan air dingin',
    origin: 'Indonesia',
    preOrder: true,
    estimatedDelivery: 'TBA',
    comingSoon: true,
    // Introductory video - highlights the Noir edition
    introductionVideos: [
      '/images/members/model/videomodel4.mp4',
      '/images/members/model/videomodel6.mp4',
      '/images/members/model/videomodel7.mp4',
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
  // Prioritize introductory videos if available
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
    setVideoErrors((prev) => new Set(prev).add(failedSrc));
  };

  useEffect(() => {
    // Only auto-rotate if multiple items available
    if (mediaItems.length <= 1) return;
    
    const interval = setInterval(() => {
      // fade out
      setVisible(false);
      timerRef.current = setTimeout(() => {
        setActiveIdx((i) => (i + 1) % mediaItems.length);
        setVisible(true);
      }, 800); // Longer fade-out (800ms) for smoother transitions
    }, currentIsVideo ? 9000 : 10000); // 9s for videos (includes fade), 10s for images
    
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaItems.length, activeIdx]);

  return (
    <button
      onClick={() => onOpen(product)}
      className="group text-left overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-400"
    >
      <div className="relative w-full aspect-4/5 overflow-hidden" style={{ backgroundColor: product.coverBg }}>
        {currentMedia ? (
          <div
            className="absolute inset-0 transition-opacity duration-800"
            style={{ opacity: visible ? 1 : 0 }}
          >
            {currentIsVideo ? (
              <video
                key={currentMedia}
                ref={videoRef}
                src={currentMedia}
                autoPlay
                muted
                playsInline
                loop={mediaItems.length === 1}
                preload="auto"
                crossOrigin="anonymous"
                poster={getFallbackImage() || undefined}
                className="w-full h-full object-cover bg-black"
                onError={() => handleVideoError(currentMedia)}
              />
            ) : (
              <>
                {isVideo(currentMedia) && videoErrors.has(currentMedia) ? (
                  getFallbackImage() ? (
                    <SmartCropImage 
                      src={getFallbackImage()!} 
                      alt={product.name} 
                      name={product.name} 
                      objectPositionOverride={getFallbackImage()?.includes('pink8') ? '20% 50%' : undefined} 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                  )
                ) : (
                  <SmartCropImage 
                    src={currentMedia} 
                    alt={product.name} 
                    name={product.name} 
                    objectPositionOverride={currentMedia.includes('pink8') ? '20% 50%' : undefined} 
                  />
                )}
              </>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <svg viewBox="0 0 200 200" className="w-32 h-32 opacity-30" fill="none" stroke="white" strokeWidth="1.5">
              <rect x="20" y="20" width="60" height="60" rx="4" /><rect x="120" y="20" width="60" height="60" rx="4" />
              <rect x="20" y="120" width="60" height="60" rx="4" /><rect x="120" y="120" width="60" height="60" rx="4" />
              <line x1="80" y1="50" x2="120" y2="50" /><line x1="80" y1="150" x2="120" y2="150" />
              <line x1="50" y1="80" x2="50" y2="120" /><line x1="150" y1="80" x2="150" y2="120" />
              <circle cx="100" cy="100" r="15" />
              <circle cx="50" cy="50" r="6" fill="white" opacity="0.5" /><circle cx="150" cy="50" r="6" fill="white" opacity="0.5" />
              <circle cx="50" cy="150" r="6" fill="white" opacity="0.5" /><circle cx="150" cy="150" r="6" fill="white" opacity="0.5" />
            </svg>
            <p className="text-white/50 text-sm tracking-widest uppercase">Coming Soon</p>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute top-4 left-4">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${product.badgeStyle}`}>{product.badge}</span>
        </div>
        <div className="absolute top-4 right-4 flex gap-1.5">
          {product.colorVariants.map((v) => (
            <div key={v.id} className="w-4 h-4 rounded-full border border-white/60 shadow" style={{ backgroundColor: v.bgColor }} />
          ))}
        </div>
        {/* Dot indicators - only show for multiple items */}
        {mediaItems.length > 1 && (
          <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1.5 z-20">
            {mediaItems.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIdx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6">
          <p className="text-xs uppercase tracking-widest text-white/70 mb-1">{product.tagline}</p>
          <h3 className="text-xl font-semibold text-white leading-tight">{product.name}</h3>
        </div>
      </div>
      <div className="bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{product.material}</p>
          {product.comingSoon ? (
            <p className="text-sm font-medium text-indigo-600 mt-0.5">Segera Hadir</p>
          ) : (
            <p className="text-sm font-medium text-gray-900 mt-0.5">Mulai {formatPrice(sizePrices[0].pendekPrice)}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-gray-400 group-hover:text-black transition-colors font-medium text-sm">
          Lihat Detail <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </button>
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

  // Disclaimer block reused in both views
  const Disclaimer = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl px-5 py-4">
        <span className="text-amber-500 text-xl mt-0.5">??</span>
        <div>
          <p className="font-semibold text-amber-800 text-sm">Informasi Pre-Order</p>
          <p className="text-amber-700 text-sm mt-0.5">
            Jersey ini dijual secara <span className="font-bold">pre-order</span>. Pesanan akan mulai diproses setelah kuota minimum{' '}
            <span className="font-bold">15 order</span> terpenuhi. Terima kasih atas kesabaran dan dukungan Anda! ??
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">

      {/* Size Guide Modal */}
      {showSizeGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">?? Panduan Ukuran Jersey</h2>
                <button onClick={() => setShowSizeGuideModal(false)} className="text-gray-500 hover:text-gray-900 text-2xl font-light">�</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Ukuran</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Tinggi (cm)</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Lebar (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeGuide.map((g, i) => (
                      <tr key={g.size} className={`border-b border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="py-3 px-4 font-semibold text-gray-900">{g.size}</td>
                        <td className="text-right py-3 px-4 text-gray-900">{g.tinggi}</td>
                        <td className="text-right py-3 px-4 text-gray-900">{g.lebar}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-900 leading-relaxed">
                  <span className="font-semibold">?? Catatan Penting:</span><br />
                  � Ukuran dalam centimeter (cm)<br />
                  � Toleransi pengukuran �2cm<br />
                  � Untuk fit yang lebih longgar, pilih 1 size lebih besar
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setShowSizeGuideModal(false)} className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors rounded-lg font-medium">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -- CATALOG VIEW ----------------------------------------------- */}
      {!selectedProductId && (
        <>
          {/* Hero */}
          <div className="relative w-full overflow-hidden" style={{ minHeight: '85vh' }}>
            {/* Background image */}
            <img
              src="/images/members/model/storeheroimage4.jpeg"
              alt="DLOB Store Hero"
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ imageRendering: 'auto', WebkitFontSmoothing: 'antialiased' }}
              loading="eager"
              draggable={false}
            />
            
            {/* Dark overlay — lighter to preserve image clarity */}
            <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-black/65" />

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-end h-full min-h-[85vh] max-w-7xl mx-auto px-6 sm:px-10 pb-16 pt-32">
              {/* Eyebrow */}
              <p className="text-xs uppercase tracking-[0.3em] text-white/70 mb-3 font-medium">
                DLOB Community · Official Collection
              </p>

              {/* Headline */}
              <h1 className="text-5xl sm:text-7xl font-light tracking-tight text-white leading-none mb-4">
                DLOB<br />
                <span className="font-bold italic">STORE</span>
              </h1>

              {/* Sub-copy */}
              <p className="text-base sm:text-lg text-white/80 max-w-md leading-relaxed mb-8">
                Jersey resmi DLOB Community. Kualitas premium, desain eksklusif, dan kenyamanan maksimal untuk setiap pertandingan.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 items-center">
                <button
                  onClick={() => {
                    document.getElementById('catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-3.5 bg-white text-black text-sm font-semibold uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  Lihat Koleksi
                </button>
                <button
                  onClick={() => {
                    document.getElementById('catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-3.5 border border-white/60 text-white text-sm font-semibold uppercase tracking-widest hover:border-white hover:bg-white/10 transition-colors"
                >
                  Pre-Order Sekarang
                </button>
              </div>

              {/* Stats strip */}
              <div className="flex gap-8 mt-12 border-t border-white/20 pt-6">
                <div>
                  <p className="text-2xl font-bold text-white">2</p>
                  <p className="text-xs text-white/60 uppercase tracking-wider mt-0.5">Koleksi</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">3</p>
                  <p className="text-xs text-white/60 uppercase tracking-wider mt-0.5">Pilihan Warna</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">Milano</p>
                  <p className="text-xs text-white/60 uppercase tracking-wider mt-0.5">Standard</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">7</p>
                  <p className="text-xs text-white/60 uppercase tracking-wider mt-0.5">Ukuran</p>
                </div>
              </div>
            </div>
          </div>

          <Disclaimer />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200">
            <nav className="text-sm">
              <span className="text-gray-500">Beranda</span>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-black font-medium">Jersey</span>
            </nav>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="catalog-grid">
            <h2 className="text-2xl font-light text-gray-900 mb-8 tracking-tight">Koleksi Jersey</h2>
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
          <div className="bg-gray-100 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl font-light text-gray-900 mb-3 tracking-tight">DLOB JERSEY</h1>
              <p className="text-base text-gray-600 max-w-xl mx-auto">{selectedProduct.tagline}</p>
            </div>
          </div>

          <Disclaimer />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200">
            <nav className="text-sm flex items-center gap-2">
              <span className="text-gray-500">Beranda</span>
              <span className="text-gray-400">/</span>
              <button onClick={backToCatalog} className="text-gray-500 hover:text-black transition-colors">Jersey</button>
              <span className="text-gray-400">/</span>
              <span className="text-black font-medium">{selectedProduct.name}</span>
            </nav>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <button onClick={backToCatalog} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors font-medium group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Kembali ke Katalog
            </button>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

              {/* Images column */}
              <div className="relative space-y-4">
                {!currentImage ? (
                  <div className="w-full aspect-3/4 flex flex-col items-center justify-center rounded-lg" style={{ backgroundColor: selectedVariant.bgColor || '#0f0f1a' }}>
                    <svg viewBox="0 0 200 200" className="w-48 h-48 opacity-25" fill="none" stroke="white" strokeWidth="1.5">
                      <rect x="20" y="20" width="60" height="60" rx="4" /><rect x="120" y="20" width="60" height="60" rx="4" />
                      <rect x="20" y="120" width="60" height="60" rx="4" /><rect x="120" y="120" width="60" height="60" rx="4" />
                      <line x1="80" y1="50" x2="120" y2="50" /><line x1="80" y1="150" x2="120" y2="150" />
                      <line x1="50" y1="80" x2="50" y2="120" /><line x1="150" y1="80" x2="150" y2="120" />
                      <circle cx="100" cy="100" r="15" />
                      <circle cx="50" cy="50" r="6" fill="white" opacity="0.5" /><circle cx="150" cy="50" r="6" fill="white" opacity="0.5" />
                      <circle cx="50" cy="150" r="6" fill="white" opacity="0.5" /><circle cx="150" cy="150" r="6" fill="white" opacity="0.5" />
                    </svg>
                    <p className="text-white/50 text-sm tracking-widest uppercase mt-4">Foto Segera Hadir</p>
                    <p className="text-white/30 text-xs mt-1">{selectedVariant.color}</p>
                  </div>
                ) : (
                  <>
                    <ZoomableImage src={currentImage} alt={`${selectedProduct.name} - ${selectedVariant.color}`} name={selectedVariant.name} objectPositionOverride={currentImage.includes('pink8') ? '20% 50%' : undefined} />
                    <div className="grid grid-cols-4 gap-4">
                      {selectedVariant.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`aspect-3/4 overflow-hidden bg-gray-100 border-2 transition-all ${selectedImageIndex === index ? 'border-black' : 'border-transparent hover:border-gray-300'}`}
                        >
                          <SmartCropImage src={image} alt={`${selectedProduct.name} ${index + 1}`} name={selectedVariant.name} objectPositionOverride={image.includes('pink8') ? '20% 50%' : undefined} />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-800 mb-3 font-medium">Pilihan warna lainnya:</p>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedProduct.colorVariants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => { setSelectedColor(variant.id); setSelectedImageIndex(0); }}
                          className={`aspect-3/4 overflow-hidden bg-gray-100 border-2 transition-all ${selectedColor === variant.id ? 'border-black' : 'border-transparent hover:border-gray-300'}`}
                        >
                          {variant.images[0] ? (
                            <SmartCropImage src={variant.images[0]} alt={`${selectedProduct.name} - ${variant.color}`} name={variant.name} objectPositionOverride={variant.images[0].includes('pink8') ? '20% 50%' : undefined} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: variant.bgColor }}>
                              <span className="text-white/60 text-xs text-center px-1">{variant.color}</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
              </div>

              {/* Info column */}
              <div className="py-8">
                <div className="mb-6">
                  <span className={`inline-block text-xs px-3 py-1 font-medium mb-4 ${selectedProduct.comingSoon ? 'bg-gray-800 text-white' : 'bg-black text-white'}`}>
                    {selectedProduct.badge}
                  </span>
                  <h1 className="text-3xl font-light text-gray-900 mb-2">{selectedProduct.name}</h1>
                  <p className="text-lg text-gray-800 mb-4 font-medium">{selectedVariant.color}</p>
                </div>

                {!selectedProduct.comingSoon && currentPrice && (
                  <div className="mb-8">
                    <span className="text-2xl font-bold text-blue-600">{formatPrice(currentPrice)}</span>
                    {selectedProduct.preOrder && (
                      <p className="text-sm text-green-600 font-medium mt-2">?? Pre-Order � Estimasi pengiriman {selectedProduct.estimatedDelivery}</p>
                    )}
                  </div>
                )}

                {selectedProduct.comingSoon && (
                  <div className="mb-8 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-indigo-700 font-semibold text-sm">?? Segera Hadir</p>
                    <p className="text-indigo-600 text-sm mt-1">Jersey ini sedang dalam tahap finalisasi desain. Stay tuned untuk info lebih lanjut!</p>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wide">Pilih Warna</h3>
                  <div className="flex gap-3">
                    {selectedProduct.colorVariants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedColor(variant.id)}
                        className={`relative w-12 h-12 rounded-full border-2 transition-all ${selectedColor === variant.id ? 'border-black scale-110' : 'border-gray-300 hover:border-gray-400'}`}
                      >
                        <div className="w-full h-full rounded-full" style={{ backgroundColor: variant.bgColor }} />
                        {selectedColor === variant.id && <div className="absolute inset-0 rounded-full border-2 border-white" />}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-800 mt-2 font-medium">Warna terpilih: {selectedVariant.color}</p>
                </div>

                {!selectedProduct.comingSoon && (
                  <>
                    <div className="mb-8">
                      <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wide">Pilih Lengan</h3>
                      <div className="flex gap-3">
                        {(['pendek', 'panjang'] as const).map((sleeve) => (
                          <button
                            key={sleeve}
                            onClick={() => setSelectedSleeve(sleeve)}
                            className={`px-6 py-3 text-sm font-medium border transition-all ${selectedSleeve === sleeve ? 'border-black bg-black text-white' : 'border-gray-300 text-gray-700 hover:border-black'}`}
                          >
                            {sleeve === 'pendek' ? 'Lengan Pendek' : 'Lengan Panjang (+Rp 10.000)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wide">Pilih Ukuran</h3>
                      <div className="grid grid-cols-7 gap-2">
                        {['XS','S','M','L','XL','XXL','3XL'].map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`py-3 text-sm font-medium border transition-all ${selectedSize === size ? 'border-black bg-black text-white' : 'border-gray-300 text-gray-700 hover:border-black hover:text-black'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setShowSizeGuideModal(true)} className="text-sm text-blue-600 hover:text-blue-800 mt-3 font-medium flex items-center gap-2">
                        ?? Lihat Panduan Ukuran
                      </button>
                    </div>
                  </>
                )}

                <div className="mb-8">
                  <p className="text-gray-800 leading-relaxed">{selectedProduct.description}</p>
                </div>

                <div className="space-y-4">
                  {selectedProduct.comingSoon ? (
                    <button disabled className="w-full py-4 font-medium text-sm uppercase tracking-wide bg-gray-200 text-gray-400 cursor-not-allowed">SEGERA HADIR</button>
                  ) : (
                    <button onClick={() => router.push('/pre-order')} className="w-full py-4 font-medium text-sm uppercase tracking-wide transition-colors bg-black text-white hover:bg-gray-800">
                      PRE-ORDER SEKARANG
                    </button>
                  )}
                  <div className="flex gap-4 text-sm">
                    <button className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors font-medium">
                      <Heart className="h-4 w-4" />Tambah ke Wishlist
                    </button>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-200 space-y-4">
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-700 font-medium">Material</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedProduct.material}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-700 font-medium">Perawatan</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedProduct.care}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-700 font-medium">Asal</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedProduct.origin}</span>
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
