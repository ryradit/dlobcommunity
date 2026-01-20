'use client';

import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Mail, Clock, MessageCircle, Send, Globe, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/hooks/useLanguage";

export default function ContactPage() {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const content = {
    en: {
      title: "Contact Us",
      hero: {
        title: "Get in Touch with DLOB",
        subtitle: "Have questions? Want to join our community? We'd love to hear from you!"
      },
      form: {
        title: "Send us a Message",
        name: "Full Name",
        email: "Email Address", 
        phone: "Phone Number",
        message: "Your Message",
        send: "Send Message",
        namePlaceholder: "Enter your full name",
        emailPlaceholder: "Enter your email address",
        phonePlaceholder: "Enter your phone number",
        messagePlaceholder: "Tell us about your interest in joining DLOB or ask any questions..."
      },
      info: {
        title: "Community Information",
        schedule: {
          title: "Playing Schedule",
          time: "Every Saturday",
          duration: "8:00 PM - 11:00 PM",
          note: "Regular weekly sessions"
        },
        location: {
          title: "Location",
          venue: "GOR Badminton Wisma Harapan",
          address: "Tangerang, Banten",
          note: "Jl. Wisma Lantana IV No.D07-No 49, RT.006/RW.011, Gembor, Kec. Periuk"
        },
        contact: {
          title: "Quick Contact",
          whatsapp: "WhatsApp Group",
          phone: "+62 812-7073-7272",
          response: "Admin DLOB Contact"
        }
      },
      faq: {
        title: "Frequently Asked Questions",
        items: [
          {
            question: "How do I join the DLOB community?",
            answer: "Simply register on our platform and attend your first Saturday session. Our community managers will help you get started!"
          },
          {
            question: "What is the membership fee structure?",
            answer: "We offer both monthly membership and pay-per-session options. Membership includes all Saturday sessions, while pay-per-session is perfect for occasional players."
          },
          {
            question: "Do I need to bring my own equipment?",
            answer: "We provide high-quality shuttlecocks for all matches. You just need to bring your racket and appropriate sports attire."
          },
          {
            question: "How does the AI match pairing work?",
            answer: "Our AI analyzes player performance, skill level, and win rates to create fair and competitive matches for everyone."
          }
        ]
      }
    },
    id: {
      title: "Hubungi Kami",
      hero: {
        title: "Hubungi DLOB",
        subtitle: "Punya pertanyaan? Ingin bergabung dengan komunitas kami? Kami senang mendengar dari Anda!"
      },
      form: {
        title: "Kirim Pesan",
        name: "Nama Lengkap",
        email: "Alamat Email",
        phone: "Nomor Telepon", 
        message: "Pesan Anda",
        send: "Kirim Pesan",
        namePlaceholder: "Masukkan nama lengkap Anda",
        emailPlaceholder: "Masukkan alamat email Anda",
        phonePlaceholder: "Masukkan nomor telepon Anda",
        messagePlaceholder: "Ceritakan minat Anda bergabung dengan DLOB atau ajukan pertanyaan..."
      },
      info: {
        title: "Informasi Komunitas",
        schedule: {
          title: "Jadwal Bermain",
          time: "Setiap Sabtu",
          duration: "20:00 - 23:00 WIB",
          note: "Sesi mingguan reguler"
        },
        location: {
          title: "Lokasi",
          venue: "GOR Badminton Wisma Harapan",
          address: "Tangerang, Banten",
          note: "Jl. Wisma Lantana IV No.D07-No 49, RT.006/RW.011, Gembor, Kec. Periuk"
        },
        contact: {
          title: "Kontak Cepat",
          whatsapp: "Grup WhatsApp",
          phone: "+62 812-7073-7272",
          response: "Kontak Admin DLOB"
        }
      },
      faq: {
        title: "Pertanyaan yang Sering Diajukan",
        items: [
          {
            question: "Bagaimana cara bergabung dengan komunitas DLOB?",
            answer: "Cukup daftar di platform kami dan hadiri sesi Sabtu pertama Anda. Manajer komunitas kami akan membantu Anda memulai!"
          },
          {
            question: "Bagaimana struktur biaya keanggotaan?",
            answer: "Kami menawarkan keanggotaan bulanan dan opsi bayar per sesi. Keanggotaan mencakup semua sesi Sabtu, sedangkan bayar per sesi cocok untuk pemain sesekali."
          },
          {
            question: "Apakah saya perlu membawa peralatan sendiri?",
            answer: "Kami menyediakan shuttlecock berkualitas tinggi untuk semua pertandingan. Anda hanya perlu membawa raket dan pakaian olahraga yang sesuai."
          },
          {
            question: "Bagaimana cara kerja penjodohan pertandingan AI?",
            answer: "AI kami menganalisis performa pemain, tingkat keahlian, dan tingkat kemenangan untuk menciptakan pertandingan yang adil dan kompetitif untuk semua orang."
          }
        ]
      }
    }
  };

  const t = content[language as keyof typeof content];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert('Message sent! We will get back to you within 24 hours.');
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header currentPage="contact" showAuth={true} />

      {/* Hero Section */}
      <section className="relative min-h-96 overflow-hidden bg-black">
        {/* Gradient background with blur effect */}
        <div className="flex flex-col items-end absolute -right-60 -top-10 blur-xl z-0">
          <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-purple-600 to-sky-600"></div>
          <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-pink-900 to-yellow-400"></div>
          <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-yellow-600 to-sky-500"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 min-h-96 flex flex-col items-center justify-center">
          <div className="mx-auto flex max-w-fit items-center justify-center space-x-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm mb-8">
            <span className="text-sm font-medium text-white">
              {language === 'en' ? 'Get in Touch' : 'Hubungi Kami'}
            </span>
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl text-center">
            {t.hero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 text-center">
            {t.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Form */}
            <div className="group bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-10 transition duration-300 pointer-events-none"></div>
              <div className="relative">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">{t.form.title}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t.form.name}
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-900"
                      placeholder={t.form.namePlaceholder}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t.form.email}
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-900"
                      placeholder={t.form.emailPlaceholder}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t.form.phone}
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-900"
                      placeholder={t.form.phonePlaceholder}
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t.form.message}
                    </label>
                    <textarea
                      rows={6}
                      required
                      className="w-full px-4 py-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-900"
                      placeholder={t.form.messagePlaceholder}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-600 to-yellow-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    {t.form.send}
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">{t.info.title}</h2>
              <div className="space-y-4">
                {/* Schedule */}
                <div className="group relative bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-10 transition duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{t.info.schedule.title}</h3>
                    </div>
                    <p className="text-lg text-gray-700 mb-1 font-semibold ml-15">{t.info.schedule.time}</p>
                    <p className="text-gray-600 mb-1 font-medium ml-15">{t.info.schedule.duration}</p>
                    <p className="text-sm text-gray-600 font-medium ml-15">{t.info.schedule.note}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="group relative bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-purple-300 transition-all duration-300">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl opacity-0 group-hover:opacity-10 transition duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <MapPin className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{t.info.location.title}</h3>
                    </div>
                    <p className="text-lg text-gray-700 mb-1 font-semibold ml-15">{t.info.location.venue}</p>
                    <p className="text-gray-600 mb-1 font-medium ml-15">{t.info.location.address}</p>
                    <p className="text-sm text-gray-600 font-medium ml-15">{t.info.location.note}</p>
                  </div>
                </div>

                {/* Quick Contact */}
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200 shadow-sm">
                  <div className="flex items-center mb-4">
                    <Phone className="h-8 w-8 text-purple-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-900">{t.info.contact.title}</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <MessageCircle className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="text-gray-700 font-medium">{t.info.contact.whatsapp}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="text-gray-700 font-medium">{t.info.contact.phone}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 font-medium">{t.info.contact.response}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">{t.faq.title}</h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-8">
              {t.faq.items.map((faq, index) => (
                <div key={index} className="bg-purple-50 rounded-xl p-6 hover:bg-purple-100 transition-colors border border-purple-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <section className="py-20 bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Find Us</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
            <div className="h-96 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">GOR Badminton Wisma Harapan</h3>
                <p className="text-gray-700 font-medium mb-1">Jl. Wisma Lantana IV No.D07-No 49, RT.006/RW.011</p>
                <p className="text-gray-700 font-medium">Gembor, Kec. Periuk, Kota Tangerang, Banten 15133</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative min-h-96 overflow-hidden bg-black">
        {/* Gradient blur effects */}
        <div className="flex flex-col items-end absolute -right-60 -top-10 blur-xl z-0">
          <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-purple-600 to-sky-600"></div>
          <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-pink-900 to-yellow-400"></div>
          <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-yellow-600 to-sky-500"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 min-h-96 flex flex-col items-center justify-center">
          {/* Badge */}
          <div className="mb-6 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center gap-2">
            <span className="text-sm font-medium text-white">✨ Join Us</span>
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white text-center">
            Ready to Join Our Community?
          </h2>

          {/* Subtitle */}
          <p className="text-lg md:text-xl mb-8 text-gray-300 text-center max-w-2xl">
            Don't wait - register now and join us this Saturday!
          </p>

          {/* Button */}
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-3 bg-white text-black rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
          >
            Register Now
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}