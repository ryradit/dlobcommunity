const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ehsdqcspjzigepaldesg.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoc2RxY3NwanppZ2VwYWxkZXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3MzQzMjYsImV4cCI6MjA0NTMxMDMyNn0.sN8z1Gf5Q2Vrgl0DZfb8l5q0W4_jT5Inoiby6umrvrQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWinnerLogic() {
  console.log('🧪 Testing Winner Determination Logic');
  console.log('=====================================\n');

  try {
    // Get Kevin's match
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        *,
        match_participants(*, members(name)),
        match_results(*)
      `)
      .eq('date', '2025-10-24');

    if (!matches || matches.length === 0) {
      console.log('❌ No matches found for 2025-10-24');
      return;
    }

    const match = matches[0];
    const result = match.match_results?.[0];
    
    console.log('📊 Match Data:');
    console.log('   Date:', match.date);
    console.log('   Team 1 Score:', result?.team1_score);
    console.log('   Team 2 Score:', result?.team2_score);
    console.log('   Stored Winner Team:', result?.winner_team);
    console.log('');

    // Find Kevin's participation
    const kevinParticipant = match.match_participants?.find(p => 
      p.members?.name?.includes('Kevin') || p.members?.name?.includes('Haryono')
    );

    if (!kevinParticipant) {
      console.log('❌ Kevin not found in match participants');
      return;
    }

    console.log('👤 Kevin\'s Participation:');
    console.log('   Kevin Team:', kevinParticipant.team);
    console.log('   Kevin Member ID:', kevinParticipant.member_id);
    console.log('');

    // Test our new winner logic
    if (result?.team1_score && result?.team2_score) {
      const kevinTeam = kevinParticipant.team === 'team1' ? 1 : 2;
      const kevinScore = kevinTeam === 1 ? result.team1_score : result.team2_score;
      const opponentScore = kevinTeam === 1 ? result.team2_score : result.team1_score;
      
      console.log('🏆 Score-Based Winner Logic:');
      console.log('   Kevin\'s Team Score:', kevinScore);
      console.log('   Opponent Team Score:', opponentScore);
      console.log('   Kevin Won?:', kevinScore > opponentScore ? 'YES' : 'NO');
      console.log('   Result:', kevinScore > opponentScore ? 'WIN' : 'LOSS');
      console.log('');

      // Compare with old logic
      const oldLogic = result.winner_team === kevinParticipant.team;
      console.log('🔍 Comparison:');
      console.log('   Old Logic Result:', oldLogic ? 'WIN' : 'LOSS');
      console.log('   New Logic Result:', kevinScore > opponentScore ? 'WIN' : 'LOSS');
      console.log('   Fixed?:', (kevinScore > opponentScore) !== oldLogic ? 'YES ✅' : 'Same result');
      
      console.log('');
      console.log('🎯 Expected Analytics Display:');
      console.log('   Win Rate: 100% (1 win out of 1 match)');
      console.log('   Match Result: WIN');
      console.log('   Score Display: 42-37');
      console.log('   Match Status: Should show green "WIN" badge');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWinnerLogic();