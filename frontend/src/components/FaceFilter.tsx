'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { VisionApiService, CloudVisionFace } from '@/lib/services/vision-api.service';

interface FaceFilterProps {
  images: Array<{ url: string; id: string }>;
  onFilterChange: (filteredImageIds: string[]) => void;
  className?: string;
}

export default function FaceFilter({ images, onFilterChange, className = '' }: FaceFilterProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [faceGroups, setFaceGroups] = useState<Map<string, CloudVisionFace[]>>(new Map());
  const [selectedFace, setSelectedFace] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeFaceDetection();
  }, [images]);

  async function initializeFaceDetection() {
    try {
      setIsLoading(true);
      setError(null);

      const visionService = VisionApiService.getInstance();
      const groups = await visionService.processImages(images);
      setFaceGroups(groups);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Face detection initialization error:', error);
      setError('Failed to initialize face detection');
      setIsLoading(false);
    }
  }

  const handleFaceSelect = (groupId: string | null) => {
    setSelectedFace(groupId);
    if (groupId && faceGroups.has(groupId)) {
      const faces = faceGroups.get(groupId) || [];
      onFilterChange(faces.map(face => face.imageId));
    } else {
      onFilterChange([]); // Clear filter
    }
  };

  if (error) {
    return (
      <div className="text-red-500 text-sm p-2">
        {error}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-4 overflow-x-auto p-2">
        <button
          onClick={() => handleFaceSelect(null)}
          className={`shrink-0 px-3 py-1 rounded-full text-sm ${
            selectedFace === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          } transition-colors`}
        >
          All Photos
        </button>
        
        {Array.from(faceGroups.entries()).map(([groupId, faces]) => {
          const representativeFace = faces[0];
          return (
            <button
              key={groupId}
              onClick={() => handleFaceSelect(groupId)}
              className={`shrink-0 relative group ${
                selectedFace === groupId ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden relative">
                <Image
                  src={representativeFace.imageUrl}
                  alt="Face thumbnail"
                  fill
                  className="object-cover"
                  style={{
                    objectPosition: `${representativeFace.boundingBox.left}px ${representativeFace.boundingBox.top}px`
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {faces.length}
              </div>
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          <span className="ml-2 text-sm text-gray-600">
            Analyzing faces...
          </span>
        </div>
      )}
    </div>
  );
}