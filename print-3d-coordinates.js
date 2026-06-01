const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function rotateX(p, angleRad) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: p.x,
    y: p.y * cos - p.z * sin,
    z: p.y * sin + p.z * cos,
  };
}

function rotateY(p, angleRad) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: p.x * cos + p.z * sin,
    y: p.y,
    z: -p.x * sin + p.z * cos,
  };
}

function rotateZ(p, angleRad) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos,
    z: p.z,
  };
}

function alignAndNormalizeLandmarksTrueRoll(face) {
  if (!face || !Array.isArray(face.landmarks)) return null;

  const rawLm = {};
  for (const landmark of face.landmarks) {
    const type = landmark.type?.toUpperCase();
    if (type && landmark.position) {
      rawLm[type] = {
        x: landmark.position.x || 0,
        y: landmark.position.y || 0,
        z: landmark.position.z || 0,
      };
    }
  }

  const leftEye = rawLm['LEFT_EYE'];
  const rightEye = rawLm['RIGHT_EYE'];
  const nose = rawLm['NOSE_TIP'];
  if (!leftEye || !rightEye || !nose) return null;

  const midpoint = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
    z: (leftEye.z + rightEye.z) / 2,
  };

  const translated = {};
  for (const [type, pos] of Object.entries(rawLm)) {
    translated[type] = {
      x: pos.x - midpoint.x,
      y: pos.y - midpoint.y,
      z: pos.z - midpoint.z,
    };
  }

  const dy = translated['RIGHT_EYE'].y - translated['LEFT_EYE'].y;
  const dx = translated['RIGHT_EYE'].x - translated['LEFT_EYE'].x;
  const trueRollRad = -Math.atan2(dy, dx);

  const panRad = -((face.panAngle || 0) * Math.PI) / 180;
  const tiltRad = -((face.tiltAngle || 0) * Math.PI) / 180;

  const alignedLm = {};

  for (const [type, pos] of Object.entries(translated)) {
    let rotated = rotateZ(pos, trueRollRad);
    rotated = rotateY(rotated, panRad);
    rotated = rotateX(rotated, tiltRad);

    alignedLm[type] = rotated;
  }

  const pLeft = alignedLm['LEFT_EYE'];
  const pRight = alignedLm['RIGHT_EYE'];
  const eyeDist = Math.sqrt(
    Math.pow(pLeft.x - pRight.x, 2) +
    Math.pow(pLeft.y - pRight.y, 2) +
    Math.pow(pLeft.z - pRight.z, 2)
  );

  if (eyeDist < 0.0001) return null;

  const normalizedLm = {};
  for (const [type, pos] of Object.entries(alignedLm)) {
    normalizedLm[type] = {
      x: pos.x / eyeDist,
      y: pos.y / eyeDist,
      z: pos.z / eyeDist,
    };
  }

  return normalizedLm;
}

async function run() {
  const { data: rows } = await supabase.from('latihan_faces').select('*').gt('face_count', 0);
  
  const imgRed = rows.find(r => r.image_title === 'DSC00170.JPG');
  const imgBlack = rows.find(r => r.image_title === 'IMG_8871.JPG');
  const imgBlue = rows.find(r => r.image_title === 'IMG_8008.JPG');

  const redFace1 = imgRed.face_data[0];
  const redFace2 = imgBlack.face_data[1];
  const blueFace = imgBlue.face_data[0];

  const normRed1 = alignAndNormalizeLandmarksTrueRoll(redFace1);
  const normRed2 = alignAndNormalizeLandmarksTrueRoll(redFace2);
  const normBlue = alignAndNormalizeLandmarksTrueRoll(blueFace);

  console.log('\n--- RED1 (DSC00170) VS RED2 (IMG_8871 [1]) ---');
  compare(normRed1, normRed2);

  console.log('\n--- BLUE VS RED2 (IMG_8871 [1]) ---');
  compare(normBlue, normRed2);
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

  keys.forEach(k => {
    const p1 = n1[k];
    const p2 = n2[k];
    if (p1 && p2) {
      console.log(`${k}:`);
      console.log(`  Face 1: x=${p1.x.toFixed(4)}, y=${p1.y.toFixed(4)}, z=${p1.z.toFixed(4)}`);
      console.log(`  Face 2: x=${p2.x.toFixed(4)}, y=${p2.y.toFixed(4)}, z=${p2.z.toFixed(4)}`);
    }
  });
}

run();
