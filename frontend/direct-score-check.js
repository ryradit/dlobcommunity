const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ehsdqcspjzigepaldesg.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoc2RxY3NwanppZ2VwYWxkZXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3MzQzMjYsImV4cCI6MjA0NTMxMDMyNn0.sN8z1Gf5Q2Vrgl0DZfb8l5q0W4_jT5Inoiby6umrvrQ'
);

async function directScoreCheck() {
  console.log('🔍 Direct Score Check for Winner Logic');
  
  // Get all matches first
  const { data: allMatches } = await supabase
    .from('matches')
    .select(`
      id, date,
      match_participants(member_id, team, members(name)),
      match_results(team1_score, team2_score, winner_team)
    `);

  console.log('Total matches found:', allMatches?.length || 0);
  
  if (allMatches && allMatches.length > 0) {
    const kevinId = 'adc87d83-547a-4d81-86d5-22e0a430dfbf';
    
    // Find Kevin's matches
    const kevinMatches = allMatches.filter(match => 
      match.match_participants?.some(p => p.member_id === kevinId)
    );
    
    console.log('Kevin matches found:', kevinMatches.length);
    
    kevinMatches.forEach((match, i) => {
      const result = match.match_results?.[0];
      const kevinParticipant = match.match_participants?.find(p => p.member_id === kevinId);
      
      console.log(`\n--- Kevin Match ${i + 1} ---`);
      console.log('Date:', match.date);
      console.log('Kevin Team:', kevinParticipant?.team);
      console.log('Team 1 Score:', result?.team1_score, '(type:', typeof result?.team1_score, ')');
      console.log('Team 2 Score:', result?.team2_score, '(type:', typeof result?.team2_score, ')');
      console.log('Winner Team:', result?.winner_team, '(type:', typeof result?.winner_team, ')');
      
      if (result && kevinParticipant) {
        // Current logic in analytics (using winner_team)
        const currentResult = result.winner_team === kevinParticipant.team ? 'WIN' : 'LOSS';
        
        // New logic (using scores)
        let newResult = 'UNKNOWN';
        if (result.team1_score != null && result.team2_score != null) {
          const kevinTeam = kevinParticipant.team === 'team1' ? 1 : 2;
          const kevinScore = kevinTeam === 1 ? result.team1_score : result.team2_score;
          const opponentScore = kevinTeam === 1 ? result.team2_score : result.team1_score;
          
          newResult = kevinScore > opponentScore ? 'WIN' : 'LOSS';
          
          console.log('Kevin Team Number:', kevinTeam);
          console.log('Kevin Score:', kevinScore);
          console.log('Opponent Score:', opponentScore);
        }
        
        console.log('Current Logic Result:', currentResult);
        console.log('New Score Logic Result:', newResult);
        console.log('Fixed?:', currentResult !== newResult ? '✅ YES' : '❌ No change needed');
      }
    });
  }
}

directScoreCheck().catch(console.error);