'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Users, Trophy, Activity, CalendarCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: i * 0.09, 
      duration: 0.7, 
      ease: [0.23, 1, 0.32, 1] as [number, number, number, number] 
    },
  }),
};

export default function FeaturesSection() {
  return (
    <section id="features-section" className="py-24 sm:py-32 md:py-40 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
      {/* Background architectural glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 -right-32 w-[600px] h-[600px] bg-gradient-radial from-[#4382C8]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-radial from-zinc-200/50 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left - Doppelrand Athlete Portrait Container */}
          <motion.div
            className="lg:col-span-5 relative flex justify-center"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Outer Shell (Doppelrand) */}
            <div className="w-full max-w-[420px] p-2 sm:p-2.5 rounded-[2.5rem] bg-zinc-100/90 border border-zinc-200 shadow-2xl shadow-zinc-900/10 backdrop-blur-md">
              {/* Inner Core */}
              <div className="relative aspect-[4/5] rounded-[calc(2.5rem-0.625rem)] overflow-hidden bg-zinc-950 group">
                <Image
                  src="/images/potrait/IMG_7627.JPG"
                  alt="DLOB Official Athlete"
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 100vw, 420px"
                  priority
                />

                {/* Legibility gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />

                {/* Top Badge */}
                <div className="absolute top-4 left-4 inline-flex items-center px-3.5 py-1.5 rounded-full bg-zinc-950/75 backdrop-blur-md border border-white/20 text-white text-xs font-semibold">
                  DLOB Official Community
                </div>

                {/* Glass Tag at Bottom */}
                <div className="absolute bottom-5 inset-x-5 backdrop-blur-xl bg-white/15 border border-white/25 rounded-2xl p-4 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm tracking-tight text-white">
                        Ekosistem Bulu Tangkis
                      </p>
                      <p className="text-[11px] text-zinc-300 font-medium">
                        Tangerang & Cikupa
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right - Architectural Content & Micro-Spec Grid */}
          <motion.div
            className="lg:col-span-7 space-y-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {/* Display Headline */}
            <motion.div custom={0} variants={fadeUp} className="space-y-4">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-950 leading-[1.06] tracking-tight">
                Sistem Terpadu.<br />
                <span className="text-[#4382C8]">Komunitas Aktif.</span>
              </h2>
              <p className="text-zinc-600 text-base sm:text-lg leading-relaxed max-w-xl">
                DLOB Community adalah platform internal mandiri untuk mengelola operasional mabar mingguan, absensi presisi, pencatatan match, dan regenerasi pemain secara terpusat.
              </p>
            </motion.div>

            {/* Micro-Spec Grid (Doppelrand Feature Units) */}
            <motion.div custom={1} variants={fadeUp} className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-1 rounded-2xl bg-zinc-100/80 border border-zinc-200/70">
                <div className="p-4 rounded-[calc(1rem-0.25rem)] bg-white h-full flex flex-col justify-between space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-[#4382C8]/10 text-[#4382C8] flex items-center justify-center">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950">Jadwal & Absensi Instan</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Sistem kehadiran digital dan pemesanan slot mabar rutin tanpa formulir manual.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-1 rounded-2xl bg-zinc-100/80 border border-zinc-200/70">
                <div className="p-4 rounded-[calc(1rem-0.25rem)] bg-white h-full flex flex-col justify-between space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950">Analitik & ELO Match</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Statistik performa, riwayat kemenangan, dan leaderboard kompetitif antar member.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Button-in-Button CTA */}
            <motion.div custom={2} variants={fadeUp} className="pt-2">
              <Link
                href="/tentang"
                className="group inline-flex items-center gap-4 bg-zinc-950 hover:bg-zinc-900 text-white pl-7 pr-3 py-3.5 rounded-full font-bold text-sm tracking-tight transition-all duration-300 shadow-xl shadow-zinc-950/15 hover:shadow-2xl active:scale-[0.98]"
              >
                <span>Pelajari Selengkapnya</span>
                <div className="btn-nested-icon w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#4382C8] transition-colors">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </Link>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
