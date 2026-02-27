'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function FeaturesSection() {
  return (
    <section id="features-section" className="py-20 px-4 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Image */}
          <div className="relative">
            <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/images/potrait/IMG_7627.JPG"
                alt="DLOB Community"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            
            {/* Badge */}
            <div className="absolute bottom-8 left-8 bg-white rounded-full px-6 py-4 shadow-xl flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">A</div>
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">B</div>
                <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-bold">C</div>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">50+</div>
              </div>
              <div>
                <p className="text-slate-900 font-semibold text-sm">Bergabung dengan Komunitas</p>
                <p className="text-slate-600 text-xs">Badminton Kami</p>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className="text-slate-900 space-y-8">
            <div>
              <h3 className="text-[#3e6461] text-sm font-semibold mb-2 flex items-center gap-2">
                <span className="w-12 h-1 bg-[#3e6461]"></span>
                TENTANG KAMI
              </h3>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
                Platform Badminton Terpadu
              </h2>
            </div>

            <div className="space-y-4 text-slate-600">
              <p className="leading-relaxed">
                DLOB Community menyediakan solusi lengkap untuk mengelola komunitas badminton Anda dengan mudah dan efisien.
              </p>
              <p className="leading-relaxed">
                Dari manajemen anggota hingga penyelenggaraan turnamen, semua terintegrasi dalam satu platform yang user-friendly.
              </p>
              <p className="leading-relaxed">
                Bergabunglah dengan ribuan pemain dan klub badminton yang telah mempercayai kami.
              </p>
            </div>

            <Link href="/tentang" className="inline-flex items-center gap-3 bg-[#1e4843] hover:bg-[#162f2c] text-white px-8 py-3 rounded-full font-semibold transition-colors">
              Pelajari Selengkapnya
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
