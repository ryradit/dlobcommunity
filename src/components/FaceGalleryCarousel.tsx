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

// Component to render a single cropped face thumbnail
function FaceThumbnail({ face, isSelected, onSelect }: { 
  face: Face; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  // Calculate zoom level to show only the face area
  const faceWidth = Math.max(face.crop.right - face.crop.left, 0.01);
  const faceHeight = Math.max(face.crop.bottom - face.crop.top, 0.01);
  
  // Zoom factor to fill 112px container with just the face
  const zoom = Math.max(112 / (faceWidth * 1000), 112 / (faceHeight * 1000));
  
  // Calculate offset to center the face within the circle
  const offsetX = -(face.crop.left * 100);
  const offsetY = -(face.crop.top * 100);

  return (
    <button
      onClick={onSelect}
      className={`shrink-0 transition-all ${
        isSelected
          ? 'ring-4 ring-[#1e4843] scale-110'
          : 'hover:scale-105'
      }`}
      title={`Confidence: ${(face.confidence * 100).toFixed(0)}%`}
    >
      <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-gray-300 hover:border-[#1e4843] bg-gray-100 flex-shrink-0">
        {/* Display and crop face image to show only face area */}
        <img
          src={face.imageUrl}
          alt={`Face ${face.id}`}
          className="w-full h-full"
          style={{
            objectFit: 'cover',
            objectPosition: `${face.crop.left * 100}% ${face.crop.top * 100}%`,
          }}
          onError={(e) => {
            console.error('Failed to load face image:', face.imageUrl, face.id);
          }}
        />
        
        {/* Confidence Badge */}
        <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs rounded-full px-2 py-1 z-10 font-semibold">
          {Math.round(face.confidence * 100)}%
        </div>
      </div>
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
        console.log('✅ Faces fetched successfully:', {
          count: data.faces?.length,
          firstFace: data.faces?.[0] ? {
            id: data.faces[0].id,
            imageUrl: data.faces[0].imageUrl,
            confidence: (data.faces[0].confidence * 100).toFixed(0) + '%',
            crop: {
              left: data.faces[0].crop.left.toFixed(3),
              top: data.faces[0].crop.top.toFixed(3),
              right: data.faces[0].crop.right.toFixed(3),
              bottom: data.faces[0].crop.bottom.toFixed(3),
            }
          } : null
        });
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

    const scrollAmount = 300;
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : scrollPosition + scrollAmount;

    container.scrollLeft = newPosition;
    setScrollPosition(newPosition);
  };

  if (loading) {
    return (
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <p className="text-blue-700">Loading face detection data...</p>
        </div>
      </div>
    );
  }

  if (error || faces.length === 0) {
    return (
      <div className="mb-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-amber-800">
          {error 
            ? `Face detection unavailable: ${error} (still processing images)` 
            : 'Face carousel is being populated. Please refresh in a few minutes.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Temukan Diri Anda</h3>
        {selectedFaceId && (
          <button
            onClick={() => onFaceSelect('')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <X className="w-4 h-4" />
            Hapus Filter
          </button>
        )}
      </div>

      <div className="relative">
        {/* Left Arrow */}
        {scrollPosition > 0 && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Face Carousel */}
        <div
          id="face-carousel"
          className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
          style={{ scrollBehavior: 'smooth' }}
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
        {scrollPosition < faces.length * 120 && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500 mt-4">
        Klik pada wajah Anda untuk menemukan semua foto yang berisi wajah yang mirip
      </p>
    </div>
  );
}
