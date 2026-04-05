import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '250', 10); // Allow up to 250 images per category

    if (!folderId || !category) {
      return NextResponse.json(
        { error: 'folderId and category are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key missing' },
        { status: 500 }
      );
    }

    // Fetch all files from Google Drive folder with pagination support
    // Google Drive API default pageSize is 10, we need to fetch all files
    let allFiles: any[] = [];
    let pageToken: string | null = null;
    let pageCount = 0;
    const maxPages = 5; // Limit to 5 pages max (500 files) to avoid excessive API calls
    let totalReturned = 0;

    do {
      pageCount++;
      const pageTokenParam: string = pageToken ? `&pageToken=${pageToken}` : '';
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&spaces=drive&fields=files(id,name,mimeType,createdTime),nextPageToken&pageSize=50&key=${apiKey}${pageTokenParam}`
      );

      if (!response.ok) {
        console.error(`❌ Google Drive API error: ${response.status}`);
        throw new Error(`Google Drive API error: ${response.status}`);
      }

      const data = await response.json();
      const pageFiles = data.files || [];
      
      console.log(`📄 Page ${pageCount}: Fetched ${pageFiles.length} files`);
      
      allFiles = [...allFiles, ...pageFiles];
      totalReturned += pageFiles.length;
      pageToken = data.nextPageToken || null;

      // Stop if we reach the limit or no more pages
      if (totalReturned >= limit || !pageToken || pageCount >= maxPages) {
        break;
      }
    } while (pageToken);

    console.log(`📁 Folder ${folderId} (${category}):`, {
      totalFilesFound: allFiles.length,
      totalPages: pageCount,
      imageFiles: allFiles.filter((f: any) => f.mimeType.startsWith('image/')).length,
      allFileNames: allFiles.map((f: any) => f.name).sort(),
    });

    // Filter to only images and sort by creation time (newest first)
    const images = allFiles
      .filter((file: any) => file.mimeType.startsWith('image/'))
      .sort((a: any, b: any) => {
        // Sort by creation time, newest first
        return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime();
      })
      .slice(0, limit)
      .map((file: any) => {
        // For HEIC and other formats, use Google's export/view URL which auto-converts
        const imageUrl = `https://drive.google.com/uc?export=view&id=${file.id}`;
        // Use smaller size for thumbnail to load faster as blur background
        const thumbnailUrl = `https://drive.google.com/uc?export=view&id=${file.id}&sz=w200`;
        
        return {
          id: file.id,
          title: file.name,
          thumbnail: thumbnailUrl,
          type: 'image',
          url: imageUrl,
          category,
        };
      });

    console.log(`✅ Returning ${images.length} images for ${category}`);

    return NextResponse.json({ images });
  } catch (error) {
    console.error('❌ Error fetching Google Drive images:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch images from Google Drive',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
