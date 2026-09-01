'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowUpRight, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Play
} from "lucide-react";

export default function HeroSection() {
  return (
    <div className="w-full bg-white text-zinc-950 font-sans">
      {/* Scoped CSS for 3D Cutout (Only Front Shoe Pops Out) */}
      <style jsx>{`
        .athlete-cutout-3d {
          bottom: -30px;
          clip-path: polygon(0% 0%, 100% 0%, 100% calc(100% - 30px), 58% calc(100% - 30px), 54% 100%, 0% 100%);
        }
        @media (min-width: 640px) {
          .athlete-cutout-3d {
            bottom: -50px;
            clip-path: polygon(0% 0%, 100% 0%, 100% calc(100% - 50px), 58% calc(100% - 50px), 54% 100%, 0% 100%);
          }
        }
        @media (min-width: 768px) {
          .athlete-cutout-3d {
            bottom: -70px;
            clip-path: polygon(0% 0%, 100% 0%, 100% calc(100% - 70px), 58% calc(100% - 70px), 54% 100%, 0% 100%);
          }
        }
        @media (min-width: 1024px) {
          .athlete-cutout-3d {
            bottom: -85px;
            clip-path: polygon(0% 0%, 100% 0%, 100% calc(100% - 85px), 58% calc(100% - 85px), 54% 100%, 0% 100%);
          }
        }
      `}</style>

      {/* ─────────────────────────────────────────────────────────────
          1. HERO VIEWPORT (Pure Sky + Text BEHIND + 3D Breakout Shoes Overlap)
      ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen h-[100dvh] w-full overflow-visible bg-white flex flex-col justify-between">
        
        {/* Layer 0: Background Pure Sky & Clouds (Clipped at hero boundary, without athlete) */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#2474c7]">
          <div 
            className="absolute inset-0 bg-cover bg-[center_top] md:bg-center"
            style={{
              backgroundImage: 'url("/badminton-hero-pure-sky.webp")',
            }}
          >
            {/* Subtle depth overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/30" />
          </div>
        </div>

        {/* Layer 1 (BEHIND CHARACTER): Massive Typography "SMASH HARDER." (Crisp Flat White) */}
        <div className="absolute inset-x-0 top-16 sm:top-20 md:top-24 lg:top-24 z-10 pointer-events-none select-none text-center px-4 overflow-hidden">
          <h1 
            className="font-black uppercase text-white leading-none tracking-tighter"
            style={{
              fontSize: "clamp(4.2rem, 15vw, 14rem)",
              letterSpacing: "-0.04em",
              fontFamily: "Impact, 'Arial Black', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            SMASH HARDER.
          </h1>
        </div>

        {/* Layer 2 (3D POP-OUT FRONT SHOE ONLY): Trailing back leg is clipped at line */}
        <div 
          className="athlete-cutout-3d absolute inset-x-0 top-0 z-20 pointer-events-none bg-cover bg-[center_top] md:bg-center"
          style={{
            backgroundImage: 'url("/badminton-hero-cutout.webp")',
          }}
        />

        {/* Layer 3: Foreground Content (Editorial Minimalist Floating Style) */}
        <div className="relative z-30 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12 md:pb-16 flex flex-col justify-end flex-1">
          
          <div className="max-w-md sm:max-w-lg space-y-4">
            
            {/* Editorial Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.08] drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
              Platform Bulu Tangkis<br />
              <span className="font-normal italic text-white/90 text-2xl sm:text-3xl lg:text-4xl">
                Masa Depan Dimulai di Sini.
              </span>
            </h2>

            {/* Micro Subtitle */}
            <p className="text-xs sm:text-sm text-zinc-100/90 font-medium leading-relaxed max-w-md drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              Otomatisasi jadwal mabar, absensi, dan pembayaran komunitas dengan analitik cerdas bertenaga AI.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/kontak"
                className="group inline-flex items-center gap-2 bg-white text-zinc-950 font-extrabold px-6 py-3 rounded-full text-xs uppercase tracking-wider hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/20"
              >
                <span>Gabung Sekarang</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <button 
                onClick={() => {
                  const featuresSection = document.getElementById('features-section');
                  if (featuresSection) {
                    featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/25 px-4 py-3 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all cursor-pointer shadow-lg"
                title="Scroll ke Tentang Kami"
              >
                <span>Tentang Kami</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </section>
    </div>
  );
}

