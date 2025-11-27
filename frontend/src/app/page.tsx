'use client';

import Link from "next/link";
import { ArrowRight, Calendar, Users, Trophy, Bot, User, LogOut, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/hooks/useLanguage";

// CSS Animations
const animations = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(50px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  .animate-fade-in {
    animation: fade-in 0.8s ease-out;
  }
  
  .animate-slide-up {
    animation: slide-up 0.8s ease-out;
  }
  
  .delay-500 {
    animation-delay: 0.5s;
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`;

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { language } = useLanguage();

  // Bilingual content
  const content = {
    en: {
      nav: {
        about: "About", 
        contact: "Contact",
        dashboard: "My Dashboard"
      },
      auth: {
        login: "Login",
        logout: "Logout",
        joinCommunity: "Join Community",
        dashboard: "Dashboard"
      },
      hero: {
        title: "Welcome to DLOB",
        subtitle: "The ultimate badminton community platform that automates attendance tracking, match scheduling, and payment collection with AI-powered insights.",
        getStarted: "Get Started",
        loginToDashboard: "Login to Dashboard",
        goToDashboard: "Go to Dashboard"
      },
      cta: {
        dashboard: "My Dashboard",
        viewMatches: "View Matches", 
        login: "Login",
        join: "Join Community"
      },
      features: {
        title: "Everything You Need for Your Badminton Community"
      },
      about: {
        title: "About DLOB Community",
        mission: "Our Mission",
        missionText: "DLOB is dedicated to building a vibrant badminton community through innovative technology. We streamline community management, making it easier for players to focus on what matters most - playing badminton.",
        values: "Community Values",
        offer: "What We Offer"
      },
      contact: {
        title: "Get In Touch",
        subtitle: "Interested in joining our badminton community? Have questions? We'd love to hear from you!",
        schedule: "Schedule",
        whatsapp: "WhatsApp Group",
        location: "Location",
        joinCommunity: "Join Our Community"
      }
    },
    id: {
      nav: {
        about: "Tentang",
        contact: "Kontak", 
        dashboard: "Dashboard Saya"
      },
      auth: {
        login: "Masuk",
        logout: "Keluar",
        joinCommunity: "Gabung Komunitas",
        dashboard: "Dashboard"
      },
      hero: {
        title: "Selamat Datang di DLOB",
        subtitle: "Platform komunitas bulu tangkis terdepan yang mengotomatisasi pelacakan kehadiran, penjadwalan pertandingan, dan pengumpulan pembayaran dengan wawasan bertenaga AI.",
        getStarted: "Mulai Sekarang",
        loginToDashboard: "Masuk ke Dashboard",
        goToDashboard: "Ke Dashboard"
      },
      cta: {
        dashboard: "Dashboard Saya",
        viewMatches: "Lihat Pertandingan",
        login: "Masuk", 
        join: "Gabung Komunitas"
      },
      features: {
        title: "Semua yang Anda Butuhkan untuk Komunitas Bulu Tangkis Anda"
      },
      about: {
        title: "Tentang Komunitas DLOB",
        mission: "Misi Kami",
        missionText: "DLOB berdedikasi membangun komunitas bulu tangkis yang dinamis melalui teknologi inovatif. Kami menyederhanakan manajemen komunitas, memudahkan pemain untuk fokus pada hal yang paling penting - bermain bulu tangkis.",
        values: "Nilai-Nilai Komunitas",
        offer: "Yang Kami Tawarkan"
      },
      contact: {
        title: "Hubungi Kami",
        subtitle: "Tertarik bergabung dengan komunitas bulu tangkis kami? Ada pertanyaan? Kami senang mendengar dari Anda!",
        schedule: "Jadwal",
        whatsapp: "Grup WhatsApp", 
        location: "Lokasi",
        joinCommunity: "Gabung Komunitas Kami"
      }
    }
  };

  const t = content[language as keyof typeof content];

  const handleLogout = async () => {
    try {
      await logout();
      // Refresh the page to show the guest state
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      // Still refresh to clear state
      router.refresh();
    }
  };
  return (
    <>
      <style jsx>{animations}</style>
      <div className="min-h-screen bg-gray-50">
        <Header currentPage="home" showAuth={true} />
        
        {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-fade-in">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                {t.hero.title}
              </h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90 animate-slide-up">
                {t.hero.subtitle}
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up delay-500">
              {user ? (
                <>
                  <Link 
                    href={user.role === 'admin' ? "/admin" : "/dashboard"}
                    className="group px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 inline-flex items-center shadow-lg hover:shadow-xl"
                  >
                    <User className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                    {t.cta.dashboard}
                  </Link>
                  <Link 
                    href="/matches"
                    className="group px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105 inline-flex items-center"
                  >
                    <Trophy className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                    {t.cta.viewMatches}
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/login"
                    className="group px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 inline-flex items-center shadow-lg hover:shadow-xl"
                  >
                    <LogIn className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                    {t.cta.login}
                  </Link>
                  <Link 
                    href="/register"
                    className="group px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105 inline-flex items-center"
                  >
                    <UserPlus className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                    {t.cta.join}
                  </Link>
                </>
              )}
            </div>

            {/* Scroll Indicator */}
            <div className="mt-16 animate-bounce">
              <div className="w-6 h-10 border-2 border-white/50 rounded-full mx-auto relative">
                <div className="w-1 h-3 bg-white/70 rounded-full mx-auto mt-2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in">
            {t.features.title}
          </h3>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Attendance Feature */}
          <div className="group bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="h-12 w-12 text-blue-600 group-hover:animate-pulse" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              Smart Attendance
            </h4>
            <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
              QR code and GPS-based check-ins every Saturday. Automatic attendance tracking with real-time updates.
            </p>
            <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-5 w-5 text-blue-600" />
            </div>
          </div>

          {/* Payment Feature */}
          <div className="group bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="h-12 w-12 text-green-600 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
              Payment Management
            </h4>
            <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
              Automated fee calculations, payment reminders, and integration with Midtrans/Xendit for easy transactions.
            </p>
            <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-5 w-5 text-green-600" />
            </div>
          </div>

          {/* Match Management */}
          <div className="group bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-12 w-12 text-purple-600 group-hover:animate-pulse" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
              Match Scheduling
            </h4>
            <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
              Smart match scheduling with results tracking, leaderboards, and performance analytics.
            </p>
            <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-5 w-5 text-purple-600" />
            </div>
          </div>

          {/* AI Assistant */}
          <div className="group bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
              <Bot className="h-12 w-12 text-orange-600 group-hover:animate-pulse" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
              AI Assistant
            </h4>
            <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
              Gemini-powered recommendations, payment parsing, performance analysis, and community Q&A.
            </p>
            <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-8">{t.about.title}</h3>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">{t.about.mission}</h4>
                <p className="text-gray-600 mb-6">
                  {t.about.missionText}
                </p>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">{t.about.values}</h4>
                <ul className="text-gray-600 space-y-2">
                  <li>• <strong>Transparency:</strong> Clear payment tracking and match results</li>
                  <li>• <strong>Fairness:</strong> AI-powered fair match pairing</li>
                  <li>• <strong>Growth:</strong> Performance analytics to improve your game</li>
                  <li>• <strong>Community:</strong> Building lasting friendships through sport</li>
                </ul>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">{t.about.offer}</h4>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h5 className="font-semibold text-gray-900">📅 Regular Sessions</h5>
                    <p className="text-sm text-gray-600">Every Saturday evening at 8:00 PM</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h5 className="font-semibold text-gray-900">🏸 Equipment Provided</h5>
                    <p className="text-sm text-gray-600">Quality shuttlecocks for all matches</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h5 className="font-semibold text-gray-900">📊 Performance Tracking</h5>
                    <p className="text-sm text-gray-600">Detailed analytics and match history</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h5 className="font-semibold text-gray-900">🤖 AI Assistant</h5>
                    <p className="text-sm text-gray-600">Smart recommendations and insights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-8">{t.contact.title}</h3>
            <p className="text-xl text-gray-600 mb-12">
              {t.contact.subtitle}
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{t.contact.schedule}</h4>
                <p className="text-gray-600">Every Saturday<br />8:00 PM - 11:00 PM</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{t.contact.whatsapp}</h4>
                <p className="text-gray-600">Join our community chat<br />for updates and discussions</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{t.contact.location}</h4>
                <p className="text-gray-600">GOR Badminton Wisma Harapan<br />Tangerang, Banten</p>
              </div>
            </div>
            <div className="mt-12">
              <Link
                href="/register"
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                {t.contact.joinCommunity}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Join Our Growing Community</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Be part of a thriving badminton community that's making sports more accessible and enjoyable for everyone
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="group cursor-pointer">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <div className="text-4xl font-bold text-blue-600 mb-2 group-hover:animate-bounce">50+</div>
                <div className="text-gray-700 font-medium">Active Members</div>
              </div>
            </div>
            
            <div className="group cursor-pointer">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <div className="text-4xl font-bold text-green-600 mb-2 group-hover:animate-bounce">200+</div>
                <div className="text-gray-700 font-medium">Matches Played</div>
              </div>
            </div>
            
            <div className="group cursor-pointer">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <div className="text-4xl font-bold text-purple-600 mb-2 group-hover:animate-bounce">96%</div>
                <div className="text-gray-700 font-medium">Attendance Rate</div>
              </div>
            </div>
            
            <div className="group cursor-pointer">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <div className="text-4xl font-bold text-orange-600 mb-2 group-hover:animate-bounce">5</div>
                <div className="text-gray-700 font-medium">Years Strong</div>
              </div>
            </div>
          </div>
        </div>
      </section>

        <Footer />
    </div>
    </>
  );
}
