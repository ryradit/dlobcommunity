'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import {
  Trophy, Medal, Target, TrendingUp, TrendingDown, Users,
  Flame, Star, Zap, Calendar, Activity, Award, RefreshCw,
  ChevronUp, ChevronDown, Minus, HelpCircle,
} from 'lucide-react';
import TutorialOverlay, { TutorialStep } from '@/components/TutorialOverlay';

// ─── Tutorial steps ───────────────────────────────────────────────────────────

const STATISTIK_TUTORIAL_STEPS: TutorialStep[] = [
  {
    element: '[data-tutorial="page-header"]',
    title: 'Statistik Member',
    description: 'Halaman ini menampilkan papan peringkat lengkap semua anggota DLOB. Data diperbarui otomatis setiap kali pertandingan baru diinput. Ikuti panduan ini untuk memahami setiap bagian.',
    position: 'bottom',
  },
  {
    element: '[data-tutorial="live-bar"]',
    title: 'Indikator Live',
    description: 'Halaman ini memperbarui data otomatis setiap kali admin menyimpan pertandingan baru — tidak perlu refresh manual. Titik hijau = aktif memantau perubahan real-time.',
    position: 'bottom',
  },
  {
    element: '[data-tutorial="spotlight-cards"]',
    title: 'Kartu Ringkasan',
    description: '4 kartu highlight utama: total member, pemain dengan kemenangan terbanyak, member paling rajin hadir, dan pemilik streak terpanjang saat ini.',
    position: 'bottom',
  },
  {
    element: '[data-tutorial="category-tabs"]',
    title: 'Kategori Leaderboard',
    description: 'Ada 9 kategori — klik tab untuk mengganti tampilan. Setiap kategori punya podium Top 3 (1st, 2nd, 3rd) beserta tabel peringkat lengkap di bawahnya.',
    position: 'bottom',
  },
  {
    element: '[data-tutorial="leaderboard-panel"]',
    title: 'Podium & Daftar Peringkat',
    description: 'Tiga teratas ditampilkan dalam podium bergradien. Di bawahnya ada tabel dengan nilai, M/K, total main, dan streak saat ini. Gunakan "Tampilkan semua" untuk melihat seluruh peringkat.',
    position: 'top',
  },
  {
    element: '[data-tutorial="rekap-table"]',
    title: 'Rekap Semua Member',
    description: 'Tabel ini menampilkan statistik semua member sekaligus. Klik judul kolom (Pertemuan, Main, M, K, Win%, Avg Skor, Streak Max) untuk mengurutkan dari besar ke kecil atau sebaliknya.',
    position: 'top',
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberStat {
  name: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  avgScore: number;
  longestWinStreak: number;
  currentStreak: number; // positive = win streak, negative = lose streak
  attendances: number;   // distinct play dates (sessions) attended
  totalScore: number;
}

interface DuoStat {
  player1: string;
  player2: string;
  wins: number;
  total: number;
  winRate: number;
  longestStreak: number; // longest consecutive wins as a duo
}

// ─── Leaderboard categories ────────────────────────────────────────────────

type Category =
  | 'attendance'
  | 'wins'
  | 'losses'
  | 'winrate'
  | 'matches'
  | 'avgscore'
  | 'streak'
  | 'rookie'
  | 'duo';

const CATEGORIES: { id: Category; label: string; icon: any; desc: string; color: string }[] = [
  { id: 'attendance', label: 'Paling Rajin Hadir',    icon: Calendar,      desc: 'Pertemuan terbanyak · seri diputus oleh total pertandingan terbanyak',          color: 'from-blue-500 to-cyan-500'      },
  { id: 'wins',       label: 'Paling Banyak Menang',  icon: Trophy,        desc: 'Total kemenangan tertinggi · seri diputus oleh total pertandingan terbanyak', color: 'from-yellow-500 to-amber-500'   },
  { id: 'losses',     label: 'Paling Banyak Kalah',   icon: TrendingDown,  desc: 'Total kekalahan terbanyak',           color: 'from-red-500 to-rose-500'       },
  { id: 'winrate',    label: 'Win Rate Terbaik',       icon: TrendingUp,    desc: 'Min. 5 pertandingan',                 color: 'from-green-500 to-emerald-500'  },
  { id: 'matches',    label: 'Paling Aktif',           icon: Activity,      desc: 'Total pertandingan terbanyak',        color: 'from-purple-500 to-violet-500'  },
  { id: 'avgscore',   label: 'Rata-rata Skor Tinggi',  icon: Target,        desc: 'Poin per game tertinggi (min 5 main)',color: 'from-orange-500 to-pink-500'    },
  { id: 'streak',     label: 'Streak Kemenangan',      icon: Flame,         desc: 'Setria kemenangan terpanjang',        color: 'from-red-500 to-orange-500'     },
  { id: 'rookie',     label: 'Rookie Terbaik',         icon: Star,          desc: 'Win rate terbaik ≤ 10 pertandingan', color: 'from-sky-500 to-blue-500'       },
  { id: 'duo',        label: 'Duo Terbaik',            icon: Users,         desc: 'Pasangan dengan win rate tertinggi',  color: 'from-pink-500 to-fuchsia-500'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function medal(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function rankColor(rank: number) {
  if (rank === 1) return 'bg-yellow-100 dark:bg-yellow-500/10 border-yellow-400 dark:border-yellow-500/40';
  if (rank === 2) return 'bg-gray-100 dark:bg-zinc-700/40 border-gray-400 dark:border-zinc-500/40';
  if (rank === 3) return 'bg-orange-100 dark:bg-orange-500/10 border-orange-400 dark:border-orange-500/40';
  return 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700';
}

function duoChemistry(winRate: number, total: number): { label: string; color: string; emoji: string } {
  if (winRate >= 75 && total >= 10) return { label: 'Duo Legenda',       color: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-400 dark:border-yellow-500/40', emoji: '⚡' };
  if (winRate >= 60)                return { label: 'Pasangan Serasi',   color: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-400 dark:border-green-500/40',   emoji: '🔥' };
  if (winRate >= 50)                return { label: 'Sinergi Bagus',     color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-500/40',       emoji: '✨' };
  return                                    { label: 'Masih Berkembang', color: 'bg-gray-100 dark:bg-zinc-700/50 text-gray-500 dark:text-zinc-400 border-gray-300 dark:border-zinc-600',           emoji: '🌱' };
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MemberStatistikPage() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MemberStat[]>([]);
  const [duos, setDuos] = useState<DuoStat[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('attendance');
  const [showAll, setShowAll] = useState(false);
  const [recapSort, setRecapSort] = useState<'totalMatches' | 'wins' | 'losses' | 'winRate' | 'avgScore' | 'attendances' | 'longestWinStreak'>('totalMatches');
  const [recapDir, setRecapDir] = useState<'desc' | 'asc'>('desc');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [liveRefreshing, setLiveRefreshing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Tutorial state ────────────────────────────────────────────────────────
  const [isTutorialActive, setIsTutorialActive] = useState(false);

  // Auto-show on first visit after data loads
  useEffect(() => {
    if (loading) return;
    if (!localStorage.getItem('tutorial_statistik-member-v1')) setIsTutorialActive(true);
  }, [loading]);

  useEffect(() => {
    fetchStats();

    // Real-time: re-fetch whenever matches or match_members change
    const handleChange = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setLiveRefreshing(true);
        await fetchStats();
        setLiveRefreshing(false);
      }, 1500); // debounce 1.5s so rapid inserts don't spam fetches
    };

    const matchesSub = supabase
      .channel('statistik-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, handleChange)
      .subscribe();

    const membersSub = supabase
      .channel('statistik-match-members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_members' }, handleChange)
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(matchesSub);
      supabase.removeChannel(membersSub);
    };
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchStats() {
    setLoading(true);
    try {
      // Fetch profiles (real members only)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, is_test_account')
        .order('full_name');

      const realProfiles = (profiles ?? []).filter((p: any) => !p.is_test_account);
      const realNames = new Set(realProfiles.map((p: any) => p.full_name));

      // Fetch all matches
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true })
        .limit(10000);

      // Fetch all match_members for attendance
      const { data: matchMembers } = await supabase
        .from('match_members')
        .select('member_name, match_id')
        .limit(50000);

      if (!matches || !matchMembers) return;

      // Build match_id → date string map so we can count distinct play sessions
      const matchDateMap = new Map<string, string>();
      for (const m of matches) {
        if (m.id && m.match_date) {
          matchDateMap.set(m.id, new Date(m.match_date).toISOString().slice(0, 10)); // YYYY-MM-DD
        }
      }

      // Build attendance map: distinct play dates per member (1 date = 1 session regardless of how many matches that day)
      const attendanceMap = new Map<string, Set<string>>();
      for (const mm of matchMembers) {
        if (!realNames.has(mm.member_name)) continue;
        const date = matchDateMap.get(mm.match_id);
        if (!date) continue; // skip if match not found
        if (!attendanceMap.has(mm.member_name)) attendanceMap.set(mm.member_name, new Set());
        attendanceMap.get(mm.member_name)!.add(date);
      }

      // Compute per-player stats
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

      // Process matches in chronological order for streaks
      const playerMatchHistory = new Map<string, boolean[]>(); // true=win

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

      // Compute streak + finals
      for (const [name, history] of playerMatchHistory) {
        const s = statMap.get(name);
        if (!s) continue;

        // Longest win streak
        let longest = 0, current = 0;
        for (const won of history) {
          if (won) { current++; longest = Math.max(longest, current); }
          else { current = 0; }
        }
        s.longestWinStreak = longest;

        // Current streak (positive=win, negative=lose)
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

      // Duo stats — track history per pair for streak calculation
      const duoMap = new Map<string, { wins: number; total: number; history: boolean[] }>();
      for (const match of matches) { // already sorted ascending by match_date
        const pairs = [
          [match.team1_player1, match.team1_player2, match.winner === 'team1'],
          [match.team2_player1, match.team2_player2, match.winner === 'team2'],
        ];
        for (const [p1, p2, won] of pairs) {
          if (!p1 || !p2 || !realNames.has(p1 as string) || !realNames.has(p2 as string)) continue;
          const key = [p1, p2].sort().join('|||');
          if (!duoMap.has(key)) duoMap.set(key, { wins: 0, total: 0, history: [] });
          const d = duoMap.get(key)!;
          d.total++;
          d.history.push(!!won);
          if (won) d.wins++;
        }
      }

      const duoList: DuoStat[] = Array.from(duoMap.entries())
        .map(([key, d]) => {
          const [p1, p2] = key.split('|||');
          // Compute longest win streak
          let longestStreak = 0, cur = 0;
          for (const w of d.history) {
            if (w) { cur++; longestStreak = Math.max(longestStreak, cur); }
            else cur = 0;
          }
          return {
            player1: p1, player2: p2,
            wins: d.wins, total: d.total,
            winRate: Math.round((d.wins / d.total) * 100),
            longestStreak,
          };
        })
        .filter(d => d.total >= 3)
        .sort((a, b) => b.winRate - a.winRate || b.total - a.total);

      setDuos(duoList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }

  // ─── Sort / filter data per active category ──────────────────────────────

  function getSortedStats(): MemberStat[] {
    let sorted: MemberStat[];
    switch (activeCategory) {
      case 'attendance': sorted = [...stats].sort((a, b) => b.attendances - a.attendances || b.totalMatches - a.totalMatches); break;
      case 'wins':       sorted = [...stats].sort((a, b) => b.wins - a.wins || b.avgScore - a.avgScore || b.longestWinStreak - a.longestWinStreak); break;
      case 'losses':     sorted = [...stats].sort((a, b) => b.losses - a.losses || a.avgScore - b.avgScore); break;
      case 'winrate':    sorted = [...stats].filter(s => s.totalMatches >= 5).sort((a, b) => b.winRate - a.winRate || b.totalMatches - a.totalMatches || b.attendances - a.attendances); break;
      case 'matches':    sorted = [...stats].sort((a, b) => b.totalMatches - a.totalMatches); break;
      case 'avgscore':   sorted = [...stats].filter(s => s.totalMatches >= 5).sort((a, b) => b.avgScore - a.avgScore); break;
      case 'streak':     sorted = [...stats].sort((a, b) => b.longestWinStreak - a.longestWinStreak); break;
      case 'rookie':     sorted = [...stats].filter(s => s.totalMatches > 0 && s.totalMatches <= 10).sort((a, b) => b.winRate - a.winRate); break;
      default:           sorted = stats;
    }
    return sorted;
  }

  function getDisplayValue(s: MemberStat): string {
    switch (activeCategory) {
      case 'attendance': return `${s.attendances} pertemuan · ${s.totalMatches} main`;
      case 'wins':       return `${s.wins} menang`;
      case 'losses':     return `${s.losses} kalah`;
      case 'winrate':    return `${s.winRate}%`;
      case 'matches':    return `${s.totalMatches} main`;
      case 'avgscore':   return `${s.avgScore} poin`;
      case 'streak':     return `${s.longestWinStreak}x beruntun`;
      case 'rookie':     return `${s.winRate}% (${s.totalMatches}M)`;
      default:           return '';
    }
  }

  function getSubValue(s: MemberStat): string {
    switch (activeCategory) {
      case 'attendance': return `${s.wins}M ${s.losses}K · ${s.winRate > 0 ? s.winRate + '%' : '-'}`;
      case 'wins':       return `${s.totalMatches} main · ${s.winRate}% WR`;
      case 'losses':     return `${s.totalMatches} total main`;
      case 'winrate':    return `${s.wins}M / ${s.losses}K`;
      case 'matches':    return `${s.wins}M ${s.losses}K`;
      case 'avgscore':   return `${s.totalMatches} pertandingan`;
      case 'streak':     return `${s.totalMatches} total main`;
      case 'rookie':     return `${s.wins}M / ${s.losses}K`;
      default:           return '';
    }
  }

  // ─── Summary overview stats (banner cards) ────────────────────────────────

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
  const mostActive    = [...stats].sort((a, b) => b.totalMatches - a.totalMatches)[0];
  const bestUnbeatenList = [...stats].filter(s => s.losses === 0 && s.wins > 0).sort((a, b) => b.wins - a.wins);
  const maxUnbeatenWins = bestUnbeatenList[0]?.wins ?? 0;
  const bestUnbeaten = bestUnbeatenList.filter(s => s.wins === maxUnbeatenWins);
  const kingStreak    = [...stats].sort((a, b) => b.longestWinStreak - a.longestWinStreak)[0];

  const categoryData = activeCategory === 'duo' ? duos : getSortedStats();
  const SHOW_LIMIT = 10;
  const displayData = showAll ? categoryData : categoryData.slice(0, SHOW_LIMIT);

  const cat = CATEGORIES.find(c => c.id === activeCategory)!;

  function toggleRecapSort(col: typeof recapSort) {
    if (recapSort === col) setRecapDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setRecapSort(col); setRecapDir('desc'); }
  }

  const sortedRecap = [...stats].sort((a, b) => {
    const mul = recapDir === 'desc' ? -1 : 1;
    return mul * (a[recapSort] - b[recapSort]);
  });

  function SortTh({ col, label, className }: { col: typeof recapSort; label: string; className?: string }) {
    const active = recapSort === col;
    return (
      <th
        className={`px-4 py-3 text-right font-semibold cursor-pointer select-none group transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
          active ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-zinc-400'
        } ${className ?? ''}`}
        onClick={() => toggleRecapSort(col)}
      >
        <span className="inline-flex items-center justify-end gap-1">
          {label}
          <span className={`text-xs ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
            {active ? (recapDir === 'desc' ? '▼' : '▲') : '▼'}
          </span>
        </span>
      </th>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-zinc-400 font-semibold">Memuat statistik member...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6 transition-colors duration-300">

      <TutorialOverlay
        steps={STATISTIK_TUTORIAL_STEPS}
        isActive={isTutorialActive}
        onClose={() => setIsTutorialActive(false)}
        tutorialKey="statistik-member-v1"
      />

      <div className="space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4" data-tutorial="page-header">
          <div className="p-3 bg-linear-to-br from-yellow-500 to-orange-500 rounded-xl shadow-sm">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Statistik Member</h1>
            <p className="text-gray-600 dark:text-zinc-400 font-medium transition-colors duration-300">Leaderboard & rekap performa seluruh anggota</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setIsTutorialActive(true)}
              className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition-all border border-purple-200 dark:border-purple-500/30"
              title="Panduan penggunaan"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={fetchStats}
              className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-400 transition-all border border-gray-200 dark:border-zinc-700"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${liveRefreshing ? 'animate-spin text-purple-500' : ''}`} />
            </button>
          </div>
        </div>
        {/* Live status bar */}
        <div className="flex items-center gap-2 -mt-3" data-tutorial="live-bar">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            liveRefreshing ? 'text-purple-500 dark:text-purple-400' : 'text-green-600 dark:text-green-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              liveRefreshing ? 'bg-purple-500 animate-ping' : 'bg-green-500'
            }`} />
            {liveRefreshing ? 'Memperbarui data...' : 'Live — otomatis update saat pertandingan baru diinput'}
          </span>
          {lastUpdated && !liveRefreshing && (
            <span className="text-xs text-gray-400 dark:text-zinc-500">
              Terakhir: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>

        {/* ── Quick spotlight cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-tutorial="spotlight-cards">
          {[
            { label: 'Total Member',       value: totalPlayers,                      sub: `${totalWithData} punya data main`, icon: Users,      color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10'    },
            { label: 'Pemain Terbaik',      value: topWinner?.name ?? '-',            sub: `${topWinner?.winRate ?? 0}% · ${topWinner?.avgScore ?? 0} poin`,             icon: Trophy,     color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-500/10' },
            { label: 'Paling Tak Terkalahkan', value: bestUnbeaten.map(m => m.name).join(', ') ?? '-',      sub: `${maxUnbeatenWins} M - 0 K`, icon: Flame,      color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
            { label: 'Streak Terpanjang',   value: kingStreak?.name ?? '-',           sub: `${kingStreak?.longestWinStreak ?? 0}x beruntun`, icon: Flame,      color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10'  },
          ].map(card => (
            <div key={card.label} className={`rounded-xl p-4 border-2 border-gray-200 dark:border-transparent shadow-sm ${card.bg} transition-colors duration-300`}>
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={`w-5 h-5 ${card.color}`} />
                <span className="text-xs text-gray-500 dark:text-zinc-400 font-semibold uppercase tracking-wide">{card.label}</span>
              </div>
              <div className={`text-xl font-bold truncate ${card.color} transition-colors duration-300`}>{card.value}</div>
              <div className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Category tabs ────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border-2 border-gray-200 dark:border-transparent shadow-sm overflow-hidden transition-colors duration-300" data-tutorial="leaderboard-panel">
          <div className="overflow-x-auto" data-tutorial="category-tabs">
            <div className="flex border-b-2 border-gray-200 dark:border-zinc-700 min-w-max">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setActiveCategory(c.id); setShowAll(false); }}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-0.5 transition-all ${
                    activeCategory === c.id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10'
                      : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <c.icon className="w-4 h-4" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Category header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2.5 rounded-lg bg-linear-to-br ${cat.color}`}>
                <cat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{cat.label}</h2>
                <p className="text-sm text-gray-500 dark:text-zinc-400">{cat.desc}</p>
              </div>
              <div className="ml-auto text-sm text-gray-400 dark:text-zinc-500">{categoryData.length} member</div>
            </div>

            {/* Tiebreaker note for attendance */}
            {activeCategory === 'attendance' && (
              <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-xs text-blue-700 dark:text-blue-300">
                <Calendar className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span><strong>Catatan seri:</strong> jika dua pemain memiliki jumlah pertemuan yang sama, pemain yang lebih banyak bermain (pertandingan) menempati posisi lebih tinggi.</span>
              </div>
            )}

            {/* Tiebreaker note for wins */}
            {activeCategory === 'wins' && (
              <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
                <Trophy className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span><strong>Catatan seri:</strong> jika dua pemain memiliki jumlah kemenangan sama, pemain yang lebih banyak bermain menempati posisi lebih tinggi — karena membuktikan konsistensi dalam lebih banyak pertandingan.</span>
              </div>
            )}

            {categoryData.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-zinc-500">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-semibold">Belum ada data untuk kategori ini</p>
              </div>
            ) : (
              <>
                {/* ── Podium top 3 ───────────────────────────────────────── */}
                {activeCategory !== 'duo' && (displayData as MemberStat[]).length >= 3 && (
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {/* 2nd */}
                    <div className={`rounded-xl border-2 p-4 text-center col-start-1 self-end ${rankColor(2)}`}>
                      <div className="text-3xl mb-2">🥈</div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">{(displayData as MemberStat[])[1].name}</div>
                      <div className="text-lg font-extrabold text-gray-700 dark:text-zinc-200 mt-1">{getDisplayValue((displayData as MemberStat[])[1])}</div>
                      <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{getSubValue((displayData as MemberStat[])[1])}</div>
                    </div>
                    {/* 1st */}
                    <div className={`rounded-xl border-2 p-5 text-center relative ${rankColor(1)}`}>
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">👑</div>
                      <div className="text-4xl mb-2 mt-2">🥇</div>
                      <div className="font-bold text-gray-900 dark:text-white leading-tight truncate">{(displayData as MemberStat[])[0].name}</div>
                      <div className="text-xl font-extrabold text-yellow-600 dark:text-yellow-400 mt-1">{getDisplayValue((displayData as MemberStat[])[0])}</div>
                      <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{getSubValue((displayData as MemberStat[])[0])}</div>
                    </div>
                    {/* 3rd */}
                    <div className={`rounded-xl border-2 p-4 text-center self-end ${rankColor(3)}`}>
                      <div className="text-3xl mb-2">🥉</div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">{(displayData as MemberStat[])[2].name}</div>
                      <div className="text-lg font-extrabold text-gray-700 dark:text-zinc-200 mt-1">{getDisplayValue((displayData as MemberStat[])[2])}</div>
                      <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{getSubValue((displayData as MemberStat[])[2])}</div>
                    </div>
                  </div>
                )}

                {/* ── Duo podium ──────────────────────────────────────────── */}
                {activeCategory === 'duo' && (displayData as DuoStat[]).length >= 1 && (() => {
                  const duoData = displayData as DuoStat[];
                  // stepped podium: 2nd left, 1st center, 3rd right — fall back if < 3
                  const podiumOrder = duoData.length >= 3 ? [1, 0, 2] : duoData.length === 2 ? [1, 0] : [0];
                  const stepHeight  = ['h-20', 'h-32', 'h-14']; // 2nd / 1st / 3rd platform
                  const cardGrad    = [
                    'from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-600 border-gray-400 dark:border-zinc-500',           // #2
                    'from-yellow-200 to-amber-300 dark:from-yellow-600/40 dark:to-amber-600/30 border-yellow-400 dark:border-yellow-500', // #1
                    'from-orange-100 to-orange-200 dark:from-orange-700/30 dark:to-orange-600/20 border-orange-300 dark:border-orange-500/50', // #3
                  ];

                  return (
                    <div className="mb-8">
                      {/* ── platform area ── */}
                      <div className={`grid gap-4 mb-0 items-end ${
                        podiumOrder.length === 3 ? 'grid-cols-3' :
                        podiumOrder.length === 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-xs mx-auto'
                      }`}>
                        {podiumOrder.map((idx, col) => {
                          const d = duoData[idx];
                          const rank = idx + 1;
                          const chem = duoChemistry(d.winRate, d.total);
                          const isFirst = rank === 1;
                          return (
                            <div key={idx} className="flex flex-col items-center">
                              {/* card */}
                              <div className={`w-full rounded-2xl border-2 bg-linear-to-br p-4 text-center shadow-md relative ${
                                cardGrad[col] ?? cardGrad[2]
                              }`}>
                                {isFirst && (
                                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl drop-shadow">👑</div>
                                )}
                                {/* medal */}
                                <div className={`${isFirst ? 'text-5xl mt-3' : 'text-4xl mt-1'} mb-2 drop-shadow`}>
                                  {medal(rank)}
                                </div>
                                {/* names */}
                                <div className={`font-extrabold text-gray-900 dark:text-white leading-tight ${ isFirst ? 'text-base' : 'text-sm'}`}>{d.player1}</div>
                                <div className="flex items-center justify-center gap-1 my-1">
                                  <div className="h-px flex-1 bg-gray-400/40 dark:bg-zinc-500/40" />
                                  <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 px-1">+</span>
                                  <div className="h-px flex-1 bg-gray-400/40 dark:bg-zinc-500/40" />
                                </div>
                                <div className={`font-extrabold text-gray-900 dark:text-white leading-tight ${ isFirst ? 'text-base' : 'text-sm'}`}>{d.player2}</div>
                                {/* win rate big */}
                                <div className={`font-black mt-3 ${ isFirst ? 'text-3xl text-yellow-600 dark:text-yellow-400' : 'text-2xl text-gray-700 dark:text-zinc-200'}`}>
                                  {d.winRate}%
                                </div>
                                {/* win rate bar */}
                                <div className="w-full bg-gray-300/60 dark:bg-zinc-600/60 rounded-full h-1.5 mt-1 mb-2">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      d.winRate >= 70 ? 'bg-green-500' : d.winRate >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                                    }`}
                                    style={{ width: `${d.winRate}%` }}
                                  />
                                </div>
                                {/* M / K / streak */}
                                <div className="text-xs text-gray-600 dark:text-zinc-400 mb-2">
                                  {d.wins}M &nbsp;/&nbsp; {d.total - d.wins}K &nbsp;&middot;&nbsp; {d.total} main
                                  {d.longestStreak > 1 && (
                                    <span className="ml-1 text-orange-500 dark:text-orange-400 font-bold">🔥 Streak {d.longestStreak}x</span>
                                  )}
                                </div>
                                {/* chemistry badge */}
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${ chem.color }`}>
                                  {chem.emoji} {chem.label}
                                </span>
                              </div>
                              {/* podium step */}
                              <div className={`w-full ${ stepHeight[col] ?? stepHeight[2] } mt-0 rounded-b-lg ${
                                rank === 1 ? 'bg-linear-to-b from-yellow-400 to-amber-500 dark:from-yellow-500 dark:to-amber-600' :
                                rank === 2 ? 'bg-linear-to-b from-gray-300 to-gray-400 dark:from-zinc-500 dark:to-zinc-600' :
                                             'bg-linear-to-b from-orange-300 to-orange-400 dark:from-orange-600/70 dark:to-orange-700/70'
                              } flex items-center justify-center`}>
                                <span className="font-black text-white text-lg drop-shadow">{rank}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()} 

                {/* ── Full ranking table ──────────────────────────────────── */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-zinc-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-zinc-400 w-12">#</th>
                        {activeCategory === 'duo' ? (
                          <>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-zinc-400">Pasangan</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-zinc-400 hidden md:table-cell">Chemistry</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-zinc-400">Win Rate</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-zinc-400">M / K</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-zinc-400">Total</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-zinc-400 hidden sm:table-cell">Streak</th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-zinc-400">Member</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-zinc-400">Nilai</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-zinc-400">M / K</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-zinc-400">Total Main</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-zinc-400 hidden md:table-cell">Streak</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                      {activeCategory === 'duo'
                        ? (displayData as DuoStat[]).map((d, i) => {
                            const chem = duoChemistry(d.winRate, d.total);
                            return (
                              <tr key={i} className={`transition-colors ${i < 3 ? 'font-semibold' : ''} hover:bg-gray-50 dark:hover:bg-zinc-800/50`}>
                                <td className="px-4 py-3 text-gray-500 dark:text-zinc-500">{medal(i + 1)}</td>
                                <td className="px-4 py-3">
                                  <div className="text-gray-900 dark:text-white">{d.player1}</div>
                                  <div className="text-gray-400 dark:text-zinc-500 text-xs">+ {d.player2}</div>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${chem.color}`}>
                                    {chem.emoji} {chem.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="w-16 bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5">
                                      <div className={`h-1.5 rounded-full ${
                                        d.winRate >= 70 ? 'bg-green-500' : d.winRate >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                                      }`} style={{ width: `${d.winRate}%` }} />
                                    </div>
                                    <span className={`font-bold ${
                                      d.winRate >= 70 ? 'text-green-600 dark:text-green-400' :
                                      d.winRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                                      'text-orange-600 dark:text-orange-400'
                                    }`}>{d.winRate}%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700 dark:text-zinc-300">{d.wins} / {d.total - d.wins}</td>
                                <td className="px-4 py-3 text-right text-gray-500 dark:text-zinc-400">{d.total}</td>
                                <td className="px-4 py-3 text-right text-gray-500 dark:text-zinc-400 hidden sm:table-cell">
                                  {d.longestStreak > 1 ? <span className="text-orange-500 dark:text-orange-400 font-bold">🔥 {d.longestStreak}x</span> : '-'}
                                </td>
                              </tr>
                            );
                          })
                        : (displayData as MemberStat[]).map((s, i) => {
                            const streakIcon = s.currentStreak > 0
                              ? <ChevronUp className="w-3.5 h-3.5 text-green-500 inline" />
                              : s.currentStreak < 0
                              ? <ChevronDown className="w-3.5 h-3.5 text-red-500 inline" />
                              : <Minus className="w-3.5 h-3.5 text-gray-400 inline" />;
                            return (
                              <tr key={s.name} className={`transition-colors ${i < 3 ? 'font-semibold' : ''} hover:bg-gray-50 dark:hover:bg-zinc-800/50`}>
                                <td className="px-4 py-3 text-gray-500 dark:text-zinc-500">{medal(i + 1)}</td>
                                <td className="px-4 py-3 text-gray-900 dark:text-white">{s.name}</td>
                                <td className="px-4 py-3 text-right">
                                  <span className="font-bold text-purple-600 dark:text-purple-400">{getDisplayValue(s)}</span>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-600 dark:text-zinc-300">{s.wins} / {s.losses}</td>
                                <td className="px-4 py-3 text-right text-gray-500 dark:text-zinc-400">{s.totalMatches}</td>
                                <td className="px-4 py-3 text-right text-gray-500 dark:text-zinc-400 hidden md:table-cell">
                                  {streakIcon} {Math.abs(s.currentStreak)}
                                </td>
                              </tr>
                            );
                          })
                      }
                    </tbody>
                  </table>
                </div>

                {/* Show more/less */}
                {categoryData.length > SHOW_LIMIT && (
                  <button
                    onClick={() => setShowAll(v => !v)}
                    className="mt-4 w-full py-2.5 rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-600 text-sm font-semibold text-gray-500 dark:text-zinc-400 hover:border-purple-400 hover:text-purple-500 dark:hover:border-purple-500 dark:hover:text-purple-400 transition-all"
                  >
                    {showAll ? `Tampilkan lebih sedikit ▲` : `Tampilkan semua ${categoryData.length} member ▼`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Full member table ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border-2 border-gray-200 dark:border-transparent shadow-sm overflow-hidden transition-colors duration-300" data-tutorial="rekap-table">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-700 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">Rekap Semua Member</h2>
            <span className="ml-2 text-xs text-gray-400 dark:text-zinc-500">Klik kolom untuk mengurutkan</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-zinc-400">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-zinc-400">Member</th>
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
                {sortedRecap.map((s, i) => (
                    <tr key={s.name} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 dark:text-zinc-500">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{s.name}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-zinc-300">{s.attendances}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-zinc-300">{s.totalMatches}</td>
                      <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-semibold">{s.wins}</td>
                      <td className="px-4 py-3 text-right text-red-500 dark:text-red-400 font-semibold">{s.losses}</td>
                      <td className="px-4 py-3 text-right">
                        {s.totalMatches === 0 ? (
                          <span className="text-gray-300 dark:text-zinc-600">-</span>
                        ) : (
                          <span className={`font-bold ${s.winRate >= 70 ? 'text-green-600 dark:text-green-400' : s.winRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {s.winRate}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-zinc-400 hidden md:table-cell">
                        {s.totalMatches === 0 ? '-' : s.avgScore}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-zinc-400 hidden lg:table-cell">
                        {s.longestWinStreak > 0 ? `🔥 ${s.longestWinStreak}x` : '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
