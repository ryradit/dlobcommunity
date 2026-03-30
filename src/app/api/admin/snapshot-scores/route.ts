import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Helper: Calculate best player score (same as leaderboard)
function calculateBestPlayerScore(player: any, maxStats: any): number {
  const normMatches = maxStats.matches > 0 ? (player.totalMatches / maxStats.matches) * 100 : 0;
  const normWins = maxStats.wins > 0 ? (player.wins / maxStats.wins) * 100 : 0;
  const normAvgScore = maxStats.avgScore > 0 ? (player.avgScore / maxStats.avgScore) * 100 : 0;
  const normStreak = maxStats.streak > 0 ? (player.longestWinStreak / maxStats.streak) * 100 : 0;
  const winRate = player.winRate;

  const weights = {
    matches: 0.25,
    wins: 0.20,
    winRate: 0.20,
    avgScore: 0.15,
    streak: 0.10,
  };

  const score =
    (normMatches * weights.matches) +
    (normWins * weights.wins) +
    (winRate * weights.winRate) +
    (normAvgScore * weights.avgScore) +
    (normStreak * weights.streak);

  return Math.round(score * 10) / 10;
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin or system call
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Allow unauthenticated calls from scheduled jobs, or authenticated admin calls
    if (token) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    // Get today's date in local timezone
    const today = new Date().toISOString().split('T')[0];

    // Check if snapshot already exists for today
    const { data: existingSnapshot, error: checkError } = await supabaseAdmin
      .from('score_history')
      .select('id')
      .eq('snapshot_date', today)
      .limit(1);

    if (checkError) throw checkError;

    if (existingSnapshot && existingSnapshot.length > 0) {
      return NextResponse.json(
        { success: true, message: 'Snapshot already exists for today', skipped: true },
        { status: 200 }
      );
    }

    // Fetch all active players with their stats
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_active', true);

    if (profileError) throw profileError;
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: true, snapshotCount: 0, message: 'No active members' }, { status: 200 });
    }

    // Fetch all matches
    const { data: matches, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true });

    if (matchError) throw matchError;

    // Calculate stats for all players
    const realNames = new Set(profiles.map(p => p.full_name));
    const statMap = new Map<string, any>();

    for (const match of matches || []) {
      const teams = [
        { players: [match.team1_player1, match.team1_player2], score: match.team1_score, won: match.winner === 'team1' },
        { players: [match.team2_player1, match.team2_player2], score: match.team2_score, won: match.winner === 'team2' },
      ];

      for (const team of teams) {
        for (const playerName of team.players) {
          if (!playerName || !realNames.has(playerName.trim())) continue;

          const name = playerName.trim();
          if (!statMap.has(name)) {
            statMap.set(name, {
              full_name: name,
              totalMatches: 0,
              wins: 0,
              losses: 0,
              totalScore: 0,
              avgScore: 0,
              longestWinStreak: 0,
              currentStreak: 0,
              winRate: 0,
              attendances: 0,
              lastMatchDate: null,
            });
          }

          const stat = statMap.get(name)!;
          stat.totalMatches++;
          stat.totalScore += team.score || 0;
          stat.avgScore = Math.round((stat.totalScore / stat.totalMatches) * 10) / 10;
          stat.lastMatchDate = match.match_date;

          if (team.won) {
            stat.wins++;
            stat.currentStreak++;
            stat.longestWinStreak = Math.max(stat.longestWinStreak, stat.currentStreak);
          } else {
            stat.losses++;
            stat.currentStreak = 0;
          }

          stat.winRate = stat.totalMatches > 0 ? Math.round((stat.wins / stat.totalMatches) * 100) : 0;
        }
      }
    }

    // Calculate maxStats for normalization
    const statsArray = Array.from(statMap.values());
    const maxStats = {
      matches: Math.max(...statsArray.map(s => s.totalMatches), 1),
      wins: Math.max(...statsArray.map(s => s.wins), 1),
      losses: Math.max(...statsArray.map(s => s.losses), 1),
      avgScore: Math.max(...statsArray.map(s => s.avgScore), 1),
      streak: Math.max(...statsArray.map(s => s.longestWinStreak), 1),
    };

    // Create snapshots for today
    const snapshots = statsArray.map(stat => {
      const bestPlayerScore = calculateBestPlayerScore(stat, maxStats);

      return {
        member_id: profiles.find(p => p.full_name === stat.full_name)?.id,
        member_name: stat.full_name,
        score: bestPlayerScore,
        best_player_score: bestPlayerScore,
        matches_played: stat.totalMatches,
        wins: stat.wins,
        win_rate: stat.winRate,
        avg_score: stat.avgScore,
        streak: stat.currentStreak,
        snapshot_date: today,
      };
    });

    // Insert snapshots
    const { data: insertedSnapshots, error: insertError } = await supabaseAdmin
      .from('score_history')
      .insert(snapshots);

    if (insertError) {
      // If unique constraint error, it's okay - snapshot already exists
      if (insertError.code === '23505') {
        return NextResponse.json(
          { success: true, message: 'Snapshot already exists for today', skipped: true },
          { status: 200 }
        );
      }
      throw insertError;
    }

    return NextResponse.json(
      {
        success: true,
        snapshotCount: snapshots.length,
        snapshotDate: today,
        message: `Daily score snapshot created for ${snapshots.length} members`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[snapshot-scores]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create snapshot' },
      { status: 500 }
    );
  }
}
