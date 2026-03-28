import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ─── Types ────────────────────────────────────────────────────────────────
export interface MatchResult {
  matchId: string;
  matchDate: string;
  isWinner: boolean;
  teamScore: number;
  opponentScore: number;
  partner: string | null;
  opponents: { player1: string; player2: string };
}

export interface PartnerStats {
  name: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  chemistry: number; // 0-100 (0=avoid, 100=perfect)
}

export interface OpponentStats {
  name: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  difficulty: 'easy' | 'medium' | 'hard'; // Based on WR against them
}

export interface StreakInfo {
  type: 'win' | 'loss' | 'none';
  count: number;
  startDate: string;
  endDate: string;
}

export interface PerformanceTrend {
  period: string; // "Last 7 days", "Last month", "Last 3 months"
  winRate: number;
  trend: 'improving' | 'declining' | 'stable';
  changePercent: number;
}

export interface MatchAnalyticsResult {
  memberName: string;
  totalMatches: number;
  overallStats: {
    wins: number;
    losses: number;
    winRate: number;
    averageScore: number;
    averageScoreAgainst: number;
  };
  currentStreak: StreakInfo;
  longestWinStreak: StreakInfo;
  longestLossStreak: StreakInfo;
  partnerStats: PartnerStats[];
  opponentStats: OpponentStats[];
  performanceTrends: PerformanceTrend[];
  recentForm: ('W' | 'L')[];
  weakAreas: {
    type: string;
    pattern: string;
    severity: 'critical' | 'moderate' | 'minor';
    affectedMatches: number;
    winRateInArea: number;
  }[];
  strengths: {
    type: string;
    pattern: string;
    affectedMatches: number;
    winRateInArea: number;
  }[];
  lastUpdated: string;
}

