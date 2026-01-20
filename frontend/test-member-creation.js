// Quick test to verify member creation is working with real Supabase
async function testMemberCreation() {
  try {
    console.log('🧪 Testing member creation...');
    
    const testMember = {
      name: 'Test Member ' + Date.now(),
      email: `test${Date.now()}@dlob.com`,
      role: 'member',
      membership_type: 'regular'
    };
    
    console.log('📤 Sending request:', testMember);
    
    const response = await fetch('/api/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMember)
    });
    
    const result = await response.json();
    console.log('📥 Response:', result);
    
    if (result.success) {
      console.log('✅ Member creation successful!');
      if (result.warning) {
        console.log('⚠️ Warning:', result.warning);
      } else {
        console.log('✅ Stored in real Supabase database');
      }
    } else {
      console.error('❌ Member creation failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

// Make function available globally for browser console testing
if (typeof window !== 'undefined') {
  window.testMemberCreation = testMemberCreation;
  console.log('🧪 Test function available: window.testMemberCreation()');
}

export { testMemberCreation };