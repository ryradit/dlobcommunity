#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qtdayzlrwmzdezkavjpd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGF5emxyd216ZGV6a2F2anBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDAyODgsImV4cCI6MjA3NjcxNjI4OH0.RhftETaaO_7Y6YoJdKG6nmr5WAM1BT5Ttpww3tzjLLg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createWorkingAdminUser() {
  console.log('🎯 DLOB Working Admin User Setup');
  console.log('================================');

  const adminEmail = 'admin@dlob.com';
  const adminPassword = 'AdminDLOB2025!';
  const adminName = 'DLOB Administrator';

  console.log('📧 Target Email:', adminEmail);
  console.log('🔑 Password:', adminPassword);

  // Step 1: Check if user already exists by trying to sign in
  console.log('\n🔍 Step 1: Checking if user already exists...');
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (!signInError && signInData.user) {
      console.log('✅ User already exists and password is correct!');
      console.log('👤 User ID:', signInData.user.id);
      
      // Check member profile
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      if (memberData) {
        console.log('✅ Member profile exists:', memberData.name);
        console.log('🎉 Setup already complete! You can login now.');
        return true;
      } else {
        console.log('⚠️  Member profile missing, creating...');
        return await createMemberProfile(signInData.user.id, adminEmail, adminName);
      }
    } else {
      console.log('📝 User does not exist or password incorrect, will create new user');
    }
  } catch (error) {
    console.log('📝 Proceeding to create new user');
  }

  // Step 2: Try different user creation approaches
  console.log('\n🔨 Step 2: Creating new user...');
  
  // Approach A: Minimal signup
  console.log('📝 Approach A: Minimal signup data');
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword
    });

    if (authError) {
      console.log('❌ Minimal signup failed:', authError.message);
      
      if (authError.message.includes('User already registered')) {
        console.log('👤 User exists, trying password reset approach...');
        return await handleExistingUserPasswordIssue(adminEmail, adminName);
      }
      
      // Try approach B
      console.log('📝 Approach B: Alternative email format');
      const altEmail = `admin.${Date.now()}@dlob.com`;
      const { data: altData, error: altError } = await supabase.auth.signUp({
        email: altEmail,
        password: adminPassword
      });

      if (altError) {
        console.error('❌ Alternative signup also failed:', altError.message);
        console.log('\n💡 Manual creation required. Please:');
        console.log('1. Go to Supabase Dashboard → Auth → Users');
        console.log('2. Click "Add User"');
        console.log('3. Email: admin@dlob.com');
        console.log('4. Password: AdminDLOB2025!');
        console.log('5. Check "Auto Confirm User"');
        console.log('6. Run this script again');
        return false;
      } else {
        console.log('✅ Alternative email worked:', altEmail);
        console.log('🔄 Please update your login to use:', altEmail);
        return await createMemberProfile(altData.user.id, altEmail, adminName);
      }
    } else {
      console.log('✅ User created successfully!');
      console.log('👤 User ID:', authData.user.id);
      
      if (authData.user) {
        return await createMemberProfile(authData.user.id, adminEmail, adminName);
      }
    }
  } catch (error) {
    console.error('💥 User creation failed:', error.message);
    return false;
  }
}

async function createMemberProfile(userId, email, name) {
  console.log('\n👤 Creating member profile...');
  
  try {
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .insert({
        id: userId,
        email: email,
        name: name,
        role: 'admin',
        membership_type: 'premium',
        join_date: new Date().toISOString().split('T')[0],
        is_active: true
      })
      .select()
      .single();

    if (memberError) {
      console.error('❌ Member profile creation failed:', memberError.message);
      
      if (memberError.code === '23505') { // Unique constraint violation
        console.log('✅ Member profile already exists');
        const { data: existing } = await supabase
          .from('members')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (existing) {
          console.log('👤 Existing profile:', existing.name);
          return true;
        }
      }
      
      console.log('💡 You can create the member profile manually:');
      console.log('1. Go to Supabase Dashboard → Table Editor → members');
      console.log('2. Click "Insert row"');
      console.log('3. Fill: id =', userId);
      console.log('   email =', email);
      console.log('   name = DLOB Administrator');
      console.log('   role = admin');
      console.log('   membership_type = premium');
      console.log('   is_active = true');
      return false;
    }

    console.log('✅ Member profile created:', memberData.name);
    return true;
  } catch (error) {
    console.error('💥 Member profile error:', error.message);
    return false;
  }
}

async function handleExistingUserPasswordIssue(email, name) {
  console.log('\n🔄 Handling existing user with password issue...');
  console.log('💡 The user exists but password might be different.');
  console.log('📧 Attempting password reset...');
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset-password'
    });

    if (error) {
      console.log('❌ Password reset failed:', error.message);
    } else {
      console.log('✅ Password reset email sent!');
      console.log('📧 Check your email for reset link');
    }
  } catch (error) {
    console.log('❌ Password reset error:', error.message);
  }

  console.log('\n💡 Alternative approaches:');
  console.log('1. Use a different email (admin2@dlob.com)');
  console.log('2. Reset password via Supabase Dashboard');
  console.log('3. Delete existing user in Dashboard and recreate');
  
  return false;
}

async function main() {
  const success = await createWorkingAdminUser();
  
  if (success) {
    console.log('\n🎉 SUCCESS! Admin user is ready');
    console.log('==============================');
    console.log('📧 Email: admin@dlob.com (or alternative if shown above)');
    console.log('🔑 Password: AdminDLOB2025!');
    console.log('👤 Role: Admin');
    console.log('\n🚀 Next steps:');
    console.log('1. Set NEXT_PUBLIC_FORCE_DEMO_MODE=false in .env.local');
    console.log('2. Restart your dev server');
    console.log('3. Login at http://localhost:3000/login');
  } else {
    console.log('\n❌ Setup incomplete');
    console.log('==================');
    console.log('💡 Please follow the manual instructions above');
    console.log('📞 Or contact Supabase support if issues persist');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createWorkingAdminUser };