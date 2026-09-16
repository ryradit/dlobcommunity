'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ExternalLink } from 'lucide-react';

export default function Footer() {
  const [activeBranch, setActiveBranch] = useState<'pusat' | 'cikupa'>('pusat');

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-bold">
                D
              </div>
              <span className="font-bold text-lg">DLOB</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">
              Komunitas badminton terdepan dengan teknologi smart untuk mengelola kehadiran, pertandingan, dan pembayaran secara otomatis.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs">👥</span>
              <p className="text-gray-400 text-xs font-medium">50+ Anggota Aktif</p>
            </div>
          </div>

          {/* Contact Person & Follow Us */}
          <div>
            <h3 className="font-bold mb-6 text-white text-sm">Orang Kontak</h3>
            <ul className="space-y-4 text-xs text-gray-400 mb-6">
              <li>
                <div className="flex items-center gap-2 mb-1">
                  <span>☎️</span>
                  <span className="font-semibold text-white">Admin DLOB Pusat</span>
                </div>
                <a href="tel:+6281270737272" className="hover:text-blue-400 ml-6 block">+62 812-7073-7272</a>
                <a href="tel:+6282230450433" className="hover:text-blue-400 ml-6 block">+62 822-3045-0433</a>
              </li>
              <li>
                <div className="flex items-center gap-2 mb-1">
                  <span>🎾</span>
                  <span className="font-semibold text-amber-400">Admin DLBC Cikupa</span>
                </div>
                <a href="https://wa.me/6282113455696" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 ml-6 block font-medium">
                  Edi: +62 821-1345-5696
                </a>
              </li>
              <li>
                <div className="flex items-center gap-2 mb-1">
                  <span>💬</span>
                  <span className="font-semibold text-white">Grup WhatsApp</span>
                </div>
                <p className="text-gray-400 ml-6">Bergabunglah dengan chat komunitas kami</p>
              </li>
            </ul>
          
            <h4 className="font-bold text-white text-sm mb-4">Ikuti Kami</h4>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span>📷</span>
                <a href="https://www.instagram.com/dlob.channel/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">@dlob.channel</a>
              </div>
              <div className="flex items-center gap-2">
                <span>🎵</span>
                <a href="https://www.tiktok.com/@dlobchannel" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">@dlobchannel</a>
              </div>
              <div className="flex items-center gap-2">
                <span>📺</span>
                <a href="https://www.youtube.com/@dlobchannel" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">@dlobchannel</a>
              </div>
            </div>
          </div>

          {/* Location & Schedule with Dynamic Branch Switcher */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-sm">Lokasi & Jadwal</h3>
            </div>

            {/* Branch Selector Pills */}
            <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl mb-5">
              <button
                onClick={() => setActiveBranch('pusat')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                  activeBranch === 'pusat'
                    ? 'bg-[#4382C8] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                DLOB Pusat
              </button>
              <button
                onClick={() => setActiveBranch('cikupa')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                  activeBranch === 'cikupa'
                    ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>DLBC Cikupa</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </button>
            </div>

            {/* Animated Branch Details */}
            <AnimatePresence mode="wait">
              {activeBranch === 'pusat' ? (
                <motion.div
                  key="pusat-info"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div>
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-base">📍</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-xs">Venue DLOB Pusat</p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">Tangerang</span>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed mt-1">
                          GOR Badminton Wisma Harapan<br />
                          Jl. Wisma Lantana IV No.D07-No 49<br />
                          RT.006/RW.011, Gembor, Periuk<br />
                          Kota Tangerang, Banten 15133
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start gap-2">
                      <span className="text-base">📅</span>
                      <div>
                        <p className="font-bold text-white text-xs">Jadwal Mabar</p>
                        <p className="text-gray-400 text-xs mt-0.5">Setiap Sabtu Malam, 20:00 - 23:00 WIB</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="cikupa-info"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div>
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-base">🎾</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-amber-400 text-xs">GOR Galaxi Cikupa</p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30">Cabang Baru</span>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed mt-1">
                          GOR Galaxi Cikupa<br />
                          Jl. Raya Peusar No.6, Sukamulya<br />
                          Kec. Cikupa, Kab. Tangerang<br />
                          Banten 15710
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start gap-2">
                      <span className="text-base">📅</span>
                      <div>
                        <p className="font-bold text-amber-400 text-xs">Jadwal Mabar DLBC</p>
                        <p className="text-gray-400 text-xs mt-0.5">Setiap Jumat Malam, 20:00 - 23:00 WIB</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Links, Legal & Interactive Map */}
          <div className="flex flex-col">
            <div className="mb-6">
              <h3 className="font-bold mb-3 text-white text-sm">Tautan Cepat</h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><Link href="/tentang" className="hover:text-blue-400 transition-colors">Tentang</Link></li>
                <li><Link href="/hall-of-fame" className="hover:text-blue-400 transition-colors">Hall of Fame</Link></li>
                <li><Link href="/leaderboard" className="hover:text-blue-400 transition-colors">Leaderboard 🏆</Link></li>
                <li><Link href="/galeri" className="hover:text-blue-400 transition-colors">Galeri</Link></li>
                <li><Link href="/store" className="hover:text-blue-400 transition-colors">Toko</Link></li>
                <li><Link href="/survey" className="hover:text-blue-400 transition-colors">Survey Member 📣</Link></li>
                <li>
                  <Link href="/api/health" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 text-zinc-300">
                    <span>Status API &amp; Sistem</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="mb-6">
              <h4 className="font-bold text-white text-sm mb-3">Hukum</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><Link href="/syarat-layanan" className="hover:text-blue-400 transition-colors">Syarat & Ketentuan</Link></li>
                <li><Link href="/kebijakan-privasi" className="hover:text-blue-400 transition-colors">Kebijakan Privasi</Link></li>
              </ul>
            </div>

            {/* Map Section with Interactive Switcher */}
            <div className="pt-6 border-t border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#4382C8]" />
                  <span>Peta Lokasi</span>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    ({activeBranch === 'pusat' ? 'DLOB Pusat' : 'GOR Galaxi Cikupa'})
                  </span>
                </h4>

                <a
                  href={
                    activeBranch === 'pusat'
                      ? 'https://www.google.com/maps/search/?api=1&query=GOR+Badminton+Wisma+Harapan+Gembor+Tangerang'
                      : 'https://www.google.com/maps/search/?api=1&query=GOR+Galaxi+Cikupa+Jl+Raya+Peusar+No+6+Sukamulya+Cikupa'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Animated Map Frame */}
              <div className="rounded-2xl overflow-hidden h-44 w-full border border-zinc-800 relative bg-zinc-900 shadow-xl">
                <AnimatePresence mode="wait">
                  {activeBranch === 'pusat' ? (
                    <motion.div
                      key="pusat-map"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full"
                    >
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d31733.426831021552!2d106.581261!3d-6.1738!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ffa7e2cd5549%3A0x15c214ab8b458bf3!2sGOR%20Badminton%20Wisma%20Harapan!5e0!3m2!1sen!2sid!4v1769684366841!5m2!1sen!2sid"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={true}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Map GOR Wisma Harapan DLOB Pusat"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="cikupa-map"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full"
                    >
                      <iframe
                        src="https://maps.google.com/maps?q=GOR%20Galaxi%20Cikupa%20Jl.%20Raya%20Peusar%20No.6%20Sukamulya%20Cikupa&t=&z=16&ie=UTF8&iwloc=&output=embed"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={true}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Map GOR Galaxi Cikupa"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-800 my-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
          <p>&copy; 2025 DLOB Community. Semua hak dilindungi.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/syarat-layanan" className="hover:text-blue-400 transition-colors">Syarat & Ketentuan</Link>
            <span>|</span>
            <Link href="/kebijakan-privasi" className="hover:text-blue-400 transition-colors">Kebijakan Privasi</Link>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 mt-6 flex items-center justify-center gap-2">
          <span>Didukung oleh AI & Teknologi Pintar</span>
          <span>•</span>
          <Link href="/api/health" className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors text-gray-400">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>Status Sistem &amp; API</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
