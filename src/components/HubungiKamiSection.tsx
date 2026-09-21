'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MessageSquare, MapPin, CalendarPlus, Navigation, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';

const DLOB_CALENDAR_URL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Mabar Rutin DLOB Badminton')}&details=${encodeURIComponent('Sesi latihan dan mabar rutin mingguan komunitas DLOB Badminton. Lokasi: GOR Wisma Harapan.')}&location=${encodeURIComponent('GOR Badminton Wisma Harapan, Gembor, Kec. Periuk, Kota Tangerang')}&dates=20260307T130000Z%2F20260307T160000Z&recur=RRULE%3AFREQ%3DWEEKLY%3BBYDAY%3DSA`;
const DLOB_MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=GOR+Badminton+Wisma+Harapan+Gembor+Tangerang';

const DLBC_CALENDAR_URL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Mabar Rutin DLBC Cikupa Badminton')}&details=${encodeURIComponent('Sesi latihan dan mabar rutin mingguan DLBC Cikupa. Lokasi: Lapangan Badminton DLBC Cikupa.')}&location=${encodeURIComponent('Jl. Raya Peusar No.6, Sukamulya, Kec. Cikupa, Kabupaten Tangerang, Banten 15710')}&dates=20260306T130000Z%2F20260306T160000Z&recur=RRULE%3AFREQ%3DWEEKLY%3BBYDAY%3DFR`;
const DLBC_MAPS_URL = 'https://maps.app.goo.gl/329H3C2CTr9BZRDQ9';

export default function HubungiKamiSection() {
  const [activeBranch, setActiveBranch] = useState<'dlob' | 'dlbc'>('dlob');

  return (
    <section className="relative bg-white py-24 md:py-36 overflow-hidden">
      {/* Background subtle radial */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-radial from-[#4382C8]/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center mb-14 max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-950 tracking-tight leading-tight">
            Jadwal Mabar &<br />
            <span className="text-[#4382C8]">Titik Lokasi.</span>
          </h2>
          <p className="text-base text-zinc-600 leading-relaxed">
            Pilih cabang komunitas untuk melihat jadwal operasional, reservasi Google Calendar, dan rute Google Maps.
          </p>

          {/* Precision Branch Switcher */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex items-center p-1.5 rounded-full bg-zinc-100 border border-zinc-200 shadow-inner">
              <button
                onClick={() => setActiveBranch('dlob')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-tight transition-all duration-300 cursor-pointer ${
                  activeBranch === 'dlob'
                    ? 'bg-zinc-950 text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                DLOB Pusat (Wisma Harapan)
              </button>
              <button
                onClick={() => setActiveBranch('dlbc')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-tight transition-all duration-300 cursor-pointer ${
                  activeBranch === 'dlbc'
                    ? 'bg-[#4382C8] text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                DLBC Cikupa (GOR Galaxi)
              </button>
            </div>
          </div>
        </div>

        {/* 3-Card Doppelrand Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">

          {/* CARD 1: JADWAL RUTIN */}
          <div className="doppelrand-shell p-1.5 rounded-[2rem] bg-zinc-100/90 border border-zinc-200/80 hover:shadow-xl transition-all duration-300">
            <div className="h-full p-7 rounded-[calc(2rem-0.375rem)] bg-white flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-[#4382C8]/10 text-[#4382C8] flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700">
                    {activeBranch === 'dlob' ? 'Tangerang' : 'Cikupa'}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-zinc-950 tracking-tight">Jadwal Mabar</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
                    {activeBranch === 'dlob'
                      ? 'Latihan rutin mingguan DLOB Pusat. Terbuka untuk seluruh member dari pemula hingga lanjutan.'
                      : 'Latihan rutin mingguan DLBC Cikupa. Fasilitas lapangan resmi cabang Tangerang Barat.'}
                  </p>
                </div>
              </div>

              {/* Action Box */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-sm text-zinc-950">
                    {activeBranch === 'dlob' ? 'Setiap Sabtu Malam' : 'Setiap Jumat Malam'}
                  </p>
                  <p className="font-mono text-xs text-zinc-500 mt-0.5">20.00 – 23.00 WIB</p>
                </div>
                <a
                  href={activeBranch === 'dlob' ? DLOB_CALENDAR_URL : DLBC_CALENDAR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group shrink-0 p-2.5 bg-zinc-950 hover:bg-[#4382C8] text-white rounded-xl shadow-xs transition-colors flex items-center justify-center"
                  title="Simpan ke Google Calendar"
                >
                  <CalendarPlus className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* CARD 2: GRUP KOMUNITAS WHATSAPP */}
          <div className="doppelrand-shell p-1.5 rounded-[2rem] bg-zinc-100/90 border border-zinc-200/80 hover:shadow-xl transition-all duration-300">
            <div className="h-full p-7 rounded-[calc(2rem-0.375rem)] bg-white flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">
                    50+ Member Aktif
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-zinc-950 tracking-tight">Komunitas WhatsApp</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
                    Dapatkan update kuota mabar mingguan, koordinasi pasangan ganda, info turnamen, dan diskusi santai.
                  </p>
                </div>
              </div>

              {/* Button-in-Button WhatsApp CTA */}
              <a
                href="https://chat.whatsapp.com/G5yBwhgP4nZ4j9Lg8D0b5k"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-2 pl-6 bg-zinc-950 hover:bg-zinc-900 text-white rounded-full font-bold text-xs tracking-tight transition-all duration-300 shadow-md active:scale-[0.98]"
              >
                <span>Masuk Grup WhatsApp</span>
                <div className="btn-nested-icon w-8 h-8 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5 text-white" />
                </div>
              </a>
            </div>
          </div>

          {/* CARD 3: LOKASI LAPANGAN */}
          <div className="doppelrand-shell p-1.5 rounded-[2rem] bg-zinc-100/90 border border-zinc-200/80 hover:shadow-xl transition-all duration-300">
            <div className="h-full p-7 rounded-[calc(2rem-0.375rem)] bg-white flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#4382C8] flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700">
                    Google Maps
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-zinc-950 tracking-tight">Lokasi Lapangan</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
                    {activeBranch === 'dlob'
                      ? 'GOR Badminton Wisma Harapan, Gembor, Periuk, Kota Tangerang.'
                      : 'GOR Galaxi Cikupa, Jl. Raya Peusar No.6, Cikupa, Kab. Tangerang.'}
                  </p>
                </div>
              </div>

              {/* Action Box */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between gap-3">
                <div className="truncate">
                  <p className="font-bold text-sm text-zinc-950 truncate">
                    {activeBranch === 'dlob' ? 'GOR Wisma Harapan' : 'GOR Galaxi Cikupa'}
                  </p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">
                    {activeBranch === 'dlob' ? 'Periuk, Tangerang' : 'Cikupa, Kab. Tangerang'}
                  </p>
                </div>
                <a
                  href={activeBranch === 'dlob' ? DLOB_MAPS_URL : DLBC_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group shrink-0 p-2.5 bg-zinc-950 hover:bg-[#4382C8] text-white rounded-xl shadow-xs transition-colors flex items-center justify-center"
                  title="Buka rute di Google Maps"
                >
                  <Navigation className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
