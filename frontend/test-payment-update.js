const testPaymentUpdate = async () => {
  try {
    console.log('🧪 Testing payment update API...');

    // First get existing payments to find a valid ID
    const listResponse = await fetch('http://localhost:3000/api/payments');
    const listResult = await listResponse.json();
    
    if (!listResult.success || !listResult.data) {
      console.error('❌ Could not fetch payments list');
      return;
    }
    
    const payments = listResult.data.payments || listResult.data;
    if (payments.length === 0) {
      console.error('❌ No payments available to test');
      return;
    }
    
    const testPayment = payments.find(p => p.status === 'pending');
    if (!testPayment) {
      console.error('❌ No pending payments available to test');
      return;
    }
    
    console.log('📋 Testing with payment:', {
      id: testPayment.id,
      member_id: testPayment.member_id,
      amount: testPayment.amount,
      current_status: testPayment.status
    });

    // Test update
    const updateData = {
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      notes: 'Test payment update - API validation'
    };

    console.log('📤 Update payload:', updateData);

    const updateResponse = await fetch(`http://localhost:3000/api/payments/${testPayment.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    console.log('📡 Update response status:', updateResponse.status);
    
    const updateResult = await updateResponse.json();
    console.log('📥 Update response:', updateResult);

    if (updateResponse.ok && updateResult.success) {
      console.log('✅ Payment update API test PASSED!');
      
      // Revert the test change
      const revertResponse = await fetch(`http://localhost:3000/api/payments/${testPayment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'pending',
          notes: 'Reverted test payment'
        })
      });
      
      if (revertResponse.ok) {
        console.log('🔄 Test payment reverted to pending');
      }
    } else {
      console.error('❌ Payment update API test FAILED:', updateResult.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

testPaymentUpdate();