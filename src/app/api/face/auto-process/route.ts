import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

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
      // Use NORMALIZED vertices (0-1 range) instead of pixel coordinates
      vertices: face.boundingPoly.normalizedVertices || face.boundingPoly.vertices,
      confidence: face.detectionConfidence,
      landmarks: face.landmarks,
      joyLikelihood: face.joyLikelihood,
      sorrowLikelihood: face.sorrowLikelihood,
      angerLikelihood: face.angerLikelihood,
      rollAngle: face.rollAngle,
      panAngle: face.panAngle,
      tiltAngle: face.tiltAngle,
    }));
  } catch (error) {
    console.error('Error detecting faces in image:', error);
    return [];
  }
}

async function fetchGoogleDriveImages(folderId: string): Promise<Array<{id: string; name: string}>> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;
  if (!apiKey) throw new Error('API key missing');

  let allFiles: any[] = [];
  let pageToken: string | null = null;
  let pageCount = 0;
  const maxPages = 10; // Fetch up to 500 files

  do {
    pageCount++;
    const pageTokenParam: string = pageToken ? `&pageToken=${pageToken}` : '';
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&spaces=drive&fields=files(id,name,mimeType),nextPageToken&pageSize=50&key=${apiKey}${pageTokenParam}`
    );

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.status}`);
    }

    const data = await response.json();
    const pageFiles = data.files || [];
    pageToken = data.nextPageToken || null;
    
    allFiles = [...allFiles, ...pageFiles];

    if (!pageToken || pageCount >= maxPages) break;
  } while (pageToken);

  // Filter to only images
  return allFiles
    .filter((file: any) => file.mimeType.startsWith('image/'))
    .map((file: any) => ({
      id: file.id,
      name: file.name,
    }));
}

export async function POST(request: NextRequest) {
  try {
    const { folderId } = await request.json();

    if (!folderId) {
      return NextResponse.json(
        { error: 'folderId is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching images from Google Drive folder: ${folderId}`);

    // Get all images from Google Drive
    const googleDriveImages = await fetchGoogleDriveImages(folderId);
    console.log(`📁 Found ${googleDriveImages.length} images on Google Drive`);

    // Get already processed images from database
    const { data: processedImages, error: dbError } = await supabase
      .from('latihan_faces')
      .select('image_id');

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    const processedImageIds = new Set(processedImages?.map(p => p.image_id) || []);
    console.log(`✅ Already processed: ${processedImageIds.size} images`);

    // Find new images
    const newImages = googleDriveImages.filter(
      img => !processedImageIds.has(img.id)
    );

    console.log(`🆕 New images to process: ${newImages.length}`);

    if (newImages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new images to process',
        newImagesCount: 0,
        results: [],
      });
    }

    // Process new images
    const results = [];
    let successCount = 0;

    for (const image of newImages) {
      try {
        const imageUrl = `https://drive.google.com/uc?export=view&id=${image.id}`;
        
        console.log(`👤 Processing: ${image.name} (${image.id})`);
        let faces = await detectFacesInImage(imageUrl);
        
        // Filter to only reasonable-confidence faces (>0.50 = 50% confidence)
        // This captures more faces while still filtering obvious false positives
        faces = faces.filter(face => (face.confidence || 0) > 0.50);
        
        console.log(`   ✅ Detected ${faces.length} high-confidence faces`);

        // Store face data
        const { error: storeError } = await supabase
          .from('latihan_faces')
          .insert({
            image_id: image.id,
            image_title: image.name,
            face_count: faces.length,
            face_data: faces,
            processed_at: new Date().toISOString(),
          });

        if (storeError) {
          console.error(`   ❌ Database error:`, storeError);
          results.push({
            imageId: image.id,
            name: image.name,
            success: false,
            error: storeError.message,
          });
        } else {
          successCount++;
          results.push({
            imageId: image.id,
            name: image.name,
            success: true,
            faceCount: faces.length,
          });
        }
      } catch (error) {
        console.error(`   ❌ Error:`, error);
        results.push({
          imageId: image.id,
          name: image.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📊 Auto-process complete: ${successCount}/${newImages.length} successful`);

    return NextResponse.json({
      success: true,
      newImagesCount: newImages.length,
      processedCount: successCount,
      failedCount: newImages.length - successCount,
      results,
    });
  } catch (error) {
    console.error('❌ Auto-process error:', error);
    return NextResponse.json(
      {
        error: 'Auto-process failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET: Check status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
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
    console.error('Error getting status:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
