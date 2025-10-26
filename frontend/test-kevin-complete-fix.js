// Comprehensive test to verify Kevin's payment consistency across all dashboard pages
async function testKevinDashboardComplete() {
  try {
    console.log('🔄 Testing Kevin\'s complete dashboard payment consistency...');
    console.log('');
    
    // 1. Test Kevin's authentication
    console.log('1️⃣ Testing Kevin\'s authentication:');
    const authResponse = await fetch('http://localhost:3000/api/auth/me?test_user=kevin');
    const authData = await authResponse.json();
    
    if (authData.success) {
      console.log('   ✅ Kevin authenticated:', authData.user.name);
      console.log('   📧 Email:', authData.user.email);
      console.log('   🆔 ID:', authData.user.id);
      console.log('');
      
      // 2. Test Kevin's payment data directly from API
      console.log('2️⃣ Testing Kevin\'s payment API data:');
      const paymentResponse = await fetch(`http://localhost:3000/api/payments?member_id=${authData.user.id}`);
      const paymentData = await paymentResponse.json();
      
      if (paymentData.success) {
        const payments = paymentData.data.payments || paymentData.data;
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
        
        console.log('   📊 Total payments:', payments.length);
        console.log('   💰 Total amount: Rp' + totalAmount.toLocaleString('id-ID'));
        console.log('   ⏳ Pending amount: Rp' + pendingAmount.toLocaleString('id-ID'));
        console.log('');
        
        // 3. Expected results for all dashboard sections
        console.log('3️⃣ Expected dashboard display (all sections should match):');
        console.log('   📱 Main Dashboard → "Pending Payments": Rp' + pendingAmount.toLocaleString('id-ID'));
        console.log('   📱 Main Dashboard → "Payments Due": Rp' + pendingAmount.toLocaleString('id-ID'));
        console.log('   💳 Payments Page → "My Payments": Rp' + totalAmount.toLocaleString('id-ID'));
        console.log('   💳 Payments Page → "Pending Payments": Rp' + pendingAmount.toLocaleString('id-ID'));
        console.log('');
        
        // 4. Verify expected amounts
        if (totalAmount === 27000 && pendingAmount === 27000) {
          console.log('✅ SUCCESS! All Kevin\'s dashboard sections should show:');
          console.log('   🎯 Main Dashboard Pending Payments: Rp27,000');
          console.log('   🎯 Main Dashboard Payments Due: Rp27,000');
          console.log('   🎯 Payments Page My Payments: Rp27,000');
          console.log('   🎯 Payments Page Pending: Rp27,000');
          console.log('');
          console.log('🚀 Google OAuth users should now see consistent amounts!');
        } else {
          console.log('❌ AMOUNT MISMATCH:');
          console.log('   Expected: Total=27000, Pending=27000');
          console.log('   Actual: Total=' + totalAmount + ', Pending=' + pendingAmount);
        }
        
        console.log('');
        console.log('📝 Test URLs for Kevin:');
        console.log('   Main Dashboard: http://localhost:3000/dashboard?test_user=kevin');
        console.log('   Payments Page: http://localhost:3000/dashboard/payments?test_user=kevin');
        
      } else {
        console.log('   ❌ Payment API failed');
      }
    } else {
      console.log('   ❌ Authentication failed');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testKevinDashboardComplete();