// ─── Main Analytics Function ──────────────────────────────────────────────
export async function analyzeMatchHistory(memberName?: string, userId?: string): Promise<MatchAnalyticsResult> {
  try {
    let actualMemberName = memberName;
    let possibleNames: string[] = [];

    // If userId provided, try to get the actual name from profiles table
    if (userId && !memberName) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, full_name, username')
          .eq('id', userId)
          .single();

        if (profile) {
          // Collect possible names (display, full, username, first name from full)
          if (profile.display_name) possibleNames.push(profile.display_name);
          if (profile.full_name) {
            possibleNames.push(profile.full_name);
            // Also try first name from full_name
            const firstName = profile.full_name.split(' ')[0];
            if (firstName) possibleNames.push(firstName);
          }
          if (profile.username) possibleNames.push(profile.username);
          
          actualMemberName = profile.display_name || profile.full_name || profile.username;
          console.log('[matchAnalytics] Looked up profile, possible names:', possibleNames);
        }
      } catch (error) {
        console.error('[matchAnalytics] Error looking up profile:', error);
      }
    } else if (memberName) {
      // If memberName provided, also add first name variant
      possibleNames.push(memberName);
      const firstName = memberName.split(' ')[0];
      if (firstName && firstName !== memberName) {
        possibleNames.push(firstName);
      }
    }

    if (!actualMemberName) {
      throw new Error('Member name not provided and could not be looked up');
    }

    // Normalize member name for flexible matching
    const normalizedMemberName = actualMemberName.trim();
    const memberNameLower = normalizedMemberName.toLowerCase();
    const possibleNamesLower = possibleNames.map(n => n.trim().toLowerCase()).filter(n => n);
    console.log('[matchAnalytics] Analyzing history for:', normalizedMemberName);
    console.log('[matchAnalytics] Possible names:', possibleNamesLower);

    // Fetch all matches with 2v2 format
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .not('team1_player1', 'is', null)
      .not('team1_player2', 'is', null)
      .not('team2_player1', 'is', null)
      .not('team2_player2', 'is', null)
      .order('match_date', { ascending: false });

    if (error || !matches) {
      throw new Error(`Failed to fetch matches: ${error?.message}`);
    }

    console.log('[matchAnalytics] Total matches in database:', matches.length);
    
    // Debug: Log unique player names in database
    const playerNames = new Set<string>();
    matches.forEach((m: any) => {
      if (m.team1_player1) playerNames.add(m.team1_player1);
      if (m.team1_player2) playerNames.add(m.team1_player2);
      if (m.team2_player1) playerNames.add(m.team2_player1);
      if (m.team2_player2) playerNames.add(m.team2_player2);
    });
    console.log('[matchAnalytics] Unique player names in database:', Array.from(playerNames).slice(0, 20));
    console.log('[matchAnalytics] Looking for possible names (lowercase):', possibleNamesLower);

    // Filter matches for this member - case insensitive, checking all possible names
    const memberMatches: MatchResult[] = [];
    matches.forEach((match: any) => {
      let memberTeam: 'team1' | 'team2' | null = null;
      let partner: string | null = null;
      let isWinner = false;

      // Normalize database names for comparison
      const team1Player1Lower = match.team1_player1?.trim().toLowerCase() || '';
      const team1Player2Lower = match.team1_player2?.trim().toLowerCase() || '';
      const team2Player1Lower = match.team2_player1?.trim().toLowerCase() || '';
      const team2Player2Lower = match.team2_player2?.trim().toLowerCase() || '';

      // Check if any of the possible names match
      const matchesTeam1 = possibleNamesLower.includes(team1Player1Lower) || possibleNamesLower.includes(team1Player2Lower);
      const matchesTeam2 = possibleNamesLower.includes(team2Player1Lower) || possibleNamesLower.includes(team2Player2Lower);

      // Determine team membership (case-insensitive, using all possible names)
      if (matchesTeam1) {
        memberTeam = 'team1';
        partner = possibleNamesLower.includes(team1Player1Lower) ? match.team1_player2 : match.team1_player1;
        isWinner = match.winner === 'team1';
      } else if (matchesTeam2) {
        memberTeam = 'team2';
        partner = possibleNamesLower.includes(team2Player1Lower) ? match.team2_player2 : match.team2_player1;
        isWinner = match.winner === 'team2';
      }

      // Only include matches where member participated
      if (memberTeam) {
        const teamScore = memberTeam === 'team1' ? (match.team1_score || 0) : (match.team2_score || 0);
        const opponentScore = memberTeam === 'team1' ? (match.team2_score || 0) : (match.team1_score || 0);
        const opponents = memberTeam === 'team1'
          ? { player1: match.team2_player1, player2: match.team2_player2 }
          : { player1: match.team1_player1, player2: match.team1_player2 };

        memberMatches.push({
          matchId: match.id,
          matchDate: match.match_date || match.created_at,
          isWinner,
          teamScore,
          opponentScore,
          partner,
          opponents,
        });
      }
    });

    console.log('[matchAnalytics] Found matches for member:', memberMatches.length);

    if (memberMatches.length === 0) {
      console.log('[matchAnalytics] No matches found, returning empty analytics');
      console.log('[matchAnalytics] DEBUG - memberNameLower:', memberNameLower, '| playerNames sample:', Array.from(playerNames).slice(0, 5));
      return getEmptyAnalytics(normalizedMemberName);
    }

    // Sort by date (oldest first for streaks)
    const sortedMatches = [...memberMatches].sort((a, b) =>
      new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
    );

    // Calculate statistics
    const stats = calculateOverallStats(sortedMatches);
    const currentStreak = calculateCurrentStreak(sortedMatches);
    const longestWinStreak = calculateLongestStreak(sortedMatches, 'win');
    const longestLossStreak = calculateLongestStreak(sortedMatches, 'loss');
    const partnerStats = calculatePartnerStats(sortedMatches);
    const opponentStats = calculateOpponentStats(sortedMatches);
    const performanceTrends = calculatePerformanceTrends(sortedMatches);
    const recentForm = getRecentForm(sortedMatches.reverse(), 10);
    const weakAreas = identifyWeakAreas(sortedMatches);
    const strengths = identifyStrengths(sortedMatches);

    return {
      memberName: normalizedMemberName,
      totalMatches: memberMatches.length,
      overallStats: stats,
      currentStreak,
      longestWinStreak,
      longestLossStreak,
      partnerStats,
      opponentStats,
      performanceTrends,
      recentForm,
      weakAreas,
      strengths,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[matchAnalytics] Error:', error);
    throw error;
  }
}

// ─── Helper Functions ─────────────────────────────────────────────────────

function getEmptyAnalytics(memberName: string): MatchAnalyticsResult {
  return {
    memberName,
    totalMatches: 0,
    overallStats: {
      wins: 0,
      losses: 0,
      winRate: 0,
      averageScore: 0,
      averageScoreAgainst: 0,
    },
    currentStreak: { type: 'none', count: 0, startDate: '', endDate: '' },
    longestWinStreak: { type: 'none', count: 0, startDate: '', endDate: '' },
    longestLossStreak: { type: 'none', count: 0, startDate: '', endDate: '' },
    partnerStats: [],
    opponentStats: [],
    performanceTrends: [],
    recentForm: [],
    weakAreas: [],
    strengths: [],
    lastUpdated: new Date().toISOString(),
  };
}

