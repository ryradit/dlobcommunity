'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, Swords, Calendar, Cpu } from 'lucide-react';

const STATS = [
  { 
    number: 50, 
    suffix: '+', 
    label: 'Member Aktif', 
    description: 'Pemain terdaftar di Tangerang & Cikupa',
    icon: Users,
  },
  { 
    number: 500, 
    suffix: '+', 
    label: 'Match & Sparring', 
    description: 'Sesi pertandingan resmi tercatat',
    icon: Swords,
  },
  { 
    number: 5, 
    suffix: ' Th', 
    label: 'Konsistensi Komunitas', 
    description: 'Membangun ekosistem badminton solid',
    icon: Calendar,
  },
  { 
    number: null, 
    suffix: '', 
    label: 'AI Match Analytics', 
    description: 'Rekomendasi pasangan & kalkulasi ELO',
    icon: Cpu,
  },
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

  return <span ref={ref} className="font-mono tabular-nums">{count}{suffix}</span>;
}

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, type: 'spring' as const, stiffness: 90, damping: 18 },
  }),
};

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section ref={sectionRef} className="py-24 sm:py-32 bg-zinc-50 border-y border-zinc-200/80 relative overflow-hidden">
      {/* Ambient background light */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-gradient-radial from-[#4382C8]/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Heading */}
        <div className="text-center mb-16 max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-950 tracking-tight leading-tight">
            Skala & Pertumbuhan<br />
            <span className="text-[#4382C8]">Komunitas Kami.</span>
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
            Data aktual aktivitas member, frekuensi latihan, dan evolusi digital DLOB.
          </p>
        </div>

        {/* Doppelrand Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {STATS.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={index}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                className="group"
              >
                {/* Outer Shell (Doppelrand) */}
                <div className="h-full p-1.5 rounded-[2rem] bg-white border border-zinc-200/80 shadow-sm hover:shadow-xl hover:shadow-[#4382C8]/10 hover:border-[#4382C8]/30 transition-all duration-300">
                  {/* Inner Core */}
                  <div className="h-full p-6 rounded-[calc(2rem-0.375rem)] bg-zinc-50/50 flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200/80 flex items-center justify-center text-[#4382C8] shadow-xs">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">
                        0{index + 1}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {stat.number !== null ? (
                        <p className="text-4xl sm:text-5xl font-black text-zinc-950 tracking-tight leading-none">
                          <CountUp target={stat.number} suffix={stat.suffix} />
                        </p>
                      ) : (
                        <p className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight leading-none flex items-center gap-2">
                          <span className="text-[#4382C8]">Intelligent</span>
                        </p>
                      )}
                      <h3 className="font-bold text-sm sm:text-base text-zinc-900 pt-2">
                        {stat.label}
                      </h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        {stat.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
