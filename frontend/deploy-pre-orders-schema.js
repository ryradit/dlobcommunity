const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration
const supabaseUrl = 'https://qtdayzlrwmzdezkavjpd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGF5emxyd216ZGV6a2F2anBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE0MDI4OCwiZXhwIjoyMDc2NzE2Mjg4fQ.jMEuVvHyeNDqfcdqXDsqQFbFAvMWiSiaYRROwVPzxQU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployPreOrdersSchema() {
  try {
    console.log('🚀 Deploying pre-orders table schema...');
    
    // Check if table exists first
    console.log('🔍 Checking existing table...');
    const { data: existingTable, error: checkError } = await supabase
      .from('pre_orders')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST106') {
      console.log('📝 Table does not exist, need to create...');
    } else if (checkError && checkError.code === 'PGRST204') {
      console.log('🔄 Table exists but schema may be outdated...');
    } else if (!checkError) {
      console.log('✅ Table exists and is accessible');
      console.log('📊 Current records:', existingTable.length);
      return; // Exit early if table is working
    } else {
      console.log('🤔 Unknown table status:', checkError);
    }
    
    // Simple table creation via REST API
    console.log('📄 Creating table via direct SQL execution...');
    
    // Create table manually with a simpler approach
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.pre_orders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        nama TEXT NOT NULL,
        ukuran TEXT NOT NULL CHECK (ukuran IN ('S', 'M', 'L', 'XL', 'XXL', '3XL')),
        warna TEXT NOT NULL CHECK (warna IN ('biru', 'pink', 'kuning')),
        lengan TEXT DEFAULT 'short' CHECK (lengan IN ('short', 'long')),
        nama_punggung TEXT,
        tanpa_nama_punggung BOOLEAN DEFAULT false,
        harga INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
      
      ALTER TABLE public.pre_orders ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Allow public insert for pre_orders" ON public.pre_orders;
      CREATE POLICY "Allow public insert for pre_orders" ON public.pre_orders FOR INSERT WITH CHECK (true);
      
      DROP POLICY IF EXISTS "Allow authenticated users to view pre_orders" ON public.pre_orders;  
      CREATE POLICY "Allow authenticated users to view pre_orders" ON public.pre_orders FOR SELECT TO authenticated USING (true);
    `;
    
    console.log('⚡ Executing table creation...');
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: createTableSQL
      })
    });
    
    if (!response.ok) {
      console.log('❌ Direct SQL failed, trying individual operations...');
      
      // Try creating a test record to force table creation
      console.log('🧪 Attempting to insert test data...');
      const { data: insertData, error: insertError } = await supabase
        .from('pre_orders')
        .insert([{
          nama: 'Test User',
          ukuran: 'L',
          warna: 'biru',
          lengan: 'short',
          harga: 110000,
          status: 'pending'
        }]);
      
      if (insertError) {
        console.error('❌ Insert test failed:', insertError);
      } else {
        console.log('✅ Test insert successful!');
        
        // Clean up test data
        await supabase
          .from('pre_orders')
          .delete()
          .eq('nama', 'Test User');
        console.log('🧹 Test data cleaned up');
      }
    } else {
      console.log('✅ Direct SQL executed successfully');
    }
    
    // Final test
    console.log('🧪 Final table test...');
    const { data: testData, error: testError } = await supabase
      .from('pre_orders')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Final test failed:', testError);
    } else {
      console.log('✅ Table is working correctly!');
      console.log('📊 Records found:', testData.length);
    }
    
    console.log('🎉 Schema deployment completed!');
    
  } catch (error) {
    console.error('💥 Deployment failed:', error);
  }
}

deployPreOrdersSchema();