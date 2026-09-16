'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Users, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

export default function FeaturesSection() {
  return (
    <section id="features-section" className="pt-28 sm:pt-36 md:pt-40 pb-28 px-4 bg-white relative overflow-hidden">
      {/* Subtle background mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-[#4382C8]/8 to-transparent rounded-full translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-radial from-[#4382C8]/5 to-transparent rounded-full -translate-x-1/4 translate-y-1/4" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left - Formal & Completely Upright Image Card Container */}
          <motion.div
            className="relative flex items-center justify-center p-2 sm:p-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            {/* Soft backdrop glow */}
            <div className="absolute inset-4 bg-gradient-to-br from-[#4382C8]/20 via-blue-500/10 to-indigo-600/15 rounded-3xl blur-2xl pointer-events-none" />

            {/* Formal Straight Card Frame (No Rotation / No Tilt) */}
            <div 
              className="relative w-full max-w-[420px] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/15 border border-slate-200 bg-slate-900 group"
              style={{ transform: 'none', rotate: '0deg' }}
            >
              <Image
                src="/images/potrait/IMG_7627.JPG"
                alt="DLOB Community Athlete"
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                priority
              />

              {/* Gradient Overlay for Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

              {/* Formal Header Badge inside Card */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4382C8]" />
                <span>DLOB Official Athlete</span>
              </div>

              {/* Frosted Glass Footer Tag */}
              <div className="absolute bottom-6 inset-x-6 backdrop-blur-xl bg-white/15 border border-white/25 rounded-xl p-4 text-center text-white shadow-xl">
                <p className="font-extrabold text-sm tracking-wide text-white drop-shadow-sm">
                  DLOB Badminton Community
                </p>
                <p className="text-[11px] text-white/80 font-medium mt-0.5">
                  Tangerang & Cikupa
                </p>
              </div>
            </div>

            {/* Floating Member Count Badge (Strictly Straight, No Rotation) */}
            <motion.div
              className="absolute -top-3 left-0 sm:-left-2 bg-white rounded-xl px-4 py-3 shadow-xl border border-slate-100 hidden sm:flex items-center gap-3"
              initial={{ opacity: 0, y: -16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{ transform: 'none', rotate: '0deg' }}
            >
              <div className="w-9 h-9 rounded-lg bg-[#4382C8]/10 text-[#4382C8] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-900 font-extrabold text-xs">200+ Member</p>
                <p className="text-slate-500 text-[10px]">Aktif Bergabung</p>
              </div>
            </motion.div>

            {/* Floating Live Match Badge (Strictly Straight, No Rotation) */}
            <motion.div
              className="absolute -bottom-3 right-0 sm:-right-2 bg-white rounded-xl px-4 py-3 shadow-xl border border-slate-100 hidden sm:flex items-center gap-3"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.4 }}
              style={{ transform: 'none', rotate: '0deg' }}
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-900 font-extrabold text-xs">Komunitas Aktif</p>
                <p className="text-slate-500 text-[10px]">Mabar Rutin Mingguan</p>
              </div>
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
