const memberIds = [
  "64d98dad-3381-4274-b18e-ba4f5ddd4f2a",
  "a82de7ca-404a-46df-909e-36b38f09060c", 
  "81c158c7-ff22-4dcd-b35d-d24f0a3490d5",
  "2b2f7653-0f25-4321-b1a8-0debd40f483f"
];

const matchData = {
  date: "2025-10-24",
  time: "20:30",
  field_number: 1,
  shuttlecock_count: 1,
  participants: [
    {
      member_id: memberIds[0],
      team: "team1",
      position: "player1"
    },
    {
      member_id: memberIds[1],
      team: "team1", 
      position: "player2"
    },
    {
      member_id: memberIds[2],
      team: "team2",
      position: "player1"
    },
    {
      member_id: memberIds[3],
      team: "team2",
      position: "player2"
    }
  ],
  team1_score: 21,
  team2_score: 18,
  game_scores: [
    {
      game_number: 1,
      team1_score: 21,
      team2_score: 18
    }
  ]
};

console.log('🔥 PAYMENT CREATION DEBUG TEST - Starting fresh match creation...');
console.log('📊 Match data:', JSON.stringify(matchData, null, 2));

console.log('🔄 Sending POST request to http://localhost:3000/api/matches...');

fetch('http://localhost:3000/api/matches', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(matchData)
})
.then(response => {
  console.log('📡 Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('📋 Full API Response:');
  console.log(JSON.stringify(data, null, 2));
  
  if (data.success) {
    console.log('✅ Match created successfully!');
    console.log('🆔 Match ID:', data.data.match.id);
    
    if (data.data.calculations) {
      console.log('💰 Payment calculations found:', data.data.calculations.length);
      data.data.calculations.forEach((calc, index) => {
        console.log(`   Player ${index + 1}: ${calc.member_name} - Total: Rp${calc.total_due}`);
      });
    } else {
      console.log('⚠️ No payment calculations returned');
    }
    
    // Wait then check for actual payment records in database
    console.log('\n⏳ Waiting 3 seconds then checking actual payment records in database...');
    
    setTimeout(() => {
      // Check payments created for this match
      fetch('http://localhost:3000/api/payments')
        .then(res => res.json())
        .then(payments => {
          console.log('📊 Total payments in database:', payments.data?.length || 0);
          
          if (payments.data && payments.data.length > 0) {
            const recentPayments = payments.data.filter(p => {
              const paymentTime = new Date(p.created_at || p.due_date);
              const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
              return paymentTime > fiveMinutesAgo;
            });
            
            console.log('🕒 Recent payments (last 5 minutes):', recentPayments.length);
            
            if (recentPayments.length > 0) {
              console.log('✅ Payment records found:');
              recentPayments.forEach(payment => {
                console.log(`   - ${payment.member?.name || payment.member_id}: ${payment.type} - Rp${payment.amount}`);
              });
            } else {
              console.log('❌ NO RECENT PAYMENT RECORDS FOUND - Payments not being created!');
            }
          } else {
            console.log('❌ NO PAYMENTS IN DATABASE AT ALL - Payment creation is completely failing!');
          }
        })
        .catch(err => {
          console.error('❌ Error checking payments:', err.message);
        });
    }, 3000);
    
  } else {
    console.log('❌ Match creation failed:', data.error);
  }
})
.catch(error => {
  console.error('❌ Request failed:', error.message);
});