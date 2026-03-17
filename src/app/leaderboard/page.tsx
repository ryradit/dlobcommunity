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

interface PartnershipStat {
  player1: string;
  player2: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  combinedScore: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function winRateColor(wr: number) {
  if (wr >= 70) return 'text-green-600 dark:text-green-400';
  if (wr >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-orange-600 dark:text-orange-400';
}

// Calculate weighted Pemain Terbaik score based on normalized metrics
function calculateBestPlayerScore(player: MemberStat, maxStats: {
  matches: number;
  wins: number;
  losses: number;
  avgScore: number;
  streak: number;
}): number {
  // Normalize each metric to 0-100 scale
  const normMatches = maxStats.matches > 0 ? (player.totalMatches / maxStats.matches) * 100 : 0;
  const normWins = maxStats.wins > 0 ? (player.wins / maxStats.wins) * 100 : 0;
  const normLosses = maxStats.losses > 0 ? (player.losses / maxStats.losses) * 100 : 0;
  const normAvgScore = maxStats.avgScore > 0 ? (player.avgScore / maxStats.avgScore) * 100 : 0;
  const normStreak = maxStats.streak > 0 ? (player.longestWinStreak / maxStats.streak) * 100 : 0;
  const winRate = player.winRate; // Already 0-100

  // Apply weights
  const weights = {
    matches: 0.25,     // Increased: participation & consistency more important
    wins: 0.20,        // Reduced slightly
    losses: -0.10,     // Penalty for losses
    winRate: 0.20,     // Consistency ratio
    avgScore: 0.15,    // Individual contribution per match
    streak: 0.10,      // Peak performance
  };

  const score =
    (normMatches * weights.matches) +
    (normWins * weights.wins) +
    (normLosses * weights.losses) +
    (winRate * weights.winRate) +
    (normAvgScore * weights.avgScore) +
    (normStreak * weights.streak);

  return Math.round(score * 10) / 10; // Round to 1 decimal
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MemberStat[]>([]);
  const [recapSort, setRecapSort] = useState<
    'totalMatches' | 'wins' | 'losses' | 'winRate' | 'avgScore' | 'attendances' | 'longestWinStreak' | 'bestPlayerScore'
  >('bestPlayerScore');
  const [recapDir, setRecapDir] = useState<'desc' | 'asc'>('desc');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [liveRefreshing, setLiveRefreshing] = useState(false);
  const [firstMatchDate, setFirstMatchDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pemain-terbaik' | 'pemain-tak-terkalahkan' | 'streak-terpanjang' | 'paling-konsisten' | 'pasangan-terbaik'>('pemain-terbaik');
  const [showPointsInfo, setShowPointsInfo] = useState(false);
  const [canGoBack, setCanGoBack] = useState(true);
  const [partnerships, setPartnerships] = useState<PartnershipStat[]>([]);
  const [partnershipSort, setPartnershipSort] = useState<'totalMatches' | 'wins' | 'winRate'>('winRate');
  const [partnershipDir, setPartnershipDir] = useState<'desc' | 'asc'>('desc');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carouselRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-rotate carousel
  useEffect(() => {
    carouselRef.current = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % 2);
    }, 4000);

    return () => {
      if (carouselRef.current) clearInterval(carouselRef.current);
    };
  }, []);

