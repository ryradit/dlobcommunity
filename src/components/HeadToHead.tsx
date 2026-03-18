'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Zap, ChevronDown, ChevronUp, Calendar, Users, Trophy } from 'lucide-react';

interface Match {
  id: string;
  match_number: number;
  match_date: string | null;
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
  opponent1: string;
  opponent2: string;
  teamScore: number;
  opponentScore: number;
  result: 'win' | 'loss' | 'draw';
}

interface Props {
  memberName: string;
}

export default function HeadToHead({ memberName }: Props) {
  const [headToHeadMatches, setHeadToHeadMatches] = useState<HeadToHeadMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selectedOpponents, setSelectedOpponents] = useState<string | null>(null);

  useEffect(() => {
    fetchHeadToHeadMatches();
  }, [memberName]);

  async function fetchHeadToHeadMatches() {
    try {
      setLoading(true);

      // Calculate last month's date range
      const today = new Date();
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      const monthStart = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1);
      const monthEnd = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0, 23, 59, 59);

      // Fetch all 2v2 matches from that month
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .gte('match_date', monthStart.toISOString())
        .lte('match_date', monthEnd.toISOString())
        .not('team1_player1', 'is', null)
        .not('team1_player2', 'is', null)
        .not('team2_player1', 'is', null)
        .not('team2_player2', 'is', null)
        .order('match_date', { ascending: false });

      if (error) {
        console.error('Error fetching matches:', error);
        return;
      }

      // Filter for matches where memberName participated
      const relevantMatches: HeadToHeadMatch[] = [];

      (data as Match[]).forEach((match) => {
        let userTeam: 'team1' | 'team2' | null = null;
        let opponent1: string | null = null;
        let opponent2: string | null = null;

        // Check if user is in team1
        if (match.team1_player1 === memberName || match.team1_player2 === memberName) {
          userTeam = 'team1';
          opponent1 = match.team2_player1;
          opponent2 = match.team2_player2;
        }
        // Check if user is in team2
        else if (match.team2_player1 === memberName || match.team2_player2 === memberName) {
          userTeam = 'team2';
          opponent1 = match.team1_player1;
          opponent2 = match.team1_player2;
        }

        // Only include matches where user participated
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

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/4 mb-4"></div>
        <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/3"></div>
      </div>
    );
  }

  if (headToHeadMatches.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-purple-500" />
          <h2 className="font-bold text-gray-900 dark:text-white">Head-to-Head</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Belum ada pertandingan 2v2 yang data dari bulan {new Date(new Date().getFullYear(), new Date().getMonth() - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
        </p>
      </div>
    );
  }

  // Group matches by opponent pair
  const groupedByOpponents = headToHeadMatches.reduce((acc, h2h) => {
    const key = [h2h.opponent1, h2h.opponent2].sort().join('|');
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(h2h);
    return acc;
  }, {} as Record<string, HeadToHeadMatch[]>);

  // Calculate stats
  const totalMatches = headToHeadMatches.length;
  const wins = headToHeadMatches.filter(h => h.result === 'win').length;
  const losses = headToHeadMatches.filter(h => h.result === 'loss').length;
  const draws = headToHeadMatches.filter(h => h.result === 'draw').length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2 hover:opacity-75 transition-opacity"
        >
          <Zap className="w-5 h-5 text-purple-500 shrink-0" />
          <h2 className="font-bold text-gray-900 dark:text-white text-lg flex-1 text-left">Head-to-Head</h2>
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            {new Date(new Date().getFullYear(), new Date().getMonth() - 1).toLocaleString('id-ID', { month: 'short', year: 'numeric' })}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Summary Stats */}
      {expanded && (
        <>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalMatches}</div>
              <div className="text-xs text-gray-500 dark:text-zinc-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{wins}</div>
              <div className="text-xs text-gray-500 dark:text-zinc-400">Menang</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{losses}</div>
              <div className="text-xs text-gray-500 dark:text-zinc-400">Kalah</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{winRate}%</div>
              <div className="text-xs text-gray-500 dark:text-zinc-400">WR</div>
            </div>
          </div>

          {/* Matches List */}
          <div className="divide-y divide-gray-200 dark:divide-zinc-700">
            {Object.entries(groupedByOpponents).map(([opponentKey, matches]) => {
              const opponentNames = opponentKey.split('|');
              const groupWins = matches.filter(m => m.result === 'win').length;
              const groupLosses = matches.filter(m => m.result === 'loss').length;
              const groupDraws = matches.filter(m => m.result === 'draw').length;

              return (
                <div key={opponentKey} className="p-4">
                  {/* Opponent Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        vs {opponentNames.join(' & ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={groupWins > 0 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-400'}>
                        {groupWins}W
                      </span>
                      <span className={groupLosses > 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-400'}>
                        {groupLosses}L
                      </span>
                      {groupDraws > 0 && <span className="text-blue-600 dark:text-blue-400 font-bold">{groupDraws}D</span>}
                    </div>
                  </div>

                  {/* Individual Match Details */}
                  <div className="space-y-2">
                    {matches.map((h2h) => (
                      <div
                        key={h2h.match.id}
                        className={`p-3 rounded-lg text-sm border ${
                          h2h.result === 'win'
                            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                            : h2h.result === 'loss'
                              ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                              : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {h2h.result === 'win' && <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />}
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {h2h.teamScore}
                              {h2h.opponentScore !== undefined && ` - ${h2h.opponentScore}`}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              h2h.result === 'win'
                                ? 'bg-green-200 dark:bg-green-500/20 text-green-800 dark:text-green-300'
                                : h2h.result === 'loss'
                                  ? 'bg-red-200 dark:bg-red-500/20 text-red-800 dark:text-red-300'
                                  : 'bg-blue-200 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300'
                            }`}
                          >
                            {h2h.result === 'win' ? 'MENANG' : h2h.result === 'loss' ? 'KALAH' : 'SERI'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-400">
                          <Calendar className="w-3 h-3" />
                          {h2h.match.match_date
                            ? new Date(h2h.match.match_date).toLocaleDateString('id-ID', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Tanggal tidak tersedia'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
