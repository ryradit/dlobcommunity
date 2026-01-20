#!/usr/bin/env node

// Create admin auth user
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  console.log('🔧 Creating Admin User');
  console.log('=====================');

  const adminEmail = 'admin@dlob.com';
  const adminPassword = 'AdminDLOB2025!';

  try {
    // First, list existing auth users
    console.log('📋 Listing existing auth users...');
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return;
    }

    console.log(`Found ${usersData.users.length} auth users:`);
    usersData.users.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id}) - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    });

    // Check if admin user exists
    const existingAdmin = usersData.users.find(user => user.email === adminEmail);
    
    if (existingAdmin) {
      console.log('\n✅ Admin user already exists in auth!');
      console.log('🔧 Updating password and confirming email...');
      
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAdmin.id,
        {
          password: adminPassword,
          email_confirm: true
        }
      );
      
      if (updateError) {
        console.error('❌ Error updating user:', updateError);
      } else {
        console.log('✅ User updated successfully');
      }
    } else {
      console.log('\n🔧 Creating new admin auth user...');
      
      // Try different creation methods
      const createMethods = [
        {
          name: 'Method 1: Admin createUser',
          fn: () => supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: {
              name: 'DLOB Administrator'
            }
          })
        },
        {
          name: 'Method 2: Admin createUser with minimal data',
          fn: () => supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true
          })
        },
        {
          name: 'Method 3: Regular signUp',
          fn: () => supabaseAdmin.auth.signUp({
            email: adminEmail,
            password: adminPassword
          })
        }
      ];

      for (const method of createMethods) {
        try {
          console.log(`\n🔧 Trying ${method.name}...`);
          const { data, error } = await method.fn();
          
          if (error) {
            console.log(`❌ ${method.name} failed:`, error.message);
          } else {
            console.log(`✅ ${method.name} succeeded!`);
            console.log('User ID:', data.user?.id);
            console.log('Email:', data.user?.email);
            
            // If successful, break the loop
            break;
          }
        } catch (err) {
          console.log(`❌ ${method.name} exception:`, err.message);
        }
      }
    }

    // Test login after creation/update
    console.log('\n🧪 Testing login...');
    
    // Create regular client for login test
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (loginError) {
      console.log('❌ Login test failed:', loginError.message);
    } else {
      console.log('✅ Login test successful!');
      console.log('User ID:', loginData.user?.id);
      
      // Sign out after test
      await supabase.auth.signOut();
    }

  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

createAdminUser().catch(console.error);