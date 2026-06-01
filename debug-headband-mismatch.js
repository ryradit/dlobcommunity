const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function get2DAlignedLandmarks(face) {
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

  const nose = rawLm['NOSE_TIP'];
  const leftEye = rawLm['LEFT_EYE'];
  const rightEye = rawLm['RIGHT_EYE'];

  if (!nose || !leftEye || !rightEye) return null;

  const translated = {};
  for (const [type, pos] of Object.entries(rawLm)) {
    translated[type] = {
      x: pos.x - nose.x,
      y: pos.y - nose.y,
    };
  }

  const rollRad = -((face.rollAngle || 0) * Math.PI) / 180;
  const cosRoll = Math.cos(rollRad);
  const sinRoll = Math.sin(rollRad);

  const rollAligned = {};
  for (const [type, pos] of Object.entries(translated)) {
    rollAligned[type] = {
      x: pos.x * cosRoll - pos.y * sinRoll,
      y: pos.x * sinRoll + pos.y * cosRoll,
    };
  }

  const eyeDist = Math.abs(rollAligned['RIGHT_EYE'].x - rollAligned['LEFT_EYE'].x);
  if (eyeDist < 0.0001) return null;

  const panRad = ((face.panAngle || 0) * Math.PI) / 180;
  const tiltRad = ((face.tiltAngle || 0) * Math.PI) / 180;
  
  const cosPan = Math.max(0.5, Math.cos(panRad));
  const cosTilt = Math.max(0.5, Math.cos(tiltRad));
  const verticalCorrection = cosPan / cosTilt;

  const normalized = {};
  for (const [type, pos] of Object.entries(rollAligned)) {
    normalized[type] = {
      x: pos.x / eyeDist,
      y: (pos.y / eyeDist) * verticalCorrection,
    };
  }

  return normalized;
}

async function run() {
  const { data: rows } = await supabase.from('latihan_faces').select('*').gt('face_count', 0);
  
  const img170 = rows.find(r => r.image_title === 'DSC00170.JPG');
  const img8871 = rows.find(r => r.image_title === 'IMG_8871.JPG');

  const face1 = img170.face_data[0];
  const face2 = img8871.face_data[1]; // Face 1 (red headband)

  const norm1 = get2DAlignedLandmarks(face1);
  const norm2 = get2DAlignedLandmarks(face2);

  console.log('--- COMPARE LANDMARKS DETAIL ---');
  const keys = ['NOSE_TIP', 'MOUTH_CENTER', 'CHIN_GNATHION', 'MIDPOINT_BETWEEN_EYES', 'NOSE_BOTTOM_NEUTRAL'];
  
  let totalDist = 0;
  keys.forEach(k => {
    const p1 = norm1[k];
    const p2 = norm2[k];
    if (p1 && p2) {
      const dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
      totalDist += dist;
      console.log(`${k}:`);
      console.log(`  Face 1: x=${p1.x.toFixed(4)}, y=${p1.y.toFixed(4)}`);
      console.log(`  Face 2: x=${p2.x.toFixed(4)}, y=${p2.y.toFixed(4)}`);
      console.log(`  Dist: ${dist.toFixed(4)}`);
    } else {
      console.log(`${k}: not found in one or both`);
    }
  });

  const avgDist = totalDist / keys.length;
  console.log(`Average distance: ${avgDist.toFixed(4)}`);
  const rawSimilarity = Math.exp(-avgDist * 6.5);
  console.log(`Raw similarity: ${rawSimilarity.toFixed(4)}`);
}

run();
