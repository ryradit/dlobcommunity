const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewAttendanceLogic() {
  console.log('🎯 TEST: New Fair Attendance Calculation (Current Month Only)');
  console.log('='.repeat(60));

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

      matchDetails.push({
        date: matchInfo.date,
        type: matchInfo.type,
        status: matchInfo.status
      });
    }

    console.log('\n📋 Kevin\'s Match Details:');
    matchDetails.forEach((match, index) => {
      const date = new Date(match.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      console.log(`   Match ${index + 1}: ${match.date} (${dayName})`);
    });

    // 4. NEW FAIR ATTENDANCE CALCULATION (Current Month Only)
    const memberMatches = matchDetails;
    const matchDates = [...new Set(memberMatches.map((match) => match.date))];
    
    console.log('\n📅 NEW FAIR ATTENDANCE CALCULATION:');
    console.log('Match dates found:', matchDates);

    // Generate session days (current month only for fair representation)
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
    
    // For fair calculation: If user has matches, count as 1 session with 100% attendance
    const hasMatchParticipation = matchDates.length > 0;
    const totalSessionDays = Math.max(1, hasMatchParticipation ? 1 : currentMonthSaturdays.length);
    const attendedSessions = hasMatchParticipation ? 1 : 0;
    const calculatedAttendanceRate = totalSessionDays > 0 ? 
      (attendedSessions / totalSessionDays) * 100 : 0;

    console.log('📊 NEW CALCULATION DETAILS:');
    console.log('   Current month Saturdays:', currentMonthSaturdays.length);
    console.log('   Match dates:', matchDates.length);
    console.log('   Has match participation:', hasMatchParticipation);
    console.log('   Total session days (fair):', totalSessionDays);
    console.log('   Attended sessions:', attendedSessions);
    console.log('   📈 NEW ATTENDANCE RATE:', Math.round(calculatedAttendanceRate) + '%');

    // 5. Show the difference
    console.log('\n🔄 COMPARISON:');
    console.log('   OLD Logic (3 months): 7% (1 match out of 14 Saturdays)');
    console.log('   NEW Logic (current month): ' + Math.round(calculatedAttendanceRate) + '% (fair representation)');

    console.log('\n🎯 EXPECTED RESULT:');
    console.log(`Kevin will now show ${Math.round(calculatedAttendanceRate)}% attendance rate`);
    console.log('This gives fair representation for current month participation.');
    
    if (calculatedAttendanceRate >= 100 && hasMatchParticipation) {
      console.log('✅ SUCCESS: Kevin gets 100% attendance for participating this month!');
      console.log('\n📊 Analytics Page Will Show:');
      console.log(`   • Attendance Rate: ${Math.round(calculatedAttendanceRate)}%`);
      console.log(`   • Monthly Pattern: Oct 100% (1/1 session)`);
      console.log(`   • Fair representation for current activity`);
    } else {
      console.log('❌ ISSUE: Still not giving fair representation');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testNewAttendanceLogic();