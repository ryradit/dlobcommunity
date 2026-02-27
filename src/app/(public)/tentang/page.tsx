import Link from 'next/link';
import Image from 'next/image';
import HallOfFameSection from '@/components/HallOfFameSection';

const timelineStyles = `
  @keyframes flowDown {
    0% {
      background-position: 0 -1000px;
    }
    100% {
      background-position: 0 1000px;
    }
  }
  
  .timeline-line {
    animation: flowDown 3s linear infinite;
    background: linear-gradient(180deg, #3e6461 0%, #2d4a47 50%, #3e6461 100%);
    background-size: 100% 200%;
    box-shadow: 0 0 20px rgba(62, 100, 97, 0.6);
  }
`;

export default function TentangPage() {
  const stats = [
    { number: '50+', label: 'Anggota Aktif' },
    { number: '100+', label: 'Turnamen Diikuti' },
    { number: '95%', label: 'Kepuasan Anggota' },
    { number: '24/7', label: 'Dukungan AI' },
  ];

  const features = [
    {
      title: 'Sistem Kehadiran Pintar',
      description: 'Sistem check-in QR code dengan verifikasi GPS dan pembaruan real-time'
    },
    {
      title: 'Manajemen Pembayaran',
      description: 'Perhitungan biaya otomatis dengan berbagai metode pembayaran dan pelacakan transparan'
    },
    {
      title: 'Penjadwalan Pertandingan',
      description: 'Pemasangan pertandingan adil bertenaga AI dengan analitik kinerja dan papan peringkat'
    },
    {
      title: 'Asisten AI',
      description: 'Asisten cerdas bertenaga Gemini untuk wawasan komunitas dan rekomendasi'
    },
  ];

  const values = [
    {
      title: 'Keadilan',
      description: 'Pemasangan pertandingan bertenaga AI memastikan setiap orang bermain dengan pemain tingkat keterampilan serupa'
    },
    {
      title: 'Transparansi',
      description: 'Pelacakan pembayaran yang jelas, hasil pertandingan, dan statistik komunitas untuk visibilitas lengkap'
    },
    {
      title: 'Pertumbuhan',
      description: 'Analitik kinerja dan wawasan personal untuk membantu setiap pemain meningkatkan permainan mereka'
    },
    {
      title: 'Komunitas',
      description: 'Membangun persahabatan dan koneksi yang bertahan lama melalui cinta pada badminton'
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <style>{timelineStyles}</style>
      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div className="space-y-8">
              <div>
                <span className="px-4 py-2 bg-[#3e6461]/15 text-[#3e6461] rounded-full text-sm font-semibold">TENTANG KAMI</span>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mt-6 mb-6">
                  Platform Badminton Terpadu
                </h1>
              </div>

              <div className="space-y-4 text-gray-600">
                <p className="text-lg leading-relaxed">
                  DLOB Community menyediakan solusi lengkap untuk mengelola komunitas badminton Anda dengan mudah dan efisien.
                </p>
                <p className="text-lg leading-relaxed">
                  Dari manajemen anggota hingga penyelenggaraan turnamen, semua terintegrasi dalam satu platform yang user-friendly dan didukung teknologi AI terdepan.
                </p>
              </div>

              <Link href="/register" className="inline-flex items-center gap-3 bg-[#1e4843] hover:bg-[#162f2c] text-white px-8 py-4 rounded-full font-semibold transition-colors text-lg">
                Mulai Sekarang
              </Link>
            </div>

            {/* Right - Image */}
            <div className="relative">
              <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/dlob12.jpg"
                  alt="DLOB Community"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Visi & Misi Kami</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Membangun fondasi komunitas badminton yang adil, transparan, dan memberdayakan
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left - Mission Card */}
            <div className="group lg:col-span-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
              <div className="relative bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-shadow duration-300 h-full flex flex-col">
                <span className="px-3 py-1 bg-[#3e6461]/15 text-[#3e6461] rounded-full text-xs font-semibold w-fit mb-4">Misi Kami</span>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Merevolusi Manajemen Komunitas</h3>
                <p className="text-gray-600 leading-relaxed flex-grow">
                  Memberikan solusi lengkap untuk mengelola komunitas badminton dengan mudah, efisien, dan transparan melalui teknologi inovatif.
                </p>
              </div>
            </div>

            {/* Center - Image */}
            <div className="lg:col-span-1">
              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src="/images/20210821_230808.jpg"
                  alt="Tim DLOB"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Right - Vision Card */}
            <div className="group lg:col-span-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
              <div className="relative bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-shadow duration-300 h-full flex flex-col">
                <span className="px-3 py-1 bg-[#3e6461]/15 text-[#3e6461] rounded-full text-xs font-semibold w-fit mb-4">Visi Kami</span>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Dunia Badminton yang Adil</h3>
                <p className="text-gray-600 leading-relaxed flex-grow">
                  Menciptakan ekosistem di mana setiap pemain badminton memiliki akses ke komunitas yang adil dan didukung teknologi terdepan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Nilai Inti DLOB</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Prinsip-prinsip yang memandu setiap keputusan dan tindakan kami
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left - Values Cards */}
            <div className="space-y-6">
              {[
                {
                  number: "01",
                  title: "Transparansi",
                  description: "Kejujuran dan keterbukaan dalam setiap aspek operasional platform kami"
                },
                {
                  number: "02",
                  title: "Keadilan",
                  description: "Semua pemain mendapat kesempatan yang sama untuk berkembang dan bersaing"
                },
                {
                  number: "03",
                  title: "Inovasi",
                  description: "Terus berinovasi untuk memberikan solusi terbaik bagi komunitas"
                },
                {
                  number: "04",
                  title: "Kolaborasi",
                  description: "Bekerja sama membangun ekosistem badminton yang lebih kuat"
                }
              ].map((value, index) => (
                <div key={index} className="group flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#3e6461] to-[#2d4a47] shadow-lg group-hover:shadow-2xl transition-shadow duration-300">
                      <span className="text-2xl font-bold text-white">{value.number}</span>
                    </div>
                  </div>
                  <div className="flex-grow pt-2">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right - Image */}
            <div className="relative h-96 rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="/images/20210821_230459.jpg"
                alt="Nilai Inti DLOB"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-[#3e6461]/15 text-[#3e6461] rounded-full text-sm font-semibold">Perjalanan Kami</span>
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Cerita DLOB</h2>
          </div>

          <div className="group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
            <div className="relative bg-white rounded-3xl p-10 md:p-14 shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                DLOB dimulai sebagai ide sederhana: bagaimana jika mengelola komunitas badminton bisa semenyenangkan bermain olahraga itu sendiri?
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Didirikan oleh pemain badminton yang bersemangat yang mengalami tantangan pelacakan kehadiran manual, pengumpulan pembayaran, dan organisasi pertandingan yang adil, kami berangkat untuk membuat solusi yang akan menguntungkan seluruh komunitas.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6 pt-8 border-t border-[#3e6461]/20">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#3e6461]/10">
                      <span className="text-[#3e6461] font-bold">✓</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Komunitas Utama</h4>
                    <p className="text-sm text-gray-600 mt-1">Didirikan oleh penggemar badminton</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#3e6461]/10">
                      <span className="text-[#3e6461] font-bold">✓</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Pendekatan Komunitas</h4>
                    <p className="text-sm text-gray-600 mt-1">Mengutamakan kebutuhan pengguna</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="relative bg-gradient-to-r from-[#3e6461] to-[#2d4a47] py-24 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Bergabung dengan Komunitas Kami</h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              Ribuan pemain badminton telah mempercayai DLOB untuk mengelola komunitas mereka
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                <p className="text-white/80 text-sm md:text-base">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perjalanan Timeline */}
      <section className="relative bg-gradient-to-b from-white to-gray-50 py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Perjalanan Kami</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Dari mimpi sederhana hingga menjadi komunitas badminton terdepan, dengan ribuan turnamen dan puluhan ribu anggota yang bergabung
            </p>
          </div>

          <div className="relative">
            {/* Vertical Timeline Line */}
            <div className="timeline-line hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full top-0"></div>

            <div className="space-y-16">
            {/* Year 2020 */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="relative h-72 rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src="/images/dlob8.jpg"
                  alt="2020 - Awal Dimulai"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
                <div className="relative bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <span className="px-4 py-2 bg-[#3e6461]/15 text-[#3e6461] rounded-full text-sm font-semibold inline-block mb-4">2020</span>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Masa Pandemi</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Di tengah pandemi COVID-19, kami memulai dengan visi untuk mempertemukan para pecinta badminton yang tersebar. Komunitas badminton membutuhkan tempat untuk terhubung dan berbagi passion mereka.
                  </p>
                </div>
              </div>
            </div>

            {/* Year 2021 */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="group order-2 lg:order-1">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
                <div className="relative bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <span className="px-4 py-2 bg-[#3e6461]/15 text-[#3e6461] rounded-full text-sm font-semibold inline-block mb-4">2021</span>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Bertahan dan Tumbuh</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Meskipun pandemi masih berlangsung, kami terus membangun komunitas dengan para pemain badminton yang antusias. Setiap hari ada yang bergabung untuk berbagi passion mereka terhadap olahraga ini.
                  </p>
                </div>
              </div>
              <div className="relative h-72 rounded-3xl overflow-hidden shadow-xl order-1 lg:order-2">
                <Image
                  src="/images/20210404_134623.jpg"
                  alt="2021 - Peluncuran Pertama"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Year 2022 */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="relative h-72 rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src="/images/20211027_205112.jpg"
                  alt="2022 - Komunitas Berkembang"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
                <div className="relative bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <span className="px-4 py-2 bg-[#3e6461]/15 text-[#3e6461] rounded-full text-sm font-semibold inline-block mb-4">2022</span>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Komunitas Berkembang</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Seiring berakhirnya pandemi, komunitas badminton kami semakin solid. Pemain dari berbagai latar belakang dan tingkat keahlian berkumpul untuk menjalani hobi mereka bersama-sama.
                  </p>
                </div>
              </div>
            </div>

            {/* Year 2023 */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="group order-2 lg:order-1">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
                <div className="relative bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <span className="px-4 py-2 bg-[#3e6461]/15 text-[#3e6461] rounded-full text-sm font-semibold inline-block mb-4">2023</span>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Membangun Fondasi</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Kami terus mengembangkan cara untuk melayani komunitas badminton dengan lebih baik. Fokus kami adalah memahami kebutuhan pemain dan menciptakan solusi yang tepat untuk mereka.
                  </p>
                </div>
              </div>
              <div className="relative h-72 rounded-3xl overflow-hidden shadow-xl order-1 lg:order-2">
                <Image
                  src="/images/20211027_205109.jpg"
                  alt="2023 - Membangun Fondasi"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Year 2024 */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="relative h-72 rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src="/images/dlob12.jpg"
                  alt="2024 - Ekspansi Regional"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
                <div className="relative bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <span className="px-4 py-2 bg-[#3e6461]/15 text-[#3e6461] rounded-full text-sm font-semibold inline-block mb-4">2024</span>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Memperluas Jangkauan</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Dengan dukungan komunitas yang kuat, kami menjangkau lebih banyak pecinta badminton di berbagai daerah. Setiap pemain yang bergabung membawa energi baru dan perspektif unik.
                  </p>
                </div>
              </div>
            </div>

            {/* Year 2025 */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="group order-2 lg:order-1">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
                <div className="relative bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <span className="px-4 py-2 bg-[#3e6461]/15 text-[#3e6461] rounded-full text-sm font-semibold inline-block mb-4">2025</span>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Momentum Berkelanjutan</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Perjalanan kami terus berlanjut dengan komitmen yang sama - melayani komunitas badminton dengan sepenuh hati. Kami belajar dari setiap tantangan dan terus berkembang bersama.
                  </p>
                </div>
              </div>
              <div className="relative h-72 rounded-3xl overflow-hidden shadow-xl order-1 lg:order-2">
                <Image
                  src="/images/dlob1.jpg"
                  alt="2025 - Era Baru"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Year 2026 */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="relative h-72 rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src="/images/dlob3.jpg"
                  alt="2026 - Masa Depan Cerah"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
                <div className="relative bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <span className="px-4 py-2 bg-[#3e6461]/15 text-[#3e6461] rounded-full text-sm font-semibold inline-block mb-4">2026</span>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Terus Berkembang</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Di tahun ini, kami masih fokus pada misi utama kami - membangun komunitas badminton yang kuat dan saling mendukung. Setiap anggota adalah bagian penting dari perjalanan ini.
                  </p>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hall of Fame */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <HallOfFameSection showAll={false} />
        </div>
      </section>

      {/* Gallery Section */}
      <section className="relative bg-white py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Galeri Momen Terbaik</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Saksikan momen-momen terbaik dari pertandingan dan latihan badminton kami yang penuh semangat
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              "/images/potrait/IMG_1999.jpg",
              "/images/potrait/IMG_2039.jpg",
              "/images/potrait/IMG_2046.jpg",
              "/images/potrait/IMG_2035.jpg",
              "/images/potrait/IMG_2049.jpg",
              "/images/potrait/IMG_2129.jpg",
            ].map((src, idx) => (
              <div key={idx} className="group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] rounded-3xl transform group-hover:scale-105 transition-transform duration-300 -z-10"></div>
                <div className="relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-300 h-64">
                  <Image
                    src={src}
                    alt={`Gallery ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <div className="p-6 text-white w-full">
                      <p className="font-semibold">Momen Badminton</p>
                      <p className="text-sm text-white/80">Dari koleksi DLOB</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-r from-[#3e6461] to-[#2d4a47] text-white py-24 overflow-hidden">
        <div className="absolute top-20 right-20 text-6xl opacity-20 rotate-45">🏸</div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Siap Bergabung dengan DLOB?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Jadilah bagian dari komunitas badminton terdepan dan rasakan perbedaannya
          </p>
          <Link href="/register">
            <button className="inline-block bg-white text-[#3e6461] hover:bg-gray-100 font-bold py-5 px-12 rounded-full text-lg transition-colors shadow-xl hover:shadow-2xl">
              Mulai Sekarang
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}
