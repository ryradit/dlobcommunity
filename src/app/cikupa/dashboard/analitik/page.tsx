'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Trophy,
  Target,
  TrendingUp,
  Award,
  Calendar,
  Users,
  Filter,
  X,
  Flame,
  BarChart3,
  UserCheck,
  Crown,
  Sparkles,
  TrendingDown,
  AlertCircle,
  Brain,
  Info,
  HelpCircle,
  Download,
  Share2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { StatCardSkeleton, ChartSkeleton } from '@/components/LoadingSkeletons';
import BranchBadge from '@/components/BranchBadge';
import ProfileCompletionWarning from '@/components/ProfileCompletionWarning';
import { useReportGenerator } from '@/hooks/useReportGenerator';

const BRANCH_ID = 'dlob-cikupa';

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
  recentForm: boolean[];
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
  result: number;
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

export default function CikupaAnalitikPage() {
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
  const [showAIHelpModal, setShowAIHelpModal] = useState(false);
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

  // Member info
  const [memberName, setMemberName] = useState('');

  // Report generation hook
  const { generateMemberReport, isGenerating: isGeneratingReport } = useReportGenerator();

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user!.id)
        .maybeSingle();

      const name =
        profile?.full_name ||
        user!.user_metadata?.full_name ||
        user!.email?.split('@')[0] ||
        '';

      setMemberName(name);

      if (!name) {
        setLoading(false);
        return;
      }

      // 2. Fetch all completed matches strictly for DLBC Cikupa
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select('*')
        .eq('branch_id', BRANCH_ID)
        .not('winner', 'is', null)
        .order('match_date', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching DLBC matches for analytics:', error);
        setLoading(false);
        return;
      }

      const nameLower = name.trim().toLowerCase();

      // 3. Filter matches where the member actually played
      const memberMatches = (matchesData || []).filter((match) => {
        const p1 = match.team1_player1?.trim().toLowerCase();
        const p2 = match.team1_player2?.trim().toLowerCase();
        const p3 = match.team2_player1?.trim().toLowerCase();
        const p4 = match.team2_player2?.trim().toLowerCase();
        return p1 === nameLower || p2 === nameLower || p3 === nameLower || p4 === nameLower;
      });

      // 4. Process matches
      const results: MatchResult[] = [];
      let wins = 0;
      let totalScore = 0;
      let highestScore = 0;
      let biggestMargin = 0;

      let currentStreakType: 'win' | 'loss' | null = null;
      let currentStreakCount = 0;
      let longestWinStreak = 0;
      let longestLossStreak = 0;
      let tempWinStreak = 0;
      let tempLossStreak = 0;

      memberMatches.forEach((match, index) => {
        const p1 = match.team1_player1?.trim().toLowerCase();
        const p2 = match.team1_player2?.trim().toLowerCase();
        const isTeam1 = p1 === nameLower || p2 === nameLower;
        const myTeam = isTeam1 ? 'team1' : 'team2';
        const isWinner =
          (isTeam1 && match.winner === 'team1') || (!isTeam1 && match.winner === 'team2');

        const partner = isTeam1
          ? p1 === nameLower
            ? match.team1_player2
            : match.team1_player1
          : match.team2_player1?.trim().toLowerCase() === nameLower
          ? match.team2_player2
          : match.team2_player1;

        const opponents = isTeam1
          ? [match.team2_player1, match.team2_player2].filter(Boolean)
          : [match.team1_player1, match.team1_player2].filter(Boolean);

        const myScore = isTeam1 ? match.team1_score ?? 0 : match.team2_score ?? 0;
        const opponentScore = isTeam1 ? match.team2_score ?? 0 : match.team1_score ?? 0;

        totalScore += myScore;
        if (myScore > highestScore) highestScore = myScore;

        const margin = Math.abs(myScore - opponentScore);
        if (isWinner && margin > biggestMargin) biggestMargin = margin;

        if (isWinner) {
          wins++;
          tempWinStreak++;
          tempLossStreak = 0;
          if (tempWinStreak > longestWinStreak) longestWinStreak = tempWinStreak;
          if (index === 0) {
            currentStreakType = 'win';
            currentStreakCount = 1;
          } else if (currentStreakType === 'win') {
            currentStreakCount++;
          }
        } else {
          tempLossStreak++;
          tempWinStreak = 0;
          if (tempLossStreak > longestLossStreak) longestLossStreak = tempLossStreak;
          if (index === 0) {
            currentStreakType = 'loss';
            currentStreakCount = 1;
          } else if (currentStreakType === 'loss') {
            currentStreakCount++;
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
          team1_score: match.team1_score ?? 0,
          team2_score: match.team2_score ?? 0,
          winner: match.winner,
          myTeam,
          isWinner,
          partner: partner || 'Solo / Partner',
          opponents,
          myScore,
          opponentScore,
        });
      });

      const totalMatches = memberMatches.length;
      const losses = totalMatches - wins;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
      const averageScore = totalMatches > 0 ? Math.round(totalScore / totalMatches) : 0;
      const recentForm = results.slice(0, 5).map((m) => m.isWinner);

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

      // 5. Calculate Partner Stats
      const partnerMap = new Map<string, { matches: number; wins: number }>();
      results.forEach((match) => {
        if (!match.partner) return;
        const current = partnerMap.get(match.partner) || { matches: 0, wins: 0 };
        partnerMap.set(match.partner, {
          matches: current.matches + 1,
          wins: current.wins + (match.isWinner ? 1 : 0),
        });
      });

      const partners: PartnerStats[] = Array.from(partnerMap.entries())
        .map(([pName, data]) => ({
          name: pName,
          matches: data.matches,
          wins: data.wins,
          winRate: Math.round((data.wins / data.matches) * 100),
        }))
        .sort((a, b) => b.winRate - a.winRate);

      setPartnerStats(partners);

      // 6. Calculate Opponent Stats
      const opponentMap = new Map<string, { matches: number; wins: number; losses: number }>();
      results.forEach((match) => {
        match.opponents.forEach((opp) => {
          if (!opp) return;
          const current = opponentMap.get(opp) || { matches: 0, wins: 0, losses: 0 };
          opponentMap.set(opp, {
            matches: current.matches + 1,
            wins: current.wins + (match.isWinner ? 1 : 0),
            losses: current.losses + (match.isWinner ? 0 : 1),
          });
        });
      });

      const opponents: OpponentStats[] = Array.from(opponentMap.entries())
        .map(([oName, data]) => ({
          name: oName,
          matches: data.matches,
          wins: data.wins,
          losses: data.losses,
          winRate: Math.round((data.wins / data.matches) * 100),
        }))
        .sort((a, b) => b.matches - a.matches);

      setOpponentStats(opponents);

      // 7. Calculate Monthly Data (last 6 months)
      const monthlyMap = new Map<string, { wins: number; losses: number }>();
      results.forEach((match) => {
        const date = new Date(match.match_date ?? match.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const current = monthlyMap.get(monthKey) || { wins: 0, losses: 0 };
        monthlyMap.set(monthKey, {
          wins: current.wins + (match.isWinner ? 1 : 0),
          losses: current.losses + (match.isWinner ? 0 : 1),
        });
      });

      const monthlyArray: MonthlyData[] = Array.from(monthlyMap.entries())
        .map(([mKey, data]) => ({
          month: new Date(mKey + '-01').toLocaleDateString('id-ID', {
            month: 'short',
            year: 'numeric',
          }),
          wins: data.wins,
          losses: data.losses,
        }))
        .slice(0, 6)
        .reverse();

      setMonthlyData(monthlyArray);

      // 8. Score progression
      const scoreProgressionData: ScoreProgressionData[] = results
        .slice(0, 20)
        .reverse()
        .map((match, index) => ({
          matchNumber: results.length - 19 + index,
          myScore: match.myScore,
          opponentScore: match.opponentScore,
          date: new Date(match.match_date ?? match.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
          }),
        }));

      setScoreProgression(scoreProgressionData);

      // 9. Form trend
      const formTrendData: FormTrendData[] = results
        .slice(0, 20)
        .reverse()
        .map((match, index) => {
          const last10 = results
            .slice(Math.max(0, results.length - 10 - index), results.length - index)
            .slice(-10);
          const winCount = last10.filter((m) => m.isWinner).length;
          const rollingAverage = last10.length > 0 ? (winCount / last10.length) * 100 : 0;

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
      console.error('Error in loadData for DLBC analitik:', error);
    } finally {
      setLoading(false);
    }
  }

  // AI Feature Handlers
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
          userId: user?.id,
          branchId: BRANCH_ID,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Gagal memuat AI insights');
      }
      if (data.insights) {
        setAiInsights(data.insights);
      }
    } catch (error: unknown) {
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
          userId: user?.id,
          branchId: BRANCH_ID,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Gagal memuat rekomendasi partner');
      }
      if (data.recommendations) {
        setPartnerRecommendations(data.recommendations);
      }
    } catch (error: unknown) {
      console.error('Failed to generate partner recommendations:', error);
    } finally {
      setAiLoading(false);
    }
  }

  async function toggleAI() {
    setShowAI(!showAI);
    if (!showAI && aiInsights.length === 0) {
      await Promise.all([generateAIInsights(), generatePartnerRecommendations()]);
    }
  }

  // Filter application
  useEffect(() => {
    let filtered = [...allMatches];

    if (dateRange.start) {
      filtered = filtered.filter(
        (m) => new Date(m.match_date ?? m.created_at) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(
        (m) => new Date(m.match_date ?? m.created_at) <= new Date(dateRange.end)
      );
    }
    if (selectedPartner) {
      filtered = filtered.filter((m) => m.partner === selectedPartner);
    }

    setFilteredMatches(filtered);
  }, [dateRange, selectedPartner, allMatches]);

  function clearFilters() {
    setDateRange({ start: '', end: '' });
    setSelectedPartner('');
  }

  const hasActiveFilters = Boolean(dateRange.start || dateRange.end || selectedPartner);

  // PDF Report Generator
  async function handleGenerateReport(share: boolean = false) {
    if (!memberName || stats.totalMatches === 0) {
      alert('Tidak ada data pertandingan DLBC untuk membuat laporan');
      return;
    }

    const reportData = {
      memberName: `${memberName} (DLBC Cikupa)`,
      memberEmail: user?.email || 'member@dlob.com',
      hasMembership: false,
      stats: {
        totalMatches: stats.totalMatches ?? 0,
        totalWins: stats.totalWins ?? 0,
        totalLosses: stats.totalLosses ?? 0,
        winRate: stats.winRate ?? 0,
        doublesWinRate: stats.winRate ?? 0,
        averageScore: stats.averageScore ?? 0,
        highestScore: stats.highestScore ?? 0,
        biggestWinMargin: stats.biggestWinMargin ?? 0,
        longestWinStreak: stats.longestWinStreak ?? 0,
        longestLossStreak: stats.longestLossStreak ?? 0,
        currentStreak: stats.currentStreak ?? { type: null, count: 0 },
        recentForm: stats.recentForm ?? [],
      },
      partnerStats: partnerStats.slice(0, 8).map((p) => ({
        ...p,
        winRate: p.winRate ?? 0,
      })),
      opponentStats: opponentStats.slice(0, 8).map((o) => ({
        ...o,
        winRate: o.winRate ?? 0,
      })),
      monthlyData,
      insights: aiInsights.map((insight) => ({
        title: insight.title,
        description: insight.description,
        type:
          insight.type === 'positive'
            ? ('strength' as const)
            : insight.type === 'negative'
            ? ('improvement' as const)
            : ('recommendation' as const),
      })),
      partnerRecommendations: partnerRecommendations.map((r) => ({
        partner: r.partner ?? '',
        reason: r.reason ?? '',
        confidence: r.confidence ?? ('medium' as const),
        winRate: typeof r.winRate === 'number' ? r.winRate : 0,
      })),
    };

    const result = await generateMemberReport(reportData, {
      chartElementId: 'performance-chart',
      share,
    });

    if (!result.success) {
      alert(`Gagal membuat laporan: ${result.error}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6 transition-colors duration-300">
      <ProfileCompletionWarning />

      {/* Top Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Analitik Pertandingan
              </h1>
              <BranchBadge size="sm" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-300 font-medium">
              Statistik performa dan riwayat pertandingan Anda di cabang DLBC Cikupa
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAIHelpModal(true)}
              className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 transition-colors"
              title="Informasi analitik"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleGenerateReport(false)}
              disabled={isGeneratingReport || stats.totalMatches === 0}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-xs"
              title="Download laporan sebagai PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            <button
              onClick={() => handleGenerateReport(true)}
              disabled={isGeneratingReport || stats.totalMatches === 0}
              className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-xs"
              title="Bagikan laporan"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={toggleAI}
              disabled={aiLoading || stats.totalMatches === 0}
              className="member-analitik-ai-insights flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              {aiLoading ? 'Menganalisis...' : showAI ? 'Sembunyikan AI' : 'AI Insights'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      {showAI && (
        <div className="mb-8 space-y-6">
          {/* AI Performance Insights */}
          {aiInsights.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xs transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        AI Performance Insights DLBC
                      </h2>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Powered</span>
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Analisis cerdas pola permainan dan rekomendasi taktis Anda di cabang DLBC Cikupa
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAIHelpModal(true)}
                  className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Info className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Tentang AI</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiInsights.map((insight, idx) => {
                  const IconComponent =
                    insight.icon === 'trophy'
                      ? Trophy
                      : insight.icon === 'trending-up'
                      ? TrendingUp
                      : insight.icon === 'trending-down'
                      ? TrendingDown
                      : insight.icon === 'users'
                      ? Users
                      : insight.icon === 'flame'
                      ? Flame
                      : insight.icon === 'alert'
                      ? AlertCircle
                      : Target;

                  const isPos = insight.type === 'positive';
                  const isNeg = insight.type === 'negative';

                  const badgeText = isPos
                    ? 'Pencapaian Positif'
                    : isNeg
                    ? 'Evaluasi & Solusi'
                    : 'Wawasan Strategis';

                  const borderAccent = isPos
                    ? 'border-l-4 border-l-emerald-500'
                    : isNeg
                    ? 'border-l-4 border-l-rose-500'
                    : 'border-l-4 border-l-sky-500';

                  const iconBoxStyle = isPos
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : isNeg
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20';

                  const badgeStyle = isPos
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40'
                    : isNeg
                    ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40'
                    : 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/40';

                  return (
                    <div
                      key={idx}
                      className={`bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 ${borderAccent} rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all shadow-xs`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeStyle}`}
                          >
                            {badgeText}
                          </span>
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconBoxStyle}`}
                          >
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2 leading-snug">
                          {insight.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Smart Partner Recommendations */}
          {partnerRecommendations.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xs transition-all">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      Rekomendasi Partner DLBC
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Kandidat partner dengan sinergi kemenangan tertinggi di cabang DLBC Cikupa
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {partnerRecommendations.map((rec, idx) => {
                  const isTopRank = idx === 0;
                  const rankColor = isTopRank
                    ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                    : 'text-zinc-400 bg-zinc-200/60 dark:bg-zinc-700/40 border-zinc-300 dark:border-zinc-600';

                  const badgeColor =
                    rec.confidence === 'high'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40'
                      : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40';

                  return (
                    <div
                      key={idx}
                      className={`p-4 sm:p-5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isTopRank
                          ? 'border-emerald-500/30 shadow-xs ring-1 ring-emerald-500/10'
                          : 'border-zinc-200/80 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 flex-1">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-sm shrink-0 mt-0.5 ${rankColor}`}
                        >
                          <Crown className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                              {rec.partner}
                            </h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                            >
                              {rec.confidence === 'high' ? 'Sangat Disarankan' : 'Disarankan'}
                            </span>
                            {isTopRank && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Best Synergy #1
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            {rec.reason}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60 dark:border-zinc-800">
                        <div className="text-left sm:text-right">
                          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium block">
                            Win Rate
                          </span>
                          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                            {rec.winRate}%
                          </span>
                        </div>
                        <div className="w-24 sm:w-28 h-1.5 bg-zinc-200 dark:bg-zinc-700/80 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${rec.winRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4 Primary Stats Grid */}
      <div className="member-analitik-stats grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.totalMatches}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 font-medium">
            Total Pertandingan
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 dark:text-yellow-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.totalWins}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 font-medium">
            Total Kemenangan
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 dark:text-red-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.totalLosses}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 font-medium">
            Total Kekalahan
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 dark:text-green-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.winRate}%
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 font-medium">
            Persentase Menang
          </div>
        </div>
      </div>

      {/* 3 Advanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Streak Card */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tren Kemenangan</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-1">Streak Saat Ini</p>
              <p
                className={`text-xl font-bold ${
                  stats.currentStreak.type === 'win'
                    ? 'text-green-500'
                    : stats.currentStreak.type === 'loss'
                    ? 'text-red-500'
                    : 'text-gray-400'
                }`}
              >
                {stats.currentStreak.count > 0
                  ? `${stats.currentStreak.count} ${
                      stats.currentStreak.type === 'win' ? 'Menang' : 'Kalah'
                    }`
                  : '-'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-white/10">
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-1">
                  Menang Berturut-turut
                </p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {stats.longestWinStreak}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-1">
                  Kalah Berturut-turut
                </p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {stats.longestLossStreak}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Score Stats */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Statistik Skor</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-1">Rata-rata Skor</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.averageScore}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-white/10">
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-1">
                  Skor Tertinggi
                </p>
                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.highestScore}
                </p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">poin maksimal</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-1">
                  Kemenangan Terbesar
                </p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  +{stats.biggestWinMargin}
                </p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">selisih poin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Form */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-teal-500 dark:text-teal-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Form</h3>
          </div>
          <div className="flex gap-2 justify-center">
            {stats.recentForm.length > 0 ? (
              stats.recentForm.map((isWin, idx) => (
                <div
                  key={idx}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${
                    isWin
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {isWin ? 'W' : 'L'}
                </div>
              ))
            ) : (
              <p className="text-zinc-400 text-sm py-3">Belum ada data sesi di DLBC</p>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium text-center mt-3">
            5 Pertandingan Terakhir
          </p>
        </div>
      </div>

      {/* Monthly Performance Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 mb-8 shadow-sm transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            Performa Bulanan (DLBC Cikupa)
          </h3>
          <div id="performance-chart">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                  style={{ fontSize: '13px', fontWeight: 500 }}
                  tick={{ fill: '#9ca3af' }}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: '13px', fontWeight: 500 }}
                  tick={{ fill: '#9ca3af' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} iconType="circle" />
                <Bar dataKey="wins" fill="#10b981" name="Menang" radius={[8, 8, 0, 0]} maxBarSize={50} />
                <Bar dataKey="losses" fill="#f43f5e" name="Kalah" radius={[8, 8, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Score Progression & Form Trend Charts */}
      {allMatches.length > 0 && (
        <div className="member-analitik-charts grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {scoreProgression.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 shadow-sm transition-colors duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Perkembangan Score
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-4">
                20 Pertandingan Terakhir
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scoreProgression} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                  <XAxis
                    dataKey="matchNumber"
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                    tick={{ fill: '#9ca3af' }}
                  />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} tick={{ fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '15px' }} iconType="line" />
                  <Line
                    type="monotone"
                    dataKey="myScore"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    name="Score Saya"
                  />
                  <Line
                    type="monotone"
                    dataKey="opponentScore"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    dot={{ fill: '#f43f5e', r: 4 }}
                    name="Score Lawan"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {formTrend.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 shadow-sm transition-colors duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Tren Performa
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-4">
                Rolling Average (10 Match)
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={formTrend} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="dlbcWinRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                  <XAxis
                    dataKey="matchNumber"
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                    tick={{ fill: '#9ca3af' }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                    tick={{ fill: '#9ca3af' }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                    formatter={(value: any) => [`${value}%`, 'Win Rate']}
                  />
                  <Area
                    type="monotone"
                    dataKey="rollingAverage"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#dlbcWinRate)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Partner & Opponent Stats */}
      <div className="member-analitik-partners grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Partner Terbaik */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 shadow-sm transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            Partner Terbaik (DLBC)
          </h3>
          {partnerStats.length > 0 ? (
            <div className="space-y-3">
              {partnerStats.slice(0, 5).map((partner, idx) => (
                <div
                  key={partner.name}
                  className="flex items-center justify-between p-3 bg-gray-100 dark:bg-zinc-800/50 border border-gray-200 dark:border-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {idx === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{partner.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{partner.matches} matches</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">
                      {partner.winRate}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{partner.wins}W</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Belum ada riwayat partner di DLBC
            </div>
          )}
        </div>

        {/* Lawan Tersering */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 shadow-sm transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-red-500" />
            Lawan Tersering (DLBC)
          </h3>
          {opponentStats.length > 0 ? (
            <div className="space-y-3">
              {opponentStats.slice(0, 5).map((opponent) => (
                <div
                  key={opponent.name}
                  className="flex items-center justify-between p-3 bg-gray-100 dark:bg-zinc-800/50 border border-gray-200 dark:border-white/5 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{opponent.name}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{opponent.matches} matches</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {opponent.wins}W - {opponent.losses}L
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{opponent.winRate}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Belum ada riwayat lawan di DLBC
            </div>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="member-analitik-filter bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 mb-6 shadow-sm transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-500" />
            Filter Pertandingan
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium"
          >
            {showFilters ? 'Sembunyikan' : 'Tampilkan'}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-zinc-400 font-semibold mb-2">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-zinc-400 font-semibold mb-2">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-zinc-400 font-semibold mb-2">
                Partner
              </label>
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">Semua Partner</option>
                {partnerStats.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="mt-4 flex items-center gap-2">
            <p className="text-sm text-gray-600 dark:text-zinc-400 font-medium">
              Menampilkan {filteredMatches.length} dari {allMatches.length} pertandingan
            </p>
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-500 flex items-center gap-1 font-medium"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Match History List */}
      <div className="member-analitik-match-history bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 shadow-sm transition-colors duration-300">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-500" />
          Riwayat Pertandingan (DLBC Cikupa)
        </h2>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-gray-500 dark:text-zinc-400">
            Memuat data pertandingan...
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center">
            <Calendar className="w-10 h-10 text-gray-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">
              {hasActiveFilters
                ? 'Tidak ada pertandingan yang sesuai filter'
                : 'Belum ada data pertandingan di cabang DLBC Cikupa'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Pertandingan yang Anda mainkan di DLBC akan otomatis muncul di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.slice(0, 10).map((match) => (
              <div
                key={match.id}
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all duration-300 hover:shadow-xs hover:scale-[1.005]"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Match #{match.match_number}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(match.match_date ?? match.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-zinc-500">
                      vs {match.opponents.join(', ')}
                    </span>
                  </div>

                  {match.isWinner ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-semibold flex items-center gap-1 border border-green-500/30">
                      <Trophy className="w-3 h-3" />
                      Menang
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-xs font-semibold flex items-center gap-1 border border-red-500/30">
                      <Target className="w-3 h-3" />
                      Kalah
                    </span>
                  )}
                </div>

                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                      Partner:{' '}
                      <strong className="text-gray-900 dark:text-white">{match.partner}</strong>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                      Lawan:{' '}
                      <span className="text-gray-700 dark:text-zinc-300">
                        {match.opponents.join(' & ')}
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-2xl font-black ${
                        match.isWinner
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-500 dark:text-red-400'
                      }`}
                    >
                      {match.myScore} - {match.opponentScore}
                    </span>
                    <span className="text-xs text-gray-400 block font-medium">
                      {match.isWinner ? `+${match.myScore - match.opponentScore} poin` : `-${match.opponentScore - match.myScore} poin`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Help Modal */}
      {showAIHelpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-400" />
                Tentang AI Analitik DLBC
              </h3>
              <button
                onClick={() => setShowAIHelpModal(false)}
                className="text-zinc-400 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-zinc-300">
              <p>
                Sistem analitik DLBC menghitung statistik performa badminton Anda secara real-time
                berdasarkan pertandingan resmi yang dicatat di cabang DLBC Cikupa:
              </p>
              <ul className="list-disc list-inside space-y-2 text-xs text-zinc-400">
                <li>
                  <strong className="text-white">Win Rate & Streaks:</strong> Dihitung otomatis dari
                  rekor menang-kalah pertandingan ganda.
                </li>
                <li>
                  <strong className="text-white">Partner Sinergi:</strong> Menemukan partner terbaik
                  dengan persentase kemenangan tertinggi saat bermain bersama Anda.
                </li>
                <li>
                  <strong className="text-white">AI Insights:</strong> Analisis mendalam kekuatan,
                  evaluasi permainan, dan rekomendasi taktik untuk pertandingan selanjutnya.
                </li>
              </ul>
              <button
                onClick={() => setShowAIHelpModal(false)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors text-sm mt-2"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
