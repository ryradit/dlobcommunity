'use client';

import Link from "next/link";
import { ArrowLeft, Trophy, Target, Users, Heart, Award, Star } from "lucide-react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HallOfFameSection from "@/components/HallOfFameSection";
import { useLanguage } from "@/hooks/useLanguage";

export default function AboutPage() {
  const { language } = useLanguage();  const content = {
    en: {
      title: "About DLOB Community",
      hero: {
        title: "Building Indonesia's Premier Badminton Community",
        subtitle: "Where technology meets tradition to create the ultimate badminton experience"
      },
      mission: {
        title: "Our Mission",
        description: "To revolutionize badminton community management through innovative technology, making it easier for players to connect, compete, and grow together.",
        vision: "Our Vision",
        visionText: "Creating a world where every badminton player has access to fair, transparent, and technology-enhanced community experiences."
      },
      values: [
        {
          icon: "🎯",
          title: "Fairness",
          description: "AI-powered match pairing ensures everyone gets to play with players of similar skill levels"
        },
        {
          icon: "🔍", 
          title: "Transparency",
          description: "Clear payment tracking, match results, and community statistics for complete visibility"
        },
        {
          icon: "📈",
          title: "Growth",
          description: "Performance analytics and personalized insights to help every player improve their game"
        },
        {
          icon: "🤝",
          title: "Community",
          description: "Building lasting friendships and connections through the love of badminton"
        }
      ],
      story: {
        title: "Our Story",
        text: "DLOB started as a simple idea: what if managing a badminton community could be as enjoyable as playing the sport itself? Founded by passionate badminton players who experienced the challenges of manual attendance tracking, payment collection, and fair match organization, we set out to create a solution that would benefit the entire community.",
        highlights: [
          "Founded by badminton enthusiasts",
          "Born from real community challenges",
          "Technology-driven solutions",
          "Community-first approach"
        ]
      },
      team: {
        title: "Meet the Team",
        description: "Our diverse team combines deep badminton knowledge with cutting-edge technology expertise",
        members: [
          {
            name: "Development Team",
            role: "Full-Stack Engineers",
            description: "Building robust, scalable solutions"
          },
          {
            name: "Community Managers",
            role: "Player Experience",
            description: "Ensuring great player experiences"
          },
          {
            name: "AI Specialists",
            role: "Machine Learning",
            description: "Creating intelligent features"
          }
        ]
      },
      community: {
        title: "Join Our Growing Community",
        stats: [
          { number: "50+", label: "Member Players" },
          { number: "100+", label: "Tournaments Participated" },
          { number: "95%", label: "Member Satisfaction" },
          { number: "24/7", label: "AI Support" }
        ]
      },
      features: {
        title: "Platform Features",
        subtitle: "Discover the powerful features that make DLOB special",
        items: [
          {
            title: "Smart Attendance System",
            description: "QR code check-in system with GPS verification and real-time updates",
            icon: "📅"
          },
          {
            title: "Payment Management", 
            description: "Automated fee calculations with multiple payment methods and transparent tracking",
            icon: "💳"
          },
          {
            title: "Match Scheduling",
            description: "AI-powered fair match pairing with performance analytics and leaderboards",
            icon: "🏸"
          },
          {
            title: "AI Assistant",
            description: "Gemini-powered intelligent assistant for community insights and recommendations",
            icon: "🤖"
          }
        ]
      }
    },
    id: {
      title: "Tentang Komunitas DLOB",
      hero: {
        title: "Membangun Komunitas Bulu Tangkis Terdepan di Indonesia",
        subtitle: "Dimana teknologi bertemu tradisi untuk menciptakan pengalaman bulu tangkis yang sempurna"
      },
      mission: {
        title: "Misi Kami",
        description: "Merevolusi manajemen komunitas bulu tangkis melalui teknologi inovatif, memudahkan pemain untuk terhubung, berkompetisi, dan berkembang bersama.",
        vision: "Visi Kami",
        visionText: "Menciptakan dunia dimana setiap pemain bulu tangkis memiliki akses ke pengalaman komunitas yang adil, transparan, dan ditingkatkan teknologi."
      },
      values: [
        {
          icon: "🎯",
          title: "Keadilan",
          description: "Penjodohan pertandingan bertenaga AI memastikan semua orang bermain dengan pemain yang setingkat"
        },
        {
          icon: "🔍",
          title: "Transparansi", 
          description: "Pelacakan pembayaran yang jelas, hasil pertandingan, dan statistik komunitas untuk visibilitas penuh"
        },
        {
          icon: "📈",
          title: "Pertumbuhan",
          description: "Analitik performa dan wawasan personal untuk membantu setiap pemain meningkatkan permainannya"
        },
        {
          icon: "🤝",
          title: "Komunitas",
          description: "Membangun persahabatan dan koneksi yang langgeng melalui kecintaan pada bulu tangkis"
        }
      ],
      story: {
        title: "Cerita Kami",
        text: "DLOB dimulai sebagai ide sederhana: bagaimana jika mengelola komunitas bulu tangkis bisa semenyenangkan bermain olahraganya? Didirikan oleh pemain bulu tangkis yang bersemangat yang mengalami tantangan pelacakan kehadiran manual, pengumpulan pembayaran, dan organisasi pertandingan yang adil, kami bertekad menciptakan solusi yang menguntungkan seluruh komunitas.",
        highlights: [
          "Didirikan oleh penggemar bulu tangkis",
          "Lahir dari tantangan komunitas nyata",
          "Solusi berbasis teknologi",
          "Pendekatan mengutamakan komunitas"
        ]
      },
      team: {
        title: "Kenali Tim Kami",
        description: "Tim kami yang beragam menggabungkan pengetahuan bulu tangkis yang mendalam dengan keahlian teknologi terdepan",
        members: [
          {
            name: "Tim Pengembangan",
            role: "Insinyur Full-Stack", 
            description: "Membangun solusi yang kokoh dan scalable"
          },
          {
            name: "Manajer Komunitas",
            role: "Pengalaman Pemain",
            description: "Memastikan pengalaman pemain yang luar biasa"
          },
          {
            name: "Spesialis AI",
            role: "Machine Learning",
            description: "Menciptakan fitur-fitur cerdas"
          }
        ]
      },
      community: {
        title: "Bergabung dengan Komunitas yang Berkembang",
        stats: [
          { number: "50+", label: "Member Aktif" },
          { number: "100+", label: "Turnamen Diikuti" },
          { number: "95%", label: "Kepuasan Anggota" },
          { number: "24/7", label: "Dukungan AI" }
        ]
      },
      features: {
        title: "Fitur Platform",
        subtitle: "Temukan fitur-fitur canggih yang membuat DLOB istimewa",
        items: [
          {
            title: "Sistem Absensi Cerdas",
            description: "Sistem check-in QR code dengan verifikasi GPS dan update real-time",
            icon: "📅"
          },
          {
            title: "Manajemen Pembayaran",
            description: "Kalkulasi biaya otomatis dengan berbagai metode pembayaran dan pelacakan transparan",
            icon: "💳"
          },
          {
            title: "Penjadwalan Pertandingan",
            description: "Penjodohan pertandingan adil bertenaga AI dengan analitik performa dan papan peringkat",
            icon: "🏸"
          },
          {
            title: "Asisten AI",
            description: "Asisten cerdas bertenaga Gemini untuk wawasan komunitas dan rekomendasi",
            icon: "🤖"
          }
        ]
      }
    }
  };

  const t = content[language as keyof typeof content];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="about" showAuth={true} />

      {/* Hero Section */}
      <section className="bg-linear-to-br from-blue-600 to-purple-700 text-white py-24">
        <div className="container mx-auto px-4 text-center">
          <Trophy className="h-20 w-20 mx-auto mb-8 text-yellow-300" />
          <h1 className="text-5xl font-bold mb-6">{t.hero.title}</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">{t.hero.subtitle}</p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">{t.mission.title}</h2>
              <p className="text-lg text-gray-600 mb-8">{t.mission.description}</p>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t.mission.vision}</h3>
              <p className="text-gray-600">{t.mission.visionText}</p>
            </div>
            <div className="relative">
              <div className="bg-blue-100 rounded-2xl p-8 text-center">
                <Target className="h-24 w-24 text-blue-600 mx-auto mb-6" />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">🎯</div>
                    <div className="text-sm text-gray-600 mt-1">Mission Driven</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">🚀</div>
                    <div className="text-sm text-gray-600 mt-1">Innovation Focused</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Our Core Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {t.values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="bg-linear-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">{t.story.title}</h2>
              <p className="text-lg text-gray-600 mb-8">{t.story.text}</p>
              
              <div className="grid grid-cols-2 gap-4">
                {t.story.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-2 shrink-0" />
                    <span className="text-sm text-gray-700">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-blue-600 text-white rounded-xl p-6">
                <Users className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">Community First</h3>
                <p className="opacity-90">Every decision we make prioritizes the community's needs and experience</p>
              </div>
              
              <div className="bg-purple-600 text-white rounded-xl p-6">
                <Award className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">Excellence Driven</h3>
                <p className="opacity-90">We strive for excellence in every feature and interaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-20 bg-linear-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t.community.title}</h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {t.community.stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.features.title}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t.features.subtitle}</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.features.items.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hall of Fame Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <HallOfFameSection showAll={false} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Be Part of Our Story?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of badminton players who trust DLOB for their community needs
          </p>
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            Join Our Community
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}