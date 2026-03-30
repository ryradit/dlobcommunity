'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Trophy, Calendar, Flame, Users, RefreshCw, Zap, Info, ArrowLeft, ArrowUp, ArrowDown,
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
  lastMatchDate: string | null; // ISO date string
  scoreChange?: number; // Score delta from yesterday
  previousScore?: number; // Yesterday's score
  rankChange?: number; // Rank position change from yesterday (+1 = improved, -1 = declined)
  previousRank?: number; // Yesterday's rank
}

interface PartnershipStat {
  player1: string;
  player2: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  combinedScore: number;
  longestStreak: number; // longest consecutive wins as a partnership
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function winRateColor(wr: number) {
  if (wr >= 70) return 'text-green-600 dark:text-green-400';
  if (wr >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-orange-600 dark:text-orange-400';
}

// Calculate weighted Pemain Terbaik score based on normalized metrics
// Score freezes for players who haven't played in 7+ days (no increase, no decrease)
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
  const normAvgScore = maxStats.avgScore > 0 ? (player.avgScore / maxStats.avgScore) * 100 : 0;
  const normStreak = maxStats.streak > 0 ? (player.longestWinStreak / maxStats.streak) * 100 : 0;
  const winRate = player.winRate; // Already 0-100

  // Apply weights to all players
  const weights = {
    matches: 0.25,     // Participation & consistency
    wins: 0.20,        // Win count
    winRate: 0.20,     // Consistency ratio
    avgScore: 0.15,    // Individual contribution per match
    streak: 0.10,      // Peak performance
  };

  const score =
    (normMatches * weights.matches) +
    (normWins * weights.wins) +
    (winRate * weights.winRate) +
    (normAvgScore * weights.avgScore) +
    (normStreak * weights.streak);

  return Math.round(score * 10) / 10;
}

// Check if player is inactive (no match in last 7 days)
function isPlayerInactive(player: MemberStat): boolean {
  const INACTIVITY_DAYS = 7;
  if (!player.lastMatchDate) return true;
  
  const lastMatch = new Date(player.lastMatchDate);
  const daysSinceLastMatch = (Date.now() - lastMatch.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceLastMatch > INACTIVITY_DAYS;
}

// Get chibi image path from member name
function getChibiImagePath(memberName: string): string {
  // Handle name aliases/mappings - maps lowercase normalized name to actual filename
  const nameMap: { [key: string]: string } = {
    'bonardo': 'ardo',
    'septiandwey': 'SeptianDwey',
    'yogieprasetyo': 'YogiePrasetyo',
  };
  
  let cleanName = memberName
    .toLowerCase()
    .replace(/\s+/g, '') // Remove spaces
    .replace(/[^a-z0-9]/g, ''); // Remove special characters
  
  // Check if there's a mapping for this name
  if (nameMap[cleanName]) {
    cleanName = nameMap[cleanName];
  }
  
  return `/images/members/members-chibi/${cleanName}chibi.png`;
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
  const [activeTab, setActiveTab] = useState<'pemain-terbaik' | 'pemain-tak-terkalahkan' | 'streak-terpanjang' | 'paling-rajin' | 'pasangan-terbaik'>('pemain-terbaik');
  const [showPointsInfo, setShowPointsInfo] = useState(false);
  const [canGoBack, setCanGoBack] = useState(true);
  const [partnerships, setPartnerships] = useState<PartnershipStat[]>([]);
  const [partnershipSort, setPartnershipSort] = useState<'totalMatches' | 'wins' | 'winRate'>('winRate');
  const [partnershipDir, setPartnershipDir] = useState<'desc' | 'asc'>('desc');
  const [scoreHistory, setScoreHistory] = useState<Map<string, { yesterdayScore: number }>>(new Map());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carouselRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-rotate carousel
  useEffect(() => {
    carouselRef.current = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % 4);
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
          lastMatchDate: null,
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
          // Track last match date - will be updated to the most recent match
          if (match.match_date) {
            s.lastMatchDate = new Date(match.match_date).toISOString().slice(0, 10);
          }
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

      // Fetch previous match week's score history for rank/score comparison
      // Get all unique snapshot dates, ordered descending
      const { data: snapshotDates } = await supabase
        .from('score_history')
        .select('snapshot_date')
        .order('snapshot_date', { ascending: false })
        .limit(20); // Get last 20 snapshots to find previous week

      let previousWeekDateStr: string | null = null;
      if (snapshotDates && snapshotDates.length > 0) {
        // Get the most recent snapshot (likely today or last match day)
        const lastSnapshotDate = snapshotDates[0].snapshot_date;
        // Find a snapshot from more than 2 days ago (previous week)
        const lastDate = new Date(lastSnapshotDate);
        for (const snapshot of snapshotDates) {
          const snapshotDate = new Date(snapshot.snapshot_date);
          const daysDiff = (lastDate.getTime() - snapshotDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysDiff >= 3) { // At least 3 days ago = previous match week
            previousWeekDateStr = snapshot.snapshot_date;
            break;
          }
        }
      }

      // If no snapshot from previous week, try getting the oldest one
      if (!previousWeekDateStr && snapshotDates && snapshotDates.length > 1) {
        previousWeekDateStr = snapshotDates[snapshotDates.length - 1].snapshot_date;
      }

      const { data: previousWeekSnapshotData } = previousWeekDateStr
        ? await supabase
            .from('score_history')
            .select('member_name, best_player_score')
            .eq('snapshot_date', previousWeekDateStr)
        : { data: null };

      // Build previous week's ranking map
      const previousWeekScoresMap = new Map<string, { bestPlayerScore: number }>();
      if (previousWeekSnapshotData) {
        for (const snapshot of previousWeekSnapshotData) {
          previousWeekScoresMap.set(snapshot.member_name, {
            bestPlayerScore: snapshot.best_player_score ?? 0,
          });
        }
      }

      // Calculate rank changes by comparing positions
      const sortedByBestScore = [...statsWithScores].sort((a, b) => {
        const scoreA = (a as any).bestPlayerScore || 0;
        const scoreB = (b as any).bestPlayerScore || 0;
        return scoreB - scoreA; // desc
      });

      const todayRankMap = new Map<string, number>();
      sortedByBestScore.forEach((stat, idx) => {
        todayRankMap.set(stat.name, idx + 1);
      });

      // Build previous week's ranking
      const previousWeekRankMap = new Map<string, number>();
      const previousWeekStats = [...statsWithScores].map(stat => ({
        ...stat,
        bestPlayerScore: previousWeekScoresMap.get(stat.name)?.bestPlayerScore ?? 0,
      }));
      const sortedPreviousWeekByBestScore = previousWeekStats.sort((a, b) => {
        const scoreA = a.bestPlayerScore || 0;
        const scoreB = b.bestPlayerScore || 0;
        return scoreB - scoreA; // desc
      });
      sortedPreviousWeekByBestScore.forEach((stat, idx) => {
        previousWeekRankMap.set(stat.name, idx + 1);
      });

      // Add rank and score change to stats
      const statsWithChanges = statsWithScores.map(stat => {
        const previousData = previousWeekScoresMap.get(stat.name);
        const previousBestPlayerScore = previousData?.bestPlayerScore ?? 0;
        const currentBestPlayerScore = (stat as any).bestPlayerScore ?? 0;
        const scoreChange = currentBestPlayerScore - previousBestPlayerScore;
        const todayRank = todayRankMap.get(stat.name) ?? 999;
        const previousRank = previousWeekRankMap.get(stat.name) ?? 999;
        const rankChange = previousRank - todayRank; // positive = improved (lower rank = better)

        return {
          ...stat,
          scoreChange,
          previousScore: previousBestPlayerScore,
          rankChange,
          previousRank: previousRank,
        };
      });

      // Calculate partnership statistics with streak tracking
      const partnershipMap = new Map<string, {
        data: PartnershipStat;
        history: boolean[]; // track win/loss history for streak calculation
      }>();
      for (const match of matches) {
        // Team 1 partnership
        const team1_p1 = match.team1_player1?.trim();
        const team1_p2 = match.team1_player2?.trim();
        if (team1_p1 && team1_p2 && realNames.has(team1_p1) && realNames.has(team1_p2)) {
          const key = [team1_p1, team1_p2].sort().join('|');
          if (!partnershipMap.has(key)) {
            partnershipMap.set(key, {
              data: {
                player1: [team1_p1, team1_p2].sort()[0],
                player2: [team1_p1, team1_p2].sort()[1],
                totalMatches: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                combinedScore: 0,
                longestStreak: 0,
              },
              history: [],
            });
          }
          const entry = partnershipMap.get(key)!;
          const p = entry.data;
          p.totalMatches++;
          const score1 = match.team1_score ?? 0;
          const score2 = match.team2_score ?? 0;
          p.combinedScore += score1;
          const won = match.winner === 'team1';
          entry.history.push(won);
          if (won) p.wins++;
          else if (match.winner === 'team2') p.losses++;
        }

        // Team 2 partnership
        const team2_p1 = match.team2_player1?.trim();
        const team2_p2 = match.team2_player2?.trim();
        if (team2_p1 && team2_p2 && realNames.has(team2_p1) && realNames.has(team2_p2)) {
          const key = [team2_p1, team2_p2].sort().join('|');
          if (!partnershipMap.has(key)) {
            partnershipMap.set(key, {
              data: {
                player1: [team2_p1, team2_p2].sort()[0],
                player2: [team2_p1, team2_p2].sort()[1],
                totalMatches: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                combinedScore: 0,
                longestStreak: 0,
              },
              history: [],
            });
          }
          const entry = partnershipMap.get(key)!;
          const p = entry.data;
          p.totalMatches++;
          const score2 = match.team2_score ?? 0;
          p.combinedScore += score2;
          const won = match.winner === 'team2';
          entry.history.push(won);
          if (won) p.wins++;
          else if (match.winner === 'team1') p.losses++;
        }
      }

      // Calculate longestStreak for each partnership
      partnershipMap.forEach((entry) => {
        let longestStreak = 0, currentStreak = 0;
        for (const won of entry.history) {
          if (won) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
        }
        entry.data.longestStreak = longestStreak;
      });

      // Filter partnerships with minimum 2 matches and calculate win rate
      const qualifiedPartnerships = Array.from(partnershipMap.values())
        .filter(entry => entry.data.totalMatches >= 2)
        .map(entry => ({
          ...entry.data,
          winRate: entry.data.totalMatches > 0 ? Math.round((entry.data.wins / entry.data.totalMatches) * 100) : 0,
        }));

      setPartnerships(qualifiedPartnerships);
      setStats(statsWithChanges);
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
    // Special handling for longestWinStreak column
    if (recapSort === 'longestWinStreak') {
      if (a.longestWinStreak !== b.longestWinStreak) return mul * (a.longestWinStreak - b.longestWinStreak);
      // Tiebreaker: fewer losses ALWAYS rank higher (independent of sort direction)
      return a.losses - b.losses;
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
      <div className="relative px-3 sm:px-6 text-white text-center shadow-lg overflow-hidden py-12 sm:py-20 md:py-32 min-h-[24rem] sm:min-h-[28rem] md:min-h-[32rem]">
        {/* Rotating Background Images */}
        <div className="absolute inset-0 z-0">
          {[
            '/images/dlobanimated1.png',
            '/images/dlobanimated2.png',
            '/images/dlobanimated3.png',
            '/images/dlobanimated4.png',
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
          className="absolute left-2 sm:left-4 top-2 sm:top-4 z-20 inline-flex items-center gap-1 sm:gap-1.5 text-white/90 hover:text-white text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Kembali</span>
          <span className="sm:hidden">Kembali</span>
        </button>

        {/* Content */}
        <div className="max-w-4xl mx-auto relative z-20">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-3">
            <Trophy className="w-8 h-8 sm:w-12 md:w-14 drop-shadow-lg" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-lg text-center">DLOB Leaderboard</h1>
            <Trophy className="w-8 h-8 sm:w-12 md:w-14 drop-shadow-lg" />
          </div>
          <p className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl font-medium drop-shadow-lg px-2 mb-3">Rekap performa & statistik seluruh member komunitas</p>
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-full text-xs sm:text-sm font-medium">
            <span className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  liveRefreshing ? 'bg-white animate-ping' : 'bg-green-300'
                }`}
              />
              {liveRefreshing
                ? 'Memperbarui...'
                : 'Live'}
            </span>
            {lastUpdated && !liveRefreshing && (
              <span className="text-white/60 text-xs hidden sm:inline">
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

      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">

        {/* ── Championship Podium with Tabs ─────────────────────────── */}
        <div className="space-y-4">
          {/* Tab Navigation - Responsive */}
          <div className="flex gap-1 sm:gap-2 pb-2 overflow-x-auto justify-start sm:justify-center scrollbar-hide">
            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
            {[
              { id: 'pemain-terbaik', label: 'Pemain Terbaik', icon: '🏆' },
              { id: 'pemain-tak-terkalahkan', label: 'Tak Terkalahkan', icon: '🔥' },
              { id: 'streak-terpanjang', label: 'Streak Terpanjang', icon: '⚡' },
              { id: 'paling-rajin', label: 'Paling Rajin', icon: '📅' },
              { id: 'pasangan-terbaik', label: 'Pasangan Terbaik', icon: '👥' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-2 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-300 flex items-center gap-1 sm:gap-2 flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-zinc-600'
                }`}
              >
                <span className="text-xs sm:text-sm">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
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
                { rank: 1, player: sorted[0] || null, metric: `Points: ${sorted[0]?.bestPlayerScore ?? 0} · ${sorted[0]?.winRate ?? 0}% WR` },
                { rank: 2, player: sorted[1] || null, metric: `Points: ${sorted[1]?.bestPlayerScore ?? 0} · ${sorted[1]?.winRate ?? 0}% WR` },
                { rank: 3, player: sorted[2] || null, metric: `Points: ${sorted[2]?.bestPlayerScore ?? 0} · ${sorted[2]?.winRate ?? 0}% WR` },
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
                .sort((a, b) => {
                  // First sort by longestWinStreak descending
                  const streakDiff = b.longestWinStreak - a.longestWinStreak;
                  if (streakDiff !== 0) return streakDiff;
                  // If streaks are equal, sort by losses ascending (fewer losses = higher rank)
                  return a.losses - b.losses;
                });
              top3 = [
                { rank: 1, player: streaks[0] || null, metric: `${streaks[0]?.longestWinStreak ?? 0}x Streak - ${streaks[0]?.losses ?? 0} Losses` },
                { rank: 2, player: streaks[1] || null, metric: `${streaks[1]?.longestWinStreak ?? 0}x Streak - ${streaks[1]?.losses ?? 0} Losses` },
                { rank: 3, player: streaks[2] || null, metric: `${streaks[2]?.longestWinStreak ?? 0}x Streak - ${streaks[2]?.losses ?? 0} Losses` },
              ];
              tabTitle = 'Streak Terpanjang';
            } else if (activeTab === 'paling-rajin') {
              const diligent = [...stats]
                .sort((a, b) => b.totalMatches - a.totalMatches || b.attendances - a.attendances);
              top3 = [
                { rank: 1, player: diligent[0] || null, metric: `${diligent[0]?.totalMatches ?? 0} main · ${diligent[0]?.attendances ?? 0} pertemuan` },
                { rank: 2, player: diligent[1] || null, metric: `${diligent[1]?.totalMatches ?? 0} main · ${diligent[1]?.attendances ?? 0} pertemuan` },
                { rank: 3, player: diligent[2] || null, metric: `${diligent[2]?.totalMatches ?? 0} main · ${diligent[2]?.attendances ?? 0} pertemuan` },
              ];
              tabTitle = 'Paling Rajin';
            }

            // For Pasangan Terbaik, render different podium type
            if (activeTab === 'pasangan-terbaik') {
              const topPartnerships = [...sortedPartnerships].slice(0, 3);
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

                  {/* Partnership Podium */}
                  <div className="flex flex-col sm:flex-row items-flex-end justify-center gap-4 sm:gap-5 md:gap-7 min-h-[28rem] sm:min-h-[36rem] md:min-h-[550px] px-2 sm:px-4">
                    {/* 2nd Place - Left */}
                    <div className="flex flex-col items-center w-full sm:w-auto">
                      {topPartnerships[1] ? (
                        <>
                          {/* Medal Badge - Top */}
                          <div className="text-5xl sm:text-6xl mb-0 drop-shadow-lg">
                            {medals[1]}
                          </div>

                          {/* Partnership Characters - NO BORDER */}
                          <div className="flex justify-center gap-3 sm:gap-4 mb-0">
                            <div className="relative sm:w-24 sm:h-52 w-20 h-44">
                              <img
                                key={`partnership-2nd-p1-${topPartnerships[1].player1}`}
                                src={getChibiImagePath(topPartnerships[1].player1)}
                                alt={topPartnerships[1].player1}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="relative sm:w-24 sm:h-52 w-20 h-44">
                              <img
                                key={`partnership-2nd-p2-${topPartnerships[1].player2}`}
                                src={getChibiImagePath(topPartnerships[1].player2)}
                                alt={topPartnerships[1].player2}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          </div>

                          {/* Info Card */}
                          <div className={`rounded-lg p-4 sm:p-5 border-2 shadow-lg w-full sm:w-56 md:w-64 text-center mb-0 ${medalColors[1]}`}>
                            <div className={`text-sm sm:text-base font-bold ${textColors[1]} mb-1`}>
                              {topPartnerships[1].player1} & {topPartnerships[1].player2}
                            </div>
                            <div className="text-xs text-gray-300 font-semibold">
                              {topPartnerships[1].wins}W - {topPartnerships[1].winRate}%
                            </div>
                          </div>

                          {/* Podium Rank */}
                          <div className="w-full sm:w-56 md:w-64 h-16 sm:h-20 md:h-28 bg-gradient-to-b from-gray-500 to-gray-600 border-2 border-gray-700 shadow-lg flex items-center justify-center">
                            <span className="text-4xl sm:text-5xl font-black text-gray-300">2</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-gray-400 py-8">-</div>
                      )}
                    </div>

                    {/* 1st Place - Center High - CHAMPION */}
                    <div className="flex flex-col items-center mb-0 sm:mb-10 md:mb-16 w-full sm:w-auto order-first sm:order-none">
                      {topPartnerships[0] ? (
                        <>
                          {/* Medal Badge - Top with Glow */}
                          <div className="pulse-glow text-6xl sm:text-7xl md:text-8xl mb-0 drop-shadow-lg animate-bounce">
                            {medals[0]}
                          </div>

                          {/* Partnership Characters - Champion - NO BORDER */}
                          <div className="flex justify-center gap-4 sm:gap-5 mb-0">
                            <div className="relative sm:w-28 sm:h-60 w-24 h-52">
                              <img
                                key={`partnership-1st-p1-${topPartnerships[0].player1}`}
                                src={getChibiImagePath(topPartnerships[0].player1)}
                                alt={topPartnerships[0].player1}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="relative sm:w-28 sm:h-60 w-24 h-52">
                              <img
                                key={`partnership-1st-p2-${topPartnerships[0].player2}`}
                                src={getChibiImagePath(topPartnerships[0].player2)}
                                alt={topPartnerships[0].player2}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          </div>

                          {/* Info Card - Champion */}
                          <div className={`rounded-xl p-6 sm:p-7 md:p-8 border-3 shadow-2xl w-full sm:w-64 md:w-72 text-center mb-0 ${medalColors[0]} backdrop-blur-sm`}>
                            <div className="absolute -top-3 -right-2 text-3xl sm:text-4xl">👑</div>
                            <div className="text-lg sm:text-xl font-black text-yellow-300 mb-2 drop-shadow-lg">
                              {topPartnerships[0].player1} & {topPartnerships[0].player2}
                            </div>
                            <div className="text-xs sm:text-sm text-yellow-200 font-semibold">
                              {topPartnerships[0].wins}W - {topPartnerships[0].winRate}%
                            </div>
                          </div>

                          {/* Podium Rank - Champion */}
                          <div className="w-full sm:w-64 md:w-72 h-24 sm:h-32 md:h-48 bg-gradient-to-b from-yellow-600 to-yellow-700 border-3 border-yellow-800 shadow-2xl flex items-center justify-center">
                            <span className="text-5xl sm:text-6xl md:text-7xl font-black text-yellow-200">1</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-gray-400 py-8">-</div>
                      )}
                    </div>

                    {/* 3rd Place - Right */}
                    <div className="flex flex-col items-center w-full sm:w-auto">
                      {topPartnerships[2] ? (
                        <>
                          {/* Medal Badge - Top */}
                          <div className="text-5xl sm:text-6xl mb-0 drop-shadow-lg">
                            {medals[2]}
                          </div>

                          {/* Partnership Characters - NO BORDER */}
                          <div className="flex justify-center gap-3 sm:gap-4 mb-0">
                            <div className="relative sm:w-24 sm:h-52 w-20 h-44">
                              <img
                                key={`partnership-3rd-p1-${topPartnerships[2].player1}`}
                                src={getChibiImagePath(topPartnerships[2].player1)}
                                alt={topPartnerships[2].player1}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="relative sm:w-24 sm:h-52 w-20 h-44">
                              <img
                                key={`partnership-3rd-p2-${topPartnerships[2].player2}`}
                                src={getChibiImagePath(topPartnerships[2].player2)}
                                alt={topPartnerships[2].player2}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          </div>

                          {/* Info Card */}
                          <div className={`rounded-lg p-4 sm:p-5 border-2 shadow-lg w-full sm:w-56 md:w-64 text-center mb-0 ${medalColors[2]}`}>
                            <div className={`text-sm sm:text-base font-bold ${textColors[2]} mb-1`}>
                              {topPartnerships[2].player1} & {topPartnerships[2].player2}
                            </div>
                            <div className="text-xs text-gray-300 font-semibold">
                              {topPartnerships[2].wins}W - {topPartnerships[2].winRate}%
                            </div>
                          </div>

                          {/* Podium Rank */}
                          <div className="w-full sm:w-56 md:w-64 h-10 sm:h-12 md:h-16 bg-gradient-to-b from-orange-600 to-orange-700 border-2 border-orange-800 shadow-lg flex items-center justify-center">
                            <span className="text-3xl sm:text-4xl font-black text-orange-200">3</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-gray-400 py-8">-</div>
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
                
                {/* Podium Layout - Responsive */}
                <div className="flex flex-col sm:flex-row items-flex-end justify-center gap-4 sm:gap-5 md:gap-7 min-h-[28rem] sm:min-h-[36rem] md:min-h-[550px] px-2 sm:px-4">
                  {/* 2nd Place - Left */}
                  <div className="flex flex-col items-center w-full sm:w-auto">
                    {top3[1].player ? (
                      <>
                        {/* Medal Badge - Top */}
                        <div className="text-5xl sm:text-6xl mb-0 drop-shadow-lg">
                          {medals[1]}
                        </div>

                        {/* Chibi Character - NO BORDER */}
                        <div className="relative sm:w-28 sm:h-56 w-24 h-48 mb-0">
                          <img
                            key={`${activeTab}-2nd-${top3[1].player?.name}`}
                            src={getChibiImagePath(top3[1].player?.name || '')}
                            alt={top3[1].player?.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>

                        {/* Info Card */}
                        <div className={`rounded-lg p-5 sm:p-6 border-2 shadow-lg w-full sm:w-52 md:w-60 text-center mb-0 ${medalColors[1]}`}>
                          <div className={`text-sm sm:text-base font-bold ${textColors[1]} mb-1`}>
                            {top3[1].player?.name}
                          </div>
                          {activeTab !== 'paling-rajin' && (
                            <div className="text-xs text-gray-300 mb-1 font-semibold">
                              {top3[1].player?.winRate || 0}% WR
                            </div>
                          )}
                          <div className="text-xs text-gray-400 line-clamp-2">{top3[1].metric}</div>
                        </div>

                        {/* Podium Rank */}
                        <div className="w-full sm:w-52 md:w-60 h-16 sm:h-20 md:h-28 bg-gradient-to-b from-gray-500 to-gray-600 border-2 border-gray-700 shadow-lg flex items-center justify-center">
                          <span className="text-4xl sm:text-5xl font-black text-gray-300">2</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-400 py-8">-</div>
                    )}
                  </div>

                  {/* 1st Place - Center High - CHAMPION */}
                  <div className="flex flex-col items-center mb-0 sm:mb-10 md:mb-16 w-full sm:w-auto order-first sm:order-none">
                    {top3[0].player ? (
                      <>
                        {/* Medal Badge - Top with Glow */}
                        <div className="pulse-glow text-6xl sm:text-7xl md:text-8xl mb-0 drop-shadow-lg animate-bounce">
                          {medals[0]}
                        </div>

                        {/* Chibi Character - Champion - NO BORDER */}
                        <div className="relative sm:w-32 sm:h-64 w-28 h-56 mb-0">
                          <img
                            key={`${activeTab}-1st-${top3[0].player?.name}`}
                            src={getChibiImagePath(top3[0].player?.name || '')}
                            alt={top3[0].player?.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>

                        {/* Info Card - Champion */}
                        <div className={`rounded-xl p-6 sm:p-7 md:p-8 border-3 shadow-2xl w-full sm:w-60 md:w-72 text-center mb-0 ${medalColors[0]} backdrop-blur-sm`}>
                          <div className="absolute -top-3 -right-2 text-3xl sm:text-4xl">👑</div>
                          <div className="text-lg sm:text-xl font-black text-yellow-300 mb-2 drop-shadow-lg">
                            {top3[0].player?.name}
                          </div>
                          {activeTab !== 'paling-rajin' && (
                            <div className="text-xs sm:text-sm text-yellow-200 mb-2 font-semibold">
                              {top3[0].player && top3[0].player.longestWinStreak >= 3 ? (
                                <span>🔥 {top3[0].player.longestWinStreak}x Streak - ON FIRE</span>
                              ) : (
                                <span>💯 {top3[0].player?.winRate || 0}% Win Rate</span>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-yellow-100 line-clamp-2">{top3[0].metric}</div>
                        </div>

                        {/* Podium Rank - Champion */}
                        <div className="w-full sm:w-60 md:w-72 h-24 sm:h-32 md:h-48 bg-gradient-to-b from-yellow-600 to-yellow-700 border-3 border-yellow-800 shadow-2xl flex items-center justify-center">
                          <span className="text-5xl sm:text-6xl md:text-8xl font-black text-yellow-200">1</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-400 py-8">-</div>
                    )}
                  </div>

                  {/* 3rd Place - Right */}
                  <div className="flex flex-col items-center w-full sm:w-auto">
                    {top3[2].player ? (
                      <>
                        {/* Medal Badge - Top */}
                        <div className="text-5xl sm:text-6xl mb-0 drop-shadow-lg">
                          {medals[2]}
                        </div>

                        {/* Chibi Character - NO BORDER */}
                        <div className="relative sm:w-28 sm:h-56 w-24 h-48 mb-0">
                          <img
                            key={`${activeTab}-3rd-${top3[2].player?.name}`}
                            src={getChibiImagePath(top3[2].player?.name || '')}
                            alt={top3[2].player?.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>

                        {/* Info Card */}
                        <div className={`rounded-lg p-5 sm:p-6 border-2 shadow-lg w-full sm:w-52 md:w-60 text-center mb-0 ${medalColors[2]}`}>
                          <div className={`text-sm sm:text-base font-bold ${textColors[2]} mb-1`}>
                            {top3[2].player?.name}
                          </div>
                          {activeTab !== 'paling-rajin' && (
                            <div className="text-xs text-gray-300 mb-1 font-semibold">
                              {top3[2].player?.winRate || 0}% WR
                            </div>
                          )}
                          <div className="text-xs text-gray-400 line-clamp-2">{top3[2].metric}</div>
                        </div>

                        {/* Podium Rank */}
                        <div className="w-full sm:w-52 md:w-60 h-10 sm:h-12 md:h-16 bg-gradient-to-b from-orange-600 to-orange-700 border-2 border-orange-800 shadow-lg flex items-center justify-center">
                          <span className="text-3xl sm:text-4xl font-black text-orange-200">3</span>
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
          <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-xs sm:text-sm text-blue-800 dark:text-blue-200 mt-12 sm:mt-16 md:mt-20">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500 flex-shrink-0" />
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
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-zinc-700 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 flex-wrap">
              <Zap className="w-5 h-5 text-purple-500 shrink-0" />
              <h2 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">Rekap Semua Member</h2>
              <span className="text-xs text-gray-400 dark:text-zinc-500">· Klik kolom untuk mengurutkan</span>
              <span className="ml-auto text-xs text-gray-400 dark:text-zinc-500">{stats.length} member</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-500 dark:text-zinc-400 w-8">#</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-500 dark:text-zinc-400">Member</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold cursor-pointer select-none group transition-colors text-gray-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center justify-end gap-1" onClick={() => toggleRecapSort('bestPlayerScore')}>
                      <span className="inline-flex items-center justify-end gap-1">
                        <span className="hidden sm:inline">Points</span>
                        <span className="sm:hidden">Pts</span>
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
                        <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </th>
                    <SortTh col="totalMatches"     label="Main" />
                    <SortTh col="wins"             label="M" />
                    <SortTh col="losses"           label="K" />
                    <SortTh col="winRate"          label="Win%" />
                    <SortTh col="avgScore"         label="Avg" className="hidden md:table-cell" />
                    <SortTh col="longestWinStreak" label="Max" className="hidden lg:table-cell" />
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
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 dark:text-zinc-500 text-xs sm:text-sm">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-900 dark:text-white text-xs sm:text-sm">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="truncate">{s.name}</span>
                            {!isPlayerInactive(s) && streakUp && s.currentStreak >= 3 && (
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
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {(s as any).bestPlayerScore?.toFixed(1) || '-'}
                            </span>
                            {/* Rank change indicator - arrow beside points */}
                            {/* Only show if: has match data AND not inactive (played within last 7 days) */}
                            {s.totalMatches > 0 && !isPlayerInactive(s) && s.rankChange !== undefined && s.rankChange !== 0 && (
                              s.rankChange > 0 ? (
                                <span className="text-green-500 dark:text-green-400 text-sm">↑</span>
                              ) : (
                                <span className="text-red-500 dark:text-red-400 text-sm">↓</span>
                              )
                            )}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-600 dark:text-zinc-300 text-xs sm:text-sm">{s.totalMatches}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-green-600 dark:text-green-400 font-semibold text-xs sm:text-sm">{s.wins}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-red-500 dark:text-red-400 font-semibold text-xs sm:text-sm">{s.losses}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm">
                          {s.totalMatches === 0 ? (
                            <span className="text-gray-300 dark:text-zinc-600">-</span>
                          ) : (
                            <span className={`font-bold ${winRateColor(s.winRate)}`}>{s.winRate}%</span>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-500 dark:text-zinc-400 hidden md:table-cell text-xs sm:text-base">
                          {s.totalMatches === 0 ? '-' : s.avgScore}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-500 dark:text-zinc-400 hidden lg:table-cell text-xs sm:text-sm">
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
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-zinc-700 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 flex-wrap">
              <Users className="w-5 h-5 text-purple-500 shrink-0" />
              <h2 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">Semua Pasangan (Min. 2 Pertandingan)</h2>
              <span className="text-xs text-gray-400 dark:text-zinc-500">· Klik kolom untuk mengurutkan</span>
              <span className="ml-auto text-xs text-gray-400 dark:text-zinc-500">{sortedPartnerships.length} pasangan</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-500 dark:text-zinc-400 w-8">#</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-500 dark:text-zinc-400">Pasangan</th>
                    <th 
                      className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold cursor-pointer select-none group transition-colors text-gray-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                      onClick={() => togglePartnershipSort('wins')}
                    >
                      <span className={`text-xs ${partnershipSort === 'wins' ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                        {partnershipSort === 'wins' ? (partnershipDir === 'desc' ? '▼' : '▲') : '▼'}
                      </span>
                      {' '}<span className="hidden sm:inline">Menang</span><span className="sm:hidden">M</span>
                    </th>
                    <th 
                      className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold cursor-pointer select-none group transition-colors text-gray-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                      onClick={() => togglePartnershipSort('totalMatches')}
                    >
                      <span className={`text-xs ${partnershipSort === 'totalMatches' ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                        {partnershipSort === 'totalMatches' ? (partnershipDir === 'desc' ? '▼' : '▲') : '▼'}
                      </span>
                      {' '}Main
                    </th>
                    <th 
                      className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold cursor-pointer select-none group transition-colors text-gray-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                      onClick={() => togglePartnershipSort('winRate')}
                    >
                      <span className={`text-xs ${partnershipSort === 'winRate' ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                        {partnershipSort === 'winRate' ? (partnershipDir === 'desc' ? '▼' : '▲') : '▼'}
                      </span>
                      {' '}Win%
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-gray-500 dark:text-zinc-400 hidden sm:table-cell">Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                  {sortedPartnerships.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 sm:px-4 py-4 sm:py-8 text-center text-gray-400 dark:text-zinc-500 text-xs sm:text-sm">
                        Belum ada pasangan dengan minimal 2 pertandingan
                      </td>
                    </tr>
                  ) : (
                    sortedPartnerships.map((p, i) => (
                      <tr key={`${p.player1}|${p.player2}`} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 dark:text-zinc-500 text-xs sm:text-sm">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-900 dark:text-white text-xs sm:text-sm">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs flex items-center justify-center bg-purple-600 text-white font-bold">
                                {p.player1.charAt(0)}
                              </div>
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs flex items-center justify-center bg-purple-600 text-white font-bold">
                                {p.player2.charAt(0)}
                              </div>
                            </div>
                            <span className="font-medium truncate">{p.player1} & {p.player2}</span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-green-600 dark:text-green-400 font-semibold text-xs sm:text-sm">{p.wins}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-600 dark:text-zinc-300 text-xs sm:text-sm">{p.totalMatches}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm">
                          <span className={`font-bold ${p.winRate >= 70 ? 'text-green-600 dark:text-green-400' : p.winRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {p.winRate}%
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-500 dark:text-zinc-400 hidden sm:table-cell text-xs sm:text-sm">
                          {p.longestStreak > 1 ? <span className="text-orange-500 dark:text-orange-400 font-bold">🔥 {p.longestStreak}x</span> : '-'}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xl max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-200">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                  Sistem Points
                </h3>
                <button
                  onClick={() => setShowPointsInfo(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-zinc-300 mb-2 sm:mb-3">
                    <strong>Points</strong> adalah skor komprehensif yang menggabungkan berbagai metrik performa pemain. Semakin tinggi points, semakin baik performa keseluruhan.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">Komponen Perhitungan:</h4>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-zinc-400">
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

                <div className="bg-purple-50 dark:bg-zinc-800/50 rounded-lg p-2 sm:p-3">
                  <p className="text-xs text-gray-700 dark:text-zinc-300">
                    💡 <strong>Tips:</strong> Klik kolom <strong>Points</strong> untuk mengurutkan pemain berdasarkan skor keseluruhan. Status 🔥 menunjukkan pemain sedang panas (streak positif).
                  </p>
                </div>
              </div>
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-zinc-700">
                <button
                  onClick={() => setShowPointsInfo(false)}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  Mengerti
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="text-center text-xs text-gray-400 dark:text-zinc-600 pb-3 sm:pb-4 px-3">
          DLOB Community · Data diperbarui otomatis · Statistik berdasarkan pertandingan yang diinput
        </div>
      </div>
    </div>
  );
}




