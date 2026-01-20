const testMembershipAPI = async () => {
  try {
    console.log('🧪 Testing membership payment creation API...');

    // Test payment data
    const testPayment = {
      member_id: 'ec8b2a00-1234-5678-9abc-000000000001', // Use first test member
      amount: 40000,
      type: 'monthly',
      due_date: '2025-11-05',
      notes: 'Monthly Membership - October 2025 (4 weeks) - MEMBERSHIP PAYMENT'
    };

    console.log('📤 Sending request to API:', testPayment);

    const response = await fetch('http://localhost:3000/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayment)
    });

    console.log('📡 Response status:', response.status);
    
    const result = await response.json();
    console.log('📥 Response body:', result);

    if (response.ok) {
      console.log('✅ Membership payment API test PASSED!');
    } else {
      console.error('❌ Membership payment API test FAILED:', result.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

testMembershipAPI();