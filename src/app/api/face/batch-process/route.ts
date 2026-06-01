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
  joyLikelihood?: string;
  sorrowLikelihood?: string;
  angerLikelihood?: string;
  rollAngle?: number;
  panAngle?: number;
  tiltAngle?: number;
}

async function detectFacesInImage(imageUrl: string): Promise<FaceData[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Cloud API key not configured');
  }

  try {
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
  } catch (error) {
    console.error('Error detecting faces in image:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { imageIds } = await request.json();

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { error: 'imageIds array is required' },
        { status: 400 }
      );
    }

    console.log(`👤 Batch processing ${imageIds.length} images for face detection`);

    const results = [];

    for (const imageId of imageIds) {
      try {
        // Build Google Drive image URL directly from ID
        const imageUrl = `https://drive.google.com/uc?export=view&id=${imageId}`;
        const imageTitle = `Image ${imageId.substring(0, 8)}...`;

        // Detect faces
        let faces = await detectFacesInImage(imageUrl);
        
        // Filter to only reasonable-confidence faces (>0.50 = 50% confidence minimum)
        faces = faces.filter(face => (face.confidence || 0) > 0.50);
        
        console.log(`✅ Detected ${faces.length} high-confidence faces in image ${imageId}`);

        // Store face data
        const { error: storeError } = await supabase
          .from('latihan_faces')
          .upsert({
            image_id: imageId,
            image_title: imageTitle,
            face_count: faces.length,
            face_data: faces,
            processed_at: new Date().toISOString(),
          })
          .select();

        if (storeError) {
          console.error(`❌ Failed to store faces for ${imageId}:`, storeError);
          results.push({
            imageId,
            success: false,
            error: storeError.message,
          });
        } else {
          results.push({
            imageId,
            success: true,
            faceCount: faces.length,
          });
        }
      } catch (error) {
        console.error(`❌ Error processing ${imageId}:`, error);
        results.push({
          imageId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Rate limiting: 100ms delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`📊 Batch processing complete: ${successCount}/${imageIds.length} successful`);

    return NextResponse.json({
      success: true,
      totalProcessed: imageIds.length,
      successCount,
      results,
    });
  } catch (error) {
    console.error('❌ Batch processing error:', error);
    return NextResponse.json(
      {
        error: 'Batch processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET: Get batch processing status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      // Get statistics on processed images
      const { data, error } = await supabase
        .from('latihan_faces')
        .select('face_count');

      if (error) throw error;

      const stats = {
        totalProcessed: data?.length || 0,
        totalFaces: data?.reduce((sum, record) => sum + (record.face_count || 0), 0) || 0,
        averageFacesPerImage: data && data.length > 0 
          ? (data.reduce((sum, record) => sum + (record.face_count || 0), 0) / data.length).toFixed(2)
          : '0',
      };

      return NextResponse.json(stats);
    }

    return NextResponse.json({ message: 'Use ?action=stats to get statistics' });
  } catch (error) {
    console.error('Error getting batch status:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
