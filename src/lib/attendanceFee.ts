import { SupabaseClient } from '@supabase/supabase-js';
import { getBranchPricing } from '@/lib/pricingSettings';

export interface RecalcResult {
  updatedCount: number;
  membersSummary: {
    name: string;
    matchesCount: number;
    attendanceFee: number;
  }[];
}

/**
 * Recalculate daily attendance fees for all matches on a given date for a branch.
 * Rule for DLOB Cikupa:
 * - If a player plays exactly 1 match today: attendance fee = Rp 5.000 (singleMatchAttendanceFee)
 * - If a player plays > 1 match today: attendance fee = Rp 12.000 (attendanceFee)
 * - The fee is charged on the FIRST match of the day for that player; all subsequent matches get 0.
 * - Exempt players always get 0.
 */
export async function recalcDailyAttendanceFees(
  supabase: SupabaseClient,
  branchId: string,
  matchDate: string | Date
): Promise<RecalcResult> {
  const isCikupa = branchId === 'dlob-cikupa' || branchId === 'cikupa';
  const targetBranch = isCikupa ? 'dlob-cikupa' : 'dlob-pusat';

  const dateObj = new Date(matchDate);
  const dayStart = new Date(dateObj);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dateObj);
  dayEnd.setHours(23, 59, 59, 999);

  // 1. Get branch pricing
  const pricing = await getBranchPricing(supabase, targetBranch);
  const normalFee = pricing.attendanceFee;
  const singleMatchFee = pricing.singleMatchAttendanceFee ?? (isCikupa ? 5000 : normalFee);

  // 2. Get payment exempt members
  const { data: exemptProfiles } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('is_payment_exempt', true);
  const exemptSet = new Set((exemptProfiles || []).map((p) => (p.full_name || '').toLowerCase().trim()));

  // 3. Find all matches in this branch on this date, ordered by match_number / created_at
  const { data: dayMatches, error: matchesErr } = await supabase
    .from('matches')
    .select('id, match_number, match_date, created_at')
    .eq('branch_id', targetBranch)
    .gte('match_date', dayStart.toISOString())
    .lte('match_date', dayEnd.toISOString())
    .order('created_at', { ascending: true });

  if (matchesErr || !dayMatches || dayMatches.length === 0) {
    return { updatedCount: 0, membersSummary: [] };
  }

  const matchIds = dayMatches.map((m) => m.id);
  const matchOrderMap = new Map<string, number>();
  dayMatches.forEach((m, idx) => matchOrderMap.set(m.id, idx));

  // 4. Fetch all match_members for these matches
  const { data: allMm, error: mmErr } = await supabase
    .from('match_members')
    .select('id, match_id, member_name, amount_due, attendance_fee')
    .in('match_id', matchIds);

  if (mmErr || !allMm || allMm.length === 0) {
    return { updatedCount: 0, membersSummary: [] };
  }

  // Group by member_name (normalized lowercase)
  const memberRecordsMap = new Map<string, typeof allMm>();
  for (const mm of allMm) {
    const key = (mm.member_name || '').toLowerCase().trim();
    if (!key) continue;
    if (!memberRecordsMap.has(key)) {
      memberRecordsMap.set(key, []);
    }
    memberRecordsMap.get(key)!.push(mm);
  }

  const updates: { id: string; attendance_fee: number }[] = [];
  const membersSummary: RecalcResult['membersSummary'] = [];

  for (const [key, records] of memberRecordsMap.entries()) {
    const isExempt = exemptSet.has(key);
    const matchesCount = records.length;
    const displayName = records[0].member_name;

    // Determine target attendance fee for the day
    let dayAttendanceFee = 0;
    if (!isExempt) {
      if (isCikupa) {
        // CIKUPA RULE: 1 match = 5.000, >1 match = 12.000
        dayAttendanceFee = matchesCount === 1 ? singleMatchFee : normalFee;
      } else {
        dayAttendanceFee = normalFee;
      }
    }

    membersSummary.push({
      name: displayName,
      matchesCount,
      attendanceFee: dayAttendanceFee,
    });

    // Sort member's match records by chronological order of match
    records.sort((a, b) => {
      const orderA = matchOrderMap.get(a.match_id) ?? 0;
      const orderB = matchOrderMap.get(b.match_id) ?? 0;
      return orderA - orderB;
    });

    // Earliest match gets dayAttendanceFee, all other matches get 0
    records.forEach((rec, idx) => {
      const targetFee = idx === 0 ? dayAttendanceFee : 0;
      if (rec.attendance_fee !== targetFee) {
        updates.push({ id: rec.id, attendance_fee: targetFee });
      }
    });
  }

  // 5. Update rows whose attendance_fee needs updating
  if (updates.length > 0) {
    for (const u of updates) {
      await supabase
        .from('match_members')
        .update({ attendance_fee: u.attendance_fee })
        .eq('id', u.id);
    }
  }

  return {
    updatedCount: updates.length,
    membersSummary,
  };
}

/**
 * Sync attendance fees for all distinct dates in a given branch.
 */
export async function syncBranchAttendanceFees(
  supabase: SupabaseClient,
  branchId: string = 'dlob-cikupa'
): Promise<{ totalUpdated: number; datesProcessed: number }> {
  const { data: matches, error } = await supabase
    .from('matches')
    .select('match_date')
    .eq('branch_id', branchId);

  if (error || !matches || matches.length === 0) {
    return { totalUpdated: 0, datesProcessed: 0 };
  }

  // Get unique dates
  const dateSet = new Set<string>();
  for (const m of matches) {
    if (m.match_date) {
      const d = new Date(m.match_date).toISOString().split('T')[0];
      dateSet.add(d);
    }
  }

  let totalUpdated = 0;
  for (const dateStr of dateSet) {
    const res = await recalcDailyAttendanceFees(supabase, branchId, dateStr);
    totalUpdated += res.updatedCount;
  }

  return { totalUpdated, datesProcessed: dateSet.size };
}
