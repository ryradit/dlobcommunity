'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
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
      title: 'Lokasi GOR',
      value: 'GOR Badminton Wisma Harapan',
      detail: 'Jl. Wisma Lantana IV No.D07-No 49, Gembor, Kec. Periuk, Tangerang, Banten 15133'
    },
    {
      icon: Phone,
      title: 'WhatsApp Admin',
      value: '+62 812-7073-7272',
      detail: '+62 822-3045-0433 (Backup)'
    },
    {
      icon: Mail,
      title: 'Alamat Email',
      value: 'support@dlobcommunity.com',
      detail: 'Respon cepat dalam 24 jam kerja'
    },
    {
      icon: Clock,
      title: 'Jadwal Rutin',
      value: 'Setiap Sabtu Malam',
      detail: 'Pukul 20:00 - 23:00 WIB'
    }
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
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any },
    },
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 text-slate-800 relative overflow-hidden font-sans">
      {/* Premium light ambient lighting & soft grid overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-15%] w-[800px] h-[800px] rounded-full bg-[#1e4843]/5 blur-[120px] animate-pulse duration-[10000ms]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[800px] h-[800px] rounded-full bg-[#3e6461]/5 blur-[120px] animate-pulse duration-[8000ms]" />
        <div className="absolute top-[30%] right-[10%] w-[500px] h-[500px] rounded-full bg-[#1e4843]/3 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000002_1px,transparent_1px),linear-gradient(to_bottom,#00000002_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_10%,#000_80%,transparent_100%)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">

        {/* Hero Header Section */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#3e6461] mb-3 block">
              Hubungi Kami
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
              Mari Terhubung & <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#3e6461] via-[#5c8b87] to-emerald-600 bg-clip-text text-transparent">
                Bermain Bersama
              </span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-base max-w-2xl font-light leading-relaxed">
              Punya pertanyaan mengenai jadwal main, pendaftaran membership, atau ingin berkolaborasi? 
              Tim DLOB siap menyambut Anda dengan senang hati.
            </p>
          </motion.div>
        </div>

        {/* Main Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-24">
          
          {/* Left Column: Contact Cards & Map (7/12) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Contact Info Cards */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ translateY: -4 }}
                    className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/40 hover:bg-white/60 hover:border-slate-300 p-6 transition-all duration-300 shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-[#3e6461]/10 text-[#3e6461] rounded-2xl group-hover:scale-105 transition-transform duration-300 shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{info.title}</p>
                        <h4 className="text-sm font-semibold text-slate-800 mt-1 truncate">{info.value}</h4>
                        <p className="text-xs text-slate-500 mt-2 font-light leading-relaxed">{info.detail}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Google Maps Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
              className="rounded-3xl border border-slate-200/60 bg-white/40 overflow-hidden p-2.5 shadow-md"
            >
              <div className="rounded-2xl overflow-hidden aspect-video w-full relative border border-slate-100">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.678353128801!2d106.5786862!3d-6.1738001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ffa7e2cd5549%3A0x15c214ab8b458bf3!2sGOR%20Badminton%20Wisma%20Harapan!5e0!3m2!1sid!2sid!4v1717246000000!5m2!1sid!2sid"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Peta GOR Badminton Wisma Harapan"
                />
              </div>
              <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="w-4 h-4 text-[#3e6461] shrink-0" />
                  <span>GOR Badminton Wisma Harapan, Tangerang</span>
                </div>
                <a
                  href="https://maps.app.goo.gl/XDtegLtAjT7bqahv5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3e6461] hover:text-[#5c8b87] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1 self-start sm:self-auto"
                >
                  Buka Google Maps →
                </a>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Contact Form (5/12) */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
              className="relative rounded-3xl border border-slate-200/60 bg-white/50 p-8 md:p-10 shadow-xl backdrop-blur-xl overflow-hidden"
            >
              {/* Inner subtle glow */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#3e6461]/5 rounded-full blur-3xl pointer-events-none" />

              <form onSubmit={handleSubmit} className="relative space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Kirim Pesan</h3>
                  <p className="text-slate-500 text-xs font-light">
                    Silakan tinggalkan pesan Anda di bawah. Kami akan merespon dalam waktu 24 jam.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      name="nama"
                      value={formData.nama}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-white/80 border border-slate-200 focus:border-[#3e6461] rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3e6461]/10 transition-all duration-300 text-sm"
                      placeholder="Nama Lengkap Anda"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-white/80 border border-slate-200 focus:border-[#3e6461] rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3e6461]/10 transition-all duration-300 text-sm"
                      placeholder="email@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                      Pesan
                    </label>
                    <textarea
                      name="pesan"
                      value={formData.pesan}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3.5 bg-white/80 border border-slate-200 focus:border-[#3e6461] rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3e6461]/10 transition-all duration-300 text-sm resize-none"
                      placeholder="Tulis pesan atau pertanyaan Anda di sini..."
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#3e6461] to-[#1e4843] hover:from-[#4d7a77] hover:to-[#265953] text-white font-bold py-4 rounded-2xl shadow-md transition-all duration-300 flex items-center justify-center gap-2 text-xs uppercase tracking-wider group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>Mengirim...</span>
                  ) : (
                    <>
                      <span>Kirim Pesan</span>
                      <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                    </>
                  )}
                </button>

                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 text-xs font-semibold backdrop-blur-sm text-center"
                  >
                    ✓ Pesan berhasil terkirim! Terima kasih.
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-xs font-semibold backdrop-blur-sm text-center"
                  >
                    ✗ {error}
                  </motion.div>
                )}
              </form>
            </motion.div>
          </div>

        </div>

        {/* Why Join Us & CTA Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center border-t border-slate-200/60 pt-20 mb-16">
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-slate-800">Mengapa Hubungi Kami?</h3>
            <p className="text-slate-500 font-light leading-relaxed text-sm sm:text-base">
              Kami adalah komunitas badminton yang berkembang pesat, aktif, dan ramah untuk semua tingkat keahlian. 
              Baik Anda ingin meningkatkan keterampilan, mencari teman sparing, atau bergabung sebagai member tetap, 
              kami menyambut semua masukan dan pertanyaan Anda.
            </p>

            <div className="space-y-4 text-sm font-light">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#3e6461]/10 text-[#3e6461] flex items-center justify-center font-bold text-xs">✓</span>
                <div>
                  <h4 className="font-semibold text-slate-800">200+ Anggota Aktif</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Jejaring komunitas badminton yang solid dan suportif.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#3e6461]/10 text-[#3e6461] flex items-center justify-center font-bold text-xs">✓</span>
                <div>
                  <h4 className="font-semibold text-slate-800">Event & Kompetisi Internal</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Kompetisi rutin untuk mengasah kemampuan bermain Anda.</p>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <Link href="/pre-order" className="inline-flex items-center gap-2 text-[#3e6461] hover:text-[#5c8b87] font-bold text-xs tracking-wider uppercase group transition-colors">
                Lihat Koleksi Merchandise 
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative group rounded-3xl border border-slate-200/60 bg-white/40 p-10 text-center shadow-xl backdrop-blur-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#3e6461]/5 to-[#1e4843]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Siap Bergabung?</h3>
            <p className="text-slate-500 mb-6 font-light text-xs sm:text-sm leading-relaxed">
              Tim admin DLOB siap menyambut Anda langsung di GOR Wisma Harapan. Segera klik link di bawah untuk mengirim pesan langsung via email.
            </p>
            <motion.a
              href="mailto:info@dlobcommunity.com"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block bg-gradient-to-r from-[#3e6461] to-[#1e4843] hover:from-[#4d7a77] hover:to-[#265953] text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition-all duration-300 text-xs tracking-wider uppercase"
            >
              Hubungi Sekarang
            </motion.a>
          </motion.div>

        </div>
      </div>
    </main>
  );
}
