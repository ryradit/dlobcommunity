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
  MessageCircle
} from 'lucide-react';

export default function DlbcExpansionSection() {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-auto">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* ─────────────────────────────────────────────────────────────
              MINIMIZED HANGING TAB (Fixed on Left Edge, Always Available)
          ───────────────────────────────────────────────────────────── */
          <motion.div
            key="minimized-tab"
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-center"
          >
            <button
              onClick={() => setIsExpanded(true)}
              className="group flex items-center gap-2.5 py-3 pl-3.5 pr-4 bg-gradient-to-r from-[#4382C8] via-[#3571b2] to-[#1c4573] text-white border-y border-r border-[#4382C8]/40 rounded-r-2xl shadow-xl shadow-[#4382C8]/25 hover:from-[#3571b2] hover:to-[#163860] transition-all cursor-pointer hover:pl-5 active:scale-95"
              title="Klik untuk membuka detail DLBC Cikupa"
            >
              {/* DLBC Text Badge */}
              <div className="relative flex items-center justify-center px-2.5 py-1 rounded-xl bg-amber-400 text-zinc-950 font-black text-xs group-hover:scale-105 transition-transform shrink-0 border border-amber-300 shadow-sm">
                <span>DLBC</span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-300 rounded-full animate-ping" />
              </div>

              {/* Text Tagline */}
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-white/20 text-white uppercase tracking-wider border border-white/30">
                    Cabang Baru!
                  </span>
                  <span className="text-xs font-bold text-white/90">
                    Cikupa
                  </span>
                </div>
                <p className="text-[11px] text-white/90 font-medium leading-none mt-1">
                  Jumat 20:00 WIB • Klik detail ➔
                </p>
              </div>

              {/* Vertical Mobile Label */}
              <span className="sm:hidden text-xs font-bold text-white">
                DLBC Cikupa
              </span>

              <ChevronRight className="w-4 h-4 text-white/90 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ) : (
          /* ─────────────────────────────────────────────────────────────
              EXPANDED FLOATING CARD (Can be Minimized Anytime)
          ───────────────────────────────────────────────────────────── */
          <motion.div
            key="expanded-card"
            initial={{ x: -320, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -320, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="ml-2 sm:ml-4 max-w-[340px] sm:max-w-[380px] w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#4382C8]/30 relative text-gray-900"
          >
            {/* Top Header Bar */}
            <div className="bg-gradient-to-r from-[#4382C8] to-[#1c4573] p-4 text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-400 text-zinc-950 shadow-sm">
                  DLBC Cikupa
                </span>
                <span className="text-xs text-white/90 font-semibold">
                  Cabang Resmi DLOB
                </span>
              </div>

              {/* Minimize Button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold px-2.5 bg-white/10 border border-white/20"
                title="Kecilkan widget"
              >
                <span>Kecilkan</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Media Image Banner */}
            <div className="aspect-[16/9] relative bg-slate-950 overflow-hidden">
              <Image
                src="/images/dlbc.jpeg"
                alt="DLBC Cikupa Badminton"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h4 className="font-black text-sm text-white drop-shadow-sm">
                  Mabar Rutin Badminton Cikupa
                </h4>
                <p className="text-[11px] text-amber-300 font-medium flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>GOR Galaxi, Jl. Raya Peusar No.6, Cikupa</span>
                </p>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 sm:p-5 space-y-3.5 bg-slate-50/50">
              <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <p className="font-medium text-slate-800">
                  DLOB melebarkan sayap ke Cikupa untuk memfasilitasi mabar rutin bagi teman-teman di Cikupa & sekitarnya.
                </p>

                {/* Quick Info Pills */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#4382C8]" /> Jadwal Rutin
                    </span>
                    <span className="font-black text-[#4382C8]">Setiap Jumat Malam</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
                    <span>Waktu</span>
                    <span className="font-bold text-slate-800">20.00 – 23.00 WIB</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
                    <span>Kontak Admin</span>
                    <a
                      href="https://wa.me/6282113455696?text=Halo%20Mas%20Edi,%20saya%20mau%20tanya%20info%20mabar%20DLBC%20Cikupa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-amber-700 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      Edi (+62 821-1345-5696)
                    </a>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
                    <span>Integrasi App</span>
                    <span className="font-bold text-[#4382C8]">Statistik & Rank DLOB</span>
                  </div>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="pt-1 flex flex-col gap-2">
                <a
                  href="https://wa.me/6282113455696?text=Halo%20Mas%20Edi,%20saya%20mau%20tanya%20info%20mabar%20DLBC%20Cikupa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
                  <span>Hubungi Edi (Admin DLBC)</span>
                  <ExternalLink className="w-3 h-3 text-white/80" />
                </a>

                <a
                  href="https://maps.app.goo.gl/329H3C2CTr9BZRDQ9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-[#4382C8] hover:bg-[#346da9] active:scale-95 text-white font-bold text-xs rounded-full shadow-md shadow-[#4382C8]/20 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
                  <span>Buka Petunjuk Maps</span>
                  <ExternalLink className="w-3 h-3 text-white/80" />
                </a>

                <div className="flex items-center justify-end text-[11px] pt-1 px-1">
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-slate-500 hover:text-slate-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Kecilkan Widget</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
