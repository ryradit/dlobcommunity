'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { faceDetection } from '@/lib/faceDetection';

interface SmartCropImageProps {
  src: string;
  alt: string;
  name: string;
  className?: string;
}

/**
 * Computes CSS `object-position Y%` so the face center appears at
 * `targetFaceY` fraction from the top of the container.
 *
 * With `object-fit: cover` scaled by width:
 *   scale      = containerW / naturalW
 *   overflow   = naturalH * scale - containerH
 *   trimmedTop = overflow * (objY% / 100)
 *
 * We want: (faceCenterY_px * scale - trimmedTop) / containerH = targetFaceY
 *   → objY% = (faceCenterY_px * scale - targetFaceY * containerH) / overflow * 100
 */
function computeObjectPositionY(
  naturalWidth: number,
  naturalHeight: number,
  containerW: number,
  containerH: number,
  faceCenterY_px: number,
  targetFaceY = 0.22
): number {
  const scale = containerW / naturalWidth;
  const overflow = naturalHeight * scale - containerH;
  if (overflow <= 0) return 50;
  const offsetY = faceCenterY_px * scale - targetFaceY * containerH;
  return Math.max(0, Math.min(100, (offsetY / overflow) * 100));
}

export default function SmartCropImage({ src, alt, name: _name, className = '' }: SmartCropImageProps) {
  const [objectPosition, setObjectPosition] = useState<string>('50% 5%');
  const [zoom, setZoom] = useState<number>(1);
  const [transformOrigin, setTransformOrigin] = useState<string>('50% 22%');
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const calculateObjectPosition = useCallback(async () => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !img.complete || img.naturalWidth === 0 || !container) return;
    try {
      const { naturalWidth, naturalHeight } = img;
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;

      const imagePath = src.startsWith('/') ? src : new URL(src).pathname;
      const face = await faceDetection.detectFacePercent(imagePath);
      const faceZoom = face.zoom ?? 1.3;

      // Dynamic target face position:
      // After scale(zoom) from origin at targetFaceY, the head top
      // (≈ HEAD_PAD above the face) moves to: targetFaceY − HEAD_PAD × zoom.
      // We need that to stay ≥ HEAD_PAD from the top edge, so:
      //   targetFaceY ≥ HEAD_PAD × (1 + zoom)
      // This ensures the head is never clipped regardless of zoom level.
      const HEAD_PAD = 0.12; // ~12% of card height reserved above face for the head
      const targetFaceY = Math.min(0.55, Math.max(0.22, HEAD_PAD * (1 + faceZoom)));

      const faceCenterY_px = (face.faceY / 100) * naturalHeight;
      const faceCenterX_px = (face.faceX / 100) * naturalWidth;

      const objY = computeObjectPositionY(
        naturalWidth, naturalHeight, containerW, containerH,
        faceCenterY_px, targetFaceY
      );

      const scaleX = containerW / naturalWidth;
      const overflowX = naturalWidth * scaleX - containerW;
      const objX = overflowX > 0
        ? Math.max(0, Math.min(100, ((faceCenterX_px * scaleX - containerW * 0.5) / overflowX) * 100))
        : 50;

      setObjectPosition(`${objX.toFixed(1)}% ${objY.toFixed(1)}%`);
      // Anchor zoom transform to the face position in the card
      setTransformOrigin(`${objX.toFixed(1)}% ${(targetFaceY * 100).toFixed(1)}%`);
      setZoom(faceZoom);
    } catch (err) {
      console.warn('SmartCropImage: position calc failed, using default', err);
    } finally {
      setIsLoading(false);
    }
  }, [src]);

  useEffect(() => {
    setIsLoading(true);
    setObjectPosition('50% 5%');
    setZoom(1);
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      calculateObjectPosition();
    }
  }, [src, calculateObjectPosition]);

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden bg-gray-100 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-linear-to-br from-gray-200 to-gray-300 animate-pulse z-10" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={calculateObjectPosition}
        className="w-full h-full object-cover transition-[object-position,transform] duration-500 ease-out"
        style={{
          objectPosition,
          transform: `scale(${zoom})`,
          transformOrigin,
        }}
      />
    </div>
  );
}
