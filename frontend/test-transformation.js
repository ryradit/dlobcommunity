// Test payment transformation to find ID issues
const testPaymentTransformation = () => {
  try {
    console.log('🔍 Testing payment transformation logic...');
    
    // Mock API response similar to what we get
    const mockApiResponse = {
      success: true,
      data: {
        payments: [
          {
            id: 'test-uuid-123-456-789',
            member_id: 'member-uuid-456',
            amount: 18000,
            type: 'daily',
            status: 'pending',
            due_date: '2025-10-26',
            notes: 'Saturday Badminton Session - Test Member'
          }
        ]
      }
    };
    
    // Mock member data
    const mockMembers = [
      {
        id: 'member-uuid-456',
        name: 'Test Member',
        email: 'test@example.com'
      }
    ];
    
    console.log('📋 Mock API data:', mockApiResponse);
    
    // Simulate the transformation logic from loadPaymentData
    const paymentsList = mockApiResponse.data.payments;
    
    const transformedPayments = paymentsList.map((payment) => {
      const member = mockMembers.find((m) => m.id === payment.member_id);
      
      const transformed = {
        id: payment.id,
        memberId: payment.member_id,
        memberName: member?.name || 'Unknown Member',
        memberEmail: member?.email || 'unknown@email.com',
        requirementId: payment.match_id || 'general',
        requirementTitle: `Saturday Session Fee - ${new Date(payment.due_date).toLocaleDateString('id-ID')}`,
        amount: payment.amount,
        dueDate: payment.due_date,
        paidDate: payment.paid_date,
        status: payment.status,
        paidAmount: payment.status === 'paid' ? payment.amount : undefined,
        paymentMethod: undefined,
        notes: payment.notes
      };
      
      console.log('🔄 Transformation result:', {
        originalId: payment.id,
        transformedId: transformed.id,
        idMatch: payment.id === transformed.id,
        hasValidId: !!transformed.id && transformed.id !== 'undefined',
        memberData: !!member
      });
      
      return transformed;
    });
    
    console.log('✅ Transformed payments:', transformedPayments);
    
    // Test what happens when we select this payment
    const selectedPayment = transformedPayments[0];
    console.log('👑 Simulated selectedPayment:', {
      id: selectedPayment.id,
      hasId: !!selectedPayment.id,
      idType: typeof selectedPayment.id,
      idValue: selectedPayment.id
    });
    
  } catch (error) {
    console.error('❌ Transformation test error:', error);
  }
};

testPaymentTransformation();