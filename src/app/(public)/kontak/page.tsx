'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { motion } from 'framer-motion';

export default function KontakPage() {
  const [formData, setFormData] = useState({ nama: '', email: '', pesan: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ nama: '', email: '', pesan: '' });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Lokasi',
      value: 'GOR Badminton Wisma Harapan',
      detail: 'Jl. Wisma Lantana IV No.D07-No 49, Gembor, Kec. Periuk, Tangerang, Banten 15133'
    },
    {
      icon: Phone,
      title: 'Telepon',
      value: '+62 812-7073-7272',
      detail: 'Admin DLOB - Hubungi kami kapan saja'
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'info@dlobcommunity.com',
      detail: 'Respon cepat dalam 24 jam'
    },
    {
      icon: Clock,
      title: 'Jadwal Rutin',
      value: 'Setiap Sabtu',
      detail: '20:00 - 23:00 WIB'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-teal-200 via-teal-100 to-transparent rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-teal-100 to-transparent rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="pt-8 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-12"
            >
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
                Hubungi <span className="bg-gradient-to-r from-[#3e6461] to-[#1e4843] bg-clip-text text-transparent">Kami</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl">
                Punya pertanyaan atau ingin bergabung dengan komunitas badminton terbesar? Hubungi kami dan mari bersama membangun semangat olahraga.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Contact Cards Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
            >
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ translateY: -8 }}
                    className="group relative"
                  >
                    {/* Glassmorphic Card */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 rounded-2xl backdrop-blur-xl border border-white/20 group-hover:border-white/40 transition-all duration-300" />

                    <div className="relative p-8">
                      <div className="mb-4 inline-block p-3 bg-gradient-to-br from-[#3e6461]/20 to-[#1e4843]/10 rounded-xl backdrop-blur-sm">
                        <Icon className="w-6 h-6 text-[#3e6461]" />
                      </div>

                      <h3 className="font-bold text-gray-900 text-lg mb-2">{info.title}</h3>
                      <p className="text-[#3e6461] font-semibold mb-1">{info.value}</p>
                      <p className="text-slate-600 text-sm">{info.detail}</p>
                    </div>

                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[#3e6461]/10 to-transparent pointer-events-none" />
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Contact Form Section */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/20 rounded-3xl backdrop-blur-2xl border border-white/30 blur" />

                <form onSubmit={handleSubmit} className="relative p-10 space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Kirim Pesan</h2>
                    <p className="text-slate-600">Kami akan merespon dalam 24 jam</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        name="nama"
                        value={formData.nama}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/50 border border-white/30 rounded-xl backdrop-blur-sm focus:bg-white/70 focus:border-[#3e6461] focus:outline-none transition-all duration-300 placeholder-slate-400"
                        placeholder="Nama Anda"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/50 border border-white/30 rounded-xl backdrop-blur-sm focus:bg-white/70 focus:border-[#3e6461] focus:outline-none transition-all duration-300 placeholder-slate-400"
                        placeholder="email@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Pesan
                      </label>
                      <textarea
                        name="pesan"
                        value={formData.pesan}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3 bg-white/50 border border-white/30 rounded-xl backdrop-blur-sm focus:bg-white/70 focus:border-[#3e6461] focus:outline-none transition-all duration-300 placeholder-slate-400 resize-none"
                        placeholder="Tulis pesan Anda di sini..."
                        required
                      ></textarea>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#3e6461] to-[#1e4843] text-white font-bold py-3.5 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    Kirim Pesan
                  </motion.button>

                  {submitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-green-100/50 border border-green-300 rounded-xl text-green-800 text-sm font-medium backdrop-blur-sm"
                    >
                      ✓ Terima kasih! Pesan Anda telah dikirim.
                    </motion.div>
                  )}
                </form>
              </motion.div>

              {/* Info Text */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Mengapa Hubungi Kami?</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Kami adalah komunitas badminton yang dinamis dan inklusif. Baik Anda ingin bergabung, bertanya tentang event, atau sekadar berbagi pengalaman, kami siap mendengarkan dan membantu.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 group">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[#3e6461]/20 text-[#3e6461] font-bold">✓</div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Bergabung dengan Komunitas</h4>
                      <p className="text-sm text-slate-600">Jadilah bagian dari lebih dari 200+ anggota aktif DLOB</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[#3e6461]/20 text-[#3e6461] font-bold">✓</div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Event & Turnamen</h4>
                      <p className="text-sm text-slate-600">Dapatkan info terbaru tentang event badminton eksklusif</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[#3e6461]/20 text-[#3e6461] font-bold">✓</div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Support & Coaching</h4>
                      <p className="text-sm text-slate-600">Dukungan dari pemain berpengalaman dan komunitas yang solid</p>
                    </div>
                  </div>
                </div>

                <Link href="/pre-order" className="inline-flex items-center gap-2 text-[#3e6461] hover:text-[#1e4843] font-semibold group">
                  Lihat Program Pre-Order
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#3e6461]/30 to-[#1e4843]/30 rounded-3xl backdrop-blur-xl border border-white/30 group-hover:border-white/50 transition-all duration-300" />

              <div className="relative p-12 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Siap Bergabung?</h2>
                <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                  Jangan ragu untuk menghubungi kami. Tim DLOB siap menyambut Anda dengan sepenuh hati dan memberikan pengalaman terbaik di komunitas badminton kami.
                </p>
                <motion.a
                  href="mailto:info@dlobcommunity.com"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block bg-gradient-to-r from-[#3e6461] to-[#1e4843] text-white font-bold py-4 px-10 rounded-xl hover:shadow-xl transition-all duration-300"
                >
                  Hubungi Sekarang
                </motion.a>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}
