const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getTrueAlignedLandmarks(face) {
  if (!face || !Array.isArray(face.landmarks)) return null;

  const rawLm = {};
  for (const landmark of face.landmarks) {
    const type = landmark.type?.toUpperCase();
    if (type && landmark.position) {
      rawLm[type] = {
        x: landmark.position.x || 0,
        y: landmark.position.y || 0,
      };
    }
  }

  const leftEye = rawLm['LEFT_EYE'];
  const rightEye = rawLm['RIGHT_EYE'];
  
  if (!leftEye || !rightEye) return null;

  const midpoint = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2
  };

  const translated = {};
  for (const [type, pos] of Object.entries(rawLm)) {
    translated[type] = {
      x: pos.x - midpoint.x,
      y: pos.y - midpoint.y,
    };
  }

  const dy = translated['RIGHT_EYE'].y - translated['LEFT_EYE'].y;
  const dx = translated['RIGHT_EYE'].x - translated['LEFT_EYE'].x;
  const trueRollRad = -Math.atan2(dy, dx);

  const cosRoll = Math.cos(trueRollRad);
  const sinRoll = Math.sin(trueRollRad);

  const rollAligned = {};
  for (const [type, pos] of Object.entries(translated)) {
    rollAligned[type] = {
      x: pos.x * cosRoll - pos.y * sinRoll,
      y: pos.x * sinRoll + pos.y * cosRoll,
    };
  }

  const eyeDist = Math.abs(rollAligned['RIGHT_EYE'].x - rollAligned['LEFT_EYE'].x);
  if (eyeDist < 0.0001) return null;

  const normalized = {};
  for (const [type, pos] of Object.entries(rollAligned)) {
    normalized[type] = {
      x: pos.x / eyeDist,
      y: pos.y / eyeDist,
    };
  }

  return normalized;
}

async function run() {
  const { data: rows } = await supabase.from('latihan_faces').select('*').gt('face_count', 0);
  
  const imgRed = rows.find(r => r.image_title === 'DSC00170.JPG');
  const imgBlack = rows.find(r => r.image_title === 'IMG_8871.JPG');
  const imgBlue = rows.find(r => r.image_title === 'IMG_8008.JPG');

  const redFace1 = imgRed.face_data[0]; // Red headband in DSC00170 (pan: -41.3)
  const redFace2 = imgBlack.face_data[1]; // Red headband in IMG_8871 (pan: 44.5)
  const blueFace = imgBlue.face_data[0]; // Blue shirt in IMG_8008 (pan: 44.1)

  const normRed1 = getTrueAlignedLandmarks(redFace1);
  const normRed2 = getTrueAlignedLandmarks(redFace2);
  const normBlue = getTrueAlignedLandmarks(blueFace);

  console.log('--- COMPARE LANDMARKS FOR BLUE VS RED (IMG_8871 [1]) ---');
  compare(normBlue, normRed2);

  console.log('\n--- COMPARE LANDMARKS FOR RED1 (DSC00170) VS RED2 (IMG_8871 [1]) ---');
  compare(normRed1, normRed2);
}

function compare(n1, n2) {
  const keys = [
    'LEFT_EYE',
    'RIGHT_EYE',
    'NOSE_TIP',
    'MOUTH_LEFT',
    'MOUTH_RIGHT',
    'MOUTH_CENTER',
    'CHIN_GNATHION',
  ];

  let totalDist = 0;
  keys.forEach(k => {
    const p1 = n1[k];
    const p2 = n2[k];
    if (p1 && p2) {
      const dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
      totalDist += dist;
      console.log(`${k}:`);
      console.log(`  Face 1: x=${p1.x.toFixed(4)}, y=${p1.y.toFixed(4)}`);
      console.log(`  Face 2: x=${p2.x.toFixed(4)}, y=${p2.y.toFixed(4)}`);
      console.log(`  Dist: ${dist.toFixed(4)}`);
    } else {
      console.log(`${k}: not found`);
    }
  });

  const avgDist = totalDist / keys.length;
  console.log(`Average distance: ${avgDist.toFixed(4)}`);
}

run();
