import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncBranchAttendanceFees, recalcDailyAttendanceFees } from '@/lib/attendanceFee';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json().catch(() => ({}));
    const { branch_id = 'dlob-cikupa', date } = body;

    if (date) {
      const result = await recalcDailyAttendanceFees(supabaseAdmin, branch_id, date);
      return NextResponse.json({
        success: true,
        message: `Biaya kehadiran tanggal ${date} berhasil disinkronkan (${result.updatedCount} record diperbarui).`,
        result,
      });
    }

    const result = await syncBranchAttendanceFees(supabaseAdmin, branch_id);
    return NextResponse.json({
      success: true,
      message: `Biaya kehadiran cabang ${branch_id} berhasil disinkronkan (${result.totalUpdated} record diperbarui di ${result.datesProcessed} tanggal sesi).`,
      result,
    });
  } catch (error: any) {
    console.error('[API Sync Fees] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
