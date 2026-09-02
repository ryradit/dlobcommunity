'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, MessageCircle, MapPin, CalendarPlus, Navigation } from 'lucide-react';

const GOOGLE_CALENDAR_URL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Mabar Rutin DLOB Badminton')}&details=${encodeURIComponent('Sesi latihan dan mabar rutin mingguan komunitas DLOB Badminton. Lokasi: GOR Wisma Harapan.')}&location=${encodeURIComponent('GOR Badminton Wisma Harapan, Gembor, Kec. Periuk, Kota Tangerang')}&dates=20260307T130000Z%2F20260307T160000Z&recur=RRULE%3AFREQ%3DWEEKLY%3BBYDAY%3DSA`;
const GOOGLE_MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=GOR+Badminton+Wisma+Harapan+Gembor+Tangerang';

const CARDS = [
  {
    icon: Calendar,
    emoji: '📅',
    title: 'Jadwal Rutin',
    description: 'Latihan bersama dan mabar rutin mingguan. Terbuka untuk seluruh member dari pemula hingga mahir.',
    footer: (
      <div className="bg-[#4382C8]/10 rounded-2xl p-4 border border-[#4382C8]/20 flex items-center justify-between gap-3">
        <div>
          <p className="text-[#4382C8] text-sm font-bold">Setiap Sabtu Malam</p>
          <p className="text-gray-500 text-xs mt-0.5">20.00 – 23.00 WIB</p>
        </div>
        <a
          href={GOOGLE_CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Tambah ke Google Calendar"
          className="shrink-0 p-2.5 bg-white hover:bg-[#4382C8] text-[#4382C8] hover:text-white rounded-xl border border-[#4382C8]/30 shadow-sm transition-all hover:scale-105 active:scale-95 group"
          aria-label="Tambah ke Google Calendar"
        >
          <CalendarPlus className="w-4 h-4 transition-transform group-hover:scale-110" />
        </a>
      </div>
    ),
  },
  {
    icon: MessageCircle,
    emoji: '💬',
    title: 'Grup WhatsApp',
    description: 'Dapatkan info jadwal terbaru, koordinasi match, dan ngobrol seru dengan 200+ member lainnya.',
    footer: (
      <a
        href="https://chat.whatsapp.com/G5yBwhgP4nZ4j9Lg8D0b5k"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-full text-center transition-colors shadow-md text-sm"
      >
        Bergabung Sekarang
      </a>
    ),
  },
  {
    icon: MapPin,
    emoji: '📍',
    title: 'Lokasi Lapangan',
    description: 'GOR Badminton Wisma Harapan, Gembor, Kec. Periuk, Kota Tangerang. Fasilitas lengkap dengan lapangan berstandar internasional.',
    footer: (
      <div className="bg-[#4382C8]/10 rounded-2xl p-4 border border-[#4382C8]/20 flex items-center justify-between gap-3">
        <div>
          <p className="text-[#4382C8] text-sm font-bold">GOR Wisma Harapan</p>
          <p className="text-gray-500 text-xs mt-0.5">Tangerang, Banten</p>
        </div>
        <a
          href={GOOGLE_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Buka di Google Maps"
          className="shrink-0 p-2.5 bg-white hover:bg-[#4382C8] text-[#4382C8] hover:text-white rounded-xl border border-[#4382C8]/30 shadow-sm transition-all hover:scale-105 active:scale-95 group"
          aria-label="Buka di Google Maps"
        >
          <Navigation className="w-4 h-4 transition-transform group-hover:scale-110" />
        </a>
      </div>
    ),
  },
];

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
          className="absolute bottom-20 right-1/4 w-80 h-80 bg-[#4382C8]/6 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 md:mb-20"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4382C8] mb-4">
            <span className="w-6 h-[2px] bg-[#4382C8]" />
            Hubungi Kami
            <span className="w-6 h-[2px] bg-[#4382C8]" />
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Mari Bergabung<br className="sm:hidden" /> Bersama DLOB
          </h2>
          <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Tertarik bergabung dengan komunitas badminton kami? Punya pertanyaan? Kami siap mendengar dari Anda!
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 md:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          style={{ perspective: 800 }}
        >
          {CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              variants={cardAnim}
              className="group relative h-full"
            >
              {/* Blue glow border on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#4382C8] to-[#1c4573] rounded-3xl transform group-hover:scale-[1.03] transition-transform duration-300 -z-10 shadow-xl opacity-90" />

              <motion.div
                className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 h-full flex flex-col shadow-md border border-white/60"
                whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
              >
                {/* Icon with animated bounce on hover */}
                <motion.div
                  className="text-5xl mb-5 w-fit"
                  whileHover={{ scale: 1.2, rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}
                >
                  {card.emoji}
                </motion.div>

                <h3 className="text-xl font-black text-gray-900 mb-3">{card.title}</h3>
                <p className="text-gray-500 text-sm mb-6 grow leading-relaxed">{card.description}</p>
                {card.footer}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
