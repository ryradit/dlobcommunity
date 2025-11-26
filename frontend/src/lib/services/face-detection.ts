import { google } from 'googleapis';

interface FaceData {
  faceId: string;
  memberName?: string;
  confidence: number;
  boundingBox: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

interface PhotoWithFaces {
  photoId: string;
  faces: FaceData[];
  thumbnailLink: string;
  imageLink: string;
}

export class FaceDetectionService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY || '';
  }

  async detectFacesInPhoto(imageUrl: string): Promise<FaceData[]> {
    try {
      const response = await fetch('https://vision.googleapis.com/v1/images:annotate?key=' + this.apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                source: {
                  imageUri: imageUrl,
                },
              },
              features: [
                {
                  type: 'FACE_DETECTION',
                  maxResults: 10,
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      if (!data.responses?.[0]?.faceAnnotations) {
        return [];
      }

      return data.responses[0].faceAnnotations.map((face: any, index: number) => ({
        faceId: `face-${index}-${Date.now()}`,
        confidence: face.detectionConfidence,
        boundingBox: {
          left: face.fdBoundingPoly.vertices[0].x,
          top: face.fdBoundingPoly.vertices[0].y,
          width: face.fdBoundingPoly.vertices[2].x - face.fdBoundingPoly.vertices[0].x,
          height: face.fdBoundingPoly.vertices[2].y - face.fdBoundingPoly.vertices[0].y,
        },
      }));
    } catch (error) {
      console.error('Error detecting faces:', error);
      return [];
    }
  }

  async groupPhotosByFaces(photos: PhotoWithFaces[]): Promise<Map<string, PhotoWithFaces[]>> {
    const faceGroups = new Map<string, PhotoWithFaces[]>();
    
    for (const photo of photos) {
      const faces = await this.detectFacesInPhoto(photo.imageLink);
      photo.faces = faces;
      
      // Group photos by each face detected
      faces.forEach(face => {
        const existingGroup = faceGroups.get(face.faceId) || [];
        existingGroup.push(photo);
        faceGroups.set(face.faceId, existingGroup);
      });
    }

    return faceGroups;
  }

  // Match a face against known member faces
  async matchFaceToMember(faceId: string, memberFaces: Map<string, string[]>): Promise<string | null> {
    // This would use face recognition to match against known member faces
    // For now, return null as this requires additional ML models
    return null;
  }
}