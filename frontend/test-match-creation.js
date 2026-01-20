// Test match creation to see payment generation
const members = [
  { id: '64d98dad-3381-4274-b18e-ba4f5ddd4f2a', name: 'Adit' },
  { id: 'a82de7ca-404a-46df-909e-36b38f09060c', name: 'Ryan Radityatama' },
  { id: '81c158c7-ff22-4dcd-b35d-d24f0a3490d5', name: 'Ryan Radityatama' },
  { id: '2b2f7653-0f25-4321-b1a8-0debd40f483f', name: 'tian' }
];

async function testMatchCreation() {
  try {
    console.log('🎮 Testing match creation with payment generation...');

    const matchData = {
      date: '2025-10-24',
      time: '20:00',
      field_number: 1,
      shuttlecock_count: 1,
      participants: [
        { member_id: members[0].id, team: 'team1', position: 'player1' },
        { member_id: members[1].id, team: 'team1', position: 'player2' },
        { member_id: members[2].id, team: 'team2', position: 'player1' },
        { member_id: members[3].id, team: 'team2', position: 'player2' }
      ],
      team1_score: 21,
      team2_score: 19,
      game_scores: [{ game_number: 1, team1_score: 21, team2_score: 19 }]
    };

    console.log('📊 Match data:', JSON.stringify(matchData, null, 2));
    console.log('🔄 Sending POST request to /api/matches...');

    const response = await fetch('http://localhost:3000/api/matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(matchData)
    });

    console.log('📡 Response status:', response.status);
    
    const result = await response.json();
    console.log('📋 Response data:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ Match created successfully!');
      console.log('🆔 Match ID:', result.data.match.id);
      
      if (result.data.calculations && result.data.calculations.length > 0) {
        console.log('💰 Payment calculations:');
        result.data.calculations.forEach(calc => {
          console.log(`- ${calc.member_name}: Rp${calc.total_due.toLocaleString()}`);
          console.log(`  Shuttlecock: Rp${calc.shuttlecock_fee}`);
          console.log(`  Attendance: Rp${calc.attendance_fee}`);
        });
      } else {
        console.log('❌ No payment calculations found in response');
      }
      
      // Wait a moment then check if payments were created
      console.log('\n⏳ Waiting 2 seconds then checking payments...');
      setTimeout(async () => {
        try {
          const paymentsResponse = await fetch('http://localhost:3000/api/payments');
          const paymentsData = await paymentsResponse.json();
          
          if (paymentsData.success) {
            console.log(`📊 Total payments in system: ${paymentsData.data.payments.length}`);
            
            // Filter payments created in the last minute
            const recentPayments = paymentsData.data.payments.filter(p => {
              const paymentTime = new Date(p.created_at);
              const now = new Date();
              return (now - paymentTime) < 60000; // Last minute
            });
            
            console.log(`🕒 Recent payments (last minute): ${recentPayments.length}`);
            recentPayments.forEach(p => {
              console.log(`- ${p.member?.name || 'Unknown'}: ${p.type} - Rp${p.amount.toLocaleString()}`);
              console.log(`  Notes: ${p.notes || 'No notes'}`);
            });
          } else {
            console.log('❌ Failed to fetch payments:', paymentsData.error);
          }
        } catch (e) {
          console.log('❌ Error checking payments:', e.message);
        }
      }, 2000);
      
    } else {
      console.log('❌ Match creation failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMatchCreation();