'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import { 
  Users, Sparkles, TrendingUp, Target, Zap, Flame, Droplet, AlertCircle, 
  RefreshCw, HelpCircle, Check, ArrowRight, Trophy
} from 'lucide-react';
import BranchBadge from '@/components/BranchBadge';

const BRANCH_ID = 'dlob-cikupa';
const ACCENT = '#10B981';

interface PlayerStat {
  id: string;
  name: string;
  winRate: number;
  totalMatches: number;
  avgScore: number;
  skillLevel: number;
  bestPartners?: { partner: string; winRate: number; matches: number }[];
}

interface Team {
  teamId: number;
  player1: string;
  player2: string;
  skillLevel: number;
  chemistry: 'high' | 'medium' | 'low' | 'new';
  chemistryScore: number;
  winRate: number;
  reasoning: string;
}

interface Matchup {
  team1Id: number;
  team2Id: number;
  winProbability: { team1: number; team2: number };
  expectedScore: string;
  excitement: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface OptimizationResult {
  teams: Team[];
  matchups: Matchup[];
  summary: string;
  recommendations: string[];
}

export default function CikupaTeamOptimizerPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [mode, setMode] = useState<'balanced' | 'competitive' | 'training' | 'exciting'>('balanced');
  const [numTeams, setNumTeams] = useState<number>(4);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  useEffect(() => {
    fetchPlayerStats();
  }, [pathname]);

