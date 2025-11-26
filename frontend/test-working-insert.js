const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://qtdayzlrwmzdezkavjpd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGF5emxyd216ZGV6a2F2anBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE0MDI4OCwiZXhwIjoyMDc2NzE2Mjg4fQ.jMEuVvHyeNDqfcdqXDsqQFbFAvMWiSiaYRROwVPzxQU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWorkingInsert() {
  try {
    console.log('🧪 Testing working insert with existing schema...');
    
    // Based on the error, the table expects: nama, ukuran, warna, and harga as required
    // Let me try with harga included
    const workingData = {
      nama: 'Test Working',
      ukuran: 'L',
      warna: 'biru',
      harga: 110000,
      nama_punggung: 'TEST',
      tanpa_nama_punggung: false,
      status: 'pending'
    };
    
    console.log('📝 Attempting insert with:', workingData);
    
    const { data: insertData, error: insertError } = await supabase
      .from('pre_orders')
      .insert([workingData])
      .select();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      
      // Try without optional fields
      console.log('🧪 Trying without optional fields...');
      const simpleData = {
        nama: 'Test Simple',
        ukuran: 'L', 
        warna: 'biru',
        harga: 110000
      };
      
      const { data: simpleInsert, error: simpleError } = await supabase
        .from('pre_orders')
        .insert([simpleData])
        .select();
        
      if (simpleError) {
        console.error('❌ Simple insert failed:', simpleError);
      } else {
        console.log('✅ Simple insert successful!');
        console.log('📄 Record structure:', Object.keys(simpleInsert[0]));
        console.log('📊 Record data:', simpleInsert[0]);
        
        // Clean up
        await supabase.from('pre_orders').delete().eq('id', simpleInsert[0].id);
        console.log('🧹 Cleaned up test data');
      }
      
    } else {
      console.log('✅ Full insert successful!');
      console.log('📄 Record structure:', Object.keys(insertData[0]));
      console.log('📊 Record data:', insertData[0]);
      
      // Clean up
      await supabase.from('pre_orders').delete().eq('id', insertData[0].id);
      console.log('🧹 Cleaned up test data');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testWorkingInsert();