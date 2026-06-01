import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Convert vertices array to bounding box (since database coordinates are now normalized, this is a clean bounding box)
function vertexToBoundingBox(vertices: Array<{ x: number; y: number }> | undefined) {
  if (!vertices || vertices.length === 0) {
    return { left: 0, top: 0, right: 1, bottom: 1 };
  }

  const xs = vertices.map(v => v.x || 0);
  const ys = vertices.map(v => v.y || 0);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    left: Math.max(0, minX),
    top: Math.max(0, minY),
    right: Math.min(1, maxX),
    bottom: Math.min(1, maxY),
  };
}

// Extract key facial features for comparison
function extractKeyFeatures(landmarks: any[]): any {
  if (!landmarks || !Array.isArray(landmarks)) return null;
  const features: any = {};
  for (const landmark of landmarks) {
    const type = landmark.type?.toLowerCase();
    if (type && landmark.position) {
      features[type] = landmark.position;
    }
  }
  return Object.keys(features).length > 0 ? features : null;
}

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

function calculateFaceSimilarity(face1: any, face2: any): number {
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

  const conf1 = face1.confidence || 0.85;
  const conf2 = face2.confidence || 0.85;
  const minConf = Math.min(conf1, conf2);

  // If confidence is extremely low, penalize
  const confidenceWeight = minConf < 0.7 ? minConf / 0.7 : 1.0;
  
  return scaleScore(rawSimilarity * confidenceWeight);
}

// Deduplicate similar faces by clustering using 3D similarity
function deduplicateSimilarFaces(faces: any[], threshold: number = 0.87): any[] {
  if (faces.length === 0) return faces;

  const clusters: any[][] = [];
  const clustered = new Set<number>();

  for (let i = 0; i < faces.length; i++) {
    if (clustered.has(i)) continue;

    const cluster = [faces[i]];
    clustered.add(i);

    // Find all faces similar to this one
    for (let j = i + 1; j < faces.length; j++) {
      if (clustered.has(j)) continue;

      const similarity = calculateFaceSimilarity(faces[i], faces[j]);
      if (similarity >= threshold) {
        cluster.push(faces[j]);
        clustered.add(j);
      }
    }

    clusters.push(cluster);
  }

  // Pick the best face from each cluster (highest confidence)
  const dedupedFaces = clusters.map((cluster) =>
    cluster.reduce((best, current) =>
      (current.confidence || 0.9) > (best.confidence || 0.9) ? current : best
    )
  );

  // Sort by confidence descending
  return dedupedFaces.sort((a, b) => (b.confidence || 0.9) - (a.confidence || 0.9));
}

export async function GET(request: NextRequest) {
  try {
    // Fetch all processed faces from latihan images
    const { data: imageRecords, error } = await supabase
      .from('latihan_faces')
      .select('*')
      .gt('face_count', 0)
      .order('processed_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Database error fetching faces:', error);
      throw error;
    }

    const faceList = [];
    
    if (imageRecords) {
      for (const imageRecord of imageRecords) {
        const faceData = imageRecord.face_data;
        
        if (Array.isArray(faceData) && faceData.length > 0) {
          for (let i = 0; i < faceData.length; i++) {
            const face = faceData[i];
            
            const faceId = `${imageRecord.image_id}_face_${i}`;
            
            // Extract normalized bounding box
            const boundingBox = vertexToBoundingBox(face.vertices);

            // Add padding around face for better display (8% padding - stable zoom)
            const width = boundingBox.right - boundingBox.left;
            const height = boundingBox.bottom - boundingBox.top;
            const padX = width * 0.08;
            const padY = height * 0.08;

            faceList.push({
              id: faceId,
              imageId: imageRecord.image_id,
              confidence: face.confidence || 0.9,
              landmarks: face.landmarks,
              rollAngle: face.rollAngle,
              panAngle: face.panAngle,
              tiltAngle: face.tiltAngle,
              boundingBox: boundingBox,
              // Crop coordinates for background positioning
              crop: {
                left: Math.max(0, boundingBox.left - padX),
                top: Math.max(0, boundingBox.top - padY),
                right: Math.min(1, boundingBox.right + padX),
                bottom: Math.min(1, boundingBox.bottom + padY),
              },
              imageUrl: `/api/drive/image-proxy?id=${imageRecord.image_id}`,
            });
          }
        }
      }
    }

    // Deduplicate same people appearing in different photos using landmark similarity
    const dedupedFaces = deduplicateSimilarFaces(faceList, 0.87);

    return NextResponse.json({
      faces: dedupedFaces.slice(0, 100),
      total: dedupedFaces.length,
      originalTotal: faceList.length,
    });
  } catch (error) {
    console.error('Error fetching face gallery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch face gallery' },
      { status: 500 }
    );
  }
}
