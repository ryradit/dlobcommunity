import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import type { Match, MatchResult, ApiResponse } from '../types';

const router = Router();

// Get matches
router.get('/', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { date, status, member_id } = req.query;
    
    let query = supabase
      .from('matches')
      .select(`
        *,
        participants:match_participants(
          id,
          team,
          position,
          member:members(id, name, email)
        ),
        result:match_results(*)
      `)
      .order('date', { ascending: false });

    if (date) {
      query = query.eq('date', date);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter by member_id if provided
    let filteredData = data;
    if (member_id) {
      filteredData = data?.filter(match =>
        match.participants.some((p: any) => p.member.id === member_id)
      ) || [];
    }

    const response: ApiResponse<Match[]> = {
      success: true,
      data: filteredData as Match[]
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch matches'
    });
  }
});

// Create match
router.post('/', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { date, time, court_number, type, participants } = req.body;

    // Create match
    const matchData = {
      date,
      time,
      court_number,
      type,
      status: 'scheduled' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert(matchData)
      .select()
      .single();

    if (matchError) throw matchError;

    // Add participants
    if (participants && participants.length > 0) {
      const participantData = participants.map((p: any) => ({
        match_id: match.id,
        member_id: p.member_id,
        team: p.team,
        position: p.position
      }));

      const { error: participantError } = await supabase
        .from('match_participants')
        .insert(participantData);

      if (participantError) throw participantError;
    }

    const response: ApiResponse<Match> = {
      success: true,
      data: match as Match,
      message: 'Match created successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create match'
    });
  }
});

// Update match result
router.post('/:id/result', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { team1_score, team2_score, winner_team, game_scores } = req.body;

    // Update match status
    await supabase
      .from('matches')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Create result record
    const resultData = {
      match_id: id,
      team1_score,
      team2_score,
      winner_team,
      game_scores,
      completed_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('match_results')
      .insert(resultData)
      .select()
      .single();

    if (error) throw error;

    const response: ApiResponse<MatchResult> = {
      success: true,
      data: data as MatchResult,
      message: 'Match result recorded successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error recording match result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record match result'
    });
  }
});

export default router;