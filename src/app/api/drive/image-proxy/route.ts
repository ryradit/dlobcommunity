import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    console.log(`🖼️ Proxying image: ${fileId}`);

    // Try direct Google Drive URL with export=view
    let url = `https://drive.google.com/uc?export=view&id=${fileId}`;
    
    let response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      // Fallback to export=download
      url = `https://drive.google.com/uc?export=download&id=${fileId}`;
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        console.error(`❌ Failed to fetch image: ${response.status}`);
        return NextResponse.json(
          { error: 'Failed to fetch image from Google Drive' },
          { status: 404 }
        );
      }
    }

    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    console.log(`📊 Image signature bytes (first 20):`, {
      hex: Array.from(uint8Array.slice(0, 20)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '),
      byte4: `0x${uint8Array[4]?.toString(16)}`,
      byte5: `0x${uint8Array[5]?.toString(16)}`,
      byte6: `0x${uint8Array[6]?.toString(16)}`,
      byte7: `0x${uint8Array[7]?.toString(16)}`,
      byte8: `0x${uint8Array[8]?.toString(16)}`,
      bufferSize: buffer.byteLength,
    });
    
    // Detect if it's HEIC/HEIF and convert to JPG
    // HEIC files start with specific bytes: 0x66 0x74 0x79 0x70 (at offset 4) which is "ftyp"
    const isHeic = 
      uint8Array[4] === 0x66 && 
      uint8Array[5] === 0x74 && 
      uint8Array[6] === 0x79 && 
      uint8Array[7] === 0x70 &&
      (uint8Array[8] === 0x68 || // heic
       uint8Array[8] === 0x6d ||  // mif1
       uint8Array[8] === 0x61);  // avif

    console.log(`📦 Detected format: ${isHeic ? 'HEIC/HEIF (will convert)' : 'Standard format (JPG/PNG/etc)'}`);

    if (isHeic) {
      try {
        console.log('🔄 Starting HEIC to JPG conversion via sharp...');
        
        // Try converting with sharp
        let converted;
        try {
          converted = await sharp(uint8Array)
            .rotate() // Auto-rotate based on EXIF
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();
        } catch (sharpError) {
          console.warn('⚠️ First conversion attempt failed, trying alternate method...');
          // Try with Buffer wrapper
          converted = await sharp(Buffer.from(uint8Array))
            .rotate()
            .jpeg({ quality: 90 })
            .toBuffer();
        }
        
        console.log(`✅ Successfully converted HEIC to JPG: ${converted.length} bytes`);

        const responseBody: any = converted;
        return new NextResponse(responseBody, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=604800',
          },
        });
      } catch (convertError) {
        console.error('❌ HEIC conversion completely failed:', {
          error: convertError instanceof Error ? convertError.message : String(convertError),
          stack: convertError instanceof Error ? convertError.stack : undefined,
        });
        
        // If conversion absolutely fails, try to return as JPEG anyway
        // Some HEIC files might work with just quality reduction
        try {
          const fallbackJpeg = await sharp(uint8Array)
            .toFormat('jpeg')
            .toBuffer();
          
          console.log(`⚠️ Using fallback JPEG output: ${fallbackJpeg.length} bytes`);
          return new NextResponse(fallbackJpeg as any, {
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=604800',
            },
          });
        } catch (fallbackError) {
          console.error('❌ All conversions failed, returning original:', fallbackError);
          // Return original if everything fails
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': 'image/heic',
              'Cache-Control': 'public, max-age=604800',
            },
          });
        }
      }
    }

    // Return standard format as-is
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const responseBody: any = buffer;
    return new NextResponse(responseBody, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800',
      },
    });
  } catch (error) {
    console.error('❌ Image proxy error:', error);
    return NextResponse.json(
      {
        error: 'Failed to proxy image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
