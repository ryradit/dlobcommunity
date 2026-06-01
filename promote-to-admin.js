const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide the email address to promote to admin: node promote-to-admin.js <email>');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log(`🔄 Attempting to promote ${email} to admin...`);
  
  // 1. Update profiles table
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin', is_active: true })
    .eq('email', email)
    .select();

  if (error) {
    console.error('❌ Error updating profile:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log(`⚠️ No profile found for email: ${email}. Please check if the user is registered.`);
    return;
  }

  console.log('✅ Success! Profile updated to admin:', data[0]);
}

run();
