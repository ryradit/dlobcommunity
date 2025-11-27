const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestSessionPayments() {
  try {
    console.log('🏸 Creating test session payments for membership conversion demo...');

    // Get all members
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, email')
      .limit(5);

    if (membersError || !members || members.length === 0) {
      console.error('❌ No members found:', membersError);
      return;
    }

    console.log(`✅ Found ${members.length} members for test payments`);

    // Create test session payments that look like Saturday attendance payments
    const testPayments = [];
    const today = new Date();
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + (6 - today.getDay()));
    if (today.getDay() === 6) {
      nextSaturday.setDate(today.getDate() + 7);
    }

    members.forEach((member, index) => {
      // Create different types of payments for testing
      if (index === 0) {
        // First member - regular session payment (perfect for conversion test)
        testPayments.push({
          member_id: member.id,
          amount: 18000,
          type: 'daily',
          due_date: nextSaturday.toISOString().split('T')[0],
          status: 'pending',
          notes: `Saturday Badminton Session - ${member.name}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else if (index === 1) {
        // Second member - session + shuttlecock
        testPayments.push({
          member_id: member.id,
          amount: 23000, // 18000 + 5000 shuttlecock
          type: 'daily',
          due_date: nextSaturday.toISOString().split('T')[0],
          status: 'pending',
          notes: `Saturday Session + Shuttlecock - ${member.name}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else if (index === 2) {
        // Third member - already has membership (paid session)
        testPayments.push({
          member_id: member.id,
          amount: 5000, // Only shuttlecock
          type: 'daily',
          due_date: nextSaturday.toISOString().split('T')[0],
          status: 'pending',
          notes: `Shuttlecock fee (Member rate) - ${member.name}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });

    // Insert test payments into the existing payments table
    const { data: insertedPayments, error: insertError } = await supabase
      .from('payments')
      .insert(testPayments)
      .select();

    if (insertError) {
      console.error('❌ Error creating test payments:', insertError);
      return;
    }

    console.log(`✅ Created ${insertedPayments.length} test session payments:`);
    insertedPayments.forEach((payment, index) => {
      const member = members.find(m => m.id === payment.member_id);
      console.log(`   ${index + 1}. ${member?.name}: Rp${payment.amount.toLocaleString()} - ${payment.type} (${payment.status})`);
    });

    console.log('\n🎯 Test Scenarios Created:');
    console.log('   💰 Member 1: Rp18,000 session payment (ready for membership conversion)');
    console.log('   💰 Member 2: Rp23,000 session+shuttlecock (ready for membership conversion)');
    console.log('   💰 Member 3: Rp5,000 shuttlecock only (already has membership)');
    
    console.log('\n✨ How to test:');
    console.log('1. Go to http://localhost:3000/admin/payments');
    console.log('2. Look for payments with Crown (👑) icon in Actions column');
    console.log('3. Click the Crown icon to convert session payment to membership');
    console.log('4. This will create a monthly membership payment and mark session as covered');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test data creation
createTestSessionPayments();