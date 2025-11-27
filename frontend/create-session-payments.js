const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSessionPaymentsTable() {
  try {
    console.log('🚀 Creating session_payments table...');

    // Try to create table manually
    console.log('🔧 Creating table manually...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.session_payments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        member_id UUID NOT NULL,
        match_id UUID,
        type VARCHAR(50) NOT NULL DEFAULT 'session',
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        due_date DATE NOT NULL,
        paid_date DATE,
        paid_amount DECIMAL(10,2),
        payment_method VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    const { error: createError } = await supabase.rpc('sql', {
      query: createTableSQL
    });

    if (createError) {
      console.error('❌ Manual table creation failed:', createError);
      
      // Alternative approach - use raw SQL execution
      console.log('🔄 Trying direct SQL execution...');
      
      const { data, error: directError } = await supabase
        .from('session_payments')
        .select('*')
        .limit(0);
      
      if (directError && directError.code === 'PGRST106') {
        // Table doesn't exist, let's try to create it via the SQL Editor approach
        console.log('✅ Confirmed table does not exist');
        
        // Create a simple version first
        try {
          // Try using a raw SQL query to Supabase (this may not work directly)
          console.log('📝 Please create the table manually in Supabase SQL Editor:');
          console.log('');
          console.log(createTableSQL);
          console.log('');
          console.log('After creating the table, rerun this script to add sample data.');
          
        } catch (sqlError) {
          console.error('❌ SQL execution error:', sqlError);
        }
      }
    } else {
      console.log('✅ Table created successfully');
    }

    // Test the table by fetching its structure
    console.log('🔍 Testing table creation...');
    
    const { data: tableInfo, error: testError } = await supabase
      .from('session_payments')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Table test failed:', testError.message);
      return;
    } else {
      console.log('✅ Table test successful');
    }

    // Get some sample member IDs to create test payments
    console.log('📝 Creating sample payment records...');
    
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name')
      .limit(3);

    if (membersError) {
      console.error('❌ Error fetching members:', membersError);
    } else if (members && members.length > 0) {
      console.log(`✅ Found ${members.length} members for sample data`);
      
      // Create sample payment records
      const samplePayments = [
        {
          member_id: members[0].id,
          type: 'session',
          amount: 18000,
          description: 'Saturday Badminton Session - Non-Member Rate',
          due_date: '2025-01-25',
          status: 'pending'
        },
        {
          member_id: members[0].id,
          type: 'shuttlecock',
          amount: 5000,
          description: 'Shuttlecock fee for Saturday session',
          due_date: '2025-01-25',
          status: 'pending'
        }
      ];

      if (members.length > 1) {
        samplePayments.push({
          member_id: members[1].id,
          type: 'session',
          amount: 0,
          description: 'Saturday Badminton Session - Member Rate (Membership Paid)',
          due_date: '2025-01-25',
          status: 'paid'
        });
      }

      const { data: insertedPayments, error: insertError } = await supabase
        .from('session_payments')
        .insert(samplePayments)
        .select();

      if (insertError) {
        console.error('❌ Error creating sample payments:', insertError);
      } else {
        console.log(`✅ Created ${insertedPayments.length} sample payment records`);
        insertedPayments.forEach(payment => {
          const member = members.find(m => m.id === payment.member_id);
          console.log(`   💳 ${member?.name}: ${payment.type} - Rp${payment.amount.toLocaleString()}`);
        });
      }
    }

    console.log('\n🎉 Session payments table setup complete!');
    console.log('📊 You can now view the payment management page with real data.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
createSessionPaymentsTable();