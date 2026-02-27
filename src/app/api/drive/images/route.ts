import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const category = searchParams.get('category');

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

    // Fetch files from Google Drive folder using the public API key
    // This is safe since we're only accessing shared/public files
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&spaces=drive&fields=files(id,name,mimeType)&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📁 Folder ${folderId} (${category}):`, {
      totalFiles: data.files?.length || 0,
      imageFiles: (data.files || []).filter((f: any) => f.mimeType.startsWith('image/')).length,
      files: data.files?.map((f: any) => f.name) || []
    });

    const images = (data.files || [])
      .filter((file: any) => file.mimeType.startsWith('image/'))
      .map((file: any) => {
        // For HEIC and other formats, use Google's export/view URL which auto-converts
        const imageUrl = `https://drive.google.com/uc?export=view&id=${file.id}`;
        
        return {
          id: file.id,
          title: file.name,
          thumbnail: imageUrl,
          type: 'image',
          url: imageUrl,
          category,
        };
      });

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching Google Drive images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images from Google Drive' },
      { status: 500 }
    );
  }
}
