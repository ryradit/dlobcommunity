const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qckubvnpfglseysboegd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFja3Vidm5wZmdsc2V5c2JvZWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTIxNjEwMCwiZXhwIjoyMDQ0NzkyMTAwfQ.mXKI1q0LnNmWm8DDKyWUFGaZvgJX4X4h0dOLNwEpXGo'
);

console.log('🔧 Adding match_id column to payments table...');

async function updatePaymentsTable() {
  try {
    // Add match_id column (this may fail if column already exists)
    console.log('➕ Adding match_id column to payments table...');
    const { error: columnError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE payments 
        ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES matches(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_payments_match_id ON payments(match_id);
      `
    });

    if (columnError) {
      console.log('⚠️ Column addition result:', columnError.message);
      
      // Try alternative method using direct SQL
      const { error: altError } = await supabase
        .from('payments')
        .select('match_id')
        .limit(1);
        
      if (altError && altError.message.includes('column "match_id" does not exist')) {
        console.log('❌ Need to add match_id column manually via Supabase dashboard');
        console.log('📋 Please run this SQL in Supabase dashboard:');
        console.log('   ALTER TABLE payments ADD COLUMN match_id UUID REFERENCES matches(id) ON DELETE SET NULL;');
        console.log('   CREATE INDEX idx_payments_match_id ON payments(match_id);');
      } else {
        console.log('✅ match_id column appears to exist already');
      }
    } else {
      console.log('✅ match_id column added successfully');
    }

    // Test if we can query the column
    const { data: testData, error: testError } = await supabase
      .from('payments')
      .select('id, match_id')
      .limit(1);
      
    if (testError) {
      console.log('❌ Cannot query match_id column:', testError.message);
      return false;
    }
    
    console.log('✅ match_id column is accessible');
    return true;

  } catch (error) {
    console.error('❌ Error updating payments table:', error.message);
    return false;
  }
}

updatePaymentsTable();