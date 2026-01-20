const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://qtdayzlrwmzdezkavjpd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGF5emxyd216ZGV6a2F2anBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE0MDI4OCwiZXhwIjoyMDc2NzE2Mjg4fQ.jMEuVvHyeNDqfcdqXDsqQFbFAvMWiSiaYRROwVPzxQU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addLenganColumn() {
  try {
    console.log('🔧 Adding lengan column to pre_orders table...');
    
    // Since we can't use exec_sql RPC, we'll use a workaround
    // First, let's try to create a test record with lengan to see if we can add it via API
    console.log('🧪 Testing if we can add lengan column via direct API call...');
    
    // Try to use the SQL API directly via REST
    const addColumnSQL = 'ALTER TABLE public.pre_orders ADD COLUMN IF NOT EXISTS lengan TEXT DEFAULT \'short\' CHECK (lengan IN (\'short\', \'long\'));';
    
    console.log('⚡ Attempting to add column via direct REST API...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: addColumnSQL
      })
    });
    
    if (!response.ok) {
      console.log('❌ Direct API failed, trying alternative method...');
      console.log('Response status:', response.status);
      console.log('Response text:', await response.text());
      
      // Alternative: Try using the admin API
      console.log('🔄 Trying admin API method...');
      
      const adminResponse = await fetch(`${supabaseUrl}/database/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          query: addColumnSQL
        })
      });
      
      if (!adminResponse.ok) {
        console.log('❌ Admin API also failed');
        console.log('Admin response status:', adminResponse.status);
        console.log('Admin response text:', await adminResponse.text());
      } else {
        console.log('✅ Column added via admin API!');
      }
    } else {
      console.log('✅ Column added via direct REST API!');
    }
    
    // Test if the column now exists by trying to insert a record with lengan
    console.log('🧪 Testing lengan column by inserting test record...');
    
    const testData = {
      nama: 'Lengan Test',
      ukuran: 'L',
      warna: 'biru',
      lengan: 'long',
      harga: 120000,
      status: 'pending'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('pre_orders')
      .insert([testData])
      .select();
    
    if (insertError) {
      console.error('❌ Insert with lengan still failed:', insertError);
      
      // If it still fails, the column doesn't exist
      // Let's try a manual workaround by recreating the table
      console.log('🔄 Column still missing, may need manual database update');
      console.log('💡 Please add the lengan column manually in Supabase dashboard:');
      console.log('   ALTER TABLE public.pre_orders ADD COLUMN lengan TEXT DEFAULT \'short\' CHECK (lengan IN (\'short\', \'long\'));');
      
    } else {
      console.log('✅ Insert with lengan successful!');
      console.log('📄 Record with lengan:', insertData[0]);
      
      // Clean up test data
      await supabase
        .from('pre_orders')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🧹 Test data cleaned up');
    }
    
    console.log('🎉 Lengan column addition completed!');
    
  } catch (error) {
    console.error('💥 Failed to add lengan column:', error);
  }
}

addLenganColumn();