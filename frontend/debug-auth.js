#!/usr/bin/env node

// Debug authentication issue
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Authentication Debug');
console.log('=====================');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key present:', !!supabaseAnonKey);
console.log('Service Key present:', !!supabaseServiceKey);
console.log('');

// Create clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function debugAuth() {
  try {
    // 1. Check if members table exists and what's in it
    console.log('🔍 Step 1: Checking members table...');
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, email, name, role, is_active')
      .order('created_at', { ascending: true });

    if (membersError) {
      console.log('❌ Error fetching members:', membersError.message);
      if (membersError.message.includes('relation "members" does not exist')) {
        console.log('💡 The members table does not exist in the database.');
        console.log('   Please run the schema.sql file in Supabase SQL editor first.');
        return;
      }
    } else {
      console.log('✅ Members table found with', members?.length || 0, 'records:');
      if (members && members.length > 0) {
        members.forEach(member => {
          console.log(`   - ${member.email} (${member.name}) - Role: ${member.role}, Active: ${member.is_active}`);
        });
      } else {
        console.log('   - No members found in database');
      }
    }

    console.log('');

    // 2. Test login with current credentials
    console.log('🔍 Step 2: Testing admin login...');
    const testEmail = 'admin@dlob.com';
    const testPassword = 'AdminDLOB2025!';
    
    console.log(`Attempting login with: ${testEmail} / ${testPassword}`);
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      
      if (loginError.message.includes('Invalid login credentials')) {
        console.log('💡 This means either:');
        console.log('   1. The user does not exist in Supabase Auth');
        console.log('   2. The password is incorrect');
        console.log('   3. The email is incorrect');
      }
    } else {
      console.log('✅ Login successful!');
      console.log('   User ID:', loginData.user?.id);
      console.log('   Email:', loginData.user?.email);
      
      // Check if this user has a member profile
      if (loginData.user) {
        const { data: memberProfile, error: profileError } = await supabase
          .from('members')
          .select('*')
          .eq('id', loginData.user.id)
          .single();

        if (profileError) {
          console.log('⚠️  Auth user exists but no member profile found:', profileError.message);
        } else {
          console.log('✅ Member profile exists:', memberProfile);
        }
      }
      
      // Sign out after test
      await supabase.auth.signOut();
    }

    console.log('');

    // 3. If we have admin client, try to create the user
    if (supabaseAdmin && loginError) {
      console.log('🔍 Step 3: Attempting to create admin user...');
      
      try {
        // First check if user exists in auth
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.log('❌ Cannot list users:', listError.message);
        } else {
          console.log(`Found ${users.users?.length || 0} auth users:`);
          const adminUser = users.users?.find(user => user.email === testEmail);
          
          if (adminUser) {
            console.log('✅ Admin user exists in auth:', adminUser.id);
            console.log('   Created:', adminUser.created_at);
            console.log('   Email confirmed:', adminUser.email_confirmed_at ? 'Yes' : 'No');
            console.log('');
            console.log('💡 User exists but login failed. This might be:');
            console.log('   1. Incorrect password');
            console.log('   2. Email not confirmed');
            console.log('   3. Account disabled');
            
            // Try to update password
            console.log('');
            console.log('🔧 Attempting to reset password...');
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              adminUser.id,
              {
                password: testPassword,
                email_confirm: true
              }
            );
            
            if (updateError) {
              console.log('❌ Failed to update password:', updateError.message);
            } else {
              console.log('✅ Password updated and email confirmed');
            }
          } else {
            console.log('❌ Admin user does not exist in auth');
            console.log('');
            console.log('🔧 Creating admin user...');
            
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
              email: testEmail,
              password: testPassword,
              email_confirm: true,
              user_metadata: {
                name: 'DLOB Administrator'
              }
            });
            
            if (createError) {
              console.log('❌ Failed to create user:', createError.message);
            } else {
              console.log('✅ Admin user created:', newUser.user?.id);
              
              // Create member profile
              console.log('🔧 Creating member profile...');
              const { error: memberError } = await supabaseAdmin
                .from('members')
                .insert({
                  id: newUser.user.id,
                  email: testEmail,
                  name: 'DLOB Administrator',
                  role: 'admin',
                  membership_type: 'premium',
                  join_date: new Date().toISOString().split('T')[0],
                  is_active: true
                });
              
              if (memberError) {
                console.log('❌ Failed to create member profile:', memberError.message);
              } else {
                console.log('✅ Member profile created');
              }
            }
          }
        }
      } catch (error) {
        console.log('❌ Error in admin operations:', error.message);
      }
    }

    console.log('');
    console.log('🎯 Summary:');
    console.log('===========');
    
    if (loginError) {
      console.log('❌ Current admin login is not working');
      console.log(`📧 Try logging in with: ${testEmail}`);
      console.log(`🔑 Password: ${testPassword}`);
      console.log('');
      console.log('💡 If this script created the user, try logging in again');
      console.log('💡 If login still fails, the issue might be:');
      console.log('   - Member profile not linked correctly');
      console.log('   - RLS policies blocking access');
      console.log('   - Database connection issues');
    } else {
      console.log('✅ Admin login is working correctly');
    }

  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

debugAuth().catch(console.error);