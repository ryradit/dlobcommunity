import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    const download = searchParams.get('download') === 'true';
    const size = searchParams.get('size'); // e.g., '400', '800', '1000'

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    console.log(`🖼️ Proxying image: ${fileId}${size ? ` (size: ${size}px)` : ''}`);

    // Check if the image is HEIC based on fileId or custom query param
    const isHeic = searchParams.get('isHeic') === 'true' || fileId.toLowerCase().includes('heic');
    
    let url: string;
    
    // If size is requested, use thumbnail endpoint which supports sz parameter
    // Otherwise use standard view/download format
    if (size && !download) {
      // Use thumbnail endpoint for sized images - supports sz=w400, sz=w800, etc.
      url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
      console.log(`📐 Using thumbnail endpoint with size: w${size}`);
    } else if (isHeic && !download) {
      // For previewing HEIC files, use Google Drive's thumbnail endpoint with large size
      // to fetch a high-quality browser-renderable JPEG image.
      url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
      console.log(`🖼️ Using large thumbnail preview for HEIC`);
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

    // If thumbnail endpoint fails, try export=view (only if not using size parameter)
    if (!response.ok && !size) {
      console.warn(`⚠️ Initial fetch failed (${response.status}), trying fallback method`);
      url = `https://drive.google.com/uc?export=view&id=${fileId}`;
      if (download) {
        url = `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
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
    
    // For HEIC preview, serve as image/jpeg since it is converted by the thumbnail endpoint.
    // For HEIC download, serve as image/heic.
    if (isHeic && !download) {
      contentType = 'image/jpeg';
    } else if (isHeic && (contentType.includes('octet-stream') || contentType.includes('text/html'))) {
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
