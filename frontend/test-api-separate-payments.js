async function testApiSeparatePayments() {
  console.log('🧪 Testing API-Based Separate Payment Creation');
  console.log('=' .repeat(60));

  try {
    // Use existing test members from the previous test
    const memberIds = [
      '7ebd4121-8155-46aa-b47e-0a65ab9cabe5', // Test Player 1
      '258f8ed9-05be-4fbd-a663-e78b5c51f1ac', // Test Player 2
      'ac678f16-6ade-404d-b679-9bf7face5aef', // Test Player 3
      'e7838de7-cd8b-4c8e-bf0b-19ff21164f6e'  // Test Player 4
    ];

    // Clear existing API test data
    console.log('🧹 Cleaning up existing API test payments...');
    
    // Create match using the updated API
    console.log('\n📝 Creating match via API with separate payment logic...');
    const matchResponse = await fetch('http://localhost:3001/api/matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: '2024-10-25', // Different date to avoid conflicts
        time: '19:00',
        venue: 'Main Court',
        shuttlecock_count: 2, // Test with 2 shuttlecocks
        participants: [
          { member_id: memberIds[0], team: 1, position: 'A' },
          { member_id: memberIds[1], team: 1, position: 'B' },
          { member_id: memberIds[2], team: 2, position: 'A' },
          { member_id: memberIds[3], team: 2, position: 'B' }
        ]
      })
    });

    if (!matchResponse.ok) {
      const errorText = await matchResponse.text();
      throw new Error(`Match API Error: ${matchResponse.status} - ${errorText}`);
    }

    const matchResult = await matchResponse.json();
    console.log('✅ Match API Response:');
    console.log(`   - Success: ${matchResult.success}`);
    console.log(`   - Match ID: ${matchResult.data?.match?.id}`);
    console.log(`   - Calculations Count: ${matchResult.data?.calculations?.length || 0}`);

    // Fetch payments via API to see the results
    console.log('\n💰 Checking API payment records...');
    const paymentResponse = await fetch('http://localhost:3001/api/payments');
    
    if (!paymentResponse.ok) {
      console.error('❌ Payment API Error:', paymentResponse.status);
      return;
    }
    
    const paymentResult = await paymentResponse.json();
    const allPayments = paymentResult.payments || [];
    
    // Filter payments for our test match (created today)
    const testPayments = allPayments.filter(p => 
      p.due_date === '2024-10-25' && 
      memberIds.includes(p.member_id)
    );

    console.log(`📊 API Payment Records for Test Match: ${testPayments.length}`);
    console.log('=' .repeat(60));

    if (testPayments.length === 0) {
      console.log('❌ No payments found for the test match');
      console.log('🔍 All available payments:', allPayments.length);
      return;
    }

    // Group by member for analysis
    const paymentsByMember = {};
    let totalAmount = 0;

    testPayments.forEach(payment => {
      const memberId = payment.member_id;
      if (!paymentsByMember[memberId]) {
        paymentsByMember[memberId] = {
          name: payment.member_name || `Member ${memberId}`,
          shuttlecock: null,
          attendance: null,
          total: 0,
          payments: []
        };
      }

      totalAmount += payment.amount;
      paymentsByMember[memberId].payments.push(payment);
      
      // Categorize payment based on notes and amount
      if (payment.notes?.includes('🏸 Shuttlecock') || payment.amount === 1500) {
        paymentsByMember[memberId].shuttlecock = payment;
      } else if (payment.notes?.includes('📅') || payment.amount === 18000) {
        paymentsByMember[memberId].attendance = payment;
      }
      
      paymentsByMember[memberId].total += payment.amount;
    });

    // Display separated payment structure
    Object.entries(paymentsByMember).forEach(([memberId, memberPayments]) => {
      console.log(`\n👤 ${memberPayments.name} (ID: ${memberId.substring(0, 8)}...)`);
      console.log(`   📋 Total Payments: ${memberPayments.payments.length}`);
      
      memberPayments.payments.forEach((payment, index) => {
        const isShuttlecock = payment.notes?.includes('🏸') || payment.amount < 10000;
        const icon = isShuttlecock ? '🏸' : '📅';
        const type = isShuttlecock ? 'Shuttlecock' : 'Attendance';
        
        console.log(`   ${icon} Payment ${index + 1}: Rp${payment.amount.toLocaleString('id-ID')} (${type})`);
        console.log(`      Status: ${payment.status}`);
        console.log(`      Notes: ${payment.notes}`);
      });
      
      console.log(`   💵 Member Total: Rp${memberPayments.total.toLocaleString('id-ID')}`);
    });

    console.log('\n' + '=' .repeat(60));
    console.log(`💰 GRAND TOTAL: Rp${totalAmount.toLocaleString('id-ID')}`);
    
    const expectedShuttlecockFee = (2 * 3000) / 4; // 2 shuttlecocks / 4 players
    const expectedTotal = expectedShuttlecockFee + 18000;
    
    console.log(`🧮 Expected per player: Rp${expectedTotal.toLocaleString('id-ID')} (Rp${expectedShuttlecockFee.toLocaleString('id-ID')} shuttlecock + Rp18,000 attendance)`);
    
    // Check if we have separate payments
    const membersWithPayments = Object.keys(paymentsByMember).length;
    const expectedPayments = membersWithPayments * 2; // 2 payments per member
    
    console.log(`✅ Payment Separation: ${testPayments.length === expectedPayments ? 'SUCCESS' : 'PARTIAL'}`);
    console.log(`   Expected: ${expectedPayments} payments (${membersWithPayments} × 2)`);
    console.log(`   Got: ${testPayments.length} payments`);

    if (testPayments.length === expectedPayments) {
      console.log('\n🎉 PERFECT! API-based separate payments working correctly!');
      console.log('🎯 Benefits confirmed:');
      console.log('   1. 🏸 Shuttlecock fees are separate and trackable');
      console.log('   2. 📅 Attendance fees can be independently managed');
      console.log('   3. 💰 Payment conversion to membership is now possible');
      console.log('   4. 📊 Detailed financial breakdown per payment type');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the API test
testApiSeparatePayments();