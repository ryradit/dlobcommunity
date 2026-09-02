'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Users, Shield, Zap, Sparkles, Heart, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import HallOfFameSection from '@/components/HallOfFameSection';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const STATS = [
  { number: '50+', label: 'Anggota Aktif', desc: 'Member terdaftar & aktif mabar' },
  { number: '100+', label: 'Pertandingan', desc: 'Sesi sparring & latihan rutin' },
  { number: '5+', label: 'Tahun Bersama', desc: 'Tumbuh solid sejak 2020' },
  { number: '24/7', label: 'AI Analytics', desc: 'Statistik & leaderboard pintar' },
];

const TIMELINE = [
  {
    year: '2020',
    title: 'Awal Dimulai di Tengah Pandemi',
    desc: 'Di tengah pandemi COVID-19, sekelompok pecinta bulu tangkis berkumpul untuk membentuk wadah mabar yang aman dan terorganisir.',
    img: '/images/dlob8.jpg',
  },
  {
    year: '2021',
    title: 'Solidaritas & Rutinitas Latihan',
    desc: 'Jadwal latihan rutin mingguan mulai dibentuk. Anggota terus bertambah dengan semangat kebersamaan dan sportivitas yang tinggi.',
    img: '/images/20210404_134623.jpg',
  },
  {
    year: '2022',
    title: 'Komunitas Semakin Solid',
    desc: 'Pemain dari berbagai latar belakang dan tingkat keahlian berkumpul untuk mengasah kemampuan dan mempererat persahabatan di lapangan.',
    img: '/images/20211027_205112.jpg',
  },
  {
    year: '2023',
    title: 'Membangun Ekosistem Terpadu',
    desc: 'Kami mulai mendigitalkan sistem absensi, kas transparan, dan statistik pertandingan agar manajemen komunitas lebih rapi.',
    img: '/images/20211027_205109.jpg',
  },
  {
    year: '2024',
    title: 'Modernisasi Platform DLOB',
    desc: 'Meluncurkan platform internal terintegrasi dengan leaderboard otomatis, integrasi Google Drive untuk arsip, dan store merchandise resmi.',
    img: '/images/dlob12.jpg',
  },
  {
    year: '2025',
    title: 'Inovasi AI & Analitik Cerdas',
    desc: 'Mengintegrasikan teknologi AI untuk rekomendasi ukuran jersey, survei komunitas adaptif, dan analisis performa permainan pemain.',
    img: '/images/dlob1.jpg',
  },
  {
    year: '2026',
    title: 'Masa Depan Komunitas Terdepan',
    desc: 'Terus berkembang dengan standar baru komunitas olahraga: inklusif, terorganisir, transparan, dan menyenangkan bagi setiap member.',
    img: '/images/dlob3.jpg',
  },
];

const VALUES = [
  {
    num: '01',
    title: 'Transparansi',
    desc: 'Keterbukaan dalam jadwal, rekap iuran mabar, dan statistik pertandingan komunitas.',
    icon: Shield,
  },
  {
    num: '02',
    title: 'Sportivitas & Keadilan',
    desc: 'Setiap anggota mendapat kesempatan bermain yang setara tanpa memandang tingkat kemahiran.',
    icon: Award,
  },
  {
    num: '03',
    title: 'Inovasi Digital',
    desc: 'Pemanfaatan teknologi modern untuk mempermudah operasional komunitas bulu tangkis.',
    icon: Zap,
  },
  {
    num: '04',
    title: 'Kebersamaan & Kekeluargaan',
    desc: 'Lebih dari sekadar bermain badminton, kami membangun relasi persaudaraan yang erat.',
    icon: Heart,
  },
];

