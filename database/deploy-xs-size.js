const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../frontend/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env.local file.');
  console.error('Expected NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in frontend/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addXSSize() {
  try {
    console.log('🚀 Adding XS size support to pre_orders table...\n');

    // Try to insert a test record with XS - this will tell us if the constraint needs updating
    console.log('📋 Testing XS size insertion...');
    const testData = {
      nama: `XS Size Test ${Date.now()}`,
      ukuran: 'XS',
      warna: 'biru',
      nama_punggung: 'TEST',
      tanpa_nama_punggung: false,
      harga: 110000,
      status: 'pending'
    };

    const { data: testInsert, error: testError } = await supabase
      .from('pre_orders')
      .insert([testData])
      .select()
      .single();

    if (testError) {
      if (testError.message.includes('violates check constraint')) {
        console.log('❌ XS size is not supported in the database yet.');
        console.log('\n📋 The database constraint needs to be updated manually.');
        console.log('\n⚠️  NEXT STEPS:');
        console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
        console.log('2. Click on "SQL Editor"');
        console.log('3. Click "+ New Query"');
        console.log('4. Copy and paste this SQL:\n');
        console.log('---START SQL---');
        console.log('ALTER TABLE public.pre_orders DROP CONSTRAINT IF EXISTS pre_orders_ukuran_check;');
        console.log("ALTER TABLE public.pre_orders ADD CONSTRAINT pre_orders_ukuran_check CHECK (ukuran IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'));");
        console.log('---END SQL---\n');
        console.log('5. Click "Run" (or Ctrl+Enter)');
        console.log('6. Then run this command again to verify:\n');
        console.log('   node database/deploy-xs-size.js\n');
        process.exit(1);
      } else {
        console.error('❌ Unexpected error:', testError);
        process.exit(1);
      }
    } else {
      console.log('✅ XS size is already supported!');
      
      // Clean up test record
      const { error: deleteError } = await supabase
        .from('pre_orders')
        .delete()
        .eq('id', testInsert.id);

      if (deleteError) {
        console.warn('⚠️ Could not clean up test record:', deleteError.message);
      } else {
        console.log('✅ Test record cleaned up');
      }

      console.log('\n✅ XS size support is active! You can now use XS in the pre-order form.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addXSSize();
