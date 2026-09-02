'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface GalleryItem {
  src: string;
  tag: string;
  title: string;
  subtitle: string;
  roundedClass: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    src: "/images/potrait/IMG_1999.jpg",
    tag: "MATCH HIGHLIGHT",
    title: "Sparring.",
    subtitle: "GOR Wisma Harapan",
    roundedClass: "rounded-[36px] rounded-bl-[8px]",
  },
  {
    src: "/images/potrait/IMG_2039.jpg",
    tag: "TOURNAMENT",
    title: "Championship.",
    subtitle: "Rally & smash terbaik",
    roundedClass: "rounded-[36px] rounded-tr-[8px]",
  },
  {
    src: "/images/potrait/IMG_2046.jpg",
    tag: "COMMUNITY",
    title: "Together.",
    subtitle: "Kebersamaan member",
    roundedClass: "rounded-tl-[56px] rounded-br-[56px] rounded-tr-[20px] rounded-bl-[20px]",
  },
  {
    src: "/images/potrait/IMG_2035.jpg",
    tag: "TRAINING DRILL",
    title: "Power.",
    subtitle: "Latihan rutin mingguan",
    roundedClass: "rounded-tr-[56px] rounded-bl-[56px] rounded-tl-[20px] rounded-br-[20px]",
  },
  {
    src: "/images/potrait/IMG_2049.jpg",
    tag: "SOLIDARITY",
    title: "Passion.",
    subtitle: "Semangat olahraga badminton",
    roundedClass: "rounded-t-[56px] rounded-b-[20px]",
  },
  {
    src: "/images/potrait/IMG_2129.jpg",
    tag: "FINAL PODIUM",
    title: "Victory.",
    subtitle: "Perayaan juara turnamen",
    roundedClass: "rounded-[36px] rounded-br-[8px]",
  },
];

const leftColVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const childVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 16 },
  },
};

export default function GallerySection() {
  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [secretIndexes, setSecretIndexes] = useState<number[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const totalImages = GALLERY_ITEMS.length;
    const numSecrets = 2;
    const randomIndexes: number[] = [];
    while (randomIndexes.length < numSecrets) {
      const randomIndex = Math.floor(Math.random() * totalImages);
      if (!randomIndexes.includes(randomIndex)) randomIndexes.push(randomIndex);
    }
    setSecretIndexes(randomIndexes);
  }, []);

  const checkScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      const cardWidth = 280; // responsive approximate width
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(Math.max(0, index), GALLERY_ITEMS.length - 1));
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth * 0.8;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleImageClick = (idx: number) => {
    if (secretIndexes.includes(idx)) router.push('/versus-game');
  };

  return (
    <section id="gallery" className="w-full py-16 md:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">

          {/* Left Column */}
          <motion.div
            className="lg:col-span-4 space-y-6"
            variants={leftColVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.div variants={childVariant}>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4382C8] mb-3">
                <span className="w-6 h-[2px] bg-[#4382C8]" />
                Galeri Kami
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-[1.1]">
                Koleksi Foto<br />Terbaik DLOB
              </h2>
            </motion.div>

            <motion.p variants={childVariant} className="text-slate-500 leading-relaxed text-sm sm:text-base">
              Saksikan momen-momen seru dari pertandingan, turnamen, dan latihan rutin badminton kami. Setiap foto menceritakan kisah dedikasi dan kebersamaan komunitas DLOB.
            </motion.p>

            {/* Slide Progress Indicator */}
            <motion.div variants={childVariant} className="flex gap-1.5 items-center pt-1">
              {GALLERY_ITEMS.map((_, i) => (
                <span
                  key={i}
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: i === activeIndex ? '28px' : '8px',
                    background: i === activeIndex ? '#4382C8' : '#d1d5db',
                  }}
                />
              ))}
            </motion.div>

            {/* Controls */}
            <motion.div variants={childVariant} className="flex items-center gap-4">
              <button
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-gray-200 hover:border-zinc-950 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 active:scale-95"
                aria-label="Foto sebelumnya"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-900" />
              </button>

              <button
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md active:scale-95"
                aria-label="Foto selanjutnya"
              >
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>

              <Link
                href="/galeri"
                className="ml-auto text-xs sm:text-sm font-bold text-[#4382C8] hover:text-[#285d9b] underline underline-offset-4 transition-colors"
              >
                Lihat Semua →
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column: Slider */}
          <div className="lg:col-span-8 relative min-w-0">
            {/* Fade edge */}
            <div className="hidden sm:block absolute right-0 top-0 bottom-8 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <div
              ref={sliderRef}
              onScroll={checkScroll}
              className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 sm:pb-8 pt-2 px-1 scroll-smooth snap-x snap-mandatory touch-pan-x"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {GALLERY_ITEMS.map((item, idx) => (
                <motion.div
                  key={idx}
                  onClick={() => handleImageClick(idx)}
                  className={`relative shrink-0 snap-start w-[240px] sm:w-[280px] md:w-[320px] aspect-[9/14] sm:aspect-[9/15] group overflow-hidden cursor-pointer ${item.roundedClass}`}
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ delay: idx * 0.05, type: 'spring', stiffness: 90, damping: 18 }}
                  style={{
                    filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.14))',
                  }}
                  whileHover={{
                    y: -6,
                    filter: 'drop-shadow(0 20px 36px rgba(67,130,200,0.28))',
                    transition: { type: 'spring', stiffness: 300, damping: 20 },
                  }}
                >
                  <div className="relative w-full h-full bg-gradient-to-br from-[#4382C8] to-[#1c4573]">
                    <Image
                      src={item.src}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-[1.05] transition-transform duration-700"
                      sizes="(max-width: 640px) 240px, (max-width: 768px) 280px, 320px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

                    {/* Tag */}
                    <div className="absolute top-5 left-5 z-10">
                      <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-white/90 drop-shadow-md">
                        {item.tag}
                      </p>
                    </div>

                    {/* Bottom text */}
                    <div className="absolute bottom-6 left-5 right-5 z-10 text-white">
                      <h3 className="font-serif italic text-2xl sm:text-3xl text-white tracking-tight drop-shadow-md leading-tight mb-0.5">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-white/80 font-sans font-medium drop-shadow-sm">
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Easter Egg */}
                    {secretIndexes.includes(idx) && (
                      <div className="absolute top-5 right-5 bg-yellow-400/90 backdrop-blur-md text-zinc-950 p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
