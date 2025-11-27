const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAttendanceRecordsForDate() {
  const selectedDate = '2025-10-24';
  console.log('🔍 Testing attendance records for:', selectedDate);
  
  try {
    // Get matches with participants for the date
    const { data: matches, error } = await supabase
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
      `)
      .eq('date', selectedDate);
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log('✅ Matches found:', matches?.length || 0);
    
    if (matches && matches.length > 0) {
      console.log('\n📊 Expected Attendance Records:');
      let recordCount = 0;
      
      matches.forEach((match, i) => {
        console.log(`\n🎾 Match ${i+1} (${match.id}):`);
        match.match_participants?.forEach(p => {
          const member = p.members;
          recordCount++;
          console.log(`   ${recordCount}. ${member?.name || 'Unknown'}`);
          console.log(`      📧 ${member?.email || 'No email'}`);
          console.log(`      👥 Team: ${p.team}`);
          console.log(`      ✅ Status: Present (Auto)`);
          console.log(`      🏆 Method: Match Participation`);
        });
      });
      
      console.log(`\n📈 SUMMARY:`);
      console.log(`   Total attendance records expected: ${recordCount}`);
      console.log(`   All should show as "Present" with "Match" badge`);
      
      // Check unique members
      const uniqueMembers = new Set();
      matches.forEach(match => {
        match.match_participants?.forEach(p => {
          uniqueMembers.add(p.member_id);
        });
      });
      
      console.log(`   Unique members with attendance: ${uniqueMembers.size}`);
      
    } else {
      console.log('❌ No matches found for this date - no attendance records will show');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAttendanceRecordsForDate();