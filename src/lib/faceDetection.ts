// Face Detection Utility - Fallback Implementation
// This uses a simple heuristic approach that centers on the face area for portrait photos
// without requiring external ML libraries

interface FaceDetectionResult {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

class FaceDetectionService {
  private static instance: FaceDetectionService;

  static getInstance(): FaceDetectionService {
    if (!FaceDetectionService.instance) {
      FaceDetectionService.instance = new FaceDetectionService();
    }
    return FaceDetectionService.instance;
  }

  async loadModel(): Promise<void> {
    // Stub implementation - no model to load
    console.log('Face detection using fallback implementation (optimized for portrait photos)');
  }

  async detectFace(imageElement: HTMLImageElement): Promise<FaceDetectionResult | null> {
    // Optimized for portrait photos - shows waist to upper body/head
    try {
      const { naturalWidth, naturalHeight } = imageElement;
      
      if (!naturalWidth || !naturalHeight) return null;
      
      // For portrait photos, show from waist area to head
      // This typically means showing from ~40% down to top of image
      const faceWidth = naturalWidth * 0.6;
      const faceHeight = naturalHeight * 0.65;
      
      const result: FaceDetectionResult = {
        x: (naturalWidth - faceWidth) / 2,     // Center horizontally
        y: naturalHeight * 0.10,                // Start from 10% from top
        width: faceWidth,
        height: faceHeight,
        confidence: 0.9 // High confidence
      };

      return result;
    } catch (error) {
      console.error('Face detection fallback failed:', error);
      return null;
    }
  }

  // Helper method for getting optimal crop dimensions
  getOptimalCrop(
    imageWidth: number, 
    imageHeight: number, 
    targetWidth: number, 
    targetHeight: number
  ): CropArea {
    // Calculate square crop (1:1 aspect ratio for member cards)
    const targetAspect = targetWidth / targetHeight;
    const imageAspect = imageWidth / imageHeight;
    
    let cropWidth: number, cropHeight: number, cropX: number, cropY: number;
    
    if (imageAspect > targetAspect) {
      // Image is wider than target aspect ratio
      cropHeight = imageHeight;
      cropWidth = imageHeight * targetAspect;
      cropX = (imageWidth - cropWidth) / 2;
      cropY = 0;
    } else {
      // Image is taller than target aspect ratio
      cropWidth = imageWidth;
      cropHeight = imageWidth / targetAspect;
      cropX = 0;
      // Position crop to capture face in upper-middle portion
      cropY = Math.max(0, (imageHeight - cropHeight) * 0.15);
    }
    
    return {
      x: Math.max(0, cropX),
      y: Math.max(0, cropY),
      width: Math.min(cropWidth, imageWidth),
      height: Math.min(cropHeight, imageHeight)
    };
  }

  // Smart crop that tries to center faces properly
  async getSmartCrop(
    imageElement: HTMLImageElement,
    targetWidth: number,
    targetHeight: number
  ): Promise<CropArea> {
    const face = await this.detectFace(imageElement);
    
    if (face && face.confidence > 0.7) {
      // Calculate crop area that keeps face centered
      const { width: imgWidth, height: imgHeight } = imageElement;
      const targetAspect = targetWidth / targetHeight;
      
      // Calculate crop dimensions to match target aspect ratio
      let cropWidth: number, cropHeight: number;
      if (imgWidth / imgHeight > targetAspect) {
        cropHeight = imgHeight;
        cropWidth = imgHeight * targetAspect;
      } else {
        cropWidth = imgWidth;
        cropHeight = imgWidth / targetAspect;
      }
      
      // Center crop on the detected face with slight bias towards top
      const faceCenterX = face.x + face.width / 2;
      const faceCenterY = face.y + face.height / 2;
      
      // For square crops on portrait photos, position face in upper-middle
      let cropX = faceCenterX - cropWidth / 2;
      let cropY = faceCenterY - cropHeight * 0.35; // Bias towards top
      
      // Ensure crop stays within image bounds
      cropX = Math.max(0, Math.min(cropX, imgWidth - cropWidth));
      cropY = Math.max(0, Math.min(cropY, imgHeight - cropHeight));
      
      return {
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight
      };
    }
    
    // Fallback to optimal crop
    return this.getOptimalCrop(
      imageElement.width, 
      imageElement.height, 
      targetWidth, 
      targetHeight
    );
  }
}

// Export the singleton instance
export const faceDetection = FaceDetectionService.getInstance();
export type { FaceDetectionResult, CropArea };
