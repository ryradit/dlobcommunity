'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Zap, ChevronDown, ChevronUp, Calendar, Users, Trophy, TrendingDown, Clock, Sparkles } from 'lucide-react';

interface Match {
  id: string;
  match_number: number;
  match_date: string | null;
  created_at: string;
  team1_player1: string | null;
  team1_player2: string | null;
  team2_player1: string | null;
  team2_player2: string | null;
  team1_score: number | null;
  team2_score: number | null;
  winner: 'team1' | 'team2' | null;
}

interface HeadToHeadMatch {
  match: Match;
  userTeam: 'team1' | 'team2';
  partner: string;
  opponent1: string;
  opponent2: string;
  teamScore: number;
  opponentScore: number;
  result: 'win' | 'loss' | 'draw';
}

interface Props {
  memberName: string;
}

type TimeRange = 'all_time' | 'current_month' | 'last_month';

// Format relative time helper
function getRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Tanggal tidak diketahui';
  const matchDate = new Date(dateString);
  const today = new Date();
  
  const d1 = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
  const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
  return matchDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Interactive chatty reminder messages helper
function getRivalryReminder(result: 'win' | 'loss' | 'draw', teamScore: number, oppScore: number, opponents: string): string {
  if (result === 'win') {
    return `Anda menang ${teamScore}-${oppScore} melawan ${opponents}. Pertahankan performa impresif Anda! 💪`;
  }
  if (result === 'loss') {
    return `Pertemuan terakhir berakhir kekalahan ${teamScore}-${oppScore}. Waktunya menyusun strategi balas dendam! 🔥`;
  }
  return `Laga seru terakhir berakhir imbang ${teamScore}-${oppScore}. Siapakah yang akan memecah kebuntuan berikutnya? 🏸`;
}

