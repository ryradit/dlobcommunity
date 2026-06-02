const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(3);

  console.log('Error:', error);
  console.log('Profiles Count:', profiles?.length);
  console.log('Profiles:', JSON.stringify(profiles, null, 2));
}

run();
