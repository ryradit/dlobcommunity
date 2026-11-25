import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recalcDailyAttendanceFees } from '@/lib/attendanceFee';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase tidak dikonfigurasi' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { matchId } = await request.json();

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID diperlukan' },
        { status: 400 }
      );
    }

    // Fetch match info before deleting to recalculate fees afterwards
    const { data: targetMatch } = await supabase
      .from('matches')
      .select('branch_id, match_date')
      .eq('id', matchId)
      .single();

    // Delete all match_members first
    const { error: membersError } = await supabase
      .from('match_members')
      .delete()
      .eq('match_id', matchId);

    if (membersError) {
      console.error('Error deleting match members:', membersError);
      return NextResponse.json(
        { error: 'Gagal menghapus anggota pertandingan', details: membersError.message },
        { status: 500 }
      );
    }

    // Then delete the match
    const { error: matchError } = await supabase
      .from('matches')
      .delete()
      .eq('id', matchId);

    if (matchError) {
      console.error('Error deleting match:', matchError);
      return NextResponse.json(
        { error: 'Gagal menghapus pertandingan', details: matchError.message },
        { status: 500 }
      );
    }

    // Recalculate daily attendance fees for remaining matches on this date
    if (targetMatch?.branch_id && targetMatch?.match_date) {
      try {
        await recalcDailyAttendanceFees(supabase, targetMatch.branch_id, targetMatch.match_date);
      } catch (recalcErr) {
        console.warn('[API Matches Delete] Recalc attendance fee warning:', recalcErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pertandingan berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete match error:', error);
    return NextResponse.json(
      { 
        error: 'Gagal menghapus pertandingan', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
