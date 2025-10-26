// Face Detection Utility (Stub Implementation)
// TensorFlow.js dependencies not installed - using fallback

interface FaceDetectionResult {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
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
    console.log('Face detection using fallback implementation (no TensorFlow.js)');
  }

  async detectFace(imageElement: HTMLImageElement): Promise<FaceDetectionResult | null> {
    // Fallback implementation - return center-focused area
    try {
      const { width, height } = imageElement;
      
      // Assume face is in the center-top area of the image
      const faceWidth = Math.min(width * 0.6, height * 0.8);
      const faceHeight = faceWidth;
      
      const result: FaceDetectionResult = {
        x: (width - faceWidth) / 2,
        y: height * 0.1, // Top 10% of image
        width: faceWidth,
        height: faceHeight,
        confidence: 0.5 // Low confidence since it's a guess
      };

      console.log('Face detection fallback result:', result);
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
  ): { x: number; y: number; width: number; height: number } {
    // Simple center crop as fallback
    const aspectRatio = targetWidth / targetHeight;
    const imageAspectRatio = imageWidth / imageHeight;
    
    let cropWidth, cropHeight, cropX, cropY;
    
    if (imageAspectRatio > aspectRatio) {
      // Image is wider than target aspect ratio
      cropHeight = imageHeight;
      cropWidth = imageHeight * aspectRatio;
      cropX = (imageWidth - cropWidth) / 2;
      cropY = 0;
    } else {
      // Image is taller than target aspect ratio
      cropWidth = imageWidth;
      cropHeight = imageWidth / aspectRatio;
      cropX = 0;
      cropY = (imageHeight - cropHeight) / 4; // Slight bias towards top
    }
    
    return {
      x: Math.max(0, cropX),
      y: Math.max(0, cropY),
      width: Math.min(cropWidth, imageWidth),
      height: Math.min(cropHeight, imageHeight)
    };
  }

  // Smart crop that tries to preserve faces
  async getSmartCrop(
    imageElement: HTMLImageElement,
    targetWidth: number,
    targetHeight: number
  ): Promise<{ x: number; y: number; width: number; height: number }> {
    const face = await this.detectFace(imageElement);
    
    if (face) {
      // Calculate crop area that includes the face
      const { width: imgWidth, height: imgHeight } = imageElement;
      const aspectRatio = targetWidth / targetHeight;
      
      // Calculate crop dimensions
      let cropWidth, cropHeight;
      if (imgWidth / imgHeight > aspectRatio) {
        cropHeight = imgHeight;
        cropWidth = imgHeight * aspectRatio;
      } else {
        cropWidth = imgWidth;
        cropHeight = imgWidth / aspectRatio;
      }
      
      // Center the crop on the face
      const faceCenterX = face.x + face.width / 2;
      const faceCenterY = face.y + face.height / 2;
      
      let cropX = faceCenterX - cropWidth / 2;
      let cropY = faceCenterY - cropHeight / 2;
      
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
    
    // Fallback to center crop
    return this.getOptimalCrop(imageElement.width, imageElement.height, targetWidth, targetHeight);
  }
}

// Export the singleton instance
export const faceDetection = FaceDetectionService.getInstance();
export type { FaceDetectionResult };