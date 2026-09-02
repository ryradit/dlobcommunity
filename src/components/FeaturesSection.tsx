'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const imageVariants = {
  hidden: { opacity: 0, x: -48, rotate: -10 },
  visible: {
    opacity: 1,
    x: 0,
    rotate: -7,
    transition: { type: 'spring' as const, stiffness: 80, damping: 18, delay: 0.1 },
  },
};

export default function FeaturesSection() {
  return (
    <section id="features-section" className="pt-28 sm:pt-36 md:pt-40 pb-28 px-4 bg-white relative overflow-hidden">
      {/* Subtle animated background mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-[#4382C8]/8 to-transparent rounded-full translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-radial from-[#4382C8]/5 to-transparent rounded-full -translate-x-1/4 translate-y-1/4" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left - Animated Image Card */}
          <motion.div
            className="relative flex items-center justify-center p-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={imageVariants}
            whileHover={{ rotate: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }}
          >
            {/* SVG ClipPath */}
            <svg className="absolute w-0 h-0" aria-hidden="true">
              <defs>
                <clipPath id="featuresCardShape" clipPathUnits="objectBoundingBox">
                  <path d="
                    M 0.28 0.00
                    C 0.12 0.00, 0.00 0.10, 0.00 0.22
                    L 0.00 0.78
                    C 0.00 0.90, 0.10 1.00, 0.22 1.00
                    L 0.78 1.00
                    C 0.90 1.00, 1.00 0.90, 1.00 0.78
                    L 1.00 0.32
                    C 1.00 0.20, 0.90 0.12, 0.78 0.12
                    L 0.62 0.12
                    C 0.54 0.12, 0.48 0.06, 0.44 0.01
                    C 0.40 0.00, 0.34 0.00, 0.28 0.00
                    Z
                  " />
                </clipPath>
              </defs>
            </svg>

            {/* Ambient glow ring behind card */}
            <div className="absolute inset-8 bg-gradient-to-br from-[#4382C8]/30 to-[#1d4573]/20 rounded-[60px] blur-2xl" />

            {/* Card */}
            <div
              className="relative w-full max-w-[400px] aspect-[4/5] filter drop-shadow-[0_24px_40px_rgba(0,0,0,0.22)]"
              style={{ clipPath: 'url(#featuresCardShape)' }}
            >
              <Image
                src="/images/potrait/IMG_7627.JPG"
                alt="DLOB Community Player"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

              {/* Frosted Glass Tag */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[75%] backdrop-blur-md bg-white/20 border border-white/35 rounded-2xl py-3 px-4 text-center shadow-xl">
                <p className="font-extrabold text-sm text-white tracking-wide drop-shadow-sm">DLOB Athlete</p>
                <p className="text-[11px] text-white/90 font-medium mt-0.5">Badminton Community</p>
              </div>

              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
              </div>
            </div>

            {/* Floating Badge */}
            <motion.div
              className="absolute -top-2 left-0 sm:left-2 bg-white rounded-full px-4 py-3 shadow-2xl border border-gray-100 hidden sm:flex items-center gap-3"
              initial={{ opacity: 0, y: -16, scale: 0.8 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              style={{ rotate: -3 }}
            >
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">A</div>
                <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] font-bold">B</div>
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">50+</div>
              </div>
              <div>
                <p className="text-slate-900 font-bold text-xs">200+ Member</p>
                <p className="text-slate-500 text-[10px]">Aktif Bergabung</p>
              </div>
            </motion.div>

            {/* Live indicator */}
            <motion.div
              className="absolute -bottom-2 right-0 sm:right-2 bg-white rounded-full px-4 py-2.5 shadow-2xl border border-gray-100 hidden sm:flex items-center gap-2"
              initial={{ opacity: 0, y: 16, scale: 0.8 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
              style={{ rotate: 2 }}
            >
              <span className="relative flex w-2.5 h-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-green-500" />
              </span>
              <p className="text-slate-900 font-bold text-xs">Live Match Today</p>
            </motion.div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            className="text-slate-900 space-y-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {/* Eyebrow */}
            <motion.div custom={0} variants={fadeUp}>
              <h3 className="text-zinc-900 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-8 h-[2px] bg-[#4382C8]" />
                TENTANG KAMI
              </h3>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight">
                Platform<br />
                <span className="text-[#4382C8]">Badminton</span><br />
                Terpadu
              </h2>
            </motion.div>

            {/* Description */}
            <motion.div custom={1} variants={fadeUp} className="space-y-3 text-slate-500 text-base leading-relaxed">
              <p>DLOB Community adalah platform internal yang kami bangun khusus untuk mengelola kegiatan dan anggota komunitas badminton kami sendiri.</p>
              <p>Mulai dari absensi latihan, info jadwal rutin, galeri momen, hingga survei komunitas — semua terpusat dalam satu sistem yang hanya untuk member DLOB.</p>
            </motion.div>

            {/* CTA */}
            <motion.div custom={2} variants={fadeUp}>
              <Link
                href="/tentang"
                className="inline-flex items-center gap-3 bg-zinc-950 hover:bg-zinc-800 text-white px-8 py-4 rounded-full font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl group"
              >
                Pelajari Selengkapnya
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
