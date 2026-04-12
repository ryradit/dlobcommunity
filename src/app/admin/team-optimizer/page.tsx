'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import { Users, Sparkles, TrendingUp, Target, Zap, Flame, Droplet, AlertCircle, RefreshCw, HelpCircle, TrendingDown, Award, AlertTriangle, Clock, BarChart3, Filter, X } from 'lucide-react';
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
  recentForm?: string; // "2-1 (3 matches)" last 3 matches trend
  recentWinRate?: number; // Win rate in last 5-10 matches
  worstPartners?: { partner: string; winRate: number; matches: number }[]; // Low win rate partnerships
  formTrend?: 'hot' | 'stable' | 'slump';
  formTrendPercentage?: number;
  lastMatchDate?: string;
  matchesLastMonth?: number;
  skillTrendDirection?: 'up' | 'stable' | 'down';
  partnershipQuality?: 'proven' | 'good' | 'developing' | 'poor';
  recentMatches?: { date: string; opponent: string; won: boolean; score: string }[];
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
  tournamentInsights?: {
    strategySuitability: string;
    strengthAreas: string[];
    riskAreas: string[];
    keyStrengths: string;
  };
}

export default function TeamOptimizerPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [tournamentType, setTournamentType] = useState<'internal' | 'external'>('internal');
  const [mode, setMode] = useState<'balanced' | 'competitive' | 'training' | 'exciting'>('balanced');
  const [numTeams, setNumTeams] = useState<number>(4);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [quickSetupMode, setQuickSetupMode] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<Array<{ name: string; type: 'internal' | 'external'; mode: string }>>([])

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
        const matchResults: boolean[] = []; // Track win/loss for each match in chronological order

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
            matchResults.push(isWinner); // Store result in order (oldest to newest)

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

        // Get best partners (3+ matches, sorted by win rate)
        const bestPartners = Array.from(partnershipMap.entries())
          .map(([partner, stat]) => ({
            partner,
            winRate: Math.round((stat.wins / stat.total) * 100),
            matches: stat.total
          }))
          .filter(p => p.matches >= 3) // Only consider established partnerships
          .sort((a, b) => b.winRate - a.winRate)
          .slice(0, 5); // Show top 5

        // Get worst partners (to avoid) - partnerships with poor records
        const worstPartners = Array.from(partnershipMap.entries())
          .map(([partner, stat]) => ({
            partner,
            winRate: Math.round((stat.wins / stat.total) * 100),
            matches: stat.total
          }))
          .filter(p => p.matches >= 2 && p.winRate < 50) // Poor records with 2+ matches
          .sort((a, b) => a.winRate - b.winRate)
          .slice(0, 3);

        const recentMatches = Math.min(5, matchResults.length);
        const recentWins = matchResults.slice(-recentMatches).filter(w => w).length;
        const recentForm = recentMatches > 0 ? `${recentWins}-${recentMatches - recentWins} (${recentMatches} matches)` : 'No recent matches';
        const recentWinRate = recentMatches > 0 ? Math.round((recentWins / recentMatches) * 100) : 0;

        // Calculate form trend
        const formTrendPercentage = recentWinRate - winRate;
        const formTrend: 'hot' | 'stable' | 'slump' = 
          formTrendPercentage > 15 ? 'hot' :
          formTrendPercentage < -15 ? 'slump' :
          'stable';

        // Get last match date
        const lastMatch = playerMatches[0];
        const lastMatchDate = lastMatch?.match_date || null;

        // Count matches in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const matchesLastMonth = playerMatches.filter(m => {
          const matchDate = new Date(m.match_date);
          return matchDate >= thirtyDaysAgo;
        }).length;

        // Calculate skill trend (comparing first half vs second half of matches)
        const midpoint = Math.floor(playerMatches.length / 2);
        const firstHalfResults = matchResults.slice(0, midpoint);
        const secondHalfResults = matchResults.slice(midpoint);
        const firstHalfWR = firstHalfResults.length > 0 ? (firstHalfResults.filter(w => w).length / firstHalfResults.length) * 100 : 0;
        const secondHalfWR = secondHalfResults.length > 0 ? (secondHalfResults.filter(w => w).length / secondHalfResults.length) * 100 : 0;
        const skillTrendDirection: 'up' | 'stable' | 'down' = 
          secondHalfWR > firstHalfWR + 10 ? 'up' :
          secondHalfWR < firstHalfWR - 10 ? 'down' :
          'stable';

        // Determine partnership quality
        const avgPartnershipWR = bestPartners.length > 0 
          ? bestPartners.reduce((sum, p) => sum + p.winRate, 0) / bestPartners.length
          : 0;
        const partnershipQuality: 'proven' | 'good' | 'developing' | 'poor' = 
          bestPartners.some(p => p.winRate >= 80) ? 'proven' :
          avgPartnershipWR >= 60 ? 'good' :
          avgPartnershipWR >= 40 ? 'developing' :
          'poor';

        // Build recent matches list
        const recentMatchList = playerMatches.slice(0, 3).map(match => {
          const isTeam1 = match.team1_player1 === profile.full_name || match.team1_player2 === profile.full_name;
          const won = (isTeam1 && match.winner === 'team1') || (!isTeam1 && match.winner === 'team2');
          const partner = isTeam1 
            ? (match.team1_player1 === profile.full_name ? match.team1_player2 : match.team1_player1)
            : (match.team2_player1 === profile.full_name ? match.team2_player2 : match.team2_player1);
          const opponent = isTeam1
            ? `${match.team2_player1} & ${match.team2_player2}`
            : `${match.team1_player1} & ${match.team1_player2}`;
          const score = isTeam1 ? `${match.team1_score}-${match.team2_score}` : `${match.team2_score}-${match.team1_score}`;
          
          return {
            date: match.match_date,
            opponent,
            won,
            score
          };
        });

        stats.push({
          id: profile.id,
          name: profile.full_name,
          winRate: Math.round(winRate),
          totalMatches: playerMatches.length,
          avgScore: Math.round(avgScore * 10) / 10,
          skillLevel: playerMatches.length > 0 
            ? Math.min(Math.round(winRate + (avgScore / 21) * 10), 100)
            : 0,
          bestPartners,
          worstPartners: worstPartners.length > 0 ? worstPartners : undefined,
          recentForm,
          recentWinRate,
          formTrend,
          formTrendPercentage,
          lastMatchDate,
          matchesLastMonth,
          skillTrendDirection,
          partnershipQuality,
          recentMatches: recentMatchList
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
          tournamentType,
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

  function getFormTrendIcon(trend?: string) {
    switch (trend) {
      case 'hot': return <Flame className="w-4 h-4 text-red-500" />;
      case 'slump': return <TrendingDown className="w-4 h-4 text-orange-500" />;
      default: return <TrendingUp className="w-4 h-4 text-blue-500" />;
    }
  }

  function getFormTrendLabel(trend?: string) {
    switch (trend) {
      case 'hot': return 'Dalam Kondisi Bagus 🔥';
      case 'slump': return 'Sedang Menurun';
      default: return 'Stabil';
    }
  }

  function getPartnershipQualityColor(quality?: string) {
    switch (quality) {
      case 'proven': return 'border-green-300 bg-green-50 dark:bg-green-500/10';
      case 'good': return 'border-yellow-300 bg-yellow-50 dark:bg-yellow-500/10';
      case 'developing': return 'border-blue-300 bg-blue-50 dark:bg-blue-500/10';
      default: return 'border-red-300 bg-red-50 dark:bg-red-500/10';
    }
  }

  function toggleFilterChip(filterName: string) {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(filterName)) {
      newFilters.delete(filterName);
    } else {
      newFilters.add(filterName);
    }
    setActiveFilters(newFilters);
  }

  function getFilteredPlayers(): PlayerStat[] {
    if (activeFilters.size === 0) {
      return playerStats;
    }

    // Group filters by category
    const formFilters = new Set(['hot', 'slump', 'stable']);
    const skillFilters = new Set(['high-skill', 'balanced-skill', 'low-skill']);
    const partnershipFilters = new Set(['proven-pairs', 'good-pairs', 'developing-pairs']);

    const activeFormFilters = new Set([...activeFilters].filter(f => formFilters.has(f)));
    const activeSkillFilters = new Set([...activeFilters].filter(f => skillFilters.has(f)));
    const activePartnershipFilters = new Set([...activeFilters].filter(f => partnershipFilters.has(f)));

    let filtered = playerStats.filter(p => {
      // Form filters (OR logic): if any form filter selected, must match at least one
      if (activeFormFilters.size > 0) {
        const formMatch = 
          (activeFormFilters.has('hot') && p.formTrend === 'hot') ||
          (activeFormFilters.has('slump') && p.formTrend === 'slump') ||
          (activeFormFilters.has('stable') && p.formTrend === 'stable');
        if (!formMatch) return false;
      }

      // Skill filters (OR logic): if any skill filter selected, must match at least one
      if (activeSkillFilters.size > 0) {
        const skillMatch =
          (activeSkillFilters.has('high-skill') && p.skillLevel >= 65) ||
          (activeSkillFilters.has('balanced-skill') && p.skillLevel >= 35 && p.skillLevel < 65) ||
          (activeSkillFilters.has('low-skill') && p.skillLevel < 35);
        if (!skillMatch) return false;
      }

      // Partnership filters (OR logic): if any partnership filter selected, must match at least one
      if (activePartnershipFilters.size > 0) {
        const partnershipMatch =
          (activePartnershipFilters.has('proven-pairs') && p.partnershipQuality === 'proven') ||
          (activePartnershipFilters.has('good-pairs') && p.partnershipQuality === 'good') ||
          (activePartnershipFilters.has('developing-pairs') && p.partnershipQuality === 'developing');
        if (!partnershipMatch) return false;
      }

      return true;
    });

    return filtered;
  }

  function autoScanForTournament() {
    let selected: PlayerStat[] = [];

    if (tournamentType === 'internal') {
      // Internal: Pick balanced mix with good form + chemistry
      const hotPlayers = playerStats.filter(p => p.formTrend === 'hot').slice(0, 3);
      const provenChemistry = playerStats.filter(p => p.partnershipQuality === 'proven').slice(0, 3);
      const consistent = playerStats.filter(p => p.formTrend === 'stable' && p.skillLevel >= 50).slice(0, 3);
      
      selected = [
        ...hotPlayers,
        ...provenChemistry.filter(p => !hotPlayers.includes(p)),
        ...consistent.filter(p => !hotPlayers.includes(p) && !provenChemistry.includes(p))
      ].slice(0, 8);
    } else {
      // External: Pick strongest players + best form + proven partnerships
      const topSkill = playerStats.filter(p => p.skillLevel >= 70).slice(0, 4);
      const hotPlayers = playerStats.filter(p => p.formTrend === 'hot').slice(0, 2);
      const provenChemistry = playerStats.filter(p => p.partnershipQuality === 'proven').slice(0, 2);

      selected = [
        ...topSkill,
        ...hotPlayers.filter(p => !topSkill.includes(p)),
        ...provenChemistry.filter(p => !topSkill.includes(p) && !hotPlayers.includes(p))
      ].slice(0, 8);
    }

    if (selected.length < 4) {
      selected = playerStats.slice(0, Math.min(8, playerStats.length));
    }

    const selectedNames = selected.map(p => p.name);
    setSelectedPlayers(selectedNames);
    return selectedNames;
  }

  function generateRiskAnalysis() {
    const selectedStats = playerStats.filter(p => selectedPlayers.includes(p.name));
    const risks: string[] = [];

    // Check for players in slump
    const slumpPlayers = selectedStats.filter(p => p.formTrend === 'slump');
    if (slumpPlayers.length > 0) {
      risks.push(`⚠️ ${slumpPlayers.length} pemain sedang dalam kondisi menurun (${slumpPlayers.map(p => p.name).join(', ')})`);
    }

    // Check for poor partnerships
    const poorPartnerships = selectedStats.filter(p => p.partnershipQuality === 'poor');
    if (poorPartnerships.length > 0) {
      risks.push(`⚠️ ${poorPartnerships.length} pemain memiliki sejarah partnership yang kurang baik`);
    }

    // Check for players with worst partners overlap
    for (const player of selectedStats) {
      if (player.worstPartners) {
        const overlap = player.worstPartners.filter(wp => selectedStats.some(p => p.name === wp.partner));
        if (overlap.length > 0) {
          risks.push(`⚠️ ${player.name} memiliki win rate rendah (<40%) dengan ${overlap.map(o => o.partner).join(', ')}`);
        }
      }
    }

    return risks;
  }

  function getPartnershipSuggestions() {
    // Get all proven partnerships from selected or high-skill players
    const topPlayers = playerStats.filter(p => p.skillLevel >= 60 || p.formTrend === 'hot').slice(0, 6);
    const partnerships: { player1: string; player2: string; winRate: number; matches: number }[] = [];

    for (const player of topPlayers) {
      if (player.bestPartners && player.bestPartners.length > 0) {
        const top3 = player.bestPartners.slice(0, 3);
        for (const partner of top3) {
          // Check if partner is in playerStats
          if (playerStats.some(p => p.name === partner.partner)) {
            partnerships.push({
              player1: player.name,
              player2: partner.partner,
              winRate: partner.winRate,
              matches: partner.matches
            });
          }
        }
      }
    }

    // Sort by win rate and remove duplicates
    return partnerships
      .sort((a, b) => b.winRate - a.winRate)
      .filter((p, idx, arr) => 
        idx === arr.findIndex(x => 
          (x.player1 === p.player1 && x.player2 === p.player2) ||
          (x.player1 === p.player2 && x.player2 === p.player1)
        )
      )
      .slice(0, 5);
  }

  function selectPartnership(player1: string, player2: string) {
    const newSelected = new Set(selectedPlayers);
    newSelected.add(player1);
    newSelected.add(player2);
    setSelectedPlayers(Array.from(newSelected));
  }

  async function quickSetup() {
    // Auto-scan players based on tournament type
    autoScanForTournament();
    
    // Wait a moment for state update, then generate
    setTimeout(async () => {
      const autoScannedPlayers = autoScanForTournament();
      const selectedStats = playerStats.filter(p => autoScannedPlayers.includes(p.name));
      
      if (selectedStats.length < 4) {
        alert('Tidak cukup pemain untuk quick setup. Minimal 4 pemain diperlukan.');
        return;
      }

      setAnalyzing(true);
      try {
        const response = await fetch('/api/ai/team-optimizer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerStats: selectedStats,
            mode,
            numTeams,
            tournamentType,
            userId: user?.id,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.details || data.error || 'Failed to generate teams');
        }

        setResult(data);
        setQuickSetupMode(false);
      } catch (error: any) {
        console.error('Failed to generate teams:', error);
        alert(`Error: ${error.message}`);
      } finally {
        setAnalyzing(false);
      }
    }, 100);
  }

  function saveTemplate() {
    const templateName = prompt('Masukkan nama template (contoh: "Monthly Tournament")');
    if (templateName) {
      setSavedTemplates([...savedTemplates, { name: templateName, type: tournamentType, mode }]);
      alert(`Template "${templateName}" tersimpan!`);
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
          {/* Quick Setup Toggle - TIER 3E */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border-2 border-blue-300 dark:border-blue-500/30">
            <input
              type="checkbox"
              checked={quickSetupMode}
              onChange={(e) => setQuickSetupMode(e.target.checked)}
              className="w-5 h-5 rounded cursor-pointer"
            />
            <label className="cursor-pointer flex-1">
              <div className="font-bold text-gray-900 dark:text-white">⚡ Quick Setup Mode (2-Click Turnamen)</div>
              <div className="text-sm text-gray-600 dark:text-zinc-400">Pilih tipe → Auto-scan → Generate selesai! Sempurna untuk turnamen rutin.</div>
            </label>
          </div>

          {quickSetupMode ? (
            <>
              {/* Quick Setup Interface */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">⚡ Pengaturan Cepat Turnamen</h2>

                {/* Tournament Type Selection */}
                <div className="border-2 border-blue-300 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/5 rounded-lg p-4 space-y-3">
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                    🎯 Tipe Turnamen
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">Pilih tujuan utama:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => setTournamentType('internal')}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        tournamentType === 'internal'
                          ? 'border-blue-500 bg-blue-100 dark:bg-blue-500/20'
                          : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:border-blue-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">⚖️</div>
                      <div className="font-bold text-gray-900 dark:text-white">Kompetisi Adil</div>
                      <div className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Seimbang & seru</div>
                    </button>
                    <button
                      onClick={() => setTournamentType('external')}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        tournamentType === 'external'
                          ? 'border-blue-500 bg-blue-100 dark:bg-blue-500/20'
                          : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:border-blue-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">🏆</div>
                      <div className="font-bold text-gray-900 dark:text-white">Menang Maksimal</div>
                      <div className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Strategi kompetitif</div>
                    </button>
                  </div>
                </div>

                {/* Auto Generate Button */}
                <button
                  onClick={quickSetup}
                  disabled={analyzing || playerStats.length < 4}
                  className="w-full py-4 bg-linear-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-zinc-700 dark:disabled:to-zinc-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed text-lg border-2 border-transparent hover:border-blue-400 shadow-sm"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Sedang Memproses...
                    </>
                  ) : playerStats.length < 4 ? (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      Data Kurang (Min 4 Pemain)
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      ⚡ Setup Otomatis & Generate Tim
                    </>
                  )}
                </button>

                {/* Saved Templates - TIER 3E */}
                {savedTemplates.length > 0 && (
                  <div className="border-2 border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/5 rounded-lg p-4 space-y-3">
                    <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300">💾 Template Tersimpan</h3>
                    <div className="space-y-2">
                      {savedTemplates.map((template, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setTournamentType(template.type);
                            setMode(template.mode as any);
                          }}
                          className="w-full p-3 bg-white dark:bg-zinc-800 rounded-lg border border-purple-200 dark:border-purple-500/30 hover:border-purple-400 transition-all text-left"
                        >
                          <div className="font-semibold text-gray-900 dark:text-white">{template.name}</div>
                          <div className="text-xs text-gray-600 dark:text-zinc-400">
                            {template.type === 'internal' ? '⚖️ Kompetisi Adil' : '🏆 Menang Maksimal'} • {template.mode}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setQuickSetupMode(false)}
                  className="w-full py-2 text-center text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors font-semibold"
                >
                  ← Kembali ke Setup Detail
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Detailed Setup Interface */}
          <div className="border-2 border-blue-300 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/5 rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
              🎯 Tipe Turnamen
            </h2>
            <p className="text-sm text-blue-700 dark:text-blue-400">Pilih tujuan utama tim Anda:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setTournamentType('internal')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  tournamentType === 'internal'
                    ? 'border-blue-500 bg-blue-100 dark:bg-blue-500/20'
                    : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:border-blue-400'
                }`}
              >
                <div className="text-2xl mb-1">⚖️</div>
                <div className="font-bold text-gray-900 dark:text-white">Turnamen Internal</div>
                <div className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Buat kompetisi adil & seimbang untuk anggota komunitas</div>
              </button>
              <button
                onClick={() => setTournamentType('external')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  tournamentType === 'external'
                    ? 'border-blue-500 bg-blue-100 dark:bg-blue-500/20'
                    : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:border-blue-400'
                }`}
              >
                <div className="text-2xl mb-1">🏆</div>
                <div className="font-bold text-gray-900 dark:text-white">Turnamen External</div>
                <div className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Maksimalkan peluang menang dengan strategi kompetitif</div>
              </button>
            </div>
          </div>

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

          {/* Smart Partnership Suggestions - TIER 2D */}
          {getPartnershipSuggestions().length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-green-50 dark:from-purple-900/20 dark:to-green-900/20 border-2 border-purple-300 dark:border-purple-500/30 rounded-xl p-6 space-y-4 transition-colors duration-300">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                💡 Partnership Saran Cerdas
              </h3>
              <p className="text-sm text-gray-700 dark:text-zinc-300">Pasangan-pasangan terbukti dengan chemistry menarik. Klik untuk menambahkan:</p>
              <div className="space-y-2">
                {getPartnershipSuggestions().map((partnership, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectPartnership(partnership.player1, partnership.player2)}
                    className="w-full p-4 rounded-lg border-2 border-purple-300 dark:border-purple-500/50 bg-white dark:bg-zinc-800 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all flex items-center justify-between group"
                  >
                    <div className="text-left">
                      <div className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {partnership.player1} ↔️ {partnership.player2}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                        {partnership.winRate}% win rate • {partnership.matches} pertandingan bersama
                      </div>
                    </div>
                    <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      + Tambah
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Player Selection with Advanced Filtering - PHASE 2 */}
          <div className="team-optimizer-player-select space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
                Langkah 2: Pilih Pemain (Minimal 4 orang)
              </h2>
              <button
                onClick={autoScanForTournament}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg border-2 border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all shadow-sm"
                title="Auto-scan pemain berdasarkan tipe turnamen"
              >
                <Sparkles className="w-4 h-4" />
                Auto-Scan ({tournamentType === 'internal' ? 'Balanced' : 'Win-Focused'})
              </button>
            </div>

            {/* Smart Filter Chips - PHASE 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                <span className="text-sm font-semibold text-gray-600 dark:text-zinc-400">Smart Filter (OR logic per group):</span>
              </div>
              
              {/* Form Filters */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 dark:text-zinc-500">FORM KONDISI:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'hot', label: '🔥 Hot Form', desc: 'Win rate naik' },
                    { id: 'stable', label: '📊 Stabil', desc: 'Konsisten' },
                    { id: 'slump', label: '⚠️ Slump', desc: 'Win rate turun' }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => toggleFilterChip(filter.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                        activeFilters.has(filter.id)
                          ? 'border-purple-500 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                          : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:border-gray-400'
                      }`}
                      title={filter.desc}
                    >
                      {filter.label}
                      {activeFilters.has(filter.id) && <X className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partnership Filters */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 dark:text-zinc-500">PARTNERSHIP KUALITAS:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'proven-pairs', label: '⭐ Proven (80%+)', desc: 'Proven partnership' },
                    { id: 'good-pairs', label: '✓ Good (60-79%)', desc: 'Established' },
                    { id: 'developing-pairs', label: '🔄 Developing', desc: 'Growing' }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => toggleFilterChip(filter.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                        activeFilters.has(filter.id)
                          ? 'border-green-500 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300'
                          : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:border-gray-400'
                      }`}
                      title={filter.desc}
                    >
                      {filter.label}
                      {activeFilters.has(filter.id) && <X className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skill Filters */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 dark:text-zinc-500">SKILL LEVEL:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'high-skill', label: '🏆 High Skill', desc: '>65 level' },
                    { id: 'balanced-skill', label: '⚖️ Mid Skill', desc: '35-65 level' },
                    { id: 'low-skill', label: '📚 Low Skill', desc: '<35 level' }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => toggleFilterChip(filter.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                        activeFilters.has(filter.id)
                          ? 'border-blue-500 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:border-gray-400'
                      }`}
                      title={filter.desc}
                    >
                      {filter.label}
                      {activeFilters.has(filter.id) && <X className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
              
              {activeFilters.size > 0 && (
                <button
                  onClick={() => setActiveFilters(new Set())}
                  className="text-xs font-semibold text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Bersihkan semua filter
                </button>
              )}
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
              {getFilteredPlayers().map(player => (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.name)}
                  className={`p-4 rounded-lg border-2 text-left transition-all shadow-sm ${
                    selectedPlayers.includes(player.name)
                      ? 'border-green-500 bg-green-100 dark:bg-green-500/10'
                      : 'border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:border-gray-400 dark:hover:border-zinc-600'
                  } ${getPartnershipQualityColor(player.partnershipQuality)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-gray-900 dark:text-white font-bold text-lg transition-colors duration-300">{player.name}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {getFormTrendIcon(player.formTrend)}
                        <span className="text-xs font-semibold text-gray-600 dark:text-zinc-400">{getFormTrendLabel(player.formTrend)}</span>
                      </div>
                    </div>
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
                      <span className="text-gray-600 dark:text-zinc-400 font-semibold transition-colors duration-300">Win Rate:</span>
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
                      <span className="text-gray-900 dark:text-white font-bold transition-colors duration-300">{player.totalMatches} match</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-zinc-400 font-semibold transition-colors duration-300">Chemistry:</span>
                      <span className={`text-xs font-bold rounded px-2 py-0.5 ${
                        player.partnershipQuality === 'proven' ? 'bg-green-200 text-green-700 dark:text-green-400' :
                        player.partnershipQuality === 'good' ? 'bg-yellow-200 text-yellow-700 dark:text-yellow-400' :
                        player.partnershipQuality === 'developing' ? 'bg-blue-200 text-blue-700 dark:text-blue-400' :
                        'bg-red-200 text-red-700 dark:text-red-400'
                      }`}>
                        {player.partnershipQuality === 'proven' ? '⭐ Proven' :
                         player.partnershipQuality === 'good' ? '✓ Good' :
                         player.partnershipQuality === 'developing' ? '🔄 Dev' :
                         '⚠️ Poor'}
                      </span>
                    </div>
                    {player.totalMatches > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-zinc-400 font-semibold transition-colors duration-300">Level:</span>
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
                      </div>
                    )}
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

          {/* Risk Analysis - PHASE 3 */}
          {selectedPlayers.length >= 4 && (
            <div className="bg-amber-50 dark:bg-amber-500/5 border-2 border-amber-300 dark:border-amber-500/30 rounded-xl p-6 space-y-3 transition-colors duration-300">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Analisis Risiko
              </h3>
              {generateRiskAnalysis().length > 0 ? (
                <ul className="space-y-2">
                  {generateRiskAnalysis().map((risk, idx) => (
                    <li key={idx} className="text-sm text-amber-800 dark:text-amber-200 font-medium">{risk}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">✓ Tidak ada risiko terdeteksi! Komposisi tim terlihat bagus.</p>
              )}
            </div>
          )}

          {/* Recent Plays Summary - PHASE 3 */}
          {selectedPlayers.length >= 4 && (
            <div className="grid md:grid-cols-2 gap-4">
              {playerStats.filter(p => selectedPlayers.includes(p.name)).slice(0, 4).map(player => (
                <div key={player.id} className="bg-white dark:bg-zinc-900 rounded-xl p-4 border-2 border-gray-300 dark:border-transparent shadow-sm transition-colors duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-gray-900 dark:text-white">{player.name}</div>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">{player.matchesLastMonth} bulan terakhir</span>
                  </div>
                  {player.recentMatches && player.recentMatches.length > 0 ? (
                    <div className="space-y-2">
                      {player.recentMatches.map((match, idx) => (
                        <div key={idx} className="text-xs bg-gray-50 dark:bg-zinc-800 p-2 rounded border border-gray-200 dark:border-zinc-700 transition-colors duration-300">
                          <div className={`font-semibold ${match.won ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {match.won ? '✓ Menang' : '✗ Kalah'} - {match.score}
                          </div>
                          <div className="text-gray-600 dark:text-zinc-400 truncate">{match.opponent}</div>
                          <div className="text-gray-500 dark:text-zinc-500">{new Date(match.date).toLocaleDateString('id-ID')}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-zinc-400 italic">Belum ada pertandingan terakhir</p>
                  )}
                </div>
              ))}
            </div>
          )}
            </>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="team-optimizer-results space-y-6">
            {/* Tournament Strategy Card - PHASE 3 */}
            <div className={`rounded-xl p-6 border-2 transition-colors duration-300 ${
              tournamentType === 'internal'
                ? 'bg-blue-50 dark:bg-blue-500/5 border-blue-300 dark:border-blue-500/30'
                : 'bg-red-50 dark:bg-red-500/5 border-red-300 dark:border-red-500/30'
            }`}>
              <div className="flex items-start gap-3 mb-3">
                <Award className={`w-5 h-5 ${tournamentType === 'internal' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} />
                <div>
                  <h3 className={`text-lg font-bold ${tournamentType === 'internal' ? 'text-blue-900 dark:text-blue-300' : 'text-red-900 dark:text-red-300'}`}>
                    Strategi Turnamen: {tournamentType === 'internal' ? 'Kompetisi Adil & Seimbang ⚖️' : 'Maksimalkan Kemenangan 🏆'}
                  </h3>
                  <p className={`text-sm mt-2 ${tournamentType === 'internal' ? 'text-blue-800 dark:text-blue-200' : 'text-red-800 dark:text-red-200'}`}>
                    {tournamentType === 'internal'
                      ? 'Tim dirancang untuk kompetisi yang ketat dan adil. Fokus pada chemistry yang terbukti dan balance skill level untuk pertandingan yang menarik.'
                      : 'Tim dioptimalkan untuk menang. Menggunakan pemain top, chemistry proven, dan recent form terbaik untuk peluang kemenangan maksimal.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tournament Insights - PHASE 1C */}
            {result.tournamentInsights && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border-2 border-green-300 dark:border-green-500/30 shadow-sm transition-colors duration-300 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Analisis Turnamen
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-500/10 rounded-lg p-4 border border-green-200 dark:border-green-500/30 transition-colors duration-300">
                    <div className="text-sm font-bold text-green-700 dark:text-green-300 mb-2">✨ Kesesuaian Strategi</div>
                    <div className="text-gray-900 dark:text-white font-semibold">{result.tournamentInsights.strategySuitability}</div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-4 border border-blue-200 dark:border-blue-500/30 transition-colors duration-300">
                    <div className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2">💪 Kekuatan Utama</div>
                    <div className="text-gray-900 dark:text-white font-semibold">{result.tournamentInsights.keyStrengths}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">🎯 Kekuatan Area:</div>
                    <div className="flex flex-wrap gap-2">
                      {result.tournamentInsights.strengthAreas.map((area, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  {result.tournamentInsights.riskAreas.length > 0 && (
                    <div>
                      <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">⚠️ Area Risiko:</div>
                      <div className="flex flex-wrap gap-2">
                        {result.tournamentInsights.riskAreas.map((area, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full text-sm font-semibold">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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