export default function TentangPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-[#4382C8]/10 to-transparent rounded-full translate-x-1/3 -translate-y-1/4 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column */}
            <motion.div
              className="space-y-6 text-slate-900"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4382C8]">
                <span className="w-6 h-[2px] bg-[#4382C8]" />
                Tentang DLOB
              </span>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.05] tracking-tight">
                Komunitas Badminton<br />
                <span className="text-[#4382C8]">Modern & Terpadu</span>
              </h1>

              <div className="space-y-4 text-slate-600 text-base leading-relaxed">
                <p>
                  DLOB Community adalah komunitas bulu tangkis yang berkomitmen menciptakan lingkungan olahraga yang positif, kompetitif, dan penuh kebersamaan.
                </p>
                <p>
                  Melalui platform internal ini, seluruh aktivitas mabar, jadwal rutin, dokumentasi foto/video, serta pencatatan skor dikelola secara terstruktur untuk kenyamanan seluruh anggota.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/kontak"
                  className="inline-flex items-center gap-3 bg-zinc-950 hover:bg-zinc-800 text-white px-8 py-3.5 rounded-full font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg text-sm"
                >
                  Bergabung Bersama Kami
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            {/* Right Column: Hero Image */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
            >
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/60">
                <Image
                  src="/images/dlob12.jpg"
                  alt="DLOB Community Group"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                
                {/* Floating Tag */}
                <div className="absolute bottom-6 left-6 right-6 backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl p-4 text-white">
                  <p className="font-bold text-sm">GOR Badminton Wisma Harapan</p>
                  <p className="text-xs text-white/80">Homebase resmi DLOB Badminton Community</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. STATS BAR
      ───────────────────────────────────────────────────────────── */}
      <section className="py-12 bg-zinc-950 text-white border-y border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center md:text-left border-l-2 border-[#4382C8] pl-4">
                <p className="text-3xl md:text-4xl font-black text-white">{stat.number}</p>
                <p className="text-sm font-bold text-white/90 mt-1">{stat.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. VISION & MISSION CARDS
      ───────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4382C8] mb-3">
              <span className="w-6 h-[2px] bg-[#4382C8]" />
              Fondasi Kami
              <span className="w-6 h-[2px] bg-[#4382C8]" />
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Visi & Misi DLOB
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Vision */}
            <div className="relative rounded-3xl p-8 sm:p-10 border border-[#4382C8]/20 bg-gradient-to-br from-[#4382C8]/5 to-transparent shadow-sm hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[#4382C8] text-white flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-[#4382C8]/20">
                V
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Visi Kami</h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Menjadi komunitas bulu tangkis yang profesional, inklusif, dan menjadi teladan dalam pemanfaatan teknologi untuk kenyamanan dan kebersamaan seluruh anggota.
              </p>
            </div>

            {/* Mission */}
            <div className="relative rounded-3xl p-8 sm:p-10 border border-zinc-200 bg-gradient-to-br from-slate-50 to-transparent shadow-sm hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white flex items-center justify-center font-black text-xl mb-6 shadow-md">
                M
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Misi Kami</h3>
              <ul className="space-y-2.5 text-slate-600 text-sm sm:text-base">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#4382C8] shrink-0 mt-1" />
                  <span>Menyediakan jadwal mabar dan sparring rutin yang tertata rapi.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#4382C8] shrink-0 mt-1" />
                  <span>Mendorong peningkatan skill bermain melalui latihan terarah.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#4382C8] shrink-0 mt-1" />
                  <span>Menjunjung tinggi transparansi operasional dan persaudaraan.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. CORE VALUES
      ───────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4382C8] mb-3">
              <span className="w-6 h-[2px] bg-[#4382C8]" />
              Prinsip Kami
              <span className="w-6 h-[2px] bg-[#4382C8]" />
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Nilai Inti Komunitas
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-2xl font-black text-[#4382C8]">{val.num}</span>
                    <div className="w-10 h-10 rounded-xl bg-[#4382C8]/10 flex items-center justify-center text-[#4382C8]">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{val.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed grow">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. TIMELINE JOURNEY
      ───────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4382C8] mb-3">
              <span className="w-6 h-[2px] bg-[#4382C8]" />
              Perjalanan Kami
              <span className="w-6 h-[2px] bg-[#4382C8]" />
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Jejak Langkah DLOB
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-xl mx-auto">
              Dari sesi mabar sederhana hingga menjadi komunitas bulu tangkis yang solid dan terintegrasi
            </p>
          </div>

          <div className="space-y-12 relative before:absolute before:inset-0 before:left-4 sm:before:left-1/2 before:-translate-x-1/2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#4382C8] before:via-blue-200 before:to-slate-100">
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
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-lg hover:shadow-2xl transition-shadow">
                      <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black bg-[#4382C8] text-white mb-3 shadow-sm">
                        {item.year}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>

                  {/* Dot */}
                  <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-4 border-[#4382C8] shadow-md flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-full bg-[#4382C8]" />
                  </div>

                  {/* Image */}
                  <div className="w-full sm:w-1/2 pl-10 sm:pl-0">
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-md">
                      <Image
                        src={item.img}
                        alt={item.title}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-500"
                      />
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
      <section className="bg-slate-50 py-20 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <HallOfFameSection showAll={false} />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. CTA SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 text-center p-10 sm:p-16">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4382C8] via-[#2f6fae] to-[#1b4372]" />
          <div className="absolute inset-0 bg-white/10 backdrop-blur-md" />

          <div className="relative text-white max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight drop-shadow-sm">
              Tertarik Bergabung dengan DLOB?
            </h2>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed font-medium">
              Ayo rasakan serunya berolahraga bersama komunitas yang suportif dan penuh semangat kekeluargaan.
            </p>
            <div className="pt-2">
              <Link
                href="/kontak"
                className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-bold px-8 py-3.5 rounded-full text-sm shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Hubungi Admin Kami
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
