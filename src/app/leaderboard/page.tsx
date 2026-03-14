'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Trophy, Calendar, Flame, Users, RefreshCw, Zap, Info, ArrowLeft,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

interface MemberStat {
  name: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  avgScore: number;
  longestWinStreak: number;
  currentStreak: number;
  attendances: number;
  totalScore: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function winRateColor(wr: number) {
  if (wr >= 70) return 'text-green-600 dark:text-green-400';
  if (wr >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-orange-600 dark:text-orange-400';
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MemberStat[]>([]);
  const [recapSort, setRecapSort] = useState<
    'totalMatches' | 'wins' | 'losses' | 'winRate' | 'avgScore' | 'attendances' | 'longestWinStreak'
  >('totalMatches');
  const [recapDir, setRecapDir] = useState<'desc' | 'asc'>('desc');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [liveRefreshing, setLiveRefreshing] = useState(false);
  const [firstMatchDate, setFirstMatchDate] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchStats();

    const handleChange = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setLiveRefreshing(true);
        await fetchStats();
        setLiveRefreshing(false);
      }, 1500);
    };

    const matchesSub = supabase
      .channel('leaderboard-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, handleChange)
      .subscribe();

    const membersSub = supabase
      .channel('leaderboard-match-members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_members' }, handleChange)
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(matchesSub);
      supabase.removeChannel(membersSub);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchStats() {
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, is_test_account')
        .order('full_name');

      const realProfiles = (profiles ?? []).filter((p: any) => !p.is_test_account);
      const realNames = new Set(realProfiles.map((p: any) => p.full_name));

      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true })
        .limit(10000);

      const { data: matchMembers } = await supabase
        .from('match_members')
        .select('member_name, match_id')
        .limit(50000);

      if (!matches || !matchMembers) return;

      // First recorded match date
      if (matches.length > 0 && matches[0].match_date) {
        const d = new Date(matches[0].match_date);
        setFirstMatchDate(
          d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        );
      }

      // match_id → YYYY-MM-DD
      const matchDateMap = new Map<string, string>();
      for (const m of matches) {
        if (m.id && m.match_date) {
          matchDateMap.set(m.id, new Date(m.match_date).toISOString().slice(0, 10));
        }
      }

      // Distinct play dates per member
      const attendanceMap = new Map<string, Set<string>>();
      for (const mm of matchMembers) {
        if (!realNames.has(mm.member_name)) continue;
        const date = matchDateMap.get(mm.match_id);
        if (!date) continue;
        if (!attendanceMap.has(mm.member_name)) attendanceMap.set(mm.member_name, new Set());
        attendanceMap.get(mm.member_name)!.add(date);
      }

      const statMap = new Map<string, MemberStat>();
      for (const name of realNames) {
        statMap.set(name, {
          name,
          totalMatches: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          avgScore: 0,
          longestWinStreak: 0,
          currentStreak: 0,
          attendances: attendanceMap.get(name)?.size ?? 0,
          totalScore: 0,
        });
      }

      const playerMatchHistory = new Map<string, boolean[]>();

      for (const match of matches) {
        const players = [
          { name: match.team1_player1, team: 'team1' },
          { name: match.team1_player2, team: 'team1' },
          { name: match.team2_player1, team: 'team2' },
          { name: match.team2_player2, team: 'team2' },
        ].filter(p => p.name && realNames.has(p.name));

        for (const { name, team } of players) {
          const s = statMap.get(name);
          if (!s) continue;
          const won = match.winner === team;
          const lost = match.winner && match.winner !== team;
          const score = team === 'team1' ? (match.team1_score ?? 0) : (match.team2_score ?? 0);
          s.totalMatches++;
          s.totalScore += score;
          if (won) s.wins++;
          if (lost) s.losses++;
          if (!playerMatchHistory.has(name)) playerMatchHistory.set(name, []);
          playerMatchHistory.get(name)!.push(won);
        }
      }

      for (const [name, history] of playerMatchHistory) {
        const s = statMap.get(name);
        if (!s) continue;
        let longest = 0, current = 0;
        for (const won of history) {
          if (won) { current++; longest = Math.max(longest, current); }
          else { current = 0; }
        }
        s.longestWinStreak = longest;
        let cur = 0;
        const lastResult = history[history.length - 1];
        for (let i = history.length - 1; i >= 0; i--) {
          if (history[i] === lastResult) cur++;
          else break;
        }
        s.currentStreak = lastResult ? cur : -cur;
        s.winRate = s.totalMatches > 0 ? Math.round((s.wins / s.totalMatches) * 100) : 0;
        s.avgScore = s.totalMatches > 0 ? Math.round((s.totalScore / s.totalMatches) * 10) / 10 : 0;
      }

      setStats(Array.from(statMap.values()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }

  // ─── Sort helpers ────────────────────────────────────────────────────────

  function toggleRecapSort(col: typeof recapSort) {
    if (recapSort === col) setRecapDir(d => (d === 'desc' ? 'asc' : 'desc'));
    else { setRecapSort(col); setRecapDir('desc'); }
  }

  const sortedRecap = [...stats].sort((a, b) => {
    const mul = recapDir === 'desc' ? -1 : 1;
    // Special handling for wins column
    if (recapSort === 'wins') {
      if (a.wins !== b.wins) return mul * (a.wins - b.wins);
      if (a.avgScore !== b.avgScore) return mul * (a.avgScore - b.avgScore);
      return mul * (a.longestWinStreak - b.longestWinStreak);
    }
    // Special handling for losses column
    if (recapSort === 'losses') {
      if (a.losses !== b.losses) return mul * (a.losses - b.losses);
      return mul * (a.avgScore - b.avgScore); // ascending avg score (lowest first)
    }
    // Special handling for winRate column
    if (recapSort === 'winRate') {
      if (a.winRate !== b.winRate) return mul * (a.winRate - b.winRate);
      if (a.totalMatches !== b.totalMatches) return mul * (a.totalMatches - b.totalMatches);
      return mul * (a.attendances - b.attendances);
    }
    return mul * (a[recapSort] - b[recapSort]);
  });

  function SortTh({
    col,
    label,
    className,
  }: {
    col: typeof recapSort;
    label: string;
    className?: string;
  }) {
    const active = recapSort === col;
    return (
      <th
        className={`px-4 py-3 text-right font-semibold cursor-pointer select-none group transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
          active
            ? 'text-purple-600 dark:text-purple-400'
            : 'text-gray-500 dark:text-zinc-400'
        } ${className ?? ''}`}
        onClick={() => toggleRecapSort(col)}
      >
        <span className="inline-flex items-center justify-end gap-1">
          {label}
          <span
            className={`text-xs ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}
          >
            {active ? (recapDir === 'desc' ? '▼' : '▲') : '▼'}
          </span>
        </span>
      </th>
    );
  }

  // ─── Spotlight values ────────────────────────────────────────────────────

  const totalPlayers  = stats.length;
  const totalWithData = stats.filter(s => s.totalMatches > 0).length;
  const topWinner     = [...stats].filter(s => s.totalMatches > 0).sort((a, b) => {
    if (a.totalMatches !== b.totalMatches) return b.totalMatches - a.totalMatches;
    if (a.wins !== b.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses; // lower losses is better
    if (a.winRate !== b.winRate) return b.winRate - a.winRate;
    if (a.avgScore !== b.avgScore) return b.avgScore - a.avgScore;
    return b.longestWinStreak - a.longestWinStreak;
  })[0];
  const kingStreak    = [...stats].sort((a, b) => b.longestWinStreak - a.longestWinStreak)[0];
  const mostConsistent = [...stats].sort((a, b) => b.attendances - a.attendances || b.totalMatches - a.totalMatches)[0];
  const bestUnbeatenList = [...stats].filter(s => s.losses === 0 && s.wins > 0).sort((a, b) => b.wins - a.wins);
  const maxUnbeatenWins = bestUnbeatenList[0]?.wins ?? 0;
  const bestUnbeaten = bestUnbeatenList.filter(s => s.wins === maxUnbeatenWins);

  const spotlights = [
    {
      label: 'Total Member',
      value: totalPlayers,
      sub: `${totalWithData} punya data main`,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      border: 'border-blue-200 dark:border-blue-500/30',
    },
    {
      label: 'Pemain Terbaik',
      value: topWinner?.name ?? '-',
      sub: `${topWinner?.winRate ?? 0}% · ${topWinner?.avgScore ?? 0} poin`,
      icon: Trophy,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-500/10',
      border: 'border-yellow-200 dark:border-yellow-500/30',
    },
    {
      label: <>Paling Konsisten <span className="text-[0.65rem]">Rajin Mabar + Rajin Main</span></>,
      value: mostConsistent?.name ?? '-',
      sub: `${mostConsistent?.attendances ?? 0} pertemuan · ${mostConsistent?.totalMatches ?? 0} main`,
      icon: Calendar,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-500/10',
      border: 'border-cyan-200 dark:border-cyan-500/30',
    },
    {
      label: 'Paling Tak Terkalahkan',
      value: bestUnbeaten.map(m => m.name).join(', ') ?? '-',
      sub: `${maxUnbeatenWins} M - 0 K`,
      icon: Flame,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-500/10',
      border: 'border-red-200 dark:border-red-500/30',
    },
    {
      label: 'Streak Terpanjang',
      value: kingStreak?.name ?? '-',
      sub: `${kingStreak?.longestWinStreak ?? 0}x beruntun`,
      icon: Flame,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-500/10',
      border: 'border-orange-200 dark:border-orange-500/30',
    },
  ];

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-zinc-400 font-semibold">Memuat leaderboard...</p>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">

      {/* ── Top banner ─────────────────────────────────────────────────── */}
      <div className="bg-linear-to-r from-[#3e6461] to-[#2d4a47] py-10 px-6 text-white text-center shadow-lg relative">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-10 h-10 drop-shadow" />
            <h1 className="text-4xl font-extrabold tracking-tight drop-shadow">DLOB Leaderboard</h1>
            <Trophy className="w-10 h-10 drop-shadow" />
          </div>
          <p className="text-white/80 text-base font-medium">Rekap performa & statistik seluruh member komunitas</p>

          {/* Live indicator */}
          <div className="mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                liveRefreshing ? 'bg-white animate-ping' : 'bg-green-300'
              }`}
            />
            {liveRefreshing
              ? 'Memperbarui...'
              : 'Live'}
            {lastUpdated && !liveRefreshing && (
              <span className="text-white/60 text-xs">
                · {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={fetchStats}
              className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${liveRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Competitive Leaderboard Spotlight ─────────────────────── */}
        <div className="space-y-4">
          {/* 🏆 Center Hero: Pemain Terbaik */}
          <div className="flex justify-center">
            {(() => {
              const bestCard = spotlights[1]; // Pemain Terbaik is always index 1
              const bestPlayer = stats.find(s => s.name === bestCard.value);
              return (
                <div className="relative w-full max-w-md">
                  {/* Main Card with Gold Border */}
                  <div
                    className="rounded-2xl p-6 border-3 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-black border-yellow-500/60 hover:border-yellow-400 transition-all duration-300 relative"
                  >
                    {/* Medal - Top Right */}
                    <div className="absolute -top-8 right-6 z-10">
                      {/* Ribbon */}
                      <svg width="60" height="30" viewBox="0 0 60 30" className="drop-shadow-lg">
                        {/* Left ribbon */}
                        <rect x="2" y="6" width="14" height="24" fill="#EF4444" opacity="0.95" />
                        <line x1="2" y1="6" x2="16" y2="6" stroke="#DC2626" strokeWidth="1.5" />
                        <line x1="5" y1="6" x2="5" y2="30" stroke="white" strokeWidth="0.8" opacity="0.7" />
                        <line x1="11" y1="6" x2="11" y2="30" stroke="white" strokeWidth="0.8" opacity="0.7" />
                        
                        {/* Right ribbon */}
                        <rect x="44" y="6" width="14" height="24" fill="#EF4444" opacity="0.95" />
                        <line x1="44" y1="6" x2="58" y2="6" stroke="#DC2626" strokeWidth="1.5" />
                        <line x1="47" y1="6" x2="47" y2="30" stroke="white" strokeWidth="0.8" opacity="0.7" />
                        <line x1="53" y1="6" x2="53" y2="30" stroke="white" strokeWidth="0.8" opacity="0.7" />
                      </svg>
                      
                      {/* Medal Circle */}
                      <div className="flex justify-center -mt-3">
                        <div className="relative w-16 h-16">
                          {/* Gold outer */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 drop-shadow-lg border-3 border-yellow-700" />
                          {/* Gold inner */}
                          <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-500" />
                          {/* Shine */}
                          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-100 to-transparent opacity-70" />
                          {/* Trophy icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Trophy className="w-7 h-7 text-yellow-900 drop-shadow" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Layout */}
                    <div className="flex gap-4 items-start">
                      {/* Avatar Left */}
                      <div className="flex-shrink-0 pt-2">
                        <div className="relative w-16 h-16 rounded-full border-2 border-purple-500 bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center overflow-hidden ring-2 ring-purple-400/50">
                          <span className="text-2xl font-bold text-white">
                            {bestCard.value?.charAt(0).toUpperCase()}
                          </span>
                          {/* Glow effect */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-transparent animate-pulse" />
                        </div>
                      </div>

                      {/* Info Right */}
                      <div className="flex-1">
                        {/* Name */}
                        <h3 className="text-xl font-black text-yellow-300 drop-shadow">
                          {bestCard.value}
                        </h3>
                        
                        {/* Stats Row Below Name */}
                        <div className="mt-3 space-y-2">
                          {/* Main Stats */}
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                              <div className="text-xs uppercase font-semibold text-gray-300">Menang</div>
                              <div className="text-lg font-bold text-white">{bestPlayer?.wins ?? 0}</div>
                            </div>
                            <div>
                              <div className="text-xs uppercase font-semibold text-gray-300">Pertemuan</div>
                              <div className="text-lg font-bold text-white">{bestPlayer?.totalMatches ?? 0}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase font-semibold text-gray-300">Rata-rata Skor</div>
                                <div className="text-lg font-bold text-white">{bestPlayer?.avgScore?.toFixed(1) ?? 0}</div>
                            </div>
                          </div>

                          {/* Secondary Stats */}
                          <div className="flex gap-4 justify-center text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-300">⭐</span>
                              <span className="text-gray-300">{bestPlayer?.winRate?.toFixed(0) ?? 0}% WR</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-orange-300">🔥</span>
                              <span className="text-gray-300">{bestPlayer?.longestWinStreak ?? 0} streak</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 🎖️ Secondary: Left & Right Champions */}
          <div className="grid grid-cols-2 gap-4">
            {(() => {
              const medals = [
                { card: spotlights[3], medal: '🥈', color: 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10' }, // Paling Tak Terkalahkan
                { card: spotlights[4], medal: '🥉', color: 'border-orange-300 dark:border-orange-500/50 bg-orange-50 dark:bg-orange-500/10' }, // Streak Terpanjang
              ];
              return medals.map(({ card, medal, color }) => (
                <div
                  key={card.label}
                  className={`rounded-xl p-4 border-2 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 ${color}`}
                >
                  {/* Medal Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{medal}</span>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  
                  {/* Label */}
                  <span className="text-xs text-gray-600 dark:text-zinc-300 font-bold uppercase tracking-wide block mb-2">
                    {card.label}
                  </span>
                  
                  {/* Value */}
                  <div className={`text-2xl font-bold truncate ${card.color} mb-1`}>
                    {card.value}
                  </div>
                  
                  {/* Sub */}
                  <div className="text-xs text-gray-500 dark:text-zinc-500">
                    {card.sub}
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* 📊 Info Cards: Statistics */}
          <div className="grid grid-cols-2 gap-4">
            {(() => {
              const infoCards = [spotlights[0], spotlights[2]]; // Total Member, Paling Konsisten
              return infoCards.map(card => (
                <div
                  key={card.label}
                  className={`rounded-lg p-4 border shadow-sm ${card.bg} ${card.border} transition-colors duration-300 hover:shadow-md`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                    <span className="text-xs text-gray-500 dark:text-zinc-400 font-semibold uppercase tracking-wide">
                      {card.label}
                    </span>
                  </div>
                  <div className={`text-lg font-bold truncate ${card.color}`}>
                    {card.value}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                    {card.sub}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* ── Disclaimer ─────────────────────────────────────────────── */}
        {firstMatchDate && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-sm text-blue-800 dark:text-blue-200">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
            <span>
              <strong>Catatan:</strong> Data dihitung sejak pertandingan pertama yang tercatat di sistem
              {' '}(<strong>{firstMatchDate}</strong>). Jika namamu tidak muncul atau total pertandingan
              {' '}nol, kemungkinan kamu belum memiliki data sejak tanggal tersebut — atau kamu sudah
              {' '}bermain sebelum sistem mulai merekam.
            </span>
          </div>
        )}

        {/* ── Full sortable member table ──────────────────────────────── */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors duration-300">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-700 flex items-center gap-2 flex-wrap">
            <Zap className="w-5 h-5 text-purple-500 shrink-0" />
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">Rekap Semua Member</h2>
            <span className="ml-1 text-xs text-gray-400 dark:text-zinc-500">· Klik kolom untuk mengurutkan</span>
            <span className="ml-auto text-xs text-gray-400 dark:text-zinc-500">{stats.length} member</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-zinc-400 w-10">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-zinc-400">Member</th>
                  <SortTh col="attendances"      label="Pertemuan" />
                  <SortTh col="totalMatches"     label="Main" />
                  <SortTh col="wins"             label="M" />
                  <SortTh col="losses"           label="K" />
                  <SortTh col="winRate"          label="Win%" />
                  <SortTh col="avgScore"         label="Avg Skor" className="hidden md:table-cell" />
                  <SortTh col="longestWinStreak" label="Streak Max" className="hidden lg:table-cell" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                {sortedRecap.map((s, i) => {
                  const streakUp = s.currentStreak > 0;
                  const streakDown = s.currentStreak < 0;
                  return (
                    <tr
                      key={s.name}
                      className={`hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${
                        i < 3 ? 'font-semibold' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-400 dark:text-zinc-500">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {s.name}
                          {streakUp && s.currentStreak >= 3 && (
                            <span className="text-orange-500 dark:text-orange-400 text-xs font-bold">
                              🔥{s.currentStreak}
                            </span>
                          )}
                          {streakDown && Math.abs(s.currentStreak) >= 3 && (
                            <span className="text-blue-400 text-xs font-bold">
                              ❄️{Math.abs(s.currentStreak)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-zinc-300">{s.attendances}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-zinc-300">{s.totalMatches}</td>
                      <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-semibold">{s.wins}</td>
                      <td className="px-4 py-3 text-right text-red-500 dark:text-red-400 font-semibold">{s.losses}</td>
                      <td className="px-4 py-3 text-right">
                        {s.totalMatches === 0 ? (
                          <span className="text-gray-300 dark:text-zinc-600">-</span>
                        ) : (
                          <span className={`font-bold ${winRateColor(s.winRate)}`}>{s.winRate}%</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-zinc-400 hidden md:table-cell">
                        {s.totalMatches === 0 ? '-' : s.avgScore}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-zinc-400 hidden lg:table-cell">
                        {s.longestWinStreak > 0 ? `🔥 ${s.longestWinStreak}x` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="text-center text-xs text-gray-400 dark:text-zinc-600 pb-4">
          DLOB Community · Data diperbarui otomatis · Statistik berdasarkan pertandingan yang diinput
        </div>

      </div>
    </div>
  );
}
