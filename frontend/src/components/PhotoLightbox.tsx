'use client';

import { useState } from 'react';
import Image from 'next/image';

interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  category: 'all' | 'matches' | 'training' | 'community';
  title: string;
  description?: string;
  thumbnail: string;
  date: string;
  youtubeId?: string;
  youtubeUrl?: string;
  drivePhotoUrl?: string;
  imageLink?: string;
  webContentLink?: string;
}

interface LightboxProps {
  isOpen: boolean;
  photo: GalleryItem | null;
  onClose: () => void;
  filteredItems: GalleryItem[];
  onPhotoChange: (photo: GalleryItem | null) => void;
  language: string;
  text: Record<string, any>;
}

export function PhotoLightbox({ isOpen, photo, onClose, filteredItems, onPhotoChange, language, text }: LightboxProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!isOpen || !photo) return null;

  // Debug log to check all available photo URLs and their values
  console.log('Photo object:', photo);
  
  // Detailed URL logging
  const urls = {
    imageLink: photo.imageLink,
    webContentLink: photo.webContentLink,
    drivePhotoUrl: photo.drivePhotoUrl,
    thumbnail: photo.thumbnail
  };
  
  console.log('Available URLs:');
  Object.entries(urls).forEach(([key, value]) => {
    console.log(`${key}:`, value || 'not available');
  });

  const currentIndex = filteredItems.findIndex(item => item.id === photo.id);
  const photoItems = filteredItems.filter(item => item.type === 'image');
  const currentPhotoIndex = photoItems.findIndex(item => item.id === photo.id);

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPhotoIndex > 0) {
      const prevPhoto = photoItems[currentPhotoIndex - 1];
      onPhotoChange(prevPhoto);
      setIsLoading(true);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPhotoIndex < photoItems.length - 1) {
      const nextPhoto = photoItems[currentPhotoIndex + 1];
      onPhotoChange(nextPhoto);
      setIsLoading(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="fixed inset-0" style={{ backgroundColor: '#000000' }}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white p-2"
          aria-label="Close photo"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-2 border-blue-500/30 rounded-full animate-spin border-t-blue-500" />
          </div>
        )}

        {/* Image container */}
        <div className="h-screen w-screen flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4 lg:p-8">
            <div className="relative">
              {/* Main image - initially hidden */}
              <img
                key={photo.id} // Force re-render on photo change
                src={photo.thumbnailLink}
                alt={photo.title}
                className="max-w-full max-h-full h-auto w-auto object-contain"
                onLoad={() => {
                  console.log('Image loaded successfully with thumbnailLink');
                  setIsLoading(false);
                }}
                onError={() => {
                  console.log('Thumbnail failed, trying imageLink');
                  const img = document.createElement('img');
                  img.src = photo.imageLink || '';
                  img.onload = () => {
                    console.log('imageLink loaded successfully');
                    const mainImg = document.querySelector('[data-main-image]') as HTMLImageElement;
                    if (mainImg) {
                      mainImg.src = photo.imageLink || '';
                      setIsLoading(false);
                    }
                  };
                  img.onerror = () => {
                    console.log('imageLink failed, trying webContentLink');
                    if (photo.webContentLink) {
                      const mainImg = document.querySelector('[data-main-image]') as HTMLImageElement;
                      if (mainImg) {
                        mainImg.src = photo.webContentLink;
                        setIsLoading(false);
                      }
                    } else {
                      setIsLoading(false);
                    }
                  };
                }}
                data-main-image
                style={{ 
                  display: isLoading ? 'none' : 'block',
                  maxHeight: '90vh'
                }}
              />

              {/* Thumbnail version as placeholder */}
              {isLoading && photo.thumbnail && (
                <img
                  src={photo.thumbnail}
                  alt={photo.title}
                  className="max-w-full max-h-full h-auto w-auto object-contain opacity-50 filter blur-sm"
                  style={{ maxHeight: '90vh' }}
                />
              )}
            </div>

            {/* Info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex justify-between items-center text-white">
                <span className="font-medium truncate pr-4">{photo.title}</span>
                {photo.drivePhotoUrl && (
                  <a
                    href={photo.drivePhotoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {text[language === 'en' ? 'en' : 'id'].viewFullSize}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        {currentPhotoIndex > 0 && (
          <button
            className="absolute left-4 top-[50%] transform -translate-y-1/2 text-white p-2 opacity-75 hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm rounded-full hover:bg-black/40"
            onClick={handlePrevious}
            aria-label="Previous photo"
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {currentPhotoIndex < photoItems.length - 1 && (
          <button
            className="absolute right-4 top-[50%] transform -translate-y-1/2 text-white p-2 opacity-75 hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm rounded-full hover:bg-black/40"
            onClick={handleNext}
            aria-label="Next photo"
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}