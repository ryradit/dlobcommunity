const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('latihan_faces')
    .select('image_title, face_data')
    .eq('image_title', 'DSC00241.JPG')
    .single();

  if (error) {
    console.error(error);
    return;
  }

  const face = data.face_data[0];
  console.log('--- VERTICES ---');
  console.log(face.vertices);
  console.log('--- LANDMARKS SAMPLE (LEFT_EYE) ---');
  console.log(face.landmarks.find(lm => lm.type === 'LEFT_EYE'));
}

run();
