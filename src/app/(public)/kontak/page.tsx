'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Send, MessageSquare, ArrowRight, CheckCircle2, Navigation, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function KontakPage() {
  const [formData, setFormData] = useState({ nama: '', email: '', pesan: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<'dlob' | 'dlbc'>('dlob');

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
      value: selectedBranch === 'dlob' ? 'GOR Wisma Harapan' : 'GOR Galaxi Cikupa',
      detail: selectedBranch === 'dlob' 
        ? 'Gembor, Periuk, Kota Tangerang' 
        : 'Jl. Raya Peusar No.6, Cikupa, Kab. Tangerang',
      url: selectedBranch === 'dlob'
        ? 'https://www.google.com/maps/search/?api=1&query=GOR+Badminton+Wisma+Harapan+Gembor+Tangerang'
        : 'https://maps.app.goo.gl/329H3C2CTr9BZRDQ9',
      actionText: 'Lihat Peta',
    },
    {
      icon: Phone,
      title: 'WhatsApp Admin',
      value: selectedBranch === 'dlob' ? '+62 812-7073-7272' : 'Edi (+62 821-1345-5696)',
      detail: selectedBranch === 'dlob' 
        ? 'Respon cepat info mabar DLOB Pusat'
        : 'Respon cepat info mabar DLBC Cikupa',
      url: selectedBranch === 'dlob'
        ? 'https://wa.me/6281270737272'
        : 'https://wa.me/6282113455696',
      actionText: 'Chat WhatsApp',
    },
    {
      icon: Mail,
      title: 'Email Komunitas',
      value: 'support@dlobcommunity.com',
      detail: 'Pertanyaan kemitraan & sponsorship',
      url: 'mailto:support@dlobcommunity.com',
      actionText: 'Kirim Email',
    },
    {
      icon: Clock,
      title: 'Jadwal Rutin',
      value: selectedBranch === 'dlob' ? 'Sabtu 20:00 – 23:00' : 'Jumat 20:00 – 23:00',
      detail: selectedBranch === 'dlob'
        ? 'Sesi mabar rutin mingguan DLOB Pusat'
        : 'Sesi mabar rutin mingguan DLBC Cikupa',
      url: selectedBranch === 'dlob'
        ? 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Mabar%20Rutin%20DLOB%20Badminton'
        : 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Mabar%20Rutin%20DLBC%20Cikupa',
      actionText: 'Simpan Jadwal',
    },
  ];

  return (
    <main className="min-h-screen bg-white text-zinc-950 font-sans overflow-x-clip">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-white border-b border-zinc-200/80 overflow-hidden">
        {/* Ambient radial */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-radial from-[#4382C8]/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-mono tracking-wider uppercase">
              Pusat Bantuan &amp; Komunikasi
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-950 tracking-tight leading-[1.05]">
              Terhubung dengan<br />
              <span className="text-[#4382C8]">Pengurus DLOB.</span>
            </h1>
            <p className="text-zinc-600 text-base sm:text-lg leading-relaxed max-w-2xl">
              Punya pertanyaan seputar jadwal mabar, pendaftaran anggota baru, atau kolaborasi komunitas? Kami siap memberikan respons cepat.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. CONTACT INFO CARDS (Doppelrand Architecture)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-zinc-50 border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Precision Branch Switcher */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center p-1.5 rounded-full bg-zinc-200/80 border border-zinc-300 shadow-inner">
              <button
                onClick={() => setSelectedBranch('dlob')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-tight transition-all duration-300 cursor-pointer ${
                  selectedBranch === 'dlob'
                    ? 'bg-zinc-950 text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                DLOB Pusat (Wisma Harapan)
              </button>
              <button
                onClick={() => setSelectedBranch('dlbc')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-tight transition-all duration-300 cursor-pointer ${
                  selectedBranch === 'dlbc'
                    ? 'bg-[#4382C8] text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                DLBC Cikupa (GOR Galaxi)
              </button>
            </div>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <div
                  key={index}
                  className="doppelrand-shell p-1.5 rounded-[2rem] bg-white border border-zinc-200/80 shadow-sm hover:shadow-xl hover:border-[#4382C8]/30 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="p-6 rounded-[calc(2rem-0.375rem)] bg-zinc-50/50 h-full flex flex-col justify-between space-y-6">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-[#4382C8] shadow-xs mb-4">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider mb-1">{info.title}</h3>
                      <p className="font-black text-zinc-950 text-base tracking-tight leading-snug">{info.value}</p>
                      <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed">{info.detail}</p>
                    </div>

                    <a
                      href={info.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 hover:text-[#4382C8] transition-colors pt-2 border-t border-zinc-200/60"
                    >
                      <span>{info.actionText}</span>
                      <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              3. CONTACT FORM & HIGHLIGHTS SPLIT
          ───────────────────────────────────────────────────────────── */}
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            
            {/* Left: Contact Form (Doppelrand Container) */}
            <div className="lg:col-span-7">
              <div className="doppelrand-shell p-2 rounded-[2.5rem] bg-white border border-zinc-200/80 shadow-md">
                <div className="p-8 sm:p-10 rounded-[calc(2.5rem-0.5rem)] bg-zinc-50/50 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-zinc-950 tracking-tight">Kirim Pesan Langsung</h2>
                    <p className="text-zinc-500 text-sm mt-1">Isi formulir di bawah untuk menyampaikan pertanyaan atau permohonan sparring.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        name="nama"
                        value={formData.nama}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 bg-white border border-zinc-200 rounded-xl text-sm focus:border-[#4382C8] focus:ring-2 focus:ring-[#4382C8]/20 focus:outline-none transition-all placeholder-zinc-400"
                        placeholder="Masukkan nama lengkap Anda"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                        Alamat Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 bg-white border border-zinc-200 rounded-xl text-sm focus:border-[#4382C8] focus:ring-2 focus:ring-[#4382C8]/20 focus:outline-none transition-all placeholder-zinc-400"
                        placeholder="email@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                        Pesan atau Pertanyaan
                      </label>
                      <textarea
                        name="pesan"
                        value={formData.pesan}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3.5 bg-white border border-zinc-200 rounded-xl text-sm focus:border-[#4382C8] focus:ring-2 focus:ring-[#4382C8]/20 focus:outline-none transition-all placeholder-zinc-400 resize-none"
                        placeholder="Tuliskan detail pertanyaan seputar jadwal mabar, biaya iuran, atau hal lainnya..."
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group w-full bg-zinc-950 hover:bg-zinc-900 text-white font-bold p-2 pl-6 rounded-full shadow-lg transition-all flex items-center justify-between text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
                    >
                      <span>{isSubmitting ? 'Mengirim...' : 'Kirim Pesan Sekarang'}</span>
                      <div className="btn-nested-icon w-8 h-8 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-[#4382C8] transition-colors">
                        <Send className="w-3.5 h-3.5 text-white" />
                      </div>
                    </button>

                    {submitted && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        Pesan Anda berhasil terkirim. Admin akan segera menghubungi via email/WhatsApp.
                      </motion.div>
                    )}

                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold">
                        {error}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>

            {/* Right: Quick Highlights & Direct WhatsApp */}
            <div className="lg:col-span-5 space-y-6 lg:pt-2">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-zinc-950 tracking-tight">Kenyamanan Bergabung di DLOB</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Kami menyambut seluruh pecinta bulu tangkis di Tangerang & Cikupa dengan sistem latihan yang tertib dan ramah.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { title: 'Jadwal Mingguan Teratur', desc: 'Sesi latihan dan mabar rutin mingguan di lapangan standar badminton resmi.' },
                  { title: 'Pencatatan Match & Statistik', desc: 'Statistik kemenangan dan performa tersimpan rapi di dashboard aplikasi.' },
                  { title: 'Lingkungan Suportif', desc: 'Atmosfer kekeluargaan yang saling menyemangati tanpa intimidasi pemain pemula.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3.5 items-start p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#4382C8] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-zinc-950">{item.title}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp direct card */}
              <div className="doppelrand-shell p-1.5 rounded-[2rem] bg-zinc-950 border border-zinc-800 text-white shadow-xl">
                <div className="p-6 rounded-[calc(2rem-0.375rem)] bg-zinc-900 space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4382C8]">
                    Komunitas Aktif
                  </span>
                  <h4 className="text-base font-bold text-white leading-snug">
                    Ingin langsung bergabung ke grup WhatsApp mabar DLOB?
                  </h4>
                  <a
                    href="https://chat.whatsapp.com/G5yBwhgP4nZ4j9Lg8D0b5k"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors"
                  >
                    Masuk Grup WhatsApp DLOB →
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. CTA BOTTOM (Cinematic Closing)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-2 sm:p-2.5 rounded-[2.5rem] bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden relative text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-[#4382C8]/20 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative rounded-[calc(2.5rem-0.625rem)] bg-zinc-900/90 p-8 sm:p-14 text-center max-w-2xl mx-auto space-y-5">
            <h2 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight">
              Sampai Jumpa di Lapangan!
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Siapkan raket terbaikmu dan nikmati atmosfer mabar badminton bersama komunitas DLOB.
            </p>
            <div className="pt-2">
              <Link
                href="/galeri"
                className="group inline-flex items-center gap-3 bg-white hover:bg-zinc-100 text-zinc-950 pl-7 pr-3 py-3.5 rounded-full font-bold text-sm tracking-tight transition-all shadow-xl active:scale-[0.98]"
              >
                <span>Lihat Momen Galeri Kami</span>
                <div className="btn-nested-icon w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center group-hover:bg-[#4382C8] transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
