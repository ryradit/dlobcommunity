const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testKevinAttendanceFinal() {
  console.log('🎯 FINAL TEST: Kevin Attendance Calculation');
  console.log('='.repeat(50));

  try {
    // 1. Find Kevin
    const { data: members, error: memberError } = await supabase
      .from('members')
      .select('id, name, email')
      .eq('email', 'kevinharyono55@gmail.com')
      .single();

    if (memberError || !members) {
      console.log('❌ Kevin not found:', memberError?.message || 'No data');
      return;
    }

    console.log('✅ Kevin found:', members.name, '(ID:', members.id, ')');

    // 2. Get Kevin's matches through match_participants
    const { data: participantData, error: participantError } = await supabase
      .from('match_participants')
      .select(`
        match_id,
        team,
        matches!inner(
          id,
          date,
          type,
          status
        ),
        match_results!inner(
          team1_score,
          team2_score,
          winner_team
        )
      `)
      .eq('member_id', members.id);

    if (participantError) {
      console.log('❌ Error fetching participant data:', participantError.message);
      return;
    }

    // Transform data to match expected format
    const matches = participantData?.map(p => ({
      id: p.matches.id,
      date: p.matches.date,
      match_type: p.matches.type,
      user_score: p.team === 'team1' ? p.match_results.team1_score : p.match_results.team2_score,
      opponent_score: p.team === 'team1' ? p.match_results.team2_score : p.match_results.team1_score,
      winner_team: p.match_results.winner_team,
      user_team: p.team,
      status: p.matches.status
    })) || [];



    console.log('📊 Kevin\'s matches found:', matches?.length || 0);
    
    if (matches && matches.length > 0) {
      matches.forEach((match, index) => {
        const date = new Date(match.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const won = match.winner_team === match.user_team;
        console.log(`   Match ${index + 1}: ${match.date} (${dayName}) - Score: ${match.user_score}-${match.opponent_score} ${won ? 'WIN' : 'LOSS'}`);
      });
    }

    // 3. REPLICATE EXACT LOGIC from analytics page
    const memberMatches = matches || [];
    const matchDates = [...new Set(memberMatches.map((match) => match.date))];
    
    console.log('\n📅 ATTENDANCE CALCULATION:');
    console.log('Match dates found:', matchDates);

    // Generate session days (regular Saturdays)
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    
    // Get all Saturdays in last 3 months
    const allSaturdays = [];
    const current = new Date(threeMonthsAgo);
    
    // Find the first Saturday
    while (current.getDay() !== 6) { // 6 = Saturday
      current.setDate(current.getDate() + 1);
    }
    
    // Collect all Saturdays until now
    while (current <= now) {
      allSaturdays.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 7); // Next Saturday
    }

    // Include match dates as valid session days (flexible attendance)
    const allSessionDays = [...new Set([...allSaturdays, ...matchDates])].sort();
    
    const attendedSessions = matchDates.length; // All matches count as attendance
    const calculatedAttendanceRate = allSessionDays.length > 0 ? 
      (attendedSessions / allSessionDays.length) * 100 : 0;

    console.log('📊 CALCULATION DETAILS:');
    console.log('   Regular Saturdays (3 months):', allSaturdays.length);
    console.log('   Match dates:', matchDates.length);
    console.log('   Total session days (Saturdays + match dates):', allSessionDays.length);
    console.log('   Attended sessions (matches):', attendedSessions);
    console.log('   📈 ATTENDANCE RATE:', Math.round(calculatedAttendanceRate) + '%');

    // 4. Check if Kevin's match was on a Saturday
    if (matchDates.length > 0) {
      matchDates.forEach(matchDate => {
        const date = new Date(matchDate);
        const dayOfWeek = date.getDay();
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
        const isSaturday = dayOfWeek === 6;
        
        console.log(`   Match on ${matchDate}: ${dayName} ${isSaturday ? '✅ (Regular session day)' : '⚠️  (Non-regular day)'}`);
      });
    }

    console.log('\n🎯 EXPECTED RESULT:');
    console.log(`Kevin should show ${Math.round(calculatedAttendanceRate)}% attendance rate`);
    console.log('This includes his match participation as valid attendance.');
    
    if (calculatedAttendanceRate > 0) {
      console.log('✅ SUCCESS: Kevin will no longer show 0% attendance!');
    } else {
      console.log('❌ ISSUE: Still showing 0% - needs investigation');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testKevinAttendanceFinal();