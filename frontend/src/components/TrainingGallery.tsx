import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { DrivePhoto } from '@/lib/google-drive';
import { Loader2, ZoomIn, Calendar } from 'lucide-react';

interface TrainingGalleryProps {
  photos: DrivePhoto[];
  isLoading?: boolean;
}

export default function TrainingGallery({ photos, isLoading = false }: TrainingGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<DrivePhoto | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!photos.length) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-gray-500">No training photos available</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden bg-gray-100 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.thumbnailLink || photo.imageLink || photo.webContentLink}
              alt={photo.name}
              className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Photo Modal */}
      <Dialog
        open={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-5xl w-full bg-white rounded-xl overflow-hidden">
            <div className="relative aspect-video">
              <img
                src={selectedPhoto?.imageLink || selectedPhoto?.webContentLink || ''}
                alt={selectedPhoto?.name || ''}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 bg-white">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {selectedPhoto ? formatDate(selectedPhoto.createdTime) : ''}
                </span>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}