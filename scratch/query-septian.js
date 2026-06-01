const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: rows, error } = await supabase
    .from('profiles')
    .select('*')
    .or('email.eq.septianrifalda@gmail.com,full_name.ilike.%Septian%');

  if (error) {
    console.error('Error fetching profile:', error);
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }
}

run();
