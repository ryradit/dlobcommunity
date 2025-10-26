// Debug Kevin's attendance calculation
console.log('🧪 Debugging Kevin\'s Attendance Rate Issue');
console.log('===============================================\n');

async function debugKevinAttendance() {
  try {
    // Step 1: Check if Kevin has any matches
    console.log('1️⃣ Checking Kevin\'s match participation...');
    
    const matchesResponse = await fetch('http://localhost:3000/api/matches?all=true');
    const matchesData = await matchesResponse.json();
    
    if (matchesData.success) {
      const allMatches = matchesData.data?.matches || [];
      console.log('✅ Total matches in database:', allMatches.length);
      
      const kevinId = 'adc87d83-547a-4d81-86d5-22e0a430dfbf';
      const kevinMatches = allMatches.filter(match => 
        match.match_participants?.some(p => p.member_id === kevinId)
      );
      
      console.log('🎾 Kevin\'s matches found:', kevinMatches.length);
      kevinMatches.forEach((match, i) => {
        console.log(`   Match ${i + 1}: ${match.date}`);
      });
      
      if (kevinMatches.length === 0) {
        console.log('❌ PROBLEM: Kevin has no matches, so attendance rate would be 0%');
        return;
      }
    } else {
      console.log('❌ Failed to fetch matches');
      return;
    }
    
    // Step 2: Test the attendance API directly  
    console.log('\n2️⃣ Testing attendance API for Kevin...');
    
    // This should work with test_user parameter
    const authResponse = await fetch('http://localhost:3000/api/auth/me?test_user=kevin');
    if (authResponse.ok) {
      const authData = await authResponse.json();
      if (authData.success) {
        const kevinId = authData.user.id;
        console.log('✅ Kevin authenticated, ID:', kevinId);
        
        // Now test attendance stats - but this will fail without proper auth
        console.log('⚠️ Attendance API requires authentication, so it returns 0%');
        console.log('   The analytics page gets 0% because API call fails');
        console.log('   Need to make attendance calculation work in frontend fallback');
      }
    }
    
    // Step 3: Show what should happen
    console.log('\n3️⃣ Expected Behavior:');
    console.log('✅ Kevin played 1 match on 2025-10-24 (doubles)');
    console.log('✅ This should count as 1 attended session');
    console.log('✅ Against ~13 Saturdays in last 3 months = ~8% attendance rate');
    console.log('');
    console.log('🔧 SOLUTION NEEDED:');
    console.log('   - Make attendance calculation work in frontend fallback');
    console.log('   - Ensure match participation is properly counted');
    console.log('   - Update UI to reflect "doubles only" community');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugKevinAttendance();