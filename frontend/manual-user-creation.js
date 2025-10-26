#!/usr/bin/env node

// Alternative approach: Create user via direct API call
require('dotenv').config({ path: '.env.local' });

const fetch = require('node-fetch');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createUserViaAPI() {
  console.log('🔧 Creating User via Direct API');
  console.log('===============================');

  const adminEmail = 'admin@dlob.com';
  const adminPassword = 'AdminDLOB2025!';

  try {
    // Method 1: Direct API call to create user
    console.log('🔧 Method 1: Direct Supabase Admin API call...');
    
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          name: 'DLOB Administrator'
        }
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.log('❌ Direct API call failed:', result);
    } else {
      console.log('✅ Direct API call succeeded!');
      console.log('User ID:', result.id);
      console.log('Email:', result.email);
    }

  } catch (error) {
    console.error('💥 API error:', error);
  }

  // Method 2: Try using curl equivalent
  console.log('\n🔧 Method 2: Alternative approach...');
  console.log('💡 You can manually create the user in Supabase Dashboard:');
  console.log('');
  console.log('1. Go to: https://supabase.com/dashboard/project/qtdayzlrwmzdezkavjpd/auth/users');
  console.log('2. Click "Add User"');
  console.log('3. Fill in:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log('   Auto Confirm User: ✓ (checked)');
  console.log('4. Click "Create User"');
  console.log('');
  console.log('5. After creating, the user should be able to log in');
  
  // Method 3: Check what's preventing user creation
  console.log('\n🔍 Method 3: Diagnostic information...');
  console.log('Possible issues preventing user creation:');
  console.log('');
  console.log('1. Database Triggers:');
  console.log('   - Check if there are triggers on auth.users table');
  console.log('   - Look for triggers that create member profiles automatically');
  console.log('');
  console.log('2. RLS Policies:');
  console.log('   - Check if RLS is enabled on auth.users');
  console.log('   - Service role should bypass RLS, but check anyway');
  console.log('');
  console.log('3. Constraints:');
  console.log('   - Check for unique constraints that might be violated');
  console.log('   - Check for foreign key constraints');
  console.log('');
  console.log('4. Email Configuration:');
  console.log('   - Check if email sending is properly configured');
  console.log('   - Though we\'re using email_confirm: true, it might still be an issue');
  
  console.log('\n🎯 Recommended Solution:');
  console.log('========================');
  console.log('1. Create the user manually in Supabase Dashboard (steps above)');
  console.log('2. Or temporarily enable signup and create via the app');
  console.log('3. Or check database logs for detailed error messages');
}

createUserViaAPI().catch(console.error);