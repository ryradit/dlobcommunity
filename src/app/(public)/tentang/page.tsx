'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Shield, Zap, Heart, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import HallOfFameSection from '@/components/HallOfFameSection';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.09, duration: 0.7, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
  }),
};

const STATS = [
  { number: '50+', label: 'Member Aktif', desc: 'Terdaftar & aktif mabar rutin' },
  { number: '500+', label: 'Sesi Match', desc: 'Pertandingan & sparring tercatat' },
  { number: '5 Th', label: 'Konsistensi', desc: 'Tumbuh solid sejak 2020' },
  { number: '24/7', label: 'AI Analytics', desc: 'Statistik & leaderboard terpadu' },
];

const TIMELINE = [
  {
    year: '2020',
    title: 'Awal Mula di Masa Pandemi',
    desc: 'Di tengah tantangan pandemi COVID-19, sekelompok pecinta bulu tangkis berkumpul untuk membentuk wadah mabar yang terorganisir, aman, dan bersemangat tinggi.',
    img: '/images/dlob8.jpg',
  },
  {
    year: '2021',
    title: 'Solidaritas & Jadwal Terstruktur',
    desc: 'Jadwal latihan rutin mingguan diresmikan di GOR Wisma Harapan. Anggota bertambah dengan komitmen kebersamaan dan sportivitas yang tinggi.',
    img: '/images/20210404_134623.jpg',
  },
  {
    year: '2022',
    title: 'Pembentukan Komunitas Solid',
    desc: 'Pemain dari berbagai latar belakang dan level kemahiran bergabung. Program sparring internal dan pembinaan dasar mulai digalakkan.',
    img: '/images/20211027_205112.jpg',
  },
  {
    year: '2023',
    title: 'Digitalisasi Operasional',
    desc: 'Mulai mendigitalkan absensi mabar, transparansi kas iuran, dan rekap statistik pertandingan agar pengelolaan komunitas makin akuntabel.',
    img: '/images/20211027_205109.jpg',
  },
  {
    year: '2024',
    title: 'Peluncuran Platform Internal',
    desc: 'Merilis aplikasi web terpadu dengan sistem leaderboard otomatis, arsip foto cloud, dan store merchandise resmi komunitas.',
    img: '/images/dlob12.jpg',
  },
  {
    year: '2025',
    title: 'Integrasi Kecerdasan Buatan (AI)',
    desc: 'Mengintegrasikan engine analitik cerdas untuk rekomendasi ukuran apparel, evaluasi match, dan chatbot asisten mabar komunitas.',
    img: '/images/dlob1.jpg',
  },
  {
    year: '2026',
    title: 'Standar Komunitas Olahraga Modern',
    desc: 'Menjadi teladan komunitas olahraga inklusif dengan standar tata kelola profesional dan atmosfer kekeluargaan yang autentik.',
    img: '/images/dlob3.jpg',
  },
  {
    year: '2026+',
    title: 'Satu Semangat: DLOB & DLBC Bersatu',
    desc: 'PB 11 resmi bertransformasi menjadi DLBC Cikupa di bawah naungan ekosistem DLOB. Dua cabang, satu visi memperluas ekosistem bulu tangkis di Tangerang Raya.',
    img: '/images/dlbc.jpeg',
    imgPosition: 'center 15%',
  },
];

const VALUES = [
  {
    num: '01',
    title: 'Transparansi Operasional',
    desc: 'Keterbukaan dalam jadwal kehadiran, pencatatan rekap iuran mabar, dan data match seluruh pemain.',
    icon: Shield,
  },
  {
    num: '02',
    title: 'Sportivitas & Kesetaraan',
    desc: 'Setiap member memiliki hak rotasi bermain yang adil tanpa memandang tingkat kemahiran awal.',
    icon: Award,
  },
  {
    num: '03',
    title: 'Inovasi Ekosistem Digital',
    desc: 'Pemanfaatan teknologi mutakhir untuk memudahkan operasional dan meningkatkan kualitas match.',
    icon: Zap,
  },
  {
    num: '04',
    title: 'Kekeluargaan & Komitmen',
    desc: 'Lebih dari sekadar olahraga, kami membangun lingkaran persahabatan sejati di dalam maupun di luar lapangan.',
    icon: Heart,
  },
];

