'use client';

import React, { useState, useRef, useCallback } from 'react';
import SmartCropImage from '@/components/SmartCropImage';

interface ZoomableImageProps {
  src: string;
  alt: string;
  name: string;
  zoomFactor?: number; // default 3.5×
}

/**
 * E-commerce style magnifier.
 * - Main image rendered with SmartCropImage (Gemini face-centred)
 * - On hover: a lens overlay follows the cursor on the main image
 * - A separate zoom panel appears to the right showing the magnified region
 * - On mobile (touch only): tap to open a full-screen lightbox instead
 */
export default function ZoomableImage({
  src,
  alt,
  name,
  zoomFactor = 3.5,
}: ZoomableImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null); // 0-1 fractions
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const LENS_SIZE = 100; // px — side length of the lens square on the main image
  const PANEL_SIZE = 480; // px — side length of the zoom panel

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setPos({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => setPos(null), []);

  // Lens top-left so it doesn't overflow the container (in px relative to container)
  const lensLeft = pos
    ? Math.max(0, Math.min(
        (containerRef.current?.clientWidth ?? 0) - LENS_SIZE,
        pos.x * (containerRef.current?.clientWidth ?? 0) - LENS_SIZE / 2,
      ))
    : 0;
  const lensTop = pos
    ? Math.max(0, Math.min(
        (containerRef.current?.clientHeight ?? 0) - LENS_SIZE,
        pos.y * (containerRef.current?.clientHeight ?? 0) - LENS_SIZE / 2,
      ))
    : 0;

  // Actual lens center as fraction (accounting for clamping)
  const effectiveX = pos
    ? (lensLeft + LENS_SIZE / 2) / (containerRef.current?.clientWidth ?? 1)
    : 0;
  const effectiveY = pos
    ? (lensTop + LENS_SIZE / 2) / (containerRef.current?.clientHeight ?? 1)
    : 0;

  // background-position for the zoom panel (percentage = where the zoomed center is)
  const bgX = effectiveX * 100;
  const bgY = effectiveY * 100;

  return (
    <>
      {/* Main container */}
      <div className="relative select-none">
        {/* Main image */}
        <div
          ref={containerRef}
          className={`relative aspect-3/4 overflow-hidden bg-gray-100 ${pos ? 'cursor-crosshair' : 'cursor-zoom-in'}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => { if (!pos) setLightboxOpen(true); }}
        >
          <SmartCropImage src={src} alt={alt} name={name} />

          {/* Lens overlay */}
          {pos && (
            <div
              className="absolute border-2 border-white/80 shadow-lg pointer-events-none"
              style={{
                width: LENS_SIZE,
                height: LENS_SIZE,
                left: lensLeft,
                top: lensTop,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'brightness(1.1)',
              }}
            />
          )}

          {/* Hint label */}
          {!pos && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full pointer-events-none opacity-70">
              Arahkan kursor untuk zoom
            </div>
          )}
        </div>

        {/* Zoom panel — appears to the right of the image, anchored to top */}
        {pos && (
          <div
            className="hidden lg:block absolute top-0 left-[calc(100%+16px)] z-50 border border-gray-200 shadow-2xl bg-white overflow-hidden pointer-events-none"
            style={{ width: PANEL_SIZE, height: PANEL_SIZE }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${src})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${zoomFactor * 100}%`,
                backgroundPosition: `${bgX}% ${bgY}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Mobile lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-9999 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl font-light leading-none"
            onClick={() => setLightboxOpen(false)}
          >
            ×
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
