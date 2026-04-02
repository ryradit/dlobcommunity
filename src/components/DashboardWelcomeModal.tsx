'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Trophy, Dumbbell, BarChart3, MessageSquare, Zap, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react';

interface DashboardWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName?: string;
}

export default function DashboardWelcomeModal({ isOpen, onClose, memberName = 'Member' }: DashboardWelcomeModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setCurrentSlide(0);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  const slides = [
    {
      icon: BookOpen,
      title: `Selamat Datang, ${memberName}! 👋`,
      subtitle: 'DLOB MEMBER DASHBOARD',
      description: 'Mari jelajahi semua fitur yang tersedia untuk meningkatkan pengalaman Anda dalam mengelola pembayaran, melihat statistik, dan melatih skill badminton.',
      bgGradient: 'from-blue-600 to-purple-600',
    },
    {
      icon: TrendingUp,
      title: 'Ringkasan Pembayaran',
      subtitle: 'KELOLA KEUANGAN',
      description: 'Lihat total pembayaran yang masih pending dan yang sudah lunas. Pantau status membership bulanan Anda dengan mudah dan real-time untuk menghindari penunggakan.',
      bgGradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Trophy,
      title: 'Head-to-Head Comparison',
      subtitle: 'BANDINGKAN PERFORMA',
      description: 'Bandingkan performa Anda dengan pemain lain. Lihat win rate, statistik pertandingan, dan position Anda di leaderboard komunitas.',
      bgGradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Dumbbell,
      title: 'Training Center',
      subtitle: 'TINGKATKAN SKILL',
      description: 'Akses program latihan komprehensif dan tips profesional untuk meningkatkan performa bermain badminton Anda secara konsisten dan terukur.',
      bgGradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: BarChart3,
      title: 'Analitik & Insight',
      subtitle: 'DATA PERFORMA ANDA',
      description: 'Analisis mendalam tentang performa dengan grafik interaktif dan statistik detail yang berbasis pada data real dari setiap pertandingan Anda.',
      bgGradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: MessageSquare,
      title: 'AI Chat Assistant',
      subtitle: 'DUKUNGAN INSTAN',
      description: 'Dapatkan jawaban instan tentang pertandingan, pembayaran, dan tips performa melalui AI Assistant kami yang tersedia kapan saja 24/7.',
      bgGradient: 'from-indigo-500 to-blue-500',
    },
  ];

  const currentData = slides[currentSlide];
  const CurrentIcon = currentData.icon;

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[90vh] max-h-[620px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-300 flex ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Left Side - Feature Visualization */}
        <div className={`hidden md:flex flex-1 bg-linear-to-br ${currentData.bgGradient} relative overflow-hidden items-center justify-center p-8`}>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/30 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative z-10 w-full">
            {currentSlide === 0 ? (
              // Welcome slide - Show all features grid
              <div className="grid grid-cols-2 gap-3">
                {slides.slice(1).map((slide, index) => {
                  const SlideIcon = slide.icon;
                  return (
                    <div key={index} className="p-4 bg-white/20 backdrop-blur-sm rounded-xl text-center">
                      <SlideIcon className="w-6 h-6 text-white mx-auto mb-2" />
                      <p className="text-white text-xs font-semibold line-clamp-2">{slide.title}</p>
                    </div>
                  );
                })}
              </div>
            ) : currentSlide === 1 ? (
              // Payment - Show payment cards
              <div className="space-y-3">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl border-2 border-white/30">
                  <p className="text-white/60 text-xs uppercase tracking-widest font-bold">Total Pending</p>
                  <p className="text-white text-xl font-bold mt-1">Rp 500.000</p>
                  <p className="text-white/70 text-xs mt-2">2 pertandingan</p>
                </div>
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl border-2 border-white/30">
                  <p className="text-white/60 text-xs uppercase tracking-widest font-bold">Total Lunas</p>
                  <p className="text-white text-xl font-bold mt-1">Rp 2.500.000</p>
                  <p className="text-white/70 text-xs mt-2">8 pertandingan</p>
                </div>
              </div>
            ) : currentSlide === 2 ? (
              // Head-to-Head - Show player comparison
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-xl p-3">
                  <div className="text-center">
                    <p className="text-white text-2xl font-bold">Anda</p>
                    <p className="text-white/70 text-xs mt-1">72% WR</p>
                  </div>
                  <div className="text-white text-sm font-semibold">VS</div>
                  <div className="text-center">
                    <p className="text-white text-2xl font-bold">Pemain</p>
                    <p className="text-white/70 text-xs mt-1">68% WR</p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <div className="bg-white/30 h-8 rounded-full mb-2"></div>
                  <div className="bg-white/20 h-8 rounded-full"></div>
                  <p className="text-white/70 text-xs mt-3">Leaderboard Rank: #2</p>
                </div>
              </div>
            ) : currentSlide === 3 ? (
              // Training - Show training modules
              <div className="space-y-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border-l-4 border-white">
                  <p className="text-white text-sm font-semibold">Teknik Pukulan</p>
                  <div className="bg-white/20 h-1 rounded mt-2"></div>
                  <p className="text-white/70 text-xs mt-1">8/12 selesai</p>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border-l-4 border-white/60">
                  <p className="text-white text-sm font-semibold">Strategi Permainan</p>
                  <div className="bg-white/20 h-1 rounded mt-2"></div>
                  <p className="text-white/70 text-xs mt-1">3/10 selesai</p>
                </div>
              </div>
            ) : currentSlide === 4 ? (
              // Analytics - Show chart-like visualization
              <div className="space-y-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white text-xs uppercase tracking-widest font-bold mb-3">Performa Bulan Ini</p>
                  <div className="flex items-end justify-around h-20 gap-2">
                    <div className="flex-1 bg-white/40 rounded-t" style={{ height: '60%' }}></div>
                    <div className="flex-1 bg-white/40 rounded-t" style={{ height: '75%' }}></div>
                    <div className="flex-1 bg-white/40 rounded-t" style={{ height: '90%' }}></div>
                    <div className="flex-1 bg-white/40 rounded-t" style={{ height: '80%' }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 text-center">
                    <p className="text-white text-xs">Win Rate</p>
                    <p className="text-white font-bold text-sm">73%</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 text-center">
                    <p className="text-white text-xs">Total Matches</p>
                    <p className="text-white font-bold text-sm">18</p>
                  </div>
                </div>
              </div>
            ) : (
              // AI Chat - Show chat bubbles
              <div className="space-y-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 ml-auto max-w-[80%]">
                  <p className="text-white text-xs">Berapa total pembayaran saya?</p>
                </div>
                <div className="bg-white/30 backdrop-blur-sm rounded-xl p-3 max-w-[80%]">
                  <p className="text-white text-xs">Total pembayaran Anda adalah Rp 2.500.000 dengan status lunas ✓</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 ml-auto max-w-[80%]">
                  <p className="text-white text-xs">Terima kasih!</p>
                </div>
              </div>
            )}
          </div>

          {/* Close button on left side */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors text-white z-20"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Right Side - Content */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 bg-white dark:bg-zinc-900 relative">
          {/* Close button for mobile */}
          <button
            onClick={handleClose}
            className="md:hidden absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors z-20"
          >
            <X className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>

          {/* Content */}
          <div className="mt-6 md:mt-0">
            {currentSlide === 0 && (
              <div className="md:hidden p-6 bg-linear-to-br from-blue-600 to-purple-600 rounded-xl mb-6">
                <div className="p-4 bg-white/20 rounded-2xl inline-block mb-4">
                  <CurrentIcon className="w-12 h-12 text-white" />
                </div>
              </div>
            )}

            <p className="text-xs uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400 mb-2">
              {currentData.subtitle}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              {currentData.title}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed">
              {currentData.description}
            </p>
          </div>

          {/* Footer */}
          <div className="space-y-4 mt-8">
            {/* Progress Dots */}
            <div className="flex justify-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    index === currentSlide
                      ? 'w-8 bg-gray-900 dark:bg-white'
                      : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-2 md:gap-3">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="px-3 md:px-4 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              <button
                onClick={handleClose}
                className="px-4 md:px-6 py-2 rounded-lg bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-900 dark:text-white transition-colors text-sm font-medium"
              >
                Lewati
              </button>

              {currentSlide === slides.length - 1 ? (
                <button
                  onClick={handleClose}
                  className="px-4 md:px-8 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors inline-flex items-center gap-2 text-sm"
                >
                  <span className="hidden sm:inline">Mulai</span>
                  <span className="sm:hidden">OK</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={nextSlide}
                  className="px-4 md:px-8 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors inline-flex items-center gap-2 text-sm"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
