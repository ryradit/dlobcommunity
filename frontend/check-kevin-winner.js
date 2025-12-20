const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ehsdqcspjzigepaldesg.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoc2RxY3NwanppZ2VwYWxkZXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3MzQzMjYsImV4cCI6MjA0NTMxMDMyNn0.sN8z1Gf5Q2Vrgl0DZfb8l5q0W4_jT5Inoiby6umrvrQ'
);

async function checkKevinSpecific() {
  console.log('🎯 Checking Kevin\'s Specific Match Winner Logic');
  
  // Get Kevin's ID
  const kevinId = 'adc87d83-547a-4d81-86d5-22e0a430dfbf';
  
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, date,
      match_participants(member_id, team, members(name)),
      match_results(team1_score, team2_score, winner_team)
    `)
    .eq('match_participants.member_id', kevinId);

  console.log('Kevin\'s matches:', matches?.length || 0);
  
  if (matches && matches.length > 0) {
    const match = matches[0];
    const result = match.match_results?.[0];
    const kevinParticipant = match.match_participants?.find(p => p.member_id === kevinId);
    
    console.log('\n📊 Match Details:');
    console.log('Date:', match.date);
    console.log('Kevin Team:', kevinParticipant?.team);
    console.log('Team 1 Score:', result?.team1_score, typeof result?.team1_score);
    console.log('Team 2 Score:', result?.team2_score, typeof result?.team2_score);
    console.log('Winner Team:', result?.winner_team, typeof result?.winner_team);
    
    // Test our logic
    if (result?.team1_score && result?.team2_score && kevinParticipant) {
      const kevinTeam = kevinParticipant.team === 'team1' ? 1 : 2;
      const kevinScore = kevinTeam === 1 ? result.team1_score : result.team2_score;
      const opponentScore = kevinTeam === 1 ? result.team2_score : result.team1_score;
      
      console.log('\n🧮 Score Logic:');
      console.log('Kevin Team Number:', kevinTeam);
      console.log('Kevin Score:', kevinScore, typeof kevinScore);
      console.log('Opponent Score:', opponentScore, typeof opponentScore);
      console.log('Kevin Won by Score?:', kevinScore > opponentScore);
      
      // Compare with winner_team logic
      const winnerByTeam = result.winner_team === kevinParticipant.team;
      console.log('\n🏆 Logic Comparison:');
      console.log('Winner by team field:', winnerByTeam);
      console.log('Winner by score:', kevinScore > opponentScore);
      console.log('Results match?:', winnerByTeam === (kevinScore > opponentScore));
    }
  }
}

checkKevinSpecific().catch(console.error);