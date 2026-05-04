'use client';

import React, { useState, useRef } from 'react';
import { Search, Upload, X, Loader } from 'lucide-react';

interface FaceSearchResult {
  imageId: string;
  imageTitle: string;
  faceCount: number;
  similarityScore: number;
}

interface FaceSearchProps {
  onResults: (results: FaceSearchResult[]) => void;
}

export function FaceSearchComponent({ onResults }: FaceSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Auto-search when file is selected
    handleSearch(file);
  };

  const handleSearch = async (file: File) => {
    setIsSearching(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/face/search', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Search failed');
        setMessage(data.details);
        return;
      }

      setMessage(data.message);
      onResults(data.matchingImages || []);
    } catch (err) {
      setError('Failed to search for faces');
      console.error('Face search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
      >
        <Search className="w-4 h-4" />
        Find yourself
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Find yourself in photos</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Preview or Upload Area */}
            {preview ? (
              <div className="space-y-4">
                {/* Image Preview */}
                <div className="relative rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-80 object-cover"
                  />
                  <button
                    onClick={() => {
                      setPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 p-2 bg-white rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Status Messages */}
                {isSearching && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-sm text-blue-900">Searching for matching photos...</span>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm font-semibold text-red-900">{error}</p>
                    {message && <p className="text-xs text-red-700 mt-1">{message}</p>}
                  </div>
                )}

                {message && !error && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-900">{message}</p>
                  </div>
                )}

                {/* Retry Button */}
                <button
                  onClick={() => {
                    setPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors"
                >
                  Try another photo
                </button>
              </div>
            ) : (
              /* Upload Area */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-900 mb-1">Upload a photo of yourself</p>
                <p className="text-xs text-gray-600">JPG, PNG, or HEIC (max 10MB)</p>
              </div>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Close Button */}
            <button
              onClick={() => {
                setIsOpen(false);
                setPreview(null);
                setError(null);
                setMessage(null);
              }}
              className="w-full mt-6 py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-900 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
