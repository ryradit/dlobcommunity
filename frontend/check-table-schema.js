const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://qtdayzlrwmzdezkavjpd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGF5emxyd216ZGV6a2F2anBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE0MDI4OCwiZXhwIjoyMDc2NzE2Mjg4fQ.jMEuVvHyeNDqfcdqXDsqQFbFAvMWiSiaYRROwVPzxQU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableSchema() {
  try {
    console.log('🔍 Checking table schema...');
    
    // Try to get table information
    const { data, error } = await supabase.rpc('get_table_columns', { 
      table_name: 'pre_orders' 
    });
    
    if (error) {
      console.log('❌ RPC failed, trying alternative method:', error);
      
      // Alternative: Try to insert with all expected fields
      console.log('🧪 Testing column existence by attempting insert...');
      
      const testData = {
        nama: 'Schema Test',
        ukuran: 'L',
        warna: 'biru',
        lengan: 'short',
        nama_punggung: 'TEST',
        tanpa_nama_punggung: false,
        harga: 110000,
        status: 'pending'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('pre_orders')
        .insert([testData])
        .select();
      
      if (insertError) {
        console.error('❌ Insert test failed:', insertError);
        console.log('📋 This error tells us about missing columns');
      } else {
        console.log('✅ Insert test successful!');
        console.log('📄 Inserted data:', insertData);
        
        // Clean up
        if (insertData && insertData.length > 0) {
          await supabase
            .from('pre_orders')
            .delete()
            .eq('id', insertData[0].id);
          console.log('🧹 Test data cleaned up');
        }
      }
    } else {
      console.log('✅ Table schema:', data);
    }
    
  } catch (error) {
    console.error('💥 Schema check failed:', error);
  }
}

checkTableSchema();