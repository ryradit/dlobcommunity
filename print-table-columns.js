const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('latihan_faces')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching from latihan_faces:', error);
    return;
  }

  console.log('Columns in latihan_faces:');
  if (data && data[0]) {
    console.log(Object.keys(data[0]));
    console.log('Sample row:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('Table is empty.');
  }
}

run();
