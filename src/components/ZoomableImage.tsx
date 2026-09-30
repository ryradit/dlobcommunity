'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, ZoomIn, ZoomOut, X, RotateCcw, Search, Move } from 'lucide-react';
import SmartCropImage from '@/components/SmartCropImage';

interface ZoomableImageProps {
  src: string;
  alt: string;
  name: string;
  zoomFactor?: number; // default 3×
  objectPositionOverride?: string;
}

type ZoomMode = 'loupe' | 'inner' | 'side';

function getSafeImageUrl(url: string): string {
  if (!url) return '';
  try {
    return encodeURI(decodeURI(url));
  } catch {
    return encodeURI(url);
  }
}

export default function ZoomableImage({
  src,
  alt,
  name,
  zoomFactor = 3,
  objectPositionOverride,
}: ZoomableImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null); // fractions 0-1
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [sidePanelRect, setSidePanelRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('loupe');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxScale, setLightboxScale] = useState(1);
  const [lightboxOffset, setLightboxOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cleanSrc = getSafeImageUrl(src);
  const LOUPE_SIZE = 190; // Diameter of circular loupe (px)

  // Track cursor position and update container metrics
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setPos({ x, y });
    setContainerSize({ width: rect.width, height: rect.height });

    // Calculate fixed side panel position (outside any parent overflow-hidden)
    if (rect.right + 420 <= window.innerWidth) {
      setSidePanelRect({
        top: Math.max(16, rect.top),
        left: rect.right + 16,
        width: Math.min(rect.width, 460),
        height: Math.min(rect.height, 460),
      });
    } else {
      // Fallback to loupe if screen is too narrow for side panel
      setSidePanelRect(null);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setPos(null);
  }, []);

  // Compute Loupe position clamped inside container
  const clientW = containerSize.width || 400;
  const clientH = containerSize.height || 500;
  const mouseX = pos ? pos.x * clientW : 0;
  const mouseY = pos ? pos.y * clientH : 0;

  const loupeLeft = Math.max(0, Math.min(clientW - LOUPE_SIZE, mouseX - LOUPE_SIZE / 2));
  const loupeTop = Math.max(0, Math.min(clientH - LOUPE_SIZE, mouseY - LOUPE_SIZE / 2));

  // Background position for loupe (centers pixel under mouse)
  const bgWidth = clientW * zoomFactor;
  const bgHeight = clientH * zoomFactor;
  const bgPosX = -(mouseX * zoomFactor) + LOUPE_SIZE / 2;
  const bgPosY = -(mouseY * zoomFactor) + LOUPE_SIZE / 2;

  // Handle keyboard events for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === '+' || e.key === '=') setLightboxScale((s) => Math.min(4, s + 0.5));
      if (e.key === '-') setLightboxScale((s) => Math.max(1, s - 0.5));
      if (e.key === '0') {
        setLightboxScale(1);
        setLightboxOffset({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  // Lightbox drag handlers
  const handleLightboxMouseDown = (e: React.MouseEvent) => {
    if (lightboxScale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - lightboxOffset.x, y: e.clientY - lightboxOffset.y });
    }
  };

  const handleLightboxMouseMove = (e: React.MouseEvent) => {
    if (isDragging && lightboxScale > 1) {
      setLightboxOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleLightboxMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <>
      <div className="relative select-none group/zoom">
        {/* Main image container */}
        <div
          ref={containerRef}
          className={`relative aspect-3/4 overflow-hidden bg-gray-100 ${
            pos ? (zoomMode === 'inner' ? 'cursor-zoom-in' : 'cursor-crosshair') : 'cursor-pointer'
          }`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => {
            setLightboxScale(1);
            setLightboxOffset({ x: 0, y: 0 });
            setLightboxOpen(true);
          }}
        >
          {/* Base Image with optional inner zoom transform */}
          <div
            className="w-full h-full transition-transform duration-75"
            style={
              zoomMode === 'inner' && pos
                ? {
                    transform: `scale(${zoomFactor})`,
                    transformOrigin: `${pos.x * 100}% ${pos.y * 100}%`,
                  }
                : undefined
            }
          >
            <SmartCropImage
              src={src}
              alt={alt}
              name={name}
              objectPositionOverride={objectPositionOverride}
            />
          </div>

          {/* 1. LOUPE MODE: Floating Circular Magnifying Glass */}
          {zoomMode === 'loupe' && pos && (
            <div
              className="absolute pointer-events-none rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.45)] border-3 border-white ring-1 ring-black/20 overflow-hidden z-30"
              style={{
                width: LOUPE_SIZE,
                height: LOUPE_SIZE,
                left: loupeLeft,
                top: loupeTop,
                backgroundImage: `url("${cleanSrc}")`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${bgWidth}px ${bgHeight}px`,
                backgroundPosition: `${bgPosX}px ${bgPosY}px`,
              }}
            >
              {/* Precision center reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-4 h-4 rounded-full border border-white/60 bg-black/10 backdrop-blur-2xs" />
              </div>
            </div>
          )}

          {/* 2. SIDE PANEL MODE: Indicator lens square on the image */}
          {zoomMode === 'side' && pos && (
            <div
              className="absolute border-2 border-white/90 bg-white/20 backdrop-blur-2xs shadow-md pointer-events-none z-20"
              style={{
                width: 110,
                height: 110,
                left: Math.max(0, Math.min(clientW - 110, mouseX - 55)),
                top: Math.max(0, Math.min(clientH - 110, mouseY - 55)),
              }}
            />
          )}

          {/* Mode Switcher Pill (Top Right, glassmorphism) */}
          <div
            className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/20 opacity-90 hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              title="Kaca Pembesar (Loupe)"
              onClick={() => setZoomMode('loupe')}
              className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                zoomMode === 'loupe' ? 'bg-white text-black shadow-xs' : 'text-zinc-300 hover:text-white'
              }`}
            >
              <Search className="w-3 h-3" />
              <span className="hidden sm:inline">Loupe</span>
            </button>
            <button
              type="button"
              title="Perbesar Penuh (Inner Zoom)"
              onClick={() => setZoomMode('inner')}
              className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                zoomMode === 'inner' ? 'bg-white text-black shadow-xs' : 'text-zinc-300 hover:text-white'
              }`}
            >
              <ZoomIn className="w-3 h-3" />
              <span className="hidden sm:inline">Inner</span>
            </button>
            <button
              type="button"
              title="Panel Samping (Side Flyout)"
              onClick={() => setZoomMode('side')}
              className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                zoomMode === 'side' ? 'bg-white text-black shadow-xs' : 'text-zinc-300 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Side</span>
            </button>
            <button
              type="button"
              title="Layar Penuh (Lightbox)"
              onClick={() => {
                setLightboxScale(1);
                setLightboxOffset({ x: 0, y: 0 });
                setLightboxOpen(true);
              }}
              className="p-1 rounded-full text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* Bottom helper hint */}
          {!pos && (
            <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
              <div className="bg-black/65 backdrop-blur-md text-white text-[11px] font-medium px-3.5 py-1 rounded-full shadow-lg border border-white/10 flex items-center gap-1.5 opacity-80 group-hover/zoom:opacity-100 transition-opacity">
                <Search className="w-3 h-3 text-amber-400" />
                <span>Arahkan kursor untuk zoom · Klik untuk layar penuh</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. SIDE PANEL PORTAL: Rendered into document.body to bypass parent overflow-hidden */}
        {zoomMode === 'side' && pos && sidePanelRect && mounted && typeof document !== 'undefined' && createPortal(
          <div
            className="fixed z-9999 rounded-3xl border-2 border-gray-200 shadow-2xl bg-white overflow-hidden pointer-events-none hidden lg:block animate-in fade-in zoom-in-95 duration-150"
            style={{
              top: sidePanelRect.top,
              left: sidePanelRect.left,
              width: sidePanelRect.width,
              height: sidePanelRect.height,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url("${cleanSrc}")`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${bgWidth}px ${bgHeight}px`,
                backgroundPosition: `${-(mouseX * zoomFactor) + sidePanelRect.width / 2}px ${-(mouseY * zoomFactor) + sidePanelRect.height / 2}px`,
              }}
            />
            <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
              {zoomFactor}× Zoom
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* ── FULLSCREEN HIGH-RES LIGHTBOX MODAL ── */}
      {lightboxOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-99999 bg-black/92 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div
            className="w-full flex items-center justify-between text-white max-w-7xl z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-bold text-sm sm:text-base tracking-wide">{name}</h3>
              <p className="text-xs text-zinc-400">{alt}</p>
            </div>

            {/* Lightbox Controls */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              <button
                type="button"
                onClick={() => setLightboxScale((s) => Math.max(1, s - 0.5))}
                disabled={lightboxScale <= 1}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30 cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold w-12 text-center">
                {Math.round(lightboxScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setLightboxScale((s) => Math.min(4, s + 0.5))}
                disabled={lightboxScale >= 4}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30 cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setLightboxScale(1);
                  setLightboxOffset({ x: 0, y: 0 });
                }}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-zinc-300 hover:text-white"
                title="Reset (0)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-white/20 mx-1" />
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Viewport */}
          <div
            className="flex-1 w-full flex items-center justify-center overflow-hidden my-4 relative"
            onMouseDown={handleLightboxMouseDown}
            onMouseMove={handleLightboxMouseMove}
            onMouseUp={handleLightboxMouseUp}
            onMouseLeave={handleLightboxMouseUp}
            style={{ cursor: lightboxScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={cleanSrc}
              alt={alt}
              draggable={false}
              className="max-h-[82vh] max-w-full object-contain rounded-xl transition-transform duration-75 shadow-2xl"
              style={{
                transform: `scale(${lightboxScale}) translate(${lightboxOffset.x / lightboxScale}px, ${lightboxOffset.y / lightboxScale}px)`,
              }}
            />
          </div>

          {/* Bottom info helper */}
          <div className="text-zinc-400 text-xs flex items-center gap-2 z-10 pointer-events-none">
            {lightboxScale > 1 ? (
              <span className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-full border border-white/10">
                <Move className="w-3.5 h-3.5 text-blue-400" />
                Klik & geser untuk menggeser gambar
              </span>
            ) : (
              <span>Gunakan tombol zoom (+) atau klik ganda untuk memperbesar detail kain</span>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
