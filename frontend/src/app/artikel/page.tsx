'use client';

import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { useLanguage } from '@/hooks/useLanguage';

export default function ArtikelPage() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Articles",
      backToHome: "← Back to Home",
      subtitle: "Latest news and updates from DLOB community",
      readMore: "Read More",
      publishedOn: "Published on"
    },
    id: {
      title: "Artikel",
      backToHome: "← Kembali ke Beranda",
      subtitle: "Berita terbaru dan update dari komunitas DLOB",
      readMore: "Baca Selengkapnya",
      publishedOn: "Dipublikasikan pada"
    }
  };

  const articles = [
    {
      id: 'refleksi-2025',
      title: 'Refleksi Tahun 2025: Perjalanan Menakjubkan Komunitas DLOB',
      excerpt: 'Tahun 2025 telah menjadi tahun yang luar biasa bagi komunitas badminton DLOB. Mari kita merenungkan perjalanan menakjubkan yang telah kita lalui bersama.',
      image: '/api/placeholder?width=400&height=250&text=Refleksi 2025',
      publishDate: '20 Desember 2025',
      readTime: '5 menit baca'
    }
  ];

  const t = content[language as keyof typeof content];

  return (
    <>
      <Header currentPage="artikel" />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <a
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
            >
              {t.backToHome}
            </a>
            <h1 className="text-4xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-gray-600 mt-2">{t.subtitle}</p>
          </div>

          {/* Articles Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article key={article.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Article Image */}
                <div className="relative h-48 w-full">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Article Content */}
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <span>{t.publishedOn} {article.publishDate}</span>
                    <span className="mx-2">•</span>
                    <span>{article.readTime}</span>
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {article.title}
                  </h2>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                  
                  <Link
                    href={`/artikel/${article.id}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    {t.readMore} →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Featured Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              {language === 'en' ? 'Featured Stories' : 'Artikel Pilihan'}
            </h2>
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-4">
                {language === 'en' ? 'Join the DLOB Community' : 'Bergabung dengan Komunitas DLOB'}
              </h3>
              <p className="text-blue-100 mb-6">
                {language === 'en' 
                  ? 'Be part of our growing badminton community and stay updated with the latest news and events.'
                  : 'Jadilah bagian dari komunitas badminton yang terus berkembang dan dapatkan update berita dan acara terbaru.'}
              </p>
              <Link
                href="/register"
                className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                {language === 'en' ? 'Join Now' : 'Gabung Sekarang'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}