export default function TentangPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-950 font-sans overflow-x-clip">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-10 pb-12 sm:pt-12 sm:pb-14 md:pt-16 md:pb-16 overflow-hidden bg-white border-b border-zinc-200/80">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-radial from-[#4382C8]/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column */}
            <motion.div
              className="lg:col-span-7 space-y-6"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-mono tracking-wider uppercase">
                Profil &amp; Filosofi DLOB
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-950 leading-[1.05] tracking-tight">
                Membangun Komunitas.<br />
                <span className="text-[#4382C8]">Menghidupkan Olahraga.</span>
              </h1>

              <div className="space-y-4 text-zinc-600 text-base sm:text-lg leading-relaxed max-w-2xl">
                <p>
                  DLOB Community adalah perkumpulan bulu tangkis yang berkomitmen membangun atmosfer latihan suportif, kompetitif yang sehat, dan teratur di wilayah Tangerang Raya — berpusat di Periuk (Kota Tangerang) serta cabang ekspansi di Cikupa (Kabupaten Tangerang).
                </p>
                <p className="text-zinc-500 text-sm sm:text-base">
                  Melalui platform teknologi mandiri, seluruh operasional mabar, registrasi pemain, dokumentasi momen, serta kalkulasi statistik dikelola secara transparan untuk seluruh member.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/kontak"
                  className="group inline-flex items-center gap-4 bg-zinc-950 hover:bg-zinc-900 text-white pl-7 pr-3 py-3.5 rounded-full font-bold transition-all duration-300 shadow-xl shadow-zinc-950/15 active:scale-[0.98] text-sm"
                >
                  <span>Mulai Bergabung Bersama Kami</span>
                  <div className="btn-nested-icon w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#4382C8] transition-colors">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </Link>
              </div>
            </motion.div>

            {/* Right Column: Doppelrand Hero Image */}
            <motion.div
              className="lg:col-span-5 relative"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="doppelrand-shell p-2 rounded-[2.5rem] bg-zinc-100 border border-zinc-200/90 shadow-2xl">
                <div className="relative w-full aspect-[4/3] rounded-[calc(2.5rem-0.5rem)] overflow-hidden bg-zinc-950 group">
                  <Image
                    src="/images/dlob12.jpg"
                    alt="DLOB Community Group"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Floating Tag */}
                  <div className="absolute bottom-5 inset-x-5 backdrop-blur-xl bg-white/15 border border-white/20 rounded-2xl p-4 text-white shadow-lg">
                    <p className="font-bold text-sm text-white">GOR Wisma Harapan & GOR Galaxi</p>
                    <p className="text-xs text-zinc-300 mt-0.5">Homebase resmi DLOB Badminton Community</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. STATS BAR (Doppelrand Milestone Tiles)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-14 bg-zinc-950 text-white border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="font-mono text-3xl sm:text-4xl font-black text-white tracking-tight">{stat.number}</p>
                <p className="text-sm font-bold text-zinc-200 mt-1">{stat.label}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. VISION & MISSION CARDS (Doppelrand Architecture)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-36 bg-zinc-50 border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16 max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-950 tracking-tight">
              Visi & Misi Kami
            </h2>
            <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
              Komitmen kami dalam menggerakkan ekosistem bulu tangkis yang sehat, tertib, dan inklusif.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Vision */}
            <div className="doppelrand-shell p-2 rounded-[2.5rem] bg-white border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="h-full p-8 sm:p-10 rounded-[calc(2.5rem-0.5rem)] bg-zinc-50/50 flex flex-col justify-between space-y-6">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white flex items-center justify-center font-black text-xl mb-6 shadow-md">
                    V
                  </div>
                  <h3 className="text-2xl font-black text-zinc-950 mb-3 tracking-tight">Visi Komunitas</h3>
                  <p className="text-zinc-600 leading-relaxed text-sm sm:text-base">
                    Menjadi wadah bulu tangkis independen terdepan yang memadukan kehangatan kekeluargaan dengan standar operasional profesional dan pemanfaatan teknologi digital terpadu.
                  </p>
                </div>
                <div className="pt-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4382C8]">
                    Inklusif · Modern · Kompetitif
                  </span>
                </div>
              </div>
            </div>

            {/* Mission */}
            <div className="doppelrand-shell p-2 rounded-[2.5rem] bg-white border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="h-full p-8 sm:p-10 rounded-[calc(2.5rem-0.5rem)] bg-zinc-50/50 flex flex-col justify-between space-y-6">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#4382C8] text-white flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-[#4382C8]/20">
                    M
                  </div>
                  <h3 className="text-2xl font-black text-zinc-950 mb-3 tracking-tight">Misi Komunitas</h3>
                  <ul className="space-y-3 text-zinc-600 text-sm sm:text-base">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#4382C8] shrink-0 mt-1" />
                      <span>Menyelenggarakan mabar rutin mingguan dengan rotasi yang adil dan seimbang.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#4382C8] shrink-0 mt-1" />
                      <span>Mendukung pengembangan teknik pemain dari tingkat pemula hingga mahir.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#4382C8] shrink-0 mt-1" />
                      <span>Menjaga transparansi pencatatan iuran, absensi, dan data match digital.</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4382C8]">
                    Transparan · Terstruktur · Sportif
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. CORE VALUES
      ───────────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16 max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-950 tracking-tight">
              Nilai Inti DLOB
            </h2>
            <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
              Prinsip yang dipegang teguh oleh seluruh pengurus dan anggota di setiap sesi latihan.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div
                  key={idx}
                  className="doppelrand-shell p-1.5 rounded-[2rem] bg-zinc-100/90 border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="h-full p-6 rounded-[calc(2rem-0.375rem)] bg-white flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-2xl font-black text-[#4382C8]">{val.num}</span>
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-zinc-950">{val.title}</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">{val.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. TIMELINE JOURNEY
      ───────────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-36 bg-zinc-50 border-t border-zinc-200/80 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-20 max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-950 tracking-tight">
              Jejak Langkah Perjalanan
            </h2>
            <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
              Dari sesi sparring sederhana hingga ekosistem bulu tangkis yang terintegrasi di dua cabang utama.
            </p>
          </div>

          <div className="space-y-12 relative before:absolute before:inset-0 before:left-4 sm:before:left-1/2 before:-translate-x-1/2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#4382C8] before:via-zinc-300 before:to-zinc-200">
            {TIMELINE.map((item, index) => {
              const isEven = index % 2 === 0;
              return (
                <div
                  key={item.year}
                  className={`relative flex flex-col sm:flex-row items-center gap-8 ${
                    isEven ? 'sm:flex-row-reverse' : ''
                  }`}
                >
                  {/* Content card */}
                  <div className="w-full sm:w-1/2 pl-10 sm:pl-0">
                    <div className="doppelrand-shell p-1.5 rounded-[2rem] bg-white border border-zinc-200/80 shadow-md hover:shadow-xl transition-all duration-300">
                      <div className="p-6 sm:p-7 rounded-[calc(2rem-0.375rem)] bg-zinc-50/50 space-y-3">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-zinc-950 text-white shadow-xs">
                          {item.year}
                        </span>
                        <h3 className="text-lg font-bold text-zinc-950">{item.title}</h3>
                        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dot */}
                  <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white border-4 border-[#4382C8] shadow-md flex items-center justify-center z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4382C8]" />
                  </div>

                  {/* Image */}
                  <div className="w-full sm:w-1/2 pl-10 sm:pl-0">
                    <div className="doppelrand-shell p-1.5 rounded-[2rem] bg-white border border-zinc-200/80 shadow-sm overflow-hidden">
                      <div className="relative aspect-[16/9] rounded-[calc(2rem-0.375rem)] overflow-hidden bg-zinc-950 group">
                        <Image
                          src={item.img}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          style={{ objectPosition: (item as any).imgPosition || 'center' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. HALL OF FAME EMBED
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-white py-24 border-t border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HallOfFameSection showAll={false} />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. CTA SECTION (Doppelrand Cinematic Closing)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-2 sm:p-2.5 rounded-[2.5rem] bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden relative text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-[#4382C8]/20 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative rounded-[calc(2.5rem-0.625rem)] bg-zinc-900/90 p-8 sm:p-14 lg:p-16 text-center max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight">
              Ingin Menjadi Bagian dari<br />
              <span className="text-[#4382C8]">Keluarga DLOB?</span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              Rasakan pengalaman bermain bulu tangkis yang terorganisir, transparan, dan penuh semangat sportivitas bersama 50+ Member Aktif.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-3 bg-white hover:bg-zinc-100 text-zinc-950 pl-7 pr-3 py-3.5 rounded-full font-bold text-sm tracking-tight transition-all shadow-xl active:scale-[0.98]"
              >
                <span>Daftar Sekarang</span>
                <div className="btn-nested-icon w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center group-hover:bg-[#4382C8] transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
              <Link
                href="/kontak"
                className="px-7 py-3.5 rounded-full border border-white/20 hover:border-white/40 text-white text-sm font-semibold transition-all hover:bg-white/5 active:scale-[0.98]"
              >
                Hubungi Pengurus
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
