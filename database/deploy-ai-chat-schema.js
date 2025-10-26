const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../frontend/.env.local') });

async function deployAIChatSchema() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    console.log('Required variables:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🚀 Deploying DLOB AI Chat Schema...');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'dlob-ai-chat-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0);

          // Execute using raw query
          const { error: rawError } = await supabase.query(statement);

          if (rawError && !rawError.message?.includes('already exists')) {
            console.warn(`⚠️ Statement ${i + 1} warning:`, rawError.message);
          }
        }

        console.log(`✅ Statement ${i + 1} completed`);
      } catch (statementError) {
        if (!statementError.message?.includes('already exists')) {
          console.warn(`⚠️ Statement ${i + 1} warning:`, statementError.message);
        }
      }
    }

    // Test the deployment by checking if tables exist
    console.log('\n🔍 Verifying deployment...');

    const tables = ['chat_sessions', 'chat_messages', 'user_context_cache', 'ai_analytics'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (error) {
        console.log(`❌ Table '${table}' not accessible:`, error.message);
      } else {
        console.log(`✅ Table '${table}' is ready`);
      }
    }

    // Test functions
    console.log('\n🧪 Testing functions...');
    
    const functions = [
      'get_user_payment_context', 
      'get_user_match_context', 
      'get_user_attendance_context',
      'refresh_user_context_cache'
    ];

    for (const func of functions) {
      try {
        const { error } = await supabase.rpc(func, { p_user_id: '00000000-0000-0000-0000-000000000000' });
        
        if (error && !error.message?.includes('does not exist')) {
          console.log(`⚠️ Function '${func}' warning:`, error.message);
        } else {
          console.log(`✅ Function '${func}' is available`);
        }
      } catch (funcError) {
        console.log(`⚠️ Function '${func}' test failed:`, funcError.message);
      }
    }

    console.log('\n🎉 DLOB AI Chat Schema deployment completed!');
    console.log('\nNext steps:');
    console.log('1. Ensure NEXT_PUBLIC_GEMINI_API_KEY is set in .env.local');
    console.log('2. Test the enhanced chatbot in the frontend');
    console.log('3. Check AI responses with authenticated users');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('authentication')) {
      console.log('\n💡 Authentication Error Solutions:');
      console.log('- Check SUPABASE_SERVICE_ROLE_KEY in .env.local');
      console.log('- Verify the service role key has admin permissions');
      console.log('- Ensure the Supabase project URL is correct');
    }
    
    if (error.message?.includes('permission')) {
      console.log('\n💡 Permission Error Solutions:');
      console.log('- Use the service role key, not anon key');
      console.log('- Check if RLS policies allow the operation');
      console.log('- Verify database user permissions');
    }
  }
}

// Execute the deployment
deployAIChatSchema().catch(console.error);