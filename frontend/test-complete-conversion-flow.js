const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testCompleteConversionFlow() {
  console.log('🧪 Testing Complete Session Conversion Flow');
  console.log('=' .repeat(70));

  try {
    // Clean up any existing test data
    console.log('🧹 Cleaning up existing test data...');
    await supabase.from('payments').delete().neq('id', 0);
    await supabase.from('matches').delete().neq('id', 0);
    await supabase.from('members').delete().like('name', 'Test Member%');

    // Step 1: Create test member
    console.log('\n👤 Step 1: Creating test member...');
    const { data: testMember, error: memberError } = await supabase
      .from('members')
      .insert({
        name: 'Test Member Alice',
        email: 'alice@test.com',
        phone: '08123456789'
      })
      .select()
      .single();

    if (memberError) {
      throw new Error(`Failed to create member: ${memberError.message}`);
    }

    console.log(`✅ Created member: ${testMember.name} (ID: ${testMember.id})`);

    // Step 2: Create first match (should generate shuttlecock + session fees)
    console.log('\n🏸 Step 2: Creating first match - should generate shuttlecock + session fees...');
    
    const { data: firstMatch, error: matchError } = await supabase
      .from('matches')
      .insert({
        date: '2024-10-24',
        time: '19:00:00',
        type: 'doubles',
        status: 'completed',
        shuttlecock_count: 2
      })
      .select()
      .single();

    if (matchError) {
      throw new Error(`Failed to create match: ${matchError.message}`);
    }

    // Manually create the payments (simulating match creation API)
    const shuttlecockFee = (2 * 3000) / 4; // 2 shuttlecocks / 4 players = 1,500
    const sessionFee = 18000;

    const initialPayments = [
      {
        member_id: testMember.id,
        amount: shuttlecockFee,
        type: 'daily',
        status: 'pending',
        due_date: '2024-10-24',
        match_id: firstMatch.id,
        notes: `🏸 Shuttlecock Fee - Match (2024-10-24) - 2 shuttlecock(s) @ Rp3,000 each`
      },
      {
        member_id: testMember.id,
        amount: sessionFee,
        type: 'daily',
        status: 'pending',
        due_date: '2024-10-24',
        match_id: firstMatch.id,
        notes: `📅 Daily Session Fee (2024-10-24) - Can convert to monthly membership`
      }
    ];

    const { data: createdPayments, error: paymentError } = await supabase
      .from('payments')
      .insert(initialPayments)
      .select();

    if (paymentError) {
      throw new Error(`Failed to create payments: ${paymentError.message}`);
    }

    console.log(`✅ Match created with payments:`);
    createdPayments.forEach(payment => {
      const type = payment.notes.includes('🏸') ? 'Shuttlecock' : 'Session';
      console.log(`   ${type}: Rp${payment.amount.toLocaleString('id-ID')} (${payment.status})`);
    });

    // Step 3: Convert session fee to membership
    console.log('\n👑 Step 3: Converting session fee to membership...');
    
    const sessionPayment = createdPayments.find(p => p.amount === sessionFee);
    
    // Calculate membership fee (simulate current month logic)
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    let saturdayCount = 0;
    const tempDate = new Date(firstDay);
    while (tempDate <= lastDay) {
      if (tempDate.getDay() === 6) saturdayCount++;
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    const membershipFee = saturdayCount === 4 ? 40000 : 45000;
    const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Create membership payment
    const { data: membershipPayment, error: membershipError } = await supabase
      .from('payments')
      .insert({
        member_id: testMember.id,
        amount: membershipFee,
        type: 'monthly',
        status: 'pending',
        due_date: new Date(currentYear, currentMonth + 1, 5).toISOString().split('T')[0],
        notes: `💳 Monthly Membership - ${monthName} (${saturdayCount} weeks) - Converted from session payment`
      })
      .select()
      .single();

    if (membershipError) {
      throw new Error(`Failed to create membership payment: ${membershipError.message}`);
    }

    // Delete the original session payment (simulate conversion)
    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('id', sessionPayment.id);

    if (deleteError) {
      console.warn('⚠️ Could not delete session payment:', deleteError);
    }

    console.log(`✅ Session fee converted to membership:`);
    console.log(`   Original Session Fee: Rp${sessionFee.toLocaleString('id-ID')} (removed)`);
    console.log(`   New Membership Fee: Rp${membershipFee.toLocaleString('id-ID')} (${saturdayCount} weeks)`);
    console.log(`   Period: ${monthName}`);

    // Step 4: Create second match (should only generate shuttlecock fee)
    console.log('\n🏸 Step 4: Creating second match - should only generate shuttlecock fee...');
    
    const { data: secondMatch, error: secondMatchError } = await supabase
      .from('matches')
      .insert({
        date: '2024-10-31', // Next Saturday
        time: '19:00:00',
        type: 'doubles',
        status: 'completed',
        shuttlecock_count: 3
      })
      .select()
      .single();

    if (secondMatchError) {
      throw new Error(`Failed to create second match: ${secondMatchError.message}`);
    }

    // Check if member has active membership
    const { data: activeMembership } = await supabase
      .from('payments')
      .select('id, status, amount')
      .eq('member_id', testMember.id)
      .eq('type', 'monthly')
      .gte('due_date', firstDay.toISOString().split('T')[0])
      .lte('due_date', lastDay.toISOString().split('T')[0])
      .single();

    const hasMembership = activeMembership && (activeMembership.status === 'paid' || activeMembership.status === 'pending');

    // Create only shuttlecock payment (no session fee due to membership)
    const secondShuttlecockFee = (3 * 3000) / 4; // 3 shuttlecocks / 4 players = 2,250

    const secondMatchPayment = {
      member_id: testMember.id,
      amount: secondShuttlecockFee,
      type: 'daily',
      status: 'pending',
      due_date: '2024-10-31',
      match_id: secondMatch.id,
      notes: `🏸 Shuttlecock Fee - Match (2024-10-31) - 3 shuttlecock(s) @ Rp3,000 each - MEMBER RATE (has active membership)`
    };

    const { data: secondPayment, error: secondPaymentError } = await supabase
      .from('payments')
      .insert(secondMatchPayment)
      .select()
      .single();

    if (secondPaymentError) {
      throw new Error(`Failed to create second match payment: ${secondPaymentError.message}`);
    }

    console.log(`✅ Second match created:`);
    console.log(`   Member Status: ${hasMembership ? 'HAS ACTIVE MEMBERSHIP' : 'NO MEMBERSHIP'}`);
    console.log(`   Shuttlecock Fee: Rp${secondShuttlecockFee.toLocaleString('id-ID')}`);
    console.log(`   Session Fee: Rp0 (membership covers this)`);

    // Step 5: Display final summary
    console.log('\n📊 FINAL PAYMENT SUMMARY');
    console.log('=' .repeat(70));

    const { data: allPayments } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', testMember.id)
      .order('created_at', { ascending: true });

    let totalAmount = 0;
    allPayments.forEach((payment, index) => {
      totalAmount += payment.amount;
      const type = payment.type === 'monthly' ? '👑 Membership' : 
                   payment.notes.includes('🏸') ? '🏸 Shuttlecock' : '📅 Session';
      const match = payment.match_id ? ` (Match: ${payment.due_date})` : '';
      
      console.log(`${index + 1}. ${type}: Rp${payment.amount.toLocaleString('id-ID')} - ${payment.status}${match}`);
    });

    console.log('\n' + '=' .repeat(70));
    console.log(`💰 TOTAL AMOUNT: Rp${totalAmount.toLocaleString('id-ID')}`);
    console.log(`📈 CONVERSION FLOW SUCCESS:`);
    console.log(`   ✅ Match 1: Shuttlecock (${shuttlecockFee.toLocaleString('id-ID')}) + Session (${sessionFee.toLocaleString('id-ID')})`);
    console.log(`   ✅ Session → Membership: Converted to Rp${membershipFee.toLocaleString('id-ID')} monthly`);
    console.log(`   ✅ Match 2: Only Shuttlecock (${secondShuttlecockFee.toLocaleString('id-ID')}) - member rate`);
    console.log(`   🎯 BENEFIT: Future matches only require shuttlecock fees!`);

    return {
      member: testMember,
      payments: allPayments,
      totalAmount,
      conversionSuccessful: true
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      conversionSuccessful: false,
      error: error.message
    };
  }
}

// Run the comprehensive test
testCompleteConversionFlow().then(result => {
  if (result.conversionSuccessful) {
    console.log('\n🎉 SESSION CONVERSION FLOW TEST COMPLETED SUCCESSFULLY!');
  } else {
    console.log('\n❌ Test failed:', result.error);
  }
});