import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Point3D {
  x: number;
  y: number;
  z: number;
}

function rotateX(p: Point3D, angleRad: number): Point3D {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: p.x,
    y: p.y * cos - p.z * sin,
    z: p.y * sin + p.z * cos,
  };
}

function rotateY(p: Point3D, angleRad: number): Point3D {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: p.x * cos + p.z * sin,
    y: p.y,
    z: -p.x * sin + p.z * cos,
  };
}

function rotateZ(p: Point3D, angleRad: number): Point3D {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos,
    z: p.z,
  };
}

function alignAndNormalizeLandmarks(face: any): Record<string, Point3D> | null {
  if (!face || !Array.isArray(face.landmarks)) return null;

  const rawLm: Record<string, Point3D> = {};
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

  // Convert angles to radians (invert rotation to bring back to frontal view)
  const rollRad = -((face.rollAngle || 0) * Math.PI) / 180;
  const panRad = -((face.panAngle || 0) * Math.PI) / 180;
  const tiltRad = -((face.tiltAngle || 0) * Math.PI) / 180;

  const alignedLm: Record<string, Point3D> = {};

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

  // Calculate 3D scale normalization factor using the average distance of stable landmarks from the nose tip
  const scaleLandmarks = [
    alignedLm['LEFT_EYE'],
    alignedLm['RIGHT_EYE'],
    alignedLm['MOUTH_LEFT'],
    alignedLm['MOUTH_RIGHT'],
    alignedLm['CHIN_GNATHION']
  ].filter(Boolean);

  if (scaleLandmarks.length < 3) return null;

  // Since nose tip is origin [0,0,0], distance is just the vector magnitude
  const distances = scaleLandmarks.map(p => 
    Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z)
  );
  
  const avgDist = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  if (avgDist < 0.0001) return null;

  const normalizedLm: Record<string, Point3D> = {};
  for (const [type, pos] of Object.entries(alignedLm)) {
    normalizedLm[type] = {
      x: pos.x / avgDist,
      y: pos.y / avgDist,
      z: pos.z / avgDist,
    };
  }

  return normalizedLm;
}

function scaleScore(raw: number): number {
  if (raw <= 0.05) return raw;
  // Map raw range [0.05, 0.40] to [0.05, 0.80]
  if (raw < 0.40) {
    return 0.05 + ((raw - 0.05) / (0.40 - 0.05)) * 0.75;
  }
  // Map raw range [0.40, 1.00] to [0.80, 1.00]
  return 0.80 + ((raw - 0.40) / (1.00 - 0.40)) * 0.20;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function calculateFaceSimilarity(sourceFace: any, targetFace: any): number {
  // If both faces have neural embeddings (stored by store-embeddings.py), use cosine similarity
  const e1 = sourceFace?.embedding;
  const e2 = targetFace?.embedding;
  if (Array.isArray(e1) && Array.isArray(e2) && e1.length > 0 && e2.length === e1.length) {
    const cosSim = cosineSimilarity(e1, e2);
    // cosine >= 0.55 → same person (maps to output 0.70 – 0.98)
    // cosine < 0.55  → different  (maps to output 0.00 – 0.45, below the 0.65 threshold)
    if (cosSim >= 0.55) {
      return 0.70 + (cosSim - 0.55) / 0.45 * 0.28; // 0.70 – 0.98
    } else {
      return Math.max(0, cosSim / 0.55 * 0.45); // 0.00 – 0.45 (below threshold)
    }
  }

  const normLm1 = alignAndNormalizeLandmarks(sourceFace);
  const normLm2 = alignAndNormalizeLandmarks(targetFace);

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
      // Weight Z difference by 0.25 to reduce depth noise from Vision API estimates
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

  const conf1 = sourceFace.confidence || 0.85;
  const conf2 = targetFace.confidence || 0.85;
  const minConf = Math.min(conf1, conf2);

  // If confidence is extremely low, penalize
  const confidenceWeight = minConf < 0.7 ? minConf / 0.7 : 1.0;
  
  return scaleScore(rawSimilarity * confidenceWeight);
}


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const faceId = searchParams.get('faceId');
    const threshold = parseFloat(searchParams.get('threshold') || '0.87');

    if (!faceId) {
      return NextResponse.json(
        { error: 'Face ID is required' },
        { status: 400 }
      );
    }

    // Parse faceId to get imageId and faceIndex
    const parts = faceId.split('_face_');
    if (parts.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid face ID format' },
        { status: 400 }
      );
    }

    const sourceImageId = parts[0];
    const sourceFaceIndex = parseInt(parts[1]);

    // Fetch the source image's face data
    const { data: sourceImage, error: sourceError } = await supabase
      .from('latihan_faces')
      .select('face_data')
      .eq('image_id', sourceImageId)
      .single();

    if (sourceError) {
      console.error('Error fetching source image:', sourceError);
      return NextResponse.json(
        { error: 'Source image not found', details: sourceError.message },
        { status: 404 }
      );
    }

    if (!sourceImage) {
      return NextResponse.json(
        { error: 'Source image not found - database may still be populating' },
        { status: 404 }
      );
    }

    const faceData = sourceImage.face_data;
    if (!Array.isArray(faceData) || !faceData[sourceFaceIndex]) {
      return NextResponse.json(
        { error: `Face index ${sourceFaceIndex} out of range` },
        { status: 400 }
      );
    }

    const sourceFace = faceData[sourceFaceIndex];

    console.log(`📸 Searching similar faces for face ${sourceFaceIndex} in image ${sourceImageId} (threshold: ${threshold})`);

    // Fetch all latihan faces to compare
    const { data: allImages, error: imagesError } = await supabase
      .from('latihan_faces')
      .select('*')
      .gt('face_count', 0);

    if (imagesError) throw imagesError;

    // Calculate similarity for each face
    const similarImageIds = new Set<string>();
    const similarityScores = new Map<string, number>();
    const similarFaceDetails = new Map<string, { similarity: number; faceIndex: number }>();

    if (allImages && Array.isArray(allImages)) {
      for (const imageRecord of allImages) {
        const faces = imageRecord.face_data;

        if (Array.isArray(faces)) {
          for (let faceIndex = 0; faceIndex < faces.length; faceIndex++) {
            const targetFace = faces[faceIndex];

            // Calculate similarity using scale-invariant landmark ratios
            const similarity = calculateFaceSimilarity(sourceFace, targetFace);

            // Include image if similarity is above threshold
            if (similarity >= threshold) {
              similarImageIds.add(imageRecord.image_id);
              const currentBest = similarityScores.get(imageRecord.image_id) || 0;
              if (similarity > currentBest) {
                similarityScores.set(imageRecord.image_id, similarity);
                similarFaceDetails.set(imageRecord.image_id, { similarity, faceIndex });
              }
            }
          }
        }
      }
    }

    // Convert to array and sort by similarity
    const results = Array.from(similarImageIds).map(imageId => ({
      imageId,
      similarity: (similarityScores.get(imageId) || 0),
    })).sort((a, b) => b.similarity - a.similarity);

    console.log(`✅ Found ${results.length} similar images above threshold ${threshold}`);

    return NextResponse.json({
      sourceImageId,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error finding similar faces:', error);
    return NextResponse.json(
      { error: 'Failed to find similar faces', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
