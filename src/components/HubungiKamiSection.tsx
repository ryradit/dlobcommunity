'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MessageCircle, MapPin, CalendarPlus, Navigation, RefreshCw } from 'lucide-react';

const DLOB_CALENDAR_URL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Mabar Rutin DLOB Badminton')}&details=${encodeURIComponent('Sesi latihan dan mabar rutin mingguan komunitas DLOB Badminton. Lokasi: GOR Wisma Harapan.')}&location=${encodeURIComponent('GOR Badminton Wisma Harapan, Gembor, Kec. Periuk, Kota Tangerang')}&dates=20260307T130000Z%2F20260307T160000Z&recur=RRULE%3AFREQ%3DWEEKLY%3BBYDAY%3DSA`;
const DLOB_MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=GOR+Badminton+Wisma+Harapan+Gembor+Tangerang';

const DLBC_CALENDAR_URL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Mabar Rutin DLBC Cikupa Badminton')}&details=${encodeURIComponent('Sesi latihan dan mabar rutin mingguan DLBC Cikupa. Lokasi: Lapangan Badminton DLBC Cikupa.')}&location=${encodeURIComponent('Jl. Raya Peusar No.6, Sukamulya, Kec. Cikupa, Kabupaten Tangerang, Banten 15710')}&dates=20260306T130000Z%2F20260306T160000Z&recur=RRULE%3AFREQ%3DWEEKLY%3BBYDAY%3DFR`;
const DLBC_MAPS_URL = 'https://maps.app.goo.gl/329H3C2CTr9BZRDQ9';

interface FlippableCardProps {
  emoji: string;
  frontTitle: string;
  frontBranch: string;
  frontDescription: string;
  frontFooter: React.ReactNode;
  backTitle: string;
  backBranch: string;
  backDescription: string;
  backFooter: React.ReactNode;
  isFlipped: boolean;
  onToggleFlip: () => void;
}

