const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://qtdayzlrwmzdezkavjpd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGF5emxyd216ZGV6a2F2anBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE0MDI4OCwiZXhwIjoyMDc2NzE2Mjg4fQ.jMEuVvHyeNDqfcdqXDsqQFbFAvMWiSiaYRROwVPzxQU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLenganColumn() {
  try {
    console.log('🧪 Testing lengan column after database update...');
    
    // Test direct insertion with lengan
    const testData = {
      nama: 'Lengan Column Test',
      ukuran: 'L',
      warna: 'biru',
      lengan: 'long',
      harga: 120000,
      status: 'pending',
      nama_punggung: 'TEST',
      tanpa_nama_punggung: false
    };
    
    console.log('📝 Testing direct Supabase insert...');
    const { data: insertData, error: insertError } = await supabase
      .from('pre_orders')
      .insert([testData])
      .select();
    
    if (insertError) {
      console.error('❌ Direct insert failed:', insertError);
    } else {
      console.log('✅ Direct insert successful!');
      console.log('📄 Record with lengan:', insertData[0]);
      
      // Clean up
      await supabase.from('pre_orders').delete().eq('id', insertData[0].id);
      console.log('🧹 Test data cleaned up');
    }
    
    // Test via API
    console.log('🌐 Testing via API endpoint...');
    const apiResponse = await fetch('http://localhost:3000/api/pre-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nama: 'API Test User',
        ukuran: 'M',
        warna: 'pink',
        lengan: 'short',
        namaPunggung: 'API',
        tanpaNamaPunggung: false
      })
    });
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('❌ API test failed:', apiResponse.status, errorText);
    } else {
      const apiResult = await apiResponse.json();
      console.log('✅ API test successful!');
      console.log('📄 API response:', apiResult);
      
      // Clean up API test data if it was created
      if (apiResult.data && apiResult.data.id) {
        await supabase.from('pre_orders').delete().eq('id', apiResult.data.id);
        console.log('🧹 API test data cleaned up');
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testLenganColumn();