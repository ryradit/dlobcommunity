'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, ShieldCheck, Navigation, Users, Eye, Play, Pause, 
  RotateCcw, FastForward, Activity, Sparkles, CheckCircle2, AlertTriangle
} from 'lucide-react';

export interface CourtZoneInfo {
  name: string; // e.g., 'Depan Kiri', 'Depan Kanan', 'Tengah Kiri', 'Tengah Kanan', 'Belakang Kiri', 'Belakang Kanan'
  status: 'covered' | 'exposed' | 'neutral';
  note?: string;
}

export interface RallyFrame {
  timestamp: string; // e.g. '00:03'
  phaseName: string; // e.g. 'Servis & Antisipasi'
  userPos: { x: number; y: number; label?: string };
  partnerPos: { x: number; y: number; label?: string };
  shuttlePos?: { x: number; y: number };
  formation?: string;
  formationName?: string;
  exposedZone?: string | null;
  commentary?: string;
  isIdealRecovery?: boolean;
}

export interface DetectedRally {
  id: number;
  timeRange: string;
  stroke: string;
  isPrimary?: boolean;
  summary?: string;
}

export interface DoublesCourtRadarProps {
  userPos?: { x: number; y: number; label?: string };
  partnerPos?: { x: number; y: number; label?: string };
  playerName?: string;
  formation?: string;
  formationName?: string;
  exposedZones?: CourtZoneInfo[];
  suggestedMove?: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    instruction: string;
  };
  synergyScore?: number;
  coverageEfficiency?: number;
  rallyFrames?: RallyFrame[];
  analyzedRallySegment?: string;
  detectedRallies?: DetectedRally[];
}

