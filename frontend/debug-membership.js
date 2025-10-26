const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://knhbfmbstwvqxyxanbfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuaGJmbWJzdHd2cXh5eGFuYmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzMTAwNDcsImV4cCI6MjA0Njg4NjA0N30.Rq0sMorc5sVtrcVeQhyy0E1Kn_k4pGdX-CudkCEmgNg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMembershipCreation() {
  try {
    console.log('🔍 Debugging membership payment creation...');
    
    // First, let's check the payments table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('payments')
      .select()
      .limit(1);
    
    console.log('📋 Current payments table structure:', tableInfo);
    if (tableError) {
      console.error('❌ Table error:', tableError);
    }

    // Test creating a membership payment
    const membershipPayment = {
      member_id: 'ec8b2a00-1234-5678-9abc-000000000000', // Use a test member ID
      type: 'daily', // Use existing allowed type
      amount: 40000,
      notes: 'Monthly Membership - October 2025 (4 weeks) - MEMBERSHIP PAYMENT',
      due_date: '2025-11-05',
      status: 'pending'
    };

    console.log('💳 Creating test membership payment:', membershipPayment);
    
    const { data: createResult, error: createError } = await supabase
      .from('payments')
      .insert(membershipPayment)
      .select()
      .single();

    if (createError) {
      console.error('❌ Create error:', createError);
      console.error('❌ Error details:', JSON.stringify(createError, null, 2));
    } else {
      console.log('✅ Membership payment created successfully:', createResult);
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugMembershipCreation();