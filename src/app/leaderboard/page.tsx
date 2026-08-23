'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FloatingAIChat from '@/components/FloatingAIChat';
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

// ─── Helpers & Constants ───────────────────────────────────────────────────

export type LeaderboardPeriod = 'all-time' | 'p2-2026' | 'p1-2026' | 'p3-2026';

export interface PeriodConfig {
  id: LeaderboardPeriod;
  title: string;
  shortTitle: string;
  subtitle: string;
  badgeText: string;
  badgeColor: string;
  icon: string;
  startDate: string | null;
  endDate: string | null;
  minMatches: number;
  minPartnerMatches: number;
}

export const PERIOD_CONFIGS: PeriodConfig[] = [
  {
    id: 'p1-2026',
    title: 'Periode 1 (Feb – Apr 2026)',
    shortTitle: 'Periode 1',
    subtitle: '20 Feb – 30 Apr 2026',
    badgeText: 'Arsip Musim 1',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: '📁',
    startDate: '2026-02-01',
    endDate: '2026-04-30T23:59:59',
    minMatches: 7,
    minPartnerMatches: 3,
  },
  {
    id: 'p2-2026',
    title: 'Periode 2 (Mei – Agu 2026)',
    shortTitle: 'Periode 2',
    subtitle: '1 Mei – 31 Agu 2026',
    badgeText: 'Musim Berjalan',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: '🟢',
    startDate: '2026-05-01',
    endDate: '2026-08-31T23:59:59',
    minMatches: 7,
    minPartnerMatches: 3,
  },
  {
    id: 'p3-2026',
    title: 'Periode 3 (Sep – Des 2026)',
    shortTitle: 'Periode 3',
    subtitle: '1 Sep – 31 Des 2026',
    badgeText: 'Mulai 1 Sep',
    badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    icon: '⏳',
    startDate: '2026-09-01',
    endDate: '2026-12-31T23:59:59',
    minMatches: 7,
    minPartnerMatches: 3,
  },
  {
    id: 'all-time',
    title: 'Sepanjang Masa',
    shortTitle: 'Sepanjang Masa',
    subtitle: 'Semua catatan sejak 20 Feb 2026',
    badgeText: 'Total Record',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: '🌟',
    startDate: null,
    endDate: null,
    minMatches: 10,
    minPartnerMatches: 5,
  },
];

export const MIN_MATCHES_PODIUM = 10;
export const MIN_PARTNER_MATCHES_PODIUM = 5;

export const HERO_IMAGES = [
  '/images/dlobanimated.png',
  '/images/dlobanimated1.png',
  '/images/dlobanimated2.png',
  '/images/dlobanimated3.png',
  '/images/dlobanimated4.png',
];

