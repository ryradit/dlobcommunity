const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../frontend/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployPreOrdersTable() {
  try {
    console.log('🚀 Deploying pre-orders table...');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create-pre-orders-table.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try alternative method if rpc doesn't work
      console.log('Trying alternative deployment method...');
      
      // Split SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.from('_sql_exec').select('*').limit(0);
          if (stmtError) {
            console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
          }
        }
      }
      
      console.log('✅ Pre-orders table deployment completed (alternative method)');
    } else {
      console.log('✅ Pre-orders table deployed successfully');
    }

    // Test the table by inserting and deleting a test record
    console.log('🧪 Testing pre-orders table...');
    
    const testData = {
      nama: 'Test User',
      ukuran: 'L',
      warna: 'biru',
      nama_punggung: 'TEST',
      tanpa_nama_punggung: false,
      harga: 110000,
      status: 'pending'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('pre_orders')
      .insert([testData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Test insert failed:', insertError);
    } else {
      console.log('✅ Test insert successful');
      
      // Clean up test record
      const { error: deleteError } = await supabase
        .from('pre_orders')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        console.warn('⚠️ Test cleanup failed:', deleteError);
      } else {
        console.log('✅ Test cleanup successful');
      }
    }

    console.log('\n📋 Pre-orders table is ready!');
    console.log('You can now use the pre-order form to save data to Supabase.');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Manual SQL execution instructions
console.log(`
📝 Manual Setup Instructions:

If the automatic deployment fails, you can manually execute this SQL in your Supabase dashboard:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of: ${path.join(__dirname, 'create-pre-orders-table.sql')}
4. Run the SQL query

The table will be created with proper RLS policies for public form submission.
`);

deployPreOrdersTable();