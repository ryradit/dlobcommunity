import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const folderId = process.env.NEXT_PUBLIC_GDRIVE_TRAINING_FOLDER_ID;

    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'files(id, name, thumbnailLink, webViewLink, webContentLink, mimeType, createdTime)',
      orderBy: 'createdTime desc',
      pageSize: 100
    });

    // For each file, get the webContentLink separately since it's not included in list
    const files = await Promise.all(response.data.files?.map(async (file) => {
      try {
        const fileGet = await drive.files.get({
          fileId: file.id,
          fields: 'webContentLink',
        });
        return {
          ...file,
          webContentLink: fileGet.data.webContentLink,
          thumbnailLink: file.thumbnailLink?.replace(/=s\d+/, '=s1600'),
          imageLink: `https://drive.google.com/thumbnail?id=${file.id}&sz=w1600`,
        };
      } catch (error) {
        console.error(`Error getting webContentLink for file ${file.id}:`, error);
        return file;
      }
    }) || []);

    const files = response.data.files?.map(file => ({
      ...file,
      imageLink: `https://lh3.googleusercontent.com/d/${file.id}`,
    }));

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching training photos:', error);
    return NextResponse.json({ error: 'Failed to fetch training photos' }, { status: 500 });
  }
}