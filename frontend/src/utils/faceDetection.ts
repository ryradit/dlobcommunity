// Face Detection Utility using TensorFlow.js
// Install: npm install @tensorflow/tfjs @tensorflow-models/face-landmarks-detection

import * as tf from '@tensorflow/tfjs';

interface FaceDetectionResult {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

class FaceDetectionService {
  private static instance: FaceDetectionService;
  private model: any = null;
  private isLoading = false;

  static getInstance(): FaceDetectionService {
    if (!FaceDetectionService.instance) {
      FaceDetectionService.instance = new FaceDetectionService();
    }
    return FaceDetectionService.instance;
  }

  // Load the face detection model
  async loadModel(): Promise<void> {
    if (this.model || this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      // Option 1: Use BlazeFace (lightweight, fast)
      const { load } = await import('@tensorflow-models/blazeface');
      this.model = await load();
      
      console.log('✅ Face detection model loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load face detection model:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Detect faces in an image
  async detectFaces(imageElement: HTMLImageElement): Promise<FaceDetectionResult[]> {
    if (!this.model) {
      await this.loadModel();
      if (!this.model) return [];
    }

    try {
      // Convert image to tensor
      const tensor = tf.browser.fromPixels(imageElement);
      
      // Detect faces
      const predictions = await this.model.estimateFaces(tensor, false);
      
      // Clean up tensor
      tensor.dispose();

      // Convert predictions to our format
      return predictions.map((prediction: any) => ({
        x: prediction.topLeft[0],
        y: prediction.topLeft[1],
        width: prediction.bottomRight[0] - prediction.topLeft[0],
        height: prediction.bottomRight[1] - prediction.topLeft[1],
        confidence: prediction.probability ? prediction.probability[0] : 1
      }));

    } catch (error) {
      console.error('Face detection error:', error);
      return [];
    }
  }

  // Calculate optimal crop position based on detected faces
  calculateOptimalCrop(
    faces: FaceDetectionResult[], 
    imageWidth: number, 
    imageHeight: number
  ): { x: number; y: number } {
    if (faces.length === 0) {
      // No faces detected, use smart positioning
      return this.getSmartPosition(imageWidth, imageHeight);
    }

    // Find the face with highest confidence
    const primaryFace = faces.reduce((prev, current) => 
      (current.confidence > prev.confidence) ? current : prev
    );

    // Calculate face center
    const faceCenterX = primaryFace.x + primaryFace.width / 2;
    const faceCenterY = primaryFace.y + primaryFace.height / 2;

    // Convert to percentage
    const xPercent = (faceCenterX / imageWidth) * 100;
    const yPercent = (faceCenterY / imageHeight) * 100;

    // Ensure the crop position keeps the face visible
    return {
      x: Math.max(10, Math.min(90, xPercent)),
      y: Math.max(10, Math.min(90, yPercent))
    };
  }

  // Smart positioning without face detection
  private getSmartPosition(width: number, height: number): { x: number; y: number } {
    const aspectRatio = width / height;

    if (aspectRatio > 1.5) {
      // Wide landscape: center horizontally, upper third vertically
      return { x: 50, y: 30 };
    } else if (aspectRatio < 0.7) {
      // Portrait: center horizontally, focus on upper portion
      return { x: 50, y: 25 };
    } else {
      // Square-ish: slightly above center
      return { x: 50, y: 35 };
    }
  }

  // Get CSS object-position value
  getCSSPosition(faces: FaceDetectionResult[], imageWidth: number, imageHeight: number): string {
    const { x, y } = this.calculateOptimalCrop(faces, imageWidth, imageHeight);
    return `${x}% ${y}%`;
  }
}

export default FaceDetectionService;

// React Hook for face detection
export function useFaceDetection() {
  const faceDetector = FaceDetectionService.getInstance();

  const detectAndGetPosition = async (
    imageElement: HTMLImageElement
  ): Promise<string> => {
    try {
      const faces = await faceDetector.detectFaces(imageElement);
      return faceDetector.getCSSPosition(
        faces, 
        imageElement.naturalWidth, 
        imageElement.naturalHeight
      );
    } catch (error) {
      console.error('Face detection hook error:', error);
      return 'center 30%'; // Fallback position
    }
  };

  return { detectAndGetPosition };
}

// Simple face detection for member photos
export async function getSmartCropPosition(imageUrl: string, memberName: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = async () => {
      try {
        const faceDetector = FaceDetectionService.getInstance();
        const faces = await faceDetector.detectFaces(img);
        const position = faceDetector.getCSSPosition(faces, img.naturalWidth, img.naturalHeight);
        resolve(position);
      } catch (error) {
        console.error(`Face detection failed for ${memberName}:`, error);
        resolve('center 25%'); // Fallback
      }
    };

    img.onerror = () => {
      console.warn(`Image load failed for ${memberName}`);
      resolve('center 25%'); // Fallback
    };

    img.src = imageUrl;
  });
}