// AI Performance Analysis Service for DLOB Badminton Club
// Analyzes match performance and generates insights using AI

export interface MatchPerformanceData {
  member_id: string;
  member_name: string;
  match_id: string;
  date: string;
  team: 'team1' | 'team2';
  position: 'player1' | 'player2';
  won: boolean;
  team_score: number;
  opponent_score: number;
  games_played: number;
  partner_id?: string;
  partner_name?: string;
  opponents: Array<{
    id: string;
    name: string;
  }>;
  game_scores: Array<{
    game_number: number;
    team_score: number;
    opponent_score: number;
  }>;
}

export interface PerformanceStats {
  total_matches: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_games: number;
  games_won: number;
  games_lost: number;
  game_win_rate: number;
  average_score_per_game: number;
  favorite_partner?: string;
  strongest_opponents: string[];
  recent_form: 'improving' | 'declining' | 'stable';
}

export interface AIAnalysisResult {
  member_id: string;
  member_name: string;
  overall_rating: number; // 1-10
  performance_trend: 'improving' | 'declining' | 'stable';
  strengths: string[];
  areas_for_improvement: string[];
  recommendations: string[];
  next_match_strategy: string;
  confidence_level: number; // 0-1
}

export class PerformanceAnalysisService {
  /**
   * Calculate basic performance statistics
   */
  static calculateStats(performances: MatchPerformanceData[]): PerformanceStats {
    const totalMatches = performances.length;
    const wins = performances.filter(p => p.won).length;
    const losses = totalMatches - wins;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    const totalGames = performances.reduce((sum, p) => sum + p.games_played, 0);
    const gamesWon = performances.reduce((sum, p) => {
      return sum + p.game_scores.filter(g => g.team_score > g.opponent_score).length;
    }, 0);
    const gamesLost = totalGames - gamesWon;
    const gameWinRate = totalGames > 0 ? (gamesWon / totalGames) * 100 : 0;

    const totalTeamScore = performances.reduce((sum, p) => sum + p.team_score, 0);
    const averageScorePerGame = totalGames > 0 ? totalTeamScore / totalGames : 0;

    // Find favorite partner (most frequent partner)
    const partners: { [key: string]: number } = {};
    performances.forEach(p => {
      if (p.partner_name) {
        partners[p.partner_name] = (partners[p.partner_name] || 0) + 1;
      }
    });
    const favoritePartner = Object.keys(partners).reduce((a, b) => 
      partners[a] > partners[b] ? a : b, ''
    );

    // Find strongest opponents (opponents with highest win rate against this player)
    const opponentStats: { [key: string]: { wins: number; total: number } } = {};
    performances.forEach(p => {
      p.opponents.forEach(opp => {
        if (!opponentStats[opp.name]) {
          opponentStats[opp.name] = { wins: 0, total: 0 };
        }
        opponentStats[opp.name].total++;
        if (!p.won) {
          opponentStats[opp.name].wins++;
        }
      });
    });

    const strongestOpponents = Object.keys(opponentStats)
      .filter(name => opponentStats[name].total >= 3) // At least 3 matches
      .sort((a, b) => {
        const aRate = opponentStats[a].wins / opponentStats[a].total;
        const bRate = opponentStats[b].wins / opponentStats[b].total;
        return bRate - aRate;
      })
      .slice(0, 3);

    // Analyze recent form (last 5 matches)
    const recentMatches = performances.slice(-5);
    const recentWins = recentMatches.filter(p => p.won).length;
    const recentWinRate = recentMatches.length > 0 ? recentWins / recentMatches.length : 0;
    
    let recentForm: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentMatches.length >= 3) {
      const firstHalf = recentMatches.slice(0, Math.floor(recentMatches.length / 2));
      const secondHalf = recentMatches.slice(Math.floor(recentMatches.length / 2));
      
      const firstHalfWinRate = firstHalf.filter(p => p.won).length / firstHalf.length;
      const secondHalfWinRate = secondHalf.filter(p => p.won).length / secondHalf.length;
      
      if (secondHalfWinRate > firstHalfWinRate + 0.2) {
        recentForm = 'improving';
      } else if (secondHalfWinRate < firstHalfWinRate - 0.2) {
        recentForm = 'declining';
      }
    }

