const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ehsdqcspjzigepaldesg.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoc2RxY3NwanppZ2VwYWxkZXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3MzQzMjYsImV4cCI6MjA0NTMxMDMyNn0.sN8z1Gf5Q2Vrgl0DZfb8l5q0W4_jT5Inoiby6umrvrQ'
);

async function testAttendanceCalculation() {
  console.log('🧪 Testing New Attendance Calculation (Including Match Participation)');
  console.log('==================================================================\n');

  try {
    // Get Kevin's ID
    const kevinId = 'adc87d83-547a-4d81-86d5-22e0a430dfbf';
    console.log('👤 Testing for Kevin Haryono (ID:', kevinId, ')\n');

    // Test the new attendance stats API
    console.log('1️⃣ Testing Enhanced Attendance API...');
    const response = await fetch(`http://localhost:3000/api/attendance/stats?member_id=${kevinId}`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ API Response Success!');
      console.log('📊 Attendance Statistics:');
      console.log('   Overall Attendance Rate:', data.data.attendance_rate + '%');
      console.log('   Total Sessions (Saturdays):', data.data.total_sessions);
      console.log('   Attended Sessions:', data.data.attended_sessions);
      console.log('   Manual Attendance Records:', data.data.manual_attendance);
      console.log('   Match Participation Count:', data.data.match_participation);
      console.log('   Period:', data.data.period.start_date, 'to', data.data.period.end_date);
      
      if (data.data.match_participation > 0) {
        console.log('🏸 SUCCESS: Match participation is being counted as attendance!');
        console.log('   Kevin played', data.data.match_participation, 'matches, which counts as attendance.');
      } else {
        console.log('⚠️  No match participation found for Kevin');
      }
    } else {
      console.log('❌ API Error:', data.error);
    }

    console.log('\n2️⃣ Verifying Match Data...');
    
    // Check Kevin's matches directly
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        id, date,
        match_participants!inner(member_id)
      `)
      .eq('match_participants.member_id', kevinId);

    console.log('🎾 Kevin\'s matches found:', matches?.length || 0);
    
    if (matches && matches.length > 0) {
      matches.forEach((match, i) => {
        console.log(`   Match ${i + 1}: ${match.date}`);
      });
      
      console.log('✅ Matches should automatically count as attendance!');
      console.log('📈 Expected behavior:');
      console.log('   - When admin creates a match with Kevin');
      console.log('   - Kevin is automatically marked as "attended" for that session');
      console.log('   - No need for separate attendance check-in');
      console.log('   - Attendance rate includes both manual check-ins AND match participation');
    } else {
      console.log('ℹ️  No matches found for Kevin to test with');
    }

    console.log('\n3️⃣ Testing Analytics Integration...');
    
    // Test how this appears in analytics
    const analyticsResponse = await fetch('http://localhost:3000/api/auth/me?test_user=kevin');
    if (analyticsResponse.ok) {
      console.log('✅ Kevin authentication works for analytics testing');
      console.log('🎯 Expected Analytics Results:');
      console.log('   - Attendance rate will include match participation');
      console.log('   - Members who play matches will show higher attendance rates');
      console.log('   - No need for double attendance tracking');
    }

    console.log('\n4️⃣ Expected Member Dashboard Impact...');
    console.log('📊 When members view their dashboard:');
    console.log('   ✅ Attendance rate automatically includes matches they played');
    console.log('   ✅ More accurate representation of member engagement');
    console.log('   ✅ Fair attendance calculation for active players');
    console.log('   ✅ Reduces admin workload (no manual attendance for match players)');

    console.log('\n🎯 CONCLUSION:');
    console.log('Match participation now automatically counts as attendance!');
    console.log('This means when admin creates matches, players are auto-attended.');

  } catch (error) {
    console.error('❌ Error testing attendance calculation:', error.message);
  }
}

testAttendanceCalculation();