"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';

interface CommunityCTAProps {
  className?: string;
}

const AVATARS = ['A', 'R', 'D', 'B', 'F'];
const AVATAR_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-blue-600', 'bg-indigo-500', 'bg-cyan-500'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 28, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 90, damping: 14 },
  },
};

export const CommunityCTA = ({ className = '' }: CommunityCTAProps) => {
  return (
    <section className={`relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden ${className}`}>
      <div className="max-w-7xl mx-auto relative rounded-3xl overflow-hidden shadow-2xl border border-white/20">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#4382C8] via-[#2f6fae] to-[#1b4372]" />

        {/* Animated spotlight sweep */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent skew-x-12 pointer-events-none"
          animate={{ x: ['-120%', '220%'] }}
          transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
        />

        {/* Animated Glass Glows */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <motion.div
            className="absolute -top-20 -left-20 w-96 h-96 bg-white/20 rounded-full mix-blend-overlay filter blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-40 right-10 w-96 h-96 bg-cyan-300/20 rounded-full mix-blend-overlay filter blur-3xl"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          <motion.div
            className="absolute -bottom-20 left-1/2 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-overlay filter blur-3xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          />
        </div>

        {/* Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="relative backdrop-blur-md bg-white/10 p-8 sm:p-12 lg:p-16"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            {/* Left Text */}
            <div className="flex-1 text-center lg:text-left">
              {/* Animated pill badge */}
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-5">
                <motion.span
                  className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm border border-white/25"
                >
                  {/* Pulsing ring */}
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-white/40"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                  <Star className="w-3 h-3 fill-white" />
                  Komunitas Badminton Terdepan
                </motion.span>
              </motion.div>

              <motion.h2
                variants={itemVariants}
                className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.05] tracking-tight drop-shadow-sm"
              >
                Mari Bergabung<br />dengan Komunitas<br />
                <span className="text-white/70">DLOB</span>
              </motion.h2>

              <motion.p
                variants={itemVariants}
                className="text-base md:text-lg text-white/80 leading-relaxed max-w-2xl"
              >
                Platform internal yang kami bangun khusus untuk mengelola kegiatan, absensi mabar, jadwal rutin, dan kebersamaan komunitas badminton kami sendiri.
              </motion.p>

              {/* Social Proof Avatar Row */}
              <motion.div variants={itemVariants} className="flex items-center gap-3 mt-6 justify-center lg:justify-start">
                <div className="flex -space-x-2.5">
                  {AVATARS.map((letter, i) => (
                    <motion.div
                      key={i}
                      className={`w-8 h-8 rounded-full border-2 border-white/60 ${AVATAR_COLORS[i]} flex items-center justify-center text-white text-[10px] font-black shadow-md`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 200 }}
                    >
                      {letter}
                    </motion.div>
                  ))}
                </div>
                <div className="text-white/80 text-sm font-medium">
                  <span className="font-black text-white">200+</span> member aktif bergabung
                </div>
              </motion.div>
            </div>

            {/* Right CTA */}
            <motion.div variants={itemVariants} className="flex-shrink-0 w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-md mx-auto lg:mx-0">
                <Link
                  href="/register"
                  className="group relative px-8 py-4 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-full transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-2xl flex items-center justify-center gap-3 border border-white/10"
                >
                  <span>Daftar Sekarang</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </Link>

                <Link
                  href="/tentang"
                  className="px-8 py-4 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold rounded-full backdrop-blur-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-center shadow-lg"
                >
                  Pelajari Lebih Lanjut
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
