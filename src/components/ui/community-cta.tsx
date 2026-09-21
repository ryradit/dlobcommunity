"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface CommunityCTAProps {
  className?: string;
}

export const CommunityCTA = ({ className = '' }: CommunityCTAProps) => {
  return (
    <section className={`relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-zinc-50 border-t border-zinc-200/80 overflow-hidden ${className}`}>
      <div className="max-w-7xl mx-auto relative">
        
        {/* Outer Doppelrand Shell */}
        <div className="p-2 sm:p-2.5 rounded-[2.5rem] bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden relative">
          
          {/* Ambient Lighting Gradients */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-[#4382C8]/25 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-radial from-blue-600/15 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Inner Core */}
          <div className="relative rounded-[calc(2.5rem-0.625rem)] bg-gradient-to-b from-zinc-900 to-zinc-950 p-8 sm:p-14 lg:p-20 text-white border border-white/5">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              
              {/* Left Column: Bold Headline & Trust Factors */}
              <div className="lg:col-span-8 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-white text-[11px] font-mono tracking-wider uppercase">
                  Registrasi Member DLOB
                </div>

                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05]">
                  Siap Melangkah ke<br />
                  <span className="text-[#4382C8]">Level Permainan Berikutnya?</span>
                </h2>

                <p className="text-zinc-400 text-base sm:text-lg max-w-2xl leading-relaxed">
                  Bergabung bersama 50+ Member Aktif dan pegiat bulu tangkis di Tangerang & Cikupa. Nikmati kemudahan booking jadwal mabar dan analitik pertandingan terpadu.
                </p>

                {/* Trust Pills */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs text-zinc-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#4382C8]" />
                    Mabar Rutin Terjadwal
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#4382C8]" />
                    Sistem Rating ELO Digital
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#4382C8]" />
                    Fasilitas Lapangan Terverifikasi
                  </span>
                </div>
              </div>

              {/* Right Column: High-Impact Dual CTAs */}
              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-center justify-center lg:items-end gap-4 w-full">
                <Link
                  href="/register"
                  className="group w-full sm:w-auto lg:w-full inline-flex items-center justify-between p-2 pl-7 bg-white hover:bg-zinc-100 text-zinc-950 rounded-full font-bold text-sm tracking-tight transition-all duration-300 shadow-xl active:scale-[0.98]"
                >
                  <span>Daftar Member Sekarang</span>
                  <div className="btn-nested-icon w-10 h-10 rounded-full bg-zinc-950 text-white flex items-center justify-center group-hover:bg-[#4382C8] transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>

                <Link
                  href="/tentang"
                  className="w-full sm:w-auto lg:w-full inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-white/20 hover:border-white/40 text-white text-sm font-semibold tracking-tight backdrop-blur-sm hover:bg-white/5 transition-all duration-300 active:scale-[0.98]"
                >
                  Tentang Komunitas DLOB
                </Link>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
