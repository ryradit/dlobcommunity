import { NextRequest, NextResponse } from 'next/server';
import { supabase, isDemoMode } from '@/lib/supabase';
import { PaymentCalculationService } from '@/lib/services/paymentCalculation';
import { PaymentDuplicateDetector } from '@/lib/services/paymentDuplicateDetector';

// Demo mode match creation handler
async function handleDemoMatchCreation(body: any) {
  console.log('🎭 Creating demo match with data:', body);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const {
    date,
    time,
    field_number,
    shuttlecock_count,
    participants,
    team1_score,
    team2_score
  } = body;

  // Create mock match data
  const mockMatch = {
    id: `demo-match-${Date.now()}`,
    date,
    time,
    field_number: field_number || 1,
    shuttlecock_count: shuttlecock_count || 1,
    type: 'doubles',
    status: 'completed',
    created_at: new Date().toISOString()
  };

  // Calculate demo payments
  const shuttlecockCostPerPlayer = (shuttlecock_count || 1) * 3000;
  const totalRevenue = shuttlecockCostPerPlayer * 4; // 4 players

  // Create mock payment calculations
  const mockCalculations = participants.map((p: any, index: number) => ({
    member_id: p.member_id,
    member_name: `Player ${index + 1}`,
    membership_status: index % 2 === 0 ? 'paid' : 'unpaid', // Alternate for demo
    shuttlecock_fee: shuttlecockCostPerPlayer,
    attendance_fee: index % 2 === 0 ? 0 : 18000, // Members with membership don't pay attendance
    total_due: shuttlecockCostPerPlayer + (index % 2 === 0 ? 0 : 18000),
    breakdown: {
      shuttlecock_cost: shuttlecockCostPerPlayer,
      attendance_cost: index % 2 === 0 ? 0 : 18000,
      membership_discount: index % 2 === 0
    }
  }));

  const paymentMessage = `🏸 DEMO Match Payment Summary - ${date}\n\n` +
    mockCalculations.map((calc: any) => 
      `👤 ${calc.member_name}\n` +
      `   Shuttlecock: Rp ${calc.shuttlecock_fee.toLocaleString('id-ID')}\n` +
      `   ${calc.attendance_fee > 0 ? `Attendance: Rp ${calc.attendance_fee.toLocaleString('id-ID')}` : '✅ Membership Active'}\n` +
      `   Total: Rp ${calc.total_due.toLocaleString('id-ID')}\n`
    ).join('\n') +
    `\n💰 Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}`;

  console.log('🎭 Demo match created successfully:', mockMatch);
  console.log('🎭 Demo payment calculations:', mockCalculations);

  return NextResponse.json({
    success: true,
    data: {
      match: mockMatch,
      calculations: mockCalculations,
      paymentMessage,
      totalRevenue
    }
  });
}

