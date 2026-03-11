'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import { Users, Sparkles, TrendingUp, Target, Zap, Flame, Droplet, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';
import TutorialOverlay from '@/components/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';
import { getTutorialSteps } from '@/lib/tutorialSteps';

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

export default function TeamOptimizerPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [mode, setMode] = useState<'balanced' | 'competitive' | 'training' | 'exciting'>('balanced');
  const [numTeams, setNumTeams] = useState<number>(4);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  // Tutorial for team optimizer page
  const tutorialSteps = getTutorialSteps('team-optimizer');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('admin-team-optimizer', tutorialSteps);

  useEffect(() => {
    fetchPlayerStats();
  }, [pathname]);

  // Re-auto-select when mode changes (only after stats are loaded)
  useEffect(() => {
    if (playerStats.length > 0) {
      setSelectedPlayers(autoSelectByMode(mode, playerStats));
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchPlayerStats() {
    setLoading(true);
    try {
      // Get all profiles excluding test accounts
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, is_test_account')
        .order('full_name');

      if (!profiles) return;

      // Filter out test accounts client-side (safe even if column doesn't exist yet)
      const realProfiles = profiles.filter((p: any) => !p.is_test_account);

      // Get all matches (override Supabase default 1000-row limit)
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: false })
        .limit(10000);

      if (!matches) return;

      // Calculate stats for each player
      const stats: PlayerStat[] = [];

      for (const profile of realProfiles) {
        const playerMatches = matches.filter(m => 
          m.team1_player1 === profile.full_name ||
          m.team1_player2 === profile.full_name ||
          m.team2_player1 === profile.full_name ||
          m.team2_player2 === profile.full_name
        );

        // Include all players, even those with no matches yet
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
            totalScore += score;

            // Track partnerships
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

        // Get best partners
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
            : 0, // No data — don't pretend 50%
          bestPartners
        });
      }

      // Sort by skill level
      stats.sort((a, b) => b.skillLevel - a.skillLevel);
      setPlayerStats(stats);

      // Auto-select based on current mode
      setSelectedPlayers(autoSelectByMode(mode, stats));
    } catch (error) {
      console.error('Error fetching player stats:', error);
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
        throw new Error(data.details || data.error || 'Failed to generate teams');
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

  /**
   * Auto-select up to 8 players whose history fits the chosen mode:
   * - competitive  → top 8 by skillLevel (highest win-rate winners)
   * - balanced     → mix high / mid / low skill tiers
   * - training     → blend experienced (most matches) + newest players
   * - exciting     → players whose winRate is closest to 50% for tight games
   */
  function autoSelectByMode(currentMode: string, stats: PlayerStat[]): string[] {
    const withMatches = stats.filter(p => p.totalMatches > 0);
    const noMatches   = stats.filter(p => p.totalMatches === 0);
    let selected: PlayerStat[] = [];

    if (currentMode === 'competitive') {
      // Best of the best — highest skillLevel (win-rate + avg-score combo)
      selected = [...withMatches]
        .sort((a, b) => b.skillLevel - a.skillLevel)
        .slice(0, 8);

    } else if (currentMode === 'balanced') {
      // Three tiers: top ≥65, mid 35-64, low <35 — take 3 / 3 / 2
      const high = withMatches.filter(p => p.skillLevel >= 65).sort((a, b) => b.skillLevel - a.skillLevel);
      const mid  = withMatches.filter(p => p.skillLevel >= 35 && p.skillLevel < 65).sort((a, b) => b.skillLevel - a.skillLevel);
      const low  = withMatches.filter(p => p.skillLevel < 35).sort((a, b) => b.skillLevel - a.skillLevel);
      selected = [...high.slice(0, 3), ...mid.slice(0, 3), ...low.slice(0, 2)];
      // Pad to 8 if tiers were thin
      if (selected.length < 8) {
        const taken = new Set(selected.map(p => p.id));
        const rest  = stats.filter(p => !taken.has(p.id));
        selected = [...selected, ...rest.slice(0, 8 - selected.length)];
      }

    } else if (currentMode === 'training') {
      // Top 4 most-experienced + 4 newest (0-match or fewest matches)
      const experienced = [...withMatches].sort((a, b) => b.totalMatches - a.totalMatches).slice(0, 4);
      const expIds      = new Set(experienced.map(p => p.id));
      const newcomers   = [
        ...noMatches,
        ...withMatches.filter(p => !expIds.has(p.id)).sort((a, b) => a.totalMatches - b.totalMatches)
      ].slice(0, 4);
      selected = [...experienced, ...newcomers];
      if (selected.length < 8) {
        const taken = new Set(selected.map(p => p.id));
        const rest  = stats.filter(p => !taken.has(p.id));
        selected = [...selected, ...rest.slice(0, 8 - selected.length)];
      }

    } else if (currentMode === 'exciting') {
      // Closest win-rate to 50% → most unpredictable / tight matches
      const sorted = [...withMatches].sort((a, b) =>
        Math.abs(a.winRate - 50) - Math.abs(b.winRate - 50)
      );
      selected = sorted.slice(0, 8);
      if (selected.length < 8) {
        const taken = new Set(selected.map(p => p.id));
        const rest  = stats.filter(p => !taken.has(p.id));
        selected = [...selected, ...rest.slice(0, 8 - selected.length)];
      }
    }

    // Fallback: if we still don't have 4 just take the first ones
    if (selected.length < 4 && stats.length >= 4) {
      selected = stats.slice(0, 8);
    }

    return selected.slice(0, 8).map(p => p.name);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4 transition-colors duration-300" />
          <p className="text-gray-600 dark:text-zinc-400 font-semibold transition-colors duration-300">Memuat data pemain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6 transition-colors duration-300">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-linear-to-br from-purple-500 to-blue-600 rounded-xl shadow-sm">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Racik Tim Pintar</h1>
              <p className="text-gray-600 dark:text-zinc-400 font-medium transition-colors duration-300">Buat tim badminton yang seimbang dengan bantuan AI</p>
            </div>
          </div>

          <button
            onClick={toggleTutorial}
            className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-colors"
            title="Tampilkan panduan fitur"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 space-y-6 border-2 border-gray-300 dark:border-transparent shadow-sm transition-colors duration-300">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
            Langkah 1: Pilih Mode Permainan
          </h2>

          {/* Mode Selection */}
          <div>
            <div className="team-optimizer-mode-select grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'balanced',    label: 'Seimbang',    desc: 'Tim dengan skill merata',     hint: 'Pilih mix skill tinggi & rendah',       icon: '⚖️' },
                { value: 'competitive', label: 'Kompetitif',  desc: 'Maksimalkan kekuatan tim',    hint: 'Pilih pemain dengan kemenangan terbaik', icon: '🏆' },
                { value: 'training',    label: 'Latihan',     desc: 'Campur pemain baru & lama',   hint: 'Pilih pemain berpengalaman & pemula',   icon: '📚' },
                { value: 'exciting',    label: 'Seru',        desc: 'Pertandingan lebih ketat',    hint: 'Pilih pemain dengan kekuatan serupa',   icon: '🔥' }
              ].map(m => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value as any)}
                  className={`p-4 rounded-lg border-2 transition-all shadow-sm text-left ${
                    mode === m.value
                      ? 'border-purple-500 bg-purple-100 dark:bg-purple-500/10'
                      : 'border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:border-gray-400 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="text-2xl mb-2">{m.icon}</div>
                  <div className="text-gray-900 dark:text-white font-bold transition-colors duration-300">{m.label}</div>
                  <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1 font-medium transition-colors duration-300">{m.desc}</div>
                  <div className="text-xs text-purple-500 dark:text-purple-400 mt-2 font-medium transition-colors duration-300">✦ {m.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Player Selection */}
          <div className="team-optimizer-player-select">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
                Langkah 2: Pilih Pemain (Minimal 4 orang)
              </h2>
              <button
                onClick={() => setSelectedPlayers(autoSelectByMode(mode, playerStats))}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border-2 border-purple-400 dark:border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all"
                title="Pilih ulang otomatis sesuai mode"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Pilih Otomatis
              </button>
            </div>
            <div className="bg-blue-50 dark:bg-zinc-800/50 rounded-lg p-3 mb-4 border-2 border-blue-200 dark:border-transparent transition-colors duration-300">
              <p className="text-sm text-gray-700 dark:text-zinc-300 font-medium transition-colors duration-300">
                <strong className="text-gray-900 dark:text-white transition-colors duration-300">{selectedPlayers.length} pemain dipilih</strong>
                {selectedPlayers.length >= 4 && selectedPlayers.length % 4 === 0 && (
                  <span className="ml-2 text-green-600 dark:text-green-400 font-bold transition-colors duration-300">✓ Bisa membuat {selectedPlayers.length / 4} pertandingan</span>
                )}
                {selectedPlayers.length > 0 && selectedPlayers.length % 4 !== 0 && (
                  <span className="ml-2 text-amber-600 dark:text-yellow-400 font-bold transition-colors duration-300">⚠ Pilih kelipatan 4 untuk hasil optimal</span>
                )}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
              {playerStats.map(player => (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.name)}
                  className={`p-4 rounded-lg border-2 text-left transition-all shadow-sm ${
                    selectedPlayers.includes(player.name)
                      ? 'border-green-500 bg-green-100 dark:bg-green-500/10'
                      : 'border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:border-gray-400 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-gray-900 dark:text-white font-bold text-lg transition-colors duration-300">{player.name}</div>
                    {selectedPlayers.includes(player.name) && (
                      <div className="bg-green-500 rounded-full p-1">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-zinc-400 font-semibold transition-colors duration-300">Tingkat Kemenangan:</span>
                      <span className={`font-bold ${
                        player.totalMatches === 0 ? 'text-gray-400 dark:text-zinc-500' :
                        player.winRate >= 70 ? 'text-green-600 dark:text-green-400' :
                        player.winRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                        player.winRate > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-zinc-400'
                      } transition-colors duration-300`}>
                        {player.totalMatches === 0 ? '-' : `${player.winRate}%`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-zinc-400 font-semibold transition-colors duration-300">Total Main:</span>
                      <span className="text-gray-900 dark:text-white font-bold transition-colors duration-300">{player.totalMatches} pertandingan</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-zinc-400 font-semibold transition-colors duration-300">Level Kemampuan:</span>
                      {player.totalMatches === 0 ? (
                        <span className="text-xs text-gray-400 dark:text-zinc-500 italic">Belum ada data</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-300 dark:bg-zinc-700 rounded-full h-2 border border-gray-400 dark:border-transparent transition-colors duration-300">
                            <div 
                              className={`h-2 rounded-full ${
                                player.skillLevel >= 70 ? 'bg-green-500' :
                                player.skillLevel >= 50 ? 'bg-yellow-500' :
                                'bg-orange-500'
                              }`}
                              style={{ width: `${player.skillLevel}%` }}
                            />
                          </div>
                          <span className="text-gray-900 dark:text-white font-bold w-8 transition-colors duration-300">{player.skillLevel}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4 transition-colors duration-300">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
              Langkah 3: Generate Tim
            </h2>
            <button
              onClick={generateTeams}
              disabled={analyzing || selectedPlayers.length < 4}
              className="team-optimizer-analyze-button w-full py-4 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-zinc-700 dark:disabled:to-zinc-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed text-lg border-2 border-transparent hover:border-purple-400 shadow-sm"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Sedang Menganalisis Data Pemain...
                </>
              ) : selectedPlayers.length < 4 ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Pilih Minimal 4 Pemain
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Tim Optimal ({selectedPlayers.length} Pemain)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="team-optimizer-results space-y-6">
            {/* Summary */}
            <div className="bg-linear-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 border-2 border-purple-300 dark:border-purple-500/30 rounded-xl p-6 shadow-sm transition-colors duration-300">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 transition-colors duration-300">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
                Ringkasan Analisis
              </h3>
              <p className="text-gray-700 dark:text-zinc-300 leading-relaxed font-medium transition-colors duration-300">{result.summary}</p>
            </div>

            {/* Teams */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">Komposisi Tim</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {result.teams.map(team => (
                  <div key={team.teamId} className="bg-white dark:bg-zinc-900 rounded-xl p-6 space-y-4 border-2 border-gray-300 dark:border-transparent shadow-sm transition-colors duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-zinc-500 mb-1 font-semibold transition-colors duration-300">Tim {team.teamId}</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{team.player1}</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{team.player2}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 transition-colors duration-300">{team.skillLevel}</div>
                        <div className="text-xs text-gray-500 dark:text-zinc-500 font-semibold transition-colors duration-300">Skill Level</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t-2 border-gray-200 dark:border-zinc-800 transition-colors duration-300">
                      <div className="flex items-center gap-2">
                        {getChemistryIcon(team.chemistry)}
                        <span className="text-sm text-gray-600 dark:text-zinc-400 font-medium transition-colors duration-300">
                          Chemistry: <span className="font-bold text-gray-900 dark:text-white transition-colors duration-300">{getChemistryLabel(team.chemistry)}</span>
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-zinc-400 font-medium transition-colors duration-300">
                        WR: <span className="font-bold text-gray-900 dark:text-white transition-colors duration-300">{team.winRate}%</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-zinc-400 leading-relaxed font-medium transition-colors duration-300">{team.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Matchups */}
            {result.matchups && result.matchups.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">Prediksi Pertandingan</h3>
                <div className="space-y-4">
                  {result.matchups.map((matchup, idx) => {
                    const team1 = result.teams.find(t => t.teamId === matchup.team1Id);
                    const team2 = result.teams.find(t => t.teamId === matchup.team2Id);
                    if (!team1 || !team2) return null;

                    return (
                      <div key={idx} className="bg-white dark:bg-zinc-900 rounded-xl p-6 border-2 border-gray-300 dark:border-transparent shadow-sm transition-colors duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <div className="text-sm text-gray-500 dark:text-zinc-500 mb-1 font-semibold transition-colors duration-300">Tim {team1.teamId}</div>
                            <div className="font-bold text-gray-900 dark:text-white transition-colors duration-300">{team1.player1} & {team1.player2}</div>
                          </div>
                          <div className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-lg text-gray-600 dark:text-zinc-400 font-mono font-bold border-2 border-gray-300 dark:border-transparent transition-colors duration-300">VS</div>
                          <div className="flex-1 text-right">
                            <div className="text-sm text-gray-500 dark:text-zinc-500 mb-1 font-semibold transition-colors duration-300">Tim {team2.teamId}</div>
                            <div className="font-bold text-gray-900 dark:text-white transition-colors duration-300">{team2.player1} & {team2.player2}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-3 bg-green-100 dark:bg-green-500/10 border-2 border-green-300 dark:border-green-500/30 rounded-lg transition-colors duration-300">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400 transition-colors duration-300">{matchup.winProbability.team1}%</div>
                            <div className="text-xs text-gray-600 dark:text-zinc-400 font-semibold transition-colors duration-300">Win Probability</div>
                          </div>
                          <div className="text-center p-3 bg-blue-100 dark:bg-blue-500/10 border-2 border-blue-300 dark:border-blue-500/30 rounded-lg transition-colors duration-300">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-colors duration-300">{matchup.winProbability.team2}%</div>
                            <div className="text-xs text-gray-600 dark:text-zinc-400 font-semibold transition-colors duration-300">Win Probability</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm mb-3">
                          <div className="text-gray-600 dark:text-zinc-400 font-medium transition-colors duration-300">
                            Expected Score: <span className="text-gray-900 dark:text-white font-bold transition-colors duration-300">{matchup.expectedScore}</span>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                            matchup.excitement === 'high' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-300 dark:border-transparent' :
                            matchup.excitement === 'medium' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-transparent' :
                            'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-transparent'
                          } transition-colors duration-300`}>
                            {matchup.excitement === 'high' ? 'Sangat Seru' : 
                             matchup.excitement === 'medium' ? 'Seru' : 'Standar'}
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 dark:text-zinc-400 leading-relaxed font-medium transition-colors duration-300">{matchup.reasoning}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border-2 border-gray-300 dark:border-transparent shadow-sm transition-colors duration-300">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 transition-colors duration-300">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
                  Rekomendasi
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-700 dark:text-zinc-300 font-medium transition-colors duration-300">
                      <span className="text-purple-600 dark:text-purple-400 font-bold transition-colors duration-300">{idx + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tutorial Overlay */}
      <TutorialOverlay
        steps={tutorialSteps}
        isActive={isTutorialActive}
        onClose={closeTutorial}
        tutorialKey="admin-team-optimizer"
      />
    </div>
  );
}
