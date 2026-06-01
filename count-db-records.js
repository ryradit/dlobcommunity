const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { count, error } = await supabase.from('latihan_faces').select('*', { count: 'exact', head: true });
  console.log(`Total records in latihan_faces: ${count}`);
}

run();