// Create new match
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/matches endpoint hit!');
    const body = await request.json();
    console.log('📋 Match creation request body:', body);
    
    const {
      date,
      time,
      field_number,
      shuttlecock_count,
      participants, // Array of { member_id, team, position }
      game_scores,
      team1_score,
      team2_score
    } = body;

    // Validate required fields
    if (!date || !time || !participants || participants.length !== 4) {
      throw new Error('Missing required fields or incorrect number of participants');
    }

    // Handle demo mode
    if (isDemoMode) {
      console.log('🎭 Demo mode: Simulating match creation');
      return handleDemoMatchCreation(body);
    }

    // Create match record - use progressive field detection
    let matchData: any = null;
    let matchError: any = null;

    // Try different field combinations starting with most basic
    const fieldCombinations = [
      // Most basic required fields only (matches basic schema.sql)
      {
        date,
        time,
        type: 'doubles',
        status: 'completed'
      },
      // Add court_number (basic schema field name)
      {
        date,
        time,
        court_number: field_number || 1,
        type: 'doubles', 
        status: 'completed'
      },
      // Try field_number (enhanced schema field name)
      {
        date,
        time,
        field_number: field_number || 1,
        type: 'doubles',
        status: 'completed'  
      },
      // Enhanced schema with shuttlecock tracking
      {
        date,
        time,
        field_number: field_number || 1,
        shuttlecock_count: shuttlecock_count || 1,
        type: 'doubles',
        status: 'completed'
      },
      // Full enhanced schema
      {
        date,
        time,
        field_number: field_number || 1,
        shuttlecock_count: shuttlecock_count || 1,
        shuttlecock_cost_per_piece: 3000,
        type: 'doubles',
        status: 'completed'
      }
    ];

    // Try each field combination from basic to enhanced
    for (let i = 0; i < fieldCombinations.length; i++) {
      try {
        console.log(`Trying match creation with field combination ${i + 1}:`, fieldCombinations[i]);
        
        const result = await supabase
          .from('matches')
          .insert(fieldCombinations[i])
          .select()
          .single();
        
        if (result.error) {
          throw result.error;
        }
        
        matchData = result.data;
        matchError = null;
        console.log(`✅ Match created successfully with field combination ${i + 1}`);
        break; // Success! Stop trying other combinations
        
      } catch (e: any) {
        console.log(`❌ Field combination ${i + 1} failed:`, e.message);
        matchError = e;
        
        // If this is the last combination, keep the error
        if (i === fieldCombinations.length - 1) {
          console.log('❌ All field combinations failed');
        }
      }
    }

    if (matchError) {
      console.error('Match creation error:', matchError);
      throw new Error(`Failed to create match: ${matchError.message}`);
    }

    console.log('Match created successfully:', matchData);

    // Create match participants (skip if table doesn't exist)
    let participantsCreated = false;
    try {
      const participantRecords = participants.map((p: any) => ({
        match_id: matchData.id,
        member_id: p.member_id,
        team: p.team,
        position: p.position
      }));

      const { error: participantsError } = await supabase
        .from('match_participants')
        .insert(participantRecords);

      if (participantsError) {
        console.error('Participants creation error:', participantsError);
        // Don't fail the whole request if participants table doesn't exist
        if (participantsError && !participantsError.message?.includes('relation "match_participants" does not exist')) {
          throw new Error(`Failed to create participants: ${participantsError.message}`);
        }
      } else {
        participantsCreated = true;
      }
    } catch (e: any) {
      console.log('Participants table not available:', e.message);
    }

    // Create match result (skip if table doesn't exist)
    try {
      const { error: resultError } = await supabase
        .from('match_results')
        .insert({
          match_id: matchData.id,
          team1_score: team1_score || 0,
          team2_score: team2_score || 0,
          winner_team: (team1_score || 0) > (team2_score || 0) ? 'team1' : 'team2'
        });

      if (resultError) {
        console.error('Match result creation error:', resultError);
        if (resultError && !resultError.message?.includes('relation "match_results" does not exist')) {
          throw new Error(`Failed to create match result: ${resultError.message}`);
        }
      }
    } catch (e: any) {
      console.log('Match results table not available:', e.message);
    }

    // Create game scores (skip if table doesn't exist)
    try {
      if (game_scores && game_scores.length > 0) {
        const gameScoreRecords = game_scores.map((score: any) => ({
          match_id: matchData.id,
          game_number: score.game_number,
          team1_score: score.team1_score,
          team2_score: score.team2_score
        }));

        const { error: scoresError } = await supabase
          .from('game_scores')
          .insert(gameScoreRecords);

        if (scoresError) {
          console.error('Game scores creation error:', scoresError);
          if (scoresError && !scoresError.message?.includes('relation "game_scores" does not exist')) {
            throw new Error(`Failed to create game scores: ${scoresError.message}`);
          }
        }
      }
    } catch (e: any) {
      console.log('Game scores table not available:', e.message);
    }

    // Calculate payments for all players (optional - depends on enhanced schema)
    let calculations: any[] = [];
    let paymentMessage = '';
    let totalRevenue = 0;
    let paymentDebug: any = {
      status: 'not_started',
      error: null
    };

    try {
      console.log('🔍 Starting payment calculation section...');
      const playerIds = participants.map((p: any) => p.member_id);
      console.log('👥 Player IDs to process:', playerIds);
      
      // Get member details
      console.log('📝 Fetching member details for payment calculation...');
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, name')
        .in('id', playerIds);

      if (membersError) {
        console.error('❌ Member details fetch failed:', membersError);
        throw new Error(`Failed to get member details: ${membersError?.message || 'Unknown error'}`);
      }

      if (!members) {
        throw new Error('No members found');
      }

      console.log('✅ Member details fetched:', members.length, 'members');

      // Try to get membership payments for current month
      let membershipPayments = [];
      try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        const { data: membershipData, error: membershipError } = await supabase
          .from('membership_payments')
          .select('*')
          .eq('month', currentMonth)
          .eq('year', currentYear)
          .in('member_id', playerIds);

        if (!membershipError && membershipData) {
          membershipPayments = membershipData || [];
        }
      } catch (e) {
        console.log('Membership payments table not available');
      }

      // Calculate payments with separate shuttlecock and attendance/membership structure
      const shuttlecockFeePerPlayer = (shuttlecock_count || 1) * 3000;
      const sessionDate = new Date(date);
      const currentMonth = sessionDate.getMonth() + 1;
      const currentYear = sessionDate.getFullYear();
      
      // Calculate days in current month to determine membership fee
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const weeksInMonth = Math.ceil(daysInMonth / 7);
      const membershipFee = weeksInMonth === 4 ? 40000 : 45000;
      
      // Check existing payments for this month to avoid duplicate attendance/membership fees
      let existingMemberPayments = new Set();
      try {
        const { data: existingPayments } = await supabase
          .from('payments')
          .select('member_id, type, due_date')
          .eq('type', 'monthly')
          .gte('due_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
          .lt('due_date', currentMonth === 12 ? `${currentYear + 1}-01-01` : `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);
        
        if (existingPayments && Array.isArray(existingPayments)) {
          existingPayments.forEach(p => existingMemberPayments.add(p.member_id));
        }
      } catch (e) {
        console.log('Could not check existing membership payments');
      }
      
      // Also check for daily attendance payments on this date
      let existingDailyPayments = new Set();
      try {
        const { data: dailyPayments } = await supabase
          .from('payments')
          .select('member_id, type')
          .eq('due_date', date)
          .eq('type', 'daily');
          
        if (dailyPayments && Array.isArray(dailyPayments)) {
          dailyPayments.forEach(p => existingDailyPayments.add(p.member_id));
        }
      } catch (e) {
        console.log('Could not check existing daily payments');
      }

      // Create separate payment records for shuttlecock and attendance/membership
      const paymentRecords = [];
      calculations = [];
      
      for (const member of members) {
        const participantMember = participants.find((p: any) => p.member_id === member.id);
        if (!participantMember) continue; // Skip if not a participant
        
        const memberId = member.id;
        const memberName = member.name;
        
        // 1. Always create shuttlecock payment (separate record)
        paymentRecords.push({
          member_id: memberId,
          amount: shuttlecockFeePerPlayer,
          type: 'daily', // Using 'daily' type (allowed by database constraint)
          status: 'pending',
          due_date: date,
          match_id: matchData.id,
          notes: `🏸 Shuttlecock Fee - Match (${date}) - ${shuttlecock_count} shuttlecock(s) @ Rp3,000 each`
        });
        
        // 2. Create separate attendance payment (only if member doesn't have active membership)
        let attendanceFee = 0;
        
        // Check if member has active monthly membership this month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
        
        const { data: memberMembership } = await supabase
          .from('payments')
          .select('id, status, amount')
          .eq('member_id', memberId)
          .eq('type', 'monthly')
          .gte('due_date', firstDayOfMonth)
          .lte('due_date', lastDayOfMonth)
          .single();
        
        const hasMembershipThisMonth = memberMembership && (memberMembership.status === 'paid' || memberMembership.status === 'pending');
        const hasAttendanceToday = existingDailyPayments.has(memberId);
        
        console.log(`🔍 Member ${memberName} membership check:`, {
          hasMembershipThisMonth,
          hasAttendanceToday,
          membershipRecord: memberMembership
        });
        
        if (!hasMembershipThisMonth && !hasAttendanceToday) {
          // 🔍 DUPLICATE DETECTION: Check if creating session payment would cause duplicates
          const wouldBeDuplicate = await PaymentDuplicateDetector.wouldCreateDuplicate(memberId, 'daily', date);
          
          if (wouldBeDuplicate) {
            console.log(`⚠️ ${memberName} - Session payment would be duplicate, skipping creation`);
            
            // Run cleanup for this member to remove any existing duplicates
            const cleanupResult = await PaymentDuplicateDetector.detectAndResolveDuplicates(memberId, date);
            if (cleanupResult.duplicatesRemoved > 0) {
              console.log(`🧹 Cleaned up ${cleanupResult.duplicatesRemoved} duplicate payments for ${memberName}`);
            }
          } else {
            attendanceFee = 18000;
            
            // Create separate attendance payment record
            paymentRecords.push({
              member_id: memberId,
              amount: 18000,
              type: 'daily', // Using 'daily' type (can be converted to 'monthly' later)
              status: 'pending',
              due_date: date,
              match_id: matchData.id,
              notes: `📅 Daily Session Fee (${date}) - Can convert to monthly membership (Rp${membershipFee.toLocaleString('id-ID')}) for ${weeksInMonth} weeks`
            });
            
            console.log(`💰 Created session payment for ${memberName}: Rp${attendanceFee.toLocaleString('id-ID')}`);
          }
        } else if (hasMembershipThisMonth) {
          console.log(`✅ ${memberName} has active membership - no session fee required`);
          
          // 🔍 CLEANUP: Even with membership, check for any duplicate session payments
          const cleanupResult = await PaymentDuplicateDetector.detectAndResolveDuplicates(memberId, date);
          if (cleanupResult.duplicatesRemoved > 0) {
            console.log(`🧹 Cleaned up ${cleanupResult.duplicatesRemoved} conflicting session payments for ${memberName}`);
          }
        }
        
        // Add to calculations for summary
        calculations.push({
          member_id: memberId,
          member_name: memberName,
          total_due: shuttlecockFeePerPlayer + attendanceFee,
          shuttlecock_fee: shuttlecockFeePerPlayer,
          attendance_fee: attendanceFee,
          has_membership: hasMembershipThisMonth,
          membership_fee_option: membershipFee,
          weeks_in_month: weeksInMonth
        });
      }
      
      totalRevenue = calculations.reduce((sum, calc) => sum + calc.total_due, 0);
      
      console.log('💰 Separate payment structure calculations:', calculations);
      console.log('📋 Payment records to create:', paymentRecords);
      console.log('🔢 Total payment records count:', paymentRecords.length);

      // Try to create separate payment records (shuttlecock + attendance/membership)
      paymentDebug = {
        paymentRecordsCount: paymentRecords.length,
        paymentRecords: paymentRecords,
        insertionAttempted: false,
        insertionError: null,
        insertionSuccess: false,
        insertedCount: 0
      };
      
      try {

        if (paymentRecords.length === 0) {
          paymentDebug.insertionError = 'No payment records generated';
        } else {
          paymentDebug.insertionAttempted = true;
          
          const { data: insertResult, error: paymentsError } = await supabase
            .from('payments')
            .insert(paymentRecords)
            .select();

          if (paymentsError) {
            paymentDebug.insertionError = paymentsError;
            paymentDebug.insertionSuccess = false;
          } else {
            paymentDebug.insertionSuccess = true;
            paymentDebug.insertedCount = insertResult?.length || 0;
          }
        }
      } catch (e: any) {
        paymentDebug.insertionError = {
          message: e?.message,
          stack: e?.stack
        };
      }

      // Generate payment summary
      paymentMessage = PaymentCalculationService.generatePaymentMessage(calculations, date);
      totalRevenue = calculations.reduce((sum, calc) => sum + calc.total_due, 0);
      
      console.log('✅ Payment calculation section completed successfully!');
      console.log('📊 Final calculations:', calculations.length, 'players processed');
      console.log('💰 Total revenue calculated:', totalRevenue);

    } catch (e: any) {
      console.log('❌ Payment calculation failed, continuing without payments:', e.message);
      console.error('❌ Full error details:', e);
      // Create simple mock calculation for 4 players
      const shuttlecockCost = (shuttlecock_count || 1) * 3000;
      totalRevenue = shuttlecockCost * 4; // 4 players
      paymentMessage = `Match completed with ${participants.length} players. Shuttlecock cost: Rp ${shuttlecockCost.toLocaleString('id-ID')} per player.`;
      calculations = []; // Clear any partial calculations
      console.log('🔄 Fallback calculations applied');
    }

    return NextResponse.json({
      success: true,
      data: {
        match: matchData,
        calculations,
        paymentMessage,
        totalRevenue: calculations.reduce((sum, calc) => sum + calc.total_due, 0)
      },
      debug: {
        message: 'Match creation completed',
        matchId: matchData.id,
        calculationsCount: calculations.length,
        paymentCalculationsGenerated: true,
        checkPaymentTableNow: true,
        paymentDebug: paymentDebug
      }
    });

  } catch (error: any) {
    console.error('Match creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Get matches for a specific date or all matches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const all = searchParams.get('all'); // New parameter to get all matches

    // If neither date nor all parameter is provided, require date for backward compatibility
    if (!date && !all) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required (or use ?all=true for all matches)' },
        { status: 400 }
      );
    }

    // Handle demo mode
    if (isDemoMode) {
      console.log('🎭 Demo mode: Returning mock matches for date:', date);
      return NextResponse.json({
        success: true,
        data: {
          matches: [],
          payments: []
        }
      });
    }

    // Get matches - either for specific date or all matches
    let matches = [];
    let matchesError = null;

    try {
      // Build query based on parameters
      let query = supabase
        .from('matches')
        .select('*');

      // Add date filter only if date is provided
      if (date) {
        query = query.eq('date', date);
      }

      // Order by date and time
      if (all) {
        query = query.order('date', { ascending: false }).order('time', { ascending: true });
      } else {
        query = query.order('time', { ascending: true });
      }

      const { data: basicMatches, error: basicError } = await query;

      if (basicError) {
        throw new Error(`Failed to get matches: ${basicError.message}`);
      }

      matches = basicMatches || [];

      // Try to get related data if tables exist
      for (let match of matches) {
        // Try to get participants
        try {
          const { data: participants } = await supabase
            .from('match_participants')
            .select(`
              *,
              members (id, name, email, role, membership_type)
            `)
            .eq('match_id', match.id);
          
          match.match_participants = participants || [];
        } catch (e) {
          console.log('Match participants table not available for match:', match.id);
          match.match_participants = [];
        }

        // Try to get results
        try {
          const { data: results } = await supabase
            .from('match_results')
            .select('*')
            .eq('match_id', match.id);
          
          match.match_results = results || [];
        } catch (e) {
          console.log('Match results table not available for match:', match.id);
          match.match_results = [];
        }

        // Try to get game scores
        try {
          const { data: scores } = await supabase
            .from('game_scores')
            .select('*')
            .eq('match_id', match.id)
            .order('game_number');
          
          match.game_scores = scores || [];
        } catch (e) {
          console.log('Game scores table not available for match:', match.id);
          match.game_scores = [];
        }
      }

    } catch (error: any) {
      matchesError = error;
    }

    if (matchesError) {
      throw new Error(`Failed to get matches: ${matchesError.message}`);
    }

    // Get payments - either for specific date or all recent payments
    let paymentsQuery = supabase
      .from('payments')
      .select(`
        *,
        members (id, name, email)
      `);

    if (date) {
      // Get payments for specific date
      paymentsQuery = paymentsQuery.eq('due_date', date).eq('type', 'daily');
    } else if (all) {
      // Get all payments related to matches (daily type) - limit to recent ones
      paymentsQuery = paymentsQuery
        .eq('type', 'daily')
        .order('due_date', { ascending: false })
        .limit(1000); // Reasonable limit
    }

    const { data: payments, error: paymentsError } = await paymentsQuery;

    if (paymentsError) {
      throw new Error(`Failed to get payments: ${paymentsError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        matches: matches || [],
        payments: payments || []
      }
    });

  } catch (error: any) {
    console.error('Get matches error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}