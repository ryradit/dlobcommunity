// Test DLOB AI Enhanced Integration
// This script tests the AI chatbot functionality with authentication

const { enhancedDlobAI } = require('./src/lib/enhanced-dlob-ai.ts');
const { supabase } = require('./src/lib/supabase');

async function testEnhancedAI() {
  console.log('🧪 Testing DLOB AI Enhanced Integration...\n');

  // Test 1: Anonymous user interaction
  console.log('📝 Test 1: Anonymous User');
  try {
    const response1 = await enhancedDlobAI.generatePersonalizedResponse(
      "Halo, saya mau tanya tentang komunitas DLOB"
    );
    
    console.log('User Message: "Halo, saya mau tanya tentang komunitas DLOB"');
    console.log('AI Response:', response1.response);
    console.log('Success:', response1.success);
    console.log('Context Used:', response1.contextUsed || 'None');
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Check welcome messages
  console.log('📝 Test 2: Welcome Messages');
  
  const welcomeAnon = enhancedDlobAI.getWelcomeMessage();
  console.log('Anonymous Welcome:', welcomeAnon);
  
  // Mock user object
  const mockUser = {
    id: 'test-user-123',
    email: 'ryan@dlob.com',
    user_metadata: { full_name: 'Ryan Test' }
  };
  
  const welcomeAuth = enhancedDlobAI.getWelcomeMessage(mockUser);
  console.log('Authenticated Welcome:', welcomeAuth);

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Quick replies
  console.log('📝 Test 3: Quick Replies');
  
  const quickRepliesAnon = enhancedDlobAI.getQuickReplies();
  console.log('Anonymous Quick Replies:', quickRepliesAnon);
  
  const quickRepliesAuth = enhancedDlobAI.getQuickReplies(mockUser);
  console.log('Authenticated Quick Replies:', quickRepliesAuth);

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: API Configuration
  console.log('📝 Test 4: Configuration Status');
  console.log('Gemini API Configured:', enhancedDlobAI.isConfigured());
  
  // Check environment variables
  console.log('Environment Check:');
  console.log('- NEXT_PUBLIC_GEMINI_API_KEY:', process.env.NEXT_PUBLIC_GEMINI_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 5: Payment-related queries (mock)
  console.log('📝 Test 5: Payment Query Test');
  try {
    const paymentResponse = await enhancedDlobAI.generatePersonalizedResponse(
      "Berapa tagihan saya hari ini?"
    );
    
    console.log('User Message: "Berapa tagihan saya hari ini?"');
    console.log('AI Response:', paymentResponse.response);
    console.log('Success:', paymentResponse.success);
  } catch (error) {
    console.error('❌ Test 5 failed:', error.message);
  }

  console.log('\n🎉 Enhanced AI Integration Testing Complete!');
  console.log('\nNext Steps:');
  console.log('1. Deploy the database schema: node ../database/deploy-ai-chat-schema.js');
  console.log('2. Set up all environment variables in .env.local');
  console.log('3. Test with real authenticated users in the browser');
  console.log('4. Monitor AI analytics in the database');
}

// Run the test
if (require.main === module) {
  testEnhancedAI().catch(console.error);
}

module.exports = testEnhancedAI;