function calculateOverallStats(matches: MatchResult[]) {
  const wins = matches.filter(m => m.isWinner).length;
  const losses = matches.filter(m => !m.isWinner).length;
  const totalScore = matches.reduce((sum, m) => sum + m.teamScore, 0);
  const totalScoreAgainst = matches.reduce((sum, m) => sum + m.opponentScore, 0);

  return {
    wins,
    losses,
    winRate: matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0,
    averageScore: matches.length > 0 ? Math.round((totalScore / matches.length) * 10) / 10 : 0,
    averageScoreAgainst: matches.length > 0 ? Math.round((totalScoreAgainst / matches.length) * 10) / 10 : 0,
  };
}

function calculateCurrentStreak(matches: MatchResult[]): StreakInfo {
  if (matches.length === 0) {
    return { type: 'none', count: 0, startDate: '', endDate: '' };
  }

  const recent = matches[matches.length - 1];
  const streakType = recent.isWinner ? 'win' : 'loss';
  let count = 1;
  let startIndex = matches.length - 1;

  for (let i = matches.length - 2; i >= 0; i--) {
    if ((streakType === 'win' && matches[i].isWinner) || (streakType === 'loss' && !matches[i].isWinner)) {
      count++;
      startIndex = i;
    } else {
      break;
    }
  }

  return {
    type: streakType,
    count,
    startDate: matches[startIndex].matchDate,
    endDate: recent.matchDate,
  };
}

function calculateLongestStreak(matches: MatchResult[], type: 'win' | 'loss'): StreakInfo {
  if (matches.length === 0) {
    return { type: 'none', count: 0, startDate: '', endDate: '' };
  }

  let maxCount = 0;
  let maxStartIndex = 0;
  let maxEndIndex = 0;
  let currentCount = 0;
  let currentStartIndex = 0;

  matches.forEach((match, index) => {
    const isMatchType = type === 'win' ? match.isWinner : !match.isWinner;

    if (isMatchType) {
      if (currentCount === 0) {
        currentStartIndex = index;
      }
      currentCount++;

      if (currentCount > maxCount) {
        maxCount = currentCount;
        maxStartIndex = currentStartIndex;
        maxEndIndex = index;
      }
    } else {
      currentCount = 0;
    }
  });

  return {
    type,
    count: maxCount,
    startDate: matches[maxStartIndex]?.matchDate || '',
    endDate: matches[maxEndIndex]?.matchDate || '',
  };
}

function calculatePartnerStats(matches: MatchResult[]): PartnerStats[] {
  const partnerMap = new Map<string, { wins: number; losses: number }>();

  matches.forEach(match => {
    if (match.partner) {
      if (!partnerMap.has(match.partner)) {
        partnerMap.set(match.partner, { wins: 0, losses: 0 });
      }
      const stats = partnerMap.get(match.partner)!;
      if (match.isWinner) {
        stats.wins++;
      } else {
        stats.losses++;
      }
    }
  });

  return Array.from(partnerMap.entries())
    .map(([name, stats]) => {
      const total = stats.wins + stats.losses;
      const winRate = Math.round((stats.wins / total) * 100);
      return {
        name,
        totalMatches: total,
        wins: stats.wins,
        losses: stats.losses,
        winRate,
        chemistry: Math.min(100, Math.max(0, winRate - 30)), // 0-100 scale
      };
    })
    .sort((a, b) => b.winRate - a.winRate);
}

function calculateOpponentStats(matches: MatchResult[]): OpponentStats[] {
  const opponentMap = new Map<string, { wins: number; losses: number }>();

  matches.forEach(match => {
    [match.opponents.player1, match.opponents.player2].forEach(opponent => {
      if (!opponentMap.has(opponent)) {
        opponentMap.set(opponent, { wins: 0, losses: 0 });
      }
      const stats = opponentMap.get(opponent)!;
      // Record: wins against this opponent, losses against this opponent
      if (match.isWinner) {
        stats.wins++;
      } else {
        stats.losses++;
      }
    });
  });

  return Array.from(opponentMap.entries())
    .map(([name, stats]) => {
      const total = stats.wins + stats.losses;
      const winRate = Math.round((stats.wins / total) * 100);
      let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
      if (winRate >= 70) difficulty = 'easy';
      else if (winRate <= 30) difficulty = 'hard';

      return {
        name,
        totalMatches: total,
        wins: stats.wins,
        losses: stats.losses,
        winRate,
        difficulty,
      };
    })
    .sort((a, b) => a.winRate - b.winRate); // Sort: hardest first
}

