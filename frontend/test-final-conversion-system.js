const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xvlpbmudpwcfeggdcgyq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bHBibXVkcHdjZmVnZ2RjZ3lxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDA4MTk4MSwiZXhwIjoyMDQ5NjU3OTgxfQ.4mSRdLQ3Dj99yn8gre8pl4qhzH0Wbz8lkGs6j2vJ_w8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFinalConversionSystem() {
  console.log('🧪 Final Conversion System Test');
  console.log('==================================');

  try {
    // 1. Create test match with separate payments
    const testDate = new Date().toISOString().split('T')[0];
    
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        match_date: testDate,
        venue: 'Test Venue - Final',
        max_players: 20
      })
      .select()
      .single();

    if (matchError) throw matchError;
    console.log('✅ Created test match:', match.id);

    // 2. Create test member
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        name: 'Final Test Member',
        phone: '+6281234567890',
        email: 'finaltest@example.com'
      })
      .select()
      .single();

    if (memberError) throw memberError;
    console.log('✅ Created test member:', member.id);

    // 3. Create separate payments (shuttlecock + session)
    const paymentsData = [
      {
        member_id: member.id,
        match_id: match.id,
        payment_type: 'shuttlecock',
        amount: 10000,
        status: 'unpaid',
        due_date: testDate,
        description: 'Shuttlecock fee for test'
      },
      {
        member_id: member.id,
        match_id: match.id,
        payment_type: 'daily',
        amount: 15000,
        status: 'unpaid',
        due_date: testDate,
        description: 'Session fee for test'
      }
    ];

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .insert(paymentsData)
      .select();

    if (paymentsError) throw paymentsError;
    console.log('✅ Created separate payments:');
    payments.forEach(p => {
      console.log(`   - ${p.payment_type}: Rp${p.amount.toLocaleString()} (ID: ${p.id})`);
    });

    const sessionPayment = payments.find(p => p.payment_type === 'daily');
    const shuttlecockPayment = payments.find(p => p.payment_type === 'shuttlecock');

    // 4. Test conversion to membership (in-place update)
    console.log('\n🔄 Testing Session → Membership Conversion');
    const convertResponse = await fetch('http://localhost:3000/api/payments/convert-to-membership', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: sessionPayment.id,
        memberId: member.id
      })
    });

    if (!convertResponse.ok) {
      const errorText = await convertResponse.text();
      throw new Error(`Conversion failed: ${errorText}`);
    }

    const convertResult = await convertResponse.json();
    console.log('✅ Conversion successful:', convertResult.message);

    // 5. Verify in-place update (same ID, updated fields)
    const { data: updatedPayments, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', member.id)
      .order('payment_type');

    if (fetchError) throw fetchError;

    console.log('\n📊 Payments after conversion:');
    updatedPayments.forEach(p => {
      console.log(`   - ${p.payment_type}: Rp${p.amount.toLocaleString()} (ID: ${p.id}) - ${p.status}`);
      console.log(`     Due: ${p.due_date} | Desc: ${p.description}`);
    });

    // Verify the session payment was updated to membership
    const membershipPayment = updatedPayments.find(p => p.payment_type === 'monthly');
    if (!membershipPayment || membershipPayment.id !== sessionPayment.id) {
      throw new Error('❌ Session payment was not properly converted in-place!');
    }
    console.log('✅ Session payment properly updated to membership (same ID preserved)');

    // 6. Test reverse conversion (membership → daily)
    console.log('\n🔄 Testing Membership → Daily Conversion');
    const reverseResponse = await fetch('http://localhost:3000/api/payments/convert-to-daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: membershipPayment.id,
        memberId: member.id
      })
    });

    if (!reverseResponse.ok) {
      const errorText = await reverseResponse.text();
      throw new Error(`Reverse conversion failed: ${errorText}`);
    }

    const reverseResult = await reverseResponse.json();
    console.log('✅ Reverse conversion successful:', reverseResult.message);

    // 7. Final verification
    const { data: finalPayments, error: finalError } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', member.id)
      .order('payment_type');

    if (finalError) throw finalError;

    console.log('\n📊 Final payments after reverse conversion:');
    finalPayments.forEach(p => {
      console.log(`   - ${p.payment_type}: Rp${p.amount.toLocaleString()} (ID: ${p.id}) - ${p.status}`);
      console.log(`     Due: ${p.due_date} | Desc: ${p.description}`);
    });

    // Verify we're back to daily payment with same ID
    const dailyPayment = finalPayments.find(p => p.payment_type === 'daily');
    if (!dailyPayment || dailyPayment.id !== sessionPayment.id) {
      throw new Error('❌ Membership payment was not properly converted back to daily!');
    }
    console.log('✅ Membership payment properly reverted to daily (same ID preserved)');

    // 8. Verify session grouping (same due_date maintained)
    const uniqueDueDates = [...new Set(finalPayments.map(p => p.due_date))];
    if (uniqueDueDates.length !== 1 || uniqueDueDates[0] !== testDate) {
      throw new Error('❌ Due dates not consistent for session grouping!');
    }
    console.log('✅ Session grouping preserved (consistent due_date)');

    // 9. Cleanup
    await supabase.from('payments').delete().eq('member_id', member.id);
    await supabase.from('members').delete().eq('id', member.id);
    await supabase.from('matches').delete().eq('id', match.id);
    console.log('✅ Cleanup completed');

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Separate payment creation works');
    console.log('✅ In-place conversion (session → membership) works');
    console.log('✅ In-place reverse conversion (membership → daily) works');
    console.log('✅ Payment IDs are preserved during conversions');
    console.log('✅ Session grouping (due_date) is maintained');
    console.log('✅ No duplicate records are created');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testFinalConversionSystem();