#!/usr/bin/env node

// Enhanced troubleshooting for auth user creation issues
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function troubleshootAuth() {
  console.log('🔍 DLOB Auth User Creation Issue');
  console.log('================================\n');
  
  console.log('Environment Check:');
  console.log('- Supabase URL:', supabaseUrl);
  console.log('- Anon Key present:', !!supabaseAnonKey);
  console.log('- Service Key present:', !!supabaseServiceKey);
  console.log('- Admin client available:', !!supabaseAdmin);
  console.log('');

  // Test 1: Check current auth users
  console.log('📊 Test 1: Current auth users');
  if (supabaseAdmin) {
    try {
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) {
        console.log('❌ Cannot list users:', error.message);
      } else {
        console.log(`✅ Found ${users.users.length} auth users:`);
        users.users.forEach(user => {
          console.log(`   - ${user.email} (${user.id}) - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
        });
      }
    } catch (error) {
      console.log('❌ List users failed:', error.message);
    }
  }

  // Test 2: Try creating with different methods
  console.log('\n📊 Test 2: User creation attempts');
  const testEmail = `debug-${Date.now()}@dlob.com`;
  const testPassword = 'DebugPass123!';
  
  console.log(`Testing with: ${testEmail}`);

  if (supabaseAdmin) {
    // Method 1: Admin createUser
    try {
      console.log('🔧 Trying admin.createUser...');
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });
      
      if (error) {
        console.log('❌ Admin createUser failed:', error.message);
        console.log('   Status:', error.status);
        console.log('   Code:', error.code);
      } else {
        console.log('✅ Admin createUser succeeded:', data.user?.id);
        // Clean up
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      }
    } catch (err) {
      console.log('❌ Admin createUser exception:', err.message);
    }
  }

  // Method 2: Regular signUp
  try {
    console.log('🔧 Trying regular signUp...');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail + '.regular',
      password: testPassword
    });
    
    if (error) {
      console.log('❌ Regular signUp failed:', error.message);
      console.log('   Status:', error.status);
      console.log('   Code:', error.code);
    } else {
      console.log('✅ Regular signUp succeeded:', data.user?.id);
    }
  } catch (err) {
    console.log('❌ Regular signUp exception:', err.message);
  }

  // Test 2: Try with simpler user data
  console.log('\n📊 Test 2: Simplified user creation');
  try {
    const { data, error } = await supabase.auth.signUp({
      email: `test-${Date.now()}@dlob.com`, // Unique email
      password: '123456789' // Simple password
    });

    if (error) {
      console.log('❌ Simplified signup failed:', error.message);
      console.log('📋 Error details:', {
        status: error.status,
        code: error.code,
        name: error.name
      });
    } else {
      console.log('✅ Simplified signup worked!');
      console.log('👤 User:', data.user ? 'Created' : 'Not created');
    }
  } catch (error) {
    console.log('❌ Simplified signup exception:', error.message);
  }

  // Test 3: Check existing users
  console.log('\n📊 Test 3: Check existing users (this might fail with anon key)');
  try {
    // This usually requires service role, but let's try
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    if (response.ok) {
      const users = await response.json();
      console.log('✅ Users endpoint accessible');
      console.log('👥 User count:', users.users ? users.users.length : 'Unknown');
    } else {
      console.log('⚠️  Users endpoint not accessible with anon key (expected)');
    }
  } catch (error) {
    console.log('⚠️  Users check failed (expected with anon key)');
  }

  // Test 4: Database connectivity for auth schema
  console.log('\n📊 Test 4: Database auth schema check');
  try {
    // Try to query something from auth schema (this usually fails with RLS)
    const { data, error } = await supabase
      .rpc('get_claims', { uid: '00000000-0000-0000-0000-000000000000' });

    console.log('📊 Auth schema test result:', { data, error: error?.message });
  } catch (error) {
    console.log('⚠️  Auth schema check failed:', error.message);
  }

  // Test 3: Workaround solutions
  console.log('\n� Test 3: Workaround options');
  
  console.log('\n🔧 IMMEDIATE SOLUTIONS:');
  console.log('======================');
  
  console.log('Option A: Use Existing Auth User');
  console.log('1. You have these existing auth users:');
  console.log('   - ryradit28@gmail.com');
  console.log('   - ryradit@gmail.com');
  console.log('2. Update one of them to be admin:');
  console.log('   UPDATE members SET role = \'admin\' WHERE email = \'ryradit28@gmail.com\';');
  console.log('3. Login with that email and its password');
  
  console.log('\nOption B: Temporary Demo Mode');
  console.log('1. Edit .env.local: NEXT_PUBLIC_FORCE_DEMO_MODE=true');
  console.log('2. Restart dev server');
  console.log('3. Login: admin@dlob.com / password123');
  console.log('4. This bypasses Supabase Auth completely');
  
  console.log('\nOption C: Check Supabase Settings');
  console.log('1. Dashboard → Authentication → Settings');
  console.log('2. Ensure "Enable signup" is ON');
  console.log('3. Set "Enable email confirmations" to OFF');
  console.log('4. Check "Password requirements" (might be too strict)');
  
  console.log('\n💡 ROOT CAUSE ANALYSIS:');
  console.log('=======================');
  console.log('The "Database error creating new user" suggests:');
  console.log('1. Supabase Auth service may have constraints/triggers failing');
  console.log('2. Project may have custom database rules interfering');
  console.log('3. Email service configuration issues');
  console.log('4. Rate limiting or quota exceeded');
  console.log('5. Database schema conflicts (custom auth extensions)');
  
  console.log('\n🚀 QUICK FIX SCRIPT:');
  console.log('====================');
  console.log('Run this to make an existing user admin:');
  console.log('');
  console.log('UPDATE members SET role = \'admin\', membership_type = \'premium\'');
  console.log('WHERE email = \'ryradit28@gmail.com\';');
  console.log('');
  console.log('Then login with: ryradit28@gmail.com and its password');
}

if (require.main === module) {
  troubleshootAuth().catch(console.error);
}

module.exports = { troubleshootAuth };