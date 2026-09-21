'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { MessageSquarePlus, ArrowRight } from 'lucide-react';

export default function SurveyCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 32 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="doppelrand-shell p-2 sm:p-2.5 rounded-[2.5rem] bg-zinc-950 border border-zinc-800 shadow-2xl"
      >
        <div className="relative rounded-[calc(2.5rem-0.625rem)] overflow-hidden bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-8 sm:p-12 lg:p-14 text-white border border-white/5">
          
          {/* Subtle electric blue radial glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-[#4382C8]/15 via-[#4382C8]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-gradient-radial from-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8 z-10">
            
            {/* Left Content */}
            <div className="space-y-4 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-[11px] font-mono tracking-wider uppercase">
                Riset Komunitas &amp; Masa Depan
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                Suara Anda Membentuk Arah<br />
                <span className="text-[#4382C8]">DLOB Badminton Community.</span>
              </h2>

              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                Evaluasi jadwal mabar, kualitas lapangan, turnamen, dan fitur aplikasi berikutnya. Pengisian hanya butuh 3–5 menit & anonim.
              </p>
            </div>

            {/* Right Action: Button-in-Button CTA */}
            <div className="shrink-0">
              <Link
                href="/survey"
                className="group inline-flex items-center gap-4 bg-white hover:bg-zinc-100 text-zinc-950 pl-7 pr-3 py-4 rounded-full font-bold text-sm tracking-tight transition-all duration-300 shadow-xl active:scale-[0.98]"
              >
                <span>Ikuti Survey Sekarang</span>
                <div className="btn-nested-icon w-9 h-9 rounded-full bg-zinc-950 text-white flex items-center justify-center group-hover:bg-[#4382C8] transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </div>

          </div>
        </div>
      </motion.div>
    </section>
  );
}
