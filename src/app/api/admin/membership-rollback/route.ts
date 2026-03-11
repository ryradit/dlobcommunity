import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Verify caller is an authenticated admin
async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return false;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return false;
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return profile?.role === 'admin';
}

// Helper: get match_member rows for a member in a given month/year
async function getAffectedMatchMembers(memberName: string, month: number, year: number) {
  // Build date range for the month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Get all matches in that month
  const { data: matchIds } = await supabaseAdmin
    .from('matches')
    .select('id')
    .gte('match_date', startDate)
    .lte('match_date', endDate);

  if (!matchIds || matchIds.length === 0) return [];

  const ids = matchIds.map((m: { id: string }) => m.id);

  const { data: rows } = await supabaseAdmin
    .from('match_members')
    .select('id, match_id, payment_status, has_membership, attendance_fee')
    .eq('member_name', memberName)
    .in('match_id', ids)
    .eq('has_membership', true);

  return rows ?? [];
}

// GET /api/admin/membership-rollback?id=xxx → preview
export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const membershipId = req.nextUrl.searchParams.get('id');
  if (!membershipId) {
    return NextResponse.json({ error: 'Missing membership id' }, { status: 400 });
  }

  // Fetch the membership
  const { data: membership, error: mErr } = await supabaseAdmin
    .from('memberships')
    .select('id, member_name, month, year, weeks_in_month')
    .eq('id', membershipId)
    .single();

  if (mErr || !membership) {
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
  }

  const rows = await getAffectedMatchMembers(membership.member_name, membership.month, membership.year);

  const pendingRows = rows.filter((r: { payment_status: string }) =>
    r.payment_status !== 'paid' && r.payment_status !== 'cancelled'
  );

  const preview = {
    total_pending_matches: pendingRows.length,
    matches_will_get_attendance_fee: pendingRows.length,
    total_attendance_fees_to_add: pendingRows.length * 18000,
  };

  return NextResponse.json({ data: [preview] });
}

// POST /api/admin/membership-rollback { membershipId } → execute
export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { membershipId } = await req.json();
  if (!membershipId) {
    return NextResponse.json({ error: 'Missing membershipId' }, { status: 400 });
  }

  // Fetch membership
  const { data: membership, error: mErr } = await supabaseAdmin
    .from('memberships')
    .select('id, member_name, month, year')
    .eq('id', membershipId)
    .single();

  if (mErr || !membership) {
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
  }

  const rows = await getAffectedMatchMembers(membership.member_name, membership.month, membership.year);

  let updatedCount = 0;
  if (rows.length > 0) {
    const rowIds = rows.map((r: { id: string }) => r.id);
    // Update has_membership + attendance_fee — do NOT touch total_amount (generated column)
    const { error: updateErr } = await supabaseAdmin
      .from('match_members')
      .update({ has_membership: false, attendance_fee: 18000 })
      .in('id', rowIds);

    if (updateErr) {
      console.error('[Rollback] match_members update error:', updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    updatedCount = rows.length;
  }

  // Cancel the membership
  const { error: cancelErr } = await supabaseAdmin
    .from('memberships')
    .update({ payment_status: 'cancelled' })
    .eq('id', membershipId);

  if (cancelErr) {
    console.error('[Rollback] membership cancel error:', cancelErr.message);
    return NextResponse.json({ error: cancelErr.message }, { status: 500 });
  }

  const result = {
    member_name: membership.member_name,
    month: membership.month,
    year: membership.year,
    updated_match_records: updatedCount,
  };

  return NextResponse.json({ data: [result] });
}
