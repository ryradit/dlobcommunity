'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, TrendingUp, BarChart3, Zap, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface HomepageWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HomepageWelcomeModal({ isOpen, onClose }: HomepageWelcomeModalProps) {
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
      icon: Users,
      title: 'Selamat Datang di DLOB',
      subtitle: 'PLATFORM BADMINTON KOMUNITAS',
      description: 'Platform digital untuk mengelola pertandingan badminton, pembayaran, dan meningkatkan skill bermain Anda dengan insights berbasis AI.',
      bgGradient: 'from-blue-600 to-purple-600',
    },
    {
      icon: Users,
      title: 'Bergabung dengan Komunitas',
      subtitle: 'LEBIH DARI 50+ PEMAIN AKTIF',
      description: 'Bersaing dengan pemain lain, lihat ranking, dan bangun hubungan dengan komunitas badminton yang solid dan terukur.',
      bgGradient: 'from-emerald-500 to-teal-600',
      stat: { number: '50+', label: 'Pemain Aktif' },
    },
    {
      icon: TrendingUp,
      title: 'Kelola Pertandingan & Pembayaran',
      subtitle: 'SISTEM PEMBAYARAN TERINTEGRASI',
      description: 'Pantau semua pertandingan Anda, kelola pembayaran dengan mudah, dan sistem membership yang transparan dan adil.',
      bgGradient: 'from-yellow-500 to-orange-500',
      stat: { number: '100+', label: 'Pertandingan Tercatat' },
    },
    {
      icon: Zap,
      title: 'AI-Powered Insights',
      subtitle: 'TEKNOLOGI ANALITIK CERDAS',
      description: 'Dapatkan analisis performa berbasis AI, rekomendasi personal untuk meningkatkan skill, dan prediksi yang akurat untuk strategi bermain.',
      bgGradient: 'from-indigo-600 to-blue-600',
      stat: { number: '24/7', label: 'AI Assistant Siap Membantu' },
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
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[90vh] max-h-620 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-300 flex ${
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
              // Welcome slide - Show all features
              <div className="space-y-4">
                <div className="p-6 bg-white/20 backdrop-blur-sm rounded-2xl border-2 border-white/30">
                  <p className="text-white/80 text-sm uppercase tracking-widest font-bold mb-2">Platform Digital Badminton</p>
                  <p className="text-white text-lg font-bold">Kelola • Pantau • Tingkatkan</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {slides.slice(1).map((slide, index) => {
                    const SlideIcon = slide.icon;
                    return (
                      <div key={index} className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                        <SlideIcon className="w-5 h-5 text-white mb-2" />
                        <p className="text-white text-xs font-semibold">{slide.title}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : currentSlide === 1 ? (
              // Community
              <div className="space-y-3">
                <div className="p-6 bg-white/20 backdrop-blur-sm rounded-2xl border-2 border-white/30 text-center">
                  <p className="text-white text-4xl font-bold">50+</p>
                  <p className="text-white/80 text-sm mt-2">Pemain Aktif Terdaftar</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-12 bg-white/20 rounded-lg backdrop-blur-sm"></div>
                  ))}
                </div>
                <p className="text-white/70 text-xs text-center">Komunitas yang solid dan terukur</p>
              </div>
            ) : currentSlide === 2 ? (
              // Payments
              <div className="space-y-3">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl border-2 border-white/30">
                  <p className="text-white/60 text-xs uppercase tracking-widest font-bold">Total Pertandingan</p>
                  <p className="text-white text-3xl font-bold mt-1">100+</p>
                </div>
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl border-l-4 border-white">
                  <p className="text-white text-sm font-semibold mb-2">Status Pembayaran</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-white/70">
                      <span>Lunas</span>
                      <span>75%</span>
                    </div>
                    <div className="bg-white/30 h-2 rounded-full overflow-hidden">
                      <div className="bg-white h-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>
                <div className="text-white/70 text-xs text-center">Transparansi penuh dalam setiap transaksi</div>
              </div>
            ) : (
              // AI
              <div className="space-y-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 ml-auto max-w-[85%] border border-white/30">
                  <p className="text-white text-xs">Bagaimana cara meningkatkan win rate saya?</p>
                </div>
                <div className="bg-white/30 backdrop-blur-sm rounded-xl p-3 max-w-[85%] border border-white/30">
                  <p className="text-white text-xs">Berdasarkan analisis performa Anda, kami merekomendasikan fokus pada service consistency dan positioning di court.</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 ml-auto max-w-[85%] border border-white/30">
                  <p className="text-white text-xs">Terima kasih! Sangat membantu 🙏</p>
                </div>
              </div>
            )}
          </div>

          {/* Close button */}
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

            {currentData.stat && (
              <div className="mt-6 p-4 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{currentData.stat.number}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{currentData.stat.label}</p>
              </div>
            )}
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
                <Link
                  href="/auth/signup"
                  onClick={handleClose}
                  className="px-4 md:px-8 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors inline-flex items-center gap-2 text-sm"
                >
                  <span className="hidden sm:inline">Daftar Sekarang</span>
                  <span className="sm:hidden">Daftar</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  onClick={nextSlide}
                  className="px-4 md:px-8 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors inline-flex items-center gap-2 text-sm"
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
