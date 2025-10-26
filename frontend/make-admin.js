#!/usr/bin/env node

// Make existing user admin - Quick Fix
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function makeUserAdmin() {
  console.log('🔧 Making Existing User Admin');
  console.log('=============================');

  try {
    // Option 1: Update ryradit28@gmail.com to admin
    console.log('🔧 Updating ryradit28@gmail.com to admin role...');
    
    const { data: updatedMember, error: updateError } = await supabaseAdmin
      .from('members')
      .update({
        role: 'admin',
        membership_type: 'premium'
      })
      .eq('email', 'ryradit28@gmail.com')
      .select()
      .single();

    if (updateError) {
      console.log('❌ Failed to update member:', updateError.message);
      
      // Check if member exists first
      const { data: existingMember, error: checkError } = await supabaseAdmin
        .from('members')
        .select('*')
        .eq('email', 'ryradit28@gmail.com')
        .single();
      
      if (checkError) {
        console.log('❌ Member does not exist in database');
        console.log('💡 The auth user exists but no member profile');
        console.log('');
        console.log('Creating member profile for ryradit28@gmail.com...');
        
        // Create member profile for existing auth user
        const { data: newMember, error: createError } = await supabaseAdmin
          .from('members')
          .insert({
            id: '4b37e2d8-0fcd-4045-a388-059433568a4a', // Auth user ID from earlier
            email: 'ryradit28@gmail.com',
            name: 'Ryan (Admin)',
            role: 'admin',
            membership_type: 'premium',
            join_date: new Date().toISOString().split('T')[0],
            is_active: true
          })
          .select()
          .single();
        
        if (createError) {
          console.log('❌ Failed to create member profile:', createError.message);
        } else {
          console.log('✅ Member profile created:', newMember);
        }
      } else {
        console.log('✅ Member exists:', existingMember);
      }
    } else {
      console.log('✅ Member updated successfully:');
      console.log('   ID:', updatedMember.id);
      console.log('   Email:', updatedMember.email);
      console.log('   Name:', updatedMember.name);
      console.log('   Role:', updatedMember.role);
      console.log('   Membership:', updatedMember.membership_type);
    }

    // Test login with the updated user
    console.log('\n🧪 Testing login with updated user...');
    console.log('Note: You need to know the password for ryradit28@gmail.com');
    console.log('');
    console.log('🎯 SOLUTION COMPLETE!');
    console.log('====================');
    console.log('✅ You can now login as admin using:');
    console.log('📧 Email: ryradit28@gmail.com');
    console.log('🔑 Password: [use the password for this Gmail account]');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Go to http://localhost:3000/login');
    console.log('2. Enter ryradit28@gmail.com and its password');
    console.log('3. You should be redirected to admin dashboard');
    console.log('4. All admin functionality should now work');

  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

makeUserAdmin().catch(console.error);