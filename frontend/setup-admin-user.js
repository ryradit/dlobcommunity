#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qtdayzlrwmzdezkavjpd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGF5emxyd216ZGV6a2F2anBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDAyODgsImV4cCI6MjA3NjcxNjI4OH0.RhftETaaO_7Y6YoJdKG6nmr5WAM1BT5Ttpww3tzjLLg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  console.log('🔧 DLOB Admin User Setup - Enhanced Diagnostics');
  console.log('===============================================');
  
  // Enhanced connection test
  console.log('🔌 Testing Supabase connection...');
  console.log('📍 URL:', supabaseUrl);
  console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
  
  try {
    // Test basic connection with auth endpoint
    console.log('🔌 Testing Supabase Auth connection...');
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    
    // This is expected to return "no session" but confirms connection works
    console.log('✅ Supabase connection successful!');
    console.log('📊 Auth status:', authUser.user ? 'User session exists' : 'No active session (normal)');
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    console.log('💡 Please check your Supabase URL and keys in .env.local');
    return;
  }

  // Check if members table exists (optional - will handle later)
  console.log('\n📋 Checking database schema...');
  let membersTableExists = false;
  try {
    const { data: tableCheck, error: tableError } = await supabase
      .from('members')
      .select('count')
      .limit(1);
    
    if (tableError) {
      if (tableError.code === '42P01' || tableError.message.includes('does not exist')) {
        console.log('⚠️  Members table does not exist yet');
        console.log('💡 Will create auth user first, then you can run schema');
        membersTableExists = false;
      } else {
        console.error('❌ Table check error:', tableError.message);
        membersTableExists = false;
      }
    } else {
      console.log('✅ Members table exists');
      membersTableExists = true;
    }
  } catch (err) {
    console.log('⚠️  Could not check members table:', err.message);
    console.log('💡 Will proceed with auth user creation');
    membersTableExists = false;
  }

  // Admin user details
  const adminEmail = 'admin@dlob.com';
  const adminPassword = 'AdminDLOB2025!';
  const adminName = 'DLOB Administrator';

  console.log('\n👤 Creating admin user...');
  console.log('📧 Email:', adminEmail);
  console.log('🔑 Password:', adminPassword);
  console.log('👤 Name:', adminName);

  try {
    // Step 1: Check Supabase Auth settings
    console.log('\n📝 Step 1: Checking authentication settings...');
    
    // Try to create the user
    console.log('📝 Step 2: Creating Supabase Auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          name: adminName,
          role: 'admin'
        }
      }
    });

    console.log('🔍 Auth Response:', {
      user: authData?.user ? 'Created' : 'Not created',
      session: authData?.session ? 'Active' : 'No session',
      error: authError?.message || 'None'
    });

    if (authError) {
      console.error('❌ Auth creation failed:', authError.message);
      
      // Handle specific error cases
      if (authError.message.includes('User already registered')) {
        console.log('⚠️  User already exists. Let me try to handle this...');
        return handleExistingUser(adminEmail, adminPassword, adminName);
      } else if (authError.message.includes('email address not confirmed')) {
        console.log('📧 Email confirmation required. Checking Supabase settings...');
        console.log('💡 To fix this:');
        console.log('   1. Go to Supabase Dashboard → Authentication → Settings');
        console.log('   2. Turn OFF "Enable email confirmations" for development');
        console.log('   3. Or check your email and click the confirmation link');
        return;
      } else if (authError.message.includes('signup is disabled')) {
        console.log('🚫 User signup is disabled in Supabase');
        console.log('💡 To fix this:');
        console.log('   1. Go to Supabase Dashboard → Authentication → Settings');
        console.log('   2. Turn ON "Enable user signups"');
        return;
      } else if (authError.message.includes('password')) {
        console.log('🔑 Password validation failed');
        console.log('💡 Check your password policy in Authentication → Settings');
        return;
      }
      
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation succeeded but no user object returned');
    }

    console.log('✅ Auth user created with ID:', authData.user.id);
    console.log('📧 Email confirmed:', authData.user.email_confirmed_at ? 'Yes' : 'No');

    // Step 3: Create member profile (if table exists)
    if (membersTableExists) {
      console.log('\n📝 Step 3: Creating member profile...');
      
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .insert({
          id: authData.user.id,
          email: adminEmail,
          name: adminName,
          role: 'admin',
          membership_type: 'premium',
          join_date: new Date().toISOString().split('T')[0],
          is_active: true
        })
        .select()
        .single();

      if (memberError) {
        console.error('❌ Member profile creation failed:', memberError);
        console.log('💡 The auth user was created but member profile failed');
        console.log('   Auth User ID:', authData.user.id);
        console.log('   You can create the profile manually in Supabase dashboard');
      } else {
        console.log('✅ Member profile created:', memberData.name);
      }
    } else {
      console.log('\n⏭️  Step 3: Skipping member profile (table not available)');
      console.log('💡 Auth user created with ID:', authData.user.id);
      console.log('📋 Next steps:');
      console.log('   1. Run database schema: database/schema.sql');
      console.log('   2. Add member profile manually or re-run this script');
    }

    // Step 4: Success
    console.log('\n🎉 Admin user setup completed successfully!');
    console.log('==========================================');
    console.log('Login credentials:');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Role: Admin');
    console.log('🏸 Membership: Premium');
    
    console.log('\n� Next Steps:');
    console.log('1. Set NEXT_PUBLIC_FORCE_DEMO_MODE=false in .env.local');
    console.log('2. Restart your development server');
    console.log('3. Login at http://localhost:3000/login');

  } catch (error) {
    console.error('💥 Setup failed with error:', error);
    console.log('\n🔍 Debugging Information:');
    console.log('Error type:', typeof error);
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
    if (error.stack) {
      console.log('Error stack:', error.stack);
    }
  }
}

async function handleExistingUser(email, password, name) {
  console.log('\n🔄 Handling existing user...');
  
  try {
    // Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (signInError) {
      console.error('❌ Could not sign in existing user:', signInError.message);
      console.log('💡 The user exists but password might be different');
      console.log('   You can reset the password in Supabase Dashboard → Auth → Users');
      return;
    }

    console.log('✅ Successfully signed in existing user');
    
    // Check if member profile exists
    const { data: existingMember, error: checkError } = await supabase
      .from('members')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (existingMember) {
      console.log('✅ Member profile already exists');
      console.log('🎉 User is ready to use!');
    } else {
      console.log('⚠️  Member profile missing, creating...');
      
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .insert({
          id: signInData.user.id,
          email: email,
          name: name,
          role: 'admin',
          membership_type: 'premium',
          is_active: true
        })
        .select()
        .single();

      if (memberError) {
        console.error('❌ Failed to create member profile:', memberError.message);
      } else {
        console.log('✅ Member profile created successfully');
      }
    }

    console.log('\n🎉 Setup completed! You can login with:');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);

  } catch (error) {
    console.error('❌ Error handling existing user:', error.message);
  }
}

// Run the setup
if (require.main === module) {
  createAdminUser().catch(console.error);
}

module.exports = { createAdminUser };