'use client';

import { useState } from 'react';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';

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
    id: 'biru',
    name: 'Biru Navy',
    color: 'Biru Navy',
    images: ['/images/members/model/biru1.jpg', '/images/members/model/biru2.jpg'],
    bgColor: '#0b244c'
  },
  {
    id: 'pink',
    name: 'Pink',
    color: 'Pink',
    images: ['/images/members/model/pink1.jpg', '/images/members/model/pink2.jpg', '/images/members/model/pink3.jpg', '/images/members/model/pink4.jpg'],
    bgColor: '#c8a19c'
  },
  {
    id: 'kuning',
    name: 'Kuning',
    color: 'Kuning',
    images: ['/images/members/model/kuning1.jpg', '/images/members/model/kuning2.jpg'],
    bgColor: '#fecb00'
  }
];

const sizePrices: SizePrice[] = [
  { size: 'XS', pendekPrice: 110000, panjangPrice: 120000 },
  { size: 'S', pendekPrice: 110000, panjangPrice: 120000 },
  { size: 'M', pendekPrice: 110000, panjangPrice: 120000 },
  { size: 'L', pendekPrice: 110000, panjangPrice: 120000 },
  { size: 'XL', pendekPrice: 110000, panjangPrice: 120000 },
  { size: 'XXL', pendekPrice: 120000, panjangPrice: 130000 },
  { size: '3XL', pendekPrice: 130000, panjangPrice: 140000 },
];

const sizeGuide = [
  { size: 'XS', tinggi: 65, lebar: 45 },
  { size: 'S', tinggi: 68, lebar: 48 },
  { size: 'M', tinggi: 71, lebar: 51 },
  { size: 'L', tinggi: 74, lebar: 54 },
  { size: 'XL', tinggi: 77, lebar: 57 },
  { size: 'XXL', tinggi: 80, lebar: 62 },
  { size: '3XL', tinggi: 83, lebar: 65 },
];

const baseProduct = {
  name: 'Jersey DLOB Official',
  category: 'jersey',
  description: 'Jersey resmi DLOB dengan teknologi Milano Standard premium. Bahan berkualitas tinggi, nyaman dipakai, dan tahan lama. Tersedia dalam 3 pilihan warna eksklusif.',
  inStock: true,
  isNew: true,
  material: 'Milano Standard',
  care: 'Cuci dengan air dingin',
  origin: 'Indonesia',
  preOrder: true,
  estimatedDelivery: 'Januari 2026'
};

