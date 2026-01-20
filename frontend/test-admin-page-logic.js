const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the exact same logic as the admin attendance page
async function testAdminAttendancePageLogic() {
  console.log('🎯 TEST: Admin Attendance Page Logic Simulation');
  console.log('='.repeat(50));

  try {
    const selectedDate = '2025-10-24';
    
    console.log('🔄 Loading real attendance data for:', selectedDate);

    // 1. Get all members from Supabase
    const { data: membersData, error: membersError } = await supabase
      .from('members')
      .select('*');

    if (membersError) {
      console.error('❌ Error loading members:', membersError);
      return;
    }

    console.log('✅ Members loaded:', membersData?.length || 0);

    // 2. Get all matches to calculate match participation
    const { data: allMatches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        date,
        match_participants (
          member_id,
          team,
          members (
            id,
            name,
            email
          )
        )
      `);

    if (matchesError) {
      console.error('❌ Error loading matches:', matchesError);
      return;
    }

    console.log('✅ All matches loaded:', allMatches?.length || 0);

    // 5. Generate attendance records for selected date
    const dateAttendanceRecords = [];

    // Get matches on selected date
    const todayMatches = (allMatches || []).filter((match) => match.date === selectedDate);
    const todayMatchParticipants = new Set();

    console.log('📅 Processing attendance for date:', selectedDate);
    console.log('🎾 Matches found for date:', todayMatches.length);

    todayMatches.forEach((match) => {
      console.log(`🎾 Processing match ${match.id}:`);
      match.match_participants?.forEach((participant) => {
        todayMatchParticipants.add(participant.member_id);
        console.log(`   📊 Participant: ${participant.members?.name || 'Unknown'} (${participant.member_id})`);
      });
    });

    // Add match participants as present with unique records per match participation
    let recordIndex = 0;
    todayMatches.forEach((match) => {
      match.match_participants?.forEach((participant) => {
        const member = participant.members || membersData?.find(m => m.id === participant.member_id);
        if (member) {
          recordIndex++;
          dateAttendanceRecords.push({
            id: `match-${match.id}-${participant.member_id}-${recordIndex}`,
            memberId: member.id,
            memberName: member.name,
            sessionDate: selectedDate,
            checkInTime: 'Match participation',
            checkInMethod: 'match',
            status: 'present',
            notes: `Automatically marked present through match participation (Team: ${participant.team})`,
            isFromMatch: true
          });
        }
      });
    });

    console.log('📊 Final attendance records generated:', dateAttendanceRecords.length);
    console.log('📊 Records preview:', dateAttendanceRecords.slice(0, 3));

    // 6. Calculate session stats
    const totalMembers = membersData?.length || 0;
    const presentMembers = dateAttendanceRecords.filter(a => a.status === 'present').length;
    const absentMembers = totalMembers - presentMembers;
    const lateMembers = dateAttendanceRecords.filter(a => a.status === 'late').length;
    const attendanceRate = totalMembers > 0 ? Math.round(((presentMembers + lateMembers) / totalMembers) * 100) : 0;

    console.log('\n📊 EXPECTED ADMIN PAGE DISPLAY:');
    console.log('   Total Members:', totalMembers);
    console.log('   Present Members:', presentMembers);
    console.log('   Absent Members:', absentMembers);
    console.log('   Attendance Rate:', attendanceRate + '%');
    console.log('   Records in table:', dateAttendanceRecords.length);

    if (dateAttendanceRecords.length > 0) {
      console.log('\n📋 Sample Records:');
      dateAttendanceRecords.slice(0, 5).forEach((record, i) => {
        console.log(`   ${i+1}. ${record.memberName}`);
        console.log(`      Status: ${record.status}`);
        console.log(`      Method: ${record.checkInMethod}`);
        console.log(`      From Match: ${record.isFromMatch ? 'Yes' : 'No'}`);
        console.log(`      Notes: ${record.notes}`);
        console.log('');
      });
    } else {
      console.log('\n❌ No attendance records generated - this is the problem!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAdminAttendancePageLogic();