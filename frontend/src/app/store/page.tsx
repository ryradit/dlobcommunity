'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ColorVariant {
  id: string;
  name: string;
  color: string;
  image: string;
  images: string[];
  bgColor: string;
}

const colorVariants: ColorVariant[] = [
  {
    id: 'blue',
    name: 'Navy Blue',
    color: 'Biru Navy',
    image: '/images/members/model/biru1.jpg',
    images: ['/images/members/model/biru1.jpg', '/images/members/model/biru2.jpg'],
    bgColor: 'bg-blue-600'
  },
  {
    id: 'pink',
    name: 'Pink',
    color: 'Pink',
    image: '/images/members/model/pink1.jpg',
    images: ['/images/members/model/pink1.jpg', '/images/members/model/pink2.jpg', '/images/members/model/pink3.jpg', '/images/members/model/pink4.jpg'],
    bgColor: 'bg-pink-400'
  },
  {
    id: 'yellow',
    name: 'Yellow',
    color: 'Kuning',
    image: '/images/members/model/kuning1.jpg',
    images: ['/images/members/model/kuning1.jpg', '/images/members/model/kuning2.jpg'],
    bgColor: 'bg-yellow-400'
  }
];

const baseProduct = {
  name: 'Jersey DLOB Official',
  price: 180000,
  originalPrice: 220000,
  category: 'jersey',
  description: 'Jersey resmi DLOB dengan teknologi Milano Standard premium. Bahan berkualitas tinggi, nyaman dipakai, dan tahan lama. Tersedia dalam 3 pilihan warna eksklusif.',
  inStock: true,
  isNew: true,
  discount: 18
};

export default function StorePage() {
  const [selectedColor, setSelectedColor] = useState('blue');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedSleeve, setSelectedSleeve] = useState('short'); // 'short' or 'long'
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const selectedVariant = colorVariants.find(variant => variant.id === selectedColor) || colorVariants[0];
  
  // Reset image index when color changes
  const handleColorChange = (colorId: string) => {
    setSelectedColor(colorId);
    setSelectedImageIndex(0);
  };

  // Size guide data
  const sizeGuide = [
    { size: 'S', tinggi: 68, lebar: 48 },
    { size: 'M', tinggi: 71, lebar: 51 },
    { size: 'L', tinggi: 74, lebar: 54 },
    { size: 'XL', tinggi: 77, lebar: 57 },
    { size: 'XXL', tinggi: 80, lebar: 62 },
    { size: '3XL', tinggi: 83, lebar: 65 }
  ];

  const getSizePrice = (size: string, sleeve: string = 'short') => {
    let basePrice;
    switch (size) {
      case 'S':
      case 'M':
      case 'L':
      case 'XL':
        basePrice = 110000;
        break;
      case 'XXL':
        basePrice = 120000;
        break;
      case '3XL':
        basePrice = 130000;
        break;
      default:
        basePrice = 110000; // Default price for S-XL
    }
    
    // Add long sleeve fee
    const longSleeveFee = sleeve === 'long' ? 10000 : 0;
    return basePrice + longSleeveFee;
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
      <Header currentPage="store" showAuth={true} />
      
      {/* Hero Banner */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-black mb-6 tracking-tight">
              DLOB JERSEY
            </h1>
            <p className="text-lg text-gray-800 max-w-2xl mx-auto leading-relaxed font-medium">
              Koleksi jersey resmi DLOB Community dengan kualitas premium. 
              Desain modern, bahan berkualitas tinggi, dan kenyamanan maksimal untuk setiap aktivitas.
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200">
        <nav className="text-sm">
          <span className="text-gray-700 font-medium">Beranda</span>
          <span className="mx-2 text-gray-600">/</span>
          <span className="text-black font-bold">Jersey</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-3/4 overflow-hidden bg-gray-100">
              <img
                src={selectedVariant.images[selectedImageIndex]}
                alt={`${baseProduct.name} - ${selectedVariant.color}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Image Thumbnails for Selected Color */}
            <div className="grid grid-cols-4 gap-2">
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
                    alt={`${baseProduct.name} - ${selectedVariant.color} - ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            
            {/* Color Variant Preview */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Pilihan Warna Lainnya:</h4>
              <div className="grid grid-cols-3 gap-3">
                {colorVariants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => handleColorChange(variant.id)}
                    className={`relative aspect-3/4 overflow-hidden bg-gray-100 border-2 transition-all ${
                      selectedColor === variant.id ? 'border-black' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={variant.image}
                      alt={`${baseProduct.name} - ${variant.color}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                      {variant.color}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="py-8">
            <div className="mb-6">
              {baseProduct.isNew && (
                <span className="inline-block bg-black text-white text-xs px-3 py-1 font-bold mb-4">
                  NEW
                </span>
              )}
              <h1 className="text-3xl font-bold text-black mb-2">
                {baseProduct.name}
              </h1>
              <p className="text-lg text-gray-800 mb-4 font-medium">
                {selectedVariant.color}
              </p>
            </div>

            {/* Price */}
            <div className="mb-8">
              {selectedSize ? (
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold text-black">
                    {formatPrice(getSizePrice(selectedSize, selectedSleeve))}
                  </span>
                  {selectedSleeve === 'long' && (
                    <span className="text-sm text-gray-600 font-medium">
                      (Termasuk biaya lengan panjang +Rp 10.000)
                    </span>
                  )}
                </div>
              ) : (
                <div className="mb-2">
                  <p className="text-lg font-bold text-black mb-2">Harga berdasarkan ukuran:</p>
                  <div className="space-y-2 text-sm text-gray-800">
                    <div className="border-b border-gray-200 pb-2">
                      <p className="font-medium text-black mb-1">Lengan Pendek:</p>
                      <div className="space-y-1 pl-3">
                        <div className="flex justify-between">
                          <span className="font-medium">S, M, L, XL:</span>
                          <span className="font-bold">{formatPrice(110000)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">XXL:</span>
                          <span className="font-bold">{formatPrice(120000)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">3XL:</span>
                          <span className="font-bold">{formatPrice(130000)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-black mb-1">Lengan Panjang (+Rp 10.000):</p>
                      <div className="space-y-1 pl-3">
                        <div className="flex justify-between">
                          <span className="font-medium">S, M, L, XL:</span>
                          <span className="font-bold">{formatPrice(120000)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">XXL:</span>
                          <span className="font-bold">{formatPrice(130000)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">3XL:</span>
                          <span className="font-bold">{formatPrice(140000)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-sm text-green-600 font-medium">
                📦 Pre-Order • Estimasi pengiriman Januari 2026
              </p>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-black mb-3 uppercase tracking-wide">
                Pilih Warna
              </h3>
              <div className="flex gap-3">
                {colorVariants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => handleColorChange(variant.id)}
                    className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                      selectedColor === variant.id ? 'border-black scale-110' : 'border-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div 
                      className="w-full h-full rounded-full"
                      style={{
                        backgroundColor: 
                          variant.id === 'blue' ? '#0b244c' :
                          variant.id === 'pink' ? '#c8a19c' :
                          variant.id === 'yellow' ? '#FECB00' :
                          undefined
                      }}
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
            <div className="mb-6">
              <h3 className="text-sm font-bold text-black mb-3 uppercase tracking-wide">
                Pilih Lengan
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedSleeve('short')}
                  className={`px-4 py-3 text-sm font-bold border-2 transition-all rounded ${
                    selectedSleeve === 'short' 
                      ? 'border-black bg-black text-white' 
                      : 'border-gray-400 text-black hover:border-black hover:bg-gray-100'
                  }`}
                >
                  Lengan Pendek
                </button>
                <button
                  onClick={() => setSelectedSleeve('long')}
                  className={`px-4 py-3 text-sm font-bold border-2 transition-all rounded ${
                    selectedSleeve === 'long' 
                      ? 'border-black bg-black text-white' 
                      : 'border-gray-400 text-black hover:border-black hover:bg-gray-100'
                  }`}
                >
                  Lengan Panjang <span className="text-xs">(+Rp 10.000)</span>
                </button>
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-black uppercase tracking-wide">
                  Pilih Ukuran
                </h3>
                <button 
                  onClick={() => setShowSizeGuide(!showSizeGuide)}
                  className="text-xs text-gray-800 hover:text-black underline font-medium"
                >
                  Panduan Ukuran
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {['S', 'M', 'L', 'XL', 'XXL', '3XL'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 text-sm font-bold border-2 transition-all ${
                      selectedSize === size 
                        ? 'border-black bg-black text-white' 
                        : 'border-gray-400 text-black hover:border-black hover:bg-gray-100'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              
              {/* Size Guide */}
              {showSizeGuide && (
                <div className="mt-4 p-6 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">📏</span>
                    </div>
                    <h4 className="text-lg font-bold text-black">Panduan Ukuran Jersey</h4>
                  </div>
                  
                  {/* Size Chart Table */}
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="font-bold text-black text-sm">UKURAN</div>
                        <div className="font-bold text-black text-sm text-center">TINGGI (cm)</div>
                        <div className="font-bold text-black text-sm text-center">LEBAR (cm)</div>
                      </div>
                    </div>
                    <div className="bg-white">
                      {sizeGuide.map((item, index) => (
                        <div 
                          key={item.size} 
                          className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                            index % 2 === 0 ? 'bg-gray-25' : 'bg-white'
                          } hover:bg-blue-50 transition-colors`}
                        >
                          <div className="grid grid-cols-3 gap-4">
                            <div className="font-bold text-black text-sm flex items-center">
                              <span className="bg-black text-white px-2 py-1 rounded text-xs mr-2">
                                {item.size}
                              </span>
                            </div>
                            <div className="font-medium text-gray-800 text-sm text-center">
                              {item.tinggi}
                            </div>
                            <div className="font-medium text-gray-800 text-sm text-center">
                              {item.lebar}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 text-sm">ℹ️</span>
                      <div className="text-xs text-blue-800">
                        <p className="font-medium mb-1">Catatan Penting:</p>
                        <ul className="space-y-1 text-blue-700">
                          <li>• Ukuran dalam centimeter (cm)</li>
                          <li>• Toleransi pengukuran ±2cm</li>
                          <li>• Diukur dalam keadaan jersey rata/flat</li>
                          <li>• Untuk fit yang lebih longgar, pilih 1 size lebih besar</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Product Description */}
            <div className="mb-8">
              <p className="text-gray-800 leading-relaxed font-medium">
                {baseProduct.description}
              </p>
            </div>

            {/* Utility Buttons */}
            <div className="space-y-4">
              <div className="flex gap-4 text-sm justify-center">
                <button 
                  onClick={() => setShowSizeGuide(!showSizeGuide)}
                  className="flex items-center gap-2 text-gray-800 hover:text-black transition-colors font-medium"
                >
                  <Eye className="h-4 w-4" />
                  Panduan Ukuran
                </button>
              </div>
            </div>

            {/* Product Details */}
            <div className="mt-12 pt-8 border-t border-gray-300">
              <div className="space-y-4">
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-800 font-medium">Material</span>
                  <span className="text-sm font-bold text-black">Milano Standard</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-800 font-medium">Perawatan</span>
                  <span className="text-sm font-bold text-black">Cuci dengan air dingin</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-800 font-medium">Asal</span>
                  <span className="text-sm font-bold text-black">Indonesia</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pre-Order Section */}
      <div className="bg-gray-50 py-16 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-black mb-6">
            Pre-Order Sekarang
          </h2>
          <p className="text-gray-800 font-medium mb-8 max-w-2xl mx-auto text-lg">
            Jersey DLOB Community edisi terbatas! Dapatkan kesempatan untuk memiliki jersey resmi 
            komunitas badminton terbaik dengan kualitas premium.
          </p>
          <div className="max-w-md mx-auto">
            <button 
              onClick={() => window.location.href = '/pre-order'}
              className="w-full bg-black text-white px-8 py-4 font-bold text-lg hover:bg-gray-800 transition-colors border-2 border-black hover:border-gray-800"
            >
              ISI FORM PRE-ORDER
            </button>
          </div>
          <p className="text-sm text-gray-700 font-medium mt-6">
            📅 Batas pre-order: 15 Desember 2025<br/>
            🚚 Estimasi pengiriman: Januari 2026
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}