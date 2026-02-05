'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

export default function Refleksi2025Page() {
  const awards = [
    {
      id: 1,
      rank: '#1 🏆',
      title: 'Si Paling Konsisten',
      description: 'Performanya tidak pernah menurun, selalu stabil dan dapat diandalkan dalam setiap pertandingan.',
      image: '/images/nominasi/sipalingkonsisten.jpeg',
    },
    {
      id: 2,
      rank: '#2 🏆',
      title: 'Si Paling Rajin',
      description: 'Selalu yang pertama datang dan terakhir pulang.',
      image: '/images/nominasi/sipalingrajin.jpeg',
    },
    {
      id: 3,
      rank: '#3 🏆',
      title: 'Si Paling Alot',
      description: 'Pantang menyerah dalam setiap rally, bisa bermain berjam-jam tanpa lelah.',
      image: '/images/nominasi/sipalingalot.jpeg',
    },
    {
      id: 4,
      rank: '#4 🏆',
      title: 'Si Paling Famous',
      description: 'Dikenal semua orang di lapangan, influencer badminton komunitas DLOB.',
      image: '/images/nominasi/sipalingfamous.jpeg',
    },
    {
      id: 5,
      rank: '#5 🏆',
      title: 'Si Paling Bawa Anak Kecil',
      description: 'Selalu hadir dengan keluarga kecil, mengajarkan nilai-nilai olahraga sejak dini.',
      image: '/images/nominasi/sipalingbawaanakkecil.jpeg',
    },
    {
      id: 6,
      rank: '#6 🏆',
      title: 'Si Paling Ganteng',
      description: 'Style bermain yang elegan dan penampilan yang selalu rapi di lapangan.',
      image: '/images/nominasi/sipalingganteng.jpeg',
    },
    {
      id: 7,
      rank: '#7 🏆',
      title: 'Si Paling Gendong',
      description: 'Selalu menggendong partnernya, sosok yang supportif dan setia mendampingi.',
      image: '/images/nominasi/sipalinggendong.jpeg',
    },
    {
      id: 8,
      rank: '#8 🏆',
      title: 'Si Paling Jago #1',
      description: 'Skill level dewa, teknik sempurna, dan strategi permainan yang brilliant.',
      image: '/images/nominasi/sipalingjago1.jpeg',
    },
    {
      id: 9,
      rank: '#9 🏆',
      title: 'Si Paling Jago #2',
      description: 'Tidak kalah hebat, konsistensi tinggi dan mental juara yang kuat.',
      image: '/images/nominasi/sipalingjago2.jpeg',
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Back Link */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link href="/artikel" className="inline-flex items-center gap-2 text-[#3e6461] hover:text-[#2d4a47] transition-colors font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Artikel
        </Link>
      </div>

      {/* Hero Image */}
      <div className="relative w-full h-96 md:h-[500px] overflow-hidden">
        <img 
          src="/images/nominasi/headerimage.jpeg" 
          alt="Refleksi Tahun 2025"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>

      {/* Article Content */}
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <div className="mb-12 pb-8 border-b border-gray-200">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Refleksi Tahun 2025: Perjalanan Menakjubkan Komunitas DLOB
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>20 Desember 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>5 menit baca</span>
            </div>
          </div>

          <p className="text-xl text-gray-700 mt-6 leading-relaxed">
            Merayakan pencapaian dan mempersiapkan masa depan yang gemilang
          </p>
        </div>

        {/* Section 1: Pencapaian Gemilang */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Pencapaian Gemilang di 2025</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            Sepanjang tahun ini, komunitas DLOB telah mencapai berbagai milestone yang membanggakan. Dengan lebih dari 200 anggota aktif dan partisipasi dalam puluhan turnamen, semangat sportivitas dan persaudaraan terus menguat.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Setiap Sabtu, lapangan badminton menjadi saksi dedikasi dan passion para member dalam mengasah kemampuan dan mempererat tali silaturahmi. Dari pemula hingga pemain profesional, semua berkumpul dengan satu tujuan: menjadi lebih baik dan saling mendukung dalam perjalanan ini.
          </p>
        </section>

        {/* Section 2: Menatap Masa Depan */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Menatap Masa Depan</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            Memasuki tahun 2026, semangat dan antusiasme komunitas DLOB semakin menggelora. Dengan rencana ekspansi ke lokasi-lokasi baru, program pelatihan yang lebih terstruktur, dan turnamen regional yang lebih besar, masa depan DLOB tampak semakin cerah.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Setiap anggota adalah bagian penting dari cerita sukses ini. Bersama-sama, kita akan menciptakan lebih banyak momen berharga, prestasi gemilang, dan kenangan indah yang akan menjadi bagian dari identitas komunitas DLOB.
          </p>
        </section>

        {/* Section 3: Selamat Nataru */}
        <section className="mb-16 bg-gradient-to-r from-[#3e6461]/10 to-[#3e6461]/5 rounded-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">🎉 Selamat Nataru 🎉</h2>
            <h3 className="text-2xl text-[#3e6461] font-semibold">Libur Tahun Baru</h3>
          </div>

          <p className="text-lg text-gray-700 leading-relaxed text-center mb-8">
            Di penghujung tahun 2025 ini, kami mengucapkan Selamat Hari Raya Nataru dan Libur Tahun Baru kepada seluruh keluarga besar komunitas DLOB. Semoga momen indah ini membawa kedamaian, kebahagiaan, dan semangat baru untuk terus berkarya bersama di tahun yang akan datang.
          </p>

          <div className="bg-white rounded-xl p-6 text-center">
            <p className="text-gray-700 font-semibold mb-4">Ucapan Terima Kasih</p>
            <p className="text-gray-600 leading-relaxed">
              Kepada seluruh anggota DLOB, pengurus, sponsor, dan semua pihak yang telah mendukung perjalanan komunitas ini, kami mengucapkan terima kasih yang mendalam. Tanpa dedikasi dan dukungan kalian, pencapaian tahun ini tidak akan mungkin terwujud. Mari bersama-sama menyongsong tahun 2026 dengan semangat yang lebih berkobar!
            </p>
          </div>
        </section>

        {/* Section 4: DLOB Awards 2025 */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">🏆 Nominasi DLOB Awards 2025</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-12">
            Sebagai bagian dari refleksi tahun 2025, kami dengan bangga mempersembahkan DLOB Awards - penghargaan khusus untuk anggota-anggota istimewa yang telah memberikan warna tersendiri bagi komunitas kita sepanjang tahun ini.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {awards.map((award) => (
              <div key={award.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="relative h-48 overflow-hidden bg-gray-200">
                  <img 
                    src={award.image} 
                    alt={award.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <div className="text-2xl font-bold text-[#3e6461] mb-2">{award.rank}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{award.title}</h3>
                  <p className="text-gray-600 text-sm">{award.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Galeri Momen */}
        <section className="mb-16 bg-gradient-to-r from-[#3e6461]/10 to-[#3e6461]/5 rounded-2xl p-8 md:p-12 text-center">
          <div className="mb-6">
            <div className="text-5xl mb-4">📸</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Galeri Momen Tahun 2025</h2>
          </div>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            Jelajahi koleksi lengkap foto-foto momen terbaik komunitas DLOB tahun 2025. Dari momen seru pertandingan hingga kebersamaan off-court, semua ada di sini.
          </p>
          <Link 
            href="/galeri" 
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#1e4843] text-white font-semibold rounded-full hover:bg-[#162f2c] transition-colors"
          >
            Kunjungi Gallery →
          </Link>
        </section>

        {/* Closing */}
        <section className="text-center py-12 border-t border-gray-200">
          <div className="text-4xl mb-6">💙</div>
          <p className="text-xl text-gray-700 mb-6">
            Terima kasih atas dedikasi dan kebersamaan yang luar biasa sepanjang tahun 2025.
          </p>
          <p className="text-lg text-gray-600">
            Mari kita sambut tahun 2026 dengan optimisme dan semangat yang membara! 🔥
          </p>
        </section>
      </article>

      {/* Bottom Navigation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200">
        <Link href="/artikel" className="inline-flex items-center gap-2 text-[#3e6461] hover:text-[#2d4a47] transition-colors font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Artikel
        </Link>
      </div>
    </main>
  );
}
