async function testSeparatePayments() {
  console.log('🧪 Testing Separate Payment Creation (Shuttlecock vs Attendance)');
  console.log('=' .repeat(60));

  try {
    // Create match with separate payment logic
    console.log('\n📝 Creating test match with separate payments...');
    const matchResponse = await fetch('http://localhost:3001/api/matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: '2024-10-24',
        time: '19:00',
        venue: 'Main Court',
        shuttlecock_count: 3,
        participants: [
          { member_id: 1, team: 1, position: 'A' },
          { member_id: 2, team: 1, position: 'B' },
          { member_id: 3, team: 2, position: 'A' },
          { member_id: 4, team: 2, position: 'B' }
        ] // 4 players for doubles match
      })
    });

    if (!matchResponse.ok) {
      const errorText = await matchResponse.text();
      throw new Error(`Match API Error: ${matchResponse.status} - ${errorText}`);
    }

    const matchResult = await matchResponse.json();
    console.log('✅ Match API Response:');
    console.log(JSON.stringify(matchResult, null, 2));

    // Fetch all payments to see separate records
    console.log('\n💰 Checking payment records via API...');
    const paymentResponse = await fetch('http://localhost:3001/api/payments');
    
    if (!paymentResponse.ok) {
      console.error('❌ Payment API Error:', paymentResponse.status);
      return;
    }
    
    const paymentResult = await paymentResponse.json();
    const payments = paymentResult.payments || [];

    console.log(`\n📊 Payment Records Created: ${payments.length}`);
    console.log('=' .repeat(60));

    // Group by member for analysis
    const paymentsByMember = {};
    let totalAmount = 0;

    payments.forEach(payment => {
      const memberId = payment.member_id;
      if (!paymentsByMember[memberId]) {
        paymentsByMember[memberId] = {
          name: payment.member_name || payment.members?.name || `Member ${memberId}`,
          shuttlecock: null,
          attendance: null,
          total: 0
        };
      }

      totalAmount += payment.amount;
      
      // Categorize payment based on amount and notes
      if (payment.notes?.includes('🏸 Shuttlecock')) {
        paymentsByMember[memberId].shuttlecock = payment;
      } else if (payment.notes?.includes('📅 Daily Session') || payment.notes?.includes('📅 Attendance')) {
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
        console.log(`      Notes: ${memberPayments.shuttlecock.notes}`);
      }
      
      if (memberPayments.attendance) {
        console.log(`   📅 Attendance: Rp${memberPayments.attendance.amount.toLocaleString('id-ID')} (${memberPayments.attendance.status})`);
        console.log(`      Notes: ${memberPayments.attendance.notes}`);
      }
      
      console.log(`   💵 Member Total: Rp${memberPayments.total.toLocaleString('id-ID')}`);
    });

    console.log('\n' + '=' .repeat(60));
    console.log(`💰 GRAND TOTAL: Rp${totalAmount.toLocaleString('id-ID')}`);
    console.log(`🧮 Expected per player: Rp${((3000 * 3 / 4) + 18000).toLocaleString('id-ID')} (Rp2,250 shuttlecock + Rp18,000 attendance)`);
    console.log(`✅ Payment Separation: ${payments.length === 8 ? 'SUCCESS' : 'ISSUE'} (Expected: 8 payments [4 shuttlecock + 4 attendance], Got: ${payments.length})`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testSeparatePayments();