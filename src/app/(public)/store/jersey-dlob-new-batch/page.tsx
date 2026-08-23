'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ArrowLeft, ChevronRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
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

const productInfo = {
  name: 'Jersey DLOB New Batch',
  tagline: 'Fresh Colors, Same Quality',
  badge: 'NEW BATCH',
  description:
    'Batch terbaru jersey resmi DLOB! Hadir dalam 3 pilihan warna cerah — Biru (#0b244c), Kuning (#FFC000), dan Merah (#ff0000). Menggunakan material Milano Standard premium yang ringan, adem, dan menyerap keringat dengan sangat baik untuk performa maksimal di lapangan badminton.',
  material: 'Milano Standard Premium',
  care: 'Cuci dengan air dingin, jangan gunakan pemutih, setrika suhu sedang',
  origin: 'Indonesia',
};

export default function JerseyDlobNewBatchPage() {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState('nb-blue');
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedSleeve, setSelectedSleeve] = useState<'pendek' | 'panjang'>('pendek');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSizeGuideModal, setShowSizeGuideModal] = useState(false);

  const selectedVariant = colorVariants.find((v) => v.id === selectedColor) ?? colorVariants[0];
  const currentImage = selectedVariant.images[selectedImageIndex] ?? selectedVariant.images[0];
  const selectedSizeData = sizePrices.find((sp) => sp.size === selectedSize) ?? sizePrices[2];
  const currentPrice = selectedSleeve === 'pendek' ? selectedSizeData.pendekPrice : selectedSizeData.panjangPrice;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="min-h-screen bg-white">
      {/* Size Guide Modal */}
      {showSizeGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📏 Panduan Ukuran Jersey</h2>
                <button
                  onClick={() => setShowSizeGuideModal(false)}
                  className="text-gray-400 hover:text-gray-900 text-2xl font-light p-1"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Ukuran</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Tinggi (cm)</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Lebar (cm)</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Harga Pendek</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Harga Panjang</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeGuide.map((g, i) => {
                      const sp = sizePrices.find((p) => p.size === g.size);
                      return (
                        <tr key={g.size} className={`border-b border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="py-3 px-4 font-semibold text-gray-900">{g.size}</td>
                          <td className="text-right py-3 px-4 text-gray-900">{g.tinggi}</td>
                          <td className="text-right py-3 px-4 text-gray-900">{g.lebar}</td>
                          <td className="text-right py-3 px-4 text-gray-900 font-medium">{formatPrice(sp?.pendekPrice || 110000)}</td>
                          <td className="text-right py-3 px-4 text-gray-900 font-medium">{formatPrice(sp?.panjangPrice || 120000)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-gray-900 leading-relaxed">
                  <span className="font-semibold">💡 Catatan Penting:</span><br />
                  • Ukuran dalam centimeter (cm)<br />
                  • Toleransi pengukuran ±2cm<br />
                  • Untuk fit yang lebih longgar, pilih 1 size lebih besar
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowSizeGuideModal(false)}
                  className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors rounded-xl font-medium text-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-zinc-950 text-white py-12 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-2">Official Collection · New Batch</p>
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight mb-2">
            DLOB JERSEY <span className="font-bold italic">NEW BATCH</span>
          </h1>
          <p className="text-sm text-white/70 max-w-xl mx-auto">{productInfo.tagline}</p>
        </div>
      </div>

      {/* Pre-Order Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl px-5 py-4">
          <span className="text-amber-500 text-xl mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Informasi Pre-Order</p>
            <p className="text-amber-700 text-sm mt-0.5">
              Jersey ini dijual secara <span className="font-bold">pre-order</span>. Pesanan akan mulai diproses setelah kuota minimum{' '}
              <span className="font-bold">15 order</span> terpenuhi. Terima kasih atas kesabaran dan dukungan Anda! 🏸
            </p>
          </div>
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
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors font-medium group"
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
            {currentImage ? (
              <>
                <ZoomableImage
                  src={currentImage}
                  alt={`${productInfo.name} - ${selectedVariant.name}`}
                  name={selectedVariant.name}
                />
                <div className="grid grid-cols-4 gap-3">
                  {selectedVariant.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-3/4 overflow-hidden rounded-xl bg-gray-100 border-2 transition-all ${
                        selectedImageIndex === index ? 'border-black shadow-md' : 'border-transparent hover:border-gray-300'
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
              </>
            ) : (
              <div className="w-full aspect-3/4 flex flex-col items-center justify-center rounded-2xl bg-zinc-900 text-white">
                <p className="text-sm tracking-widest uppercase">Foto Segera Hadir</p>
              </div>
            )}

            {/* Other Color Swatches Preview */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-800 mb-3 font-medium">Pilihan warna lainnya:</p>
              <div className="grid grid-cols-3 gap-3">
                {colorVariants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedColor(variant.id);
                      setSelectedImageIndex(0);
                    }}
                    className={`aspect-3/4 overflow-hidden rounded-xl bg-gray-100 border-2 transition-all ${
                      selectedColor === variant.id ? 'border-black shadow-md' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    {variant.images[0] ? (
                      <SmartCropImage
                        src={variant.images[0]}
                        alt={`${productInfo.name} - ${variant.name}`}
                        name={variant.name}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: variant.bgColor }}
                      >
                        <span className="text-white text-xs">{variant.name}</span>
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
              <span className="inline-block text-xs px-3 py-1 font-bold uppercase tracking-widest bg-black text-white rounded-full mb-4">
                {productInfo.badge}
              </span>
              <h1 className="text-3xl sm:text-4xl font-light text-gray-900 mb-2 tracking-tight">
                {productInfo.name}
              </h1>
              <p className="text-lg text-gray-700 font-semibold">{selectedVariant.name}</p>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-blue-600">{formatPrice(currentPrice)}</span>
                <span className="text-xs text-gray-500 font-medium">/ pcs</span>
              </div>
              <p className="text-sm text-green-600 font-semibold mt-2">
                ✓ Pre-Order Dibuka · Minimal Kuota 15 Order
              </p>
            </div>

            {/* Choose Color */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Pilih Warna</h3>
              <div className="flex gap-4">
                {colorVariants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedColor(variant.id);
                      setSelectedImageIndex(0);
                    }}
                    className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                      selectedColor === variant.id ? 'border-black scale-110 shadow-md' : 'border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div
                      className="w-full h-full rounded-full"
                      style={{ backgroundColor: variant.bgColor }}
                    />
                    {selectedColor === variant.id && (
                      <div className="absolute inset-0 rounded-full border-2 border-white" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-700 mt-3 font-medium">
                Warna terpilih: <span className="font-bold text-gray-900">{selectedVariant.name}</span>
              </p>
            </div>

            {/* Choose Sleeve */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Pilih Lengan</h3>
              <div className="flex gap-3">
                {(['pendek', 'panjang'] as const).map((sleeve) => (
                  <button
                    key={sleeve}
                    onClick={() => setSelectedSleeve(sleeve)}
                    className={`px-6 py-3 text-sm font-semibold border-2 rounded-xl transition-all ${
                      selectedSleeve === sleeve
                        ? 'border-black bg-black text-white shadow-sm'
                        : 'border-gray-200 text-gray-700 hover:border-black'
                    }`}
                  >
                    {sleeve === 'pendek' ? 'Lengan Pendek' : 'Lengan Panjang (+Rp 10.000)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Choose Size */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Pilih Ukuran</h3>
                <button
                  onClick={() => setShowSizeGuideModal(true)}
                  className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                >
                  📏 Lihat Panduan Ukuran
                </button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 text-sm font-bold border-2 rounded-xl transition-all ${
                      selectedSize === size
                        ? 'border-black bg-black text-white shadow-sm'
                        : 'border-gray-200 text-gray-700 hover:border-black'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8 p-5 bg-gray-50 rounded-2xl border border-gray-200">
              <p className="text-gray-700 text-sm leading-relaxed">{productInfo.description}</p>
            </div>

            {/* Pre-Order CTA Button */}
            <div className="space-y-4">
              <button
                onClick={() => router.push('/store/new-batch-pre-order')}
                className="w-full py-4.5 font-bold text-sm uppercase tracking-widest transition-all bg-black text-white hover:bg-gray-800 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span>PRE-ORDER SEKARANG</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Product Specifications */}
            <div className="mt-10 pt-8 border-t border-gray-200 space-y-3 text-sm">
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 font-medium">Material</span>
                <span className="font-semibold text-gray-900">{productInfo.material}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 font-medium">Perawatan</span>
                <span className="font-semibold text-gray-900">{productInfo.care}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 font-medium">Asal</span>
                <span className="font-semibold text-gray-900">{productInfo.origin}</span>
              </div>
            </div>

            {/* Guarantees */}
            <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 text-center">
              <div className="flex flex-col items-center gap-1.5 text-xs text-gray-600">
                <ShieldCheck className="w-5 h-5 text-gray-800" />
                <span className="font-semibold">Kualitas Premium</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-xs text-gray-600">
                <Truck className="w-5 h-5 text-gray-800" />
                <span className="font-semibold">Pengiriman Aman</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-xs text-gray-600">
                <RefreshCw className="w-5 h-5 text-gray-800" />
                <span className="font-semibold">Garansi Ukuran</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
