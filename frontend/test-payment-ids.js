const testPaymentIds = async () => {
  try {
    console.log('🔍 Testing payment IDs from API...');

    const response = await fetch('http://localhost:3000/api/payments');
    const result = await response.json();

    console.log('📊 API Response Structure:', {
      success: result.success,
      hasData: !!result.data,
      dataType: typeof result.data,
      dataKeys: result.data ? Object.keys(result.data) : []
    });

    if (result.success && result.data) {
      const payments = result.data.payments || result.data;
      console.log(`📋 Found ${payments.length} payments`);
      
      payments.slice(0, 3).forEach((payment, index) => {
        console.log(`💳 Payment ${index + 1}:`, {
          id: payment.id,
          member_id: payment.member_id,
          amount: payment.amount,
          type: payment.type,
          status: payment.status,
          hasValidId: !!payment.id && payment.id !== 'undefined'
        });
      });
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

testPaymentIds();