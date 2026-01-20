'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import { useLanguage } from '@/hooks/useLanguage';

export default function ArticlePage() {
  const { language } = useLanguage();
  const params = useParams();
  const slug = params.slug as string;

  const content = {
    en: {
      backToArticles: "← Back to Articles",
      backToHome: "← Back to Home"
    },
    id: {
      backToArticles: "← Kembali ke Artikel",
      backToHome: "← Kembali ke Beranda"
    }
  };

  const articles = {
    'refleksi-2025': {
      title: 'Refleksi Tahun 2025: Perjalanan Menakjubkan Komunitas DLOB',
      subtitle: 'Merayakan pencapaian dan mempersiapkan masa depan yang gemilang',
      headerImage: '/images/nominasi/headerimage.jpeg',
      publishDate: '20 Desember 2025',
      readTime: '5 menit baca',
      content: [
        {
          type: 'paragraph',
          text: 'Tahun 2025 telah menjadi tahun yang luar biasa bagi komunitas badminton DLOB. Dari turnamen seru hingga momen kebersamaan yang tak terlupakan, mari kita merenungkan perjalanan menakjubkan yang telah kita lalui bersama.'
        },
        {
          type: 'heading',
          text: 'Pencapaian Gemilang di 2025'
        },
        {
          type: 'paragraph',
          text: 'Sepanjang tahun ini, komunitas DLOB telah mencapai berbagai milestone yang membanggakan. Dengan lebih dari 200 anggota aktif dan partisipasi dalam puluhan turnamen, semangat sportivitas dan persaudaraan terus menguat. Setiap Sabtu, lapangan badminton menjadi saksi dedikasi dan passion para member dalam mengasah kemampuan dan mempererat tali silaturahmi.'
        },
        {
          type: 'heading',
          text: 'Menatap Masa Depan'
        },
        {
          type: 'paragraph',
          text: 'Memasuki tahun 2026, semangat dan antusiasme komunitas DLOB semakin menggelora. Dengan rencana ekspansi ke lokasi-lokasi baru, program pelatihan yang lebih terstruktur, dan turnamen regional yang lebih besar, masa depan DLOB tampak semakin cerah. Setiap anggota adalah bagian penting dari cerita sukses ini.'
        },
        {
          type: 'heading',
          text: 'Selamat Hari Raya Nataru dan Libur Tahun Baru'
        },
        {
          type: 'paragraph',
          text: 'Di penghujung tahun 2025 ini, kami mengucapkan Selamat Hari Raya Nataru dan Libur Tahun Baru kepada seluruh keluarga besar komunitas DLOB. Semoga momen indah ini membawa kedamaian, kebahagiaan, dan semangat baru untuk terus berkarya bersama di tahun yang akan datang.'
        },
        {
          type: 'holiday-image'
        },
        {
          type: 'paragraph',
          text: 'Terima kasih atas dedikasi dan kebersamaan yang luar biasa sepanjang tahun 2025. Mari kita sambut tahun 2026 dengan optimisme dan semangat yang membara!'
        },
        {
          type: 'callout',
          title: 'Ucapan Terima Kasih',
          text: 'Kepada seluruh anggota DLOB, pengurus, sponsor, dan semua pihak yang telah mendukung perjalanan komunitas ini, kami mengucapkan terima kasih yang mendalam. Tanpa dedikasi dan dukungan kalian, pencapaian tahun ini tidak akan mungkin terwujud. Mari bersama-sama menyongsong tahun 2026 dengan semangat yang lebih berkobar!'
        },
        {
          type: 'heading',
          text: 'Nominasi DLOB Awards 2025'
        },
        {
          type: 'paragraph',
          text: 'Sebagai bagian dari refleksi tahun 2025, kami dengan bangga mempersembahkan DLOB Awards - penghargaan khusus untuk anggota-anggota istimewa yang telah memberikan warna tersendiri bagi komunitas kita sepanjang tahun ini.'
        },
        {
          type: 'nominations'
        },
        {
          type: 'heading',
          text: 'Galeri Momen Tahun 2025'
        }
      ]
    }
  };

  const article = articles[slug as keyof typeof articles];
  const t = content[language as keyof typeof content];

  if (!article) {
    return (
      <>
        <Header currentPage="artikel" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {language === 'en' ? 'Article not found' : 'Artikel tidak ditemukan'}
            </h1>
            <Link
              href="/artikel"
              className="text-blue-600 hover:text-blue-800"
            >
              {t.backToArticles}
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header currentPage="artikel" />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Navigation */}
          <div className="mb-8">
            <Link
              href="/artikel"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
            >
              {t.backToArticles}
            </Link>
          </div>

          {/* Article */}
          <article className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header Image */}
            <div className="relative h-[60vh] w-full">
              <Image
                src={article.headerImage}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <div className="max-w-4xl">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white leading-tight drop-shadow-2xl">
                    {article.title}
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-200 font-light leading-relaxed drop-shadow-lg">
                    {article.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="relative">
              {/* Decorative element */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">📝</span>
                </div>
              </div>
              
              <div className="px-8 md:px-16 lg:px-24 pt-16 pb-12">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-center text-sm text-gray-500 mb-12 space-x-4">
                    <span className="bg-gray-100 px-4 py-2 rounded-full">📅 {article.publishDate}</span>
                    <span className="bg-gray-100 px-4 py-2 rounded-full">⏰ {article.readTime}</span>
                  </div>

                {article.content.map((section, index) => {
                  switch (section.type) {
                    case 'paragraph':
                      return (
                        <div key={index} className="mb-12">
                          <p className="text-xl text-gray-700 leading-relaxed font-light tracking-wide">
                            {section.text}
                          </p>
                        </div>
                      );
                    case 'heading':
                      return (
                        <div key={index} className="mb-8">
                          <div className="flex items-center mb-6">
                            <div className="w-1 h-12 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-6"></div>
                            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                              {section.text}
                            </h2>
                          </div>
                        </div>
                      );
                    case 'callout':
                      return (
                        <div key={index} className="mb-16 relative">
                          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-10 rounded-3xl border border-blue-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full transform translate-x-10 -translate-y-10"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200/30 to-blue-200/30 rounded-full transform -translate-x-8 translate-y-8"></div>
                            <div className="relative">
                              <div className="flex items-center mb-6">
                                <span className="text-4xl mr-4">💙</span>
                                <h3 className="text-3xl font-bold text-blue-900">
                                  {section.title}
                                </h3>
                              </div>
                              <p className="text-lg text-blue-800 leading-relaxed font-medium">
                                {section.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    case 'nominations':
                      const nominations = [
                        { title: "Si Paling Konsisten", description: "Performanya tidak pernah menurun, selalu stabil dan dapat diandalkan dalam setiap pertandingan.", image: "/images/nominasi/sipalingkonsisten.jpeg" },
                        { title: "Si Paling Rajin", description: "Selalu yang pertama datang dan terakhir pulang.", image: "/images/nominasi/sipalingrajin.jpeg" },
                        { title: "Si Paling Alot", description: "Pantang menyerah dalam setiap rally, bisa bermain berjam-jam tanpa lelah.", image: "/images/nominasi/sipalingalot.jpeg" },
                        { title: "Si Paling Famous", description: "Dikenal semua orang di lapangan, influencer badminton komunitas DLOB.", image: "/images/nominasi/sipalingfamous.jpeg" },
                        { title: "Si Paling Bawa Anak Kecil", description: "Selalu hadir dengan keluarga kecil, mengajarkan nilai-nilai olahraga sejak dini.", image: "/images/nominasi/sipalingbawaanakkecil.jpeg" },
                        { title: "Si Paling Ganteng", description: "Style bermain yang elegan dan penampilan yang selalu rapi di lapangan.", image: "/images/nominasi/sipalingganteng.jpeg" },
                        { title: "Si Paling Gendong", description: "Selalu menggendong partnernya, sosok yang supportif dan setia mendampingi.", image: "/images/nominasi/sipalinggendong.jpeg" },
                        { title: "Si Paling Jago #1", description: "Skill level dewa, teknik sempurna, dan strategi permainan yang brilliant.", image: "/images/nominasi/sipalingjago1.jpeg" },
                        { title: "Si Paling Jago #2", description: "Tidak kalah hebat, konsistensi tinggi dan mental juara yang kuat.", image: "/images/nominasi/sipalingjago2.jpeg" }
                      ];
                      
                      return (
                        <div key={index} className="mb-16">
                          <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-3">
                            {nominations.map((nomination, nomIndex) => (
                              <div key={nomIndex} className="group relative">
                                {/* Card */}
                                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 transform hover:-translate-y-2">
                                  {/* Image Container */}
                                  <div className="relative h-64 w-full overflow-hidden">
                                    <Image
                                      src={nomination.image}
                                      alt={nomination.title}
                                      fill
                                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                    
                                    {/* Trophy Badge */}
                                    <div className="absolute top-4 right-4">
                                      <div className="relative">
                                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-full flex items-center justify-center shadow-xl">
                                          <span className="text-white font-bold text-sm">#{nomIndex + 1}</span>
                                        </div>
                                        <div className="absolute -top-1 -right-1 text-2xl animate-bounce">🏆</div>
                                      </div>
                                    </div>
                                    
                                    {/* Title Overlay */}
                                    <div className="absolute bottom-4 left-4 right-4">
                                      <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg">
                                        {nomination.title}
                                      </h3>
                                    </div>
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
                                    <p className="text-gray-600 leading-relaxed text-sm font-medium">
                                      {nomination.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    case 'holiday-image':
                      return (
                        <div key={index} className="mb-16">
                          <div className="flex justify-center">
                            <div className="relative group">
                              {/* Main Image Container */}
                              <div className="relative w-96 h-[500px] rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-500 hover:scale-105">
                                <Image
                                  src="/images/nominasi/marry christmas.jpeg"
                                  alt="Selamat Hari Raya Nataru dan Libur Tahun Baru"
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                
                                {/* Decorative Elements */}
                                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-red-400 to-green-400 rounded-full opacity-80 animate-pulse"></div>
                                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-tr from-yellow-400 to-red-400 rounded-full opacity-70 animate-pulse" style={{animationDelay: '1s'}}></div>
                                
                                {/* Content Overlay */}
                                <div className="absolute bottom-8 left-6 right-6 text-center">
                                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                                    <h3 className="text-white font-bold text-2xl drop-shadow-lg mb-2">
                                      � Selamat Nataru 🎉
                                    </h3>
                                    <h4 className="text-white/90 font-semibold text-lg drop-shadow-md">
                                      & Libur Tahun Baru
                                    </h4>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Background Glow */}
                              <div className="absolute inset-0 bg-gradient-to-r from-red-200 via-green-200 to-red-200 rounded-3xl opacity-30 blur-xl scale-110 -z-10"></div>
                            </div>
                          </div>
                        </div>
                      );
                    default:
                      return null;
                  }
                })}

                {/* Gallery for refleksi-2025 article */}
                {slug === 'refleksi-2025' && (
                  <div className="mt-16 mb-8">
                    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 p-12 rounded-3xl text-center border border-gray-200 relative overflow-hidden">
                      {/* Decorative Background Elements */}
                      <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full transform -translate-x-20 -translate-y-20"></div>
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-indigo-200/20 to-blue-200/20 rounded-full transform translate-x-16 translate-y-16"></div>
                      
                      <div className="relative">
                        <div className="mb-8">
                          <span className="text-6xl">📸</span>
                        </div>
                        <h3 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                          Lihat Lebih Banyak Foto
                        </h3>
                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                          Jelajahi koleksi lengkap foto-foto momen terbaik komunitas DLOB tahun 2025
                        </p>
                        <Link
                          href="/gallery"
                          className="inline-flex items-center bg-gradient-to-r from-purple-600 to-sky-600 text-white px-10 py-4 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 shadow-xl"
                        >
                          <span className="mr-3">Kunjungi Gallery</span>
                          <span className="text-2xl">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          </article>

          {/* Related Articles - Hide if no other articles */}
          {Object.keys(articles).length > 1 && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                {language === 'en' ? 'Related Articles' : 'Artikel Terkait'}
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {Object.entries(articles)
                  .filter(([key]) => key !== slug)
                  .slice(0, 2)
                  .map(([key, relatedArticle]) => (
                    <div key={key} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="relative h-32 w-full">
                        <Image
                          src={relatedArticle.headerImage}
                          alt={relatedArticle.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                          {relatedArticle.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">
                          {relatedArticle.publishDate} • {relatedArticle.readTime}
                        </p>
                        <Link
                          href={`/artikel/${key}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {language === 'en' ? 'Read More' : 'Baca Selengkapnya'} →
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}