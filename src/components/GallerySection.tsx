'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { CoverflowCarousel, CoverflowSlide } from '@/components/ui/coverflow-carousel';

interface GalleryItemData {
  src: string;
  alt: string;
  tag: string;
  title: string;
  subtitle: string;
}

const GALLERY_DATA: GalleryItemData[] = [
  {
    src: "/images/potrait/IMG_1999.jpg",
    alt: "Sparring Intense di GOR Wisma Harapan",
    tag: "MATCH HIGHLIGHT",
    title: "Sparring Intense",
    subtitle: "GOR Wisma Harapan",
  },
  {
    src: "/images/potrait/IMG_2039.jpg",
    alt: "Turnamen Championship Drive DLOB",
    tag: "TOURNAMENT",
    title: "Championship Drive",
    subtitle: "Rally & smash terbaik",
  },
  {
    src: "/images/potrait/IMG_2046.jpg",
    alt: "Together Stronger Member DLOB",
    tag: "COMMUNITY",
    title: "Together Stronger",
    subtitle: "Kebersamaan member",
  },
  {
    src: "/images/potrait/IMG_2035.jpg",
    alt: "Power & Agility Training Rutin",
    tag: "TRAINING DRILL",
    title: "Power & Agility",
    subtitle: "Latihan rutin mingguan",
  },
  {
    src: "/images/potrait/IMG_2049.jpg",
    alt: "Passion on Court Bulu Tangkis",
    tag: "SOLIDARITY",
    title: "Passion on Court",
    subtitle: "Semangat olahraga badminton",
  },
  {
    src: "/images/potrait/IMG_2129.jpg",
    alt: "Victory Moment Turnamen Juara",
    tag: "FINAL PODIUM",
    title: "Victory Moment",
    subtitle: "Perayaan juara turnamen",
  },
];

export default function GallerySection() {
  const router = useRouter();
  const [secretIndexes, setSecretIndexes] = useState<number[]>([]);

  // Randomize 2 secret easter-egg cards that launch the Versus mini-game
  useEffect(() => {
    const totalImages = GALLERY_DATA.length;
    const numSecrets = 2;
    const randomIndexes: number[] = [];
    while (randomIndexes.length < numSecrets) {
      const randomIndex = Math.floor(Math.random() * totalImages);
      if (!randomIndexes.includes(randomIndex)) randomIndexes.push(randomIndex);
    }
    setSecretIndexes(randomIndexes);
  }, []);

  const handleCardClick = (idx: number) => {
    if (secretIndexes.includes(idx)) {
      router.push('/versus-game');
    }
  };

  const slides: CoverflowSlide[] = useMemo(() => {
    return GALLERY_DATA.map((item, idx) => ({
      src: item.src,
      alt: item.alt,
      tag: item.tag,
      title: item.title,
      subtitle: item.subtitle,
      isSecret: secretIndexes.includes(idx),
    }));
  }, [secretIndexes]);

  return (
    <section id="gallery" className="w-full py-20 sm:py-28 md:py-32 bg-zinc-50/70 border-y border-zinc-200/70 overflow-hidden relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#4382C8]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-4">

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 tracking-tight leading-[1.08]"
          >
            Momen & Aksi <span className="text-[#4382C8]">Di Lapangan.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto"
          >
            Dokumentasi sparring, turnamen resmi, dan latihan rutin mingguan. Geser atau lempar kartu untuk menelusuri aksi komunitas secara interaktif.
          </motion.p>
        </div>

        {/* 3D Coverflow Carousel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="relative"
        >
          <CoverflowCarousel
            slides={slides}
            cardWidth="clamp(230px, 28vw, 310px)"
            cardHeight="clamp(320px, 38vw, 430px)"
            rotate={36}
            depth={0.62}
            perspective={3.2}
            falloff={0.6}
            fade={0.12}
            gap={0.06}
            loop={true}
            showNavigation={true}
            showPagination={true}
            cardClassName="rounded-[2rem] border border-white/20 shadow-2xl overflow-hidden"
            onCardClick={(idx) => handleCardClick(idx)}
            renderCardOverlay={(slide, index) => (
              <>
                {/* Gradient Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/30 to-transparent pointer-events-none" />

                {/* Top Left: Category Tag */}
                {slide.tag && (
                  <div className="absolute top-4 left-4 z-10 pointer-events-none">
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-950/70 backdrop-blur-md text-white border border-white/20 shadow-sm">
                      {slide.tag}
                    </span>
                  </div>
                )}

                {/* Secret Easter Egg: Reveals on hover */}
                {secretIndexes.includes(index) && (
                  <div
                    className="absolute top-4 right-4 bg-amber-400 text-zinc-950 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 transform group-hover:scale-110 cursor-pointer"
                    title="Versus Mini-Game Rahasia!"
                  >
                    <Sparkles className="w-4 h-4 animate-spin text-zinc-950" />
                  </div>
                )}

                {/* Bottom Content */}
                <div className="absolute bottom-5 left-5 right-5 z-10 text-white pointer-events-none">
                  <h3 className="font-extrabold text-xl sm:text-2xl text-white tracking-tight leading-snug">
                    {slide.title}
                  </h3>
                  {slide.subtitle && (
                    <p className="text-xs sm:text-sm text-zinc-300 font-medium mt-0.5">
                      {slide.subtitle}
                    </p>
                  )}
                </div>

                {/* Subtle inner border */}
                <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/15 pointer-events-none" />
              </>
            )}
          />
        </motion.div>

        {/* Footer CTA */}
        <div className="mt-10 sm:mt-12 flex items-center justify-center pt-6 border-t border-zinc-200/60 max-w-5xl mx-auto">
          <Link
            href="/galeri"
            className="group inline-flex items-center gap-3 bg-zinc-950 hover:bg-zinc-900 text-white pl-6 pr-2.5 py-3 rounded-full font-bold transition-all text-xs sm:text-sm shadow-md active:scale-95 shrink-0"
          >
            <span>Buka Arsip Galeri</span>
            <div className="btn-nested-icon w-7 h-7 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-[#4382C8] transition-colors">
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </div>
          </Link>
        </div>

      </div>
    </section>
  );
}
