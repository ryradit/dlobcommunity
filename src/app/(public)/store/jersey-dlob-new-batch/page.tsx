'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ArrowLeft, ChevronRight, ShieldCheck, Truck, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import SmartCropImage from '@/components/SmartCropImage';
import ZoomableImage from '@/components/ZoomableImage';

export type SizeCategory = 'dewasa' | 'kids' | 'balita';

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

const colorVariants: ColorVariant[] = [
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

const productInfo = {
  name: 'Jersey DLOB New Batch',
  tagline: 'Fresh Colors · Dewasa, Kids & Balita Edition',
  badge: 'NEW BATCH 2026',
  description:
    'Batch terbaru jersey resmi DLOB! Hadir dalam 3 pilihan warna cerah — Biru (#0b244c), Kuning (#FFC000), dan Merah (#ff0000). Tersedia dalam ukuran Dewasa, Kids (7-13 Tahun), dan Balita 👶 (1-6 Tahun). Menggunakan material Milano Standard premium yang ringan, adem, dan menyerap keringat dengan sangat baik untuk performa maksimal di lapangan badminton.',
  material: 'Milano Standard Premium',
  care: 'Cuci dengan air dingin, jangan gunakan pemutih, setrika suhu sedang',
  origin: 'Indonesia',
};

export default function JerseyDlobNewBatchPage() {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState('nb-blue');
  const [selectedCategory, setSelectedCategory] = useState<SizeCategory>('dewasa');
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedSleeve, setSelectedSleeve] = useState<'pendek' | 'panjang'>('pendek');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSizeGuideModal, setShowSizeGuideModal] = useState(false);
  const [sizeGuideTab, setSizeGuideTab] = useState<SizeCategory>('dewasa');

  const selectedVariant = colorVariants.find((v) => v.id === selectedColor) ?? colorVariants[0];
  const currentImage = selectedVariant.images[selectedImageIndex] ?? selectedVariant.images[0];
  
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

  return (
    <div className="min-h-screen bg-white">

      {/* ── Size Guide Modal (3 Tables) ── */}
      {showSizeGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📏 Panduan Ukuran Jersey DLOB New Batch
              </h2>
              <button
                onClick={() => setShowSizeGuideModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Category Tabs inside Modal */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-full mb-6">
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
                    <th className="text-left py-3 px-4 font-semibold">Keterangan</th>
                    <th className="text-right py-3 px-4 font-semibold">Tinggi (cm)</th>
                    <th className="text-right py-3 px-4 font-semibold">Lebar (cm)</th>
                    <th className="text-right py-3 px-4 font-semibold">Harga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allSizeOptions
                    .filter((s) => s.category === sizeGuideTab)
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-gray-900">{s.label}</td>
                        <td className="py-3 px-4 text-gray-600">{s.keterangan || 'Dewasa Standard'}</td>
                        <td className="text-right py-3 px-4 font-mono">{s.tinggi}</td>
                        <td className="text-right py-3 px-4 font-mono">{s.lebar}</td>
                        <td className="text-right py-3 px-4 font-mono font-bold text-emerald-600">
                          {formatPrice(s.pendekPrice)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">💡 Catatan Pengukuran:</p>
              <p>• Satuan ukuran dalam Centimeter (cm) dengan toleransi jahitan ±2cm.</p>
              <p>• Lengan panjang dikenakan biaya tambahan +Rp 10.000 dari harga lengan pendek.</p>
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

      {/* Header Banner */}
      <div className="bg-zinc-950 text-white py-12 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Official Collection · New Batch 2026</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight mb-2">
            DLOB JERSEY <span className="font-bold italic">NEW BATCH</span>
          </h1>
          <p className="text-sm text-zinc-300 max-w-xl mx-auto">{productInfo.tagline}</p>
        </div>
      </div>

      {/* Pre-Order Disclaimer & Logo Notice */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-3">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-5 py-4 shadow-xs">
          <span className="text-amber-500 text-xl mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold text-amber-900 text-sm">Informasi Pre-Order</p>
            <p className="text-amber-800 text-xs sm:text-sm mt-0.5 leading-relaxed">
              Jersey ini dijual secara <strong className="text-black">pre-order</strong>. Pesanan akan mulai diproses setelah kuota minimum{' '}
              <strong className="text-black">15 order</strong> terpenuhi. Terima kasih atas kesabaran dan dukungan Anda! 🏸
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 text-xs text-blue-900 shadow-xs">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span><strong>Catatan Logo:</strong> Logo di gambar dan video hanya contoh, aslinya sekarang sudah menggunakan logo official D&apos;LOB.</span>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200">
        <nav className="text-sm flex items-center gap-2">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-black transition-colors">Beranda</button>
          <span className="text-gray-400">/</span>
          <button onClick={() => router.push('/store')} className="text-gray-500 hover:text-black transition-colors">Store</button>
          <span className="text-gray-400">/</span>
          <span className="text-black font-medium">{productInfo.name}</span>
        </nav>
      </div>

      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => router.push('/store')}
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-black transition-all font-semibold group px-4 py-2 rounded-full border border-gray-200 hover:border-black hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Store
        </button>
      </div>

      {/* Product Detail Main Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images Column */}
          <div className="relative space-y-4">
            <ZoomableImage
              src={currentImage}
              alt={`${productInfo.name} - ${selectedVariant.name}`}
              name={selectedVariant.name}
            />
            <div className="grid grid-cols-4 gap-4">
              {selectedVariant.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-3/4 overflow-hidden rounded-2xl bg-gray-100 border-2 transition-all ${
                    selectedImageIndex === index ? 'border-black shadow-md' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <SmartCropImage
                    src={image}
                    alt={`${productInfo.name} ${index + 1}`}
                    name={selectedVariant.name}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Info Column */}
          <div className="py-2">
            <div className="mb-6">
              <span className="inline-block text-xs px-3 py-1 font-bold uppercase tracking-wider rounded-full bg-black text-white mb-3 shadow-xs">
                {productInfo.badge}
              </span>
              <h1 className="text-3xl sm:text-4xl font-light text-gray-900 mb-2">{productInfo.name}</h1>
              <p className="text-base text-gray-600 font-medium">Warna: {selectedVariant.color}</p>
            </div>

            {/* Price Card */}
            <div className="mb-8 p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-blue-600 font-mono">{formatPrice(currentPrice)}</span>
                <span className="text-xs text-gray-500 font-medium">/ pcs</span>
              </div>
              <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Pre-Order Terbuka · Estimasi Produksi: Kuota 15 Order</span>
              </p>
            </div>

            {/* Choose Color */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Pilih Warna</h3>
              <div className="flex gap-3">
                {colorVariants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => { setSelectedColor(variant.id); setSelectedImageIndex(0); }}
                    className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                      selectedColor === variant.id ? 'border-black scale-110 shadow-md' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="w-full h-full rounded-full" style={{ backgroundColor: variant.bgColor }} />
                    {selectedColor === variant.id && (
                      <div className="absolute inset-0 rounded-full border-2 border-white" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">Warna terpilih: <strong>{selectedVariant.color}</strong></p>
            </div>

            {/* Choose Category (Dewasa vs Kids vs Balita) */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Pilih Tipe Kategori Ukuran</h3>
              <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-full">
                <button
                  type="button"
                  onClick={() => handleCategoryChange('dewasa')}
                  className={`py-2.5 px-3 text-xs font-bold rounded-full transition-all ${
                    selectedCategory === 'dewasa'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  👤 Dewasa (110k)
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('kids')}
                  className={`py-2.5 px-3 text-xs font-bold rounded-full transition-all ${
                    selectedCategory === 'kids'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  👦 Kids (100k)
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('balita')}
                  className={`py-2.5 px-3 text-xs font-bold rounded-full transition-all ${
                    selectedCategory === 'balita'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  👶 Balita (100k)
                </button>
              </div>
            </div>

            {/* Choose Size */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Pilih Ukuran ({selectedCategory})</h3>
                <button
                  onClick={() => { setSizeGuideTab(selectedCategory); setShowSizeGuideModal(true); }}
                  className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                >
                  📏 Panduan Ukuran
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableSizes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSize(s.id)}
                    className={`py-3 px-3 border-2 rounded-2xl transition-all flex flex-col items-center justify-center ${
                      selectedSize === s.id
                        ? 'border-black bg-black text-white shadow-sm'
                        : 'border-gray-200 text-gray-700 hover:border-black hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-bold text-sm">{s.label}</span>
                    {s.keterangan && (
                      <span className={`text-[10px] mt-0.5 ${selectedSize === s.id ? 'text-gray-300' : 'text-gray-500'}`}>
                        {s.keterangan}
                      </span>
                    )}
                    <span className={`text-[10px] font-mono mt-0.5 ${selectedSize === s.id ? 'text-emerald-300' : 'text-gray-400'}`}>
                      {s.tinggi}x{s.lebar}cm
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Choose Sleeve */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Pilih Lengan</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'pendek', label: 'Lengan Pendek', extra: 'Standar' },
                  { value: 'panjang', label: 'Lengan Panjang', extra: '+Rp 10.000' },
                ].map((sleeve) => (
                  <button
                    key={sleeve.value}
                    onClick={() => setSelectedSleeve(sleeve.value as 'pendek' | 'panjang')}
                    className={`py-3 px-4 text-xs font-semibold border-2 rounded-full transition-all flex items-center justify-between ${
                      selectedSleeve === sleeve.value
                        ? 'border-black bg-black text-white shadow-sm'
                        : 'border-gray-200 text-gray-700 hover:border-black'
                    }`}
                  >
                    <span>{sleeve.label}</span>
                    <span className={`text-[11px] ${selectedSleeve === sleeve.value ? 'text-emerald-300' : 'text-gray-400'}`}>
                      {sleeve.extra}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-700 leading-relaxed">
              <p>{productInfo.description}</p>
            </div>

            {/* Submit Button */}
            <div className="space-y-4">
              <button
                onClick={() => router.push('/store/new-batch-pre-order')}
                className="w-full py-4 font-bold text-sm uppercase tracking-widest transition-all bg-black hover:bg-gray-800 text-white rounded-full hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
              >
                <span>Buka Form Pre-Order Sekarang</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Specs */}
            <div className="mt-10 pt-6 border-t border-gray-200 space-y-3 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Material</span>
                <span className="font-semibold text-gray-900">{productInfo.material}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Perawatan</span>
                <span className="font-semibold text-gray-900">{productInfo.care}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Asal Produksi</span>
                <span className="font-semibold text-gray-900">{productInfo.origin}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