    return {
      total_matches: totalMatches,
      wins,
      losses,
      win_rate: winRate,
      total_games: totalGames,
      games_won: gamesWon,
      games_lost: gamesLost,
      game_win_rate: gameWinRate,
      average_score_per_game: averageScorePerGame,
      favorite_partner: favoritePartner || undefined,
      strongest_opponents: strongestOpponents,
      recent_form: recentForm
    };
  }

  /**
   * Generate AI analysis based on performance data
   */
  static async generateAIAnalysis(
    memberName: string,
    stats: PerformanceStats,
    performances: MatchPerformanceData[]
  ): Promise<AIAnalysisResult> {
    // This would typically call the Gemini AI API
    // For now, we'll generate rule-based analysis

    const overallRating = this.calculateOverallRating(stats);
    const strengths = this.identifyStrengths(stats, performances);
    const improvements = this.identifyImprovements(stats, performances);
    const recommendations = this.generateRecommendations(stats, performances);
    const strategy = this.generateStrategy(stats, performances);

    return {
      member_id: performances[0]?.member_id || '',
      member_name: memberName,
      overall_rating: overallRating,
      performance_trend: stats.recent_form,
      strengths,
      areas_for_improvement: improvements,
      recommendations,
      next_match_strategy: strategy,
      confidence_level: this.calculateConfidenceLevel(stats)
    };
  }

  /**
   * Calculate overall rating (1-10) based on multiple factors
   */
  private static calculateOverallRating(stats: PerformanceStats): number {
    let rating = 5; // Base rating

    // Win rate component (40% weight)
    rating += (stats.win_rate - 50) * 0.04;

    // Game win rate component (30% weight)  
    rating += (stats.game_win_rate - 50) * 0.03;

    // Experience component (20% weight)
    const experienceBonus = Math.min(stats.total_matches / 10, 2);
    rating += experienceBonus * 0.2;

    // Recent form component (10% weight)
    if (stats.recent_form === 'improving') rating += 0.5;
    else if (stats.recent_form === 'declining') rating -= 0.5;

    return Math.max(1, Math.min(10, Math.round(rating * 10) / 10));
  }

  /**
   * Identify player strengths
   */
  private static identifyStrengths(stats: PerformanceStats, performances: MatchPerformanceData[]): string[] {
    const strengths: string[] = [];

    if (stats.win_rate > 60) {
      strengths.push('Excellent win rate - consistently defeats opponents');
    }

    if (stats.game_win_rate > stats.win_rate + 5) {
      strengths.push('Strong in individual games - good stamina and focus');
    }

    if (stats.recent_form === 'improving') {
      strengths.push('Improving performance - showing positive development');
    }

    if (stats.total_matches > 20) {
      strengths.push('Experienced player with good match exposure');
    }

    // Partner analysis
    const partnerStats: { [key: string]: { matches: number; wins: number } } = {};
    performances.forEach(p => {
      if (p.partner_name) {
        if (!partnerStats[p.partner_name]) {
          partnerStats[p.partner_name] = { matches: 0, wins: 0 };
        }
        partnerStats[p.partner_name].matches++;
        if (p.won) partnerStats[p.partner_name].wins++;
      }
    });

    const bestPartnership = Object.keys(partnerStats).reduce((best, partner) => {
      const winRate = partnerStats[partner].wins / partnerStats[partner].matches;
      const bestRate = partnerStats[best]?.wins / partnerStats[best]?.matches || 0;
      return winRate > bestRate && partnerStats[partner].matches >= 3 ? partner : best;
    }, '');

    if (bestPartnership && partnerStats[bestPartnership]) {
      const winRate = (partnerStats[bestPartnership].wins / partnerStats[bestPartnership].matches) * 100;
      if (winRate > 70) {
        strengths.push(`Excellent chemistry with ${bestPartnership} (${winRate.toFixed(0)}% win rate)`);
      }
    }

    return strengths.length > 0 ? strengths : ['Consistent performance across matches'];
  }

  /**
   * Identify areas for improvement
   */
  private static identifyImprovements(stats: PerformanceStats, performances: MatchPerformanceData[]): string[] {
    const improvements: string[] = [];

    if (stats.win_rate < 40) {
      improvements.push('Focus on winning strategy - analyze opponent weaknesses');
    }

    if (stats.game_win_rate < stats.win_rate - 10) {
      improvements.push('Work on closing out games - improve mental toughness');
    }

    if (stats.recent_form === 'declining') {
      improvements.push('Address recent performance decline - review technique and fitness');
    }

    if (stats.total_matches < 10) {
      improvements.push('Gain more match experience - play regularly to improve');
    }

    // Check for pattern in losses
    const lostMatches = performances.filter(p => !p.won);
    if (lostMatches.length > 0) {
      const avgLossMargin = lostMatches.reduce((sum, m) => sum + (m.opponent_score - m.team_score), 0) / lostMatches.length;
      
      if (avgLossMargin > 1) {
        improvements.push('Close losses indicate good competition level - focus on key moments');
      } else {
        improvements.push('Work on fundamentals - significant gap with stronger opponents');
      }
    }

    return improvements.length > 0 ? improvements : ['Continue current training approach'];
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(stats: PerformanceStats, performances: MatchPerformanceData[]): string[] {
    const recommendations: string[] = [];

    if (stats.favorite_partner && stats.win_rate > 50) {
      recommendations.push(`Continue playing with ${stats.favorite_partner} - proven partnership`);
    }

    if (stats.strongest_opponents.length > 0) {
      recommendations.push(`Study matches against ${stats.strongest_opponents[0]} to improve technique`);
    }

    if (stats.recent_form === 'improving') {
      recommendations.push('Maintain current training routine - positive momentum building');
    } else if (stats.recent_form === 'declining') {
      recommendations.push('Consider technique review or fitness training to reverse trend');
    }

    if (stats.total_matches > 15 && stats.win_rate > 55) {
      recommendations.push('Consider playing in tournaments - ready for competitive level');
    }

    recommendations.push('Focus on pre-match warm-up and post-match analysis');

    return recommendations;
  }

  /**
   * Generate next match strategy
   */
  private static generateStrategy(stats: PerformanceStats, performances: MatchPerformanceData[]): string {
    if (stats.recent_form === 'improving') {
      return 'Play with confidence - momentum is on your side. Maintain aggressive playstyle.';
    } else if (stats.recent_form === 'declining') {
      return 'Focus on solid fundamentals and reduce unforced errors. Build confidence gradually.';
    } else if (stats.win_rate > 60) {
      return 'Continue current approach - analyze opponents early and adapt strategy accordingly.';
    } else {
      return 'Focus on consistent rallies and wait for opponent mistakes. Stay patient and disciplined.';
    }
  }

  /**
   * Calculate confidence level in analysis
   */
  private static calculateConfidenceLevel(stats: PerformanceStats): number {
    let confidence = 0.5; // Base confidence

    // More matches = higher confidence
    confidence += Math.min(stats.total_matches / 20, 0.3);

    // Recent activity increases confidence
    if (stats.total_matches >= 5) confidence += 0.2;

    return Math.min(1, Math.round(confidence * 100) / 100);
  }

  /**
   * Format analysis for display
   */
  static formatAnalysisForDisplay(analysis: AIAnalysisResult): string {
    let report = `🏸 Performance Analysis for ${analysis.member_name}\n\n`;
    
    report += `📊 Overall Rating: ${analysis.overall_rating}/10\n`;
    report += `📈 Trend: ${analysis.performance_trend.charAt(0).toUpperCase() + analysis.performance_trend.slice(1)}\n\n`;
    
    report += `💪 Strengths:\n`;
    analysis.strengths.forEach(strength => {
      report += `• ${strength}\n`;
    });
    
    report += `\n🎯 Areas for Improvement:\n`;
    analysis.areas_for_improvement.forEach(area => {
      report += `• ${area}\n`;
    });
    
    report += `\n💡 Recommendations:\n`;
    analysis.recommendations.forEach(rec => {
      report += `• ${rec}\n`;
    });
    
    report += `\n🎲 Next Match Strategy:\n${analysis.next_match_strategy}\n`;
    report += `\n⚡ Analysis Confidence: ${(analysis.confidence_level * 100).toFixed(0)}%`;
    
    return report;
  }
}