// Test the client-side MembershipService
const testMembershipService = () => {
  console.log('🧪 Testing MembershipService client-side functions...');
  
  // Test payment detection functions
  const testPayments = [
    { amount: 23000, notes: 'Saturday Session + Shuttlecock - Non-member rate' },
    { amount: 5000, notes: '🏸 SHUTTLECOCK FEE - Member Rate' },
    { amount: 18000, notes: 'Saturday Session Fee - Non-member' },
    { amount: 5000, notes: 'Shuttlecock fee (Member rate)' }
  ];
  
  console.log('🔍 Testing payment detection:');
  testPayments.forEach((payment, index) => {
    const isShuttlecockOnly = typeof window !== 'undefined' && window.MembershipService 
      ? window.MembershipService.isShuttlecockOnlyPayment(payment.amount, payment.notes)
      : payment.amount <= 5000;
    
    const canConvertToMembership = typeof window !== 'undefined' && window.MembershipService
      ? window.MembershipService.canConvertToMembership({ ...payment, status: 'pending' })
      : payment.amount >= 18000;
      
    const canConvertToDaily = typeof window !== 'undefined' && window.MembershipService
      ? window.MembershipService.canConvertToDailyPayment({ ...payment, status: 'pending' })
      : payment.amount <= 5000;
    
    console.log(`   ${index + 1}. Rp${payment.amount.toLocaleString()}:`);
    console.log(`      - Shuttlecock-only: ${isShuttlecockOnly}`);
    console.log(`      - Can convert to membership (👑): ${canConvertToMembership}`);
    console.log(`      - Can convert to daily (🔄): ${canConvertToDaily}`);
  });
  
  // Test membership fee calculation
  console.log('\n💰 Testing membership fee calculation:');
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
  
  const fee = saturdayCount === 4 ? 40000 : 45000;
  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  console.log(`   Month: ${monthName}`);
  console.log(`   Saturdays: ${saturdayCount}`);
  console.log(`   Membership fee: Rp${fee.toLocaleString()}`);
  
  console.log('\n✅ MembershipService test completed!');
  console.log('Ready to test conversion buttons in the UI.');
};

// Run the test
testMembershipService();