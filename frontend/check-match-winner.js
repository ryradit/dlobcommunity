const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ehsdqcspjzigepaldesg.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoc2RxY3NwanppZ2VwYWxkZXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3MzQzMjYsImV4cCI6MjA0NTMxMDMyNn0.sN8z1Gf5Q2Vrgl0DZfb8l5q0W4_jT5Inoiby6umrvrQ'
);

async function checkMatches() {
  console.log('🔍 Checking Kevin\'s Match with Winner Logic');
  
  const { data: matches } = await supabase
    .from('matches')
    .select('id, date, match_results(team1_score, team2_score, winner_team)')
    .order('date', { ascending: false })
    .limit(5);

  console.log('Recent matches found:', matches?.length || 0);
  
  matches?.forEach((match, i) => {
    const result = match.match_results?.[0];
    console.log(`\nMatch ${i + 1}:`);
    console.log('  Date:', match.date);
    console.log('  Team 1 Score:', result?.team1_score);
    console.log('  Team 2 Score:', result?.team2_score);
    console.log('  Stored Winner Team:', result?.winner_team);
    
    if (result?.team1_score && result?.team2_score) {
      const actualWinner = result.team1_score > result.team2_score ? 'team1' : 'team2';
      console.log('  Actual Winner (by score):', actualWinner);
      console.log('  Logic Fixed?:', actualWinner === result.winner_team ? 'Correct' : 'NEEDS FIX');
    }
  });
}

checkMatches().catch(console.error);