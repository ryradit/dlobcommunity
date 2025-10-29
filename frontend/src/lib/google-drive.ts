"use client";

export interface DrivePhoto {
  id: string;
  name: string;
  thumbnailLink: string;
  webViewLink: string;
  webContentLink?: string;
  imageLink: string;
  createdTime: string;
}

class GoogleDriveService {
  private readonly API_BASE_URL = '/api/drive';

  constructor() {}

  public async getTrainingPhotos(): Promise<DrivePhoto[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/training-photos`);
      if (!response.ok) {
        throw new Error('Failed to fetch training photos');
      }

      const files = await response.json();
      return files.map((file: any) => {
        // Get high quality thumbnail by modifying the URL
        const highQualityThumbnail = file.thumbnailLink?.replace(/=s\d+/, '=s1600') || null;

        return {
          id: file.id,
          name: file.name,
          thumbnailLink: highQualityThumbnail,
          webViewLink: file.webViewLink,
          webContentLink: `https://drive.google.com/uc?export=view&id=${file.id}`,
          imageLink: `https://drive.google.com/thumbnail?id=${file.id}&sz=w1600`,
          createdTime: file.createdTime
        };
      });
    } catch (error) {
      console.error('Error fetching training photos:', error);
      return [];
    }
  }

  public async getImageThumbnail(fileId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/thumbnail/${fileId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch thumbnail');
      }

      const data = await response.json();
      return data.thumbnailLink || null;
    } catch (error) {
      console.error('Error fetching thumbnail:', error);
      return null;
    }
  }
}

export const googleDriveService = new GoogleDriveService();