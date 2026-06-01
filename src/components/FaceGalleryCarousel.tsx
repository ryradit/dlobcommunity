'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Face {
  id: string;
  imageId: string;
  confidence: number;
  boundingBox: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  crop: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  imageUrl: string;
}

interface FaceGalleryCarouselProps {
  onFaceSelect: (faceId: string) => void;
  selectedFaceId?: string | null;
}

function FaceThumbnail({ face, isSelected, onSelect }: { 
  face: Face; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  // Calculate mathematically correct crop dimensions to scale image to container
  const cropWidth = Math.max(face.crop.right - face.crop.left, 0.01);
  const cropHeight = Math.max(face.crop.bottom - face.crop.top, 0.01);
  
  const bgSizeX = 100 / cropWidth;
  const bgSizeY = 100 / cropHeight;
  
  const bgPosX = cropWidth >= 1 ? 0 : (face.crop.left / (1 - cropWidth)) * 100;
  const bgPosY = cropHeight >= 1 ? 0 : (face.crop.top / (1 - cropHeight)) * 100;

  return (
    <button
      onClick={onSelect}
      className="shrink-0 transition-transform focus:outline-none"
      title={`Confidence: ${(face.confidence * 100).toFixed(0)}%`}
    >
      <div 
        className={`w-20 h-20 rounded-full border-2 transition-all duration-300 relative ${
          isSelected
            ? 'border-[#1e4843] scale-110 shadow-md ring-4 ring-[#1e4843]/15'
            : 'border-neutral-200 hover:border-neutral-400 hover:scale-105 shadow-xs'
        }`}
        style={{
          backgroundImage: `url(${face.imageUrl})`,
          backgroundSize: `${bgSizeX}% ${bgSizeY}%`,
          backgroundPosition: `${bgPosX}% ${bgPosY}%`,
          backgroundRepeat: 'no-repeat',
        }}
      />
    </button>
  );
}

export function FaceGalleryCarousel({ onFaceSelect, selectedFaceId }: FaceGalleryCarouselProps) {
  const [faces, setFaces] = useState<Face[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const fetchFaces = async () => {
      try {
        const response = await fetch('/api/face/gallery');
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch faces');
        }
        const data = await response.json();
        setFaces(data.faces || []);
        setError(null);
      } catch (err) {
        console.error('❌ Error fetching faces:', err);
        setError(err instanceof Error ? err.message : 'Failed to load faces');
      } finally {
        setLoading(false);
      }
    };

    fetchFaces();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('face-carousel');
    if (!container) return;

    const scrollAmount = 240;
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : scrollPosition + scrollAmount;

    container.scrollLeft = newPosition;
    setScrollPosition(newPosition);
  };

  if (loading) {
    return (
      <div className="p-6 bg-neutral-50/50 border border-neutral-200/50 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1e4843] border-t-transparent"></div>
          <p className="text-xs text-neutral-500 font-medium">Memuat data deteksi wajah...</p>
        </div>
      </div>
    );
  }

  if (error || faces.length === 0) {
    return (
      <div className="p-6 bg-neutral-50/50 border border-neutral-200/50 rounded-2xl">
        <p className="text-xs text-neutral-400 font-medium">
          {error 
            ? `Deteksi wajah tidak tersedia: ${error}` 
            : 'Belum ada data deteksi wajah yang tersedia. Silakan hubungi admin.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
            Temukan Foto Anda
          </h3>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Pilih avatar wajah di bawah ini untuk mencari dan menyaring foto Anda secara otomatis.
          </p>
        </div>
        {selectedFaceId && (
          <button
            onClick={() => onFaceSelect('')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 hover:border-neutral-300 text-neutral-600 hover:text-neutral-900 rounded-xl text-xs font-semibold transition-all hover:bg-neutral-50"
          >
            <X className="w-3.5 h-3.5" />
            Hapus Filter
          </button>
        )}
      </div>

      <div className="relative group/carousel">
        {/* Left Arrow */}
        {scrollPosition > 0 && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-neutral-100 rounded-full flex items-center justify-center shadow-md hover:bg-neutral-50 transition-colors focus:outline-none"
          >
            <ChevronLeft className="w-4 h-4 text-neutral-600" />
          </button>
        )}

        {/* Face Carousel */}
        <div
          id="face-carousel"
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar"
          style={{ scrollBehavior: 'smooth' }}
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            setScrollPosition(target.scrollLeft);
          }}
        >
          {faces.map((face) => (
            <FaceThumbnail
              key={face.id}
              face={face}
              isSelected={selectedFaceId === face.id}
              onSelect={() => onFaceSelect(face.id)}
            />
          ))}
        </div>

        {/* Right Arrow */}
        {faces.length * 96 > scrollPosition + 800 && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-neutral-100 rounded-full flex items-center justify-center shadow-md hover:bg-neutral-50 transition-colors focus:outline-none"
          >
            <ChevronRight className="w-4 h-4 text-neutral-600" />
          </button>
        )}
      </div>
    </div>
  );
}
