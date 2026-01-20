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
      image: '/images/nominasi/headerimage.jpeg',
      publishDate: '20 Desember 2025',
      readTime: '5 menit baca'
    }
  ];

  const t = content[language as keyof typeof content];

  return (
    <>
      <Header currentPage="artikel" />
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-16">
            <a
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors font-medium"
            >
              {t.backToHome}
            </a>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.title}</h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6"></div>
            <p className="text-lg text-gray-600">{t.subtitle}</p>
          </div>

          {/* Articles Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto mb-20">
            {articles.map((article) => (
              <article key={article.id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                {/* Article Image */}
                <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Article Content */}
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <span>{t.publishedOn} {article.publishDate}</span>
                    <span className="mx-2">•</span>
                    <span>{article.readTime}</span>
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h2>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                  
                  <Link
                    href={`/artikel/${article.id}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                  >
                    {t.readMore} →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Featured Section */}
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {language === 'en' ? 'Featured Stories' : 'Artikel Pilihan'}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
            </div>
            <div className="group relative bg-white rounded-xl border border-gray-200 p-12 text-center hover:shadow-lg hover:border-blue-300 transition-all duration-300">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-10 transition duration-300"></div>
              <div className="relative">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {language === 'en' ? 'Join the DLOB Community' : 'Bergabung dengan Komunitas DLOB'}
                </h3>
                <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
                  {language === 'en' 
                    ? 'Be part of our growing badminton community and stay updated with the latest news and events.'
                    : 'Jadilah bagian dari komunitas badminton yang terus berkembang dan dapatkan update berita dan acara terbaru.'}
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center bg-gradient-to-r from-purple-600 to-sky-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  {language === 'en' ? 'Join Now' : 'Gabung Sekarang'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}