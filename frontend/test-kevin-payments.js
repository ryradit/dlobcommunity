// Test Kevin Haryono's payment data to verify member dashboard accuracy
const BASE_URL = 'http://localhost:3000';

async function testKevinPayments() {
  try {
    console.log('🔍 Testing Kevin Haryono\'s payment data consistency...');
    console.log('');
    
    // Get Kevin's member info
    const membersResponse = await fetch(`${BASE_URL}/api/members`);
    const membersData = await membersResponse.json();
    
    const kevin = membersData.data.find(m => m.name.toLowerCase().includes('kevin'));
    
    if (!kevin) {
      console.error('❌ Kevin Haryono not found in members list');
      return;
    }
    
    console.log('👤 Kevin Haryono Info:');
    console.log(`   Name: ${kevin.name}`);
    console.log(`   ID: ${kevin.id}`);
    console.log(`   Email: ${kevin.email}`);
    console.log('');
    
    // Get Kevin's payments
    const paymentsResponse = await fetch(`${BASE_URL}/api/payments?member_id=${kevin.id}`);
    const paymentsData = await paymentsResponse.json();
    
    if (!paymentsData.success) {
      console.error('❌ Failed to fetch Kevin\'s payments');
      return;
    }
    
    const payments = paymentsData.data.payments || paymentsData.data || [];
    
    console.log('💳 Kevin\'s Payments:');
    let totalAmount = 0;
    
    payments.forEach((payment, index) => {
      console.log(`   ${index + 1}. ${payment.type.toUpperCase()}`);
      console.log(`      Amount: Rp${payment.amount.toLocaleString('id-ID')}`);
      console.log(`      Status: ${payment.status}`);
      console.log(`      Notes: ${payment.notes || 'No notes'}`);
      console.log(`      Due Date: ${payment.due_date}`);
      console.log('');
      
      totalAmount += payment.amount;
    });
    
    console.log('📊 Summary:');
    console.log(`   Total Payments: ${payments.length}`);
    console.log(`   Total Amount: Rp${totalAmount.toLocaleString('id-ID')}`);
    console.log('');
    
    // Verify this matches admin dashboard expectation
    if (totalAmount === 27000) {
      console.log('✅ SUCCESS: Total matches admin dashboard (Rp27,000)');
    } else {
      console.log(`❌ MISMATCH: Expected Rp27,000 but got Rp${totalAmount.toLocaleString('id-ID')}`);
    }
    
    console.log('');
    console.log('🎯 This is the exact data that should appear in Kevin\'s member dashboard');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testKevinPayments();