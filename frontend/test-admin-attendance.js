const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminAttendanceSystem() {
  console.log('🎯 TEST: Admin Attendance System with Real Data');
  console.log('='.repeat(60));

  try {
    const selectedDate = '2025-10-24'; // Kevin's match date
    
    // 1. Get all members
    const { data: membersData, error: membersError } = await supabase
      .from('members')
      .select('*');

    if (membersError) {
      console.log('❌ Error loading members:', membersError.message);
      return;
    }

    console.log('✅ Members loaded:', membersData?.length || 0);

    // 2. Get matches for selected date
    const { data: allMatches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        date,
        match_participants (
          member_id,
          team
        )
      `);

    if (matchesError) {
      console.log('❌ Error loading matches:', matchesError.message);
      return;
    }

    console.log('✅ Total matches loaded:', allMatches?.length || 0);

    // 3. Filter matches for selected date
    const todayMatches = (allMatches || []).filter((match) => match.date === selectedDate);
    console.log(`📅 Matches on ${selectedDate}:`, todayMatches.length);

    // 4. Get match participants for selected date
    const todayMatchParticipants = new Set();
    const participantDetails = [];

    todayMatches.forEach((match) => {
      console.log(`🎾 Match ${match.id}:`);
      match.match_participants?.forEach((participant) => {
        todayMatchParticipants.add(participant.member_id);
        const member = membersData?.find(m => m.id === participant.member_id);
        if (member) {
          participantDetails.push({
            id: member.id,
            name: member.name,
            email: member.email,
            team: participant.team
          });
          console.log(`   📊 ${member.name} (${participant.team})`);
        }
      });
    });

    console.log('\n📊 ATTENDANCE CALCULATION:');
    console.log(`   Total members: ${membersData?.length || 0}`);
    console.log(`   Match participants on ${selectedDate}: ${todayMatchParticipants.size}`);
    console.log(`   Auto-attendance rate: ${Math.round((todayMatchParticipants.size / (membersData?.length || 1)) * 100)}%`);

    // 5. Show automatic attendance records
    console.log('\n🎯 AUTOMATIC ATTENDANCE RECORDS:');
    participantDetails.forEach((participant, index) => {
      console.log(`   ${index + 1}. ${participant.name}`);
      console.log(`      📧 Email: ${participant.email}`);
      console.log(`      🏆 Method: Match Participation`);
      console.log(`      ✅ Status: Present (Auto)`);
      console.log(`      📝 Notes: Automatically marked present through match participation`);
      console.log('');
    });

    // 6. Check Kevin specifically
    const kevin = membersData?.find(m => m.email === 'kevinharyono55@gmail.com');
    if (kevin) {
      const kevinParticipated = todayMatchParticipants.has(kevin.id);
      console.log('🎯 KEVIN\'S ATTENDANCE:');
      console.log(`   📊 Kevin ID: ${kevin.id}`);
      console.log(`   📧 Email: ${kevin.email}`);
      console.log(`   🏆 Participated in match: ${kevinParticipated ? 'YES' : 'NO'}`);
      console.log(`   ✅ Attendance status: ${kevinParticipated ? 'PRESENT (Auto)' : 'Not marked'}`);
      
      if (kevinParticipated) {
        console.log('   📝 This will show in admin attendance as:');
        console.log('      - Status: Present');
        console.log('      - Method: Match Participation');
        console.log('      - Badge: "Match" indicator');
        console.log('      - Action: "Auto-generated" (cannot edit)');
      }
    }

    console.log('\n🎯 EXPECTED ADMIN DASHBOARD BEHAVIOR:');
    console.log('✅ When admin creates a match:');
    console.log('   1. Match participants automatically get "present" attendance');
    console.log('   2. Attendance shows "Match Participation" as check-in method');
    console.log('   3. Records are marked as "Auto-generated" and cannot be edited');
    console.log('   4. Orange "Match" badge appears next to participant names');
    console.log('   5. Attendance rate calculations include match participants');
    
    console.log('\n✅ Fair attendance system benefits:');
    console.log('   - No double work: Create match = attendance automatically handled');
    console.log('   - Fair representation: Playing matches counts as attendance');
    console.log('   - Clear indicators: Easy to see match vs manual attendance');
    console.log('   - Accurate metrics: Attendance rates reflect real engagement');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAdminAttendanceSystem();