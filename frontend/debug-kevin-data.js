const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugKevinMatches() {
  console.log('🔍 DEBUG: Kevin\'s Match Data Structure');
  console.log('='.repeat(50));

  try {
    // 1. Find Kevin
    const { data: members, error: memberError } = await supabase
      .from('members')
      .select('id, name, email')
      .eq('email', 'kevinharyono55@gmail.com')
      .single();

    if (memberError || !members) {
      console.log('❌ Kevin not found:', memberError?.message || 'No data');
      return;
    }

    console.log('✅ Kevin found:', members.name, '(ID:', members.id, ')');

    // 2. Get Kevin's participations
    const { data: participations, error: partError } = await supabase
      .from('match_participants')
      .select('match_id, team')
      .eq('member_id', members.id);

    console.log('📊 Kevin\'s participations:', participations?.length || 0);
    
    if (!participations || participations.length === 0) {
      console.log('❌ No participations found');
      return;
    }

    // 3. Get match details for each participation
    for (const participation of participations) {
      console.log(`\n🎾 Match ID: ${participation.match_id}`);
      console.log(`   Kevin's team: ${participation.team}`);

      // Get match info
      const { data: matchInfo, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', participation.match_id)
        .single();

      if (matchError) {
        console.log(`   ❌ Error fetching match: ${matchError.message}`);
        continue;
      }

      console.log(`   📅 Match date: ${matchInfo.date}`);
      console.log(`   🏸 Match type: ${matchInfo.type}`);

      // Get match results
      const { data: results, error: resultError } = await supabase
        .from('match_results')
        .select('*')
        .eq('match_id', participation.match_id);

      if (resultError) {
        console.log(`   ❌ Error fetching results: ${resultError.message}`);
        continue;
      }

      console.log(`   📊 Results found: ${results?.length || 0}`);
      
      if (results && results.length > 0) {
        const result = results[0];
        console.log(`   🏆 Team1 Score: ${result.team1_score}`);
        console.log(`   🏆 Team2 Score: ${result.team2_score}`);
        console.log(`   🏆 Winner Team: ${result.winner_team}`);
        
        // Calculate Kevin's result
        const kevinTeam = participation.team;
        const kevinScore = kevinTeam === 'team1' ? result.team1_score : result.team2_score;
        const opponentScore = kevinTeam === 'team1' ? result.team2_score : result.team1_score;
        const kevinWon = kevinScore > opponentScore;
        
        console.log(`   🎯 Kevin (${kevinTeam}): ${kevinScore} vs ${opponentScore} = ${kevinWon ? 'WIN' : 'LOSS'}`);
      } else {
        console.log(`   ⚠️  No results data found for this match`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugKevinMatches();