/**
 * Verify Kevin's Analytics Data Loading
 */

async function verifyKevinAnalytics() {
  console.log('🎯 Verifying Kevin\'s Analytics Data Loading...\n');

  try {
    // 1. Test Authentication
    console.log('1️⃣ Testing Kevin\'s Authentication...');
    const authResponse = await fetch('http://localhost:3000/api/auth/me?test_user=kevin');
    const authData = await authResponse.json();
    
    if (!authData.success || !authData.user) {
      console.log('❌ Authentication failed');
      return;
    }
    
    const kevin = authData.user;
    console.log('✅ Kevin authenticated:', kevin.name, '(ID:', kevin.id, ')');

    // 2. Test Match Data Fetching
    console.log('\n2️⃣ Testing Match Data Fetching...');
    const matchesResponse = await fetch('http://localhost:3000/api/matches?all=true');
    const matchesData = await matchesResponse.json();
    
    if (!matchesData.success) {
      console.log('❌ Failed to fetch matches');
      return;
    }
    
    const allMatches = matchesData.data?.matches || [];
    console.log('✅ Total matches in database:', allMatches.length);
    
    // 3. Find Kevin's matches
    console.log('\n3️⃣ Analyzing Kevin\'s Match Participation...');
    const kevinMatches = allMatches.filter(match => 
      match.match_participants?.some(p => p.member_id === kevin.id)
    );
    
    console.log('✅ Kevin\'s matches found:', kevinMatches.length);
    
    if (kevinMatches.length > 0) {
      let wins = 0;
      let totalScore = 0;
      
      kevinMatches.forEach((match, index) => {
        const result = match.match_results?.[0];
        const kevinParticipant = match.match_participants?.find(p => p.member_id === kevin.id);
        
        if (result && kevinParticipant) {
          const kevinWon = kevinParticipant.team === result.winner_team;
          if (kevinWon) wins++;
          
          const kevinScore = kevinParticipant.team === 'team1' ? result.team1_score : result.team2_score;
          totalScore += kevinScore || 0;
          
          console.log(`   Match ${index + 1}: ${match.date}`);
          console.log(`     Kevin's team: ${kevinParticipant.team}`);
          console.log(`     Score: ${result.team1_score}-${result.team2_score}`);
          console.log(`     Result: ${kevinWon ? 'WIN' : 'LOSS'}`);
        }
      });
      
      const winRate = Math.round((wins / kevinMatches.length) * 100);
      const avgScore = totalScore / kevinMatches.length;
      
      console.log(`\n📊 Kevin's Performance Summary:`);
      console.log(`   Total Matches: ${kevinMatches.length}`);
      console.log(`   Wins: ${wins}`);
      console.log(`   Win Rate: ${winRate}%`);
      console.log(`   Average Score: ${avgScore.toFixed(1)}`);
    }
    
    // 4. Test Payment Data
    console.log('\n4️⃣ Testing Kevin\'s Payment Data...');
    const paymentsResponse = await fetch(`http://localhost:3000/api/payments?member_id=${kevin.id}`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    
    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      if (paymentsData.success) {
        const payments = paymentsData.data?.payments || paymentsData.data || [];
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        console.log('✅ Payment data loaded:', payments.length, 'payments, Total: Rp' + totalAmount.toLocaleString());
      }
    } else {
      console.log('⚠️ Payment data may need authentication');
    }
    
    console.log('\n🎉 Kevin\'s analytics data is ready!');
    console.log('📱 Visit: http://localhost:3000/dashboard/analytics?test_user=kevin');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Run verification
verifyKevinAnalytics();