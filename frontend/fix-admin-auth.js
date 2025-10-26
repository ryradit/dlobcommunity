#!/usr/bin/env node

// Fix admin user creation issue
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixAdminUser() {
  console.log('🔧 Fixing Admin User Issue');
  console.log('==========================');

  const adminEmail = 'admin@dlob.com';
  const adminPassword = 'AdminDLOB2025!';

  try {
    // Step 1: Check the member record in detail
    console.log('📋 Checking existing member record...');
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (memberError) {
      console.log('❌ Error fetching member:', memberError.message);
      return;
    }

    console.log('✅ Found member record:');
    console.log('   ID:', memberData.id);
    console.log('   Email:', memberData.email);
    console.log('   Name:', memberData.name);
    console.log('   Role:', memberData.role);
    console.log('   Active:', memberData.is_active);

    // Step 2: Try to create auth user with the same ID as member
    console.log('\n🔧 Attempting to create auth user with matching ID...');
    
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      id: memberData.id,  // Use the same ID as the member record
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        name: memberData.name,
        role: memberData.role
      }
    });

    if (createError) {
      console.log('❌ Creation with matching ID failed:', createError.message);
      
      // If that fails, try without specifying ID
      console.log('\n🔧 Trying without specifying ID...');
      const { data: createData2, error: createError2 } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          name: memberData.name,
          role: memberData.role
        }
      });

      if (createError2) {
        console.log('❌ Creation without ID also failed:', createError2.message);
        
        // Last resort: check if there's already an auth user with that ID
        console.log('\n🔍 Checking if auth user with member ID already exists...');
        try {
          const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(memberData.id);
          
          if (!getUserError && existingUser) {
            console.log('✅ Auth user with member ID already exists!');
            console.log('   Auth User ID:', existingUser.user.id);
            console.log('   Email:', existingUser.user.email);
            
            // Update the existing auth user
            console.log('\n🔧 Updating existing auth user...');
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              memberData.id,
              {
                email: adminEmail,
                password: adminPassword,
                email_confirm: true,
                user_metadata: {
                  name: memberData.name,
                  role: memberData.role
                }
              }
            );
            
            if (updateError) {
              console.log('❌ Update failed:', updateError.message);
            } else {
              console.log('✅ Auth user updated successfully!');
            }
          } else {
            console.log('❌ No auth user found with member ID');
            
            // Try creating with a new ID and then updating the member record
            console.log('\n🔧 Creating with new ID and updating member record...');
            const { data: newAuthUser, error: newAuthError } = await supabaseAdmin.auth.admin.createUser({
              email: adminEmail,
              password: adminPassword,
              email_confirm: true,
              user_metadata: {
                name: memberData.name,
                role: memberData.role
              }
            });
            
            if (newAuthError) {
              console.log('❌ New auth user creation failed:', newAuthError.message);
            } else {
              console.log('✅ New auth user created:', newAuthUser.user.id);
              
              // Update member record to use new auth user ID
              console.log('🔧 Updating member record with new auth ID...');
              const { error: memberUpdateError } = await supabaseAdmin
                .from('members')
                .update({ id: newAuthUser.user.id })
                .eq('email', adminEmail);
              
              if (memberUpdateError) {
                console.log('❌ Member update failed:', memberUpdateError.message);
                console.log('💡 You may need to manually update the member ID in the database');
              } else {
                console.log('✅ Member record updated with new auth ID');
              }
            }
          }
        } catch (getUserError) {
          console.log('❌ Error checking for existing user:', getUserError.message);
        }
      } else {
        console.log('✅ Auth user created without specifying ID:', createData2.user.id);
      }
    } else {
      console.log('✅ Auth user created with matching ID:', createData.user.id);
    }

    // Step 3: Test login
    console.log('\n🧪 Testing admin login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
    } else {
      console.log('✅ Login successful!');
      console.log('   User ID:', loginData.user?.id);
      console.log('   Email:', loginData.user?.email);
      
      // Check member profile connection
      const { data: profileData, error: profileError } = await supabase
        .from('members')
        .select('*')
        .eq('id', loginData.user.id)
        .single();
      
      if (profileError) {
        console.log('⚠️  Login works but no member profile linked:', profileError.message);
      } else {
        console.log('✅ Member profile correctly linked:', profileData.name);
      }
      
      // Sign out
      await supabase.auth.signOut();
    }

    console.log('\n🎯 Next Steps:');
    console.log('==============');
    console.log(`Try logging in with: ${adminEmail} / ${adminPassword}`);

  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

fixAdminUser().catch(console.error);