  // Re-auto-select when mode changes
  useEffect(() => {
    if (playerStats.length > 0) {
      setSelectedPlayers(autoSelectByMode(mode, playerStats));
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchPlayerStats() {
    setLoading(true);
    try {
      // Get all DLBC profiles excluding test accounts
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, is_test_account, branch_id')
        .eq('branch_id', BRANCH_ID)
        .order('full_name');

      if (!profiles) return;

      const realProfiles = profiles.filter((p: any) => !p.is_test_account && p.full_name);

      // Get all DLBC matches
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('branch_id', BRANCH_ID)
        .order('match_date', { ascending: false })
        .limit(1000);

      const allMatches = matches || [];

      // Calculate stats for each player in DLBC
      const stats: PlayerStat[] = [];

      for (const profile of realProfiles) {
        const playerMatches = allMatches.filter(m => 
          m.team1_player1 === profile.full_name ||
          m.team1_player2 === profile.full_name ||
          m.team2_player1 === profile.full_name ||
          m.team2_player2 === profile.full_name
        );

        let wins = 0;
        let totalScore = 0;
        const partnershipMap = new Map<string, { wins: number; total: number }>();

        if (playerMatches.length > 0) {
          playerMatches.forEach(match => {
            const isTeam1 = match.team1_player1 === profile.full_name || match.team1_player2 === profile.full_name;
            const isWinner = (isTeam1 && match.winner === 'team1') || (!isTeam1 && match.winner === 'team2');
            const partner = isTeam1 
              ? (match.team1_player1 === profile.full_name ? match.team1_player2 : match.team1_player1)
              : (match.team2_player1 === profile.full_name ? match.team2_player2 : match.team2_player1);
            const score = isTeam1 ? match.team1_score : match.team2_score;

            if (isWinner) wins++;
            totalScore += (score || 0);

            if (partner) {
              if (!partnershipMap.has(partner)) {
                partnershipMap.set(partner, { wins: 0, total: 0 });
              }
              const partnerStat = partnershipMap.get(partner)!;
              partnerStat.total++;
              if (isWinner) partnerStat.wins++;
            }
          });
        }

        const winRate = playerMatches.length > 0 ? (wins / playerMatches.length) * 100 : 0;
        const avgScore = playerMatches.length > 0 ? totalScore / playerMatches.length : 0;

        const bestPartners = Array.from(partnershipMap.entries())
          .map(([partner, stat]) => ({
            partner,
            winRate: (stat.wins / stat.total) * 100,
            matches: stat.total
          }))
          .sort((a, b) => b.winRate - a.winRate)
          .slice(0, 3);

        stats.push({
          id: profile.id,
          name: profile.full_name,
          winRate: Math.round(winRate),
          totalMatches: playerMatches.length,
          avgScore: Math.round(avgScore),
          skillLevel: playerMatches.length > 0 
            ? Math.min(Math.round(winRate + (avgScore / 21) * 10), 100)
            : 0,
          bestPartners
        });
      }

      stats.sort((a, b) => b.skillLevel - a.skillLevel);
      setPlayerStats(stats);
      setSelectedPlayers(autoSelectByMode(mode, stats));
    } catch (error) {
      console.error('Error fetching DLBC player stats:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateTeams() {
    if (selectedPlayers.length < 4) {
      alert('Pilih minimal 4 pemain');
      return;
    }

    setAnalyzing(true);
    try {
      const selectedStats = playerStats.filter(p => selectedPlayers.includes(p.name));

      const response = await fetch('/api/ai/team-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerStats: selectedStats,
          mode,
          numTeams,
          userId: user?.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Gagal meracik tim');
      }

      setResult(data);
    } catch (error: any) {
      console.error('Failed to generate teams:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  }

  function togglePlayer(playerName: string) {
    setSelectedPlayers(prev => 
      prev.includes(playerName)
        ? prev.filter(p => p !== playerName)
        : [...prev, playerName]
    );
  }

  function getChemistryIcon(chemistry: string) {
    switch (chemistry) {
      case 'high': return <Flame className="w-4 h-4 text-red-400" />;
      case 'medium': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'low': return <Droplet className="w-4 h-4 text-blue-400" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  }

  function getChemistryLabel(chemistry: string) {
    switch (chemistry) {
      case 'high': return 'Tinggi';
      case 'medium': return 'Sedang';
      case 'low': return 'Rendah';
      default: return 'Baru';
    }
  }

  function autoSelectByMode(currentMode: string, stats: PlayerStat[]): string[] {
    const withMatches = stats.filter(p => p.totalMatches > 0);
    const noMatches = stats.filter(p => p.totalMatches === 0);
    let selected: PlayerStat[] = [];

    if (currentMode === 'competitive') {
      selected = [...withMatches]
        .sort((a, b) => b.skillLevel - a.skillLevel)
        .slice(0, 8);
    } else if (currentMode === 'training') {
      const seniors = [...withMatches]
        .sort((a, b) => b.totalMatches - a.totalMatches)
        .slice(0, 4);
      const juniors = (noMatches.length >= 4 ? noMatches : [...noMatches, ...withMatches.slice().reverse()]).slice(0, 4);
      selected = [...seniors, ...juniors];
    } else if (currentMode === 'exciting') {
      selected = [...withMatches]
        .sort((a, b) => Math.abs(a.winRate - 50) - Math.abs(b.winRate - 50))
        .slice(0, 8);
    } else {
      // Balanced
      if (withMatches.length >= 8) {
        const top = withMatches.slice(0, 2);
        const mid = withMatches.slice(Math.floor(withMatches.length / 2) - 2, Math.floor(withMatches.length / 2) + 2);
        const btm = withMatches.slice(-2);
        selected = [...top, ...mid, ...btm];
      } else {
        selected = withMatches.slice(0, 8);
      }
    }

    if (selected.length < 4) {
      selected = stats.slice(0, 8);
    }

    return selected.map(p => p.name);
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
              Racik Tim Pintar DLBC
            </h1>
            <BranchBadge branchId={BRANCH_ID} />
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Optimasi pasangan ganda & matchmaking badminton berbasis AI untuk cabang Cikupa
          </p>
        </div>

        <button
          onClick={fetchPlayerStats}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl border border-gray-200 dark:border-white/10 transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data DLBC
        </button>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { id: 'balanced', title: 'Seimbang (Rata)', desc: 'Kekuatan kedua tim setara & adil', icon: Target },
          { id: 'competitive', title: 'Kompetitif (Pro)', desc: 'Pemain terkuat saling berhadapan', icon: Trophy },
          { id: 'training', title: 'Coaching / Latihan', desc: 'Duet senior membimbing junior', icon: Users },
          { id: 'exciting', title: 'Seru & Ketat', desc: 'Prediksi skor rapat & menegangkan', icon: Zap },
        ].map(m => {
          const Icon = m.icon;
          const isSelected = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id as any)}
              className={`p-4 rounded-2xl text-left border transition-all ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white shadow-md shadow-emerald-500/10'
                  : 'bg-white dark:bg-zinc-900/60 border-gray-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />}
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">{m.title}</p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-500">{m.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Player Selection Card */}
      <div className="bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 dark:border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              Pilih Pemain Hadir DLBC ({selectedPlayers.length} terpilih)
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Klik pemain yang siap bertanding di lapangan Cikupa hari ini
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPlayers(playerStats.map(p => p.name))}
              className="px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Pilih Semua
            </button>
            <button
              onClick={() => setSelectedPlayers([])}
              className="px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-500">Memuat profil pemain DLBC...</div>
        ) : playerStats.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">Belum ada pemain terdaftar di cabang DLBC Cikupa</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {playerStats.map(player => {
              const isSelected = selectedPlayers.includes(player.name);
              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.name)}
                  className={`p-2.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                      : 'bg-zinc-800/40 border-white/5 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <div className="truncate mr-2">
                    <p className="text-xs font-bold truncate text-white">{player.name}</p>
                    <p className="text-[10px] text-zinc-500">
                      {player.totalMatches > 0 ? `${player.winRate}% win (${player.totalMatches}m)` : 'Pemain Baru'}
                    </p>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Generate Button */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Target Tim:</span>
            <select
              value={numTeams}
              onChange={e => setNumTeams(parseInt(e.target.value) || 4)}
              className="px-2.5 py-1 bg-zinc-800 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value={2}>2 Tim (1 Pertandingan)</option>
              <option value={4}>4 Tim (2 Pertandingan)</option>
              <option value={6}>6 Tim (3 Pertandingan)</option>
              <option value={8}>8 Tim (4 Pertandingan)</option>
            </select>
          </div>

          <button
            onClick={generateTeams}
            disabled={analyzing || selectedPlayers.length < 4}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'AI Meracik Pasangan...' : 'Racik Tim Sekarang'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-5 animate-in fade-in">
          {/* Summary Banner */}
          <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
            <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4" />
              Hasil Analisis Racikan Tim DLBC
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">{result.summary}</p>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.teams?.map((team, idx) => (
              <div key={team.teamId || idx} className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-black text-emerald-400">
                    Tim {team.teamId || idx + 1}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs">
                    {getChemistryIcon(team.chemistry)}
                    <span className="text-zinc-400 text-[11px]">
                      Chemistry: <strong className="text-white">{getChemistryLabel(team.chemistry)}</strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-zinc-800/60 rounded-xl border border-white/5 text-center">
                    <p className="text-xs font-bold text-white">{team.player1}</p>
                  </div>
                  <div className="p-3 bg-zinc-800/60 rounded-xl border border-white/5 text-center">
                    <p className="text-xs font-bold text-white">{team.player2}</p>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 italic">
                  &ldquo;{team.reasoning}&rdquo;
                </p>
              </div>
            ))}
          </div>

          {/* Matchups Grid */}
          {result.matchups && result.matchups.length > 0 && (
            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Jadwal Pertandingan Rekomendasi
              </h3>

              <div className="space-y-2">
                {result.matchups.map((m, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-white/5 gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-emerald-400">Match {idx + 1}</span>
                      <span className="text-xs font-bold text-white">
                        Tim {m.team1Id} vs Tim {m.team2Id}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-zinc-400">
                        Peluang: <strong className="text-white">{m.winProbability?.team1 ?? 50}% - {m.winProbability?.team2 ?? 50}%</strong>
                      </span>
                      <span className="text-zinc-400">
                        Prediksi Skor: <strong className="text-emerald-400">{m.expectedScore}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