export default function HeadToHead({ memberName }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('all_time');
  const [headToHeadMatches, setHeadToHeadMatches] = useState<HeadToHeadMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOpponent, setExpandedOpponent] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchHeadToHeadMatches();
  }, [memberName, timeRange]);

  async function fetchHeadToHeadMatches() {
    try {
      setLoading(true);

      const today = new Date();
      let query = supabase
        .from('matches')
        .select('*')
        .not('team1_player1', 'is', null)
        .not('team1_player2', 'is', null)
        .not('team2_player1', 'is', null)
        .not('team2_player2', 'is', null);

      if (timeRange === 'current_month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        query = query.gte('match_date', start.toISOString()).lte('match_date', end.toISOString());
      } else if (timeRange === 'last_month') {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
        query = query.gte('match_date', start.toISOString()).lte('match_date', end.toISOString());
      }

      const { data, error } = await query.order('match_date', { ascending: false });

      if (error) {
        console.error('Error fetching matches:', error);
        return;
      }

      const relevantMatches: HeadToHeadMatch[] = [];
      const cleanMemberName = memberName.toLowerCase().trim();

      (data as Match[]).forEach((match) => {
        let userTeam: 'team1' | 'team2' | null = null;
        let partner = '';
        let opponent1 = '';
        let opponent2 = '';

        const t1p1 = (match.team1_player1 || '').toLowerCase().trim();
        const t1p2 = (match.team1_player2 || '').toLowerCase().trim();
        const t2p1 = (match.team2_player1 || '').toLowerCase().trim();
        const t2p2 = (match.team2_player2 || '').toLowerCase().trim();

        if (t1p1 === cleanMemberName || t1p2 === cleanMemberName) {
          userTeam = 'team1';
          partner = t1p1 === cleanMemberName ? (match.team1_player2 || '') : (match.team1_player1 || '');
          opponent1 = match.team2_player1 || '';
          opponent2 = match.team2_player2 || '';
        } else if (t2p1 === cleanMemberName || t2p2 === cleanMemberName) {
          userTeam = 'team2';
          partner = t2p1 === cleanMemberName ? (match.team2_player2 || '') : (match.team2_player1 || '');
          opponent1 = match.team1_player1 || '';
          opponent2 = match.team1_player2 || '';
        }

        if (userTeam && opponent1 && opponent2) {
          const teamScore = userTeam === 'team1' ? (match.team1_score || 0) : (match.team2_score || 0);
          const opponentScore = userTeam === 'team1' ? (match.team2_score || 0) : (match.team1_score || 0);

          let result: 'win' | 'loss' | 'draw' = 'draw';
          if (match.winner === userTeam) {
            result = 'win';
          } else if (match.winner && match.winner !== userTeam) {
            result = 'loss';
          }

          relevantMatches.push({
            match,
            userTeam,
            partner,
            opponent1,
            opponent2,
            teamScore,
            opponentScore,
            result,
          });
        }
      });

      setHeadToHeadMatches(relevantMatches);
    } catch (error) {
      console.error('Error in fetchHeadToHeadMatches:', error);
    } finally {
      setLoading(false);
    }
  }

  // Group matches by opponent pair
  const groupedByOpponents = Object.entries(
    headToHeadMatches.reduce((acc, h2h) => {
      const key = [h2h.opponent1, h2h.opponent2].sort().join(' & ');
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(h2h);
      return acc;
    }, {} as Record<string, HeadToHeadMatch[]>)
  ).map(([opponentKey, matches]) => {
    // Sort matches in this group by date descending (latest first)
    const sortedMatches = [...matches].sort((a, b) => {
      const dateA = a.match.match_date ?? a.match.created_at;
      const dateB = b.match.match_date ?? b.match.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    const latestMatch = sortedMatches[0];
    const groupWins = matches.filter(m => m.result === 'win').length;
    const groupLosses = matches.filter(m => m.result === 'loss').length;
    const groupDraws = matches.filter(m => m.result === 'draw').length;

    return {
      opponentKey,
      matches: sortedMatches,
      latestMatch,
      wins: groupWins,
      losses: groupLosses,
      draws: groupDraws,
      total: matches.length,
    };
  }).sort((a, b) => {
    // Sort groupings by the date of their latest match (most recent rivalry encounters first)
    const dateA = a.latestMatch.match.match_date ?? a.latestMatch.match.created_at;
    const dateB = b.latestMatch.match.match_date ?? b.latestMatch.match.created_at;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const rangeLabels = {
    all_time: 'Semua Waktu',
    current_month: 'Bulan Ini',
    last_month: 'Bulan Lalu',
  };

  // Get the single latest match across all matches for the "Hero Memory Banner"
  const absoluteLatestH2H = headToHeadMatches.length > 0 ? [...headToHeadMatches].sort((a, b) => {
    const dateA = a.match.match_date ?? a.match.created_at;
    const dateB = b.match.match_date ?? b.match.created_at;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  })[0] : null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800/80 rounded-3xl shadow-xs overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-150/60 dark:border-zinc-800/60 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 dark:from-purple-500/10 dark:to-indigo-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/30 shadow-xs">
            <Zap className="w-5 h-5 fill-purple-500/20" />
          </div>
          <div>
            <h2 className="font-black text-gray-900 dark:text-white text-base tracking-tight">Memori Rivalitas & Laga</h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold mt-0.5">Mengingat kembali laga tanding seru Anda di lapangan</p>
          </div>
        </div>

        {/* Period Dropdown */}
        <div className="relative self-start sm:self-auto">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="appearance-none bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl pl-4 pr-10 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer shadow-xs transition-all"
          >
            <option value="all_time">Semua Waktu</option>
            <option value="current_month">Bulan Ini</option>
            <option value="last_month">Bulan Lalu</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 space-y-4">
          <div className="h-28 bg-gray-100 dark:bg-zinc-800/60 rounded-2xl animate-pulse" />
          <div className="h-40 bg-gray-100 dark:bg-zinc-800/60 rounded-2xl animate-pulse" />
        </div>
      ) : headToHeadMatches.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-100/40 dark:border-purple-900/10">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Belum ada pertandingan tercatat</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-xs mx-auto">
            Tidak ditemukan riwayat pertandingan 2v2 pada periode <span className="font-extrabold text-purple-600 dark:text-purple-400">{rangeLabels[timeRange]}</span>.
          </p>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Hero Highlight Memory Card (The Ultimate Latest Match) */}
          {absoluteLatestH2H && (
            <div className="relative overflow-hidden rounded-2xl border border-indigo-150/70 dark:border-indigo-500/20 bg-linear-to-br from-indigo-500/10 via-purple-500/5 to-indigo-500/10 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-indigo-950/20 p-5 shadow-2xs hover:shadow-xs transition-shadow">
              {/* Blur glows */}
              <div className="absolute top-[-30%] left-[-10%] w-36 h-36 bg-blue-400/25 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-[-30%] right-[-10%] w-36 h-36 bg-purple-400/25 dark:bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200/20 dark:border-indigo-500/10 uppercase tracking-wider">
                    <Clock className="w-3 h-3 animate-pulse" />
                    Laga Teranyar Anda — {getRelativeTime(absoluteLatestH2H.match.match_date ?? absoluteLatestH2H.match.created_at)}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider border ${
                      absoluteLatestH2H.result === 'win'
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200/20 dark:border-emerald-500/10'
                        : absoluteLatestH2H.result === 'loss'
                          ? 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200/20 dark:border-red-500/10'
                          : 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200/20 dark:border-blue-500/10'
                    }`}
                  >
                    {absoluteLatestH2H.result === 'win' ? 'ANDA MENANG' : absoluteLatestH2H.result === 'loss' ? 'ANDA KALAH' : 'HASIL SERI'}
                  </span>
                </div>

                {/* Match Lineup Header */}
                <div className="flex flex-col items-center justify-center text-center py-2">
                  <div className="grid grid-cols-3 items-center justify-center gap-2 max-w-md w-full">
                    {/* User side */}
                    <div className="space-y-1">
                      <p className="text-xs font-black text-gray-900 dark:text-white truncate">Anda</p>
                      {absoluteLatestH2H.partner && (
                        <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-semibold truncate">& {absoluteLatestH2H.partner}</p>
                      )}
                    </div>
                    
                    {/* VS divider */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-sm">VS</span>
                    </div>

                    {/* Opponents side */}
                    <div className="space-y-1">
                      <p className="text-xs font-black text-gray-900 dark:text-white truncate">{absoluteLatestH2H.opponent1}</p>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-semibold truncate">& {absoluteLatestH2H.opponent2}</p>
                    </div>
                  </div>

                  {/* Huge scoreboard numbers */}
                  <div className="mt-4 flex items-center justify-center gap-5 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xs py-2 px-6 rounded-2xl border border-white/50 dark:border-zinc-800/40 shadow-3xs">
                    <span className={`text-2xl font-black ${absoluteLatestH2H.result === 'win' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-zinc-300'}`}>{absoluteLatestH2H.teamScore}</span>
                    <span className="text-gray-300 dark:text-zinc-700 text-lg font-bold">-</span>
                    <span className={`text-2xl font-black ${absoluteLatestH2H.result === 'loss' ? 'text-rose-500' : 'text-gray-700 dark:text-zinc-300'}`}>{absoluteLatestH2H.opponentScore}</span>
                  </div>
                </div>

                {/* Friendly Commentary banner */}
                <p className="text-xs text-gray-700 dark:text-zinc-300 font-medium text-center border-t border-indigo-150/40 dark:border-zinc-800/60 pt-3">
                  {getRivalryReminder(absoluteLatestH2H.result, absoluteLatestH2H.teamScore, absoluteLatestH2H.opponentScore, `${absoluteLatestH2H.opponent1} & ${absoluteLatestH2H.opponent2}`)}
                </p>
              </div>
            </div>
          )}

          {/* Toggle Button for History */}
          {groupedByOpponents.length > 0 && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30 text-xs font-extrabold shadow-2xs hover:shadow-xs transition-all"
              >
                {showHistory ? (
                  <>
                    <span>Sembunyikan Histori Rivalitas</span>
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Tampilkan Histori Rivalitas ({groupedByOpponents.length})</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Collapsible Rivalry Timeline List */}
          {showHistory && (
            <div className="space-y-4 border-t border-gray-100 dark:border-zinc-800/80 pt-6 mt-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800/80 pb-2">
                <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Histori Laga Rivalitas</h3>
                <span className="text-[10px] text-gray-400 font-bold">{groupedByOpponents.length} Rival Terdaftar</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {groupedByOpponents.map((group) => {
                  const isExpanded = expandedOpponent === group.opponentKey;
                  const latestDate = group.latestMatch.match.match_date ?? group.latestMatch.match.created_at;
                  
                  return (
                    <div
                      key={group.opponentKey}
                      className="border border-gray-200 dark:border-zinc-800/85 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/50 transition-all duration-300 hover:border-purple-500/30 shadow-3xs"
                    >
                      {/* Accordeon Header summary */}
                      <button
                        onClick={() => setExpandedOpponent(isExpanded ? null : group.opponentKey)}
                        className="w-full px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left hover:bg-gray-50/50 dark:hover:bg-zinc-800/20 transition-all duration-200"
                      >
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-900/30 uppercase tracking-wider">VS</span>
                            <span className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                              {group.opponentKey}
                            </span>
                          </div>
                          
                          {/* Summary of last match reminder */}
                          <p className="text-xs text-gray-600 dark:text-zinc-400 font-medium">
                            Pertemuan terakhir: <span className="font-bold text-gray-800 dark:text-zinc-200">{getRelativeTime(latestDate)}</span> • Hasil: <span className={`font-bold ${
                              group.latestMatch.result === 'win' ? 'text-emerald-600 dark:text-emerald-400' : group.latestMatch.result === 'loss' ? 'text-rose-500' : 'text-blue-500'
                            }`}>
                              {group.latestMatch.result === 'win' ? 'Menang' : group.latestMatch.result === 'loss' ? 'Kalah' : 'Seri'} ({group.latestMatch.teamScore}-{group.latestMatch.opponentScore})
                            </span>
                          </p>
                        </div>

                        {/* Right-side stats badges */}
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-right">
                            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200/50 dark:border-zinc-700/50">
                              {group.total}x Laga
                            </span>
                            <p className="text-[9px] font-semibold text-gray-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">{group.wins}W - {group.losses}L</p>
                          </div>

                          <div className="p-1 rounded-lg bg-gray-50 dark:bg-zinc-850 text-gray-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </button>

                      {/* Accordeon detail list of matches */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-3 border-t border-gray-100 dark:border-zinc-850 bg-gray-50/20 dark:bg-zinc-900/10 space-y-3">
                          <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Riwayat Pertemuan ({group.total})</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {group.matches.map((h2h) => {
                              const date = h2h.match.match_date ?? h2h.match.created_at;
                              return (
                                <div
                                  key={h2h.match.id}
                                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3.5 bg-white dark:bg-zinc-900 transition-all duration-300 ${
                                    h2h.result === 'win'
                                      ? 'border-emerald-200/60 dark:border-emerald-500/25 hover:border-emerald-500/40 hover:shadow-xs'
                                      : h2h.result === 'loss'
                                        ? 'border-red-250 dark:border-red-500/25 hover:border-red-500/40 hover:shadow-xs'
                                        : 'border-blue-200/60 dark:border-blue-500/25 hover:border-blue-500/40 hover:shadow-xs'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 tracking-wider">MATCH #{h2h.match.match_number}</span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider ${
                                        h2h.result === 'win'
                                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                          : h2h.result === 'loss'
                                            ? 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400'
                                            : 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400'
                                      }`}
                                    >
                                      {h2h.result === 'win' ? 'MENANG' : h2h.result === 'loss' ? 'KALAH' : 'SERI'}
                                    </span>
                                  </div>

                                  {/* Match Lineup and Scores */}
                                  <div className="p-3 bg-gray-50 dark:bg-zinc-950/40 rounded-xl border border-gray-100 dark:border-zinc-800/40">
                                    <div className="flex items-center justify-between text-xs mb-2 pb-2 border-b border-gray-100/50 dark:border-zinc-800/30">
                                      <span className="text-gray-500 dark:text-zinc-400 font-semibold truncate max-w-[120px]">
                                        Anda {h2h.partner ? `& ${h2h.partner}` : ''}
                                      </span>
                                      <span className="font-extrabold text-gray-900 dark:text-white">{h2h.teamScore}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-500 dark:text-zinc-400 font-semibold truncate max-w-[120px]">
                                        {h2h.opponent1} & {h2h.opponent2}
                                      </span>
                                      <span className="font-extrabold text-gray-900 dark:text-white">{h2h.opponentScore}</span>
                                    </div>
                                  </div>

                                  {/* Date */}
                                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-zinc-400 font-semibold">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    <span>
                                      {new Date(date).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })} ({getRelativeTime(date)})
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
