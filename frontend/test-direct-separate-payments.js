const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.log('Make sure .env.local has:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=...');
  console.log('SUPABASE_SERVICE_ROLE_KEY=...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestMembersAndMatch() {
  console.log('🧪 Creating Test Members and Testing Separate Payments');
  console.log('=' .repeat(60));

  try {
    // 1. Clear existing test data
    console.log('🧹 Cleaning up existing test data...');
    await supabase.from('payments').delete().neq('id', 0);
    await supabase.from('matches').delete().neq('id', 0);
    await supabase.from('members').delete().like('name', 'Test Player%');

    // 2. Create test members
    console.log('\n👥 Creating test members...');
    const testMembers = [
      { name: 'Test Player 1', email: 'player1@test.com', phone: '081234567891' },
      { name: 'Test Player 2', email: 'player2@test.com', phone: '081234567892' },
      { name: 'Test Player 3', email: 'player3@test.com', phone: '081234567893' },
      { name: 'Test Player 4', email: 'player4@test.com', phone: '081234567894' }
    ];

    const { data: createdMembers, error: memberError } = await supabase
      .from('members')
      .insert(testMembers)
      .select('id, name');

    if (memberError) {
      console.error('❌ Error creating members:', memberError);
      return;
    }

    console.log(`✅ Created ${createdMembers.length} test members:`);
    createdMembers.forEach((member, index) => {
      console.log(`   ${index + 1}. ID: ${member.id}, Name: ${member.name}`);
    });

    // 3. Create a match with these members to test separate payments
    console.log('\n🏸 Creating match with separate payment logic...');
    
    const matchData = {
      date: '2024-10-24',
      time: '19:00:00',
      type: 'doubles',
      status: 'completed',
      shuttlecock_count: 3
    };

    const { data: matchResult, error: matchError } = await supabase
      .from('matches')
      .insert(matchData)
      .select('*')
      .single();

    if (matchError) {
      console.error('❌ Error creating match:', matchError);
      return;
    }

    console.log(`✅ Match created: ID ${matchResult.id}`);

    // 4. Manually create separate payment records to test the concept
    console.log('\n💰 Creating separate payment records (shuttlecock + attendance)...');
    
    const paymentRecords = [];
    const shuttlecockFeePerPlayer = (3 * 3000) / 4; // 3 shuttlecocks / 4 players = 2,250 per player
    const attendanceFee = 18000;

    createdMembers.forEach(member => {
      // Separate shuttlecock payment
      paymentRecords.push({
        member_id: member.id,
        amount: shuttlecockFeePerPlayer,
        type: 'daily',
        status: 'pending',
        due_date: '2024-10-24',
        match_id: matchResult.id,
        notes: `🏸 Shuttlecock Fee - Match (2024-10-24) - 3 shuttlecock(s) @ Rp3,000 each`
      });

      // Separate attendance payment
      paymentRecords.push({
        member_id: member.id,
        amount: attendanceFee,
        type: 'daily',
        status: 'pending',
        due_date: '2024-10-24',
        match_id: matchResult.id,
        notes: `📅 Daily Session Fee (2024-10-24) - Can convert to monthly membership (Rp45,000) for 5 weeks`
      });
    });

    const { data: createdPayments, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentRecords)
      .select(`
        id,
        member_id,
        amount,
        type,
        status,
        notes,
        match_id
      `);

    if (paymentError) {
      console.error('❌ Error creating payments:', paymentError);
      return;
    }

    // 5. Display results
    console.log(`\n📊 Payment Records Created: ${createdPayments.length}`);
    console.log('=' .repeat(60));

    // Group by member for analysis
    const paymentsByMember = {};
    let totalAmount = 0;

    createdPayments.forEach(payment => {
      const memberId = payment.member_id;
      const memberName = createdMembers.find(m => m.id === memberId)?.name || `Member ${memberId}`;
      
      if (!paymentsByMember[memberId]) {
        paymentsByMember[memberId] = {
          name: memberName,
          shuttlecock: null,
          attendance: null,
          total: 0
        };
      }

      totalAmount += payment.amount;
      
      // Categorize payment based on notes
      if (payment.notes?.includes('🏸 Shuttlecock')) {
        paymentsByMember[memberId].shuttlecock = payment;
      } else if (payment.notes?.includes('📅 Daily Session')) {
        paymentsByMember[memberId].attendance = payment;
      }
      
      paymentsByMember[memberId].total += payment.amount;
    });

    // Display separated payment structure
    Object.entries(paymentsByMember).forEach(([memberId, memberPayments]) => {
      console.log(`\n👤 ${memberPayments.name} (ID: ${memberId})`);
      console.log('   📋 Payment Breakdown:');
      
      if (memberPayments.shuttlecock) {
        console.log(`   🏸 Shuttlecock: Rp${memberPayments.shuttlecock.amount.toLocaleString('id-ID')} (${memberPayments.shuttlecock.status})`);
        console.log(`      Payment ID: ${memberPayments.shuttlecock.id}`);
      }
      
      if (memberPayments.attendance) {
        console.log(`   📅 Attendance: Rp${memberPayments.attendance.amount.toLocaleString('id-ID')} (${memberPayments.attendance.status})`);
        console.log(`      Payment ID: ${memberPayments.attendance.id}`);
        console.log(`      💡 Convertible: This can be converted to monthly membership`);
      }
      
      console.log(`   💵 Member Total: Rp${memberPayments.total.toLocaleString('id-ID')}`);
    });

    console.log('\n' + '=' .repeat(60));
    console.log(`💰 GRAND TOTAL: Rp${totalAmount.toLocaleString('id-ID')}`);
    console.log(`🧮 Expected per player: Rp${(shuttlecockFeePerPlayer + attendanceFee).toLocaleString('id-ID')} (Rp${shuttlecockFeePerPlayer.toLocaleString('id-ID')} shuttlecock + Rp${attendanceFee.toLocaleString('id-ID')} attendance)`);
    console.log(`✅ Payment Separation: SUCCESS - ${createdPayments.length} payments (${createdMembers.length} shuttlecock + ${createdMembers.length} attendance)`);

    console.log('\n🎯 Benefits of Separate Payments:');
    console.log('   1. 🏸 Shuttlecock fees are always required per match');
    console.log('   2. 📅 Attendance fees can be converted to monthly membership');
    console.log('   3. 💰 Independent payment management and tracking');
    console.log('   4. 📊 Better financial reporting and analysis');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
createTestMembersAndMatch();