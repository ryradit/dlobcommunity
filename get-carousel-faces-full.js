const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: rows, error } = await supabase.from('latihan_faces').select('*').gt('face_count', 0);
  if (error) {
    console.error('Supabase error:', error);
    return;
  }
  
  try {
    const res = await fetch('http://localhost:3000/api/face/gallery');
    const data = await res.json();
    
    data.faces.slice(0, 15).forEach((face, idx) => {
      const match = rows ? rows.find(r => r.image_id === face.imageId) : null;
      console.log(`\n--- Face #${idx} ---`);
      console.log(`Face ID: ${face.id}`);
      console.log(`Image Title: ${match ? match.image_title : face.imageId}`);
      console.log(`Pan angle: ${face.panAngle}`);
      console.log(`Confidence: ${face.confidence}`);
      console.log(`Crop: ${JSON.stringify(face.crop)}`);
    });
  } catch (err) {
    console.error(err);
  }
}

run();