function calculatePerformanceTrends(matches: MatchResult[]): PerformanceTrend[] {
  const periods = [
    { name: 'Last 7 days', days: 7 },
    { name: 'Last 30 days', days: 30 },
    { name: 'Last 3 months', days: 90 },
  ];

  const now = new Date();
  const allTimeWinRate = matches.length > 0
    ? Math.round((matches.filter(m => m.isWinner).length / matches.length) * 100)
    : 0;

  return periods.map(period => {
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - period.days);

    const periodMatches = matches.filter(
      m => new Date(m.matchDate) >= cutoffDate
    );

    if (periodMatches.length === 0) {
      return {
        period: period.name,
        winRate: 0,
        trend: 'stable',
        changePercent: 0,
      };
    }

    const periodWinRate = Math.round(
      (periodMatches.filter(m => m.isWinner).length / periodMatches.length) * 100
    );

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    const changePercent = periodWinRate - allTimeWinRate;

    if (changePercent > 5) trend = 'improving';
    else if (changePercent < -5) trend = 'declining';

    return {
      period: period.name,
      winRate: periodWinRate,
      trend,
      changePercent,
    };
  });
}

function getRecentForm(matches: MatchResult[], limit: number): ('W' | 'L')[] {
  return matches.slice(0, limit).map(m => (m.isWinner ? 'W' : 'L'));
}

function identifyWeakAreas(matches: MatchResult[]) {
  const weakAreas: any[] = [];

  // Weak vs specific opponent type
  const hardOpponents = calculateOpponentStats(matches)
    .filter(o => o.difficulty === 'hard')
    .slice(0, 2);

  hardOpponents.forEach(opponent => {
    const versionMatches = matches.filter(
      m => m.opponents.player1 === opponent.name || m.opponents.player2 === opponent.name
    );
    const wins = versionMatches.filter(m => m.isWinner).length;

    weakAreas.push({
      type: 'opponent_specific',
      pattern: `Struggle against ${opponent.name} (${opponent.winRate}% WR)`,
      severity: opponent.winRate <= 20 ? 'critical' : 'moderate',
      affectedMatches: versionMatches.length,
      winRateInArea: opponent.winRate,
    });
  });

  // Recent losing streak
  const recentStreak = calculateCurrentStreak(matches);
  if (recentStreak.type === 'loss' && recentStreak.count >= 3) {
    weakAreas.push({
      type: 'mental_resilience',
      pattern: `${recentStreak.count}-match losing streak (needs recovery)`,
      severity: 'critical',
      affectedMatches: recentStreak.count,
      winRateInArea: 0,
    });
  }

  return weakAreas.slice(0, 3); // Top 3 weak areas
}

function identifyStrengths(matches: MatchResult[]) {
  const strengths: any[] = [];

  // Best partner
  const partners = calculatePartnerStats(matches);
  if (partners.length > 0) {
    const bestPartner = partners[0];
    if (bestPartner.winRate >= 60) {
      strengths.push({
        type: 'partner_chemistry',
        pattern: `Excellent chemistry with ${bestPartner.name} (${bestPartner.winRate}% WR)`,
        affectedMatches: bestPartner.totalMatches,
        winRateInArea: bestPartner.winRate,
      });
    }
  }

  // Winning streak
  const winStreak = calculateLongestStreak(matches, 'win');
  if (winStreak.count >= 3) {
    strengths.push({
      type: 'consistency',
      pattern: `Achieved ${winStreak.count}-match winning streak`,
      affectedMatches: winStreak.count,
      winRateInArea: 100,
    });
  }

  // Overall performance
  const overallStats = calculateOverallStats(matches);
  if (overallStats.winRate >= 55) {
    strengths.push({
      type: 'overall_performance',
      pattern: `Strong overall performance (${overallStats.winRate}% win rate)`,
      affectedMatches: matches.length,
      winRateInArea: overallStats.winRate,
    });
  }

  return strengths;
}
