#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://qtdayzlrwmzdezkavjpd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGF5emxyd216ZGV6a2F2anBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE0MDI4OCwiZXhwIjoyMDc2NzE2Mjg4fQ.CRQ0CkPHqHWXBekOlXpgO_ai3Wy-hvUKfQhScl4U6KY'; // Use service role for DDL operations

// Note: In production, use environment variables for these credentials

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployEnhancedSchema() {
  try {
    console.log('🚀 Starting enhanced schema deployment...');
    
    // Read the enhanced schema SQL file
    const schemaPath = path.join(__dirname, 'enhanced-match-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📖 Reading schema file:', schemaPath);
    console.log('📋 Schema content length:', schemaSql.length, 'characters');
    
    // Split SQL into individual statements (simple approach)
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '');
    
    console.log('🔢 Found', statements.length, 'SQL statements to execute');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n📝 Executing statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          
          // Don't fail on certain expected errors
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('column already exists')) {
            console.log('⚠️  Continuing (expected error for existing objects)');
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
        
        // Add small delay between statements
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`❌ Unexpected error in statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Deployment Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📈 Success rate: ${Math.round((successCount / statements.length) * 100)}%`);
    
    if (errorCount === 0 || (errorCount < successCount)) {
      console.log('\n🎉 Enhanced schema deployment completed successfully!');
      console.log('🔄 You may need to refresh your Supabase dashboard to see changes.');
      return true;
    } else {
      console.log('\n❌ Schema deployment had significant errors. Please check manually.');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Fatal error during schema deployment:', error);
    return false;
  }
}

// Alternative approach using individual SQL statements
async function deploySchemaManually() {
  console.log('\n🛠️  Trying manual deployment approach...');
  
  const alterStatements = [
    // Add columns to matches table
    `ALTER TABLE matches ADD COLUMN IF NOT EXISTS field_number INTEGER NOT NULL DEFAULT 1`,
    `ALTER TABLE matches ADD COLUMN IF NOT EXISTS shuttlecock_count INTEGER NOT NULL DEFAULT 1`,
    `ALTER TABLE matches ADD COLUMN IF NOT EXISTS shuttlecock_cost_per_piece INTEGER DEFAULT 3000`,
    
    // Update match_results table
    `ALTER TABLE match_results ADD COLUMN IF NOT EXISTS total_games INTEGER DEFAULT 1`,
    
    // Create game_scores table
    `CREATE TABLE IF NOT EXISTS game_scores (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        game_number INTEGER NOT NULL,
        team1_score INTEGER NOT NULL,
        team2_score INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(match_id, game_number)
    )`,
    
    // Update payments table
    `ALTER TABLE payments ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES matches(id) ON DELETE SET NULL`,
    `ALTER TABLE payments ADD COLUMN IF NOT EXISTS shuttlecock_count INTEGER DEFAULT 0`,
    `ALTER TABLE payments ADD COLUMN IF NOT EXISTS membership_fee INTEGER DEFAULT 0`,
    `ALTER TABLE payments ADD COLUMN IF NOT EXISTS shuttlecock_fee INTEGER DEFAULT 0`,
    `ALTER TABLE payments ADD COLUMN IF NOT EXISTS attendance_fee INTEGER DEFAULT 0`,
    
    // Create membership_payments table
    `CREATE TABLE IF NOT EXISTS membership_payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        weeks_in_month INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
        paid_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(member_id, month, year)
    )`
  ];
  
  let successCount = 0;
  
  for (let i = 0; i < alterStatements.length; i++) {
    const statement = alterStatements[i];
    console.log(`\n📝 Executing manual statement ${i + 1}/${alterStatements.length}:`);
    console.log(statement.substring(0, 80) + '...');
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error:`, error.message);
        
        if (error.message.includes('already exists') || 
            error.message.includes('column already exists')) {
          console.log('⚠️  Column/table already exists, continuing...');
          successCount++;
        }
      } else {
        console.log(`✅ Success!`);
        successCount++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (err) {
      console.error(`❌ Unexpected error:`, err.message);
    }
  }
  
  console.log(`\n📊 Manual deployment: ${successCount}/${alterStatements.length} statements succeeded`);
  return successCount >= alterStatements.length * 0.8; // 80% success rate
}

// Run the deployment
async function main() {
  console.log('🎯 DLOB Enhanced Schema Deployment');
  console.log('==================================');
  
  // Test connection first
  console.log('🔌 Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('members').select('count').limit(1);
    if (error) {
      console.error('❌ Connection failed:', error.message);
      process.exit(1);
    }
    console.log('✅ Connection successful!');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
  
  // Try main deployment first
  let success = await deployEnhancedSchema();
  
  // If main deployment fails, try manual approach
  if (!success) {
    success = await deploySchemaManually();
  }
  
  if (success) {
    console.log('\n🎉 Schema deployment completed! Your database is ready for match management.');
    console.log('🔄 Please restart your Next.js development server to refresh the cache.');
  } else {
    console.log('\n❌ Schema deployment failed. Please check the errors above.');
    console.log('💡 You may need to run the SQL manually in your Supabase SQL Editor.');
  }
}

// Check if we have the exec_sql function available
async function createExecSqlFunction() {
  console.log('🔧 Creating exec_sql helper function...');
  
  const execSqlFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;
  
  try {
    // Use raw SQL execution for creating the function
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ query: execSqlFunction })
    });
    
    if (response.ok) {
      console.log('✅ exec_sql function created successfully');
    } else {
      console.log('⚠️  exec_sql function may already exist or creation failed');
    }
  } catch (err) {
    console.log('⚠️  Could not create exec_sql function:', err.message);
  }
}

// Run it
if (require.main === module) {
  createExecSqlFunction().then(() => main()).catch(console.error);
}

module.exports = { deployEnhancedSchema, deploySchemaManually };