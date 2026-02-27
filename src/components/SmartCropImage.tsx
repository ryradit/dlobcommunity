'use client';

import React, { useState, useEffect, useRef } from 'react';
import { faceDetection } from '@/lib/faceDetection';

interface SmartCropImageProps {
  src: string;
  alt: string;
  name: string;
  className?: string;
}

export default function SmartCropImage({ src, alt, name, className = '' }: SmartCropImageProps) {
  const [objectPosition, setObjectPosition] = useState<string>('center center');
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  const calculateObjectPosition = async () => {
    try {
      if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        const { naturalWidth, naturalHeight } = imgRef.current;
        
        // Get smart crop dimensions
        const crop = await faceDetection.getSmartCrop(imgRef.current, 400, 400);
        
        // Calculate the center of the crop area as a percentage
        const centerX = ((crop.x + crop.width / 2) / naturalWidth) * 100;
        const centerY = ((crop.y + crop.height / 2) / naturalHeight) * 100;
        
        // Constrain to valid range
        const constrainedX = Math.max(0, Math.min(100, centerX));
        const constrainedY = Math.max(0, Math.min(100, centerY));
        
        setObjectPosition(`${constrainedX}% ${constrainedY}%`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error calculating object position:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (imgRef.current?.complete) {
      calculateObjectPosition();
    }
  }, [src]);

  const handleImageLoad = () => {
    calculateObjectPosition();
  };

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gray-100 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse z-10" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={handleImageLoad}
        className="w-full h-full object-cover transition-all duration-300"
        style={{
          objectPosition: objectPosition,
        }}
      />
    </div>
  );
}
