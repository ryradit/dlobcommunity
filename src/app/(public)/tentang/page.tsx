'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HallOfFameSection from '@/components/HallOfFameSection';
import { motion, useScroll, useSpring } from 'framer-motion';
import { 
  ArrowRight, 
  Shield, 
  Target, 
  Zap, 
  Users, 
  Check, 
  Sparkles, 
  TrendingUp, 
  Award,
  Heart
} from 'lucide-react';

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
    background: linear-gradient(180deg, #1e4843 0%, #122826 50%, #1e4843 100%);
    background-size: 100% 200%;
    box-shadow: 0 0 20px rgba(30, 72, 67, 0.6);
  }
`;

export default function TentangPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end end"]
  });

  const scaleY = useSpring(scrollYProgress, {
    damping: 30,
    stiffness: 100,
    restDelta: 0.001
  });

  const stats = [
    { number: '50+', label: 'Anggota Aktif', desc: 'Pemain terdaftar resmi' },
    { number: '100+', label: 'Turnamen Diikuti', desc: 'Pertandingan & kompetisi' },
    { number: '98%', label: 'Tingkat Kepuasan', desc: 'Umpan balik positif' },
    { number: '24/7', label: 'AI Analytics', desc: 'Wawasan cerdas real-time' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <style>{timelineStyles}</style>

      {/* Hero Section */}
      <section className="bg-white py-24 relative overflow-hidden border-b border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-block">
                  <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-extrabold border border-teal-100 tracking-wider uppercase">🏸 Tentang Kami</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-none">
                  Platform Badminton Terpadu
                </h1>
              </div>

              <div className="space-y-4 text-gray-600 font-medium leading-relaxed">
                <p className="text-lg">
                  DLOB Community menyediakan solusi lengkap untuk mengelola komunitas badminton Anda dengan mudah, efisien, dan menyenangkan.
                </p>
                <p className="text-base text-gray-500">
                  Dari manajemen anggota hingga penyelenggaraan turnamen, semua terintegrasi dalam satu platform yang user-friendly dan didukung oleh kecerdasan buatan (AI) terdepan untuk meningkatkan kualitas bermain Anda.
                </p>
              </div>

              <div>
                <Link 
                  href="/register" 
                  className="group inline-flex items-center gap-2 bg-[#1e4843] hover:bg-[#162f2c] text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 text-sm shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  <span>Mulai Sekarang</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Right - Image */}
            <div className="relative">
              <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-2xl border border-gray-100 group">
                <Image
                  src="/images/dlob12.jpg"
                  alt="DLOB Community"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-103"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-xl border border-gray-100 dark:border-zinc-800 flex items-center gap-2 animate-pulse">
                <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Premium Community</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-white py-24 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 space-y-4">
            <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-extrabold border border-teal-100 tracking-wider uppercase">🎯 ARAH & TUJUAN</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">Visi & Misi Kami</h2>
            <p className="text-base text-gray-500 font-medium max-w-xl mx-auto">
              Membangun fondasi komunitas badminton yang adil, transparan, dan memberdayakan melalui teknologi modern.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left - Mission Card */}
            <div className="group lg:col-span-1 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1b3e3b] to-[#122826] rounded-3xl transform group-hover:scale-[1.03] transition-transform duration-300 -z-10 shadow-lg group-hover:shadow-teal-900/10"></div>
              <div className="relative bg-white rounded-3xl p-10 h-full flex flex-col shadow-xs border border-gray-150 group-hover:border-transparent transition-all duration-300">
                <span className="px-3.5 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-extrabold border border-teal-100 tracking-wider uppercase w-fit mb-6">Misi Kami</span>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-4 group-hover:text-teal-600 transition-colors">Merevolusi Komunitas</h3>
                <p className="text-gray-500 font-medium leading-relaxed flex-grow text-sm">
                  Memberikan solusi lengkap untuk mengelola komunitas badminton dengan mudah, efisien, dan transparan melalui teknologi inovatif dan analitik AI.
                </p>
              </div>
            </div>

            {/* Center - Image */}
            <div className="lg:col-span-1 relative">
              <div className="relative w-full h-80 lg:h-full rounded-3xl overflow-hidden shadow-lg border border-gray-100">
                <Image
                  src="/images/20210821_230808.jpg"
                  alt="Tim DLOB"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Right - Vision Card */}
            <div className="group lg:col-span-1 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1b3e3b] to-[#122826] rounded-3xl transform group-hover:scale-[1.03] transition-transform duration-300 -z-10 shadow-lg group-hover:shadow-teal-900/10"></div>
              <div className="relative bg-white rounded-3xl p-10 h-full flex flex-col shadow-xs border border-gray-150 group-hover:border-transparent transition-all duration-300">
                <span className="px-3.5 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-extrabold border border-teal-100 tracking-wider uppercase w-fit mb-6">Visi Kami</span>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-4 group-hover:text-teal-600 transition-colors">Ekosistem yang Adil</h3>
                <p className="text-gray-500 font-medium leading-relaxed flex-grow text-sm">
                  Menciptakan ekosistem di mana setiap pemain badminton memiliki akses ke komunitas yang adil, suportif, dan didukung teknologi terdepan untuk terus bertumbuh.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-24 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 space-y-4">
            <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-extrabold border border-teal-100 tracking-wider uppercase">💎 NILAI UTAMA</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">Nilai Inti DLOB</h2>
            <p className="text-base text-gray-500 font-medium max-w-xl mx-auto">
              Prinsip-prinsip yang memandu setiap keputusan, fitur, dan tindakan kami untuk melayani komunitas.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Values Cards */}
            <div className="space-y-6">
              {[
                {
                  icon: Shield,
                  title: "Transparansi Keuangan",
                  description: "Kejujuran dan keterbukaan penuh dalam pencatatan saldo kas, pengeluaran, dan pembayaran mabar."
                },
                {
                  icon: Target,
                  title: "Keadilan Bermain",
                  description: "Hasil mabar tercatat adil. Semua pemain mendapat giliran dan kesempatan bermain yang setara."
                },
                {
                  icon: Zap,
                  title: "Inovasi Teknologi",
                  description: "Terus mengembangkan integrasi teknologi kecerdasan buatan (AI) untuk meningkatkan teknik bermain."
                },
                {
                  icon: Users,
                  title: "Kebersamaan Komunitas",
                  description: "Bekerja sama membangun ekosistem badminton yang sehat, menyenangkan, dan penuh rasa hormat."
                }
              ].map((value, index) => {
                const Icon = value.icon;
                return (
                  <div key={index} className="group flex gap-5 p-4 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-300 border border-transparent hover:border-gray-100">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 text-teal-750 group-hover:bg-teal-750 group-hover:text-white border border-teal-100/50 shadow-sm transition-all duration-300">
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{value.title}</h3>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right - Image */}
            <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 group">
              <Image
                src="/images/20210821_230459.jpg"
                alt="Nilai Inti DLOB"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-103"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="relative bg-gradient-to-b from-slate-50 to-white py-24 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16 space-y-4">
            <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-extrabold border border-teal-100 tracking-wider uppercase">✨ PERJALANAN KAMI</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">Cerita DLOB</h2>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1b3e3b] to-[#122826] rounded-3xl transform group-hover:scale-[1.01] transition-transform duration-300 -z-10 shadow-lg group-hover:shadow-teal-900/10"></div>
            <div className="relative bg-white rounded-3xl p-8 md:p-12 shadow-xs border border-gray-150 group-hover:border-transparent transition-all duration-300">
              <p className="text-base text-gray-700 leading-relaxed mb-6 font-medium">
                DLOB dimulai sebagai sebuah ide sederhana: bagaimana jika mengelola komunitas badminton bisa semenyenangkan bermain olahraga itu sendiri?
              </p>
              <p className="text-base text-gray-700 leading-relaxed mb-8 font-medium">
                Didirikan oleh para pemain badminton yang bersemangat yang sering mengalami tantangan pelacakan kehadiran manual, pengumpulan pembayaran kas yang tidak praktis, dan pengaturan pasangan pertandingan mabar yang timpang, kami bertekad menciptakan solusi digital yang komprehensif.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6 pt-8 border-t border-gray-100">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-100/50">
                      <Check className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900">Didirikan oleh Pemain</h4>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Memahami kebutuhan nyata para anggota mabar.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-100/50">
                      <Check className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900">Berbasis Komunitas</h4>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Mengutamakan transparansi dan antusiasme olahraga.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="relative bg-gradient-to-br from-[#122826] via-[#1a3f3b] to-[#122826] py-20 text-white overflow-hidden">
        {/* Badminton Court Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="none">
            <rect x="100" y="50" width="400" height="300" fill="none" stroke="white" strokeWidth="2"/>
            <line x1="300" y1="50" x2="300" y2="350" stroke="white" strokeWidth="2"/>
            <line x1="100" y1="200" x2="500" y2="200" stroke="white" strokeWidth="3"/>
            
            <rect x="700" y="50" width="400" height="300" fill="none" stroke="white" strokeWidth="2"/>
            <line x1="900" y1="50" x2="900" y2="350" stroke="white" strokeWidth="2"/>
            <line x1="700" y1="200" x2="1100" y2="200" stroke="white" strokeWidth="3"/>
          </svg>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-4xl md:text-5xl font-black mb-2 tracking-tight text-white group-hover:scale-105 transition-transform duration-300">{stat.number}</div>
                <h3 className="text-sm font-bold text-teal-200 mb-1">{stat.label}</h3>
                <p className="text-xs text-white/50 font-medium">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perjalanan Timeline */}
      <section className="relative bg-gradient-to-b from-white to-slate-50 py-24 overflow-hidden border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20 space-y-4">
            <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-extrabold border border-teal-100 tracking-wider uppercase">📅 TIMELINE</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">Perjalanan Kami</h2>
            <p className="text-base text-gray-500 font-medium max-w-xl mx-auto">
              Dari masa-masa awal yang penuh perjuangan hingga menjadi komunitas badminton mandiri dengan integrasi teknologi terdepan.
            </p>
          </div>

          <div ref={containerRef} className="relative">
            {/* Background track line */}
            <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-1.5 h-full bg-teal-650/10 top-0 rounded-full"></div>

            {/* Dynamic animated progress line */}
            <motion.div
              className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-1.5 bg-gradient-to-b from-[#1b3e3b] via-[#2a5955] to-[#122826] top-0 rounded-full shadow-[0_0_10px_rgba(27,62,59,0.7)]"
              style={{
                scaleY: scaleY,
                originY: 0,
                height: '100%'
              }}
            />

            <div className="space-y-16">
              {/* Year 2020 */}
              <div className="grid lg:grid-cols-2 gap-8 items-center relative">
                {/* Central timeline node */}
                <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 z-10 items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, backgroundColor: "#fff", borderColor: "#1e4843" }}
                    whileInView={{ scale: 1.15, backgroundColor: "#1e4843", borderColor: "#1e4843", boxShadow: "0 0 12px rgba(30,72,67,0.8)" }}
                    viewport={{ once: false, margin: "-50% 0px -50% 0px" }}
                    className="w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-300"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  </motion.div>
                </div>

                <div className="relative h-72 rounded-3xl overflow-hidden shadow-lg border border-gray-100">
                  <Image
                    src="/images/dlob8.jpg"
                    alt="2020 - Awal Dimulai"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1b3e3b] to-[#122826] rounded-3xl transform group-hover:scale-[1.03] transition-transform duration-300 -z-10 shadow-lg group-hover:shadow-teal-900/10"></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-xs border border-gray-150 group-hover:border-transparent transition-all duration-300">
                    <span className="px-3.5 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-extrabold border border-teal-100 tracking-wider uppercase inline-block mb-4">2020</span>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-3 group-hover:text-teal-650 transition-colors">Masa Pandemi</h3>
                    <p className="text-gray-500 font-medium text-xs leading-relaxed">
                      Di tengah gelombang pandemi COVID-19, kami memulai dengan misi sederhana untuk mempertemukan kembali para pecinta bulu tangkis yang terisolasi di rumah agar tetap bisa berolahraga dengan protokol aman.
                    </p>
                  </div>
                </div>
              </div>

              {/* Year 2021 */}
              <div className="grid lg:grid-cols-2 gap-8 items-center relative">
                {/* Central timeline node */}
                <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 z-10 items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, backgroundColor: "#fff", borderColor: "#1e4843" }}
                    whileInView={{ scale: 1.15, backgroundColor: "#1e4843", borderColor: "#1e4843", boxShadow: "0 0 12px rgba(30,72,67,0.8)" }}
                    viewport={{ once: false, margin: "-50% 0px -50% 0px" }}
                    className="w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-300"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  </motion.div>
                </div>

                <div className="group order-2 lg:order-1 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1b3e3b] to-[#122826] rounded-3xl transform group-hover:scale-[1.03] transition-transform duration-300 -z-10 shadow-lg group-hover:shadow-teal-900/10"></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-xs border border-gray-150 group-hover:border-transparent transition-all duration-300">
                    <span className="px-3.5 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-extrabold border border-teal-100 tracking-wider uppercase inline-block mb-4">2021</span>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-3 group-hover:text-teal-650 transition-colors">Bertahan dan Tumbuh</h3>
                    <p className="text-gray-500 font-medium text-xs leading-relaxed">
                      Meskipun situasi masih menantang, semangat kebersamaan para anggota tidak surut. Kami terus mengadakan mabar terbatas secara rutin, merekrut lebih banyak pemain, dan menyusun struktur kas dasar yang transparan.
                    </p>
                  </div>
                </div>
                <div className="relative h-72 rounded-3xl overflow-hidden shadow-lg border border-gray-100 order-1 lg:order-2">
                  <Image
                    src="/images/20210404_134623.jpg"
                    alt="2021 - Peluncuran Pertama"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Year 2022 */}
              <div className="grid lg:grid-cols-2 gap-8 items-center relative">
                {/* Central timeline node */}
                <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 z-10 items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, backgroundColor: "#fff", borderColor: "#1e4843" }}
                    whileInView={{ scale: 1.15, backgroundColor: "#1e4843", borderColor: "#1e4843", boxShadow: "0 0 12px rgba(30,72,67,0.8)" }}
                    viewport={{ once: false, margin: "-50% 0px -50% 0px" }}
                    className="w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-300"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  </motion.div>
                </div>

                <div className="relative h-72 rounded-3xl overflow-hidden shadow-lg border border-gray-100">
                  <Image
                    src="/images/20211027_205112.jpg"
                    alt="2022 - Komunitas Berkembang"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1b3e3b] to-[#122826] rounded-3xl transform group-hover:scale-[1.03] transition-transform duration-300 -z-10 shadow-lg group-hover:shadow-teal-900/10"></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-xs border border-gray-150 group-hover:border-transparent transition-all duration-300">
                    <span className="px-3.5 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-extrabold border border-teal-100 tracking-wider uppercase inline-block mb-4">2022</span>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-3 group-hover:text-teal-650 transition-colors">Komunitas Berkembang</h3>
                    <p className="text-gray-500 font-medium text-xs leading-relaxed">
                      Seiring berakhirnya pembatasan pandemi, komunitas bulu tangkis kami melonjak secara eksponensial. Kami meresmikan jadwal mabar mingguan di GOR Wisma Harapan dan mengadakan turnamen internal perdana.
                    </p>
                  </div>
                </div>
              </div>

              {/* Year 2023 */}
              <div className="grid lg:grid-cols-2 gap-8 items-center relative">
                {/* Central timeline node */}
                <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 z-10 items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, backgroundColor: "#fff", borderColor: "#1e4843" }}
                    whileInView={{ scale: 1.15, backgroundColor: "#1e4843", borderColor: "#1e4843", boxShadow: "0 0 12px rgba(30,72,67,0.8)" }}
                    viewport={{ once: false, margin: "-50% 0px -50% 0px" }}
                    className="w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-300"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  </motion.div>
                </div>

                <div className="group order-2 lg:order-1 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1b3e3b] to-[#122826] rounded-3xl transform group-hover:scale-[1.03] transition-transform duration-300 -z-10 shadow-lg group-hover:shadow-teal-900/10"></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-xs border border-gray-150 group-hover:border-transparent transition-all duration-300">
                    <span className="px-3.5 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-extrabold border border-teal-100 tracking-wider uppercase inline-block mb-4">2023</span>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-3 group-hover:text-teal-650 transition-colors">Membangun Fondasi Digital</h3>
                    <p className="text-gray-500 font-medium text-xs leading-relaxed">
                      Menyadari inefisiensi administrasi manual, kami mulai merancang arsitektur sistem digital DLOB. Fokus kami adalah mengotomatisasi pencatatan skor pertandingan dan database profil pemain.
                    </p>
                  </div>
                </div>
                <div className="relative h-72 rounded-3xl overflow-hidden shadow-lg border border-gray-100 order-1 lg:order-2">
                  <Image
                    src="/images/20211027_205109.jpg"
                    alt="2023 - Membangun Fondasi"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Year 2024 */}
              <div className="grid lg:grid-cols-2 gap-8 items-center relative">
                {/* Central timeline node */}
                <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 z-10 items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, backgroundColor: "#fff", borderColor: "#1e4843" }}
                    whileInView={{ scale: 1.15, backgroundColor: "#1e4843", borderColor: "#1e4843", boxShadow: "0 0 12px rgba(30,72,67,0.8)" }}
                    viewport={{ once: false, margin: "-50% 0px -50% 0px" }}
                    className="w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-300"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  </motion.div>
                </div>

                <div className="relative h-72 rounded-3xl overflow-hidden shadow-lg border border-gray-100">
                  <Image
                    src="/images/dlob12.jpg"
                    alt="2024 - Ekspansi Regional"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1b3e3b] to-[#122826] rounded-3xl transform group-hover:scale-[1.03] transition-transform duration-300 -z-10 shadow-lg group-hover:shadow-teal-900/10"></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-xs border border-gray-150 group-hover:border-transparent transition-all duration-300">
                    <span className="px-3.5 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-extrabold border border-teal-100 tracking-wider uppercase inline-block mb-4">2024</span>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-3 group-hover:text-teal-650 transition-colors">Implementasi Platform & QR</h3>
                    <p className="text-gray-500 font-medium text-xs leading-relaxed">
                      Meluncurkan platform versi beta pertama yang mencakup sistem kehadiran berbasis QR code, rekap otomatis iuran bulanan, serta leaderboard performa mabar secara real-time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Year 2025 */}
              <div className="grid lg:grid-cols-2 gap-8 items-center relative">
                {/* Central timeline node */}
                <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 z-10 items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, backgroundColor: "#fff", borderColor: "#1e4843" }}
                    whileInView={{ scale: 1.15, backgroundColor: "#1e4843", borderColor: "#1e4843", boxShadow: "0 0 12px rgba(30,72,67,0.8)" }}
                    viewport={{ once: false, margin: "-50% 0px -50% 0px" }}
                    className="w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-300"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  </motion.div>
                </div>

                <div className="group order-2 lg:order-1 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1b3e3b] to-[#122826] rounded-3xl transform group-hover:scale-[1.03] transition-transform duration-300 -z-10 shadow-lg group-hover:shadow-teal-900/10"></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-xs border border-gray-150 group-hover:border-transparent transition-all duration-300">
                    <span className="px-3.5 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-extrabold border border-teal-100 tracking-wider uppercase inline-block mb-4">2025</span>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-3 group-hover:text-teal-650 transition-colors">Integrasi AI & Automasi</h3>
                    <p className="text-gray-500 font-medium text-xs leading-relaxed">
                      Menerapkan kecerdasan buatan (AI) untuk mencocokkan lawan main (*versus matching*) secara cerdas berdasarkan level kemampuan, menyajikan analitik performa terperinci bagi tiap pemain.
                    </p>
                  </div>
                </div>
                <div className="relative h-72 rounded-3xl overflow-hidden shadow-lg border border-gray-100 order-1 lg:order-2">
                  <Image
                    src="/images/dlob1.jpg"
                    alt="2025 - Era Baru"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Year 2026 */}
              <div className="grid lg:grid-cols-2 gap-8 items-center relative">
                {/* Central timeline node */}
                <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 z-10 items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, backgroundColor: "#fff", borderColor: "#1e4843" }}
                    whileInView={{ scale: 1.15, backgroundColor: "#1e4843", borderColor: "#1e4843", boxShadow: "0 0 12px rgba(30,72,67,0.8)" }}
                    viewport={{ once: false, margin: "-50% 0px -50% 0px" }}
                    className="w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-300"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  </motion.div>
                </div>

                <div className="relative h-72 rounded-3xl overflow-hidden shadow-lg border border-gray-100">
                  <Image
                    src="/images/dlob3.jpg"
                    alt="2026 - Masa Depan Cerah"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1b3e3b] to-[#122826] rounded-3xl transform group-hover:scale-[1.03] transition-transform duration-300 -z-10 shadow-lg group-hover:shadow-teal-900/10"></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-xs border border-gray-150 group-hover:border-transparent transition-all duration-300">
                    <span className="px-3.5 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-extrabold border border-teal-100 tracking-wider uppercase inline-block mb-4">2026</span>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-3 group-hover:text-teal-650 transition-colors">Ekosistem Sempurna</h3>
                    <p className="text-gray-500 font-medium text-xs leading-relaxed">
                      Saat ini, platform DLOB telah stabil dengan modul-modul canggih seperti AI Coaching, portal pre-order jersey, galeri foto berbasis deteksi wajah, serta dashboard kepengurusan komunitas yang solid.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hall of Fame */}
      <section className="bg-slate-50 py-24 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-extrabold border border-teal-100 tracking-wider uppercase">🏆 Penghargaan</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">Hall of Fame</h2>
          </div>
          <HallOfFameSection showAll={false} />
        </div>
      </section>

      {/* Gallery Section */}
      <section className="relative bg-white py-24 overflow-hidden border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 space-y-4">
            <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-extrabold border border-teal-100 tracking-wider uppercase">📷 DOKUMENTASI</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">Galeri Momen Terbaik</h2>
            <p className="text-base text-gray-500 font-medium max-w-xl mx-auto">
              Saksikan momen-momen terbaik dari pertandingan dan latihan badminton kami yang penuh semangat.
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
              <div key={idx} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1b3e3b] to-[#122826] rounded-3xl transform group-hover:scale-[1.03] transition-transform duration-300 -z-10 shadow-lg group-hover:shadow-teal-900/10"></div>
                <div className="relative overflow-hidden rounded-3xl shadow-xs border border-gray-150 group-hover:border-transparent transition-all duration-300 h-64">
                  <Image
                    src={src}
                    alt={`Gallery ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <div className="p-6 text-white w-full">
                      <p className="font-extrabold text-sm uppercase tracking-wider text-teal-350 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Momen Mabar
                      </p>
                      <p className="text-xs text-white/80 mt-0.5 font-medium">Dari koleksi resmi komunitas DLOB</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-br from-[#122826] via-[#1a3f3b] to-[#122826] text-white py-24 overflow-hidden">
        {/* Badminton Court Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="none">
            <rect x="100" y="50" width="400" height="300" fill="none" stroke="white" strokeWidth="2"/>
            <line x1="300" y1="50" x2="300" y2="350" stroke="white" strokeWidth="2"/>
            <line x1="100" y1="200" x2="500" y2="200" stroke="white" strokeWidth="3"/>
            
            <rect x="700" y="50" width="400" height="300" fill="none" stroke="white" strokeWidth="2"/>
            <line x1="900" y1="50" x2="900" y2="350" stroke="white" strokeWidth="2"/>
            <line x1="700" y1="200" x2="1100" y2="200" stroke="white" strokeWidth="3"/>
          </svg>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Siap Bergabung dengan DLOB?
          </h2>
          <p className="text-base md:text-lg text-teal-100/80 max-w-xl mx-auto font-medium">
            Jadilah bagian dari komunitas badminton terdepan dan rasakan keseruan mabar bertenaga teknologi modern.
          </p>
          <div className="pt-4">
            <Link href="/register">
              <button className="group inline-flex items-center gap-2 bg-white text-[#1e4843] hover:bg-teal-50 font-black py-4 px-10 rounded-xl text-sm transition-all duration-300 shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                <span>Mulai Sekarang</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