export const DoublesCourtRadar: React.FC<DoublesCourtRadarProps> = ({
  userPos = { x: 30, y: 75, label: 'Anda' },
  partnerPos = { x: 70, y: 35, label: 'Partner' },
  playerName,
  formation = 'front_back',
  formationName = 'Formasi Serang (Depan-Belakang)',
  exposedZones = [
    { name: 'Belakang Kiri', status: 'exposed', note: 'Area rawan lob silang lawan' },
    { name: 'Depan Kanan', status: 'covered', note: 'Dijaga aman oleh Partner' },
    { name: 'Tengah Kiri', status: 'covered', note: 'Dijaga oleh Anda' },
  ],
  suggestedMove = {
    from: { x: 30, y: 75 },
    to: { x: 25, y: 60 },
    instruction: 'Geser 1 langkah ke depan kiri untuk mengamankan drop shot lurus',
  },
  synergyScore = 84,
  coverageEfficiency = 78,
  rallyFrames,
  analyzedRallySegment,
  detectedRallies,
}) => {
  // ── Default 5-Step Tactical Rally Sequence for Dynamic Simulation ──
  const defaultRallyFrames: RallyFrame[] = [
    {
      timestamp: '01:15',
      phaseName: 'Fase 1: Servis & Siaga Defense',
      userPos: { x: 32, y: 78, label: 'Anda' },
      partnerPos: { x: 68, y: 38, label: 'Partner' },
      shuttlePos: { x: 68, y: 22 },
      formation: 'front_back',
      formationName: 'Formasi Serang (Depan-Belakang)',
      exposedZone: null,
      commentary: 'Posisi awal reli seimbang. Partner menjaga net kanan, Anda siap di baseline kiri.',
    },
    {
      timestamp: '01:20',
      phaseName: 'Fase 2: Partner Terbawa Menutup Net Kanan',
      userPos: { x: 46, y: 72, label: 'Anda' },
      partnerPos: { x: 84, y: 26, label: 'Partner' },
      shuttlePos: { x: 88, y: 16 },
      formation: 'transition',
      formationName: 'Transisi Cepat ke Sisi Kanan',
      exposedZone: 'Belakang Kiri',
      commentary: 'Lawan memancing drive ke sudut kanan luar. Partner bergeser agresif ke depan kanan.',
    },
    {
      timestamp: '01:26',
      phaseName: 'Fase 3: ⚠️ Celah Kritis Lapangan Terbuka',
      userPos: { x: 62, y: 66, label: 'Anda' },
      partnerPos: { x: 85, y: 30, label: 'Partner' },
      shuttlePos: { x: 70, y: 50 },
      formation: 'unbalanced',
      formationName: 'Formasi Tidak Seimbang (Overlapping)',
      exposedZone: 'Belakang Kiri',
      commentary: '⚠️ KESALAHAN POSISI: Anda ikut tertarik ke kanan! 50% area lapangan kiri belakang kosong tanpa penjagaan.',
    },
    {
      timestamp: '01:32',
      phaseName: 'Fase 4: Serangan Lawan ke Ruang Kosong',
      userPos: { x: 50, y: 70, label: 'Anda' },
      partnerPos: { x: 75, y: 36, label: 'Partner' },
      shuttlePos: { x: 20, y: 70 },
      formation: 'unbalanced',
      formationName: 'Terlambat Menutup (Late Recovery)',
      exposedZone: 'Belakang Kiri',
      commentary: 'Lawan mengangkat lob silang ke area kosong kiri belakang. Anda terpaksa berlari terburu-buru.',
    },
    {
      timestamp: '01:38',
      phaseName: 'Fase 5: ✓ Simulasi Rotasi Ideal Coach',
      userPos: { x: 26, y: 62, label: 'Posisi Ideal' },
      partnerPos: { x: 80, y: 30, label: 'Partner' },
      shuttlePos: { x: 25, y: 60 },
      formation: 'front_back_balanced',
      formationName: 'Koreksi: Rotasi Komplementer',
      exposedZone: null,
      commentary: '✓ SOLUSI PELATIH: Saat partner menyergap kanan, Anda wajib segera mengunci area kiri tengah.',
      isIdealRecovery: true,
    },
  ];

  const activeFrames = (rallyFrames && rallyFrames.length > 0) ? rallyFrames : defaultRallyFrames;

  // Simulation playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x or 0.5x
  const [showTrails, setShowTrails] = useState<boolean>(true);

  const activeFrame = activeFrames[currentFrameIdx] || activeFrames[0];

  // Auto-play timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.round(1800 / playbackSpeed);
    const timer = setInterval(() => {
      setCurrentFrameIdx((prev) => (prev + 1) % activeFrames.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, activeFrames.length]);

  // Court tactical zones mapping (Half-Court focus)
  const zoneCoords: Record<string, { x: number; y: number; w: number; h: number; title: string }> = {
    'Depan Kiri': { x: 8, y: 12, w: 42, h: 25, title: 'Depan Kiri (Net)' },
    'Depan Kanan': { x: 50, y: 12, w: 42, h: 25, title: 'Depan Kanan (Net)' },
    'Tengah Kiri': { x: 8, y: 37, w: 42, h: 28, title: 'Tengah Kiri' },
    'Tengah Kanan': { x: 50, y: 37, w: 42, h: 28, title: 'Tengah Kanan' },
    'Belakang Kiri': { x: 8, y: 65, w: 42, h: 27, title: 'Belakang Kiri' },
    'Belakang Kanan': { x: 50, y: 65, w: 42, h: 27, title: 'Belakang Kanan' },
  };

  // Check if a zone is exposed in current simulation frame
  const isZoneExposed = (zoneKey: string) => {
    if (activeFrame.exposedZone) {
      return activeFrame.exposedZone.toLowerCase().includes(zoneKey.toLowerCase());
    }
    const found = exposedZones.find((z) => z.name.toLowerCase().includes(zoneKey.toLowerCase()));
    return found?.status === 'exposed';
  };

  // Motion trails polyline points up to current frame
  const userTrailPoints = activeFrames
    .slice(0, currentFrameIdx + 1)
    .map((f) => `${f.userPos.x},${f.userPos.y}`)
    .join(' ');

  const partnerTrailPoints = activeFrames
    .slice(0, currentFrameIdx + 1)
    .map((f) => `${f.partnerPos.x},${f.partnerPos.y}`)
    .join(' ');

  return (
    <div className="rounded-3xl bg-slate-900 border border-emerald-500/30 p-5 sm:p-6 text-white shadow-xl space-y-6">
      {/* Header bar with Simulation Mode Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Activity className="w-4 h-4 animate-pulse" />
            </span>
            <h4 className="text-base sm:text-lg font-black text-white">
              Simulasi & Move Tracking Rotasi Lapangan Ganda
            </h4>
          </div>
          <p className="text-xs text-zinc-400">
            Simulasi visual pergerakan reli temporal (Play/Pause video-like GIF) & deteksi celah kosong.
          </p>
        </div>

        {/* Formation & Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {activeFrame.formationName || formationName}
          </span>
        </div>
      </div>

      {/* Rally Context & Full Video Multi-Rally Strip */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Reli Kunci Dianalisis
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {analyzedRallySegment || `Menit ${activeFrames[0]?.timestamp || '01:15'} – ${activeFrames[activeFrames.length - 1]?.timestamp || '01:38'}`}
            </span>
          </div>

          <span className="text-[11px] text-zinc-400">
            Fokus taktis gerakan rotasi dari video sesi Anda
          </span>
        </div>

        {/* Detected Rallies Summary (if multi-rallies detected in 2-3 min video) */}
        {detectedRallies && detectedRallies.length > 0 && (
          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mr-1">
              🏸 Rekap Reli di Video:
            </span>
            {detectedRallies.map((rally) => (
              <span
                key={rally.id}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                  rally.isPrimary
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs'
                    : 'bg-black/30 text-zinc-400 border border-white/5'
                }`}
                title={rally.summary}
              >
                <span>Reli #{rally.id} ({rally.timeRange})</span>
                {rally.isPrimary ? (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-black text-[9px] font-black uppercase">
                    Aktif di Radar
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-400 hidden sm:inline">• {rally.stroke}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: 2D Court SVG + Simulation Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Side: 2D Badminton Court SVG Simulation (6 cols) */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="relative w-full max-w-[330px] aspect-[3/4] bg-emerald-950/75 border-4 border-emerald-500/40 rounded-2xl p-2.5 shadow-2xl overflow-hidden select-none">
            {/* Top Net Bar */}
            <div className="absolute top-2 left-2 right-2 h-4 bg-linear-to-r from-zinc-300 via-white to-zinc-300 rounded-sm shadow-md flex items-center justify-between px-3 border-b border-black/40 z-20">
              <span className="text-[9px] font-black text-zinc-900 tracking-wider uppercase">
                NET (JARING)
              </span>
              <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1 rounded">
                ⏱ {activeFrame.timestamp}
              </span>
            </div>

            {/* SVG Lines, Trails & Player Nodes */}
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full pt-4"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Safe zone green gradient */}
                <radialGradient id="safeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                </radialGradient>
                {/* Danger blindspot pulse */}
                <radialGradient id="dangerGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.12" />
                </radialGradient>
              </defs>

              {/* Court Boundary Lines */}
              <rect x="8" y="10" width="84" height="82" fill="none" stroke="#34d399" strokeWidth="1" strokeOpacity="0.8" />
              <line x1="14" y1="10" x2="14" y2="92" stroke="#34d399" strokeWidth="0.6" strokeDasharray="1.5,1.5" strokeOpacity="0.5" />
              <line x1="86" y1="10" x2="86" y2="92" stroke="#34d399" strokeWidth="0.6" strokeDasharray="1.5,1.5" strokeOpacity="0.5" />
              <line x1="8" y1="28" x2="92" y2="28" stroke="#34d399" strokeWidth="0.8" strokeOpacity="0.7" />
              <line x1="8" y1="84" x2="92" y2="84" stroke="#34d399" strokeWidth="0.8" strokeOpacity="0.7" />
              <line x1="50" y1="28" x2="50" y2="92" stroke="#34d399" strokeWidth="0.8" strokeOpacity="0.7" />

              {/* Sector Zone Overlays & Blindspot Alarms */}
              {Object.entries(zoneCoords).map(([key, zone]) => {
                const isExposed = isZoneExposed(key);
                return (
                  <g key={key}>
                    <rect
                      x={zone.x}
                      y={zone.y}
                      width={zone.w}
                      height={zone.h}
                      rx="2"
                      fill={isExposed ? 'url(#dangerGlow)' : 'transparent'}
                      stroke={isExposed ? '#ef4444' : 'transparent'}
                      strokeWidth={isExposed ? '1' : '0.4'}
                      strokeDasharray={isExposed ? '2,1' : 'none'}
                    />
                    <text
                      x={zone.x + zone.w / 2}
                      y={zone.y + zone.h / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isExposed ? '#fca5a5' : '#6ee7b7'}
                      fillOpacity={isExposed ? 0.95 : 0.25}
                      fontSize={isExposed ? '3.5' : '3.0'}
                      fontWeight={isExposed ? 'bold' : 'normal'}
                    >
                      {key} {isExposed ? '⚠️ KOSONG!' : ''}
                    </text>
                  </g>
                );
              })}

              {/* Move Tracking Trails (Jejak Langkah Reli) */}
              {showTrails && (
                <>
                  <polyline
                    points={userTrailPoints}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="2,2"
                    strokeOpacity="0.7"
                  />
                  <polyline
                    points={partnerTrailPoints}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    strokeDasharray="2,2"
                    strokeOpacity="0.7"
                  />
                </>
              )}

              {/* Shuttlecock Movement Indicator */}
              {activeFrame.shuttlePos && (
                <g
                  style={{
                    transform: `translate(${activeFrame.shuttlePos.x}px, ${activeFrame.shuttlePos.y}px)`,
                    transition: 'transform 450ms ease-out',
                  }}
                >
                  <circle r="2.2" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.6" className="drop-shadow" />
                  <line x1="0" y1="2" x2="0" y2="4.5" stroke="#fef08a" strokeWidth="0.8" strokeOpacity="0.8" />
                </g>
              )}

              {/* User Position Node (Green Puck with Spring Transition) */}
              <g
                style={{
                  transform: `translate(${activeFrame.userPos.x}px, ${activeFrame.userPos.y}px)`,
                  transition: 'transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <circle
                  r={activeFrame.isIdealRecovery ? '5' : '4.5'}
                  fill={activeFrame.isIdealRecovery ? '#059669' : '#10b981'}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  className="drop-shadow-lg"
                />
                <circle r="7" fill="none" stroke="#10b981" strokeWidth="0.8" strokeOpacity="0.8">
                  <animate attributeName="r" values="4.5;8;4.5" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0;0.8" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <text y="8.5" textAnchor="middle" fill="#ffffff" fontSize="3.6" fontWeight="bold">
                  {(() => {
                    const rawLabel = activeFrame.userPos?.label || userPos?.label;
                    if (!rawLabel || rawLabel.toLowerCase() === 'member') {
                      return playerName && playerName.toLowerCase() !== 'member'
                        ? playerName.split(' ')[0]
                        : 'Anda';
                    }
                    return rawLabel;
                  })()}
                </text>
              </g>

              {/* Partner Position Node (Sky Blue Puck) */}
              <g
                style={{
                  transform: `translate(${activeFrame.partnerPos.x}px, ${activeFrame.partnerPos.y}px)`,
                  transition: 'transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <circle r="4.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.2" className="drop-shadow-lg" />
                <circle r="6.5" fill="none" stroke="#38bdf8" strokeWidth="0.6" strokeOpacity="0.8" />
                <text y="8.5" textAnchor="middle" fill="#bae6fd" fontSize="3.6" fontWeight="bold">
                  {activeFrame.partnerPos.label || partnerPos.label || 'Partner'}
                </text>
              </g>
            </svg>

            {/* Bottom baseline label */}
            <div className="text-center mt-1">
              <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">
                Garis Belakang (Backline)
              </span>
            </div>
          </div>

          {/* Interactive Player Controls (Play, Pause, Scrubber, Speed) */}
          <div className="w-full max-w-[330px] mt-4 space-y-3 p-3 rounded-2xl bg-zinc-800/80 border border-white/10">
            {/* Scrubber Timeline Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="font-mono font-bold text-emerald-400">
                  Frame {currentFrameIdx + 1}/{activeFrames.length} ({activeFrame.timestamp})
                </span>
                <span className="text-[10px] text-zinc-400">Klik titik untuk lompat detik</span>
              </div>

              {/* Step indicator buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                {activeFrames.map((frame, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentFrameIdx(idx);
                      setIsPlaying(false);
                    }}
                    className={`flex-1 h-2 rounded-full transition-all cursor-pointer ${
                      currentFrameIdx === idx
                        ? 'bg-emerald-400 ring-2 ring-emerald-400/40 scale-105'
                        : 'bg-white/20 hover:bg-white/40'
                    }`}
                    title={`${frame.timestamp} - ${frame.phaseName}`}
                  />
                ))}
              </div>
            </div>

            {/* Playback Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-sm flex items-center justify-center"
                  title={isPlaying ? 'Jeda Simulasi' : 'Putar Simulasi'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentFrameIdx(0);
                    setIsPlaying(true);
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 transition-colors cursor-pointer"
                  title="Ulangi dari Awal"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Speed Toggle (1x / 0.5x Slow-Motion) */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-[10px]">
                <button
                  type="button"
                  onClick={() => setPlaybackSpeed(1)}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                    playbackSpeed === 1 ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  1x Normal
                </button>
                <button
                  type="button"
                  onClick={() => setPlaybackSpeed(0.5)}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                    playbackSpeed === 0.5 ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  0.5x Slow-Mo
                </button>
              </div>

              {/* Trails toggle */}
              <button
                type="button"
                onClick={() => setShowTrails(!showTrails)}
                className={`text-[10px] px-2 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                  showTrails
                    ? 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10'
                    : 'border-white/10 text-zinc-400 hover:text-white'
                }`}
                title="Tampilkan garis jejak lari"
              >
                Jejak Lari
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Live Tactical Commentary & Real-Time Diagnostics (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Active Phase & Dynamic Live Commentary */}
          <div className="p-4 rounded-2xl bg-linear-to-br from-zinc-800 to-zinc-900 border border-white/10 shadow-md space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {activeFrame.phaseName}
              </span>
              <span className="text-[10px] text-zinc-400">Detik: {activeFrame.timestamp}</span>
            </div>

            <p className="text-xs text-zinc-200 leading-relaxed font-medium">
              {activeFrame.commentary}
            </p>

            {activeFrame.isIdealRecovery && (
              <div className="pt-2 border-t border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Simulasi Gerakan Ideal: Ruang kosong berhasil ditutup sempurna!</span>
              </div>
            )}
          </div>

          {/* Synergy & Coverage Meters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-zinc-400 block font-medium">Sinergi Rotasi Pasangan</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-emerald-400 font-mono">{synergyScore}</span>
                <span className="text-xs text-zinc-400">/ 100</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${synergyScore}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-zinc-400 block font-medium">Efisiensi Tutup Lapangan</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-sky-400 font-mono">{coverageEfficiency}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${coverageEfficiency}%` }}
                />
              </div>
            </div>
          </div>

          {/* Active Frame Blindspot Warning */}
          {activeFrame.exposedZone && (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-red-300 font-bold">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>Peringatan Celah Terbuka (Detik Ini):</span>
              </div>
              <p className="text-zinc-200 pl-6 leading-relaxed">
                Sektor <strong className="text-red-300">{activeFrame.exposedZone}</strong> tidak ada yang menjaga. Segera lakukan rotasi melapis untuk mengamankan drop shot / lob lawan.
              </p>
            </div>
          )}

          {/* Suggested Move Instruction */}
          {suggestedMove && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <Navigation className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Kaidah Rotasi yang Disarankan Coach:</span>
              </div>
              <p className="text-zinc-200 leading-relaxed pl-6">
                {suggestedMove.instruction}
              </p>
            </div>
          )}

          {/* Golden Rule of Seam Defense */}
          <div className="p-3 rounded-2xl bg-zinc-800/60 border border-white/5 text-[11px] text-zinc-400 flex items-start gap-2.5">
            <Eye className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-300 block">Kaidah Garis Tengah (Seam Defense):</strong>
              Kok yang mengarah ke garis pemisah tengah diprioritaskan untuk raket forehand atau pemain yang posisinya sedang bergerak maju.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
