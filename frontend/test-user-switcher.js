// Test script to verify user switcher functionality
const users = ['kevin', 'ryan', 'adit', 'wahyu', 'tian'];

async function testUserSwitcher() {
  console.log('🔄 Testing user switcher functionality...\n');

  for (const user of users) {
    try {
      console.log(`👤 Testing user: ${user}`);
      
      // Test authentication API with user parameter
      const authResponse = await fetch(`http://localhost:3000/api/auth/me?test_user=${user}`);
      const authData = await authResponse.json();
      
      if (authData.success && authData.user) {
        console.log(`✅ Auth: ${authData.user.name} (ID: ${authData.user.id})`);
        
        // Test payment API for this user
        const paymentResponse = await fetch(`http://localhost:3000/api/payments?member_id=${authData.user.id}`);
        const paymentData = await paymentResponse.json();
        
        if (paymentData.success && paymentData.data) {
          const payments = paymentData.data.payments || paymentData.data;
          const total = payments.reduce((sum, p) => sum + p.amount, 0);
          
          console.log(`💰 Payments: ${payments.length} payments totaling Rp${total.toLocaleString('id-ID')}`);
        } else {
          console.log(`❌ Payment fetch failed for ${user}`);
        }
      } else {
        console.log(`❌ Auth failed for ${user}`);
      }
      
      console.log(''); // Empty line for readability
    } catch (error) {
      console.error(`❌ Error testing ${user}:`, error.message);
      console.log('');
    }
  }

  console.log('✅ User switcher test completed!');
  console.log('\n📝 You can now test the member dashboard with different users:');
  console.log('   • http://localhost:3000/dashboard/payments?test_user=kevin (Kevin - Rp27,000)');
  console.log('   • http://localhost:3000/dashboard/payments?test_user=ryan (Ryan - Rp64,000)');
  console.log('   • http://localhost:3000/dashboard/payments?test_user=adit (Adit - Rp51,000)');
  console.log('   • http://localhost:3000/dashboard/payments?test_user=wahyu (Wahyu - Rp45,000)');
  console.log('   • http://localhost:3000/dashboard/payments?test_user=tian (Tian - Rp27,000)');
}

testUserSwitcher().catch(console.error);