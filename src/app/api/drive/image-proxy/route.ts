import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    const download = searchParams.get('download') === 'true';

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    console.log(`🖼️ Proxying image: ${fileId}`);

    // For HEIC files, use Google Drive's built-in PNG conversion
    // For other formats, use export=view for preview or export=download for download
    const isHeic = fileId.toLowerCase().includes('heic');
    
    let url: string;
    if (isHeic) {
      // Use export=view with PNG conversion for HEIC files
      // Google Drive can serve HEIC as viewable content
      url = `https://drive.google.com/uc?export=view&id=${fileId}`;
    } else {
      // For JPG, PNG, etc - use export=view for preview
      url = `https://drive.google.com/uc?export=view&id=${fileId}`;
      if (download) {
        url = `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }

    console.log(`📌 Fetching from: ${url.substring(0, 80)}...`);
    
    let response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*',
      },
      redirect: 'follow',
    });

    // If export=view fails, try export=download
    if (!response.ok) {
      console.warn(`⚠️ export=view failed (${response.status}), trying export=download`);
      url = `https://drive.google.com/uc?export=download&id=${fileId}`;
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/*',
        },
        redirect: 'follow',
      });
    }

    // If still failing, return 404
    if (!response.ok) {
      console.error(`❌ Both methods failed - status ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch image from Google Drive', status: response.status },
        { status: response.status }
      );
    }

    // Get the response buffer
    const buffer = await response.arrayBuffer();
    console.log(`✅ Fetched ${buffer.byteLength} bytes`);

    // Determine content type
    let contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // If it's HEIC, try to detect if Google converted it to something else
    if (isHeic && contentType.includes('octet-stream')) {
      contentType = 'image/heic';
    }
    
    console.log(`🎨 Serving as ${contentType}`);

    // Return the image with proper headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=604800, immutable',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    };

    if (download) {
      headers['Content-Disposition'] = `attachment; filename="image"`;
    }

    return new NextResponse(buffer, { headers });
  } catch (error) {
    console.error('❌ Image proxy error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      {
        error: 'Failed to proxy image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
