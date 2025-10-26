// Debug DLOB AI User Context
// Run this in browser console to test user context retrieval

async function debugUserContext() {
  console.log('🧪 Debug DLOB AI User Context');
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('❌ Auth error:', error);
    return;
  }
  
  if (!user) {
    console.log('👤 No authenticated user found');
    return;
  }
  
  console.log('✅ User found:', user.email);
  
  // Check member data
  const { data: memberData, error: memberError } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', user.id)
    .single();
    
  console.log('👤 Member data:', memberData, memberError);
  
  if (!memberData) {
    console.log('⚠️ No member record found for user');
    return;
  }
  
  // Check payments directly
  const { data: payments, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('member_id', memberData.id);
    
  console.log('💰 Payments:', payments, paymentError);
  
  if (payments?.length) {
    const pending = payments.filter(p => p.status === 'pending');
    const overdue = payments.filter(p => p.status === 'overdue'); 
    const paid = payments.filter(p => p.status === 'paid');
    
    console.log('📊 Payment Summary:');
    console.log('- Pending:', pending.length, 'items, total:', pending.reduce((sum, p) => sum + (p.amount || 0), 0));
    console.log('- Overdue:', overdue.length, 'items, total:', overdue.reduce((sum, p) => sum + (p.amount || 0), 0));
    console.log('- Paid:', paid.length, 'items, total:', paid.reduce((sum, p) => sum + (p.amount || 0), 0));
  }
  
  // Test AI response
  try {
    console.log('🤖 Testing AI response...');
    const response = await enhancedDlobAI.generatePersonalizedResponse("Berapa tagihan saya?", user);
    console.log('💬 AI Response:', response.response);
    console.log('📈 Context Used:', response.contextUsed);
  } catch (aiError) {
    console.error('❌ AI Error:', aiError);
  }
}

// Run the debug
debugUserContext();