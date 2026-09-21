import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import HallOfFameSection from '@/components/HallOfFameSection';
import { createClient } from '@supabase/supabase-js';

async function getActiveMemberCount(): Promise<number> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function HallOfFamePage() {
  const activeMemberCount = await getActiveMemberCount();

  const stats = [
    { value: activeMemberCount || 50, suffix: '+', label: 'Member Aktif', desc: 'Anggota aktif di dua cabang' },
    { value: '5+', suffix: ' Th', label: 'Tahun Bertumbuh', desc: 'Konsisten sejak tahun 2020' },
    { value: '500+', suffix: '', label: 'Match Selesai', desc: 'Pertandingan resmi tercatat' },
    { value: 'Top', suffix: ' Tier', label: 'Dedikasi & Sportivitas', desc: 'Standar komunitas berprestasi' },
  ];

  return (
    <main className="min-h-screen bg-white text-zinc-950 font-sans overflow-x-clip">
      
      {/* ─────────────────────────────────────────────────────────────
          1. PRESTIGE HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 bg-white border-b border-zinc-200/80 overflow-hidden">
        {/* Subtle prestige lighting */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-radial from-amber-400/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-gradient-radial from-[#4382C8]/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            
            {/* Prestige Badge */}
            <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-mono tracking-wider uppercase shadow-xs">
              Apresiasi &amp; Rekognisi Komunitas
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-zinc-950 tracking-tight leading-[1.04]">
              Hall of <span className="text-[#4382C8]">Fame.</span>
            </h1>

            <p className="text-zinc-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              Penghargaan tertinggi bagi para atlet dan anggota berdedikasi yang membangun sportivitas serta prestasi di lapangan DLOB.
            </p>

            <div className="pt-2 text-xs font-mono text-zinc-400">
              Setiap Sabtu 20:00 WIB (GOR Wisma Harapan) · Setiap Jumat 20:00 WIB (GOR Galaxi Cikupa)
            </div>
          </div>

          {/* Doppelrand Milestone Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto mt-14">
            {stats.map((stat, idx) => (
              <div key={idx} className="doppelrand-shell p-1.5 rounded-[2rem] bg-zinc-100/90 border border-zinc-200/80 shadow-xs">
                <div className="p-6 rounded-[calc(2rem-0.375rem)] bg-white text-left space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                    0{idx + 1}
                  </span>
                  <p className="font-mono text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
                    {stat.value}{stat.suffix}
                  </p>
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 pt-1">{stat.label}</h3>
                  <p className="text-[11px] text-zinc-500 leading-tight">{stat.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. HALL OF FAME GRID
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-zinc-50 border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HallOfFameSection showAll={true} />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. CINEMATIC CLOSING CTA (Doppelrand Obsidian)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-2 sm:p-2.5 rounded-[2.5rem] bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden relative text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-[#4382C8]/25 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-gradient-radial from-amber-400/15 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative rounded-[calc(2.5rem-0.625rem)] bg-zinc-900/90 p-8 sm:p-14 lg:p-16 text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-white text-[11px] font-mono tracking-wider uppercase">
              Raih Peringkat Anda
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight">
              Ingin Menjadi Bagian dari<br />
              <span className="text-[#4382C8]">Hall of Fame Berikutnya?</span>
            </h2>

            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              Ikuti mabar mingguan secara rutin, tingkatkan ELO rating pertandingan Anda, dan ukir nama Anda di daftar anggota terbaik DLOB.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-3 bg-white hover:bg-zinc-100 text-zinc-950 pl-7 pr-3 py-3.5 rounded-full font-bold text-sm tracking-tight transition-all shadow-xl active:scale-[0.98]"
              >
                <span>Daftar Member Sekarang</span>
                <div className="btn-nested-icon w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center group-hover:bg-[#4382C8] transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
              <Link
                href="/tentang"
                className="px-7 py-3.5 rounded-full border border-white/20 hover:border-white/40 text-white text-sm font-semibold transition-all hover:bg-white/5 active:scale-[0.98]"
              >
                Pelajari Filosofi DLOB
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
