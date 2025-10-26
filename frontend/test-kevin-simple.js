const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testKevinAttendanceSimple() {
  console.log('🎯 SIMPLE TEST: Kevin Attendance Calculation');
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

    // 2. Get Kevin's match participations
    const { data: participations, error: partError } = await supabase
      .from('match_participants')
      .select('match_id, team')
      .eq('member_id', members.id);

    if (partError) {
      console.log('❌ Error fetching participations:', partError.message);
      return;
    }

    console.log('📊 Kevin\'s match participations:', participations?.length || 0);

    if (!participations || participations.length === 0) {
      console.log('❌ No match participations found for Kevin');
      return;
    }

    // 3. Get match details for each participation
    const matchDetails = [];
    for (const participation of participations) {
      // Get match basic info
      const { data: matchInfo, error: matchError } = await supabase
        .from('matches')
        .select('id, date, type, status')
        .eq('id', participation.match_id)
        .single();

      if (matchError) {
        console.log('❌ Error fetching match:', participation.match_id, matchError.message);
        continue;
      }

      // Get match results
      const { data: matchResult, error: resultError } = await supabase
        .from('match_results')
        .select('team1_score, team2_score, winner_team')
        .eq('match_id', participation.match_id)
        .single();

      if (resultError) {
        console.log('❌ Error fetching result:', participation.match_id, resultError.message);
        continue;
      }

      // Combine data
      const userScore = participation.team === 'team1' ? matchResult.team1_score : matchResult.team2_score;
      const opponentScore = participation.team === 'team1' ? matchResult.team2_score : matchResult.team1_score;
      const won = matchResult.winner_team === participation.team;

      matchDetails.push({
        date: matchInfo.date,
        userScore,
        opponentScore,
        won,
        team: participation.team,
        type: matchInfo.type,
        status: matchInfo.status
      });
    }

    console.log('\n📋 Kevin\'s Match Details:');
    matchDetails.forEach((match, index) => {
      const date = new Date(match.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      console.log(`   Match ${index + 1}: ${match.date} (${dayName}) - Score: ${match.userScore}-${match.opponentScore} ${match.won ? 'WIN' : 'LOSS'}`);
    });

    // 4. ATTENDANCE CALCULATION (same logic as analytics page)
    const memberMatches = matchDetails;
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

    // 5. Check if Kevin's match was on a Saturday
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
      console.log('\n📊 Analytics Page Should Show:');
      console.log(`   • Attendance Rate: ${Math.round(calculatedAttendanceRate)}%`);
      console.log(`   • Win Rate: ${Math.round((matchDetails.filter(m => m.won).length / matchDetails.length) * 100)}%`);
      console.log(`   • Total Matches: ${matchDetails.length}`);
    } else {
      console.log('❌ ISSUE: Still showing 0% - needs investigation');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testKevinAttendanceSimple();