function winRateColor(wr: number) {
  if (wr >= 70) return 'text-green-600 dark:text-green-400';
  if (wr >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-orange-600 dark:text-orange-400';
}

// Calculate smooth decay weight based on match age (90-day rolling window)
// 0 days old = 1.0 weight, 90 days old = 0.0 weight
function getDecayWeight(matchDate: string | null): number {
  if (!matchDate) return 0;
  
  const DECAY_DAYS = 90;
  const match = new Date(matchDate);
  const now = new Date();
  const daysSinceMatch = (now.getTime() - match.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceMatch < 0) return 1.0; // Future date (shouldn't happen)
  if (daysSinceMatch >= DECAY_DAYS) return 0; // Older than 90 days = 0 weight
  
  // Linear decay: 1.0 - (daysSinceMatch / DECAY_DAYS)
  return Math.max(0, 1 - (daysSinceMatch / DECAY_DAYS));
}

// Calculate weighted Pemain Terbaik score based on normalized metrics
// Option C: Win Rate 40%, Win Count 30%, Average Score 20%, Longest Streak 10%
// Smooth progressive decay over 90 days (rolling window)
function calculateBestPlayerScore(player: MemberStat & { 
  weightedWins?: number;
  weightedMatches?: number;
}, maxStats: {
  matches: number;
  wins: number;
  losses: number;
  avgScore: number;
  streak: number;
  weightedMatches?: number;
  weightedWins?: number;
}): number {
  // Use weighted metrics if available (from 90-day decay), otherwise fall back to all-time
  const wins = player.weightedWins ?? player.wins;
  const matches = player.weightedMatches ?? player.totalMatches;
  const maxWins = maxStats.weightedWins ?? maxStats.wins;
  const maxMatches = maxStats.weightedMatches ?? maxStats.matches;
  
  // Normalize each metric to 0-100 scale
  const normWins = maxWins > 0 ? (wins / maxWins) * 100 : 0;
  const normAvgScore = maxStats.avgScore > 0 ? (player.avgScore / maxStats.avgScore) * 100 : 0;
  const normStreak = maxStats.streak > 0 ? (player.longestWinStreak / maxStats.streak) * 100 : 0;
  const winRate = player.winRate; // Already 0-100

  // Weights - Win Count focused (user proposal)
  const weights = {
    wins: 0.40,        // Win count (highest priority)
    winRate: 0.30,     // Win consistency (second highest)
    avgScore: 0.20,    // Individual contribution per match
    streak: 0.10,      // Peak performance
  };

  const score =
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
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>('p2-2026');
  const [rawMatches, setRawMatches] = useState<any[]>([]);
  const [rawMatchMembers, setRawMatchMembers] = useState<any[]>([]);
  const [rawRealNames, setRawRealNames] = useState<Set<string>>(new Set());
  const [periodMatchesCount, setPeriodMatchesCount] = useState<number>(0);
  const [showPointsInfo, setShowPointsInfo] = useState(false);
  const [canGoBack, setCanGoBack] = useState(true);
  const [partnerships, setPartnerships] = useState<PartnershipStat[]>([]);
  const [partnershipSort, setPartnershipSort] = useState<'totalMatches' | 'wins' | 'winRate'>('winRate');
  const [partnershipDir, setPartnershipDir] = useState<'desc' | 'asc'>('desc');
  const [scoreHistory, setScoreHistory] = useState<Map<string, { yesterdayScore: number }>>(new Map());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carouselRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-rotate background images every 5 seconds
  useEffect(() => {
    carouselRef.current = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % HERO_IMAGES.length);
    }, 5000);

    return () => {
      if (carouselRef.current) clearInterval(carouselRef.current);
    };
  }, []);

  function computeAndSetPeriodStats(
    periodId: LeaderboardPeriod,
    allMatches: any[],
    allMatchMembers: any[],
    realNames: Set<string>
  ) {
    const periodConfig = PERIOD_CONFIGS.find(p => p.id === periodId) || PERIOD_CONFIGS[0];

    // Filter matches by period date range
    let filteredMatches = allMatches;
    if (periodConfig.startDate) {
      filteredMatches = filteredMatches.filter(m => {
        if (!m.match_date) return false;
        return m.match_date >= periodConfig.startDate! && (!periodConfig.endDate || m.match_date <= periodConfig.endDate!);
      });
    }

    setPeriodMatchesCount(filteredMatches.length);

    // First recorded match date in this period
    if (filteredMatches.length > 0 && filteredMatches[0].match_date) {
      const d = new Date(filteredMatches[0].match_date);
      setFirstMatchDate(
        d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      );
    } else {
      setFirstMatchDate(null);
    }

    // match_id -> YYYY-MM-DD
    const matchDateMap = new Map<string, string>();
    for (const m of filteredMatches) {
      if (m.id && m.match_date) {
        matchDateMap.set(m.id, new Date(m.match_date).toISOString().slice(0, 10));
      }
    }

    // Distinct play dates per member in this period
    const attendanceMap = new Map<string, Set<string>>();
    for (const mm of allMatchMembers) {
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
    const playerWeightedStats = new Map<string, { weightedWins: number; weightedMatches: number }>();

    for (const match of filteredMatches) {
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
        
        if (match.match_date) {
          s.lastMatchDate = new Date(match.match_date).toISOString().slice(0, 10);
        }
        
        if (!playerMatchHistory.has(name)) playerMatchHistory.set(name, []);
        playerMatchHistory.get(name)!.push(won);
        
        const decayWeight = getDecayWeight(match.match_date);
        if (decayWeight > 0) {
          if (!playerWeightedStats.has(name)) {
            playerWeightedStats.set(name, { weightedWins: 0, weightedMatches: 0 });
          }
          const ws = playerWeightedStats.get(name)!;
          ws.weightedMatches += decayWeight;
          if (won) ws.weightedWins += decayWeight;
        }
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

    const allStats = Array.from(statMap.values());
    const maxStats = {
      matches: Math.max(...allStats.map(s => s.totalMatches), 1),
      wins: Math.max(...allStats.map(s => s.wins), 1),
      losses: Math.max(...allStats.map(s => s.losses), 1),
      avgScore: Math.max(...allStats.map(s => s.avgScore), 1),
      streak: Math.max(...allStats.map(s => s.longestWinStreak), 1),
      weightedMatches: Math.max(...Array.from(playerWeightedStats.values()).map(w => w.weightedMatches), 1),
      weightedWins: Math.max(...Array.from(playerWeightedStats.values()).map(w => w.weightedWins), 1),
    };

    const statsWithScores = allStats.map(s => {
      const weightedStats = playerWeightedStats.get(s.name);
      return {
        ...s,
        weightedWins: weightedStats?.weightedWins,
        weightedMatches: weightedStats?.weightedMatches,
        bestPlayerScore: calculateBestPlayerScore({
          ...s,
          weightedWins: weightedStats?.weightedWins,
          weightedMatches: weightedStats?.weightedMatches,
        }, maxStats),
      };
    });

    // Partnerships calculation for period
    const partnershipMap = new Map<string, {
      data: PartnershipStat;
      history: boolean[];
    }>();

    for (const match of filteredMatches) {
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
        p.combinedScore += score1;
        const won = match.winner === 'team1';
        entry.history.push(won);
        if (won) p.wins++;
        else if (match.winner === 'team2') p.losses++;
      }

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
      entry.data.winRate = entry.data.totalMatches > 0 ? Math.round((entry.data.wins / entry.data.totalMatches) * 100) : 0;
    });

    const qualifiedPartnerships = Array.from(partnershipMap.values())
      .filter(entry => entry.data.totalMatches >= 2)
      .map(entry => entry.data);

    setPartnerships(qualifiedPartnerships);
    setStats(statsWithScores);
  }

  function handlePeriodChange(newPeriod: LeaderboardPeriod) {
    setActivePeriod(newPeriod);
    if (rawMatches.length > 0) {
      computeAndSetPeriodStats(newPeriod, rawMatches, rawMatchMembers, rawRealNames);
    }
  }

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

      setRawMatches(matches);
      setRawMatchMembers(matchMembers);
      setRawRealNames(realNames);

      computeAndSetPeriodStats(activePeriod, matches, matchMembers, realNames);
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

  const currentPeriodConfig = PERIOD_CONFIGS.find(p => p.id === activePeriod) || PERIOD_CONFIGS[0];
  const currentMinMatches = currentPeriodConfig.minMatches;
  const currentMinPartnerMatches = currentPeriodConfig.minPartnerMatches;

  const sortedPartnerships = [...partnerships].sort((a, b) => {
    const aQualified = a.totalMatches >= currentMinPartnerMatches;
    const bQualified = b.totalMatches >= currentMinPartnerMatches;

    // Qualified partnerships always rank above unqualified ones when sorting descending
    if (partnershipDir === 'desc' && partnershipSort !== 'totalMatches') {
      if (aQualified && !bQualified) return -1;
      if (!aQualified && bQualified) return 1;
    }

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
    const aQualified = a.totalMatches >= currentMinMatches;
    const bQualified = b.totalMatches >= currentMinMatches;

    // Qualified players always rank above unqualified ones when sorting descending
    if (recapDir === 'desc' && recapSort !== 'totalMatches') {
      if (aQualified && !bQualified) return -1;
      if (!aQualified && bQualified) return 1;
    }

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
        className={`px-4 py-3 text-right font-semibold cursor-pointer select-none group transition-colors hover:text-teal-600 dark:hover:text-teal-400 ${
          active
            ? 'text-teal-600 dark:text-teal-400'
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
          <RefreshCw className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-zinc-400 font-semibold">Memuat leaderboard...</p>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300 pb-20 sm:pb-28">
      {/* ── Top Hero Header with Rotating Animated Background Images ─── */}
      <div className="relative text-white py-10 sm:py-16 md:py-20 px-3 sm:px-6 shadow-xl overflow-hidden min-h-[16rem] sm:min-h-[20rem] flex items-center">
        {/* Rotating Background Images with 5s smooth crossfade */}
        <div className="absolute inset-0 z-0">
          {HERO_IMAGES.map((src, idx) => (
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

        {/* Dark Overlay with Brand Teal tint for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-[#162725]/80 to-black/85 z-10" />

        {/* Back Button */}
        {canGoBack && (
          <button
            onClick={() => router.back()}
            className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 active:bg-black/80 backdrop-blur-md text-white text-xs font-semibold transition-all duration-200 border border-white/15 hover:border-white/30 shadow-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>
        )}

        <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 relative z-20">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 drop-shadow-md" />
              <span className="text-xs font-semibold tracking-widest uppercase text-teal-200 drop-shadow-sm">
                DLOB Badminton
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg">
              Leaderboard
            </h1>
            <p className="text-teal-100 text-xs sm:text-sm md:text-base mt-1.5 font-medium drop-shadow-md max-w-lg">
              Statistik performa dan peringkat member DLOB Community
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-teal-100 bg-black/40 border border-white/15 backdrop-blur-md px-3.5 py-2 rounded-full shadow-lg">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  liveRefreshing ? 'bg-white animate-ping' : 'bg-green-400'
                }`}
              />
              {liveRefreshing ? 'Updating...' : 'Live'}
            </span>
            {lastUpdated && !liveRefreshing && (
              <span className="text-teal-200/70 hidden sm:inline">
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

        {/* ── Period Selector Tabs (3 Periods + All-Time) ─────────── */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2 px-1 sm:px-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              <span>📅</span>
              <span>Pilih Periode / Musim</span>
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-zinc-400">
              <strong className="text-gray-900 dark:text-white">{periodMatchesCount}</strong> Pertandingan Tercatat
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2">
            {PERIOD_CONFIGS.map(period => {
              const isActive = activePeriod === period.id;
              return (
                <button
                  key={period.id}
                  onClick={() => handlePeriodChange(period.id)}
                  className={`relative p-2.5 sm:p-3 rounded-xl text-left transition-all duration-200 flex flex-col justify-between border ${
                    isActive
                      ? 'bg-gradient-to-br from-[#3e6461] to-[#243c3a] text-white shadow-md border-teal-500/60 ring-2 ring-teal-400/30 scale-[1.01]'
                      : 'bg-gray-50 dark:bg-zinc-800/60 text-gray-800 dark:text-zinc-200 border-gray-200/70 dark:border-zinc-700/60 hover:bg-gray-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full mb-1">
                    <span className="text-xs sm:text-sm font-black flex items-center gap-1">
                      <span>{period.icon}</span>
                      <span className="truncate">{period.shortTitle}</span>
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : period.badgeColor
                      }`}
                    >
                      {period.badgeText}
                    </span>
                  </div>
                  <div
                    className={`text-[11px] font-medium truncate ${
                      isActive ? 'text-white/80' : 'text-gray-500 dark:text-zinc-400'
                    }`}
                  >
                    {period.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

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
                    ? 'bg-[#3e6461] text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-zinc-600'
                }`}
              >
                <span className="text-xs sm:text-sm">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Empty period state when period has 0 matches */}
          {periodMatchesCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-dashed border-teal-300 dark:border-teal-800/40 text-center max-w-lg mx-auto my-6">
              <div className="text-5xl mb-3">⏳</div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">
                {currentPeriodConfig.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 mb-4 max-w-sm">
                Musim ini akan resmi dimulai pada <strong>{currentPeriodConfig.subtitle}</strong>. Pertandingan yang dicatat mulai tanggal tersebut akan otomatis masuk ke leaderboard periode ini!
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-[#3e6461] text-white shadow-md">
                <span>🏸</span>
                <span>Siapkan dirimu untuk perebutan podium musim depan!</span>
              </div>
            </div>
          ) : (
            /* Podium Display */
            (() => {
              // Different ranking logic for each tab
              let top3: { rank: number; player: MemberStat | null; metric: string }[] = [];
              let tabTitle = '';

              if (activeTab === 'pemain-terbaik') {
                const top1 = sortedRecap[0] && sortedRecap[0].totalMatches >= currentMinMatches ? sortedRecap[0] : null;
                const top2 = sortedRecap[1] && sortedRecap[1].totalMatches >= currentMinMatches ? sortedRecap[1] : null;
                const top3Player = sortedRecap[2] && sortedRecap[2].totalMatches >= currentMinMatches ? sortedRecap[2] : null;

                top3 = [
                  { rank: 1, player: top1, metric: top1 ? `Points: ${(top1 as any).bestPlayerScore?.toFixed(1) ?? 0} · ${top1.winRate}% WR` : '' },
                  { rank: 2, player: top2, metric: top2 ? `Points: ${(top2 as any).bestPlayerScore?.toFixed(1) ?? 0} · ${top2.winRate}% WR` : '' },
                  { rank: 3, player: top3Player, metric: top3Player ? `Points: ${(top3Player as any).bestPlayerScore?.toFixed(1) ?? 0} · ${top3Player.winRate}% WR` : '' },
                ];
                tabTitle = 'Pemain Terbaik';
              } else if (activeTab === 'pemain-tak-terkalahkan') {
                const leastLosses = [...stats]
                  .filter(s => s.totalMatches >= currentMinMatches)
                  .sort((a, b) => {
                    if (a.losses !== b.losses) return a.losses - b.losses;
                    return b.wins - a.wins;
                  });
                top3 = [
                  { rank: 1, player: leastLosses[0] || null, metric: `${leastLosses[0]?.losses ?? 0} Kalah · ${leastLosses[0]?.wins ?? 0} Menang (${leastLosses[0]?.winRate ?? 0}% WR)` },
                  { rank: 2, player: leastLosses[1] || null, metric: `${leastLosses[1]?.losses ?? 0} Kalah · ${leastLosses[1]?.wins ?? 0} Menang (${leastLosses[1]?.winRate ?? 0}% WR)` },
                  { rank: 3, player: leastLosses[2] || null, metric: `${leastLosses[2]?.losses ?? 0} Kalah · ${leastLosses[2]?.wins ?? 0} Menang (${leastLosses[2]?.winRate ?? 0}% WR)` },
                ];
                tabTitle = 'Pemain Tak Terkalahkan';
              } else if (activeTab === 'streak-terpanjang') {
                const streaks = [...stats]
                  .filter(s => s.totalMatches >= currentMinMatches)
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
                  .filter(s => s.totalMatches >= currentMinMatches)
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
                const topPartnerships = [...sortedPartnerships]
                  .filter(p => p.totalMatches >= currentMinPartnerMatches)
                  .slice(0, 3);
                const medals = ['🥇', '🥈', '🥉'];
                const medalColors = [
                  'border-yellow-400 bg-gradient-to-br from-yellow-900/40 to-yellow-800/40',
                  'border-gray-300 bg-gradient-to-br from-gray-700/40 to-gray-600/40',
                  'border-orange-300 bg-gradient-to-br from-orange-700/40 to-orange-600/40',
                ];
                const textColors = ['text-yellow-300', 'text-gray-200', 'text-orange-300'];

                return (
                  <div className="space-y-6">
                    {/* Qualification Badge */}
                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs font-semibold backdrop-blur-sm">
                        <span>🏆</span>
                        <span>Kualifikasi Podium: Minimal {currentMinPartnerMatches} Pertandingan Bersama</span>
                      </div>
                    </div>
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
              <div className="space-y-6">
                {/* Qualification Badge */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs font-semibold backdrop-blur-sm">
                    <span>🏆</span>
                    <span>
                      {activeTab === 'pemain-tak-terkalahkan'
                        ? `Kualifikasi: Minimal ${currentMinMatches} Pertandingan (Kekalahan Paling Sedikit)`
                        : `Kualifikasi Podium: Minimal ${currentMinMatches} Pertandingan`}
                    </span>
                  </div>
                </div>
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
                
                {top3.every(t => !t.player) ? (
                  <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 bg-gray-50/50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700 text-center max-w-lg mx-auto my-4 sm:my-6">
                    <div className="text-5xl mb-3">🛡️</div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">
                      Belum Ada Pemain Tak Terkalahkan
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mb-4 max-w-sm">
                      Kualifikasi podium membutuhkan minimal <strong>{currentMinMatches} pertandingan</strong>.
                    </p>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      <span>🔥</span>
                      <span>Jadilah pemain pertama yang mencapai rekor ini!</span>
                    </div>
                  </div>
                ) : (
                  /* Podium Layout - Responsive */
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
                )}
              </div>
            );
          })())}
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
              <Zap className="w-5 h-5 text-teal-500 shrink-0" />
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
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold cursor-pointer select-none group transition-colors text-gray-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center justify-end gap-1" onClick={() => toggleRecapSort('bestPlayerScore')}>
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
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 dark:text-zinc-500 text-xs sm:text-sm font-medium">
                          {s.totalMatches >= currentMinMatches ? (
                            i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1
                          ) : (
                            <span className="text-gray-300 dark:text-zinc-600 font-normal">-</span>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-900 dark:text-white text-xs sm:text-sm">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="truncate">{s.name}</span>
                            {s.totalMatches < currentMinMatches && s.totalMatches > 0 && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap"
                                title={`${s.totalMatches}/${currentMinMatches} pertandingan untuk kualifikasi podium`}
                              >
                                &lt;{currentMinMatches} main
                              </span>
                            )}
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
              <Users className="w-5 h-5 text-teal-500 shrink-0" />
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
                      className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold cursor-pointer select-none group transition-colors text-gray-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400"
                      onClick={() => togglePartnershipSort('wins')}
                    >
                      <span className={`text-xs ${partnershipSort === 'wins' ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                        {partnershipSort === 'wins' ? (partnershipDir === 'desc' ? '▼' : '▲') : '▼'}
                      </span>
                      {' '}<span className="hidden sm:inline">Menang</span><span className="sm:hidden">M</span>
                    </th>
                    <th 
                      className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold cursor-pointer select-none group transition-colors text-gray-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400"
                      onClick={() => togglePartnershipSort('totalMatches')}
                    >
                      <span className={`text-xs ${partnershipSort === 'totalMatches' ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                        {partnershipSort === 'totalMatches' ? (partnershipDir === 'desc' ? '▼' : '▲') : '▼'}
                      </span>
                      {' '}Main
                    </th>
                    <th 
                      className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold cursor-pointer select-none group transition-colors text-gray-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400"
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
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 dark:text-zinc-500 text-xs sm:text-sm font-medium">
                          {p.totalMatches >= currentMinPartnerMatches ? (
                            i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1
                          ) : (
                            <span className="text-gray-300 dark:text-zinc-600 font-normal">-</span>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-900 dark:text-white text-xs sm:text-sm">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs flex items-center justify-center bg-[#3e6461] text-white font-bold">
                                {p.player1.charAt(0)}
                              </div>
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs flex items-center justify-center bg-[#3e6461] text-white font-bold">
                                {p.player2.charAt(0)}
                              </div>
                            </div>
                            <span className="font-medium truncate">{p.player1} & {p.player2}</span>
                            {p.totalMatches < currentMinPartnerMatches && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap ml-1"
                                title={`${p.totalMatches}/${currentMinPartnerMatches} pertandingan bersama untuk kualifikasi`}
                              >
                                &lt;{currentMinPartnerMatches} main
                              </span>
                            )}
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
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" />
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
                    <strong>Points</strong> adalah skor komprehensif berbasis performa terbaru. Semakin tinggi points, semakin baik performa Anda. Sistem ini menggunakan <strong>rolling 90 hari</strong> dengan decay progresif untuk menghargai performa konsisten dari waktu ke waktu.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">📊 Komponen Perhitungan:</h4>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-blue-600 dark:text-blue-400 min-w-fit">40%</span>
                      <span><strong>Total Menang</strong> - Jumlah kemenangan absolut (prioritas utama)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-green-600 dark:text-green-400 min-w-fit">30%</span>
                      <span><strong>Win Rate</strong> - Konsistensi & rasio kemenangan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400 min-w-fit">20%</span>
                      <span><strong>Rata-rata Skor</strong> - Kontribusi poin per pertandingan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-orange-600 dark:text-orange-400 min-w-fit">10%</span>
                      <span><strong>Streak Terpanjang</strong> - Performa puncak maksimal</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 dark:bg-zinc-800/50 rounded-lg p-2 sm:p-3 border border-blue-200 dark:border-zinc-700">
                  <h4 className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1.5">⏳ Rolling 90 Hari - Decay Progresif</h4>
                  <p className="text-xs text-blue-800 dark:text-blue-400 mb-2">
                    Pertandingan lama secara bertahap kehilangan bobot seiring waktu. Setiap kemenangan baru lebih berharga:
                  </p>
                  <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• <strong>0-30 hari:</strong> 100% bobot (kemenangan terbaru paling berharga)</li>
                    <li>• <strong>30-60 hari:</strong> Decay progresif</li>
                    <li>• <strong>60-90 hari:</strong> Terus berkurang</li>
                    <li>• <strong>90+ hari:</strong> Tidak dihitung dalam score</li>
                  </ul>
                </div>

                <div className="bg-teal-50 dark:bg-zinc-800/50 rounded-lg p-2 sm:p-3">
                  <p className="text-xs text-gray-700 dark:text-zinc-300">
                    💡 <strong>Tips:</strong> Fokus pada <strong>jumlah kemenangan</strong> untuk skor maksimal. Semakin banyak menang, semakin tinggi score. Konsistensi (win rate) tetap penting, tapi volume kemenangan adalah kunci utama!
                  </p>
                </div>
              </div>
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-zinc-700">
                <button
                  onClick={() => setShowPointsInfo(false)}
                  className="w-full px-4 py-2 bg-[#3e6461] hover:bg-[#2d4a47] text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
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
      
      {/* Floating AI Chat */}
      <FloatingAIChat />
    </div>
  );
}




