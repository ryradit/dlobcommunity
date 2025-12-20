// Test duplicate payment prevention for same member on same day
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xvlpbmudpwcfeggdcgyq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bHBibXVkcHdjZmVnZ2RjZ3lxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDA4MTk4MSwiZXhwIjoyMDQ5NjU3OTgxfQ.4mSRdLQ3Dj99yn8gre8pl4qhzH0Wbz8lkGs6j2vJ_w8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDuplicatePaymentPrevention() {
  console.log('🧪 Testing Duplicate Payment Prevention');
  console.log('=====================================');

  try {
    const testDate = '2025-10-24';
    
    // Create a test member for this test
    const { data: ryan, error: memberError } = await supabase
      .from('members')
      .insert({
        name: 'Test Player Duplicate',
        email: 'testdup@example.com',
        phone: '+628123456789'
      })
      .select()
      .single();

    if (memberError || !ryan) {
      throw new Error(`Failed to create test member: ${memberError?.message || 'Unknown error'}`);
    }

    console.log('👤 Testing with member:', ryan.name, '(ID:', ryan.id, ')');

    // 1. Create first match with Ryan
    console.log('\n🏸 Creating FIRST match with Ryan...');
    
    const match1Data = {
      date: testDate,
      time: '08:00',
      field_number: 1,
      shuttlecock_count: 2,
      participants: [
        { member_id: ryan.id, team: 1, position: 'player1' },
        { member_id: 'dummy-player-2', team: 1, position: 'player2' },
        { member_id: 'dummy-player-3', team: 2, position: 'player1' },
        { member_id: 'dummy-player-4', team: 2, position: 'player2' }
      ],
      team1_score: 21,
      team2_score: 18
    };

    const response1 = await fetch('http://localhost:3000/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(match1Data)
    });

    if (!response1.ok) {
      throw new Error(`First match creation failed: ${response1.status}`);
    }

    const result1 = await response1.json();
    console.log('✅ First match created:', result1.data?.match?.id);

    // Check Ryan's payments after first match
    const { data: paymentsAfterMatch1 } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', ryan.id)
      .eq('due_date', testDate)
      .order('created_at', { ascending: false });

    console.log('\n💰 Ryan\'s payments after FIRST match:');
    paymentsAfterMatch1?.forEach(p => {
      console.log(`   - ${p.type === 'daily' && p.notes?.includes('Shuttlecock') ? 'Shuttlecock' : 'Session'}: Rp${p.amount.toLocaleString()} - ${p.notes?.substring(0, 50)}...`);
    });

    const expectedPayments = 2; // Should have shuttlecock + session
    if (paymentsAfterMatch1?.length !== expectedPayments) {
      throw new Error(`Expected ${expectedPayments} payments after first match, got ${paymentsAfterMatch1?.length}`);
    }

    // 2. Create SECOND match with Ryan (same day)
    console.log('\n🏸 Creating SECOND match with Ryan (same day)...');
    
    const match2Data = {
      date: testDate,
      time: '10:00',
      field_number: 2,
      shuttlecock_count: 3,
      participants: [
        { member_id: ryan.id, team: 1, position: 'player1' },
        { member_id: 'dummy-player-5', team: 1, position: 'player2' },
        { member_id: 'dummy-player-6', team: 2, position: 'player1' },
        { member_id: 'dummy-player-7', team: 2, position: 'player2' }
      ],
      team1_score: 18,
      team2_score: 21
    };

    const response2 = await fetch('http://localhost:3000/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(match2Data)
    });

    if (!response2.ok) {
      throw new Error(`Second match creation failed: ${response2.status}`);
    }

    const result2 = await response2.json();
    console.log('✅ Second match created:', result2.data?.match?.id);

    // Check Ryan's payments after second match
    const { data: paymentsAfterMatch2 } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', ryan.id)
      .eq('due_date', testDate)
      .order('created_at', { ascending: false });

    console.log('\n💰 Ryan\'s payments after SECOND match:');
    paymentsAfterMatch2?.forEach(p => {
      console.log(`   - ${p.type === 'daily' && p.notes?.includes('Shuttlecock') ? 'Shuttlecock' : 'Session'}: Rp${p.amount.toLocaleString()} - ${p.notes?.substring(0, 50)}...`);
    });

    // 3. Analyze the results
    console.log('\n📊 Analysis:');
    
    const shuttlecockPayments = paymentsAfterMatch2?.filter(p => p.notes?.includes('Shuttlecock')) || [];
    const sessionPayments = paymentsAfterMatch2?.filter(p => p.notes?.includes('Session')) || [];
    
    console.log(`🏸 Shuttlecock payments: ${shuttlecockPayments.length} (should be 2 - one per match)`);
    console.log(`📅 Session payments: ${sessionPayments.length} (should be 1 - no duplicate)`);
    
    // Verify expectations
    if (shuttlecockPayments.length === 2) {
      console.log('✅ CORRECT: Two shuttlecock payments created (one per match)');
    } else {
      throw new Error(`INCORRECT: Expected 2 shuttlecock payments, got ${shuttlecockPayments.length}`);
    }
    
    if (sessionPayments.length === 1) {
      console.log('✅ CORRECT: Only one session payment created (duplicate prevented)');
    } else {
      throw new Error(`INCORRECT: Expected 1 session payment, got ${sessionPayments.length}`);
    }

    // 4. Cleanup test data
    await supabase.from('payments').delete().eq('member_id', ryan.id).eq('due_date', testDate);
    await supabase.from('members').delete().eq('id', ryan.id);
    console.log('✅ Test cleanup completed');

    console.log('\n🎉 DUPLICATE PREVENTION TEST PASSED!');
    console.log('✅ Same member playing multiple matches on same day:');
    console.log('   - Gets shuttlecock fee for EACH match');
    console.log('   - Gets session fee for FIRST match only');
    console.log('   - No duplicate session fees created');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testDuplicatePaymentPrevention();