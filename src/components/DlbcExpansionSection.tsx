'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  ExternalLink, 
  Navigation,
  ChevronRight,
  ChevronLeft,
  Phone,
  MessageCircle,
  Sparkles
} from 'lucide-react';

export default function DlbcExpansionSection() {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="fixed left-0 top-[68%] sm:top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* ─────────────────────────────────────────────────────────────
              MINIMIZED HANGING TAB (Engineered Hardware Tab / Dynamic Island)
          ───────────────────────────────────────────────────────────── */
          <motion.div
            key="minimized-tab"
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="flex items-center"
          >
            <button
              onClick={() => setIsExpanded(true)}
              className="group flex items-center gap-3 p-1.5 pl-2 pr-4 bg-zinc-950/90 hover:bg-zinc-950 text-white backdrop-blur-xl border-y border-r border-white/15 rounded-r-2xl shadow-2xl shadow-black/40 transition-all cursor-pointer hover:pl-3.5 active:scale-[0.98]"
              title="Buka info cabang DLBC Cikupa"
            >
              {/* Badge */}
              <div className="relative flex items-center justify-center px-2.5 py-1 rounded-xl bg-gradient-to-br from-[#4382C8] to-[#255f9e] text-white font-black text-[11px] tracking-wider shrink-0 shadow-sm border border-white/20">
                <span>DLBC</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
              </div>

              {/* Text Descriptor */}
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-semibold">
                    Cabang Baru
                  </span>
                  <span className="text-xs font-bold text-white">
                    Cikupa
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium leading-none mt-0.5">
                  Jumat 20:00 WIB
                </p>
              </div>

              <span className="sm:hidden text-xs font-bold text-white">
                DLBC Cikupa
              </span>

              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#4382C8] transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </motion.div>
        ) : (
          /* ─────────────────────────────────────────────────────────────
              EXPANDED FLOATING CARD (Doppelrand Double-Bezel Hardware Frame)
          ───────────────────────────────────────────────────────────── */
          <motion.div
            key="expanded-card"
            initial={{ x: -340, opacity: 0, scale: 0.96 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -340, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="ml-2 sm:ml-4 max-w-[340px] sm:max-w-[370px] w-full p-1.5 rounded-[2rem] bg-zinc-950/20 backdrop-blur-2xl border border-white/15 shadow-2xl"
          >
            <div className="bg-white rounded-[calc(2rem-0.375rem)] overflow-hidden shadow-xl border border-zinc-200/80 text-zinc-900">
              {/* Header Bar */}
              <div className="bg-zinc-950 px-4 py-3.5 text-white flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider bg-gradient-to-r from-[#4382C8] to-[#2b68a8] text-white border border-white/20">
                    DLBC CIKUPA
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    Cabang Resmi DLOB
                  </span>
                </div>

                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer px-2"
                  title="Tutup card"
                >
                  <span>Tutup</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Media Image Banner */}
              <div className="aspect-[16/9] relative bg-zinc-950 overflow-hidden group">
                <Image
                  src="/images/dlbc.jpeg"
                  alt="DLBC Cikupa Badminton"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
                <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                  <h4 className="font-extrabold text-sm text-white drop-shadow-sm tracking-tight">
                    Mabar Rutin Badminton Cikupa
                  </h4>
                  <p className="text-[11px] text-zinc-300 font-medium flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#4382C8] shrink-0" />
                    <span className="truncate">GOR Galaxi, Jl. Raya Peusar No.6, Cikupa</span>
                  </p>
                </div>
              </div>

              {/* Content Details */}
              <div className="p-4 sm:p-5 space-y-3.5 bg-zinc-50/50">
                <p className="text-xs text-zinc-600 leading-relaxed">
                  DLOB resmi membuka cabang Cikupa untuk memfasilitasi mabar rutin badminton di area Tangerang Barat & sekitarnya.
                </p>

                {/* Info Card Container */}
                <div className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#4382C8]" /> Jadwal Rutin
                    </span>
                    <span className="font-bold text-zinc-900">Setiap Jumat Malam</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-zinc-500 border-t border-zinc-100 pt-2">
                    <span>Waktu</span>
                    <span className="font-mono font-bold text-zinc-900">20.00 – 23.00 WIB</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-zinc-500 border-t border-zinc-100 pt-2">
                    <span>Admin Cabang</span>
                    <a
                      href="https://wa.me/6282113455696?text=Halo%20Mas%20Edi,%20saya%20mau%20tanya%20info%20mabar%20DLBC%20Cikupa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#4382C8] hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      Edi (+62 821-1345-5696)
                    </a>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-zinc-500 border-t border-zinc-100 pt-2">
                    <span>Sistem App</span>
                    <span className="font-semibold text-zinc-800">Terkoneksi Rank & Statistik DLOB</span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="pt-1 flex flex-col gap-2">
                  <a
                    href="https://wa.me/6282113455696?text=Halo%20Mas%20Edi,%20saya%20mau%20tanya%20info%20mabar%20DLBC%20Cikupa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group w-full py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-full shadow-md transition-all flex items-center justify-between cursor-pointer active:scale-[0.98]"
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Hubungi Admin DLBC (Edi)</span>
                    </span>
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <ExternalLink className="w-2.5 h-2.5 text-white" />
                    </div>
                  </a>

                  <a
                    href="https://maps.app.goo.gl/329H3C2CTr9BZRDQ9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group w-full py-2.5 px-4 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200 font-bold text-xs rounded-full shadow-xs transition-all flex items-center justify-between cursor-pointer active:scale-[0.98]"
                  >
                    <span className="flex items-center gap-2">
                      <Navigation className="w-3.5 h-3.5 text-[#4382C8]" />
                      <span>Petunjuk Arah Google Maps</span>
                    </span>
                    <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                      <ExternalLink className="w-2.5 h-2.5 text-zinc-700" />
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