export default function StorePage() {
  const [selectedColor, setSelectedColor] = useState('biru');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedSleeve, setSelectedSleeve] = useState<'pendek' | 'panjang'>('pendek');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [cart, setCart] = useState<string[]>([]);
  const [showSizeGuideModal, setShowSizeGuideModal] = useState(false);
  const router = useRouter();

  const selectedVariant = colorVariants.find(variant => variant.id === selectedColor) || colorVariants[0];
  const currentImage = selectedVariant.images[selectedImageIndex] || selectedVariant.images[0];
  const selectedSizeData = sizePrices.find(sp => sp.size === selectedSize);
  const currentPrice = selectedSizeData 
    ? (selectedSleeve === 'pendek' ? selectedSizeData.pendekPrice : selectedSizeData.panjangPrice)
    : null;

  const addToCart = (variantId: string) => {
    const cartItem = `${variantId}-${selectedSize}-${selectedSleeve}`;
    if (!cart.includes(cartItem)) {
      setCart([...cart, cartItem]);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* Size Guide Modal */}
      {showSizeGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📏 Panduan Ukuran Jersey</h2>
                <button
                  onClick={() => setShowSizeGuideModal(false)}
                  className="text-gray-500 hover:text-gray-900 text-2xl font-light"
                >
                  ×
                </button>
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
                    {sizeGuide.map((guide, index) => (
                      <tr key={guide.size} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="py-3 px-4 font-semibold text-gray-900">{guide.size}</td>
                        <td className="text-right py-3 px-4 text-gray-900">{guide.tinggi}</td>
                        <td className="text-right py-3 px-4 text-gray-900">{guide.lebar}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
                  className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors rounded-lg font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-light text-gray-900 mb-6 tracking-tight">
              DLOB JERSEY
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Koleksi jersey resmi DLOB Community dengan kualitas premium. 
              Desain modern, bahan berkualitas tinggi, dan kenyamanan maksimal untuk setiap aktivitas.
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200">
        <nav className="text-sm">
          <span className="text-gray-500">Beranda</span>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-black font-medium">Jersey</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-3/4 overflow-hidden bg-gray-100">
              <img
                src={currentImage}
                alt={`${baseProduct.name} - ${selectedVariant.color}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Image Thumbnails */}
            <div className="grid grid-cols-4 gap-4">
              {selectedVariant.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-3/4 overflow-hidden bg-gray-100 border-2 transition-all ${
                    selectedImageIndex === index ? 'border-black' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${baseProduct.name} - ${selectedVariant.color} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            
            {/* Color Variant Selection */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-800 mb-3 font-medium">Pilihan warna lainnya:</p>
              <div className="grid grid-cols-3 gap-4">
                {colorVariants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedColor(variant.id);
                      setSelectedImageIndex(0);
                    }}
                    className={`aspect-3/4 overflow-hidden bg-gray-100 border-2 transition-all ${
                      selectedColor === variant.id ? 'border-black' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={variant.images[0]}
                      alt={`${baseProduct.name} - ${variant.color}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="py-8">
            <div className="mb-6">
              {baseProduct.isNew && (
                <span className="inline-block bg-black text-white text-xs px-3 py-1 font-medium mb-4">
                  NEW
                </span>
              )}
              <h1 className="text-3xl font-light text-gray-900 mb-2">
                {baseProduct.name}
              </h1>
              <p className="text-lg text-gray-800 mb-4 font-medium">
                {selectedVariant.color}
              </p>
            </div>

            {/* Price Section */}
            {currentPrice && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(currentPrice)}
                  </span>
                </div>
                {baseProduct.preOrder && (
                  <span className="text-sm text-green-600 font-medium">
                    📦 Pre-Order • Estimasi pengiriman {baseProduct.estimatedDelivery}
                  </span>
                )}
              </div>
            )}

            {/* Color Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wide">
                Pilih Warna
              </h3>
              <div className="flex gap-3">
                {colorVariants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedColor(variant.id)}
                    className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                      selectedColor === variant.id ? 'border-black scale-110' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div 
                      className="w-full h-full rounded-full"
                      style={{ backgroundColor: variant.bgColor }}
                    ></div>
                    {selectedColor === variant.id && (
                      <div className="absolute inset-0 rounded-full border-2 border-white"></div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-800 mt-2 font-medium">
                Warna terpilih: {selectedVariant.color}
              </p>
            </div>

            {/* Sleeve Selection */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wide">
                Pilih Lengan
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedSleeve('pendek')}
                  className={`px-6 py-3 text-sm font-medium border transition-all ${
                    selectedSleeve === 'pendek'
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 text-gray-700 hover:border-black'
                  }`}
                >
                  Lengan Pendek
                </button>
                <button
                  onClick={() => setSelectedSleeve('panjang')}
                  className={`px-6 py-3 text-sm font-medium border transition-all ${
                    selectedSleeve === 'panjang'
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 text-gray-700 hover:border-black'
                  }`}
                >
                  Lengan Panjang (+Rp 10.000)
                </button>
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wide">
                Pilih Ukuran
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 text-sm font-medium border transition-all ${
                      selectedSize === size 
                        ? 'border-black bg-black text-white' 
                        : 'border-gray-300 text-gray-700 hover:border-black hover:text-black'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setShowSizeGuideModal(true)}
                className="text-sm text-blue-600 hover:text-blue-800 mt-3 font-medium flex items-center gap-2"
              >
                📏 Lihat Panduan Ukuran
              </button>
            </div>

            {/* Product Description */}
            <div className="mb-8">
              <p className="text-gray-800 leading-relaxed">
                {baseProduct.description}
              </p>
            </div>

            {/* Add to Cart */}
            <div className="space-y-4">
              <button
                onClick={() => router.push('/pre-order')}
                className="w-full py-4 font-medium text-sm uppercase tracking-wide transition-colors bg-black text-white hover:bg-gray-800"
              >
                PRE-ORDER SEKARANG
              </button>
              
              <div className="flex gap-4 text-sm">
                <button className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors font-medium">
                  <Heart className="h-4 w-4" />
                  Tambah ke Wishlist
                </button>
              </div>
            </div>
            {/* Product Details */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="space-y-4">
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-700 font-medium">Material</span>
                  <span className="text-sm font-semibold text-gray-900">{baseProduct.material}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-700 font-medium">Perawatan</span>
                  <span className="text-sm font-semibold text-gray-900">{baseProduct.care}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-700 font-medium">Asal</span>
                  <span className="text-sm font-semibold text-gray-900">{baseProduct.origin}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>      
      <Footer />
    </div>
  );
}
