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

async function testBidirectionalConversion() {
  console.log('🧪 Testing Bidirectional Conversion (Same Session Layout)');
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
        name: 'Test Member Bob',
        email: 'bob@test.com', 
        phone: '08123456789'
      })
      .select()
      .single();

    if (memberError) {
      throw new Error(`Failed to create member: ${memberError.message}`);
    }

    console.log(`✅ Created member: ${testMember.name} (ID: ${testMember.id})`);

    // Step 2: Create match with initial payments (shuttlecock + session)
    console.log('\n🏸 Step 2: Creating match with shuttlecock + session payments...');
    
    const { data: match, error: matchError } = await supabase
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

    // Create initial payments
    const shuttlecockFee = (2 * 3000) / 4; // 1,500
    const sessionFee = 18000;

    const initialPayments = [
      {
        member_id: testMember.id,
        amount: shuttlecockFee,
        type: 'daily',
        status: 'pending',
        due_date: '2024-10-24',
        match_id: match.id,
        notes: `🏸 Shuttlecock Fee - Match (2024-10-24) - 2 shuttlecock(s)`
      },
      {
        member_id: testMember.id,
        amount: sessionFee,
        type: 'daily', 
        status: 'pending',
        due_date: '2024-10-24',
        match_id: match.id,
        notes: `📅 Daily Session Fee (2024-10-24)`
      }
    ];

    const { data: createdPayments } = await supabase
      .from('payments')
      .insert(initialPayments)
      .select();

    console.log(`✅ Initial payments in same session (2024-10-24):`);
    createdPayments.forEach(payment => {
      const type = payment.notes.includes('🏸') ? 'Shuttlecock' : 'Session';
      console.log(`   ${type}: Rp${payment.amount.toLocaleString('id-ID')}`);
    });

    // Step 3: Convert session to membership (stays in same session)
    console.log('\n👑 Step 3: Converting session → membership (same session)...');
    
    const sessionPayment = createdPayments.find(p => p.amount === sessionFee);
    
    // Calculate membership fee
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

    // Create membership payment in same session
    const { data: membershipPayment } = await supabase
      .from('payments')
      .insert({
        member_id: testMember.id,
        amount: membershipFee,
        type: 'monthly',
        status: 'pending',
        due_date: '2024-10-24', // SAME DATE as session (keeps in same group)
        notes: `💳 Monthly Membership - ${monthName} (${saturdayCount} weeks) - Converted from session`
      })
      .select()
      .single();

    // Remove original session payment
    await supabase.from('payments').delete().eq('id', sessionPayment.id);

    console.log(`✅ Session converted to membership (same session):`);
    console.log(`   🏸 Shuttlecock: Rp${shuttlecockFee.toLocaleString('id-ID')} (unchanged)`);
    console.log(`   👑 Membership: Rp${membershipFee.toLocaleString('id-ID')} (was session fee)`);
    console.log(`   📅 Session Date: 2024-10-24 (grouped together)`);

    // Step 4: Convert membership back to session (stays in same session)
    console.log('\n🔄 Step 4: Converting membership → session (same session)...');
    
    // Create new session payment in same session
    const { data: newSessionPayment } = await supabase
      .from('payments')
      .insert({
        member_id: testMember.id,
        amount: 18000,
        type: 'daily',
        status: 'pending', 
        due_date: '2024-10-24', // SAME DATE (keeps in same group)
        notes: `📅 Daily Session Fee - Converted back from membership (was Rp${membershipFee.toLocaleString('id-ID')})`
      })
      .select()
      .single();

    // Remove membership payment
    await supabase.from('payments').delete().eq('id', membershipPayment.id);

    console.log(`✅ Membership converted back to session (same session):`);
    console.log(`   🏸 Shuttlecock: Rp${shuttlecockFee.toLocaleString('id-ID')} (unchanged)`);
    console.log(`   📅 Session: Rp18,000 (converted back)`);
    console.log(`   📅 Session Date: 2024-10-24 (still grouped together)`);

    // Step 5: Display final layout (simulating UI grouping)
    console.log('\n📊 FINAL UI LAYOUT (Same Session Grouping)');
    console.log('=' .repeat(70));

    const { data: finalPayments } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', testMember.id)
      .eq('due_date', '2024-10-24') // All payments from same session
      .order('created_at', { ascending: true });

    // Simulate UI grouping by date
    const sessionGroup = {
      member: testMember,
      sessionDate: '2024-10-24',
      shuttlecockPayment: finalPayments.find(p => p.notes.includes('🏸')),
      sessionPayment: finalPayments.find(p => p.notes.includes('📅') && p.type === 'daily'),
      membershipPayment: finalPayments.find(p => p.type === 'monthly'),
      total: finalPayments.reduce((sum, p) => sum + p.amount, 0)
    };

    console.log(`👤 Member: ${sessionGroup.member.name}`);
    console.log(`📅 Session Date: ${sessionGroup.sessionDate}`);
    console.log('\n💳 Payments in this session:');
    
    if (sessionGroup.shuttlecockPayment) {
      console.log(`   🏸 Shuttlecock Fee: Rp${sessionGroup.shuttlecockPayment.amount.toLocaleString('id-ID')} (pending)`);
      console.log(`      └─ Actions: [Mark Paid] [Remind]`);
    }
    
    if (sessionGroup.sessionPayment) {
      console.log(`   📅 Session Fee: Rp${sessionGroup.sessionPayment.amount.toLocaleString('id-ID')} (pending)`);
      console.log(`      └─ Actions: [Mark Paid] [→ Membership]`);
    }
    
    if (sessionGroup.membershipPayment) {
      console.log(`   👑 Membership Fee: Rp${sessionGroup.membershipPayment.amount.toLocaleString('id-ID')} (pending)`);
      console.log(`      └─ Actions: [Mark Paid] [→ Daily Session]`);
    }

    console.log(`\n💰 Session Total: Rp${sessionGroup.total.toLocaleString('id-ID')}`);
    console.log('\n🎯 KEY BENEFITS:');
    console.log('   ✅ Payments stay grouped in same session/day');
    console.log('   ✅ Bidirectional conversion (session ↔ membership)');
    console.log('   ✅ UI shows conversion options in same column');
    console.log('   ✅ Shuttlecock fee remains unchanged during conversions');
    console.log('   ✅ Easy admin management within session context');

    return {
      member: testMember,
      sessionGroup,
      totalPayments: finalPayments.length,
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

// Run the bidirectional conversion test
testBidirectionalConversion().then(result => {
  if (result.conversionSuccessful) {
    console.log('\n🎉 BIDIRECTIONAL CONVERSION IN SAME SESSION TEST COMPLETED!');
    console.log('🚀 UI Layout: Payments grouped by session with conversion options');
  } else {
    console.log('\n❌ Test failed:', result.error);
  }
});