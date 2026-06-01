const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getAlignedAndCorrected2D(face) {
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

  const panRad = ((face.panAngle || 0) * Math.PI) / 180;
  const tiltRad = ((face.tiltAngle || 0) * Math.PI) / 180;

  const cosPan = Math.max(0.5, Math.cos(panRad));
  const cosTilt = Math.max(0.5, Math.cos(tiltRad));
  const sinPan = Math.sin(panRad);

  // Depth of each landmark relative to the eye midpoint plane (in units of eyeDist)
  const depths = {
    'NOSE_TIP': 0.55,
    'MOUTH_CENTER': 0.35,
    'MOUTH_LEFT': 0.28,
    'MOUTH_RIGHT': 0.28,
    'CHIN_GNATHION': 0.30,
    'LEFT_EYE': 0.0,
    'RIGHT_EYE': 0.0,
    'MIDPOINT_BETWEEN_EYES': 0.0
  };

  const corrected = {};
  for (const [type, pos] of Object.entries(rollAligned)) {
    let rawX = pos.x;
    let rawY = pos.y;

    const depthFactor = depths[type] || 0.0;
    if (depthFactor !== 0.0) {
      const estimatedDepth = depthFactor * eyeDist;
      rawX = pos.x - estimatedDepth * sinPan;
    }

    corrected[type] = {
      x: rawX / (eyeDist * cosPan),
      y: rawY / (eyeDist * cosTilt),
    };
  }

  return corrected;
}

async function run() {
  const { data: rows } = await supabase.from('latihan_faces').select('*').gt('face_count', 0);
  
  const imgRed = rows.find(r => r.image_title === 'DSC00170.JPG');
  const imgBlack = rows.find(r => r.image_title === 'IMG_8871.JPG');

  const redFace1 = imgRed.face_data[0];
  const redFace2 = imgBlack.face_data[1];

  const norm1 = getAlignedAndCorrected2D(redFace1);
  const norm2 = getAlignedAndCorrected2D(redFace2);

  const keys = [
    'LEFT_EYE',
    'RIGHT_EYE',
    'NOSE_TIP',
    'MOUTH_LEFT',
    'MOUTH_RIGHT',
    'MOUTH_CENTER',
    'CHIN_GNATHION',
  ];

  keys.forEach(k => {
    const p1 = norm1[k];
    const p2 = norm2[k];
    if (p1 && p2) {
      const dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
      console.log(`${k}:`);
      console.log(`  Red 1: x=${p1.x.toFixed(4)}, y=${p1.y.toFixed(4)}`);
      console.log(`  Red 2: x=${p2.x.toFixed(4)}, y=${p2.y.toFixed(4)}`);
      console.log(`  Dist: ${dist.toFixed(4)}`);
    }
  });
}

run();
