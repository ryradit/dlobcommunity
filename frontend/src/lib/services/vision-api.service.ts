export interface CloudVisionFace {
  boundingBox: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  imageId: string;
  faceId: string;
  imageUrl: string;
  confidence: number;
}

export class VisionApiService {
  private static instance: VisionApiService;
  private API_KEY: string;
  private faceGroups: Map<string, CloudVisionFace[]> = new Map();

  private constructor() {
    this.API_KEY = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY || '';
  }

  static getInstance(): VisionApiService {
    if (!VisionApiService.instance) {
      VisionApiService.instance = new VisionApiService();
    }
    return VisionApiService.instance;
  }

  async detectFaces(imageUrl: string): Promise<CloudVisionFace[]> {
    try {
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.API_KEY}`,
        {
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
                    maxResults: 100,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      if (!data.responses?.[0]?.faceAnnotations) {
        return [];
      }

      return data.responses[0].faceAnnotations.map((face: any, index: number) => ({
        boundingBox: {
          left: face.boundingPoly.vertices[0].x,
          top: face.boundingPoly.vertices[0].y,
          width: face.boundingPoly.vertices[2].x - face.boundingPoly.vertices[0].x,
          height: face.boundingPoly.vertices[2].y - face.boundingPoly.vertices[0].y,
        },
        imageId: imageUrl,
        faceId: `${imageUrl}_face_${index}`,
        imageUrl,
        confidence: face.detectionConfidence,
      }));
    } catch (error) {
      console.error('Error detecting faces:', error);
      return [];
    }
  }

  async processImages(images: Array<{ url: string; id: string }>): Promise<Map<string, CloudVisionFace[]>> {
    const allFaces: CloudVisionFace[] = [];
    
    // Process each image
    for (const image of images) {
      const faces = await this.detectFaces(image.url);
      allFaces.push(...faces);
    }

    // Group similar faces
    const faceGroups = new Map<string, CloudVisionFace[]>();
    allFaces.forEach((face, index) => {
      let groupFound = false;

      // Check if this face matches any existing group
      for (const [groupId, faces] of faceGroups.entries()) {
        if (this.areSimilarFaces(face, faces[0])) {
          faces.push(face);
          groupFound = true;
          break;
        }
      }

      // If no matching group found, create a new one
      if (!groupFound) {
        faceGroups.set(`face_group_${index}`, [face]);
      }
    });

    this.faceGroups = faceGroups;
    return faceGroups;
  }

  private areSimilarFaces(face1: CloudVisionFace, face2: CloudVisionFace): boolean {
    // In a real implementation, you would use the Cloud Vision API's face landmarks
    // to compare faces more accurately. This is a simplified version.
    const CONFIDENCE_THRESHOLD = 0.8;
    return face1.confidence > CONFIDENCE_THRESHOLD && face2.confidence > CONFIDENCE_THRESHOLD;
  }

  getFaceGroups(): Map<string, CloudVisionFace[]> {
    return this.faceGroups;
  }
}