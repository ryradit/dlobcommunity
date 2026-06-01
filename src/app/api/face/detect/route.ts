import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FaceData {
  vertices: Array<{ x: number; y: number }>;
  confidence: number;
  landmarks?: Array<{
    type: string;
    position: { x: number; y: number };
  }>;
}

async function detectFacesInImage(imageUrl: string): Promise<FaceData[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Cloud API key not configured');
  }

  // Convert image URL to base64
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  const bufferObj = Buffer.from(buffer);
  const base64Image = bufferObj.toString('base64');

  // Use sharp to get the original image dimensions
  const metadata = await sharp(bufferObj).metadata();
  const width = metadata.width || 1000;
  const height = metadata.height || 1000;

  // Call Google Vision API for face detection
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
              { type: 'FACE_DETECTION', maxResults: 10 }
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

  return visionData.responses[0].faceAnnotations.map((face: any) => {
    // Normalize boundingPoly vertices
    const vertices = (face.boundingPoly?.vertices || []).map((v: any) => ({
      x: (v.x || 0) / width,
      y: (v.y || 0) / height,
    }));

    // Normalize landmarks
    const landmarks = (face.landmarks || []).map((lm: any) => ({
      type: lm.type,
      position: {
        x: (lm.position.x || 0) / width,
        y: (lm.position.y || 0) / height,
        z: (lm.position.z || 0) / Math.max(width, height),
      },
    }));

    return {
      vertices,
      confidence: face.detectionConfidence,
      landmarks,
      joyLikelihood: face.joyLikelihood,
      sorrowLikelihood: face.sorrowLikelihood,
      angerLikelihood: face.angerLikelihood,
      rollAngle: face.rollAngle,
      panAngle: face.panAngle,
      tiltAngle: face.tiltAngle,
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const { imageId, imageTitle, imageUrl } = await request.json();

    if (!imageId || !imageUrl) {
      return NextResponse.json(
        { error: 'imageId and imageUrl are required' },
        { status: 400 }
      );
    }

    console.log(`👤 Detecting faces in image: ${imageId} (${imageTitle})`);

    // Detect faces
    const faces = await detectFacesInImage(imageUrl);
    console.log(`✅ Detected ${faces.length} faces in image ${imageId}`);

    // Store face data in database
    const { data, error } = await supabase
      .from('latihan_faces')
      .upsert({
        image_id: imageId,
        image_title: imageTitle,
        face_count: faces.length,
        face_data: faces,
        processed_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to store face data', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageId,
      faceCount: faces.length,
      faces,
      stored: data,
    });
  } catch (error) {
    console.error('❌ Face detection error:', error);
    return NextResponse.json(
      {
        error: 'Failed to detect faces',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET: Check detection status for an image
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'imageId is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('latihan_faces')
      .select('*')
      .eq('image_id', imageId)
      .single();

    if (error) {
      return NextResponse.json(
        { detected: false, message: 'Face data not yet processed' }
      );
    }

    return NextResponse.json({
      detected: true,
      faceCount: data.face_count,
      faces: data.face_data,
      processedAt: data.processed_at,
    });
  } catch (error) {
    console.error('❌ Error fetching face data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch face data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
