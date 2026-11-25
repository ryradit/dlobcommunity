import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recalcDailyAttendanceFees } from '@/lib/attendanceFee';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { matchId, matchUpdatePayload, membersUpdates } = body;

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID diperlukan' }, { status: 400 });
    }

    // 1. Update match record
    if (matchUpdatePayload && Object.keys(matchUpdatePayload).length > 0) {
      // Remove generated columns in postgres (total_cost, cost_per_member)
      const safePayload = { ...matchUpdatePayload };
      delete safePayload.total_cost;
      delete safePayload.cost_per_member;

      const { error: matchError } = await supabaseAdmin
        .from('matches')
        .update(safePayload)
        .eq('id', matchId);

      if (matchError) {
        console.error('[API Matches Update] Match error:', matchError);
        return NextResponse.json({ error: 'Gagal memperbarui pertandingan', details: matchError.message }, { status: 500 });
      }
    }

    // 2. Update member records
    if (membersUpdates && Array.isArray(membersUpdates)) {
      for (const mu of membersUpdates) {
        if (!mu.id) continue;
        const { id, total_amount, ...updateFields } = mu;
        const { error: mmError } = await supabaseAdmin
          .from('match_members')
          .update(updateFields)
          .eq('id', id);

        if (mmError) {
          console.error('[API Matches Update] Member update error:', mmError);
        }
      }
    }

    // 3. Recalculate daily attendance fees for the affected match date & branch
    try {
      const { data: currentMatch } = await supabaseAdmin
        .from('matches')
        .select('branch_id, match_date')
        .eq('id', matchId)
        .single();

      if (currentMatch?.branch_id && currentMatch?.match_date) {
        await recalcDailyAttendanceFees(supabaseAdmin, currentMatch.branch_id, currentMatch.match_date);
      }
    } catch (recalcErr) {
      console.warn('[API Matches Update] Recalc attendance fee warning:', recalcErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Matches Update] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
