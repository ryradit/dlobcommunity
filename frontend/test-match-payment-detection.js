// Test script to create a match with 4 players and verify payment creation and detection
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qckubvnpfglseysboegd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFja3Vidm5wZmdsc2V5c2JvZWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTIxNjEwMCwiZXhwIjoyMDQ0NzkyMTAwfQ.mXKI1q0LnNmWm8DDKyWUFGaZvgJX4X4h0dOLNwEpXGo'
);

async function createTestMatchWithPayments() {
  try {
    console.log('🏸 Creating test match with 4 players...\n');

    // Get 4 members from the database
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, email')
      .limit(4);

    if (membersError || !members || members.length < 4) {
      console.log('❌ Need at least 4 members in database. Creating test members...');
      
      // Create test members
      const testMembers = [
        { email: 'player1@test.com', name: 'Alice Johnson', phone: '+62812345678' },
        { email: 'player2@test.com', name: 'Bob Smith', phone: '+62812345679' },
        { email: 'player3@test.com', name: 'Charlie Brown', phone: '+62812345680' },
        { email: 'player4@test.com', name: 'Diana Prince', phone: '+62812345681' }
      ];

      const { data: newMembers, error: createError } = await supabase
        .from('members')
        .insert(testMembers)
        .select('id, name, email');

      if (createError) {
        console.error('❌ Failed to create test members:', createError);
        return;
      }

      console.log('✅ Created test members:', newMembers.map(m => m.name));
      members = newMembers;
    }

    console.log('👥 Using players:', members.map(m => m.name).join(', '));

    // Prepare match data
    const matchDate = '2025-10-24'; // Today
    const matchTime = '20:00:00'; // 8 PM
    const shuttlecockCount = 2;

    const participants = [
      { member_id: members[0].id, team: 'team1', position: 'player1' },
      { member_id: members[1].id, team: 'team1', position: 'player2' },
      { member_id: members[2].id, team: 'team2', position: 'player1' },
      { member_id: members[3].id, team: 'team2', position: 'player2' }
    ];

    // Create match via API
    console.log('\n🎮 Creating match via API...');
    const response = await fetch('http://localhost:3000/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: matchDate,
        time: matchTime,
        field_number: 1,
        shuttlecock_count: shuttlecockCount,
        participants,
        team1_score: 21,
        team2_score: 19
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Match creation failed:', result.error);
      return;
    }

    console.log('✅ Match created successfully!');
    console.log('📊 Match ID:', result.data.match.id);
    console.log('💰 Payment calculations:', result.data.calculations);

    // Wait a moment for database to update
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check payments in database
    console.log('\n💳 Checking payment records...');
    
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        *,
        members(name)
      `)
      .eq('due_date', matchDate)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('❌ Failed to fetch payments:', paymentsError);
      return;
    }

    console.log(`\n✅ Found ${payments.length} payment records:`);
    payments.forEach((payment, index) => {
      console.log(`${index + 1}. ${payment.members?.name}: Rp${payment.amount.toLocaleString()}`);
      console.log(`   Type: ${payment.type}`);
      console.log(`   Match ID: ${payment.match_id || 'NOT SET'}`);
      console.log(`   Notes: ${payment.notes || 'No notes'}`);
      console.log('');
    });

    // Test payment management detection
    console.log('🔍 Testing payment management detection...');
    
    payments.forEach(payment => {
      const isMatchPayment = payment.match_id || (payment.notes && payment.notes.includes('🏸 Match Payment'));
      const playerMatch = payment.notes?.match(/Players: ([^.]+)/);
      const playersText = playerMatch ? playerMatch[1] : 'Unknown Players';
      
      console.log(`- ${payment.members?.name}:`);
      console.log(`  Is Match Payment: ${isMatchPayment ? '✅ YES' : '❌ NO'}`);
      console.log(`  Players Detected: ${playersText}`);
      console.log(`  Title: 🏸 Match Payment - ${matchDate} (${playersText})`);
      console.log('');
    });

    console.log('🎉 Test completed! Check http://localhost:3000/admin/payments to see results');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
createTestMatchWithPayments();