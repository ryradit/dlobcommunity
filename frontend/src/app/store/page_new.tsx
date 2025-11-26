'use client';

import { useState } from 'react';
import { ShoppingCart, Star, Heart, Eye } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ColorVariant {
  id: string;
  name: string;
  color: string;
  image: string;
  bgColor: string;
}

const colorVariants: ColorVariant[] = [
  {
    id: 'blue',
    name: 'Navy Blue',
    color: 'Biru Navy',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
    bgColor: 'bg-blue-600'
  },
  {
    id: 'pink',
    name: 'Pink',
    color: 'Pink',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop&sat=-100&hue=320',
    bgColor: 'bg-pink-400'
  },
  {
    id: 'yellow',
    name: 'Yellow',
    color: 'Kuning',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=500&fit=crop&sat=100&hue=60',
    bgColor: 'bg-yellow-400'
  }
];

const baseProduct = {
  name: 'Jersey DLOB Official',
  price: 180000,
  originalPrice: 220000,
  category: 'jersey',
  rating: 4.8,
  reviews: 124,
  description: 'Jersey resmi DLOB dengan teknologi Dri-FIT premium. Bahan berkualitas tinggi, nyaman dipakai, dan tahan lama. Tersedia dalam 3 pilihan warna eksklusif.',
  inStock: true,
  isNew: true,
  discount: 18
};

export default function StorePage() {
  const [selectedColor, setSelectedColor] = useState('blue');
  const [selectedSize, setSelectedSize] = useState('');
  const [cart, setCart] = useState<string[]>([]);

  const selectedVariant = colorVariants.find(variant => variant.id === selectedColor) || colorVariants[0];

  const addToCart = (variantId: string) => {
    if (!cart.includes(variantId)) {
      setCart([...cart, variantId]);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : i < rating
            ? 'text-yellow-400 fill-current opacity-50'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-white">
      <Header currentPage="store" showAuth={true} />
      
      {/* Hero Banner */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-light text-gray-900 mb-6 tracking-tight">
              DLOB JERSEY
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
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
                src={selectedVariant.image}
                alt={`${baseProduct.name} - ${selectedVariant.color}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Color Variant Images */}
            <div className="grid grid-cols-3 gap-4">
              {colorVariants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedColor(variant.id)}
                  className={`aspect-3/4 overflow-hidden bg-gray-100 border-2 transition-all ${
                    selectedColor === variant.id ? 'border-black' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={variant.image}
                    alt={`${baseProduct.name} - ${variant.color}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
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
              <p className="text-lg text-gray-600 mb-4">
                {selectedVariant.color}
              </p>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-red-600">
                  {formatPrice(baseProduct.price)}
                </span>
                {baseProduct.originalPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(baseProduct.originalPrice)}
                  </span>
                )}
              </div>
              {baseProduct.discount && (
                <span className="text-sm text-red-600 font-medium">
                  Hemat {baseProduct.discount}% • Penawaran Terbatas
                </span>
              )}
            </div>

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
                    <div className={`w-full h-full rounded-full ${variant.bgColor}`}></div>
                    {selectedColor === variant.id && (
                      <div className="absolute inset-0 rounded-full border-2 border-white"></div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Warna terpilih: {selectedVariant.color}
              </p>
            </div>

            {/* Size Selection */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wide">
                Pilih Ukuran
              </h3>
              <div className="grid grid-cols-6 gap-2">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
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
            </div>

            {/* Product Description */}
            <div className="mb-8">
              <p className="text-gray-600 leading-relaxed">
                {baseProduct.description}
              </p>
            </div>

            {/* Add to Cart */}
            <div className="space-y-4">
              <button
                onClick={() => addToCart(selectedColor)}
                disabled={!selectedSize}
                className={`w-full py-4 font-medium text-sm uppercase tracking-wide transition-colors ${
                  selectedSize 
                    ? cart.includes(selectedColor)
                      ? 'bg-green-600 text-white'
                      : 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {cart.includes(selectedColor) 
                  ? 'SUDAH DI KERANJANG' 
                  : selectedSize 
                    ? 'TAMBAH KE KERANJANG' 
                    : 'PILIH UKURAN TERLEBIH DAHULU'
                }
              </button>
              
              <div className="flex gap-4 text-sm">
                <button className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors">
                  <Heart className="h-4 w-4" />
                  Tambah ke Wishlist
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors">
                  <Eye className="h-4 w-4" />
                  Panduan Ukuran
                </button>
              </div>
            </div>

            {/* Product Details */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="space-y-4">
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Material</span>
                  <span className="text-sm font-medium">100% Polyester Dri-FIT</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Perawatan</span>
                  <span className="text-sm font-medium">Cuci dengan air dingin</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Asal</span>
                  <span className="text-sm font-medium">Indonesia</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Rating</span>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {renderStars(baseProduct.rating)}
                    </div>
                    <span className="text-sm text-gray-600">
                      {baseProduct.rating} ({baseProduct.reviews} ulasan)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Section (Uniqlo style) */}
      <div className="bg-gray-50 py-16 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Dapatkan Info Terbaru
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Daftar newsletter untuk mendapatkan informasi koleksi terbaru, promosi eksklusif, 
            dan event DLOB Community langsung di email kamu.
          </p>
          <div className="max-w-md mx-auto flex gap-2">
            <input 
              type="email" 
              placeholder="Masukkan email kamu"
              className="flex-1 px-4 py-3 border border-gray-300 focus:outline-none focus:border-black text-sm"
            />
            <button className="bg-black text-white px-8 py-3 font-medium hover:bg-gray-800 transition-colors text-sm">
              DAFTAR
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Dengan mendaftar, kamu menyetujui kebijakan privasi kami.
          </p>
        </div>
      </div>

      {/* Customer Service */}
      <div className="bg-white border-t py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl mb-3">🚚</div>
              <h3 className="font-medium text-gray-900 mb-2">Gratis Ongkir</h3>
              <p className="text-sm text-gray-600">
                Gratis ongkos kirim untuk pembelian minimal Rp 300.000
              </p>
            </div>
            <div>
              <div className="text-2xl mb-3">↩️</div>
              <h3 className="font-medium text-gray-900 mb-2">30 Hari Retur</h3>
              <p className="text-sm text-gray-600">
                Jaminan retur hingga 30 hari jika tidak puas dengan produk
              </p>
            </div>
            <div>
              <div className="text-2xl mb-3">💬</div>
              <h3 className="font-medium text-gray-900 mb-2">Customer Service</h3>
              <p className="text-sm text-gray-600">
                Tim CS siap membantu 24/7 melalui WhatsApp dan email
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}