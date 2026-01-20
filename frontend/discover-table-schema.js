const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://qtdayzlrwmzdezkavjpd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGF5emxyd216ZGV6a2F2anBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE0MDI4OCwiZXhwIjoyMDc2NzE2Mjg4fQ.jMEuVvHyeNDqfcdqXDsqQFbFAvMWiSiaYRROwVPzxQU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function discoverTableSchema() {
  try {
    console.log('🔍 Discovering actual table structure...');
    
    // Try insertion with minimal fields first
    console.log('🧪 Testing minimal insert...');
    
    const minimalData = {
      nama: 'Schema Discovery',
      ukuran: 'L',
      warna: 'biru'
    };
    
    const { data: minData, error: minError } = await supabase
      .from('pre_orders')
      .insert([minimalData])
      .select();
    
    if (minError) {
      console.error('❌ Minimal insert failed:', minError);
      
      // Try even more basic
      console.log('🧪 Testing basic fields...');
      const basicData = { nama: 'Test' };
      
      const { data: basicRes, error: basicError } = await supabase
        .from('pre_orders')
        .insert([basicData])
        .select();
        
      if (basicError) {
        console.error('❌ Basic insert failed:', basicError);
      } else {
        console.log('✅ Basic insert worked:', basicRes);
        // Clean up
        if (basicRes && basicRes.length > 0) {
          await supabase.from('pre_orders').delete().eq('id', basicRes[0].id);
        }
      }
      
    } else {
      console.log('✅ Minimal insert successful!');
      console.log('📄 Available fields in response:', Object.keys(minData[0]));
      
      // Clean up
      if (minData && minData.length > 0) {
        await supabase
          .from('pre_orders')
          .delete()
          .eq('id', minData[0].id);
        console.log('🧹 Test data cleaned up');
      }
    }
    
    // Let's see what we get when we try to select everything
    console.log('📋 Checking existing records structure...');
    const { data: allData, error: allError } = await supabase
      .from('pre_orders')
      .select('*')
      .limit(1);
    
    if (allError) {
      console.error('❌ Select failed:', allError);
    } else {
      console.log('✅ Select successful');
      if (allData && allData.length > 0) {
        console.log('📄 Record structure:', Object.keys(allData[0]));
        console.log('📊 Sample record:', allData[0]);
      } else {
        console.log('📊 No existing records found');
      }
    }
    
  } catch (error) {
    console.error('💥 Discovery failed:', error);
  }
}

discoverTableSchema();