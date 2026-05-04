import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Convert vertices to bounding box
function vertexToBoundingBox(vertices: Array<{ x: number; y: number }> | undefined) {
  if (!vertices || vertices.length === 0) {
    return { left: 0, top: 0, right: 1, bottom: 1 };
  }

  const xs = vertices.map(v => v.x || 0);
  const ys = vertices.map(v => v.y || 0);

  return {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
  };
}

// Calculate similarity between two faces using bounding box AND landmarks
function calculateFaceSimilarity(sourceFace: any, targetFace: any): number {
  const sourceBounds = vertexToBoundingBox(sourceFace.vertices);
  const targetBounds = vertexToBoundingBox(targetFace.vertices);
  const sourceConfidence = sourceFace.confidence || 0.9;
  const targetConfidence = targetFace.confidence || 0.9;

  // Calculate centers
  const sourceCenterX = (sourceBounds.left + sourceBounds.right) / 2;
  const sourceCenterY = (sourceBounds.top + sourceBounds.bottom) / 2;
  const targetCenterX = (targetBounds.left + targetBounds.right) / 2;
  const targetCenterY = (targetBounds.top + targetBounds.bottom) / 2;

  // Calculate sizes
  const sourceWidth = sourceBounds.right - sourceBounds.left;
  const sourceHeight = sourceBounds.bottom - sourceBounds.top;
  const targetWidth = targetBounds.right - targetBounds.left;
  const targetHeight = targetBounds.bottom - targetBounds.top;

  // Euclidean distance between centers (normalized)
  const centerDistance = Math.sqrt(
    Math.pow(sourceCenterX - targetCenterX, 2) +
    Math.pow(sourceCenterY - targetCenterY, 2)
  );
  const centerSimilarity = Math.max(0, 1 - centerDistance * 1.5);

  // Size similarity
  const widthRatio = Math.min(sourceWidth, targetWidth) / Math.max(sourceWidth, targetWidth || 0.001);
  const heightRatio = Math.min(sourceHeight, targetHeight) / Math.max(sourceHeight || 0.001, targetHeight);
  const sizeSimilarity = (widthRatio + heightRatio) / 2;

  // **NEW**: Compare facial landmarks if available
  let landmarkSimilarity = 0.8; // Default if no landmarks
  
  if (sourceFace.landmarks?.length > 0 && targetFace.landmarks?.length > 0) {
    // Extract key facial feature positions (eyes, nose, mouth center)
    const sourceKeyFeatures = extractKeyFeatures(sourceFace.landmarks);
    const targetKeyFeatures = extractKeyFeatures(targetFace.landmarks);
    
    if (sourceKeyFeatures && targetKeyFeatures) {
      landmarkSimilarity = compareLandmarks(sourceKeyFeatures, targetKeyFeatures);
    }
  }

  // Confidence check
  const minConfidence = Math.min(sourceConfidence, targetConfidence);
  if (minConfidence < 0.7) {
    return 0; // Reject low-confidence faces
  }

  // Combined score: 30% center, 30% size, 40% landmarks (facial features)
  const similarity = (
    centerSimilarity * 0.3 +
    sizeSimilarity * 0.3 +
    landmarkSimilarity * 0.4
  ) * minConfidence;

  return similarity;
}

// Extract key facial features for comparison
function extractKeyFeatures(landmarks: any[]): any {
  const features: any = {};
  
  // Map landmark types to positions
  for (const landmark of landmarks) {
    const type = landmark.type?.toLowerCase();
    if (type && landmark.position) {
      features[type] = landmark.position;
    }
  }

  return Object.keys(features).length > 0 ? features : null;
}

// Compare facial landmarks between two faces
function compareLandmarks(sourceLandmarks: any, targetLandmarks: any): number {
  const keyPoints = ['LEFT_EYE', 'RIGHT_EYE', 'NOSE_TIP', 'MOUTH_CENTER'];
  let matchCount = 0;
  let totalComparable = 0;

  for (const keyPoint of keyPoints) {
    const sourceFeature = sourceLandmarks[keyPoint.toLowerCase()];
    const targetFeature = targetLandmarks[keyPoint.toLowerCase()];

    if (sourceFeature && targetFeature) {
      totalComparable++;
      
      // Calculate distance between landmark positions
      const distance = Math.sqrt(
        Math.pow((sourceFeature.x || 0) - (targetFeature.x || 0), 2) +
        Math.pow((sourceFeature.y || 0) - (targetFeature.y || 0), 2)
      );

      // Normalize distance: closer = higher match
      // Allow up to 0.15 normalized distance for a match
      if (distance < 0.15) {
        matchCount++;
      }
    }
  }

  // Return score based on how many key landmarks matched
  return totalComparable > 0 ? (matchCount / totalComparable) * 0.9 + 0.1 : 0.8;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const faceId = searchParams.get('faceId');

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
    const sourceBounds = vertexToBoundingBox(sourceFace.vertices);
    const sourceConfidence = sourceFace.confidence || 0.9;

    console.log(`📸 Searching similar faces for face ${sourceFaceIndex} in image ${sourceImageId}`);

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

            // Calculate similarity using both bounding box and facial landmarks
            const similarity = calculateFaceSimilarity(sourceFace, targetFace);

            // Include image if similarity is above threshold (0.60 = 60% match)
            // Higher threshold catches more similar images even with different clothes
            if (similarity > 0.60) {
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

    console.log(`✅ Found ${results.length} similar images`);

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
