import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface MatchInput {
  team1_player1: string;
  team1_player2: string;
  team2_player1: string;
  team2_player2: string;
  court_number: string;
  shuttlecock_amount: string;
}

async function getOrCreatePlayerProfile(supabase: any, name: string, targetBranchId: string) {
  const cleanName = name.trim();
  if (!cleanName) return null;

  // 1. Lookup by name (case-insensitive)
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, full_name, is_payment_exempt, phone, email, branch_id')
    .ilike('full_name', cleanName)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  // 2. Lookup by unified temp email
  const slug = cleanName.toLowerCase().replace(/\s+/g, '.');
  const email = `${slug}@temp.dlob.local`;

  const { data: existingByEmail } = await supabase
    .from('profiles')
    .select('id, full_name, is_payment_exempt, phone, email, branch_id')
    .eq('email', email)
    .limit(1)
    .maybeSingle();

  if (existingByEmail) {
    return existingByEmail;
  }

  // 3. Auto-create temp member auth user + profile
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'Dlob2026!',
      email_confirm: true,
      user_metadata: { full_name: cleanName, branch_id: targetBranchId },
    });

    let userId = authData?.user?.id;
    if (authError && (authError.message?.includes('already been registered') || authError.message?.includes('already exists'))) {
      const { data: userByEmail } = await supabase
        .from('profiles')
        .select('id, full_name, is_payment_exempt, phone, email, branch_id')
        .eq('email', email)
        .maybeSingle();
      if (userByEmail) return userByEmail;
    }

    if (userId) {
      await supabase.rpc('update_profile_safe', {
        p_id: userId,
        p_full_name: cleanName,
        p_email: email,
        p_role: 'member',
        p_is_active: true,
      });

      await supabase
        .from('profiles')
        .update({ branch_id: targetBranchId })
        .eq('id', userId);

      return {
        id: userId,
        full_name: cleanName,
        is_payment_exempt: false,
        phone: null,
        email,
        branch_id: targetBranchId,
      };
    }
  } catch (err) {
    console.error(`[bulk-create] Auto-create temp profile failed for ${cleanName}:`, err);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase tidak dikonfigurasi' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { matches, matchDate, branchId } = await request.json();
    const targetBranchId = (branchId && typeof branchId === 'string' && branchId.trim()) 
      ? branchId.trim() 
      : 'dlob-pusat';

    // Verify caller branch authorization if auth header is provided
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const userEmail = (user.email || '').toLowerCase().trim();
        const isMultiBranchAdmin = userEmail.includes('ryradit') || userEmail === 'dlob.official.tng@gmail.com';

        if (!isMultiBranchAdmin) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, branch_id')
            .eq('id', user.id)
            .single();

          const isCallerBranchAdmin = profile?.role === 'branch_admin' || userEmail === 'edi@temp.dlob.local' || profile?.branch_id === 'dlob-cikupa';

          if (isCallerBranchAdmin && targetBranchId !== 'dlob-cikupa') {
            return NextResponse.json(
              { error: 'Akses Ditolak: Admin DLBC hanya diizinkan menginput pertandingan untuk cabang DLBC (Cikupa).' },
              { status: 403 }
            );
          }

          if (!isCallerBranchAdmin && targetBranchId === 'dlob-cikupa') {
            return NextResponse.json(
              { error: 'Akses Ditolak: Admin DLOB Pusat tidak diizinkan menginput pertandingan untuk cabang DLBC.' },
              { status: 403 }
            );
          }
        }
      }
    }

    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json(
        { error: 'Data pertandingan diperlukan' },
        { status: 400 }
      );
    }

    if (!matchDate) {
      return NextResponse.json(
        { error: 'Tanggal pertandingan diperlukan' },
        { status: 400 }
      );
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Map to accumulate per-member notification data across all matches
    const memberSummaryMap: Record<string, {
      name: string;
      phone: string | null;
      email: string | null;
      matchCount: number;
      totalAmountDue: number;
      totalAttendanceFee: number;
      hasMembership: boolean;
      isPaymentExempt: boolean;
    }> = {};

    for (let i = 0; i < matches.length; i++) {
      const match: MatchInput = matches[i];
      
      try {
        // Get player names and trim whitespace
        const playerNames = [
          match.team1_player1,
          match.team1_player2,
          match.team2_player1,
          match.team2_player2
        ]
          .filter(name => name && name.trim() !== '')
          .map(name => name.trim());

        if (playerNames.length !== 4) {
          errors.push(`Pertandingan #${i + 1}: tidak lengkap 4 pemain`);
          errorCount++;
          continue;
        }

        console.log(`Processing match #${i + 1} (${targetBranchId}), players:`, playerNames);

        // Validate or auto-create temp accounts for all players
        const profilePromises = playerNames.map(name => 
          getOrCreatePlayerProfile(supabase, name, targetBranchId)
        );

        const profileResults = await Promise.all(profilePromises);
        const missingNames = playerNames.filter((_, idx) => !profileResults[idx]);

        if (missingNames.length > 0) {
          errors.push(`Pertandingan #${i + 1}: Gagal memproses pemain: ${missingNames.join(', ')}`);
          errorCount++;
          continue;
        }

        const profiles = profileResults as NonNullable<typeof profileResults[0]>[];

        // Calculate costs based on branch rules:
        // DLBC (dlob-cikupa): Rp 12.000 attendance fee, Rp 2.500 per shuttlecock per member
        // DLOB Pusat: Rp 18.000 attendance fee, Rp 12.000 total per cock / 4 members
        const isDlbcBranch = targetBranchId === 'dlob-cikupa';
        const shuttlecockAmountNum = parseInt(match.shuttlecock_amount) || 1;
        const costPerMember = isDlbcBranch 
          ? (shuttlecockAmountNum * 2500) 
          : ((shuttlecockAmountNum * 12000) / 4);
        const attendanceFeeRate = isDlbcBranch ? 12000 : 18000;

        // Get match month and year to check memberships
        const matchDateObj = new Date(matchDate);
        const matchDateString = matchDateObj.toISOString().split('T')[0];
        const matchMonth = matchDateObj.getMonth() + 1;
        const matchYear = matchDateObj.getFullYear();

        // Check active memberships for this month and branch (DLBC has no membership package yet)
        let membershipSet = new Set<string>();
        if (!isDlbcBranch) {
          let membershipQuery = supabase
            .from('memberships')
            .select('member_name')
            .eq('month', matchMonth)
            .eq('year', matchYear)
            .eq('payment_status', 'paid');

          if (targetBranchId) {
            membershipQuery = membershipQuery.eq('branch_id', targetBranchId);
          }

          const { data: activeMemberships } = await membershipQuery;
          membershipSet = new Set(
            (activeMemberships || []).map(m => m.member_name.toLowerCase().trim())
          );
        }

        // Check which members already paid attendance fee TODAY in THIS branch (not per match!)
        const matchDayStart = new Date(matchDateObj);
        matchDayStart.setHours(0, 0, 0, 0);
        const matchDayEnd = new Date(matchDateObj);
        matchDayEnd.setHours(23, 59, 59, 999);

        let attendanceQuery = supabase
          .from('match_members')
          .select('member_name, branch_id, matches!inner(match_date, branch_id)')
          .gt('attendance_fee', 0)
          .gte('matches.match_date', matchDayStart.toISOString())
          .lte('matches.match_date', matchDayEnd.toISOString());

        if (targetBranchId) {
          attendanceQuery = attendanceQuery.eq('branch_id', targetBranchId);
        }

        const { data: existingMatchMembers } = await attendanceQuery;

        const attendancePaidTodaySet = new Set(
          (existingMatchMembers || []).map(mm => mm.member_name.toLowerCase().trim())
        );

        console.log(`📅 Date: ${matchDayStart.toISOString().split('T')[0]}, Branch: ${targetBranchId}, Already paid attendance today:`, Array.from(attendancePaidTodaySet));

        // Get next match number for this date and branch
        let matchNumber = 1;
        const { data: branchMatchNum } = await supabase
          .rpc('get_next_match_number_by_branch', { 
            p_date: matchDateObj.toISOString(), 
            p_branch_id: targetBranchId 
          });

        if (typeof branchMatchNum === 'number' && branchMatchNum > 0) {
          matchNumber = branchMatchNum;
        } else {
          // Fallback: try standard get_next_match_number or query max
          const { data: standardMatchNum } = await supabase
            .rpc('get_next_match_number', { p_date: matchDateObj.toISOString() });
          matchNumber = standardMatchNum || 1;
        }

        console.log(`🔢 Creating match #${matchNumber} for ${matchDateString} (${targetBranchId})`);

        // Create match with branch_id
        const { data: createdMatch, error: matchError } = await supabase
          .from('matches')
          .insert({
            shuttlecock_count: shuttlecockAmountNum,
            match_date: matchDateObj.toISOString(),
            match_number: matchNumber,
            branch_id: targetBranchId,
          })
          .select()
          .single();

        if (matchError || !createdMatch) {
          console.error('Error creating match:', matchError);
          errors.push(`Pertandingan #${i + 1}: gagal buat match - ${matchError?.message}`);
          errorCount++;
          continue;
        }

        // Create match_members entries with proper cost calculations
        // Use validated profile full_names to ensure exact match with user accounts
        const matchMembers = profiles.map(profile => {
          // Check if member is payment exempt (VIP/sponsor/special access)
          const isExempt = profile.is_payment_exempt === true;
          
          if (isExempt) {
            console.log(`🎁 ${profile.full_name} is payment exempt - all costs = 0`);
            // Exempt members: everything is free
            return {
              match_id: createdMatch.id,
              member_name: profile.full_name,
              amount_due: 0,
              attendance_fee: 0,
              has_membership: true, // Mark as membership to avoid confusion
              payment_status: 'pending',
              attendance_paid_this_entry: false,
              branch_id: targetBranchId,
            };
          }
          
          // Normal payment calculation for non-exempt members
          const hasMembership = membershipSet.has(profile.full_name.toLowerCase().trim());
          const alreadyPaidToday = attendancePaidTodaySet.has(profile.full_name.toLowerCase().trim());
          
          // Determine attendance fee:
          // - Has membership: no fee (0)
          // - No membership && first match today: charge attendanceFeeRate (12000 for DLBC, 18000 for Pusat) and mark as paid
          // - No membership && already played today: don't charge (already paid)
          const shouldChargeAttendance = !hasMembership && !alreadyPaidToday;
          const attendanceFee = hasMembership ? 0 : (shouldChargeAttendance ? attendanceFeeRate : 0);
          
          // Mark in set so next profile in this same match doesn't get charged again
          if (shouldChargeAttendance) {
            attendancePaidTodaySet.add(profile.full_name.toLowerCase().trim());
          }
          
          return {
            match_id: createdMatch.id,
            member_name: profile.full_name,
            amount_due: costPerMember,
            attendance_fee: attendanceFee,
            has_membership: hasMembership,
            payment_status: 'pending',
            attendance_paid_this_entry: shouldChargeAttendance, // TRUE only if charging attendance in this entry
            branch_id: targetBranchId,
          };
        });

        const { error: memberLinkError } = await supabase
          .from('match_members')
          .insert(matchMembers);

        if (memberLinkError) {
          console.error('Error linking members:', memberLinkError);
          errors.push(`Pertandingan #${i + 1}: gagal link member - ${memberLinkError.message}`);
          errorCount++;
          continue;
        }

        console.log(`✅ Match #${matchNumber} created successfully for ${matchDateString}`);
        successCount++;

        // Accumulate member notification data
        for (const mm of matchMembers) {
          const prof = profiles.find(p => p.full_name === mm.member_name);
          if (!memberSummaryMap[mm.member_name]) {
            memberSummaryMap[mm.member_name] = {
              name: mm.member_name,
              phone: prof?.phone ?? null,
              email: prof?.email ?? null,
              matchCount: 0,
              totalAmountDue: 0,
              totalAttendanceFee: 0,
              hasMembership: mm.has_membership,
              isPaymentExempt: prof?.is_payment_exempt === true,
            };
          }
          memberSummaryMap[mm.member_name].matchCount++;
          memberSummaryMap[mm.member_name].totalAmountDue += mm.amount_due;
          memberSummaryMap[mm.member_name].totalAttendanceFee += mm.attendance_fee;
        }
      } catch (err) {
        console.error(`Error processing match #${i + 1}:`, err);
        errors.push(`Pertandingan #${i + 1}: ${err instanceof Error ? err.message : 'unknown error'}`);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      errorCount,
      errors,
      message: `Berhasil menyimpan ${successCount} pertandingan${errorCount > 0 ? `, ${errorCount} gagal` : ''}`,
      memberSummary: Object.values(memberSummaryMap),
    });
  } catch (error) {
    console.error('Bulk create error:', error);
    return NextResponse.json(
      { 
        error: 'Gagal menyimpan pertandingan', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
