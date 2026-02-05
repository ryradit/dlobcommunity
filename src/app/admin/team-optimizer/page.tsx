'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Users, Sparkles, TrendingUp, Target, Zap, Flame, Droplet, AlertCircle, RefreshCw } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [mode, setMode] = useState<'balanced' | 'competitive' | 'training' | 'exciting'>('balanced');
  const [numTeams, setNumTeams] = useState<number>(4);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  useEffect(() => {
    fetchPlayerStats();
  }, []);

  async function fetchPlayerStats() {
    setLoading(true);
    try {
      // Get all profiles with membership
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');

      if (!profiles) return;

      // Get all matches
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (!matches) return;

      // Calculate stats for each player
      const stats: PlayerStat[] = [];

      for (const profile of profiles) {
        const playerMatches = matches.filter(m => 
          m.team1_player1 === profile.full_name ||
          m.team1_player2 === profile.full_name ||
          m.team2_player1 === profile.full_name ||
          m.team2_player2 === profile.full_name
        );

        if (playerMatches.length === 0) continue;

        let wins = 0;
        let totalScore = 0;
        const partnershipMap = new Map<string, { wins: number; total: number }>();

        playerMatches.forEach(match => {
          const isTeam1 = match.team1_player1 === profile.full_name || match.team1_player2 === profile.full_name;
          const isWinner = (isTeam1 && match.winner === 1) || (!isTeam1 && match.winner === 2);
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

        const winRate = (wins / playerMatches.length) * 100;
        const avgScore = totalScore / playerMatches.length;

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
          skillLevel: Math.min(Math.round(winRate + (avgScore / 21) * 10), 100),
          bestPartners
        });
      }

      // Sort by skill level
      stats.sort((a, b) => b.skillLevel - a.skillLevel);
      setPlayerStats(stats);
      
      // Auto-select top players
      setSelectedPlayers(stats.slice(0, Math.min(8, stats.length)).map(s => s.name));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Memuat data pemain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Team Optimizer</h1>
            <p className="text-zinc-400">Komposisi tim optimal dengan AI forecasting</p>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-zinc-900 rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Konfigurasi
          </h2>

          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">Mode Optimasi</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'balanced', label: 'Seimbang', desc: 'Skill merata' },
                { value: 'competitive', label: 'Kompetitif', desc: 'Maksimal kekuatan' },
                { value: 'training', label: 'Latihan', desc: 'Campur level' },
                { value: 'exciting', label: 'Seru', desc: 'Pertandingan ketat' }
              ].map(m => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value as any)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    mode === m.value
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div className="text-white font-medium">{m.label}</div>
                  <div className="text-sm text-zinc-400">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Player Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Pilih Pemain ({selectedPlayers.length} dipilih)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {playerStats.map(player => (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.name)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedPlayers.includes(player.name)
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div className="text-white font-medium truncate">{player.name}</div>
                  <div className="text-sm text-zinc-400">WR: {player.winRate}% • {player.totalMatches}M</div>
                  <div className="text-xs text-zinc-500">Skill: {player.skillLevel}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateTeams}
            disabled={analyzing || selectedPlayers.length < 4}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-zinc-700 disabled:to-zinc-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Menganalisis...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Tim Optimal
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Ringkasan Analisis
              </h3>
              <p className="text-zinc-300 leading-relaxed">{result.summary}</p>
            </div>

            {/* Teams */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Komposisi Tim</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {result.teams.map(team => (
                  <div key={team.teamId} className="bg-zinc-900 rounded-xl p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm text-zinc-500 mb-1">Tim {team.teamId}</div>
                        <div className="text-xl font-bold text-white">{team.player1}</div>
                        <div className="text-xl font-bold text-white">{team.player2}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-400">{team.skillLevel}</div>
                        <div className="text-xs text-zinc-500">Skill Level</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t border-zinc-800">
                      <div className="flex items-center gap-2">
                        {getChemistryIcon(team.chemistry)}
                        <span className="text-sm text-zinc-400">
                          Chemistry: <span className="font-medium text-white">{getChemistryLabel(team.chemistry)}</span>
                        </span>
                      </div>
                      <div className="text-sm text-zinc-400">
                        WR: <span className="font-medium text-white">{team.winRate}%</span>
                      </div>
                    </div>

                    <p className="text-sm text-zinc-400 leading-relaxed">{team.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Matchups */}
            {result.matchups && result.matchups.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Prediksi Pertandingan</h3>
                <div className="space-y-4">
                  {result.matchups.map((matchup, idx) => {
                    const team1 = result.teams.find(t => t.teamId === matchup.team1Id);
                    const team2 = result.teams.find(t => t.teamId === matchup.team2Id);
                    if (!team1 || !team2) return null;

                    return (
                      <div key={idx} className="bg-zinc-900 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <div className="text-sm text-zinc-500 mb-1">Tim {team1.teamId}</div>
                            <div className="font-semibold text-white">{team1.player1} & {team1.player2}</div>
                          </div>
                          <div className="px-4 py-2 bg-zinc-800 rounded-lg text-zinc-400 font-mono">VS</div>
                          <div className="flex-1 text-right">
                            <div className="text-sm text-zinc-500 mb-1">Tim {team2.teamId}</div>
                            <div className="font-semibold text-white">{team2.player1} & {team2.player2}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <div className="text-2xl font-bold text-green-400">{matchup.winProbability.team1}%</div>
                            <div className="text-xs text-zinc-400">Win Probability</div>
                          </div>
                          <div className="text-center p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <div className="text-2xl font-bold text-blue-400">{matchup.winProbability.team2}%</div>
                            <div className="text-xs text-zinc-400">Win Probability</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm mb-3">
                          <div className="text-zinc-400">
                            Expected Score: <span className="text-white font-medium">{matchup.expectedScore}</span>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            matchup.excitement === 'high' ? 'bg-red-500/20 text-red-400' :
                            matchup.excitement === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {matchup.excitement === 'high' ? 'Sangat Seru' : 
                             matchup.excitement === 'medium' ? 'Seru' : 'Standar'}
                          </div>
                        </div>

                        <p className="text-sm text-zinc-400 leading-relaxed">{matchup.reasoning}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="bg-zinc-900 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Rekomendasi
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-zinc-300">
                      <span className="text-purple-400 font-bold">{idx + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
