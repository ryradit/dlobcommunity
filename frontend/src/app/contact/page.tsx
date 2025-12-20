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
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="contact" showAuth={true} />

      {/* Hero Section */}
      <section className="bg-linear-to-br from-green-600 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <MessageCircle className="h-20 w-20 mx-auto mb-8 text-green-300" />
          <h1 className="text-5xl font-bold mb-6">{t.hero.title}</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">{t.hero.subtitle}</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">{t.form.title}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t.form.name}
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900"
                    placeholder={t.form.namePlaceholder}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t.form.email}
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900"
                    placeholder={t.form.emailPlaceholder}
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t.form.phone}
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900"
                    placeholder={t.form.phonePlaceholder}
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t.form.message}
                  </label>
                  <textarea
                    rows={6}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900"
                    placeholder={t.form.messagePlaceholder}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <Send className="h-5 w-5 mr-2" />
                  {t.form.send}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">{t.info.title}</h2>
              <div className="space-y-8">
                {/* Schedule */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center mb-4">
                    <Clock className="h-8 w-8 text-blue-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-900">{t.info.schedule.title}</h3>
                  </div>
                  <p className="text-lg text-gray-900 mb-1 font-semibold">{t.info.schedule.time}</p>
                  <p className="text-gray-800 mb-2 font-medium">{t.info.schedule.duration}</p>
                  <p className="text-sm text-blue-700 font-medium">{t.info.schedule.note}</p>
                </div>

                {/* Location */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center mb-4">
                    <MapPin className="h-8 w-8 text-green-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-900">{t.info.location.title}</h3>
                  </div>
                  <p className="text-lg text-gray-900 mb-1 font-semibold">{t.info.location.venue}</p>
                  <p className="text-gray-800 mb-2 font-medium">{t.info.location.address}</p>
                  <p className="text-sm text-green-700 font-medium">{t.info.location.note}</p>
                </div>

                {/* Quick Contact */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center mb-4">
                    <Phone className="h-8 w-8 text-purple-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-900">{t.info.contact.title}</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <MessageCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-gray-900 font-medium">{t.info.contact.whatsapp}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-gray-900 font-medium">{t.info.contact.phone}</span>
                    </div>
                    <p className="text-sm text-purple-700 mt-2 font-medium">{t.info.contact.response}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">{t.faq.title}</h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-8">
              {t.faq.items.map((faq, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-800 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Find Us</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-96 bg-linear-to-br from-blue-100 to-green-100 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-blue-700 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">GOR Badminton Wisma Harapan</h3>
                <p className="text-gray-800 font-medium mb-1">Jl. Wisma Lantana IV No.D07-No 49, RT.006/RW.011</p>
                <p className="text-gray-800 font-medium">Gembor, Kec. Periuk, Kota Tangerang, Banten 15133</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-linear-to-r from-blue-600 to-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Don't wait - register now and join us this Saturday!
          </p>
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
          >
            Register Now
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}