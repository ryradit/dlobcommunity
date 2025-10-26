'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface SmartCropImageProps {
  src: string;
  alt: string;
  name: string;
  className?: string;
  onError?: () => void;
}

export default function SmartCropImage({ src, alt, name, className = '', onError }: SmartCropImageProps) {
  const [imagePosition, setImagePosition] = useState('center 25%');
  const [zoomFactor, setZoomFactor] = useState(1.0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Face detection using browser's native APIs (when available)
  const detectFaceAndCrop = async (imageElement: HTMLImageElement) => {
    try {
      // Check if Face Detection API is available (currently experimental)
      if ('FaceDetector' in window) {
        const faceDetector = new (window as any).FaceDetector();
        const faces = await faceDetector.detect(imageElement);
        
        if (faces && faces.length > 0) {
          const face = faces[0];
          const boundingBox = face.boundingBox;
          
          // Add padding around the face to include head/forehead area
          const foreheadPadding = boundingBox.height * 0.4; // 40% of face height for forehead/hair
          const sidePadding = boundingBox.width * 0.2; // 20% of face width for sides
          
          // Calculate the center of the "head area" (face + padding for head)
          const headCenterX = boundingBox.x + boundingBox.width / 2;
          const headCenterY = Math.max(0, boundingBox.y - foreheadPadding / 2) + (boundingBox.height + foreheadPadding) / 2;
          
          // Convert to percentages with safety margins, shift to top for ultimate headroom
          const xPercent = Math.max(15, Math.min(85, (headCenterX / imageElement.naturalWidth) * 100));
          const yPercent = Math.max(5, Math.min(50, (headCenterY / imageElement.naturalHeight) * 100 - 20)); // Subtract 20% for ultimate high positioning
          
          const basePosition = `${xPercent}% ${yPercent}%`;
          const finalPosition = applyMemberSpecificPositioning(basePosition, name);
          setImagePosition(finalPosition);
          
          // Calculate zoom based on face size relative to image (including head area)
          const totalHeadPadding = boundingBox.height * 0.4;
          const headArea = (boundingBox.width + boundingBox.width * 0.2) * (boundingBox.height + totalHeadPadding);
          const imageArea = imageElement.naturalWidth * imageElement.naturalHeight;
          const headRatio = headArea / imageArea;
          
          // Significant zoom for better face visibility
          let autoZoom = 1.0;
          if (headRatio < 0.04) {
            autoZoom = 1.4; // 40% zoom for very small heads
          } else if (headRatio < 0.08) {
            autoZoom = 1.3; // 30% zoom for small heads
          } else if (headRatio < 0.15) {
            autoZoom = 1.2; // 20% zoom for medium heads
          } else if (headRatio < 0.25) {
            autoZoom = 1.1; // 10% zoom for larger heads
          }
          
          // Ensure we don't crop heads by checking if zoom would cause cropping
          const zoomedWidth = imageElement.naturalWidth / autoZoom;
          const zoomedHeight = imageElement.naturalHeight / autoZoom;
          
          // If the head area would be close to edges after zoom, reduce zoom
          if (boundingBox.x < zoomedWidth * 0.1 || boundingBox.y < zoomedHeight * 0.15 ||
              (boundingBox.x + boundingBox.width) > zoomedWidth * 0.9 ||
              (boundingBox.y + boundingBox.height) > zoomedHeight * 0.85) {
            autoZoom = Math.max(1.0, autoZoom - 0.05); // Reduce zoom by 5% if near edges
          }
          
          // Apply member-specific adjustments
          const finalZoom = applyMemberSpecificZoom(autoZoom, name);
          setZoomFactor(finalZoom);
          return;
        }
      }
      
      // Fallback: Use MediaPipe or TensorFlow.js for face detection
      await detectFaceWithMediaPipe(imageElement);
      
    } catch (error) {
      console.log('Face detection not available, using smart positioning');
      // Use intelligent positioning based on image dimensions
      useSmartPositioning(imageElement);
    }
  };

  // Alternative face detection using MediaPipe (requires library)
  const detectFaceWithMediaPipe = async (imageElement: HTMLImageElement) => {
    // This would require @mediapipe/face_detection
    // For now, we'll simulate smart positioning
    useSmartPositioning(imageElement);
  };

  // Smart positioning algorithm with conservative auto-zoom to prevent head cropping
  const useSmartPositioning = (imageElement: HTMLImageElement) => {
    const aspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
    const imageWidth = imageElement.naturalWidth;
    const imageHeight = imageElement.naturalHeight;
    
    // Calculate if image needs zooming based on dimensions and likely face size
    let zoomFactor = calculateAutoZoom(imageWidth, imageHeight, aspectRatio);
    
    let basePosition: string;
    if (aspectRatio > 1.5) {
      // Wide landscape: likely group photo or distant shot, high positioning with significant zoom
      basePosition = 'center 10%'; // Position at top for ultimate headroom
      zoomFactor = Math.max(zoomFactor, 1.3); // 30% zoom for wide images to show faces better
    } else if (aspectRatio < 0.7) {
      // Tall portrait: likely close-up, high positioning with moderate zoom
      basePosition = 'center 8%'; // Position at top for ultimate headroom
      zoomFactor = Math.max(zoomFactor, 1.2); // 20% zoom for portraits to enhance face visibility
    } else {
      // Square-ish: balanced approach with high positioning and good zoom
      basePosition = 'center 9%'; // Position at top for ultimate headroom
      zoomFactor = Math.max(zoomFactor, 1.25); // 25% zoom for square images for better face visibility
    }
    
    // Apply member-specific positioning adjustments
    const finalPosition = applyMemberSpecificPositioning(basePosition, name);
    setImagePosition(finalPosition);
    
    // Apply member-specific adjustments to the calculated zoom
    const finalZoom = applyMemberSpecificZoom(zoomFactor, name);
    
    // Set zoom factor in state
    setZoomFactor(finalZoom);
  };

  // Calculate optimal zoom factor based on image characteristics
  const calculateAutoZoom = (width: number, height: number, aspectRatio: number): number => {
    const minDimension = Math.min(width, height);
    const maxDimension = Math.max(width, height);
    
    // Base zoom calculation - smaller images or very wide/tall images need more zoom
    let baseZoom = 1.0;
    
    // Significant zoom for better face visibility
    if (minDimension < 300) {
      baseZoom = 1.4; // 40% zoom for very small images
    } else if (minDimension < 600) {
      baseZoom = 1.3; // 30% zoom for small-medium images
    } else if (minDimension < 1000) {
      baseZoom = 1.2; // 20% zoom for medium-large images
    } else {
      baseZoom = 1.1; // 10% zoom for large images
    }
    
    // Additional zoom for extreme aspect ratios (likely need more focus)
    if (aspectRatio > 2.5 || aspectRatio < 0.4) {
      baseZoom += 0.2; // Extra 20% zoom for very extreme ratios
    } else if (aspectRatio > 2.0 || aspectRatio < 0.5) {
      baseZoom += 0.1; // Extra 10% zoom for extreme ratios
    }
    
    // Additional zoom for very large images to focus on subject
    if (maxDimension > 2000) {
      baseZoom += 0.1; // Extra 10% zoom for very high res images
    }
    
    return Math.min(baseZoom, 1.8); // Cap zoom at 80% for good visibility while preventing over-cropping
  };

  // Apply member-specific zoom adjustments
  const applyMemberSpecificZoom = (calculatedZoom: number, memberName: string): number => {
    const memberAdjustments: { [key: string]: number } = {
      'Dimas': -0.15,    // Zoom out by 15% for Dimas
      'Hendi': 0.1,      // Zoom in by 10% for Hendi
      'Wiwin': 0.1,      // Zoom in by 10% for Wiwin
      'Jonathan': -0.2,  // Zoom out by 20% for Jonathan
      'Bibit': -0.2,     // Zoom out by 20% for Bibit
      'Dedi': 0.1        // Zoom in by 10% for Dedi
    };

    const adjustment = memberAdjustments[memberName] || 0;
    const adjustedZoom = calculatedZoom + adjustment;
    
    // Ensure zoom stays within reasonable bounds
    return Math.max(1.0, Math.min(adjustedZoom, 1.8));
  };

  // Apply member-specific positioning adjustments
  const applyMemberSpecificPositioning = (basePosition: string, memberName: string): string => {
    const memberPositionAdjustments: { [key: string]: number } = {
      'Wiwin': 16,  // Move 16% lower for Wiwin
      'Dimas': 16,  // Move 16% lower for Dimas
      'Hendi': 16   // Move 16% lower for Hendi
    };

    const adjustment = memberPositionAdjustments[memberName] || 0;
    
    if (adjustment > 0) {
      // Extract the current Y position and add the adjustment
      const match = basePosition.match(/center (\d+)%/);
      if (match) {
        const currentY = parseInt(match[1]);
        const newY = Math.min(currentY + adjustment, 60); // Cap at 60% to prevent going too low
        return `center ${newY}%`;
      }
    }
    
    return basePosition;
  };

  // Handle image load
  const handleImageLoad = () => {
    setIsLoaded(true);
    if (imageRef.current) {
      detectFaceAndCrop(imageRef.current);
    }
  };

  // Handle image error
  const handleImageError = () => {
    setUseFallback(true);
    if (onError) onError();
  };

  if (useFallback) {
    return (
      <img
        src={`https://ui-avatars.com/api/?name=${name}&size=300&background=3b82f6&color=fff&bold=true`}
        alt={alt}
        className={`${className} object-cover w-full h-full`}
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
        }}
      />
    );
  }

  return (
    <Image
      ref={imageRef}
      src={src}
      alt={alt}
      fill
      className={`${className} object-cover transition-all duration-500 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        objectPosition: imagePosition,
        objectFit: 'cover',
        width: '100%',
        height: '100%',
        transform: `scale(${zoomFactor})`,
        transformOrigin: imagePosition, // Scale from the focal point
      }}
      onLoad={handleImageLoad}
      onError={handleImageError}
      priority={false}
      sizes="300px"
      quality={85}
    />
  );
}