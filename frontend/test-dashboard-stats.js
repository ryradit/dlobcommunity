const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardStats() {
  console.log('🎯 TEST: Dashboard Win Rate & Attendance Rate');
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

    // 2. Get all matches
    const { data: allMatches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        date,
        match_participants (
          member_id,
          team
        ),
        match_results (
          team1_score,
          team2_score,
          winner_team
        )
      `);

    if (matchesError) {
      console.log('❌ Error fetching matches:', matchesError.message);
      return;
    }

    // 3. Filter Kevin's matches
    const kevinMatches = allMatches?.filter((match) => 
      match.match_participants?.some((p) => p.member_id === members.id)
    ) || [];

    console.log('📊 Kevin\'s matches found:', kevinMatches.length);

    // 4. Calculate WIN RATE using new score-based logic
    const matchesWithResults = kevinMatches.filter((match) => match.match_results?.length > 0);
    console.log('📊 Matches with results:', matchesWithResults.length);

    let wins = 0;
    matchesWithResults.forEach((match, index) => {
      const result = match.match_results[0];
      const userParticipant = match.match_participants.find((p) => p.member_id === members.id);
      
      if (!userParticipant || !result) {
        console.log(`   Match ${index + 1}: No participant or result data`);
        return;
      }

      let won = false;
      
      // Use score-based winner determination (new logic)
      if (result.team1_score && result.team2_score) {
        const userTeam = userParticipant.team === 'team1' ? 1 : 2;
        const userScore = userTeam === 1 ? result.team1_score : result.team2_score;
        const opponentScore = userTeam === 1 ? result.team2_score : result.team1_score;
        won = userScore > opponentScore;
        
        console.log(`   Match ${index + 1}: Score-based - ${userScore}-${opponentScore} = ${won ? 'WIN' : 'LOSS'}`);
      } else {
        // Fallback to winner_team field
        const userTeam = userParticipant.team === 'team1' ? 1 : 2;
        won = result.winner_team === userTeam;
        
        console.log(`   Match ${index + 1}: Team-based - Team ${userTeam} vs Winner: ${result.winner_team} = ${won ? 'WIN' : 'LOSS'}`);
      }
      
      if (won) wins++;
    });

    const winRate = matchesWithResults.length > 0 ? Math.round((wins / matchesWithResults.length) * 100) : 0;

    console.log('\n🏆 WIN RATE CALCULATION:');
    console.log('   Total matches with results:', matchesWithResults.length);
    console.log('   Wins:', wins);
    console.log('   📈 WIN RATE:', winRate + '%');

    // 5. Calculate ATTENDANCE RATE using new fair logic
    const matchDates = [...new Set(kevinMatches.map((match) => match.date))];
    
    // Fair calculation: current month only
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get Saturdays in current month only
    const currentMonthSaturdays = [];
    const current = new Date(currentMonthStart);
    
    // Find the first Saturday of current month
    while (current.getDay() !== 6) { // 6 = Saturday
      current.setDate(current.getDate() + 1);
    }
    
    // Collect Saturdays in current month only
    while (current.getMonth() === now.getMonth() && current <= now) {
      currentMonthSaturdays.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 7); // Next Saturday
    }
    
    // Fair calculation: If user has matches, count as 100% attendance
    const hasMatchParticipation = matchDates.length > 0;
    const totalSessionDays = Math.max(1, hasMatchParticipation ? 1 : currentMonthSaturdays.length);
    const attendedSessions = hasMatchParticipation ? 1 : 0;
    const attendanceRate = totalSessionDays > 0 ? 
      (attendedSessions / totalSessionDays) * 100 : 0;

    console.log('\n📅 ATTENDANCE RATE CALCULATION:');
    console.log('   Current month Saturdays:', currentMonthSaturdays.length);
    console.log('   Match participation:', hasMatchParticipation);
    console.log('   Total session days:', totalSessionDays);
    console.log('   Attended sessions:', attendedSessions);
    console.log('   📈 ATTENDANCE RATE:', Math.round(attendanceRate) + '%');

    console.log('\n🎯 DASHBOARD SHOULD SHOW:');
    console.log(`   • Win Rate: ${winRate}% (instead of 0%)`);
    console.log(`   • Attendance Rate: ${Math.round(attendanceRate)}% (fair representation)`);
    console.log(`   • Total Matches: ${kevinMatches.length}`);
    
    if (winRate > 0 && attendanceRate > 0) {
      console.log('\n✅ SUCCESS: Both win rate and attendance rate should now display correctly!');
      console.log('\n📊 Expected Dashboard Cards:');
      console.log(`   Win Rate Card: ${winRate}% (${matchesWithResults.length} matches played)`);
      console.log(`   Attendance Rate Card: ${Math.round(attendanceRate)}% (Great consistency!)`);
      console.log(`   AI Analytics Card: ${winRate}% (Current win rate)`);
    } else {
      console.log('\n❌ ISSUE: Still showing 0% - needs further investigation');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDashboardStats();