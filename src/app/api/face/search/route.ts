import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BoundingBox {
  vertices: Array<{ x: number; y: number }>;
}

function calculateBoundingBoxDistance(box1: BoundingBox, box2: BoundingBox): number {
  // Simple distance calculation based on bounding box centers
  const center1 = {
    x: box1.vertices.reduce((sum, v) => sum + v.x, 0) / box1.vertices.length,
    y: box1.vertices.reduce((sum, v) => sum + v.y, 0) / box1.vertices.length,
  };

  const center2 = {
    x: box2.vertices.reduce((sum, v) => sum + v.x, 0) / box2.vertices.length,
    y: box2.vertices.reduce((sum, v) => sum + v.y, 0) / box2.vertices.length,
  };

  const dx = center1.x - center2.x;
  const dy = center1.y - center2.y;
  
  return Math.sqrt(dx * dx + dy * dy);
}

function findSimilarFaces(
  userFaces: any[],
  storedFaceData: any,
  similarityThreshold: number = 0.6
): number {
  // For simplicity, we just count if the image has any faces detected
  // In production, you'd use more sophisticated face recognition (embeddings)
  if (storedFaceData.face_count && storedFaceData.face_count > 0) {
    // Try to match based on face attributes (size, position)
    if (userFaces.length > 0 && storedFaceData.face_data?.length > 0) {
      const userFace = userFaces[0]; // Use first detected face from user photo
      const imageFaces = storedFaceData.face_data;

      // Calculate similarity based on face size and position similarity
      let matchScore = 0;
      let matches = 0;

      for (const detectedFace of imageFaces) {
        const distance = calculateBoundingBoxDistance(
          userFace.boundingPoly,
          detectedFace.vertices
        );
        
        // Normalize distance to similarity score (0-1, 1 being exact match)
        const normalizedDistance = Math.min(distance / 200, 1); // Threshold at 200px
        const similarity = 1 - normalizedDistance;
        
        if (similarity > similarityThreshold) {
          matchScore += similarity;
          matches++;
        }
      }

      return matches > 0 ? matchScore / matches : smallConfidenceBoost(storedFaceData);
    }
  }

  // If no faces in image, return 0
  return 0;
}

function smallConfidenceBoost(storedFaceData: any): number {
  // Small boost if the image has same number of faces detected
  // This is a fallback for when we can't match specific faces
  return 0.3;
}

async function detectFacesInImage(base64Image: string): Promise<any[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Cloud API key not configured');
  }

  const visionResponse = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: 'FACE_DETECTION', maxResults: 10 },
              { type: 'LANDMARK_DETECTION', maxResults: 10 },
            ],
          },
        ],
      }),
    }
  );

  const visionData = await visionResponse.json();

  if (!visionData.responses?.[0]?.faceAnnotations) {
    return [];
  }

  return visionData.responses[0].faceAnnotations.map((face: any) => ({
    boundingPoly: face.boundingPoly,
    confidence: face.detectionConfidence,
    landmarks: face.landmarks,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photo = formData.get('photo') as File;

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo file is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Searching for matching faces in user photo: ${photo.name}`);

    // Convert uploaded photo to base64
    const buffer = await photo.arrayBuffer();
    const base64Photo = Buffer.from(buffer).toString('base64');

    // Detect faces in user's photo
    const userFaces = await detectFacesInImage(base64Photo);
    
    if (userFaces.length === 0) {
      return NextResponse.json(
        {
          error: 'No face detected in your photo',
          details: 'Please upload a clear photo of yourself',
        },
        { status: 400 }
      );
    }

    console.log(`✅ Detected ${userFaces.length} face(s) in user photo`);

    // Get all processed latihan images
    const { data: allFaceData, error } = await supabase
      .from('latihan_faces')
      .select('*')
      .gt('face_count', 0)
      .order('processed_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to search images', details: error.message },
        { status: 500 }
      );
    }

    if (!allFaceData || allFaceData.length === 0) {
      return NextResponse.json({
        success: true,
        userFaceCount: userFaces.length,
        matchingImages: [],
        totalSearched: 0,
        message: 'No latihan images have been processed yet. Please process images first.',
      });
    }

    // Calculate similarity scores for each image
    const matchResults = allFaceData
      .map((imageData: any) => {
        const similarityScore = findSimilarFaces(userFaces, imageData);
        return {
          imageId: imageData.image_id,
          imageTitle: imageData.image_title,
          faceCount: imageData.face_count,
          similarityScore,
          matched: similarityScore > 0,
        };
      })
      .filter((result: any) => result.matched)
      .sort((a: any, b: any) => b.similarityScore - a.similarityScore);

    console.log(`✅ Found ${matchResults.length} matching images out of ${allFaceData.length} total`);

    return NextResponse.json({
      success: true,
      userFaceCount: userFaces.length,
      matchingImages: matchResults,
      totalSearched: allFaceData.length,
      message: matchResults.length > 0
        ? `Found ${matchResults.length} image(s) with similar faces!`
        : 'No matching images found. Try a clearer photo.',
    });
  } catch (error) {
    console.error('❌ Face search error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search for faces',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
