const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: rows } = await supabase.from('latihan_faces').select('*').gt('face_count', 0);
  
  const imgRed = rows.find(r => r.image_title === 'DSC00170.JPG');
  const imgBlack = rows.find(r => r.image_title === 'IMG_8871.JPG');
  const imgBlue = rows.find(r => r.image_title === 'IMG_8008.JPG');

  const redFace = imgRed.face_data[0];
  const blackFace = imgBlack.face_data[1]; // face 1 in IMG_8871.JPG (red headband player)
  const blueFace = imgBlue.face_data[0];

  console.log('--- RED HEADBAND FACE (DSC00170.JPG [0]) ---');
  console.log(`Roll: ${redFace.rollAngle}, Pan: ${redFace.panAngle}, Tilt: ${redFace.tiltAngle}`);
  printKeyLandmarks(redFace);

  console.log('\n--- RED HEADBAND FACE (IMG_8871.JPG [1]) ---');
  console.log(`Roll: ${blackFace.rollAngle}, Pan: ${blackFace.panAngle}, Tilt: ${blackFace.tiltAngle}`);
  printKeyLandmarks(blackFace);

  console.log('\n--- BLUE SHIRT FACE (IMG_8008.JPG [0]) ---');
  console.log(`Roll: ${blueFace.rollAngle}, Pan: ${blueFace.panAngle}, Tilt: ${blueFace.tiltAngle}`);
  printKeyLandmarks(blueFace);
}

function printKeyLandmarks(face) {
  const keys = ['LEFT_EYE', 'RIGHT_EYE', 'NOSE_TIP', 'MOUTH_LEFT', 'MOUTH_RIGHT'];
  keys.forEach(k => {
    const lm = face.landmarks.find(l => l.type === k);
    if (lm) {
      console.log(`  ${k}: x=${lm.position.x.toFixed(4)}, y=${lm.position.y.toFixed(4)}, z=${lm.position.z.toFixed(4)}`);
    } else {
      console.log(`  ${k}: not found`);
    }
  });
}

run();
