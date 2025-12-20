const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qckubvnpfglseysboegd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFja3Vidm5wZmdsc2V5c2JvZWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTIxNjEwMCwiZXhwIjoyMDQ0NzkyMTAwfQ.mXKI1q0LnNmWm8DDKyWUFGaZvgJX4X4h0dOLNwEpXGo'
);

console.log('🔍 Checking current database state for match-payment relationships...');

async function checkDatabase() {
  try {
    // Check matches
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    console.log('📊 Recent matches:', matches?.length || 0);
    
    if (matches?.length) {
      const latestMatch = matches[0];
      console.log('Latest match:', {
        id: latestMatch.id,
        date: latestMatch.date,
        time: latestMatch.time,
        field_number: latestMatch.field_number,
        shuttlecock_count: latestMatch.shuttlecock_count,
        created_at: latestMatch.created_at
      });

      // Check match participants 
      const { data: participants } = await supabase
        .from('match_participants')
        .select('*, members(name)')
        .eq('match_id', latestMatch.id);
      
      console.log('👥 Match participants:', participants?.length || 0);
      
      if (participants?.length) {
        participants.forEach(p => {
          console.log(`- ${p.members?.name || 'Unknown'} (team: ${p.team})`);
        });
        
        // Check if payments exist for these participants after the match was created
        const participantIds = participants.map(p => p.member_id);
        const { data: participantPayments } = await supabase
          .from('payments')
          .select('*, members(name)')
          .in('member_id', participantIds)
          .gte('created_at', latestMatch.created_at);
          
        console.log('💰 Payments for match participants (created after match):', participantPayments?.length || 0);
        if (participantPayments?.length) {
          participantPayments.forEach(p => {
            console.log(`- ${p.members?.name}: Rp${p.amount.toLocaleString()} (${p.type}) - "${p.notes || 'no notes'}"`);
          });
        }
        
        // Check session_payments table
        try {
          const { data: sessionPayments } = await supabase
            .from('session_payments')
            .select('*, members(name)')
            .in('member_id', participantIds)
            .gte('created_at', latestMatch.created_at);
            
          console.log('💳 Session payments for match participants:', sessionPayments?.length || 0);
          if (sessionPayments?.length) {
            sessionPayments.forEach(p => {
              console.log(`- ${p.members?.name}: Rp${p.amount.toLocaleString()} (${p.type}) match_id: ${p.match_id || 'null'} - "${p.description || 'no description'}"`);
            });
          }
        } catch (e) {
          console.log('⚠️ session_payments table not accessible or doesn\'t exist');
        }
      }
    }

    // Check all recent payments overall
    const { data: allPayments } = await supabase
      .from('payments')
      .select('*, members(name)')
      .order('created_at', { ascending: false })
      .limit(8);
    
    console.log('\n💰 All recent payments (basic payments table):');
    if (allPayments?.length) {
      allPayments.forEach(p => {
        console.log(`- ${p.members?.name || 'Unknown'}: Rp${p.amount.toLocaleString()} (${p.type}) - "${p.notes || 'no notes'}"`);
      });
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkDatabase();