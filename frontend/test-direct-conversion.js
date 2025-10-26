const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xvlpbmudpwcfeggdcgyq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bHBibXVkcHdjZmVnZ2RjZ3lxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDA4MTk4MSwiZXhwIjoyMDQ5NjU3OTgxfQ.4mSRdLQ3Dj99yn8gre8pl4qhzH0Wbz8lkGs6j2vJ_w8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to count Saturdays between two dates
function countSaturdaysBetween(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);
  current.setDate(current.getDate() + (6 - current.getDay()) % 7); // Next Saturday
  
  while (current <= endDate) {
    count++;
    current.setDate(current.getDate() + 7);
  }
  
  return count;
}

async function testDirectConversionLogic() {
  console.log('🧪 Direct Conversion Logic Test');
  console.log('================================');

  try {
    // 1. Create test match and member
    const testDate = new Date().toISOString().split('T')[0];
    
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        match_date: testDate,
        venue: 'Test Venue - Direct',
        max_players: 20
      })
      .select()
      .single();

    if (matchError) throw matchError;
    console.log('✅ Created test match:', match.id);

    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        name: 'Direct Test Member',
        phone: '+6281234567891',
        email: 'directtest@example.com'
      })
      .select()
      .single();

    if (memberError) throw memberError;
    console.log('✅ Created test member:', member.id);

    // 2. Create separate payments
    const paymentsData = [
      {
        member_id: member.id,
        match_id: match.id,
        payment_type: 'shuttlecock',
        amount: 10000,
        status: 'unpaid',
        due_date: testDate,
        description: 'Shuttlecock fee for direct test'
      },
      {
        member_id: member.id,
        match_id: match.id,
        payment_type: 'daily',
        amount: 15000,
        status: 'unpaid',
        due_date: testDate,
        description: 'Session fee for direct test'
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
    const originalId = sessionPayment.id;

    // 3. Simulate conversion logic directly
    console.log('\n🔄 Testing Direct Session → Membership Conversion');

    // Calculate membership fee
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const saturdayCount = countSaturdaysBetween(today, endOfMonth);
    const membershipAmount = saturdayCount === 4 ? 40000 : 45000;

    console.log(`📅 Saturdays this month: ${saturdayCount}`);
    console.log(`💰 Membership fee: Rp${membershipAmount.toLocaleString()}`);

    // Perform in-place update
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        payment_type: 'monthly',
        amount: membershipAmount,
        description: `Monthly membership fee (${saturdayCount} weeks)`
      })
      .eq('id', sessionPayment.id)
      .select()
      .single();

    if (updateError) throw updateError;
    console.log('✅ Session payment updated in-place to membership');
    console.log(`   - ID preserved: ${updatedPayment.id} (was ${originalId})`);
    console.log(`   - Type: ${updatedPayment.payment_type}`);
    console.log(`   - Amount: Rp${updatedPayment.amount.toLocaleString()}`);
    console.log(`   - Due date preserved: ${updatedPayment.due_date}`);

    // 4. Verify all payments for this member
    const { data: allPayments, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', member.id)
      .order('payment_type');

    if (fetchError) throw fetchError;

    console.log('\n📊 All payments after conversion:');
    allPayments.forEach(p => {
      console.log(`   - ${p.payment_type}: Rp${p.amount.toLocaleString()} (ID: ${p.id})`);
      console.log(`     Due: ${p.due_date} | Status: ${p.status}`);
    });

    // Verify we have exactly 2 payments (shuttlecock + membership)
    if (allPayments.length !== 2) {
      throw new Error(`Expected 2 payments, got ${allPayments.length}`);
    }

    const membershipPayment = allPayments.find(p => p.payment_type === 'monthly');
    const shuttlecockPayment = allPayments.find(p => p.payment_type === 'shuttlecock');

    if (!membershipPayment || !shuttlecockPayment) {
      throw new Error('Missing expected payment types');
    }

    if (membershipPayment.id !== originalId) {
      throw new Error('Payment ID was not preserved during conversion!');
    }

    console.log('✅ Conversion successful with ID preservation');

    // 5. Test reverse conversion
    console.log('\n🔄 Testing Direct Membership → Daily Conversion');

    const { data: revertedPayment, error: revertError } = await supabase
      .from('payments')
      .update({
        payment_type: 'daily',
        amount: 15000,
        description: 'Session fee for direct test'
      })
      .eq('id', membershipPayment.id)
      .select()
      .single();

    if (revertError) throw revertError;
    console.log('✅ Membership payment reverted to daily session');
    console.log(`   - ID preserved: ${revertedPayment.id} (still ${originalId})`);
    console.log(`   - Type: ${revertedPayment.payment_type}`);
    console.log(`   - Amount: Rp${revertedPayment.amount.toLocaleString()}`);

    // 6. Final verification
    const { data: finalPayments, error: finalError } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', member.id)
      .order('payment_type');

    if (finalError) throw finalError;

    console.log('\n📊 Final payments after reverse conversion:');
    finalPayments.forEach(p => {
      console.log(`   - ${p.payment_type}: Rp${p.amount.toLocaleString()} (ID: ${p.id})`);
      console.log(`     Due: ${p.due_date} | Status: ${p.status}`);
    });

    // Verify session grouping
    const uniqueDueDates = [...new Set(finalPayments.map(p => p.due_date))];
    if (uniqueDueDates.length !== 1 || uniqueDueDates[0] !== testDate) {
      throw new Error('Due dates not consistent for session grouping!');
    }

    // 7. Cleanup
    await supabase.from('payments').delete().eq('member_id', member.id);
    await supabase.from('members').delete().eq('id', member.id);
    await supabase.from('matches').delete().eq('id', match.id);
    console.log('✅ Cleanup completed');

    console.log('\n🎉 ALL DIRECT CONVERSION TESTS PASSED!');
    console.log('✅ Separate payment creation works');
    console.log('✅ In-place conversion preserves payment ID');
    console.log('✅ Due dates remain consistent for session grouping');
    console.log('✅ Reverse conversion works properly');
    console.log('✅ No duplicate records created');

  } catch (error) {
    console.error('❌ Direct conversion test failed:', error.message);
    console.error('Full error:', error);
  }
}

testDirectConversionLogic();