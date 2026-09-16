'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import {
  Trophy, Target, TrendingUp, TrendingDown, Users,
  Flame, Star, Activity, Award, RefreshCw,
  ChevronUp, ChevronDown, Calendar, Search, Sparkles
} from 'lucide-react';
import BranchBadge from '@/components/BranchBadge';

const BRANCH_ID = 'dlob-cikupa';
const ACCENT = '#10B981';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  lastMatchDate: string | null;
}

interface DuoStat {
  player1: string;
  player2: string;
  wins: number;
  total: number;
  winRate: number;
  longestStreak: number;
}

type Category =
  | 'best-player'
  | 'attendance'
  | 'wins'
  | 'losses'
  | 'winrate'
  | 'matches'
  | 'avgscore'
  | 'streak'
  | 'rookie'
  | 'duo';

const CATEGORIES: { id: Category; label: string; icon: any; desc: string }[] = [
  { id: 'best-player', label: 'Pemain Terbaik',        icon: Trophy,        desc: 'Formula weighted (matches, wins, rate, avg, streak)' },
  { id: 'attendance', label: 'Paling Rajin Hadir',    icon: Calendar,      desc: 'Pertemuan sesi terbanyak di cabang Cikupa' },
  { id: 'wins',       label: 'Paling Banyak Menang',  icon: Trophy,        desc: 'Total kemenangan tertinggi di DLBC' },
  { id: 'losses',     label: 'Paling Banyak Kalah',   icon: TrendingDown,  desc: 'Total kekalahan terbanyak' },
  { id: 'winrate',    label: 'Win Rate Terbaik',       icon: TrendingUp,    desc: 'Min. 3 pertandingan' },
  { id: 'matches',    label: 'Paling Aktif',           icon: Activity,      desc: 'Total pertandingan terbanyak di DLBC' },
  { id: 'avgscore',   label: 'Rata-rata Skor Tinggi',  icon: Target,        desc: 'Poin per game tertinggi' },
  { id: 'streak',     label: 'Streak Kemenangan',      icon: Flame,         desc: 'Kemenangan beruntun terpanjang' },
  { id: 'rookie',     label: 'Rookie Terbaik',         icon: Star,          desc: 'Win rate terbaik ≤ 5 pertandingan' },
  { id: 'duo',        label: 'Duo Terbaik DLBC',       icon: Users,         desc: 'Pasangan ganda dengan win rate tertinggi' },
];

