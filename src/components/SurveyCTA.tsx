'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Megaphone } from 'lucide-react';

export default function SurveyCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/30"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#4382C8] via-[#356ca8] to-[#1d4573]" />
        <div className="absolute inset-0 bg-white/10 backdrop-blur-md" />

        {/* Animated floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"
            animate={{ y: [0, 16, 0], x: [0, 8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-10 right-20 w-64 h-64 bg-white/5 rounded-full blur-2xl"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
          {/* Animated particle dots */}
          {[...Array(6)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-white/40"
              style={{ top: `${20 + i * 12}%`, left: `${10 + i * 14}%` }}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -8, 0] }}
              transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>

        {/* Pulsing glow ring behind the badge */}
        <div className="absolute top-1/2 left-8 -translate-y-1/2 pointer-events-none">
          <motion.div
            className="w-14 h-14 rounded-full border-2 border-white/30"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        </div>

        {/* Content */}
        <div className="relative px-6 py-8 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-white">
          <div className="flex items-center gap-5">
            <motion.div
              className="shrink-0 w-12 h-12 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center shadow-lg"
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Megaphone className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <p className="text-blue-100 text-sm font-semibold mb-0.5">Suara kamu penting 🏸</p>
              <h2 className="text-white text-xl md:text-2xl font-bold leading-snug">
                Bantu DLOB berkembang — ikut survey komunitas
              </h2>
              <p className="text-white/75 text-sm mt-1">
                5–10 menit · anonim boleh · pertanyaan adaptif
              </p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/survey"
              className="shrink-0 bg-zinc-950 hover:bg-zinc-800 text-white font-bold px-8 py-3.5 rounded-full text-sm shadow-xl border border-white/10 transition-colors whitespace-nowrap"
            >
              Isi Survey Sekarang →
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
