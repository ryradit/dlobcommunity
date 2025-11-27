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

async function createBidirectionalTestPayments() {
  try {
    console.log('🎯 Creating bidirectional conversion test payments...');

    // Get members
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, email')
      .limit(5);

    if (membersError || !members || members.length === 0) {
      console.error('❌ No members found:', membersError);
      return;
    }

    console.log(`✅ Found ${members.length} members for test payments`);

    const today = new Date();
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + (6 - today.getDay()));
    if (today.getDay() === 6) {
      nextSaturday.setDate(today.getDate() + 7);
    }

    const testPayments = [];

    // Create different payment scenarios for testing bidirectional conversions
    members.forEach((member, index) => {
      if (index === 0) {
        // Non-member: Full session payment (can convert TO membership)
        testPayments.push({
          member_id: member.id,
          amount: 23000, // 18000 + 5000
          type: 'daily',
          due_date: nextSaturday.toISOString().split('T')[0],
          status: 'pending',
          notes: `Saturday Session + Shuttlecock - ${member.name} (Non-member rate)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else if (index === 1) {
        // Member: Shuttlecock-only payment (can convert TO daily)
        testPayments.push({
          member_id: member.id,
          amount: 5000, // Only shuttlecock
          type: 'daily',
          due_date: nextSaturday.toISOString().split('T')[0],
          status: 'pending',
          notes: `🏸 SHUTTLECOCK FEE - Member Rate - ${member.name}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else if (index === 2) {
        // Non-member: Another full payment for testing
        testPayments.push({
          member_id: member.id,
          amount: 18000, // Session only
          type: 'daily',
          due_date: nextSaturday.toISOString().split('T')[0],
          status: 'pending',
          notes: `Saturday Session Fee - ${member.name} (Non-member)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else if (index === 3) {
        // Member: Another shuttlecock payment
        testPayments.push({
          member_id: member.id,
          amount: 5000,
          type: 'daily',
          due_date: nextSaturday.toISOString().split('T')[0],
          status: 'pending',
          notes: `🏸 Shuttlecock fee (Member rate) - ${member.name}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else {
        // Example of existing monthly membership
        testPayments.push({
          member_id: member.id,
          amount: 40000,
          type: 'monthly',
          due_date: '2025-11-05',
          status: 'pending',
          notes: `Monthly Membership - October 2025 (4 weeks) - ${member.name}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });

    // Insert test payments
    const { data: insertedPayments, error: insertError } = await supabase
      .from('payments')
      .insert(testPayments)
      .select();

    if (insertError) {
      console.error('❌ Error creating test payments:', insertError);
      return;
    }

    console.log(`✅ Created ${insertedPayments.length} bidirectional test payments:`);
    insertedPayments.forEach((payment, index) => {
      const member = members.find(m => m.id === payment.member_id);
      console.log(`   ${index + 1}. ${member?.name}: Rp${payment.amount.toLocaleString()} - ${payment.type} (${payment.status})`);
    });

    console.log('\n🎯 Test Scenarios Created:');
    console.log('   👑 Crown Icons (Convert TO Membership):');
    console.log('     • Payments ≥ Rp18,000 (non-member rates)');
    console.log('     • Shows Crown (👑) button');
    console.log('     • Converts to Rp5,000 shuttlecock + creates monthly membership');
    console.log('');
    console.log('   🔄 Reverse Icons (Convert TO Daily):');
    console.log('     • Payments ≤ Rp5,000 (member rates/shuttlecock-only)');
    console.log('     • Shows Reverse (🔄) button');
    console.log('     • Converts to Rp23,000 (session + shuttlecock)');
    console.log('');
    console.log('✨ How to test:');
    console.log('1. Go to http://localhost:3000/admin/payments');
    console.log('2. Look for Crown (👑) icons next to ≥Rp18k payments');
    console.log('3. Look for Reverse (🔄) icons next to ≤Rp5k payments');
    console.log('4. Test both conversions: non-member → member → non-member');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the bidirectional test data creation
createBidirectionalTestPayments();