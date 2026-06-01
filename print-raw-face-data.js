const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: rows } = await supabase.from('latihan_faces').select('*').eq('image_title', 'DSC00170.JPG').single();
  console.log(JSON.stringify(rows.face_data[0], null, 2));
}

run();
