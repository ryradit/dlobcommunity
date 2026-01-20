'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Users, Trophy, Bot, User, LogOut, LogIn, UserPlus, Menu, X, Zap, CheckCircle, Lock, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Calendar as BookingCalendar } from "@/components/Calendar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/hooks/useLanguage";
import { GallerySection } from "@/components/GallerySection";
import { MorphingTextReveal } from "@/components/MorphingTextReveal";
import AboutSection from "@/components/ui/about-section";

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
  
  @keyframes morphing-text-reveal {
    0% {
      opacity: 0;
      transform: skewX(45deg) scaleX(0);
      clip-path: inset(0 100% 0 0);
    }
    50% {
      opacity: 1;
      transform: skewX(10deg) scaleX(0.8);
    }
    100% {
      opacity: 1;
      transform: skewX(0deg) scaleX(1);
      clip-path: inset(0 0% 0 0);
    }
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
  
  .animate-morphing-reveal {
    animation: morphing-text-reveal 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    display: inline-block;
  }
`;

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<{ src: string; alt: string; faceCenter?: { x: number; y: number } }[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);

  // Load local portrait images
  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        const galleryPhotos = [
          { src: '/images/potrait/IMG_1999.JPG', alt: 'Training Photo 1' },
          { src: '/images/potrait/IMG_2039.JPG', alt: 'Training Photo 2' },
          { src: '/images/potrait/IMG_2049.JPG', alt: 'Training Photo 3' },
          { src: '/images/potrait/IMG_2129.JPG', alt: 'Training Photo 4' },
          { src: '/images/potrait/IMG_7627.JPG', alt: 'Training Photo 5' },
          { src: '/images/potrait/IMG_7635.JPG', alt: 'Training Photo 6' }
        ];
        
        if (galleryPhotos.length > 0) {
          setGalleryImages(galleryPhotos);
        }
      } catch (error) {
        console.error('Failed to load gallery images:', error);
        // No placeholder fallback - only show real images with faces
        setGalleryImages([]);
      } finally {
        setIsLoadingGallery(false);
      }
    };
    
    loadGalleryImages();
  }, []);

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
        joinCommunity: "Join Our Community",
        how: "How It Works",
        checkin: "Check-in",
        checkinDesc: "Member arrives and scans QR code or GPS check-in to mark attendance",
        autoPayment: "Auto Payment",
        autoPaymentDesc: "System calculates fees automatically and sends payment reminders",
        matchPairing: "Match Pairing",
        matchPairingDesc: "AI creates fair match combinations based on skill level",
        aiAnalytics: "AI Analytics",
        aiAnalyticsDesc: "Get performance insights and recommendations for improvement",
        transparency: "Transparency",
        transparencyDesc: "Clear payment tracking and match results",
        fairness: "Fairness",
        fairnessDesc: "AI-powered fair match pairing",
        growth: "Growth",
        growthDesc: "Performance analytics to improve your game",
        community: "Community",
        communityDesc: "Building lasting friendships through sport",
        regularSessions: "Regular Sessions",
        regularSessionsDesc: "Every Saturday evening at 8:00 PM",
        equipment: "Equipment Provided",
        equipmentDesc: "Quality shuttlecocks for all matches",
        performance: "Performance Tracking",
        performanceDesc: "Detailed analytics and match history",
        aiAssistant: "AI Assistant",
        aiAssistantDesc: "Smart recommendations and insights",
        scheduleTime: "Every Saturday",
        scheduleTimeRange: "8:00 PM - 11:00 PM",
        whatsappDesc: "Join our community chat",
        whatsappDesc2: "for updates and discussions",
        locationName: "GOR Badminton Wisma Harapan",
        locationCity: "Tangerang, Banten",
        communityHeading: "Join Our Growing Community",
        communitySubtitle: "Be part of a thriving badminton community that's making sports more accessible and enjoyable for everyone",
        members: "Active Members",
        matchesPlayed: "Matches Played",
        attendance: "Attendance Rate",
        yearsStrong: "Years Strong"
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
        joinCommunity: "Gabung Komunitas Kami",
        how: "Cara Kerjanya",
        checkin: "Presensi",
        checkinDesc: "Anggota tiba dan memindai QR atau GPS untuk presensi",
        autoPayment: "Pembayaran Otomatis",
        autoPaymentDesc: "Sistem menghitung biaya otomatis dan kirim pengingat pembayaran",
        matchPairing: "Penyusunan Pertandingan",
        matchPairingDesc: "AI membuat kombinasi pertandingan adil berdasarkan skill",
        aiAnalytics: "Analitik AI",
        aiAnalyticsDesc: "Dapatkan wawasan performa dan rekomendasi perbaikan",
        transparency: "Transparansi",
        transparencyDesc: "Pelacakan pembayaran dan hasil pertandingan yang jelas",
        fairness: "Keadilan",
        fairnessDesc: "Penyusunan pertandingan yang adil bertenaga AI",
        growth: "Pertumbuhan",
        growthDesc: "Analitik performa untuk meningkatkan permainan Anda",
        community: "Komunitas",
        communityDesc: "Membangun persahabatan berkelanjutan melalui olahraga",
        regularSessions: "Sesi Reguler",
        regularSessionsDesc: "Setiap Sabtu malam pukul 8:00 PM",
        equipment: "Peralatan Disediakan",
        equipmentDesc: "Shuttlecock berkualitas untuk semua pertandingan",
        performance: "Pelacakan Performa",
        performanceDesc: "Analitik detail dan riwayat pertandingan",
        aiAssistant: "Asisten AI",
        aiAssistantDesc: "Rekomendasi dan wawasan pintar",
        scheduleTime: "Setiap Sabtu",
        scheduleTimeRange: "8:00 PM - 11:00 PM",
        whatsappDesc: "Bergabunglah dengan chat komunitas kami",
        whatsappDesc2: "untuk update dan diskusi",
        locationName: "GOR Badminton Wisma Harapan",
        locationCity: "Tangerang, Banten",
        communityHeading: "Bergabunglah dengan Komunitas Kami yang Berkembang",
        communitySubtitle: "Jadilah bagian dari komunitas bulu tangkis yang berkembang pesat dan membuat olahraga lebih mudah diakses dan menyenangkan bagi semua orang",
        members: "Anggota Aktif",
        matchesPlayed: "Pertandingan Dimainkan",
        attendance: "Tingkat Kehadiran",
        yearsStrong: "Tahun Kuat"
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
        {/* New Hero Section */}
        <div className="relative min-h-screen overflow-hidden bg-black">
          {/* Gradient background with grain effect */}
          <div className="flex flex-col items-end absolute -right-60 -top-10 blur-xl z-0 ">
            <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-purple-600 to-sky-600"></div>
            <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-pink-900 to-yellow-400"></div>
            <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-yellow-600 to-sky-500"></div>
          </div>
          <div className="absolute inset-0 z-0 bg-noise opacity-30"></div>

          {/* Content container */}
          <div className="relative z-10">
            {/* Navigation */}
            <nav className="container mx-auto flex items-center justify-between px-4 py-4">
              <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                <div className="bg-white rounded-full p-2">
                  <Image
                    src="/dlob.png"
                    alt="DLOB"
                    width={64}
                    height={64}
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors">
                  {language === 'en' ? 'Home' : 'Beranda'}
                </Link>
                <Link href="/about" className="text-sm text-gray-300 hover:text-white transition-colors">
                  {language === 'en' ? 'About' : 'Tentang'}
                </Link>
                <Link href="/gallery" className="text-sm text-gray-300 hover:text-white transition-colors">
                  {language === 'en' ? 'Gallery' : 'Gallery'}
                </Link>
                <Link href="/store" className="text-sm text-gray-300 hover:text-white transition-colors">
                  {language === 'en' ? 'Store' : 'Store'}
                </Link>
                <Link href="/artikel" className="text-sm text-gray-300 hover:text-white transition-colors">
                  {language === 'en' ? 'Articles' : 'Artikel'}
                </Link>
                <Link href="/contact" className="text-sm text-gray-300 hover:text-white transition-colors">
                  {language === 'en' ? 'Contact' : 'Kontak'}
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                {/* Language Toggle */}
                <select 
                  className="px-3 py-2 text-sm border border-gray-600 rounded-lg bg-black text-white hover:border-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-colors"
                  style={{
                    colorScheme: 'dark'
                  }}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>🇺🇸 EN</option>
                  <option value="id" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>🇮🇩 ID</option>
                </select>

                {user ? (
                  <Link href={user.role === 'admin' ? "/admin" : "/dashboard"} className="rounded-full bg-white px-6 py-2 text-sm font-medium text-black hover:bg-white/90 transition-colors">
                    {t.cta.dashboard}
                  </Link>
                ) : (
                  <Link href="/login" className="rounded-full bg-white px-6 py-2 text-sm font-medium text-black hover:bg-white/90 transition-colors">
                    {language === 'en' ? 'Login' : 'Masuk'}
                  </Link>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Toggle menu</span>
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-white" />
                ) : (
                  <Menu className="h-6 w-6 text-white" />
                )}
              </button>
            </nav>

            {/* Mobile Navigation Menu with animation */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ y: "-100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-100%" }}
                  transition={{ duration: 0.3 }}
                  className="fixed inset-0 z-50 flex flex-col p-4 bg-black/95 md:hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-white rounded-full p-2">
                        <Image
                          src="/dlob.png"
                          alt="DLOB"
                          width={40}
                          height={40}
                          className="object-contain"
                          priority
                        />
                      </div>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)}>
                      <X className="h-6 w-6 text-white" />
                    </button>
                  </div>
                  <div className="mt-8 flex flex-col space-y-6">
                    <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between border-b border-gray-800 pb-2 text-lg text-white hover:text-gray-300">
                      <span>{language === 'en' ? 'Home' : 'Beranda'}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </Link>
                    <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between border-b border-gray-800 pb-2 text-lg text-white hover:text-gray-300">
                      <span>{language === 'en' ? 'About' : 'Tentang'}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </Link>
                    <Link href="/gallery" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between border-b border-gray-800 pb-2 text-lg text-white hover:text-gray-300">
                      <span>{language === 'en' ? 'Gallery' : 'Gallery'}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </Link>
                    <Link href="/store" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between border-b border-gray-800 pb-2 text-lg text-white hover:text-gray-300">
                      <span>{language === 'en' ? 'Store' : 'Store'}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </Link>
                    <Link href="/artikel" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between border-b border-gray-800 pb-2 text-lg text-white hover:text-gray-300">
                      <span>{language === 'en' ? 'Articles' : 'Artikel'}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </Link>
                    <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between border-b border-gray-800 pb-2 text-lg text-white hover:text-gray-300">
                      <span>{language === 'en' ? 'Contact' : 'Kontak'}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </Link>
                    <div className="pt-4 space-y-3">
                      {/* Language Toggle in Mobile */}
                      <select 
                        className="w-full px-3 py-2 text-sm border border-gray-600 rounded-lg bg-black text-white hover:border-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-colors"
                        style={{
                          colorScheme: 'dark'
                        }}
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        <option value="en" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>🇺🇸 EN</option>
                        <option value="id" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>🇮🇩 ID</option>
                      </select>

                      {user ? (
                        <Link href={user.role === 'admin' ? "/admin" : "/dashboard"} onClick={() => setMobileMenuOpen(false)} className="w-full block border border-gray-700 text-white px-4 py-2 text-center hover:bg-white/10 rounded">
                          {t.cta.dashboard}
                        </Link>
                      ) : (
                        <>
                          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full block border border-gray-700 text-white px-4 py-2 text-center hover:bg-white/10 rounded">
                            {t.cta.login}
                          </Link>
                          <Link href="/register" className="h-12 rounded-full bg-white px-8 text-base font-medium text-black hover:bg-white/90 flex items-center justify-center w-full">
                            {t.cta.join}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Badge */}
            <div className="mx-auto mt-6 flex max-w-fit items-center justify-center space-x-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="text-sm font-medium text-white">
                {language === 'en' ? 'Join the badminton revolution!' : 'Bergabung dengan revolusi bulu tangkis!'}
              </span>
              <ArrowRight className="h-4 w-4 text-white" />
            </div>

            {/* Hero section */}
            <div className="container mx-auto mt-12 px-4 text-center">
              <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                {t.hero.title.includes('DLOB') ? (
                  <>
                    {t.hero.title.split('DLOB')[0]}
                    <MorphingTextReveal 
                      texts={["D'LOB", "DLOB", "DLOBBC"]} 
                      interval={3000}
                      className="text-5xl md:text-6xl lg:text-7xl font-bold"
                      glitchOnHover={true}
                    />
                    {t.hero.title.split('DLOB')[1]}
                  </>
                ) : (
                  t.hero.title
                )}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
                {t.hero.subtitle}
              </p>
              <div className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                {user ? (
                  <>
                    <Link href={user.role === 'admin' ? "/admin" : "/dashboard"} className="h-12 rounded-full bg-white px-8 text-base font-medium text-black hover:bg-white/90 flex items-center justify-center">
                      {t.cta.dashboard}
                    </Link>
                    <Link href="/matches" className="h-12 rounded-full border border-gray-600 px-8 text-base font-medium text-white hover:bg-white/10 flex items-center justify-center">
                      {t.cta.viewMatches}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="h-12 rounded-full bg-white px-8 text-base font-medium text-black hover:bg-white/90 flex items-center justify-center">
                      {t.hero.loginToDashboard}
                    </Link>
                    <Link href="/register" className="h-12 rounded-full border border-gray-600 px-8 text-base font-medium text-white hover:bg-white/10 flex items-center justify-center">
                      {t.cta.join}
                    </Link>
                  </>
                )}
              </div>

              {/* System Flow Diagram */}
              <div className="mt-20 pt-8 border-t border-gray-700">
                <p className="text-center text-sm text-gray-400 mb-8">
                  {t.contact.how}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                  {/* Card 1 */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-all duration-300 animate-fade-in" style={{animationDelay: '0s'}}>
                    <div className="bg-blue-500/20 rounded-lg p-3 mb-3 w-fit">
                      <Calendar className="h-6 w-6 text-blue-300" />
                    </div>
                    <h5 className="text-sm font-semibold text-white mb-1">
                      {t.contact.checkin}
                    </h5>
                    <p className="text-xs text-gray-400">
                      {t.contact.checkinDesc}
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-all duration-300 animate-fade-in" style={{animationDelay: '0.1s'}}>
                    <div className="bg-green-500/20 rounded-lg p-3 mb-3 w-fit">
                      <svg className="h-6 w-6 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h5 className="text-sm font-semibold text-white mb-1">
                      {t.contact.autoPayment}
                    </h5>
                    <p className="text-xs text-gray-400">
                      {t.contact.autoPaymentDesc}
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-all duration-300 animate-fade-in" style={{animationDelay: '0.2s'}}>
                    <div className="bg-purple-500/20 rounded-lg p-3 mb-3 w-fit">
                      <Users className="h-6 w-6 text-purple-300" />
                    </div>
                    <h5 className="text-sm font-semibold text-white mb-1">
                      {t.contact.matchPairing}
                    </h5>
                    <p className="text-xs text-gray-400">
                      {t.contact.matchPairingDesc}
                    </p>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-all duration-300 animate-fade-in" style={{animationDelay: '0.3s'}}>
                    <div className="bg-orange-500/20 rounded-lg p-3 mb-3 w-fit">
                      <Bot className="h-6 w-6 text-orange-300" />
                    </div>
                    <h5 className="text-sm font-semibold text-white mb-1">
                      {t.contact.aiAnalytics}
                    </h5>
                    <p className="text-xs text-gray-400">
                      {t.contact.aiAnalyticsDesc}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      {/* Smooth Transition Section */}
      <div className="h-32 bg-gradient-to-b from-black via-gray-900 to-white"></div>

      {/* About Section */}
      <AboutSection language={language as 'en' | 'id'} />

      {/* Gallery Section */}
      {!isLoadingGallery && galleryImages.length > 0 && (
        <>
          <GallerySection
            title={language === 'en' ? 'Photo Gallery' : 'Galeri Foto'}
            subtitle={language === 'en' ? 'See our community in action! Browse through moments from our regular badminton sessions and community events.' : 'Lihat komunitas kami dalam aksi! Jelajahi momen-momen dari sesi bulu tangkis reguler kami dan acara komunitas.'}
            images={galleryImages}
          />
          
          {/* More Images Button */}
          <div className="flex justify-center py-8 bg-white">
            <Link href="/gallery">
              <button className="relative group px-8 py-3 font-semibold text-white rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 bg-gradient-to-r from-pink-600 to-yellow-500">
                <span className="relative z-10 flex items-center gap-2">
                  {language === 'en' ? 'View More Images' : 'Lihat Lebih Banyak Foto'}
                  <ArrowRight className="h-5 w-5" />
                </span>
              </button>
            </Link>
          </div>
        </>
      )}

      {/* Contact Section */}
      <section id="contact" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold text-gray-900 mb-4">{t.contact.title}</h3>
              <div className="w-16 h-1 bg-gray-300 mx-auto rounded-full mb-8"></div>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                {t.contact.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Schedule Card */}
              <div className="group bg-gray-50 rounded-lg p-8 hover:bg-gray-100 transition-colors duration-300 border border-gray-200">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center group-hover:bg-gray-300 transition-colors">
                    <Calendar className="h-6 w-6 text-gray-700" />
                  </div>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">{t.contact.schedule}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{t.contact.scheduleTime}<br /><span className="font-medium">{t.contact.scheduleTimeRange}</span></p>
              </div>

              {/* WhatsApp Card - Clickable */}
              <div 
                onClick={() => window.open('https://wa.me/6281270737272', '_blank')}
                className="group bg-gray-50 rounded-lg p-8 hover:bg-gray-100 transition-colors duration-300 border border-gray-200 cursor-pointer hover:border-gray-300"
              >
                <div className="mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center group-hover:bg-gray-300 transition-colors">
                    <Users className="h-6 w-6 text-gray-700" />
                  </div>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">{t.contact.whatsapp}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{t.contact.whatsappDesc}<br />{t.contact.whatsappDesc2}</p>
              </div>

              {/* Location Card */}
              <div className="group bg-gray-50 rounded-lg p-8 hover:bg-gray-100 transition-colors duration-300 border border-gray-200">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center group-hover:bg-gray-300 transition-colors">
                    <Trophy className="h-6 w-6 text-gray-700" />
                  </div>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">{t.contact.location}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{t.contact.locationName}<br /><span className="font-medium">{t.contact.locationCity}</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">{language === 'en' ? 'Ready to Join?' : 'Siap Bergabung?'}</h3>
            <div className="w-16 h-1 bg-gray-300 mx-auto rounded-full mb-8"></div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {language === 'en' 
                ? 'Getting started with DLOB is simple. Follow these steps to become part of our growing badminton community.' 
                : 'Memulai dengan DLOB sangat mudah. Ikuti langkah-langkah ini untuk menjadi bagian dari komunitas bulu tangkis kami yang terus berkembang.'}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Vertical line connector */}
              <div className="absolute left-[19px] top-12 bottom-0 w-0.5 bg-gray-300 hidden md:block"></div>

              <div className="space-y-8">
                {/* Step 1 */}
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-900 text-white font-semibold text-sm">
                      1
                    </div>
                  </div>
                  <div className="pt-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {language === 'en' ? 'Contact Us' : 'Hubungi Kami'}
                    </h4>
                    <p className="text-gray-600">
                      {language === 'en' 
                        ? 'Click the WhatsApp card in the Contact section above to reach out to us'
                        : 'Klik kartu WhatsApp di bagian Kontak di atas untuk menghubungi kami'}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-900 text-white font-semibold text-sm">
                      2
                    </div>
                  </div>
                  <div className="pt-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {language === 'en' ? 'Select Your First Match' : 'Pilih Pertandingan Pertama Anda'}
                    </h4>
                    <p className="text-gray-600">
                      {language === 'en' 
                        ? 'Choose a Saturday that works best for you and join our community'
                        : 'Pilih hari Sabtu yang paling sesuai untuk Anda dan bergabunglah dengan komunitas kami'}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-900 text-white font-semibold text-sm">
                      3
                    </div>
                  </div>
                  <div className="pt-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {language === 'en' ? 'Show Up & Play' : 'Datang & Bermain'}
                    </h4>
                    <p className="text-gray-600">
                      {language === 'en' 
                        ? 'Check in at GOR Badminton Wisma Harapan and play with the community'
                        : 'Presensi di GOR Badminton Wisma Harapan dan bermain dengan komunitas'}
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-900 text-white font-semibold text-sm">
                      4
                    </div>
                  </div>
                  <div className="pt-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {language === 'en' ? 'Track & Improve' : 'Lacak & Tingkatkan'}
                    </h4>
                    <p className="text-gray-600">
                      {language === 'en' 
                        ? 'Use the DLOB dashboard to track your progress and get AI-powered insights'
                        : 'Gunakan dashboard DLOB untuk melacak kemajuan Anda dan dapatkan wawasan bertenaga AI'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-16 text-center">
              <Link
                href="#contact"
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-pink-600 to-yellow-500 text-white rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
              >
                {language === 'en' ? 'Get Started Now' : 'Mulai Sekarang'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

        <Footer />
    </div>
    </>
  );
}
