// Test script to verify Kevin's payment dashboard shows correct amounts everywhere
async function testKevinDashboard() {
  try {
    console.log('🧪 Testing Kevin\'s payment dashboard...');
    
    // Test Kevin's authentication
    const authResponse = await fetch('http://localhost:3000/api/auth/me?test_user=kevin');
    const authData = await authResponse.json();
    
    if (authData.success) {
      console.log('✅ Kevin authentication:', authData.user.name);
      
      // Test Kevin's payments 
      const paymentResponse = await fetch(`http://localhost:3000/api/payments?member_id=${authData.user.id}`);
      const paymentData = await paymentResponse.json();
      
      if (paymentData.success) {
        const payments = paymentData.data.payments || paymentData.data;
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
        
        console.log('📊 Payment Summary:');
        console.log('   Total payments:', payments.length);
        console.log('   Total amount:', `Rp${totalAmount.toLocaleString('id-ID')}`);
        console.log('   Pending amount:', `Rp${pendingAmount.toLocaleString('id-ID')}`);
        
        // Expected results
        console.log('');
        console.log('✅ Expected Dashboard Results:');
        console.log('   "My Payments" section: Rp27,000 (total of all payments)');
        console.log('   "Pending Payments" section: Rp27,000 (total of pending payments)');
        console.log('   "Payments Due" section: Rp27,000 (same as pending)');
        
        if (totalAmount === 27000 && pendingAmount === 27000) {
          console.log('');
          console.log('🎉 SUCCESS! Kevin should see Rp27,000 in all sections');
        } else {
          console.log('');
          console.log('❌ MISMATCH detected!');
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testKevinDashboard();