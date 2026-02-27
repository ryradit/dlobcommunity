'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Target, TrendingUp, Award, Calendar, Users, Filter, X, Flame, BarChart3, UserCheck, Crown, Sparkles, TrendingDown, AlertCircle, Brain } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface MatchStats {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  currentStreak: { type: 'win' | 'loss' | null; count: number };
  longestWinStreak: number;
  longestLossStreak: number;
  averageScore: number;
  highestScore: number;
  biggestWinMargin: number;
  recentForm: boolean[]; // last 5 matches
}

interface MatchResult {
  id: string;
  match_number: number;
  created_at: string;
  match_date: string | null;
  team1_player1: string;
  team1_player2: string;
  team2_player1: string;
  team2_player2: string;
  team1_score: number;
  team2_score: number;
  winner: string;
  myTeam: 'team1' | 'team2';
  isWinner: boolean;
  partner: string;
  opponents: string[];
  myScore: number;
  opponentScore: number;
}

interface PartnerStats {
  name: string;
  matches: number;
  wins: number;
  winRate: number;
}

interface OpponentStats {
  name: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface MonthlyData {
  month: string;
  wins: number;
  losses: number;
}

interface ScoreProgressionData {
  matchNumber: number;
  myScore: number;
  opponentScore: number;
  date: string;
}

interface FormTrendData {
  matchNumber: number;
  result: number; // 1 for win, 0 for loss
  rollingAverage: number;
}

interface AIInsight {
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  icon: string;
}

interface PartnerRecommendation {
  partner: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  winRate: number;
}

interface MatchPrediction {
  winProbability: number;
  confidence: 'high' | 'medium' | 'low';
  analysis: string;
  keyFactors: string[];
  advice: string;
}

export default function AnalitikPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MatchStats>({
    totalMatches: 0,
    totalWins: 0,
    totalLosses: 0,
    winRate: 0,
    currentStreak: { type: null, count: 0 },
    longestWinStreak: 0,
    longestLossStreak: 0,
    averageScore: 0,
    highestScore: 0,
    biggestWinMargin: 0,
    recentForm: [],
  });
  const [allMatches, setAllMatches] = useState<MatchResult[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchResult[]>([]);
  const [partnerStats, setPartnerStats] = useState<PartnerStats[]>([]);
  const [opponentStats, setOpponentStats] = useState<OpponentStats[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [scoreProgression, setScoreProgression] = useState<ScoreProgressionData[]>([]);
  const [formTrend, setFormTrend] = useState<FormTrendData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // AI Features
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [partnerRecommendations, setPartnerRecommendations] = useState<PartnerRecommendation[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);
  
  // Filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedPartner, setSelectedPartner] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMatchStats();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [dateRange, selectedPartner, allMatches]);

  async function fetchMatchStats() {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      if (!profileData) return;

      const memberName = profileData.full_name;

      const { data: matchesData, error } = await supabase
        .from('matches')
        .select('*')
        .not('winner', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const memberMatches = matchesData?.filter(match => {
        return match.team1_player1 === memberName ||
               match.team1_player2 === memberName ||
               match.team2_player1 === memberName ||
               match.team2_player2 === memberName;
      }) || [];

      // Process all matches
      const results: MatchResult[] = [];
      let wins = 0;
      let totalScore = 0;
      let highestScore = 0;
      let biggestMargin = 0;
      
      // For streaks
      let currentStreakType: 'win' | 'loss' | null = null;
      let currentStreakCount = 0;
      let longestWinStreak = 0;
      let longestLossStreak = 0;
      let tempWinStreak = 0;
      let tempLossStreak = 0;

      memberMatches.forEach((match, index) => {
        const isTeam1 = match.team1_player1 === memberName || match.team1_player2 === memberName;
        const myTeam = isTeam1 ? 'team1' : 'team2';
        const isWinner = (isTeam1 && match.winner === 'team1') || (!isTeam1 && match.winner === 'team2');
        
        const partner = isTeam1 
          ? (match.team1_player1 === memberName ? match.team1_player2 : match.team1_player1)
          : (match.team2_player1 === memberName ? match.team2_player2 : match.team2_player1);
        
        const opponents = isTeam1 
          ? [match.team2_player1, match.team2_player2]
          : [match.team1_player1, match.team1_player2];

        const myScore = isTeam1 ? match.team1_score : match.team2_score;
        const opponentScore = isTeam1 ? match.team2_score : match.team1_score;
        
        totalScore += myScore;
        if (myScore > highestScore) highestScore = myScore;
        
        const margin = Math.abs(myScore - opponentScore);
        if (isWinner && margin > biggestMargin) biggestMargin = margin;

        // Calculate streaks
        if (isWinner) {
          wins++;
          tempWinStreak++;
          tempLossStreak = 0;
          if (tempWinStreak > longestWinStreak) longestWinStreak = tempWinStreak;
          if (index === 0) {
            currentStreakType = 'win';
            currentStreakCount = tempWinStreak;
          }
        } else {
          tempLossStreak++;
          tempWinStreak = 0;
          if (tempLossStreak > longestLossStreak) longestLossStreak = tempLossStreak;
          if (index === 0) {
            currentStreakType = 'loss';
            currentStreakCount = tempLossStreak;
          }
        }

        results.push({
          id: match.id,
          match_number: match.match_number,
          created_at: match.created_at,
          match_date: match.match_date,
          team1_player1: match.team1_player1,
          team1_player2: match.team1_player2,
          team2_player1: match.team2_player1,
          team2_player2: match.team2_player2,
          team1_score: match.team1_score,
          team2_score: match.team2_score,
          winner: match.winner,
          myTeam,
          isWinner,
          partner,
          opponents,
          myScore,
          opponentScore,
        });
      });

      const totalMatches = memberMatches.length;
      const losses = totalMatches - wins;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
      const averageScore = totalMatches > 0 ? Math.round(totalScore / totalMatches) : 0;
      
      // Recent form (last 5 matches)
      const recentForm = results.slice(0, 5).map(m => m.isWinner);

      setStats({
        totalMatches,
        totalWins: wins,
        totalLosses: losses,
        winRate,
        currentStreak: { type: currentStreakType, count: currentStreakCount },
        longestWinStreak,
        longestLossStreak,
        averageScore,
        highestScore,
        biggestWinMargin: biggestMargin,
        recentForm,
      });

      // Calculate partner stats
      const partnerMap = new Map<string, { matches: number; wins: number }>();
      results.forEach(match => {
        const current = partnerMap.get(match.partner) || { matches: 0, wins: 0 };
        partnerMap.set(match.partner, {
          matches: current.matches + 1,
          wins: current.wins + (match.isWinner ? 1 : 0),
        });
      });

      const partners: PartnerStats[] = Array.from(partnerMap.entries())
        .map(([name, data]) => ({
          name,
          matches: data.matches,
          wins: data.wins,
          winRate: Math.round((data.wins / data.matches) * 100),
        }))
        .sort((a, b) => b.winRate - a.winRate);

      setPartnerStats(partners);

      // Calculate opponent stats
      const opponentMap = new Map<string, { matches: number; wins: number; losses: number }>();
      results.forEach(match => {
        match.opponents.forEach(opp => {
          const current = opponentMap.get(opp) || { matches: 0, wins: 0, losses: 0 };
          opponentMap.set(opp, {
            matches: current.matches + 1,
            wins: current.wins + (match.isWinner ? 1 : 0),
            losses: current.losses + (match.isWinner ? 0 : 1),
          });
        });
      });

      const opponents: OpponentStats[] = Array.from(opponentMap.entries())
        .map(([name, data]) => ({
          name,
          matches: data.matches,
          wins: data.wins,
          losses: data.losses,
          winRate: Math.round((data.wins / data.matches) * 100),
        }))
        .sort((a, b) => b.matches - a.matches);

      setOpponentStats(opponents);

      // Calculate monthly data (last 6 months)
      const monthlyMap = new Map<string, { wins: number; losses: number }>();
      results.forEach(match => {
        const date = new Date(match.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const current = monthlyMap.get(monthKey) || { wins: 0, losses: 0 };
        monthlyMap.set(monthKey, {
          wins: current.wins + (match.isWinner ? 1 : 0),
          losses: current.losses + (match.isWinner ? 0 : 1),
        });
      });

      const monthlyArray: MonthlyData[] = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month: new Date(month + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
          wins: data.wins,
          losses: data.losses,
        }))
        .slice(0, 6)
        .reverse();

      setMonthlyData(monthlyArray);

      // Calculate score progression data (last 20 matches)
      const scoreProgressionData: ScoreProgressionData[] = results
        .slice(0, 20)
        .reverse()
        .map((match, index) => ({
          matchNumber: results.length - 19 + index,
          myScore: match.myScore,
          opponentScore: match.opponentScore,
          date: new Date(match.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        }));

      setScoreProgression(scoreProgressionData);

      // Calculate form trend (rolling average of last 10 matches)
      const formTrendData: FormTrendData[] = results
        .slice(0, 20)
        .reverse()
        .map((match, index) => {
          const last10 = results.slice(Math.max(0, results.length - 10 - index), results.length - index).slice(-10);
          const winCount = last10.filter(m => m.isWinner).length;
          const rollingAverage = (winCount / last10.length) * 100;
          
          return {
            matchNumber: results.length - 19 + index,
            result: match.isWinner ? 1 : 0,
            rollingAverage: Math.round(rollingAverage),
          };
        });

      setFormTrend(formTrendData);

      setAllMatches(results);
      setFilteredMatches(results);
    } catch (error) {
      console.error('Error fetching match stats:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateAIInsights() {
    if (stats.totalMatches === 0) return;
    
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats,
          partnerStats,
          opponentStats,
          recentMatches: allMatches.slice(0, 5),
        }),
      });

      const data = await response.json();
      if (data.insights) {
        setAiInsights(data.insights);
      }
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
    } finally {
      setAiLoading(false);
    }
  }

  async function generatePartnerRecommendations() {
    if (partnerStats.length === 0) return;
    
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/partner-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerStats,
          stats,
        }),
      });

      const data = await response.json();
      if (data.recommendations) {
        setPartnerRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Failed to generate partner recommendations:', error);
    } finally {
      setAiLoading(false);
    }
  }

  async function toggleAI() {
    setShowAI(!showAI);
    if (!showAI && aiInsights.length === 0) {
      await Promise.all([
        generateAIInsights(),
        generatePartnerRecommendations(),
      ]);
    }
  }

  function applyFilters() {
    let filtered = [...allMatches];

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(m => new Date(m.created_at) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(m => new Date(m.created_at) <= new Date(dateRange.end));
    }

    // Partner filter
    if (selectedPartner) {
      filtered = filtered.filter(m => m.partner === selectedPartner);
    }

    setFilteredMatches(filtered);
  }

  function clearFilters() {
    setDateRange({ start: '', end: '' });
    setSelectedPartner('');
  }

  const hasActiveFilters = dateRange.start || dateRange.end || selectedPartner;

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analitik Pertandingan</h1>
            <p className="text-zinc-300">Statistik lengkap dan riwayat pertandingan Anda</p>
          </div>
          <button
            onClick={toggleAI}
            disabled={aiLoading || stats.totalMatches === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5" />
            {aiLoading ? 'Menganalisis...' : showAI ? 'Sembunyikan AI' : 'AI Insights'}
          </button>
        </div>
      </div>

      {/* AI Insights Section */}
      {showAI && (
        <div className="mb-8 space-y-6">
          {/* AI Performance Insights */}
          {aiInsights.length > 0 && (
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-400" />
                AI Performance Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiInsights.map((insight, idx) => {
                  const IconComponent = insight.icon === 'trophy' ? Trophy :
                                       insight.icon === 'trending-up' ? TrendingUp :
                                       insight.icon === 'trending-down' ? TrendingDown :
                                       insight.icon === 'users' ? Users :
                                       insight.icon === 'flame' ? Flame :
                                       insight.icon === 'alert' ? AlertCircle :
                                       Target;
                  
                  const colorClass = insight.type === 'positive' ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' :
                                    insight.type === 'negative' ? 'from-red-500/20 to-rose-500/20 border-red-500/30' :
                                    'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
                  
                  const iconColor = insight.type === 'positive' ? 'text-green-400' :
                                   insight.type === 'negative' ? 'text-red-400' :
                                   'text-blue-400';

                  return (
                    <div key={idx} className={`bg-gradient-to-br ${colorClass} border rounded-lg p-4`}>
                      <div className="flex items-start gap-3">
                        <IconComponent className={`w-5 h-5 ${iconColor} mt-1 flex-shrink-0`} />
                        <div>
                          <h3 className="font-semibold text-white mb-1">{insight.title}</h3>
                          <p className="text-sm text-zinc-300">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Smart Partner Recommendations */}
          {partnerRecommendations.length > 0 && (
            <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-blue-400" />
                Smart Partner Recommendations
              </h2>
              <div className="space-y-3">
                {partnerRecommendations.map((rec, idx) => (
                  <div key={idx} className="bg-zinc-800/50 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Crown className={`w-5 h-5 ${idx === 0 ? 'text-yellow-400' : 'text-zinc-400'}`} />
                        <h3 className="font-semibold text-white">{rec.partner}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rec.confidence === 'high' ? 'bg-green-500/20 text-green-400' :
                          rec.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-zinc-500/20 text-zinc-400'
                        }`}>
                          {rec.confidence === 'high' ? 'Highly Recommended' : 
                           rec.confidence === 'medium' ? 'Recommended' : 'Consider'}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-green-400">{rec.winRate}%</span>
                    </div>
                    <p className="text-sm text-zinc-300">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <Calendar className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.totalMatches}</div>
          <div className="text-sm text-zinc-300">Total Pertandingan</div>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.totalWins}</div>
          <div className="text-sm text-zinc-300">Total Kemenangan</div>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <Target className="w-6 h-6 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.totalLosses}</div>
          <div className="text-sm text-zinc-300">Total Kekalahan</div>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.winRate}%</div>
          <div className="text-sm text-zinc-300">Persentase Menang</div>
        </div>
      </div>

      {/* Advanced Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Streak Card */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Streak</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Current Streak</p>
              <p className={`text-xl font-bold ${stats.currentStreak.type === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                {stats.currentStreak.count} {stats.currentStreak.type === 'win' ? 'Menang' : stats.currentStreak.type === 'loss' ? 'Kalah' : '-'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div>
                <p className="text-xs text-zinc-400 mb-1">Longest Win</p>
                <p className="text-lg font-bold text-green-400">{stats.longestWinStreak}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Longest Loss</p>
                <p className="text-lg font-bold text-red-400">{stats.longestLossStreak}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Score Stats */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Score Statistics</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Rata-rata Score</p>
              <p className="text-xl font-bold text-white">{stats.averageScore}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div>
                <p className="text-xs text-zinc-400 mb-1">Highest Score</p>
                <p className="text-lg font-bold text-yellow-400">{stats.highestScore}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Biggest Win</p>
                <p className="text-lg font-bold text-green-400">+{stats.biggestWinMargin}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Form */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Recent Form</h3>
          </div>
          <div className="flex gap-2 justify-center">
            {stats.recentForm.length > 0 ? stats.recentForm.map((isWin, idx) => (
              <div
                key={idx}
                className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${
                  isWin ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {isWin ? 'W' : 'L'}
              </div>
            )) : (
              <p className="text-zinc-400 text-sm">Belum ada data</p>
            )}
          </div>
          <p className="text-xs text-zinc-400 text-center mt-3">5 Pertandingan Terakhir</p>
        </div>
      </div>

      {/* Monthly Performance Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performa Bulanan
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#888" style={{ fontSize: '12px' }} />
              <YAxis stroke="#888" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="wins" fill="#22c55e" name="Menang" radius={[8, 8, 0, 0]} />
              <Bar dataKey="losses" fill="#ef4444" name="Kalah" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Score Progression & Form Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Score Progression */}
        {scoreProgression.length > 0 && (
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Perkembangan Score (20 Match Terakhir)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={scoreProgression}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="matchNumber" 
                  stroke="#888" 
                  style={{ fontSize: '11px' }}
                  label={{ value: 'Match #', position: 'insideBottom', offset: -5, fill: '#888' }}
                />
                <YAxis stroke="#888" style={{ fontSize: '11px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line 
                  type="monotone" 
                  dataKey="myScore" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 4 }}
                  name="Score Saya"
                />
                <Line 
                  type="monotone" 
                  dataKey="opponentScore" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                  name="Score Lawan"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Form Trend */}
        {formTrend.length > 0 && (
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              Tren Performa (Rolling Average)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={formTrend}>
                <defs>
                  <linearGradient id="colorWinRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="matchNumber" 
                  stroke="#888" 
                  style={{ fontSize: '11px' }}
                  label={{ value: 'Match #', position: 'insideBottom', offset: -5, fill: '#888' }}
                />
                <YAxis 
                  stroke="#888" 
                  style={{ fontSize: '11px' }}
                  label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: any) => [`${value}%`, 'Win Rate (10 match terakhir)']}
                />
                <Area 
                  type="monotone" 
                  dataKey="rollingAverage" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  fill="url(#colorWinRate)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Partner & Opponent Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Best Partners - Now with Bar Chart */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            Partner Terbaik
          </h3>
          {partnerStats.length > 0 && (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={partnerStats.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#888" style={{ fontSize: '11px' }} domain={[0, 100]} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#888" 
                  style={{ fontSize: '11px' }}
                  width={100}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: any, name: any, props: any) => [
                    `${value}% (${props.payload.wins}W dari ${props.payload.matches} match)`,
                    'Win Rate'
                  ]}
                />
                <Bar dataKey="winRate" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Opponent Stats - Now with Bar Chart */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-red-400" />
            Lawan Tersering
          </h3>
          {opponentStats.length > 0 && (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={opponentStats.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#888" style={{ fontSize: '11px' }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#888" 
                  style={{ fontSize: '11px' }}
                  width={100}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="wins" fill="#22c55e" name="Menang" radius={[0, 8, 8, 0]} />
                <Bar dataKey="losses" fill="#ef4444" name="Kalah" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Partner & Opponent Lists (Keep original cards below charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Best Partners List */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            Detail Partner
          </h3>
          <div className="space-y-3">
            {partnerStats.slice(0, 5).map((partner, idx) => (
              <div key={partner.name} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {idx === 0 && <Crown className="w-4 h-4 text-yellow-400" />}
                  <div>
                    <p className="text-sm font-semibold text-white">{partner.name}</p>
                    <p className="text-xs text-zinc-400">{partner.matches} matches</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">{partner.winRate}%</p>
                  <p className="text-xs text-zinc-400">{partner.wins}W</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Opponent Stats List */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-red-400" />
            Detail Lawan
          </h3>
          <div className="space-y-3">
            {opponentStats.slice(0, 5).map((opponent) => (
              <div key={opponent.name} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-white">{opponent.name}</p>
                  <p className="text-xs text-zinc-400">{opponent.matches} matches</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{opponent.wins}W - {opponent.losses}L</p>
                  <p className="text-xs text-zinc-400">{opponent.winRate}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Pertandingan
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            {showFilters ? 'Sembunyikan' : 'Tampilkan'}
          </button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Tanggal Mulai</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Tanggal Akhir</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Partner</label>
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Semua Partner</option>
                {partnerStats.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="mt-4 flex items-center gap-2">
            <p className="text-sm text-zinc-400">
              Menampilkan {filteredMatches.length} dari {allMatches.length} pertandingan
            </p>
            <button
              onClick={clearFilters}
              className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Match History */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5" />
          Riwayat Pertandingan
        </h2>
        
        {loading ? (
          <div className="h-64 flex items-center justify-center text-zinc-400">
            Memuat data pertandingan...
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-zinc-400">
            {hasActiveFilters ? 'Tidak ada pertandingan yang sesuai filter' : 'Belum ada data pertandingan'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.slice(0, 10).map((match) => (
              <div
                key={match.id}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-zinc-800/50 hover:bg-zinc-800 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">
                      Match #{match.match_number}
                    </span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(match.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="text-xs text-zinc-500">vs {match.opponents.join(', ')}</span>
                  </div>
                  {match.isWinner ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold flex items-center gap-1 border border-green-500/30">
                      <Trophy className="w-3 h-3" />
                      Menang
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold border border-red-500/30">
                      Kalah
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className={`flex-1 p-4 rounded-lg transition-all ${
                      match.myTeam === 'team1' 
                        ? match.winner === 'team1'
                          ? 'bg-green-500/10 border-2 border-green-500/30 shadow-lg shadow-green-500/20'
                          : 'bg-red-500/10 border-2 border-red-500/30 shadow-lg shadow-red-500/20'
                        : 'bg-zinc-900/50 border border-white/5'
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-blue-400" />
                        <p className="text-xs font-medium text-zinc-400">Tim 1</p>
                      </div>
                      <div className="space-y-1 mb-3">
                        <p className="text-sm text-white font-medium">{match.team1_player1}</p>
                        <p className="text-sm text-white font-medium">{match.team1_player2}</p>
                      </div>
                      <p className={`text-3xl font-bold ${
                        match.winner === 'team1' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {match.team1_score}
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center px-2">
                      <p className="text-lg font-bold text-zinc-500">VS</p>
                    </div>

                    <div className={`flex-1 p-4 rounded-lg transition-all ${
                      match.myTeam === 'team2'
                        ? match.winner === 'team2'
                          ? 'bg-green-500/10 border-2 border-green-500/30 shadow-lg shadow-green-500/20'
                          : 'bg-red-500/10 border-2 border-red-500/30 shadow-lg shadow-red-500/20'
                        : 'bg-zinc-900/50 border border-white/5'
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-green-400" />
                        <p className="text-xs font-medium text-zinc-400">Tim 2</p>
                      </div>
                      <div className="space-y-1 mb-3">
                        <p className="text-sm text-white font-medium">{match.team2_player1}</p>
                        <p className="text-sm text-white font-medium">{match.team2_player2}</p>
                      </div>
                      <p className={`text-3xl font-bold ${
                        match.winner === 'team2' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {match.team2_score}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