function FlippableCard({
  emoji,
  frontTitle,
  frontBranch,
  frontDescription,
  frontFooter,
  backTitle,
  backBranch,
  backDescription,
  backFooter,
  isFlipped,
  onToggleFlip,
}: FlippableCardProps) {
  return (
    <div className="relative w-full h-[400px] [perspective:1000px] group">
      {/* Glow border container */}
      <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 rounded-3xl transform group-hover:scale-[1.02] -z-10 shadow-xl ${
        isFlipped 
          ? 'from-amber-500 to-amber-700 opacity-95' 
          : 'from-[#4382C8] to-[#1c4573] opacity-90'
      }`} />

      <motion.div
        className="relative w-full h-full [transform-style:preserve-3d]"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* FRONT SIDE (DLOB) */}
        <div
          className="absolute inset-0 w-full h-full bg-white/95 backdrop-blur-xl rounded-3xl p-7 flex flex-col justify-between shadow-md border border-white/60 [backface-visibility:hidden]"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">{emoji}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFlip();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4382C8]/10 hover:bg-[#4382C8]/20 text-[#4382C8] rounded-full text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 border border-[#4382C8]/20"
                title="Putar ke DLBC Cikupa"
              >
                <span>{frontBranch}</span>
                <RefreshCw className="w-3 h-3 text-[#4382C8] animate-spin-hover" />
                <span className="text-[10px] text-slate-400 font-normal">➔ {backBranch}</span>
              </button>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">{frontTitle}</h3>
            <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{frontDescription}</p>
          </div>

          <div>{frontFooter}</div>
        </div>

        {/* BACK SIDE (DLBC - DLOB Blue & Golden Amber Accent) */}
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#4382C8] via-[#326fb5] to-[#1c4573] text-white backdrop-blur-xl rounded-3xl p-7 flex flex-col justify-between shadow-xl border border-white/20 [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">{emoji}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFlip();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 text-zinc-950 hover:bg-amber-500 rounded-full text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-md border border-amber-300"
                title="Putar ke DLOB Pusat"
              >
                <span>{backBranch}</span>
                <RefreshCw className="w-3 h-3 text-zinc-950" />
                <span className="text-[10px] text-zinc-800 font-semibold">➔ {frontBranch}</span>
              </button>
            </div>
            <h3 className="text-xl font-black text-white mb-2">{backTitle}</h3>
            <p className="text-white/90 text-xs sm:text-sm leading-relaxed">{backDescription}</p>
          </div>

          <div>{backFooter}</div>
        </div>
      </motion.div>
    </div>
  );
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const cardAnim = {
  hidden: { opacity: 0, y: 48, rotateX: 8 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { type: 'spring' as const, stiffness: 90, damping: 16 },
  },
};

export default function HubungiKamiSection() {
  const [scheduleFlipped, setScheduleFlipped] = useState(false);
  const [locationFlipped, setLocationFlipped] = useState(false);
  const [globalBranch, setGlobalBranch] = useState<'dlob' | 'dlbc'>('dlob');

  const handleGlobalBranchChange = (branch: 'dlob' | 'dlbc') => {
    setGlobalBranch(branch);
    const flipState = branch === 'dlbc';
    setScheduleFlipped(flipState);
    setLocationFlipped(flipState);
  };

  return (
    <section className="relative bg-gradient-to-b from-white to-gray-50 py-24 md:py-32 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-1/4 w-96 h-96 bg-[#4382C8]/8 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 right-1/4 w-80 h-80 bg-amber-500/8 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4382C8] mb-4">
            <span className="w-6 h-[2px] bg-[#4382C8]" />
            Hubungi Kami & Jadwal
            <span className="w-6 h-[2px] bg-[#4382C8]" />
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Mari Bergabung<br className="sm:hidden" /> Bersama Komunitas
          </h2>
          <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Pilih cabang komunitas atau klik tombol <span className="font-semibold text-slate-800">Putar Card 🔄</span> pada kartu di bawah untuk berpindah info antara DLOB Pusat & DLBC Cikupa.
          </p>

          {/* Global Branch Toggle Selector */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-1 bg-slate-200/80 p-1.5 rounded-full border border-slate-300 shadow-inner">
              <button
                onClick={() => handleGlobalBranchChange('dlob')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${
                  globalBranch === 'dlob'
                    ? 'bg-[#4382C8] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏸 DLOB Pusat (Wisma Harapan)
              </button>
              <button
                onClick={() => handleGlobalBranchChange('dlbc')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${
                  globalBranch === 'dlbc'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏸 DLBC Cikupa (Jl. Peusar)
              </button>
            </div>
          </div>
        </motion.div>

        {/* Cards Container */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 md:gap-8 items-stretch"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {/* 1. JADWAL RUTIN (FLIPPABLE) */}
          <motion.div variants={cardAnim}>
            <FlippableCard
              emoji="📅"
              frontTitle="Jadwal Rutin"
              frontBranch="DLOB Pusat"
              frontDescription="Latihan bersama dan mabar rutin mingguan DLOB Pusat. Terbuka untuk seluruh member dari pemula hingga mahir."
              frontFooter={
                <div className="bg-[#4382C8]/10 rounded-2xl p-4 border border-[#4382C8]/20 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[#4382C8] text-sm font-bold">Setiap Sabtu Malam</p>
                    <p className="text-gray-500 text-xs mt-0.5">20.00 – 23.00 WIB</p>
                  </div>
                  <a
                    href={DLOB_CALENDAR_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Tambah ke Google Calendar"
                    className="shrink-0 p-2.5 bg-white hover:bg-[#4382C8] text-[#4382C8] hover:text-white rounded-xl border border-[#4382C8]/30 shadow-sm transition-all hover:scale-105 active:scale-95 group"
                  >
                    <CalendarPlus className="w-4 h-4" />
                  </a>
                </div>
              }
              backTitle="Jadwal Rutin"
              backBranch="DLBC Cikupa"
              backDescription="Latihan bersama dan mabar rutin mingguan DLBC Cikupa. Terbuka untuk seluruh pemain area Cikupa & sekitarnya."
              backFooter={
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/25 flex items-center justify-between gap-3 text-white">
                  <div>
                    <p className="text-amber-300 text-sm font-extrabold">Setiap Jumat Malam</p>
                    <p className="text-white/80 text-xs mt-0.5">20.00 – 23.00 WIB</p>
                  </div>
                  <a
                    href={DLBC_CALENDAR_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Tambah ke Google Calendar"
                    className="shrink-0 p-2.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
                  >
                    <CalendarPlus className="w-4 h-4" />
                  </a>
                </div>
              }
              isFlipped={scheduleFlipped}
              onToggleFlip={() => setScheduleFlipped(!scheduleFlipped)}
            />
          </motion.div>

          {/* 2. GRUP WHATSAPP (STANDARD CARD) */}
          <motion.div variants={cardAnim} className="group relative h-[400px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4382C8] to-[#1c4573] rounded-3xl transform group-hover:scale-[1.02] transition-transform duration-300 -z-10 shadow-xl opacity-90" />
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-7 h-full flex flex-col justify-between shadow-md border border-white/60">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">💬</span>
                  <span className="px-3 py-1 bg-green-500/10 text-green-700 border border-green-500/20 rounded-full text-xs font-bold">
                    Komunitas
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Grup WhatsApp</h3>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                  Dapatkan info jadwal terbaru, koordinasi match, slot mabar, dan ngobrol seru bersama 200+ member aktif lainnya.
                </p>
              </div>

              <a
                href="https://chat.whatsapp.com/G5yBwhgP4nZ4j9Lg8D0b5k"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-full text-center transition-all shadow-md text-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                Bergabung Sekarang
              </a>
            </div>
          </motion.div>

          {/* 3. LOKASI LAPANGAN (FLIPPABLE) */}
          <motion.div variants={cardAnim}>
            <FlippableCard
              emoji="📍"
              frontTitle="Lokasi Lapangan"
              frontBranch="DLOB Pusat"
              frontDescription="GOR Badminton Wisma Harapan, Gembor, Kec. Periuk, Kota Tangerang. Lapangan berstandar internasional dengan fasilitas lengkap."
              frontFooter={
                <div className="bg-[#4382C8]/10 rounded-2xl p-4 border border-[#4382C8]/20 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[#4382C8] text-sm font-bold">GOR Wisma Harapan</p>
                    <p className="text-gray-500 text-xs mt-0.5">Tangerang, Banten</p>
                  </div>
                  <a
                    href={DLOB_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Buka di Google Maps"
                    className="shrink-0 p-2.5 bg-white hover:bg-[#4382C8] text-[#4382C8] hover:text-white rounded-xl border border-[#4382C8]/30 shadow-sm transition-all hover:scale-105 active:scale-95 group"
                  >
                    <Navigation className="w-4 h-4" />
                  </a>
                </div>
              }
              backTitle="Lokasi Lapangan"
              backBranch="DLBC Cikupa"
              backDescription="GOR Galaxi Cikupa, Jl. Raya Peusar No.6, Sukamulya, Kec. Cikupa, Kabupaten Tangerang, Banten 15710. Lokasi mabar rutin cabang DLBC."
              backFooter={
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/25 flex items-center justify-between gap-3 text-white">
                  <div>
                    <p className="text-amber-300 text-sm font-extrabold truncate max-w-[150px]">GOR Galaxi Cikupa</p>
                    <p className="text-white/80 text-xs mt-0.5">Cikupa, Tangerang</p>
                  </div>
                  <a
                    href={DLBC_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Buka di Google Maps"
                    className="shrink-0 p-2.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
                  >
                    <Navigation className="w-4 h-4" />
                  </a>
                </div>
              }
              isFlipped={locationFlipped}
              onToggleFlip={() => setLocationFlipped(!locationFlipped)}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
