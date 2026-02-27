'use client';

import React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Play, 
  Target, 
  Crown, 
  Star,
  // Brand Icons
  Hexagon,
  Triangle,
  Command,
  Ghost,
  Gem,
  Cpu
} from "lucide-react";

// --- MOCK BRANDS ---
const CLIENTS = [
  { name: "BadmintonHub", icon: Hexagon },
  { name: "Pro Players", icon: Triangle },
  { name: "Clubs", icon: Command },
  { name: "Tournaments", icon: Ghost },
  { name: "Athletes", icon: Gem },
  { name: "Community", icon: Cpu },
];

// --- SUB-COMPONENTS ---
const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center justify-center transition-transform hover:-translate-y-1 cursor-default">
    <span className="text-xl font-bold text-white sm:text-2xl">{value}</span>
    <span className="text-[10px] uppercase tracking-wider text-zinc-200 font-semibold sm:text-xs">{label}</span>
  </div>
);

// --- MAIN COMPONENT ---
export default function HeroSection() {
  return (
    <div className="relative w-full bg-zinc-950 text-white overflow-hidden font-sans">
      {/* 
        SCOPED ANIMATIONS 
      */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-fade-in {
          animation: fadeSlideIn 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-marquee {
          animation: marquee 40s linear infinite; /* Slower for readability */
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>

      {/* Background Image with Gradient Mask */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-50"
        style={{
          backgroundImage: 'url("/images/badminbg.jpg")',
          backgroundPosition: 'center',
          maskImage: "linear-gradient(180deg, transparent 0%, black 20%, black 70%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 20%, black 70%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-6 pb-12 sm:px-6 md:pt-8 md:pb-20 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-start">
          
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-8 pt-8">
            
            {/* Badge */}
            <div className="animate-fade-in delay-100">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md transition-colors hover:bg-white/10">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  AI-Powered Platform
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1 
              className="animate-fade-in delay-200 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-medium tracking-tighter leading-[0.9]"
              style={{
                maskImage: "linear-gradient(180deg, black 0%, black 80%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(180deg, black 0%, black 80%, transparent 100%)"
              }}
            >
              Platform Bulu Tangkis<br />
              <span className="bg-gradient-to-br from-white via-white to-[#ffcd75] bg-clip-text text-transparent">
                Masa Depan
              </span><br />
              Dimulai di Sini
            </h1>

            {/* Description */}
            <p className="animate-fade-in delay-300 max-w-xl text-lg text-zinc-400 leading-relaxed">
              Platform komunitas bulu tangkis terdepan yang mengotomatisasi pelacakan kehadiran, 
              penjadwalan pertandingan, dan pengumpulan pembayaran dengan wawasan bertenaga AI.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in delay-400 flex flex-col sm:flex-row gap-4">
              <Link href="/kontak" className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-zinc-950 transition-all hover:scale-[1.02] hover:bg-zinc-200 active:scale-[0.98]">
                Bergabung Sekarang
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <button 
                onClick={() => {
                  const featuresSection = document.getElementById('features-section');
                  if (featuresSection) {
                    featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10 hover:border-white/20"
              >
                <Play className="w-4 h-4 fill-current" />
                Pelajari Lebih Lanjut
              </button>
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="lg:col-span-5 space-y-6 lg:mt-12">
            
            {/* Stats Card */}
            <div className="animate-fade-in delay-500 relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
              {/* Card Glow Effect */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                  <div className="text-3xl font-bold tracking-tight text-white">50+</div>
                  <div className="text-sm text-zinc-200 font-medium">Pemain Aktif</div>
                  </div>
                </div>

                {/* Progress Bar Section */}
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-200 font-medium">Tingkat Kepuasan</span>
                    <span className="text-white font-semibold">98%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800/50">
                    <div className="h-full w-[99%] rounded-full bg-gradient-to-r from-white to-zinc-400" />
                  </div>
                </div>

                <div className="h-px w-full bg-white/10 mb-6" />

                {/* Mini Stats Grid */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <StatItem value="100+" label="Pertandingan/Bulan" />
                  <div className="w-px h-full bg-white/10 mx-auto" />
                  <StatItem value="5" label="Tahun Berdiri" />
                  <div className="w-px h-full bg-white/10 mx-auto" />
                  <StatItem value="24/7" label="AI Analytics" />
                </div>

                {/* Tag Pills */}
                <div className="mt-8 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-wide text-zinc-300">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    ACTIVE
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-wide text-zinc-300">
                    <Crown className="w-3 h-3 text-yellow-500" />
                    PREMIUM
                  </div>
                </div>
              </div>
            </div>

            {/* Features Card */}
            <div className="animate-fade-in delay-500 relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="mb-6 text-xs font-semibold text-zinc-200 uppercase tracking-wide">Fitur Unggulan Platform</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2 group hover:bg-white/5 p-2 rounded-lg transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 flex-shrink-0 group-hover:bg-white/20 text-sm">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Pelacakan Kehadiran</p>
                    <p className="text-[10px] text-zinc-300 font-medium">Sistem AI real-time</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 group hover:bg-white/5 p-2 rounded-lg transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 flex-shrink-0 group-hover:bg-white/20 text-sm">
                    📅
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Penjadwalan Cerdas</p>
                    <p className="text-[10px] text-zinc-300 font-medium">Algoritma pintar</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 group hover:bg-white/5 p-2 rounded-lg transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 flex-shrink-0 group-hover:bg-white/20 text-sm">
                    💳
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Manajemen Pembayaran</p>
                    <p className="text-[10px] text-zinc-300 font-medium">Sistem terintegrasi</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 group hover:bg-white/5 p-2 rounded-lg transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 flex-shrink-0 group-hover:bg-white/20 text-sm">
                    📊
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Analitik AI</p>
                    <p className="text-[10px] text-zinc-300 font-medium">Wawasan mendalam</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
