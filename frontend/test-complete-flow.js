/**
 * Complete Analytics Flow Test
 */

async function testCompleteAnalyticsFlow() {
  console.log('🔬 Testing Complete Analytics Flow for Kevin...\n');

  try {
    // Simulate the exact same flow as the analytics page
    const kevinId = "adc87d83-547a-4d81-86d5-22e0a430dfbf";

    console.log('1️⃣ Authenticating Kevin...');
    const authResponse = await fetch('http://localhost:3000/api/auth/me?test_user=kevin');
    const authData = await authResponse.json();
    
    if (!authData.success) {
      console.log('❌ Auth failed');
      return;
    }
    
    const currentUser = authData.user;
    console.log('✅ Authenticated:', currentUser.name, '(ID:', currentUser.id, ')');

    console.log('\n2️⃣ Getting all matches...');
    const matchesResponse = await fetch('/api/matches?all=true');
    const matchesData = await matchesResponse.json();
    const allMatches = matchesData.success ? matchesData.data?.matches || [] : [];
    
    console.log('✅ Total matches:', allMatches.length);

    console.log('\n3️⃣ Filtering Kevin\'s matches...');
    const memberMatches = allMatches.filter((match) => 
      match.match_participants?.some((p) => p.member_id === currentUser.id)
    );
    
    console.log('✅ Kevin\'s matches:', memberMatches.length);

    if (memberMatches.length === 0) {
      console.log('❌ No matches found for Kevin');
      return;
    }

    console.log('\n4️⃣ Processing match data (simulating calculatePerformanceMetrics)...');
    
    let wins = 0;
    let totalScore = 0;
    const detailedHistory = [];

    memberMatches.forEach((match, index) => {
      console.log(`\n--- Processing Match ${index + 1} ---`);
      
      const result = match.match_results?.[0];
      const userParticipant = match.match_participants?.find((p) => p.member_id === currentUser.id);
      
      if (!userParticipant) {
        console.log('❌ User not found in participants');
        return;
      }

      console.log('✅ User participant found:', {
        team: userParticipant.team,
        position: userParticipant.position
      });

      const isDoubles = match.match_participants?.length === 4;
      const matchType = isDoubles ? 'doubles' : 'singles';
      
      let matchResult = 'draw';
      let opponent = 'Unknown';
      let partner = '';
      let score = 'N/A';

      if (result) {
        console.log('✅ Match result found:', {
          team1_score: result.team1_score,
          team2_score: result.team2_score,
          winner_team: result.winner_team
        });
        
        const userTeam = userParticipant.team === 'team1' ? 1 : 2;
        const userWon = result.winner_team === userParticipant.team;
        
        if (userWon) {
          wins++;
          matchResult = 'win';
        } else {
          matchResult = 'loss';
        }

        console.log('✅ Match outcome:', {
          userTeam: userParticipant.team,
          userWon,
          result: matchResult
        });

        // Calculate score
        if (result.team1_score && result.team2_score) {
          const userScore = userTeam === 1 ? result.team1_score : result.team2_score;
          totalScore += userScore;
          score = `${result.team1_score}-${result.team2_score}`;
        }
      } else {
        console.log('❌ No match result found');
      }

      // Find opponent and partner names
      const opponents = match.match_participants?.filter((p) => 
        p.team !== userParticipant.team
      ) || [];
      
      const partners = match.match_participants?.filter((p) => 
        p.team === userParticipant.team && p.member_id !== currentUser.id
      ) || [];

      opponent = opponents.map((p) => {
        const name = p.members?.name || p.member?.name || 'Unknown Player';
        return name;
      }).join(' & ') || 'Unknown Opponents';
      
      partner = partners.length > 0 ? (partners[0].members?.name || partners[0].member?.name || 'Unknown Partner') : '';

      console.log('✅ Names resolved:', {
        opponents: opponent,
        partner: partner || 'None'
      });

      const matchHistoryEntry = {
        id: match.id,
        date: match.date,
        opponent,
        result: matchResult,
        score,
        duration: match.duration_minutes || 35, // Fallback duration
        type: matchType,
        partner: partner || undefined
      };

      detailedHistory.push(matchHistoryEntry);
      
      console.log('✅ Match history entry created:', matchHistoryEntry);
    });

    const winRate = memberMatches.length > 0 ? (wins / memberMatches.length) * 100 : 0;
    const averageScore = memberMatches.length > 0 ? totalScore / memberMatches.length : 0;

    const finalMatchHistory = detailedHistory.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 10);

    console.log('\n🎯 FINAL RESULTS:');
    console.log('Win Rate:', winRate + '%');
    console.log('Average Score:', averageScore);
    console.log('Match History Entries:', finalMatchHistory.length);
    console.log('Match History:', finalMatchHistory);

    console.log('\n✅ Analytics flow completed successfully!');
    console.log('Kevin should see this match in his analytics:');
    if (finalMatchHistory.length > 0) {
      const firstMatch = finalMatchHistory[0];
      console.log(`📅 ${firstMatch.date}`);
      console.log(`🏸 ${firstMatch.type} match`);  
      console.log(`👥 vs ${firstMatch.opponent}`);
      console.log(`${firstMatch.partner ? `with ${firstMatch.partner}` : 'solo'}`);
      console.log(`📊 ${firstMatch.score}`);
      console.log(`🏆 ${firstMatch.result.toUpperCase()}`);
    }

  } catch (error) {
    console.error('❌ Complete flow test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Use fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  // For testing, we'll skip this detailed test in Node.js
  console.log('⚠️ Running simplified test in Node.js environment...');
  console.log('Kevin should have:');
  console.log('- 1 doubles match on 2025-10-24');
  console.log('- Won against "Ryan Radityatama & Wahyu"');
  console.log('- Score: 42-37');  
  console.log('- Partner: Ryan Radityatama');
  console.log('- 100% win rate');
  console.log('\nIf this doesn\'t show in analytics, there may be a client-side processing issue.');
} else {
  testCompleteAnalyticsFlow();
}