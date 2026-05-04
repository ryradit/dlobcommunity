'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, HardDrive, Zap } from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  thumbnail: string;
  type: 'image' | 'video';
  url: string;
  category: 'latihan';
}

interface TestResult {
  id: string;
  title: string;
  imageSize: number | null;
  optimizedLoadTime: number | null;
  originalLoadTime: number | null;
  needsOptimization: boolean;
}

export default function TestImageOptimizationPage() {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  // Fetch images from training folder
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        // Fetch more images to find heavy ones (>5MB)
        const response = await fetch(
          `/api/drive/images?folderId=${process.env.NEXT_PUBLIC_GDRIVE_TRAINING_FOLDER_ID}&category=latihan&limit=100`
        );

        if (!response.ok) throw new Error('Failed to fetch images');

        const data = await response.json();
        // We'll filter for >5MB once we get file sizes
        const allTrainingImages = data.images || [];

        console.log(`✅ Loaded ${allTrainingImages.length} training images for scanning`);
        setImages(allTrainingImages);

        // Initialize test results for all images
        const initialResults: TestResult[] = allTrainingImages.map((img: GalleryItem) => ({
          id: img.id,
          title: img.title,
          imageSize: null,
          optimizedLoadTime: null,
          originalLoadTime: null,
          needsOptimization: false,
        }));
        setTestResults(initialResults);
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  // Test image loading performance
  const testImageLoadTime = async (
    url: string,
    isOptimized: boolean
  ): Promise<number> => {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const img = new Image();

      img.onload = () => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        console.log(
          `✅ Image loaded (${isOptimized ? 'optimized' : 'original'}): ${loadTime.toFixed(0)}ms`
        );
        resolve(loadTime);
      };

      img.onerror = () => {
        console.warn(`⚠️ Failed to load image`);
        resolve(-1);
      };

      // Set a timeout to prevent hanging
      setTimeout(() => {
        resolve(-1);
      }, 30000);

      img.src = url;
    });
  };

  // Get image file size from Google Drive
  const getImageSize = async (fileId: string): Promise<number | null> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;
      if (!apiKey) return null;

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=size&key=${apiKey}`
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.size ? parseInt(data.size) : null;
    } catch (error) {
      console.error('Error getting image size:', error);
      return null;
    }
  };

  // Run all tests
  const runTests = async () => {
    setTesting(true);
    console.log('🚀 Starting heavy image optimization tests (>5MB only)...');

    // First pass: Get all file sizes
    console.log('📊 PHASE 1: Scanning image sizes...');
    const sizesMap = new Map<string, number>();
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const imageSize = await getImageSize(img.id);
      if (imageSize) {
        sizesMap.set(img.id, imageSize);
      }
      // Small delay between API calls
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Filter to only images >5MB (5242880 bytes)
    const heavyImages = images.filter((img) => {
      const sizeMB = (sizesMap.get(img.id) || 0) / (1024 * 1024);
      return sizeMB > 5;
    });

    console.log(`📈 Found ${heavyImages.length} heavy images (>5MB) out of ${images.length} total`);
    
    if (heavyImages.length === 0) {
      alert('⚠️ No images larger than 5MB found in training folder. All images are optimized!');
      setTesting(false);
      return;
    }

    // Second pass: Test optimization on heavy images only
    console.log('⚡ PHASE 2: Testing optimization on heavy images...');
    const results: TestResult[] = [];

    for (let i = 0; i < heavyImages.length; i++) {
      const img = heavyImages[i];
      const sizeInMB = (sizesMap.get(img.id) || 0) / (1024 * 1024);
      
      console.log(`\n🎯 Testing heavy image ${i + 1}/${heavyImages.length}: ${img.title} (${sizeInMB.toFixed(2)}MB)`);

      // Test original image loading
      const originalUrl = `/api/drive/image-proxy?id=${img.id}`;
      const originalLoadTime = await testImageLoadTime(originalUrl, false);

      // Wait a bit between tests
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Test optimized image loading (400px for grid)
      const optimizedUrl = `/api/drive/image-proxy?id=${img.id}&size=400`;
      const optimizedLoadTime = await testImageLoadTime(optimizedUrl, true);

      // Wait a bit between tests
      await new Promise((resolve) => setTimeout(resolve, 500));

      results.push({
        id: img.id,
        title: img.title,
        imageSize: sizeInMB,
        originalLoadTime: originalLoadTime > 0 ? originalLoadTime : null,
        optimizedLoadTime: optimizedLoadTime > 0 ? optimizedLoadTime : null,
        needsOptimization: sizeInMB > 5,
      });

      setTestResults([...results]);
    }

    setTesting(false);
    console.log(`✅ Heavy image optimization tests completed! Tested ${results.length} images`);
  };

  // Filter results
  const filteredResults = testResults.filter((result) => {
    // Only show images that are >5MB or have test results
    return result.needsOptimization || result.imageSize === null;
  });

  // Calculate stats for heavy images only
  const heavyImages = testResults.filter((r) => r.needsOptimization);
  const stats = {
    total: testResults.length,
    heavyImages: heavyImages.length,
    avgOriginalTime:
      heavyImages
        .filter((r) => r.originalLoadTime && r.originalLoadTime > 0)
        .reduce((sum, r) => sum + (r.originalLoadTime || 0), 0) /
        Math.max(
          heavyImages.filter((r) => r.originalLoadTime && r.originalLoadTime > 0).length,
          1
        ) || 0,
    avgOptimizedTime:
      heavyImages
        .filter((r) => r.optimizedLoadTime && r.optimizedLoadTime > 0)
        .reduce((sum, r) => sum + (r.optimizedLoadTime || 0), 0) /
        Math.max(
          heavyImages.filter((r) => r.optimizedLoadTime && r.optimizedLoadTime > 0).length,
          1
        ) || 0,
  };

  const improvement =
    stats.avgOriginalTime > 0
      ? (
          ((stats.avgOriginalTime - stats.avgOptimizedTime) / stats.avgOriginalTime) *
          100
        ).toFixed(1)
      : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">⚡ Heavy Image Optimization Test</h1>
          <p className="text-gray-600">
            Testing and optimizing images larger than 5MB from training folder (these cause heavy load in galeri page)
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="inline-block animate-spin">
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
            <p className="mt-4 text-gray-600">Scanning training folder for images larger than 5MB...</p>
          </div>
        ) : (
          <>
            {/* Test Controls */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">⚡ Heavy Image Optimization</h2>
                  <p className="text-gray-600">
                    Testing images larger than 5MB from training folder ({images.length} total, {testResults.filter(r => r.needsOptimization).length} heavy images)
                  </p>
                </div>
                <button
                  onClick={runTests}
                  disabled={testing}
                  className="px-8 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  {testing ? 'Running Tests...' : 'Start Heavy Image Tests'}
                </button>
              </div>
            </div>

            {/* Stats Summary */}
            {testResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <HardDrive className="w-5 h-5" />
                    <span className="text-sm font-semibold">Heavy Images</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-600">{stats.heavyImages}</p>
                  <p className="text-sm text-gray-500 mt-1">Larger than 5MB</p>
                </div>

                <div className="bg-orange-50 rounded-lg shadow p-6 border-l-4 border-orange-500">
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">Total Scanned</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-600">{stats.total}</p>
                  <p className="text-sm text-orange-500 mt-1">from training folder</p>
                </div>

                <div className="bg-green-50 rounded-lg shadow p-6 border-l-4 border-green-500">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-semibold">Avg Original Load</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.avgOriginalTime.toFixed(0)}ms
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg shadow p-6 border-l-4 border-blue-500">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Zap className="w-5 h-5" />
                    <span className="text-sm font-semibold">Speedup</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{improvement}%</p>
                  <p className="text-sm text-blue-600 mt-1">
                    {(stats.avgOriginalTime - stats.avgOptimizedTime).toFixed(0)}ms saved
                  </p>
                </div>
              </div>
            )}

            {/* Results Grid */}
            {testResults.length > 0 && (
              <div className="space-y-8">
                {/* Grid View */}
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>
                  {filteredResults.map((result) => {
                    const speedup =
                      result.originalLoadTime && result.optimizedLoadTime
                        ? (
                            ((result.originalLoadTime - result.optimizedLoadTime) /
                              result.originalLoadTime) *
                            100
                          ).toFixed(1)
                        : 'N/A';

                    return (
                      <div
                        key={result.id}
                        className={`group rounded-2xl overflow-hidden hover:shadow-2xl transition-all bg-white border-2 border-orange-300 hover:border-orange-500`}
                      >
                        {/* Status Badge - Top Right */}
                        <div
                          className={`absolute top-3 right-3 z-20 px-3 py-1 rounded-full text-xs font-semibold transition-all bg-orange-100 text-orange-700`}
                        >
                          ⚠️ Heavy Load
                        </div>

                        {/* Image Preview Container */}
                        <div className="relative bg-gray-100 h-64 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                          {result.id && (
                            <>
                              <img
                                src={`/api/drive/image-proxy?id=${result.id}&size=400`}
                                alt={result.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.style.background = '#f3f4f6';
                                  const svg = document.createElement('div');
                                  svg.innerHTML =
                                    '<svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          {/* Title */}
                          <h3 className="font-semibold text-gray-900 group-hover:text-[#3e6461] transition-colors line-clamp-2 text-sm mb-3">
                            {result.title}
                          </h3>

                          {/* File Size */}
                          <div className="border-b border-gray-200 pb-3 mb-3">
                            <p className="text-xs text-gray-500 font-medium">File Size</p>
                            <p className="text-sm font-semibold text-gray-700">
                              {result.imageSize ? `${result.imageSize.toFixed(2)} MB` : 'Fetching...'}
                            </p>
                          </div>

                          {/* Load Times */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Original</p>
                              <p className="text-sm font-mono text-gray-600">
                                {result.originalLoadTime
                                  ? `${result.originalLoadTime.toFixed(0)}ms`
                                  : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Optimized</p>
                              <p className="text-sm font-mono font-semibold text-blue-600">
                                {result.optimizedLoadTime
                                  ? `${result.optimizedLoadTime.toFixed(0)}ms`
                                  : '-'}
                              </p>
                            </div>
                          </div>

                          {/* Speedup */}
                          {speedup !== 'N/A' && (
                            <div className="bg-green-50 rounded-lg p-2">
                              <p className="text-xs text-green-600 font-semibold text-center">
                                🚀 {speedup}% Faster
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* No results message */}
                {filteredResults.length === 0 && testResults.length > 0 && (
                  <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No matching images for current filter.</p>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {testResults.length === 0 && !loading && (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No test results yet. Click "Start Heavy Image Tests" to begin scanning and testing.</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
