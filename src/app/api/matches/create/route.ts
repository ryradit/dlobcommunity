import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getBranchPricing } from '@/lib/pricingSettings';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const {
      branch_id = 'dlob-cikupa',
      match_date,
      shuttlecock_count = 1,
      players,
      created_by,
      team1_score,
      team2_score,
    } = body;

    if (!players || !Array.isArray(players) || players.length !== 4) {
      return NextResponse.json({ error: 'Pilih tepat 4 pemain untuk pertandingan ganda.' }, { status: 400 });
    }

    const cleanPlayers = players.map((p: string) => (p || '').trim()).filter(Boolean);
    if (cleanPlayers.length !== 4) {
      return NextResponse.json({ error: 'Semua 4 nama pemain harus diisi.' }, { status: 400 });
    }

    const matchDateObj = match_date ? new Date(match_date) : new Date();
    const targetBranch = branch_id === 'dlob-pusat' ? 'dlob-pusat' : 'dlob-cikupa';

    // Pricing
    const currentPricing = await getBranchPricing(supabaseAdmin, targetBranch);
    const costPerCockPerMember = currentPricing.costPerMemberPerCock;
    const costPerMember = Number(shuttlecock_count) * costPerCockPerMember;

    // Insert match record (Note: total_cost is generated column in postgres, do not insert manually)
    const matchInsertPayload: any = {
      shuttlecock_count: Number(shuttlecock_count),
      status: 'active',
      created_by: created_by || null,
      match_date: matchDateObj.toISOString(),
      branch_id: targetBranch,
      team1_player1: cleanPlayers[0],
      team1_player2: cleanPlayers[1],
      team2_player1: cleanPlayers[2],
      team2_player2: cleanPlayers[3],
    };

    if (team1_score !== undefined && team1_score !== null && team1_score !== '') {
      matchInsertPayload.team1_score = Number(team1_score);
    }
    if (team2_score !== undefined && team2_score !== null && team2_score !== '') {
      matchInsertPayload.team2_score = Number(team2_score);
    }

    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .insert(matchInsertPayload)
      .select()
      .single();

    if (matchError) {
      console.error('[API Matches Create] Match insert error:', matchError);
      return NextResponse.json({ error: 'Gagal membuat pertandingan', details: matchError.message }, { status: 500 });
    }

    // Check payment exempt members
    const { data: exemptProfiles } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('is_payment_exempt', true);
    const paymentExemptMembers = new Set(
      (exemptProfiles || []).map((p) => (p.full_name || '').toLowerCase().trim())
    );

    // Check same-day attendance fee
    const dayStart = new Date(matchDateObj);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(matchDateObj);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: sameDayMatches } = await supabaseAdmin
      .from('matches')
      .select('id')
      .eq('branch_id', targetBranch)
      .gte('match_date', dayStart.toISOString())
      .lte('match_date', dayEnd.toISOString());

    const sameDayMatchIds = (sameDayMatches || []).map((m) => m.id);
    const sameDayFeeCharged = new Set<string>();

    if (sameDayMatchIds.length > 0) {
      const { data: sameDayMm } = await supabaseAdmin
        .from('match_members')
        .select('member_name')
        .in('match_id', sameDayMatchIds)
        .gt('attendance_fee', 0);
      (sameDayMm || []).forEach((mm) => sameDayFeeCharged.add(mm.member_name.toLowerCase().trim()));
    }

    // Note: total_amount is a generated column (amount_due + attendance_fee), so omit it
    const membersData = cleanPlayers.map((name: string) => {
      const isExempt = paymentExemptMembers.has(name.toLowerCase());
      const alreadyChargedToday = sameDayFeeCharged.has(name.toLowerCase());
      const shouldChargeAttendance = !alreadyChargedToday && !isExempt;

      if (shouldChargeAttendance) {
        sameDayFeeCharged.add(name.toLowerCase());
      }

      const attendanceFee = shouldChargeAttendance ? currentPricing.attendanceFee : 0;
      const amountDue = isExempt ? 0 : costPerMember;

      return {
        match_id: match.id,
        member_name: name,
        amount_due: amountDue,
        attendance_fee: attendanceFee,
        has_membership: false,
        payment_status: isExempt ? 'paid' : 'pending',
        paid_at: isExempt ? new Date().toISOString() : null,
        branch_id: targetBranch,
      };
    });

    const { data: createdMembers, error: mmError } = await supabaseAdmin
      .from('match_members')
      .insert(membersData)
      .select();

    if (mmError) {
      console.error('[API Matches Create] Match members insert error:', mmError);
      await supabaseAdmin.from('matches').delete().eq('id', match.id);
      return NextResponse.json({ error: 'Gagal menambahkan anggota pertandingan', details: mmError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      match,
      members: createdMembers,
    });
  } catch (error: any) {
    console.error('[API Matches Create] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
