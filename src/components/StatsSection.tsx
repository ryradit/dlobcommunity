'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const STATS = [
  { number: 50, suffix: '+', label: 'Anggota Aktif', description: 'Member terdaftar & aktif bermain' },
  { number: 100, suffix: '+', label: 'Pertandingan', description: 'Match & sesi sparring selesai' },
  { number: 5, suffix: '+', label: 'Tahun Berdiri', description: 'Komunitas solid dan terpercaya' },
  { number: null, suffix: '', label: 'AI Insights', description: 'Analitik bertenaga kecerdasan buatan' },
];

function CountUp({ target, suffix, duration = 1800 }: { target: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

const cardVariants = {
  hidden: { opacity: 0, y: 36, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.1, type: 'spring' as const, stiffness: 100, damping: 16 },
  }),
};

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section ref={sectionRef} className="relative py-24 text-white overflow-hidden glass-section-brand">
      {/* Badminton Court Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
          <rect x="100" y="50" width="400" height="300" fill="none" stroke="white" strokeWidth="2" />
          <line x1="300" y1="50" x2="300" y2="350" stroke="white" strokeWidth="2" />
          <line x1="100" y1="200" x2="500" y2="200" stroke="white" strokeWidth="2" />
          <line x1="100" y1="120" x2="500" y2="120" stroke="white" strokeWidth="1" strokeDasharray="5,5" />
          <line x1="100" y1="280" x2="500" y2="280" stroke="white" strokeWidth="1" strokeDasharray="5,5" />
          {/* Mirrored court lines right side */}
          <rect x="700" y="50" width="400" height="300" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" />
          <line x1="900" y1="50" x2="900" y2="350" stroke="white" strokeWidth="1.5" opacity="0.5" />
          <line x1="700" y1="200" x2="1100" y2="200" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>
      </div>

      {/* Animated shimmer overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Heading */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 mb-3">
            <span className="w-6 h-[1px] bg-white/50" />
            Pencapaian Kami
            <span className="w-6 h-[1px] bg-white/50" />
          </span>
          <h2 className="text-4xl md:text-5xl font-black mb-3 drop-shadow-sm tracking-tight">
            Komunitas Kami<br className="sm:hidden" /> dalam Angka
          </h2>
          <p className="text-white/80 text-base max-w-xl mx-auto font-medium">
            Perkembangan dan aktivitas member DLOB yang terus bertumbuh
          </p>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          {STATS.map((stat, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              className="group relative"
            >
              <motion.div
                className="relative backdrop-blur-xl bg-white/12 rounded-3xl p-6 text-center border border-white/25 shadow-lg overflow-hidden cursor-default"
                whileHover={{
                  scale: 1.06,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  transition: { type: 'spring', stiffness: 300, damping: 20 },
                }}
              >
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />

                {stat.number !== null ? (
                  <p className="text-4xl md:text-5xl font-black text-white mb-1.5 drop-shadow-sm relative">
                    <CountUp target={stat.number} suffix={stat.suffix} />
                  </p>
                ) : (
                  <div className="flex items-center justify-center h-[52px] md:h-[60px] mb-1.5 relative">
                    <span className="text-3xl md:text-4xl font-black text-white animate-pulse">✦</span>
                  </div>
                )}
                <p className="text-white font-bold text-sm md:text-base relative">{stat.label}</p>
                <p className="text-white/60 text-xs mt-1 leading-tight hidden md:block relative">{stat.description}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
