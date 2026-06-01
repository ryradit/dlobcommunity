const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Copy similarity function
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

function alignAndNormalizeLandmarks(face) {
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

  const nose = rawLm['NOSE_TIP'];
  if (!nose) return null;

  const rollRad = -((face.rollAngle || 0) * Math.PI) / 180;
  const panRad = -((face.panAngle || 0) * Math.PI) / 180;
  const tiltRad = -((face.tiltAngle || 0) * Math.PI) / 180;

  const alignedLm = {};

  for (const [type, pos] of Object.entries(rawLm)) {
    const translated = {
      x: pos.x - nose.x,
      y: pos.y - nose.y,
      z: pos.z - nose.z,
    };

    let rotated = rotateZ(translated, rollRad);
    rotated = rotateY(rotated, panRad);
    rotated = rotateX(rotated, tiltRad);

    alignedLm[type] = rotated;
  }

  const scaleLandmarks = [
    alignedLm['LEFT_EYE'],
    alignedLm['RIGHT_EYE'],
    alignedLm['MOUTH_LEFT'],
    alignedLm['MOUTH_RIGHT'],
    alignedLm['CHIN_GNATHION']
  ].filter(Boolean);

  if (scaleLandmarks.length < 3) return null;

  const distances = scaleLandmarks.map(p => 
    Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z)
  );
  
  const avgDist = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  if (avgDist < 0.0001) return null;

  const normalizedLm = {};
  for (const [type, pos] of Object.entries(alignedLm)) {
    normalizedLm[type] = {
      x: pos.x / avgDist,
      y: pos.y / avgDist,
      z: pos.z / avgDist,
    };
  }

  return normalizedLm;
}

function scaleScore(raw) {
  if (raw <= 0.05) return raw;
  if (raw < 0.40) {
    return 0.05 + ((raw - 0.05) / (0.40 - 0.05)) * 0.75;
  }
  return 0.80 + ((raw - 0.40) / (1.00 - 0.40)) * 0.20;
}

function calculateFaceSimilarity(face1, face2) {
  const normLm1 = alignAndNormalizeLandmarks(face1);
  const normLm2 = alignAndNormalizeLandmarks(face2);

  if (!normLm1 || !normLm2) return 0;

  const keyTypes = [
    'LEFT_EYE',
    'RIGHT_EYE',
    'NOSE_TIP',
    'MOUTH_LEFT',
    'MOUTH_RIGHT',
    'MOUTH_CENTER',
    'CHIN_GNATHION',
    'MIDPOINT_BETWEEN_EYES',
    'NOSE_BOTTOM_NEUTRAL'
  ];

  let totalDistance = 0;
  let validCount = 0;

  for (const type of keyTypes) {
    const p1 = normLm1[type];
    const p2 = normLm2[type];

    if (p1 && p2) {
      const dist = Math.sqrt(
        Math.pow(p1.x - p2.x, 2) +
          Math.pow(p1.y - p2.y, 2) +
          Math.pow(p1.z - p2.z, 2) * 0.25
      );
      totalDistance += dist;
      validCount++;
    }
  }

  if (validCount < 5) return 0;

  const avgDistance = totalDistance / validCount;
  const rawSimilarity = Math.exp(-avgDistance * 3.5);

  const conf1 = face1.confidence || 0.85;
  const conf2 = face2.confidence || 0.85;
  const minConf = Math.min(conf1, conf2);

  const confidenceWeight = minConf < 0.7 ? minConf / 0.7 : 1.0;
  
  return scaleScore(rawSimilarity * confidenceWeight);
}

async function run() {
  const { data: rows } = await supabase.from('latihan_faces').select('*').gt('face_count', 0);
  
  const sourceImage = rows.find(r => r.image_title === 'DSC00170.JPG');
  const redHeadbandFace = sourceImage.face_data[0];

  try {
    const res = await fetch('http://localhost:3000/api/face/gallery');
    const data = await res.json();
    
    console.log('Searching for red headband player in gallery faces list...');
    data.faces.forEach((face, idx) => {
      // Find full face object in raw DB row
      const row = rows.find(r => r.image_id === face.imageId);
      const faceIndex = parseInt(face.id.split('_face_')[1]);
      const fullFace = row.face_data[faceIndex];
      
      const similarity = calculateFaceSimilarity(redHeadbandFace, fullFace);
      if (similarity > 0.85) {
        console.log(`Matched Index: ${idx} | Face ID: ${face.id} | Image: ${row.image_title} | Similarity: ${similarity.toFixed(4)}`);
      }
    });
  } catch (err) {
    console.error(err);
  }
}

run();