function medal(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function duoChemistry(winRate: number, total: number): { label: string; color: string; emoji: string } {
  if (winRate >= 75 && total >= 5) return { label: 'Duo Legenda DLBC', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', emoji: '⚡' };
  if (winRate >= 60) return { label: 'Pasangan Serasi', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', emoji: '🔥' };
  if (winRate >= 50) return { label: 'Sinergi Bagus', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', emoji: '✨' };
  return { label: 'Masih Berkembang', color: 'bg-zinc-800 text-zinc-400 border-zinc-700', emoji: '🌱' };
}

function calculateBestPlayerScore(player: MemberStat, maxStats: {
  matches: number;
  wins: number;
  avgScore: number;
  streak: number;
}): number {
  const normMatches = maxStats.matches > 0 ? (player.totalMatches / maxStats.matches) * 100 : 0;
  const normWins = maxStats.wins > 0 ? (player.wins / maxStats.wins) * 100 : 0;
  const normAvgScore = maxStats.avgScore > 0 ? (player.avgScore / maxStats.avgScore) * 100 : 0;
  const normStreak = maxStats.streak > 0 ? (player.longestWinStreak / maxStats.streak) * 100 : 0;
  const winRate = player.winRate;

  const weights = { matches: 0.25, wins: 0.20, winRate: 0.20, avgScore: 0.15, streak: 0.10 };
  const score =
    (normMatches * weights.matches) +
    (normWins * weights.wins) +
    (winRate * weights.winRate) +
    (normAvgScore * weights.avgScore) +
    (normStreak * weights.streak);

  return Math.round(score * 10) / 10;
}

export default function CikupaMemberStatistikPage() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MemberStat[]>([]);
  const [duos, setDuos] = useState<DuoStat[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('attendance');
  const [showAll, setShowAll] = useState(false);
  const [recapSort, setRecapSort] = useState<'name' | 'totalMatches' | 'wins' | 'losses' | 'winRate' | 'avgScore' | 'attendances' | 'longestWinStreak'>('totalMatches');
  const [recapDir, setRecapDir] = useState<'desc' | 'asc'>('desc');
  const [recapSearch, setRecapSearch] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [liveRefreshing, setLiveRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [pathname]);

  async function fetchStats() {
    try {
      setLoading(true);

      // 1. Fetch DLBC matches
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('branch_id', BRANCH_ID)
        .order('match_date', { ascending: true })
        .limit(1000);

      if (matchesError) throw matchesError;

      // 2. Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('full_name, is_test_account')
        .eq('branch_id', BRANCH_ID);

      if (profilesError) throw profilesError;

      const realNames = new Set(
        (profiles || [])
          .filter(p => !p.is_test_account && p.full_name)
          .map(p => p.full_name.trim())
      );

      // Data accumulators
      const memberMap: { [name: string]: MemberStat } = {};
      const sessionDates: { [name: string]: Set<string> } = {};
      const streaks: { [name: string]: { current: number; longest: number } } = {};
      const duoMap: { [key: string]: { player1: string; player2: string; wins: number; total: number; currentStreak: number; longestStreak: number } } = {};

      const getDuoKey = (p1: string, p2: string) => [p1, p2].sort().join(' & ');

      // Initialize all DLBC profiles
      realNames.forEach(name => {
        memberMap[name] = {
          name,
          totalMatches: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          avgScore: 0,
          longestWinStreak: 0,
          currentStreak: 0,
          attendances: 0,
          totalScore: 0,
          lastMatchDate: null,
        };
        sessionDates[name] = new Set();
        streaks[name] = { current: 0, longest: 0 };
      });

      // Process matches
      (matches || []).forEach(match => {
        const team1 = [match.team1_player1, match.team1_player2].filter(Boolean) as string[];
        const team2 = [match.team2_player1, match.team2_player2].filter(Boolean) as string[];
        const matchDate = match.match_date ? match.match_date.split('T')[0] : null;

        const allPlayers = [...team1, ...team2];
        allPlayers.forEach(p => {
          const name = p.trim();
          if (!memberMap[name]) {
            memberMap[name] = {
              name,
              totalMatches: 0,
              wins: 0,
              losses: 0,
              winRate: 0,
              avgScore: 0,
              longestWinStreak: 0,
              currentStreak: 0,
              attendances: 0,
              totalScore: 0,
              lastMatchDate: null,
            };
            sessionDates[name] = new Set();
            streaks[name] = { current: 0, longest: 0 };
          }
          if (matchDate) sessionDates[name].add(matchDate);
          if (match.match_date) memberMap[name].lastMatchDate = match.match_date;
        });

        if (!match.winner) return;

        const t1Score = match.team1_score || 0;
        const t2Score = match.team2_score || 0;
        const team1Won = match.winner === 'team1';

        // Team 1 players
        team1.forEach(p => {
          const name = p.trim();
          const m = memberMap[name];
          m.totalMatches++;
          m.totalScore += t1Score;
          if (team1Won) {
            m.wins++;
            const s = streaks[name];
            s.current = s.current > 0 ? s.current + 1 : 1;
            if (s.current > s.longest) s.longest = s.current;
          } else {
            m.losses++;
            const s = streaks[name];
            s.current = s.current < 0 ? s.current - 1 : -1;
          }
        });

        // Team 2 players
        team2.forEach(p => {
          const name = p.trim();
          const m = memberMap[name];
          m.totalMatches++;
          m.totalScore += t2Score;
          if (!team1Won) {
            m.wins++;
            const s = streaks[name];
            s.current = s.current > 0 ? s.current + 1 : 1;
            if (s.current > s.longest) s.longest = s.current;
          } else {
            m.losses++;
            const s = streaks[name];
            s.current = s.current < 0 ? s.current - 1 : -1;
          }
        });

        // Process Duos
        const processDuo = (players: string[], won: boolean) => {
          if (players.length === 2) {
            const [p1, p2] = [players[0].trim(), players[1].trim()];
            const key = getDuoKey(p1, p2);
            if (!duoMap[key]) {
              const [sortedP1, sortedP2] = [p1, p2].sort();
              duoMap[key] = { player1: sortedP1, player2: sortedP2, wins: 0, total: 0, currentStreak: 0, longestStreak: 0 };
            }
            const d = duoMap[key];
            d.total++;
            if (won) {
              d.wins++;
              d.currentStreak = d.currentStreak > 0 ? d.currentStreak + 1 : 1;
              if (d.currentStreak > d.longestStreak) d.longestStreak = d.currentStreak;
            } else {
              d.currentStreak = 0;
            }
          }
        };

        processDuo(team1, team1Won);
        processDuo(team2, !team1Won);
      });

      // Finalize member stats
      const memberStatList: MemberStat[] = Object.values(memberMap).map(m => {
        const attendances = sessionDates[m.name]?.size || 0;
        const winRate = m.totalMatches > 0 ? Math.round((m.wins / m.totalMatches) * 100) : 0;
        const avgScore = m.totalMatches > 0 ? Math.round((m.totalScore / m.totalMatches) * 10) / 10 : 0;
        const s = streaks[m.name] || { current: 0, longest: 0 };

        return {
          ...m,
          attendances,
          winRate,
          avgScore,
          longestWinStreak: s.longest,
          currentStreak: s.current,
        };
      });

      const duoStatList: DuoStat[] = Object.values(duoMap).map(d => ({
        player1: d.player1,
        player2: d.player2,
        wins: d.wins,
        total: d.total,
        winRate: d.total > 0 ? Math.round((d.wins / d.total) * 100) : 0,
        longestStreak: d.longestStreak,
      }));

      setStats(memberStatList);
      setDuos(duoStatList);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching DLBC member stats:', err);
    } finally {
      setLoading(false);
    }
  }

  // Max stats for weighted formula
  const maxStats = {
    matches: Math.max(...stats.map(s => s.totalMatches), 1),
    wins: Math.max(...stats.map(s => s.wins), 1),
    avgScore: Math.max(...stats.map(s => s.avgScore), 1),
    streak: Math.max(...stats.map(s => s.longestWinStreak), 1),
  };

  // Rank sorting for active category
  const rankedList = (() => {
    switch (activeCategory) {
      case 'best-player':
        return [...stats]
          .filter(s => s.totalMatches >= 2)
          .sort((a, b) => calculateBestPlayerScore(b, maxStats) - calculateBestPlayerScore(a, maxStats));
      case 'attendance':
        return [...stats].sort((a, b) => b.attendances - a.attendances || b.totalMatches - a.totalMatches);
      case 'wins':
        return [...stats].sort((a, b) => b.wins - a.wins || b.totalMatches - a.totalMatches);
      case 'losses':
        return [...stats].sort((a, b) => b.losses - a.losses);
      case 'winrate':
        return [...stats].filter(s => s.totalMatches >= 2).sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);
      case 'matches':
        return [...stats].sort((a, b) => b.totalMatches - a.totalMatches);
      case 'avgscore':
        return [...stats].filter(s => s.totalMatches >= 2).sort((a, b) => b.avgScore - a.avgScore);
      case 'streak':
        return [...stats].sort((a, b) => b.longestWinStreak - a.longestWinStreak);
      case 'rookie':
        return [...stats].filter(s => s.totalMatches > 0 && s.totalMatches <= 5).sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);
      default:
        return stats;
    }
  })();

  // Duos sorted
  const rankedDuos = [...duos].sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);

  // Spotlight cards data
  const mostWinsMember = [...stats].sort((a, b) => b.wins - a.wins)[0];
  const mostAttendedMember = [...stats].sort((a, b) => b.attendances - a.attendances)[0];
  const highestStreakMember = [...stats].sort((a, b) => b.longestWinStreak - a.longestWinStreak)[0];

  // Full recap table sort & filter
  const sortedRecap = [...stats]
    .filter(s => s.name.toLowerCase().includes(recapSearch.toLowerCase()))
    .sort((a, b) => {
      let valA: any = a[recapSort];
      let valB: any = b[recapSort];
      if (typeof valA === 'string') {
        return recapDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return recapDir === 'asc' ? valA - valB : valB - valA;
    });

  const top3 = rankedList.slice(0, 3);
  const restRanked = showAll ? rankedList.slice(3) : rankedList.slice(3, 8);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/80 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              Statistik Member DLBC
            </h1>
            <BranchBadge branchId={BRANCH_ID} />
          </div>
          <p className="text-sm text-zinc-400">
            Leaderboard, rekap performa, dan ranking 9 kategori cabang Cikupa
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl border border-white/10 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* 4 Spotlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">Total Member DLBC</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.length}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Cabang Cikupa</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">Paling Banyak Menang</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-black text-white truncate">{mostWinsMember?.name || '-'}</div>
          <p className="text-[11px] text-amber-400 mt-1">{mostWinsMember?.wins || 0} Kemenangan</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">Paling Rajin Hadir</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-black text-white truncate">{mostAttendedMember?.name || '-'}</div>
          <p className="text-[11px] text-blue-400 mt-1">{mostAttendedMember?.attendances || 0} Pertemuan Sesi</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">Streak Win Terpanjang</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-lg font-black text-white truncate">{highestStreakMember?.name || '-'}</div>
          <p className="text-[11px] text-red-400 mt-1">🔥 {highestStreakMember?.longestWinStreak || 0} Win Beruntun</p>
        </div>
      </div>

      {/* 10 Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setShowAll(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                isSelected
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-zinc-900/80 text-zinc-400 border-white/10 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Leaderboard Panel */}
      <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 shadow-xl space-y-5">
        <div className="border-b border-white/10 pb-3">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-400" />
            {CATEGORIES.find(c => c.id === activeCategory)?.label}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {CATEGORIES.find(c => c.id === activeCategory)?.desc}
          </p>
        </div>

        {activeCategory === 'duo' ? (
          /* DUO LEADERBOARD */
          <div className="space-y-3">
            {rankedDuos.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">Belum ada data pasangan ganda di DLBC</div>
            ) : (
              rankedDuos.map((duo, idx) => {
                const chem = duoChemistry(duo.winRate, duo.total);
                return (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-zinc-800/40 border border-white/5 gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black">{medal(idx + 1)}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{duo.player1} & {duo.player2}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold inline-block mt-0.5 ${chem.color}`}>
                          {chem.emoji} {chem.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-zinc-400">Total: <strong className="text-white">{duo.total} main</strong></span>
                      <span className="text-zinc-400">Menang: <strong className="text-emerald-400">{duo.wins}</strong></span>
                      <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                        {duo.winRate}% Win
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* SINGLE PLAYER LEADERBOARD WITH PODIUM */
          <div className="space-y-5">
            {/* Top 3 Podium Cards */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {top3.map((player, idx) => {
                  const rank = idx + 1;
                  return (
                    <div
                      key={player.name}
                      className={`p-4 rounded-2xl border relative overflow-hidden flex flex-col justify-between ${
                        rank === 1
                          ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                          : rank === 2
                          ? 'bg-zinc-800/80 border-zinc-600/40'
                          : 'bg-orange-500/10 border-orange-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{medal(rank)}</span>
                        <span className="text-xs font-black text-zinc-400">Rank #{rank}</span>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-white truncate">{player.name}</h4>
                        <p className="text-xs text-emerald-400 font-bold mt-1">
                          {activeCategory === 'best-player' && `${calculateBestPlayerScore(player, maxStats)} Poin Weighted`}
                          {activeCategory === 'attendance' && `${player.attendances} Sesi Hadir`}
                          {activeCategory === 'wins' && `${player.wins} Kemenangan (${player.winRate}%)`}
                          {activeCategory === 'losses' && `${player.losses} Kekalahan`}
                          {activeCategory === 'winrate' && `${player.winRate}% Win Rate (${player.wins}/${player.totalMatches})`}
                          {activeCategory === 'matches' && `${player.totalMatches} Pertandingan`}
                          {activeCategory === 'avgscore' && `${player.avgScore} Avg Poin`}
                          {activeCategory === 'streak' && `🔥 ${player.longestWinStreak} Win Beruntun`}
                          {activeCategory === 'rookie' && `${player.winRate}% Win Rate (${player.totalMatches} main)`}
                        </p>
                      </div>

                      <div className="text-[11px] text-zinc-500 mt-2 pt-2 border-t border-white/5 flex justify-between">
                        <span>{player.totalMatches} total main</span>
                        <span>{player.wins}M - {player.losses}K</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rest of the ranks table */}
            {restRanked.length > 0 && (
              <div className="divide-y divide-white/5 bg-zinc-800/30 rounded-xl border border-white/5">
                {restRanked.map((player, idx) => {
                  const rank = idx + 4;
                  return (
                    <div key={player.name} className="flex items-center justify-between p-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-black text-zinc-500">#{rank}</span>
                        <span className="font-bold text-white">{player.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-zinc-400">{player.totalMatches} main</span>
                        <span className="text-zinc-300">{player.wins}M - {player.losses}K</span>
                        <span className="font-black text-emerald-400">{player.winRate}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {rankedList.length > 8 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full py-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors"
              >
                {showAll ? 'Tampilkan Lebih Sedikit' : `Lihat Semua (${rankedList.length} Pemain)`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Full Rekap All Members Table */}
      <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Rekap Seluruh Member DLBC
            </h3>
            <p className="text-xs text-zinc-400">Klik judul kolom untuk mengurutkan data</p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari member..."
              value={recapSearch}
              onChange={e => setRecapSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-zinc-800 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 font-semibold">
                <th className="py-2.5 px-3">Nama Member</th>
                <th
                  onClick={() => {
                    if (recapSort === 'attendances') setRecapDir(d => d === 'asc' ? 'desc' : 'asc');
                    else { setRecapSort('attendances'); setRecapDir('desc'); }
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                >
                  Sesi Hadir {recapSort === 'attendances' && (recapDir === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  onClick={() => {
                    if (recapSort === 'totalMatches') setRecapDir(d => d === 'asc' ? 'desc' : 'asc');
                    else { setRecapSort('totalMatches'); setRecapDir('desc'); }
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                >
                  Main {recapSort === 'totalMatches' && (recapDir === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  onClick={() => {
                    if (recapSort === 'wins') setRecapDir(d => d === 'asc' ? 'desc' : 'asc');
                    else { setRecapSort('wins'); setRecapDir('desc'); }
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                >
                  Menang {recapSort === 'wins' && (recapDir === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  onClick={() => {
                    if (recapSort === 'losses') setRecapDir(d => d === 'asc' ? 'desc' : 'asc');
                    else { setRecapSort('losses'); setRecapDir('desc'); }
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                >
                  Kalah {recapSort === 'losses' && (recapDir === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  onClick={() => {
                    if (recapSort === 'winRate') setRecapDir(d => d === 'asc' ? 'desc' : 'asc');
                    else { setRecapSort('winRate'); setRecapDir('desc'); }
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                >
                  Win Rate {recapSort === 'winRate' && (recapDir === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  onClick={() => {
                    if (recapSort === 'avgScore') setRecapDir(d => d === 'asc' ? 'desc' : 'asc');
                    else { setRecapSort('avgScore'); setRecapDir('desc'); }
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                >
                  Avg Skor {recapSort === 'avgScore' && (recapDir === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  onClick={() => {
                    if (recapSort === 'longestWinStreak') setRecapDir(d => d === 'asc' ? 'desc' : 'asc');
                    else { setRecapSort('longestWinStreak'); setRecapDir('desc'); }
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                >
                  Max Streak {recapSort === 'longestWinStreak' && (recapDir === 'desc' ? '↓' : '↑')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedRecap.map(m => (
                <tr key={m.name} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">{m.name}</td>
                  <td className="py-2.5 px-3 text-zinc-300">{m.attendances}</td>
                  <td className="py-2.5 px-3 text-zinc-300">{m.totalMatches}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">{m.wins}</td>
                  <td className="py-2.5 px-3 text-rose-400 font-semibold">{m.losses}</td>
                  <td className="py-2.5 px-3 font-black text-emerald-400">{m.winRate}%</td>
                  <td className="py-2.5 px-3 text-zinc-300">{m.avgScore}</td>
                  <td className="py-2.5 px-3 text-amber-400 font-semibold">🔥 {m.longestWinStreak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
