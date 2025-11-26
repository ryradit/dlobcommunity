'use client';

import { useState } from 'react';
import { ShoppingCart, Star, Heart, Eye, Filter, SortAsc } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  description: string;
  inStock: boolean;
  isNew?: boolean;
  discount?: number;
}

const products: Product[] = [
  {
    id: '1',
    name: 'Jersey DLOB Official',
    price: 150000,
    originalPrice: 200000,
    image: '/images/store/jersey-dlob.jpg',
    category: 'pakaian',
    rating: 4.8,
    reviews: 124,
    description: 'Jersey resmi DLOB dengan bahan Dri-FIT yang nyaman dan breathable. Sempurna untuk pertandingan dan latihan.',
    inStock: true,
    isNew: true,
    discount: 25
  },
  {
    id: '2',
    name: 'Raket Yonex Arcsaber 11',
    price: 2500000,
    image: '/images/store/raket-yonex.jpg',
    category: 'raket',
    rating: 4.9,
    reviews: 89,
    description: 'Raket profesional untuk pemain tingkat menengah ke atas. Kontrol dan power yang seimbang.',
    inStock: true
  },
  {
    id: '3',
    name: 'Sepatu Victor SH-A922',
    price: 850000,
    originalPrice: 1000000,
    image: '/images/store/sepatu-victor.jpg',
    category: 'sepatu',
    rating: 4.7,
    reviews: 67,
    description: 'Sepatu badminton dengan teknologi anti-slip dan cushioning terbaik untuk performa maksimal.',
    inStock: true,
    discount: 15
  },
  {
    id: '4',
    name: 'Tas Raket DLOB Premium',
    price: 250000,
    image: '/images/store/tas-dlob.jpg',
    category: 'aksesori',
    rating: 4.6,
    reviews: 156,
    description: 'Tas raket eksklusif DLOB dengan kompartmen terpisah untuk raket, sepatu, dan perlengkapan lainnya.',
    inStock: true,
    isNew: true
  },
  {
    id: '5',
    name: 'Shuttlecock Yonex AS-50',
    price: 65000,
    image: '/images/store/shuttlecock.jpg',
    category: 'shuttlecock',
    rating: 4.5,
    reviews: 234,
    description: 'Shuttlecock premium dengan bulu angsa asli. Durabilitas tinggi untuk pertandingan resmi.',
    inStock: true
  },
  {
    id: '6',
    name: 'Kaos DLOB Community',
    price: 120000,
    image: '/images/store/kaos-dlob.jpg',
    category: 'pakaian',
    rating: 4.4,
    reviews: 78,
    description: 'Kaos casual DLOB untuk kegiatan sehari-hari. 100% cotton dengan desain komunitas yang keren.',
    inStock: false
  },
  {
    id: '7',
    name: 'Grip Overgrip Yonex',
    price: 35000,
    image: '/images/store/grip.jpg',
    category: 'aksesori',
    rating: 4.3,
    reviews: 145,
    description: 'Overgrip berkualitas tinggi untuk kenyamanan dan kontrol raket yang lebih baik.',
    inStock: true
  },
  {
    id: '8',
    name: 'Topi DLOB Snapback',
    price: 95000,
    image: '/images/store/topi-dlob.jpg',
    category: 'aksesori',
    rating: 4.2,
    reviews: 43,
    description: 'Topi snapback dengan logo DLOB. Cocok untuk gaya kasual dan melindungi dari sinar matahari.',
    inStock: true,
    isNew: true
  }
];

const categories = [
  { id: 'semua', name: 'Semua Produk', count: products.length },
  { id: 'pakaian', name: 'Pakaian', count: products.filter(p => p.category === 'pakaian').length },
  { id: 'raket', name: 'Raket', count: products.filter(p => p.category === 'raket').length },
  { id: 'sepatu', name: 'Sepatu', count: products.filter(p => p.category === 'sepatu').length },
  { id: 'aksesori', name: 'Aksesori', count: products.filter(p => p.category === 'aksesori').length },
  { id: 'shuttlecock', name: 'Shuttlecock', count: products.filter(p => p.category === 'shuttlecock').length },
];

export default function StorePage() {
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [sortBy, setSortBy] = useState('popular');
  const [cart, setCart] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const filteredProducts = products.filter(product => 
    selectedCategory === 'semua' || product.category === selectedCategory
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      default: // popular
        return b.reviews - a.reviews;
    }
  });

  const addToCart = (productId: string) => {
    if (!cart.includes(productId)) {
      setCart([...cart, productId]);
    }
  };

  const toggleWishlist = (productId: string) => {
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter(id => id !== productId));
    } else {
      setWishlist([...wishlist, productId]);
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
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="store" showAuth={true} />
      
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🏪 DLOB Store
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Toko resmi perlengkapan badminton DLOB Community. 
              Dapatkan merchandise eksklusif dan peralatan berkualitas tinggi untuk meningkatkan performa permainanmu!
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-1/4">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Kategori
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{category.name}</span>
                        <span className="text-sm text-gray-500">({category.count})</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <SortAsc className="h-5 w-5 mr-2" />
                  Urutkan
                </h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="popular">Paling Populer</option>
                  <option value="price-low">Harga Terendah</option>
                  <option value="price-high">Harga Tertinggi</option>
                  <option value="rating">Rating Tertinggi</option>
                  <option value="name">Nama A-Z</option>
                </select>
              </div>

              {/* Cart Summary */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-blue-900">Keranjang</span>
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm text-blue-700">
                  {cart.length} item dalam keranjang
                </p>
                {cart.length > 0 && (
                  <button className="w-full mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Lihat Keranjang
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="w-full lg:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {selectedCategory === 'semua' ? 'Semua Produk' : categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <p className="text-gray-600">
                Menampilkan {sortedProducts.length} produk
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    <div className="w-full h-full bg-linear-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">
                          {product.category === 'pakaian' ? '👕' : 
                           product.category === 'raket' ? '🏸' :
                           product.category === 'sepatu' ? '👟' :
                           product.category === 'shuttlecock' ? '🏸' : '🎒'}
                        </div>
                        <p className="text-xs text-gray-600">Gambar Produk</p>
                      </div>
                    </div>
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.isNew && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          BARU
                        </span>
                      )}
                      {product.discount && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          -{product.discount}%
                        </span>
                      )}
                      {!product.inStock && (
                        <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                          HABIS
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className={`p-2 rounded-full shadow-md ${
                          wishlist.includes(product.id)
                            ? 'bg-red-500 text-white'
                            : 'bg-white text-gray-600 hover:text-red-500'
                        }`}
                      >
                        <Heart className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {renderStars(product.rating)}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {product.rating} ({product.reviews} ulasan)
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="ml-2 text-sm text-gray-500 line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => addToCart(product.id)}
                      disabled={!product.inStock}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                        !product.inStock
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : cart.includes(product.id)
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {!product.inStock
                        ? 'Stok Habis'
                        : cart.includes(product.id)
                        ? 'Sudah di Keranjang'
                        : 'Tambah ke Keranjang'
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* No products message */}
            {sortedProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Tidak ada produk ditemukan
                </h3>
                <p className="text-gray-600">
                  Coba ubah filter atau kategori untuk menemukan produk yang diinginkan.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-blue-600 text-white py-12 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Butuh Bantuan Memilih Produk?
          </h2>
          <p className="text-xl mb-6 opacity-90">
            Tim DLOB siap membantu kamu menemukan perlengkapan yang tepat untuk meningkatkan permainan badmintonmu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              📞 Hubungi Kami
            </button>
            <button className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-400 transition-colors">
              💬 Chat WhatsApp
            </button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}