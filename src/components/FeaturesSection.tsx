'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function FeaturesSection() {
  const highlights = [
    {
      title: "AI Coaching",
      desc: "Dapatkan analisis mendalam dan rekomendasi taktis bertenaga AI untuk mengembangkan teknik bermain Anda."
    },
    {
      title: "Statistik Realtime & Leaderboard",
      desc: "Setiap kemenangan dicatat langsung untuk menyusun peringkat performa anggota secara akurat."
    },
    {
      title: "Tracking Your Payment",
      desc: "Pantau riwayat pembayaran, iuran bulanan, dan status transaksi mabar Anda secara transparan dan real-time."
    }
  ];

  return (
    <section id="features-section" className="py-24 px-4 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
      {/* Background blobs for premium feeling */}
      <div className="absolute top-1/4 left-0 w-80 h-80 bg-teal-50 rounded-full blur-3xl pointer-events-none -z-10 opacity-60" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-emerald-50 rounded-full blur-3xl pointer-events-none -z-10 opacity-60" />

      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left - Image Column */}
          <div className="lg:col-span-6 relative">
            <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-2xl border border-gray-100 group">
              <Image
                src="/images/potrait/IMG_7627.JPG"
                alt="DLOB Community"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            </div>
            
            {/* Elegant Floating Badge */}
            <div className="absolute -bottom-6 right-6 sm:right-10 bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-xl border border-gray-100 dark:border-zinc-800 flex items-center gap-3 animate-bounce-slow">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center text-white text-xs font-black shadow-sm">D</div>
                <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs font-black shadow-sm">L</div>
                <div className="w-8 h-8 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-white text-xs font-black shadow-sm">O</div>
                <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-white flex items-center justify-center text-white text-xs font-black shadow-sm">B</div>
              </div>
              <div className="pr-2">
                <p className="text-gray-900 dark:text-white font-extrabold text-xs tracking-tight">50+ Anggota Aktif</p>
                <p className="text-teal-600 dark:text-teal-400 text-[10px] font-bold uppercase tracking-wider">Komunitas Badminton</p>
              </div>
            </div>
          </div>

          {/* Right - Content Column */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-extrabold border border-teal-100 tracking-wider uppercase">
                🏸 TENTANG KAMI
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">
                Platform Badminton Terpadu
              </h2>
              <p className="text-base text-gray-500 font-medium pt-2">
                DLOB Community adalah ekosistem digital untuk mengelola grup mabar badminton secara profesional, menghadirkan transparansi dan antusiasme mabar tingkat lanjut.
              </p>
            </div>

            {/* Sub-Feature Items */}
            <div className="space-y-5">
              {highlights.map((item, index) => (
                <div key={index} className="flex gap-4 p-4 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-300 border border-transparent hover:border-gray-100 group">
                  <div className="mt-0.5 shrink-0 text-teal-600 group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link 
                href="/tentang" 
                className="group/btn inline-flex items-center gap-2 bg-[#1e4843] hover:bg-[#162f2c] text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 text-sm shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                Pelajari Selengkapnya
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
