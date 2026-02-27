"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface CommunityCTAProps {
  className?: string;
}

export const CommunityCTA = ({ className = '' }: CommunityCTAProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <section className={`relative py-20 md:py-32 overflow-hidden ${className}`}>
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d4a42] via-[#1a5f56] to-[#0d4a42]" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-cyan-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="relative max-w-7xl mx-auto px-6 lg:px-8"
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Side - Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            >
              Mari Bergabung dengan Komunitas DLOB
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-teal-100 leading-relaxed max-w-2xl"
            >
              Dirancang untuk atlet. Dibangun untuk komunitas. Didedikasikan untuk 
              pengembangan talenta badminton. Selamat datang di platform yang dicintai 
              para pemain badminton.
            </motion.p>
          </div>

          {/* Right Side - CTA Action */}
          <motion.div
            variants={itemVariants}
            className="flex-shrink-0 w-full lg:w-auto"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-md mx-auto lg:mx-0">
              <Link
                href="/register"
                className="group relative px-8 py-4 bg-white text-teal-900 font-semibold rounded-lg transition-all duration-300 hover:bg-teal-50 hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
              >
                <span>Daftar Sekarang</span>
                <motion.div
                  animate={{
                    x: [0, 5, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                  }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </Link>

              <Link
                href="/tentang"
                className="px-8 py-4 bg-transparent border-2 border-white/30 text-white font-semibold rounded-lg transition-all duration-300 hover:bg-white/10 hover:border-white/50 backdrop-blur-sm flex items-center justify-center"
              >
                Pelajari Lebih Lanjut
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};
