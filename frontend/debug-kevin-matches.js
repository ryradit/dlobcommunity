/**
 * Debug Kevin's Match History Data
 */

async function debugKevinMatchHistory() {
  console.log('🔍 Debugging Kevin\'s Match History Data...\n');

  try {
    const kevinId = "adc87d83-547a-4d81-86d5-22e0a430dfbf";

    // 1. Get Kevin's auth data
    console.log('1️⃣ Getting Kevin\'s authentication...');
    const authResponse = await fetch('http://localhost:3000/api/auth/me?test_user=kevin');
    const authData = await authResponse.json();
    
    if (!authData.success) {
      console.log('❌ Auth failed');
      return;
    }
    
    console.log('✅ Kevin ID from auth:', authData.user.id);
    console.log('✅ Matches expected user ID:', kevinId, '(should match)');
    
    // 2. Get all matches
    console.log('\n2️⃣ Fetching all matches...');
    const matchesResponse = await fetch('http://localhost:3000/api/matches?all=true');
    const matchesData = await matchesResponse.json();
    
    if (!matchesData.success) {
      console.log('❌ Matches fetch failed');
      return;
    }
    
    const allMatches = matchesData.data?.matches || [];
    console.log('✅ Total matches in database:', allMatches.length);
    
    if (allMatches.length === 0) {
      console.log('❌ No matches found in database');
      return;
    }
    
    // 3. Analyze each match for Kevin
    console.log('\n3️⃣ Analyzing matches for Kevin...');
    
    allMatches.forEach((match, index) => {
      console.log(`\n--- Match ${index + 1} ---`);
      console.log('Match ID:', match.id);
      console.log('Date:', match.date);
      console.log('Participants:', match.match_participants?.length || 0);
      
      if (match.match_participants) {
        match.match_participants.forEach((p, pIndex) => {
          console.log(`  Participant ${pIndex + 1}:`, {
            member_id: p.member_id,
            name: p.members?.name || p.member?.name || 'Unknown',
            team: p.team,
            isKevin: p.member_id === kevinId
          });
        });
        
        const kevinParticipant = match.match_participants.find(p => p.member_id === kevinId);
        if (kevinParticipant) {
          console.log('✅ Kevin found in this match!');
          console.log('   Kevin\'s team:', kevinParticipant.team);
          
          // Get opponents
          const opponents = match.match_participants.filter(p => p.team !== kevinParticipant.team);
          const partner = match.match_participants.find(p => 
            p.team === kevinParticipant.team && p.member_id !== kevinId
          );
          
          console.log('   Opponents:', opponents.map(p => p.members?.name || p.member?.name || 'Unknown'));
          console.log('   Partner:', partner ? (partner.members?.name || partner.member?.name) : 'None');
          
          // Get match result
          if (match.match_results?.[0]) {
            const result = match.match_results[0];
            const kevinWon = kevinParticipant.team === result.winner_team;
            console.log('   Score:', `${result.team1_score}-${result.team2_score}`);
            console.log('   Winner team:', result.winner_team);
            console.log('   Kevin won:', kevinWon ? 'YES' : 'NO');
          } else {
            console.log('   No match result found');
          }
        } else {
          console.log('❌ Kevin NOT found in this match');
        }
      } else {
        console.log('❌ No participants found for this match');
      }
    });

    // 4. Test the calculation function logic
    console.log('\n4️⃣ Expected Match History Processing...');
    const kevinMatches = allMatches.filter(match => 
      match.match_participants?.some(p => p.member_id === kevinId)
    );
    
    console.log('Kevin\'s matches found:', kevinMatches.length);
    
    if (kevinMatches.length > 0) {
      console.log('Expected match history entries:');
      kevinMatches.forEach((match, index) => {
        const result = match.match_results?.[0];
        const kevinParticipant = match.match_participants?.find(p => p.member_id === kevinId);
        
        if (kevinParticipant && result) {
          const opponents = match.match_participants?.filter(p => p.team !== kevinParticipant.team) || [];
          const opponentNames = opponents.map(p => p.members?.name || p.member?.name || 'Unknown').join(' & ');
          const kevinWon = kevinParticipant.team === result.winner_team;
          
          console.log(`  Match ${index + 1}:`, {
            date: match.date,
            opponent: opponentNames,
            result: kevinWon ? 'win' : 'loss',
            score: `${result.team1_score}-${result.team2_score}`,
            type: match.match_participants?.length === 4 ? 'doubles' : 'singles'
          });
        }
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run debug
debugKevinMatchHistory();