  useEffect(() => {
    fetchStats();
    
    // Check if we can go back (browser history exists)
    if (typeof window !== 'undefined' && window.history.length <= 1) {
      setCanGoBack(false);
    }

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

      // Calculate best player scores for all members
      const allStats = Array.from(statMap.values());
      const maxStats = {
        matches: Math.max(...allStats.map(s => s.totalMatches), 1),
        wins: Math.max(...allStats.map(s => s.wins), 1),
        losses: Math.max(...allStats.map(s => s.losses), 1),
        avgScore: Math.max(...allStats.map(s => s.avgScore), 1),
        streak: Math.max(...allStats.map(s => s.longestWinStreak), 1),
      };

      const statsWithScores = allStats.map(s => ({
        ...s,
        bestPlayerScore: calculateBestPlayerScore(s, maxStats),
      }));

      // Calculate partnership statistics
      const partnershipMap = new Map<string, PartnershipStat>();
      for (const match of matches) {
        // Team 1 partnership
        const team1_p1 = match.team1_player1?.trim();
        const team1_p2 = match.team1_player2?.trim();
        if (team1_p1 && team1_p2 && realNames.has(team1_p1) && realNames.has(team1_p2)) {
          const key = [team1_p1, team1_p2].sort().join('|');
          if (!partnershipMap.has(key)) {
            partnershipMap.set(key, {
              player1: [team1_p1, team1_p2].sort()[0],
              player2: [team1_p1, team1_p2].sort()[1],
              totalMatches: 0,
              wins: 0,
              losses: 0,
              winRate: 0,
              combinedScore: 0,
            });
          }
          const p = partnershipMap.get(key)!;
          p.totalMatches++;
          const score1 = match.team1_score ?? 0;
          const score2 = match.team2_score ?? 0;
          p.combinedScore += score1;
          if (match.winner === 'team1') p.wins++;
          else if (match.winner === 'team2') p.losses++;
        }

        // Team 2 partnership
        const team2_p1 = match.team2_player1?.trim();
        const team2_p2 = match.team2_player2?.trim();
        if (team2_p1 && team2_p2 && realNames.has(team2_p1) && realNames.has(team2_p2)) {
          const key = [team2_p1, team2_p2].sort().join('|');
          if (!partnershipMap.has(key)) {
            partnershipMap.set(key, {
              player1: [team2_p1, team2_p2].sort()[0],
              player2: [team2_p1, team2_p2].sort()[1],
              totalMatches: 0,
              wins: 0,
              losses: 0,
              winRate: 0,
              combinedScore: 0,
            });
          }
          const p = partnershipMap.get(key)!;
          p.totalMatches++;
          const score2 = match.team2_score ?? 0;
          p.combinedScore += score2;
          if (match.winner === 'team2') p.wins++;
          else if (match.winner === 'team1') p.losses++;
        }
      }

      // Filter partnerships with minimum 2 matches and calculate win rate
      const qualifiedPartnerships = Array.from(partnershipMap.values())
        .filter(p => p.totalMatches >= 2)
        .map(p => ({
          ...p,
          winRate: p.totalMatches > 0 ? Math.round((p.wins / p.totalMatches) * 100) : 0,
        }));

      setPartnerships(qualifiedPartnerships);
      setStats(statsWithScores);
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

  function togglePartnershipSort(col: typeof partnershipSort) {
    if (partnershipSort === col) setPartnershipDir(d => (d === 'desc' ? 'asc' : 'desc'));
    else { setPartnershipSort(col); setPartnershipDir('desc'); }
  }

  const sortedPartnerships = [...partnerships].sort((a, b) => {
    const mul = partnershipDir === 'desc' ? -1 : 1;
    if (partnershipSort === 'winRate') {
      if (a.winRate !== b.winRate) return mul * (a.winRate - b.winRate);
      return mul * (a.wins - b.wins);
    }
    if (partnershipSort === 'wins') {
      if (a.wins !== b.wins) return mul * (a.wins - b.wins);
      return mul * (a.winRate - b.winRate);
    }
    return mul * (a[partnershipSort] - b[partnershipSort]);
  });

  const sortedRecap = [...stats].sort((a, b) => {
    const mul = recapDir === 'desc' ? -1 : 1;
    // Special handling for bestPlayerScore column
    if (recapSort === 'bestPlayerScore') {
      const scoreA = (a as any).bestPlayerScore || 0;
      const scoreB = (b as any).bestPlayerScore || 0;
      return mul * (scoreA - scoreB);
    }
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

      {/* ── Hero Banner with Rotating Background Images ─────────────── */}
      <div className="relative py-32 px-6 text-white text-center shadow-lg overflow-hidden min-h-[32rem]">
        {/* Rotating Background Images */}
        <div className="absolute inset-0 z-0">
          {[
            '/images/dlobanimated1.png',
            '/images/dlobanimated2.png',
          ].map((src, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                currentImageIndex === idx ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={src}
                alt={`DLOB Hero ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Dark Overlay (65% opacity for readability) */}
        <div className="absolute inset-0 bg-black/65 z-10" />

        {/* Back button */}
        <button
          onClick={() => canGoBack ? router.back() : router.push('/dashboard')}
          className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>

        {/* Content */}
        <div className="max-w-4xl mx-auto relative z-20">
          <div className="flex items-center justify-center gap-4 mb-3">
            <Trophy className="w-14 h-14 drop-shadow-lg" />
            <h1 className="text-6xl font-extrabold tracking-tight drop-shadow-lg">DLOB Leaderboard</h1>
            <Trophy className="w-14 h-14 drop-shadow-lg" />
          </div>
          <p className="text-white/90 text-xl font-medium drop-shadow-lg">Rekap performa & statistik seluruh member komunitas</p>
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

        {/* ── Championship Podium with Tabs ─────────────────────────── */}
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-2 pb-2 justify-center">
            {[
              { id: 'pemain-terbaik', label: 'Pemain Terbaik', icon: '🏆' },
              { id: 'pemain-tak-terkalahkan', label: 'Tak Terkalahkan', icon: '🔥' },
              { id: 'streak-terpanjang', label: 'Streak Terpanjang', icon: '⚡' },
              { id: 'paling-konsisten', label: 'Paling Konsisten', icon: '📅' },
              { id: 'pasangan-terbaik', label: 'Pasangan Terbaik', icon: '👥' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-zinc-600'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Podium Display */}
          {(() => {
            // Different ranking logic for each tab
            let top3: { rank: number; player: MemberStat | null; metric: string }[] = [];
            let tabTitle = '';

            if (activeTab === 'pemain-terbaik') {
              // Calculate max values for normalization
              const maxStats = {
                matches: Math.max(...stats.map(s => s.totalMatches), 1),
                wins: Math.max(...stats.map(s => s.wins), 1),
                losses: Math.max(...stats.map(s => s.losses), 1),
                avgScore: Math.max(...stats.map(s => s.avgScore), 1),
                streak: Math.max(...stats.map(s => s.longestWinStreak), 1),
              };

              const sorted = [...stats]
                .filter(s => s.totalMatches > 0)
                .map(s => ({
                  ...s,
                  bestPlayerScore: calculateBestPlayerScore(s, maxStats),
                }))
                .sort((a, b) => b.bestPlayerScore - a.bestPlayerScore);

              top3 = [
                { rank: 1, player: sorted[0] || null, metric: `Score: ${sorted[0]?.bestPlayerScore ?? 0} · ${sorted[0]?.winRate ?? 0}% WR` },
                { rank: 2, player: sorted[1] || null, metric: `Score: ${sorted[1]?.bestPlayerScore ?? 0} · ${sorted[1]?.winRate ?? 0}% WR` },
                { rank: 3, player: sorted[2] || null, metric: `Score: ${sorted[2]?.bestPlayerScore ?? 0} · ${sorted[2]?.winRate ?? 0}% WR` },
              ];
              tabTitle = 'Pemain Terbaik';
            } else if (activeTab === 'pemain-tak-terkalahkan') {
              const unbeaten = [...stats]
                .filter(s => s.losses === 0 && s.wins > 0)
                .sort((a, b) => b.wins - a.wins);
              top3 = [
                { rank: 1, player: unbeaten[0] || null, metric: `${unbeaten[0]?.wins ?? 0} menang - 0 kalah` },
                { rank: 2, player: unbeaten[1] || null, metric: `${unbeaten[1]?.wins ?? 0} menang - 0 kalah` },
                { rank: 3, player: unbeaten[2] || null, metric: `${unbeaten[2]?.wins ?? 0} menang - 0 kalah` },
              ];
              tabTitle = 'Pemain Tak Terkalahkan';
            } else if (activeTab === 'streak-terpanjang') {
              const streaks = [...stats]
                .sort((a, b) => b.longestWinStreak - a.longestWinStreak);
              top3 = [
                { rank: 1, player: streaks[0] || null, metric: `${streaks[0]?.longestWinStreak ?? 0}x beruntun` },
                { rank: 2, player: streaks[1] || null, metric: `${streaks[1]?.longestWinStreak ?? 0}x beruntun` },
                { rank: 3, player: streaks[2] || null, metric: `${streaks[2]?.longestWinStreak ?? 0}x beruntun` },
              ];
              tabTitle = 'Streak Terpanjang';
            } else if (activeTab === 'paling-konsisten') {
              const consistent = [...stats]
                .sort((a, b) => b.attendances - a.attendances || b.totalMatches - a.totalMatches);
              top3 = [
                { rank: 1, player: consistent[0] || null, metric: `${consistent[0]?.attendances ?? 0} pertemuan · ${consistent[0]?.totalMatches ?? 0} main` },
                { rank: 2, player: consistent[1] || null, metric: `${consistent[1]?.attendances ?? 0} pertemuan · ${consistent[1]?.totalMatches ?? 0} main` },
                { rank: 3, player: consistent[2] || null, metric: `${consistent[2]?.attendances ?? 0} pertemuan · ${consistent[2]?.totalMatches ?? 0} main` },
              ];
              tabTitle = 'Paling Konsisten';
            }

            // For Pasangan Terbaik, render different podium type
            if (activeTab === 'pasangan-terbaik') {
              const topPartnerships = [...sortedPartnerships].slice(0, 3);
              const medals = ['🥇', '🥈', '🥉'];
              const medalColors = [
                'border-yellow-500/60 bg-gradient-to-br from-slate-900 to-slate-800',
                'border-gray-400/60 bg-gradient-to-br from-slate-800 to-slate-700',
                'border-orange-400/60 bg-gradient-to-br from-slate-700 to-slate-600',
              ];
              const textColors = ['text-yellow-300', 'text-gray-300', 'text-orange-300'];

              return (
                <div className="space-y-6">
                  {/* Partnership Podium */}
                  <div className="flex items-flex-end justify-center gap-4 h-96">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center">
                      {topPartnerships[1] ? (
                        <>
                          <div className={`rounded-lg p-4 border-2 shadow-sm ${medalColors[1]} transition-all duration-300 w-32`}>
                            <div className="flex justify-center mb-2">
                              <span className="text-3xl">{medals[1]}</span>
                            </div>
                            <div className="flex justify-center gap-1 mb-2">
                              <div className="w-6 h-6 rounded-full border border-gray-400 text-xs flex items-center justify-center bg-gray-600 text-white font-bold">
                                {topPartnerships[1].player1.charAt(0)}
                              </div>
                              <div className="w-6 h-6 rounded-full border border-gray-400 text-xs flex items-center justify-center bg-gray-600 text-white font-bold">
                                {topPartnerships[1].player2.charAt(0)}
                              </div>
                            </div>
                            <div className={`text-xs font-bold text-center ${textColors[1]} mb-1 line-clamp-2`}>
                              {topPartnerships[1].player1} & {topPartnerships[1].player2}
                            </div>
                            <div className="text-xs text-gray-400 text-center line-clamp-2">
                              {topPartnerships[1].wins}W - {topPartnerships[1].winRate}%
                            </div>
                          </div>
                          <div className="w-32 h-24 bg-gradient-to-b from-slate-600 to-slate-700 border-2 border-slate-800 rounded-t-none shadow-lg flex items-center justify-center mt-0">
                            <span className="text-4xl font-black text-gray-300">2</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-gray-400 py-4">-</div>
                      )}
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center mb-12">
                      {topPartnerships[0] ? (
                        <>
                          <div className={`rounded-lg p-5 border-3 shadow-2xl ${medalColors[0]} transition-all duration-300 w-40`}>
                            <div className="flex justify-center mb-2">
                              <span className="text-5xl drop-shadow-lg">{medals[0]}</span>
                            </div>
                            <div className="flex justify-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full border-2 border-yellow-500 text-sm flex items-center justify-center bg-yellow-600 text-white font-bold">
                                {topPartnerships[0].player1.charAt(0)}
                              </div>
                              <div className="w-8 h-8 rounded-full border-2 border-yellow-500 text-sm flex items-center justify-center bg-yellow-600 text-white font-bold">
                                {topPartnerships[0].player2.charAt(0)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-black text-yellow-300 line-clamp-2">{topPartnerships[0].player1} & {topPartnerships[0].player2}</div>
                              <div className="text-xs text-gray-300">{topPartnerships[0].wins}W - {topPartnerships[0].winRate}%</div>
                            </div>
                          </div>
                          <div className="w-40 h-40 bg-gradient-to-b from-yellow-600 to-yellow-700 border-2 border-yellow-800 rounded-t-none shadow-2xl flex items-center justify-center mt-0">
                            <span className="text-6xl font-black text-yellow-200">1</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-gray-400 py-4">-</div>
                      )}
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center">
                      {topPartnerships[2] ? (
                        <>
                          <div className={`rounded-lg p-4 border-2 shadow-sm ${medalColors[2]} transition-all duration-300 w-32`}>
                            <div className="flex justify-center mb-2">
                              <span className="text-3xl">{medals[2]}</span>
                            </div>
                            <div className="flex justify-center gap-1 mb-2">
                              <div className="w-6 h-6 rounded-full border border-orange-400 text-xs flex items-center justify-center bg-orange-600 text-white font-bold">
                                {topPartnerships[2].player1.charAt(0)}
                              </div>
                              <div className="w-6 h-6 rounded-full border border-orange-400 text-xs flex items-center justify-center bg-orange-600 text-white font-bold">
                                {topPartnerships[2].player2.charAt(0)}
                              </div>
                            </div>
                            <div className={`text-xs font-bold text-center ${textColors[2]} mb-1 line-clamp-2`}>
                              {topPartnerships[2].player1} & {topPartnerships[2].player2}
                            </div>
                            <div className="text-xs text-gray-400 text-center line-clamp-2">
                              {topPartnerships[2].wins}W - {topPartnerships[2].winRate}%
                            </div>
                          </div>
                          <div className="w-32 h-16 bg-gradient-to-b from-orange-600 to-orange-700 border-2 border-orange-800 rounded-t-none shadow-lg flex items-center justify-center mt-0">
                            <span className="text-4xl font-black text-orange-200">3</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-gray-400 py-4">-</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            const medals = ['🥇', '🥈', '🥉'];
            const medalColors = [
              'border-yellow-400 bg-gradient-to-br from-yellow-900/40 to-yellow-800/40',
              'border-gray-300 bg-gradient-to-br from-gray-700/40 to-gray-600/40',
              'border-orange-300 bg-gradient-to-br from-orange-700/40 to-orange-600/40',
            ];
            const textColors = ['text-yellow-300', 'text-gray-200', 'text-orange-300'];

            return (
              <div className="space-y-8">
                {/* Add animations */}
                <style>{`
                  @keyframes pulse-glow {
                    0%, 100% { filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.6)); }
                    50% { filter: drop-shadow(0 0 40px rgba(251, 191, 36, 0.9)); }
                  }
                  @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                  }
                  @keyframes count-up {
                    from { opacity: 0; }
                    to { opacity: 1; }
                  }
                  .pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
                  .float { animation: float 3s ease-in-out infinite; }
                `}</style>
                
                {/* Podium Layout - Larger & More Prominent */}
                <div className="flex items-flex-end justify-center gap-6 h-[500px] px-4">
                  {/* 2nd Place - Left */}
                  <div className="flex flex-col items-center group">
                    {top3[1].player ? (
                      <>
                        {/* Card */}
                        <div className={`rounded-xl p-5 border-2 shadow-lg transition-all duration-300 w-36 hover:shadow-2xl hover:scale-105 ${medalColors[1]}`}>
                          {/* Medal Badge */}
                          <div className="flex justify-center mb-3">
                            <span className="text-4xl">{medals[1]}</span>
                          </div>

                          {/* Avatar */}
                          <div className="flex justify-center mb-3">
                            <div className="relative w-14 h-14 rounded-full border-2 border-gray-300 bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center overflow-hidden shadow-md">
                              <span className="text-lg font-bold text-white">
                                {typeof top3[1].player?.name === 'string' ? top3[1].player.name.charAt(0).toUpperCase() : '?'}
                              </span>
                            </div>
                          </div>

                          {/* Name */}
                          <div className={`text-sm font-bold truncate text-center ${textColors[1]} mb-2`}>
                            {top3[1].player?.name}
                          </div>

                          {/* Achievement Badge */}
                          <div className="text-xs text-gray-300 text-center mb-2 font-semibold">
                            {top3[1].player?.winRate || 0}% WR
                          </div>

                          {/* Metric */}
                          <div className="text-xs text-gray-400 text-center line-clamp-2">{top3[1].metric}</div>
                        </div>

                        {/* Podium Beam */}
                        <div className="w-36 h-28 bg-gradient-to-b from-gray-500 to-gray-600 border-2 border-gray-700 rounded-b-lg shadow-lg flex items-center justify-center">
                          <span className="text-5xl font-black text-gray-300">2</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-400 py-8">-</div>
                    )}
                  </div>

                  {/* 1st Place - Center High - CHAMPION */}
                  <div className="flex flex-col items-center">
                    {top3[0].player ? (
                      <>
                        {/* Champion Card with Glow & Float */}
                        <div className="pulse-glow float">
                          <div className={`rounded-2xl p-6 border-4 shadow-2xl transition-all duration-300 w-48 hover:shadow-3xl hover:scale-110 relative bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-400 backdrop-blur-sm`}>
                            {/* Crown Icon - Top Right */}
                            <div className="absolute -top-3 -right-3 text-4xl drop-shadow-lg">👑</div>

                            {/* Medal Badge */}
                            <div className="flex justify-center mb-3">
                              <span className="text-6xl drop-shadow-lg animate-bounce">{medals[0]}</span>
                            </div>

                            {/* Avatar - Larger & Gold Ring */}
                            <div className="flex justify-center mb-4">
                              <div className="relative w-20 h-20 rounded-full border-4 border-yellow-400 bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center overflow-hidden ring-4 ring-yellow-300/60 shadow-lg">
                                <span className="text-3xl font-bold text-white drop-shadow-lg">
                                  {typeof top3[0].player?.name === 'string' ? top3[0].player.name.charAt(0).toUpperCase() : '?'}
                                </span>
                              </div>
                            </div>

                            {/* Name - Bold & Gold */}
                            <div className="text-center mb-2">
                              <div className="text-xl font-black text-yellow-300 line-clamp-1 drop-shadow-lg">{top3[0].player?.name}</div>
                            </div>

                            {/* Achievement Signal */}
                            <div className="text-sm text-yellow-200 text-center mb-3 font-semibold">
                              {top3[0].player && top3[0].player.longestWinStreak >= 3 ? (
                                <span>🔥 {top3[0].player.longestWinStreak}x Streak - ON FIRE</span>
                              ) : (
                                <span>💯 {top3[0].player?.winRate || 0}% Win Rate</span>
                              )}
                            </div>

                            {/* Metric */}
                            <div className="text-xs text-yellow-100 text-center line-clamp-2">{top3[0].metric}</div>
                          </div>
                        </div>

                        {/* Podium Beam - Prominent & Gold */}
                        <div className="w-48 h-48 bg-gradient-to-b from-yellow-500 to-yellow-600 border-4 border-yellow-700 rounded-b-2xl shadow-2xl flex items-center justify-center relative">
                          <span className="text-8xl font-black text-yellow-200 drop-shadow-lg">1</span>
                          <div className="absolute inset-0 rounded-b-2xl border-4 border-yellow-400/30 pointer-events-none"></div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-400 py-12">-</div>
                    )}
                  </div>

                  {/* 3rd Place - Right */}
                  <div className="flex flex-col items-center group">
                    {top3[2].player ? (
                      <>
                        {/* Card */}
                        <div className={`rounded-xl p-5 border-2 shadow-lg transition-all duration-300 w-36 hover:shadow-2xl hover:scale-105 ${medalColors[2]}`}>
                          {/* Medal Badge */}
                          <div className="flex justify-center mb-3">
                            <span className="text-4xl">{medals[2]}</span>
                          </div>

                          {/* Avatar */}
                          <div className="flex justify-center mb-3">
                            <div className="relative w-14 h-14 rounded-full border-2 border-orange-300 bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center overflow-hidden shadow-md">
                              <span className="text-lg font-bold text-white">
                                {typeof top3[2].player?.name === 'string' ? top3[2].player.name.charAt(0).toUpperCase() : '?'}
                              </span>
                            </div>
                          </div>

                          {/* Name */}
                          <div className={`text-sm font-bold truncate text-center ${textColors[2]} mb-2`}>
                            {top3[2].player?.name}
                          </div>

                          {/* Achievement Badge */}
                          <div className="text-xs text-orange-100 text-center mb-2 font-semibold">
                            {top3[2].player?.winRate || 0}% WR
                          </div>

                          {/* Metric */}
                          <div className="text-xs text-gray-400 text-center line-clamp-2">{top3[2].metric}</div>
                        </div>

                        {/* Podium Beam */}
                        <div className="w-36 h-20 bg-gradient-to-b from-orange-500 to-orange-600 border-2 border-orange-700 rounded-b-lg shadow-lg flex items-center justify-center">
                          <span className="text-5xl font-black text-orange-200">3</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-400 py-8">-</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
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
        {activeTab !== 'pasangan-terbaik' && (
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
                    <th className="px-4 py-3 text-right font-semibold cursor-pointer select-none group transition-colors text-gray-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center justify-end gap-1" onClick={() => toggleRecapSort('bestPlayerScore')}>
                      <span className="inline-flex items-center justify-end gap-1">
                        Points
                        <span className={`text-xs ${recapSort === 'bestPlayerScore' ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                          {recapSort === 'bestPlayerScore' ? (recapDir === 'desc' ? '▼' : '▲') : '▼'}
                        </span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPointsInfo(true);
                        }}
                        className="ml-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                        title="Informasi tentang sistem Points"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </th>
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
                            <span>{s.name}</span>
                            {streakUp && s.currentStreak >= 3 && (
                              <span className="text-orange-500 dark:text-orange-400 text-xs font-bold whitespace-nowrap">
                                🔥{s.currentStreak}
                              </span>
                            )}
                            {streakDown && Math.abs(s.currentStreak) >= 3 && (
                              <span className="text-blue-400 text-xs font-bold whitespace-nowrap">
                                ❄️{Math.abs(s.currentStreak)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {(s as any).bestPlayerScore?.toFixed(1) || '-'}
                            </span>
                            {streakUp && s.currentStreak >= 3 && (
                              <span className="text-orange-500 dark:text-orange-400 text-sm">↑</span>
                            )}
                            {streakDown && Math.abs(s.currentStreak) >= 3 && (
                              <span className="text-blue-400 text-sm">↓</span>
                            )}
                          </div>
                        </td>
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
                        <td className="px-4 py-3 text-right text-gray-500 dark:text-zinc-400 hidden md:table-cell text-base">
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
        )}

        {/* ── Partnership Table (Pasangan Terbaik) ───────────────────── */}
        {activeTab === 'pasangan-terbaik' && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors duration-300">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-700 flex items-center gap-2 flex-wrap">
              <Users className="w-5 h-5 text-purple-500 shrink-0" />
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">Semua Pasangan (Min. 2 Pertandingan)</h2>
              <span className="ml-1 text-xs text-gray-400 dark:text-zinc-500">· Klik kolom untuk mengurutkan</span>
              <span className="ml-auto text-xs text-gray-400 dark:text-zinc-500">{sortedPartnerships.length} pasangan</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                    <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-zinc-400 w-10">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-zinc-400">Pasangan</th>
                    <th 
                      className="px-4 py-3 text-right font-semibold cursor-pointer select-none group transition-colors text-gray-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                      onClick={() => togglePartnershipSort('wins')}
                    >
                      <span className={`text-xs ${partnershipSort === 'wins' ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                        {partnershipSort === 'wins' ? (partnershipDir === 'desc' ? '▼' : '▲') : '▼'}
                      </span>
                      {' '}Menang
                    </th>
                    <th 
                      className="px-4 py-3 text-right font-semibold cursor-pointer select-none group transition-colors text-gray-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                      onClick={() => togglePartnershipSort('totalMatches')}
                    >
                      <span className={`text-xs ${partnershipSort === 'totalMatches' ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                        {partnershipSort === 'totalMatches' ? (partnershipDir === 'desc' ? '▼' : '▲') : '▼'}
                      </span>
                      {' '}Main
                    </th>
                    <th 
                      className="px-4 py-3 text-right font-semibold cursor-pointer select-none group transition-colors text-gray-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                      onClick={() => togglePartnershipSort('winRate')}
                    >
                      <span className={`text-xs ${partnershipSort === 'winRate' ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                        {partnershipSort === 'winRate' ? (partnershipDir === 'desc' ? '▼' : '▲') : '▼'}
                      </span>
                      {' '}Win%
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                  {sortedPartnerships.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-zinc-500">
                        Belum ada pasangan dengan minimal 5 pertandingan
                      </td>
                    </tr>
                  ) : (
                    sortedPartnerships.map((p, i) => (
                      <tr key={`${p.player1}|${p.player2}`} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 dark:text-zinc-500">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-6 h-6 rounded-full text-xs flex items-center justify-center bg-purple-600 text-white font-bold">
                                {p.player1.charAt(0)}
                              </div>
                              <div className="w-6 h-6 rounded-full text-xs flex items-center justify-center bg-purple-600 text-white font-bold">
                                {p.player2.charAt(0)}
                              </div>
                            </div>
                            <span className="font-medium">{p.player1} & {p.player2}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-semibold">{p.wins}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-zinc-300">{p.totalMatches}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${p.winRate >= 70 ? 'text-green-600 dark:text-green-400' : p.winRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {p.winRate}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Points Info Modal ───────────────────────────────────────── */}
        {showPointsInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xl max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  Sistem Points
                </h3>
                <button
                  onClick={() => setShowPointsInfo(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-700 dark:text-zinc-300 mb-3">
                    <strong>Points</strong> adalah skor komprehensif yang menggabungkan berbagai metrik performa pemain. Semakin tinggi points, semakin baik performa keseluruhan.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Komponen Perhitungan:</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-purple-600 dark:text-purple-400 min-w-fit">25%</span>
                      <span><strong>Total Pertandingan</strong> - Konsistensi & partisipasi aktif</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-green-600 dark:text-green-400 min-w-fit">20%</span>
                      <span><strong>Total Menang</strong> - Kemampuan memenangkan pertandingan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400 min-w-fit">20%</span>
                      <span><strong>Win Rate</strong> - Rasio kemenangan vs kekalahan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-blue-600 dark:text-blue-400 min-w-fit">15%</span>
                      <span><strong>Rata-rata Skor</strong> - Kontribusi poin per pertandingan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-orange-600 dark:text-orange-400 min-w-fit">10%</span>
                      <span><strong>Streak Terpanjang</strong> - Performa puncak</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-red-600 dark:text-red-400 min-w-fit">-10%</span>
                      <span><strong>Total Kekalahan</strong> - Pengurangan untuk konsistensi</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-purple-50 dark:bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-700 dark:text-zinc-300">
                    💡 <strong>Tips:</strong> Klik kolom <strong>Points</strong> untuk mengurutkan pemain berdasarkan skor keseluruhan. Status 🔥 menunjukkan pemain sedang panas (streak positif).
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-700">
                <button
                  onClick={() => setShowPointsInfo(false)}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Mengerti
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="text-center text-xs text-gray-400 dark:text-zinc-600 pb-4">
          DLOB Community · Data diperbarui otomatis · Statistik berdasarkan pertandingan yang diinput
        </div>
      </div>
    </div>
  );
}


