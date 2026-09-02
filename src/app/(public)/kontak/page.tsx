'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Send, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function KontakPage() {
  const [formData, setFormData] = useState({ nama: '', email: '', pesan: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.nama,
          email: formData.email,
          message: formData.pesan,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim pesan');
      }

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      setFormData({ nama: '', email: '', pesan: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Lokasi Lapangan',
      value: 'GOR Wisma Harapan',
      detail: 'Jl. Wisma Lantana IV, Gembor, Kec. Periuk, Kota Tangerang',
    },
    {
      icon: Phone,
      title: 'WhatsApp Admin',
      value: '+62 812-7073-7272',
      detail: 'Respon cepat untuk info jadwal & pendaftaran',
    },
    {
      icon: Mail,
      title: 'Email Resmi',
      value: 'support@dlobcommunity.com',
      detail: 'Pertanyaan umum & kemitraan komunitas',
    },
    {
      icon: Clock,
      title: 'Jadwal Mabar',
      value: 'Setiap Sabtu Malam',
      detail: '20:00 – 23:00 WIB (GOR Wisma Harapan)',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100, damping: 16 },
    },
  };

  return (
    <main className="min-h-screen bg-white">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-14 md:pt-40 md:pb-18 bg-gradient-to-b from-slate-50 to-white border-b border-gray-100 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-[#4382C8]/10 to-transparent rounded-full translate-x-1/3 -translate-y-1/4 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4382C8] mb-3">
              <MessageSquare className="w-3.5 h-3.5" />
              Hubungi Kami
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
              Mari Terhubung<br />
              <span className="text-[#4382C8]">Bersama DLOB</span>
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
              Tertarik bergabung dengan jadwal mabar rutin atau punya pertanyaan tentang komunitas? Kami siap menyambut Anda.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. CONTACT INFO CARDS
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
          >
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-md hover:shadow-xl hover:border-[#4382C8]/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="mb-5 inline-flex p-3 bg-[#4382C8]/10 rounded-2xl text-[#4382C8]">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{info.title}</h3>
                    <p className="text-[#4382C8] font-extrabold text-base mb-2">{info.value}</p>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">{info.detail}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
              3. CONTACT FORM & INFO SPLIT
          ───────────────────────────────────────────────────────────── */}
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            
            {/* Left: Contact Form (7 Cols) */}
            <div className="lg:col-span-7">
              <div className="bg-slate-50 rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-black text-gray-900 mb-2">Kirim Pesan</h2>
                <p className="text-slate-500 text-sm mb-8">Admin kami akan merespon pertanyaan Anda secepatnya.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      name="nama"
                      value={formData.nama}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:border-[#4382C8] focus:ring-2 focus:ring-[#4382C8]/20 focus:outline-none transition-all placeholder-slate-400"
                      placeholder="Nama Anda"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:border-[#4382C8] focus:ring-2 focus:ring-[#4382C8]/20 focus:outline-none transition-all placeholder-slate-400"
                      placeholder="email@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                      Pesan atau Pertanyaan
                    </label>
                    <textarea
                      name="pesan"
                      value={formData.pesan}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:border-[#4382C8] focus:ring-2 focus:ring-[#4382C8]/20 focus:outline-none transition-all placeholder-slate-400 resize-none"
                      placeholder="Tulis pesan atau pertanyaan Anda seputar jadwal mabar, dll..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold py-3.5 rounded-full shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? 'Mengirim...' : 'Kirim Pesan'}
                  </button>

                  {submitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-xs font-semibold flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      Pesan berhasil dikirim! Admin akan segera menghubungi Anda.
                    </motion.div>
                  )}

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-semibold">
                      {error}
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Right: Quick Highlights (5 Cols) */}
            <div className="lg:col-span-5 space-y-8 lg:pt-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-3">Keuntungan Bergabung di DLOB</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Kami menyambut setiap pemain bulu tangkis — baik pemula maupun mahir — untuk berolahraga dengan suasana yang suportif.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { title: 'Jadwal Mingguan Rutin', desc: 'Sesi latihan dan sparring rutin setiap minggu di GOR berstandar.' },
                  { title: 'Pencatatan Skor & Leaderboard', desc: 'Statistik match terekam rapi untuk memantau performa permainan.' },
                  { title: 'Komunitas Ramah & Solid', desc: 'Tempat bertukar wawasan, teknik smash, dan relasi pertemanan.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-[#4382C8] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp direct card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#4382C8]/10 to-transparent border border-[#4382C8]/20 space-y-3">
                <p className="text-xs font-bold text-[#4382C8] uppercase tracking-wide">Koordinasi Langsung</p>
                <p className="text-sm font-bold text-gray-900 leading-snug">
                  Ingin gabung grup WhatsApp mabar DLOB sekarang?
                </p>
                <a
                  href="https://chat.whatsapp.com/G5yBwhgP4nZ4j9Lg8D0b5k"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-zinc-950 hover:text-[#4382C8] underline underline-offset-4 transition-colors"
                >
                  Gabung Grup WhatsApp →
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. CTA BOTTOM
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 text-center p-10 sm:p-14">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4382C8] via-[#2f6fae] to-[#1b4372]" />
          <div className="absolute inset-0 bg-white/10 backdrop-blur-md" />

          <div className="relative text-white max-w-xl mx-auto space-y-5">
            <h2 className="text-3xl sm:text-4xl font-black leading-tight drop-shadow-sm">
              Sampai Jumpa di Lapangan!
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Siapkan raket terbaikmu dan mari rasakan atmosfer mabar seru bersama komunitas DLOB.
            </p>
            <div className="pt-2">
              <Link
                href="/galeri"
                className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-bold px-8 py-3.5 rounded-full text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Lihat Galeri Mabar
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
