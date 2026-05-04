import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Convert vertices array to bounding box (handles both normalized and pixel coordinates)
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

  // Detect if coordinates are normalized (0-1) or pixel coordinates (larger values)
  // If all values are < 2, assume normalized; otherwise, treat as pixel coords that need normalization
  const isNormalized = maxX <= 2 && maxY <= 2;

  if (isNormalized) {
    // Already normalized
    return {
      left: Math.max(0, minX),
      top: Math.max(0, minY),
      right: Math.min(1, maxX),
      bottom: Math.min(1, maxY),
    };
  } else {
    // Pixel coordinates - estimate image dimensions and normalize
    // Assume image is roughly square or landscape, extrapolate dimension from coordinates
    const estimatedWidth = Math.max(maxX * 1.1, 100); // Add 10% margin
    const estimatedHeight = Math.max(maxY * 1.1, 100);
    
    return {
      left: Math.max(0, minX / estimatedWidth),
      top: Math.max(0, minY / estimatedHeight),
      right: Math.min(1, maxX / estimatedWidth),
      bottom: Math.min(1, maxY / estimatedHeight),
    };
  }
}

// Calculate similarity between two faces based on bounding boxes
function calculateFaceSimilarity(face1: any, face2: any): number {
  const b1 = vertexToBoundingBox(face1.vertices);
  const b2 = vertexToBoundingBox(face2.vertices);

  // Calculate centers
  const c1x = (b1.left + b1.right) / 2;
  const c1y = (b1.top + b1.bottom) / 2;
  const c2x = (b2.left + b2.right) / 2;
  const c2y = (b2.top + b2.bottom) / 2;

  // Calculate sizes
  const w1 = b1.right - b1.left;
  const h1 = b1.bottom - b1.top;
  const w2 = b2.right - b2.left;
  const h2 = b2.bottom - b2.top;

  // Euclidean distance between centers (normalized)
  const centerDistance = Math.sqrt(
    Math.pow(c1x - c2x, 2) + Math.pow(c1y - c2y, 2)
  );
  // More weight to center position for better discrimination
  const centerSimilarity = Math.max(0, 1 - (centerDistance * 2));

  // Size similarity - faces of same person should be similar size
  const widthRatio = Math.min(w1, w2) / Math.max(w1, w2 || 0.001);
  const heightRatio = Math.min(h1, h2) / Math.max(h1 || 0.001, h2);
  const sizeSimilarity = (widthRatio + heightRatio) / 2;

  // Confidence penalty - both faces must be detected with reasonable confidence
  const minConfidence = Math.min(face1.confidence || 0.9, face2.confidence || 0.9);
  
  // Only match if BOTH faces have good confidence
  if (minConfidence < 0.7) {
    return 0;
  }

  // 70% weight on center position, 30% on size match
  const similarity =
    (centerSimilarity * 0.7 + sizeSimilarity * 0.3) *
    minConfidence;

  return similarity;
}

// Deduplicate similar faces by clustering
function deduplicateSimilarFaces(faces: any[], threshold: number = 0.75): any[] {
  if (faces.length === 0) return faces;

  const clusters: any[][] = [];
  const clustered = new Set<number>();

  // Cluster similar faces (very high threshold to ensure same person)
  for (let i = 0; i < faces.length; i++) {
    if (clustered.has(i)) continue;

    const cluster = [faces[i]];
    clustered.add(i);

    // Find all faces similar to this one
    for (let j = i + 1; j < faces.length; j++) {
      if (clustered.has(j)) continue;

      const similarity = calculateFaceSimilarity(faces[i], faces[j]);
      if (similarity > threshold) {
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

    // Parse face_data and extract individual faces
    const faceList = [];
    
    if (imageRecords) {
      for (const imageRecord of imageRecords) {
        const faceData = imageRecord.face_data;
        
        if (Array.isArray(faceData) && faceData.length > 0) {
          for (let i = 0; i < faceData.length; i++) {
            const face = faceData[i];
            
            // Create a unique ID for this face
            const faceId = `${imageRecord.image_id}_face_${i}`;
            
            // Extract bounding box from vertices (Google Vision API format)
            let boundingBox = vertexToBoundingBox(face.vertices);
            
            // Fallback to boundingBox if it exists
            if (face.boundingBox && Object.keys(face.boundingBox).length > 0) {
              boundingBox = face.boundingBox;
            }

            // Add padding around face for better display (5% - minimal padding, tight crop)
            const width = (boundingBox?.right || 1) - (boundingBox?.left || 0);
            const height = (boundingBox?.bottom || 1) - (boundingBox?.top || 0);
            const padX = width * 0.05;  // 5% padding instead of 10%
            const padY = height * 0.05;

            faceList.push({
              id: faceId,
              imageId: imageRecord.image_id,
              confidence: face.confidence || 0.9,
              boundingBox: boundingBox || {
                left: 0,
                top: 0,
                right: 1,
                bottom: 1,
              },
              // Crop coordinates for canvas rendering
              crop: {
                left: Math.max(0, (boundingBox?.left || 0) - padX),
                top: Math.max(0, (boundingBox?.top || 0) - padY),
                right: Math.min(1, (boundingBox?.right || 1) + padX),
                bottom: Math.min(1, (boundingBox?.bottom || 1) + padY),
              },
              // URL for the original image that will be cropped
              // Use server proxy to handle CORS and image conversion
              imageUrl: `/api/drive/image-proxy?id=${imageRecord.image_id}`,
            });
          }
        }
      }
    }

    // Show ALL faces without heavy deduplication
    // Only remove near-exact duplicates (99% match) - same person in same outfit
    // Keep same person in different clothes/angles separate
    const dedupedFaces = deduplicateSimilarFaces(faceList, 0.99);

    return NextResponse.json({
      faces: dedupedFaces.slice(0, 100), // Increased limit to show more faces
      total: dedupedFaces.length,
      originalTotal: faceList.length, // Show how many were removed (should be minimal)
    });
  } catch (error) {
    console.error('Error fetching face gallery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch face gallery' },
      { status: 500 }
    );
  }
}
