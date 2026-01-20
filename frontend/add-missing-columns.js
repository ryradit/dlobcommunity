const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://qtdayzlrwmzdezkavjpd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGF5emxyd216ZGV6a2F2anBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE0MDI4OCwiZXhwIjoyMDc2NzE2Mjg4fQ.jMEuVvHyeNDqfcdqXDsqQFbFAvMWiSiaYRROwVPzxQU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing columns to pre_orders table...');
    
    // Try to add the lengan column
    console.log('➕ Adding lengan column...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        DO $$
        BEGIN
          -- Add lengan column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'pre_orders' AND column_name = 'lengan'
          ) THEN
            ALTER TABLE public.pre_orders 
            ADD COLUMN lengan TEXT DEFAULT 'short' CHECK (lengan IN ('short', 'long'));
            RAISE NOTICE 'Added lengan column';
          ELSE
            RAISE NOTICE 'lengan column already exists';
          END IF;
        END
        $$;
      `
    });
    
    if (error) {
      console.error('❌ Failed to add lengan column:', error);
    } else {
      console.log('✅ Column addition completed');
    }
    
    // Test insertion again
    console.log('🧪 Testing insertion with lengan column...');
    
    const testData = {
      nama: 'Column Test',
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
      console.error('❌ Insert still failed:', insertError);
    } else {
      console.log('✅ Insert successful with lengan column!');
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
    
    console.log('🎉 Column addition completed!');
    
  } catch (error) {
    console.error('💥 Column addition failed:', error);
  }
}

addMissingColumns();