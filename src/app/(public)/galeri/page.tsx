'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, X, Download, ZoomIn } from 'lucide-react';
import { AnimatedMarqueeHero } from '@/components/AnimatedMarqueeHero';
import { FaceGalleryCarousel } from '@/components/FaceGalleryCarousel';

type TabType = 'semua' | 'pertandingan' | 'latihan' | 'sparring';

interface GalleryItem {
  id: string;
  title: string;
  thumbnail: string;
  type: 'image' | 'video';
  url: string;
  category: 'pertandingan' | 'latihan' | 'sparring';
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  embedUrl: string;
}

export default function GaleriPage() {
  const [activeTab, setActiveTab] = useState<TabType>('semua');
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [latihanImages, setLatihanImages] = useState<GalleryItem[]>([]);
  const [sparringImages, setSparringImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileGridCols, setMobileGridCols] = useState<1 | 2>(1);
  const [semuaPage, setSemuaPage] = useState(1);
  const [pertandinganPage, setPertandinganPage] = useState(1);
  const [latihanPage, setLatihanPage] = useState(1);
  const [sparringPage, setSparringPage] = useState(1);
  const [modalImageLoading, setModalImageLoading] = useState(false);
  const [faceSearchResults, setFaceSearchResults] = useState<string[]>([]);
  const [isFilteringByFace, setIsFilteringByFace] = useState(false);
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const itemsPerPage = 50;

  // Fetch YouTube videos from channel
  useEffect(() => {
    const fetchYoutubeVideos = async () => {
      try {
        const channelId = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;
        const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

        if (!channelId || !apiKey) {
          console.error('YouTube API credentials missing');
          return;
        }

        // First, get the uploads playlist ID
        const channelRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
        );
        const channelData = await channelRes.json();
        const uploadsPlaylistId =
          channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

        if (!uploadsPlaylistId) {
          console.error('Could not find uploads playlist');
          return;
        }

        // Get videos from the uploads playlist
        const videosRes = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=12&key=${apiKey}`
        );
        const videosData = await videosRes.json();

        const videos: YouTubeVideo[] = videosData.items?.map((item: any) => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.high.url,
          embedUrl: `https://www.youtube.com/embed/${item.snippet.resourceId.videoId}`,
        })) || [];

        setYoutubeVideos(videos);
      } catch (error) {
        console.error('Error fetching YouTube videos:', error);
      }
    };

    fetchYoutubeVideos();
  }, []);

  // Fetch Google Drive images
  useEffect(() => {
    const fetchGoogleDriveImages = async (folderId: string, category: 'latihan' | 'sparring') => {
      try {
        console.log(`🔄 Fetching ${category} images from folder: ${folderId}`);
        
        // Use server-side API route for proper authentication
        const response = await fetch(
          `/api/drive/images?folderId=${folderId}&category=${category}&limit=250`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API error: ${response.status} - ${errorData.error}`);
        }

        const data = await response.json();
        const images: GalleryItem[] = data.images || [];

        console.log(`✅ Fetched ${images.length} ${category} images`);

        if (category === 'latihan') {
          setLatihanImages(images);
        } else {
          setSparringImages(images);
        }
      } catch (error) {
        console.error(`❌ Error fetching ${category} images:`, error);
      }
    };

    const trainingFolderId = process.env.NEXT_PUBLIC_GDRIVE_TRAINING_FOLDER_ID;
    const sparringFolderId = process.env.NEXT_PUBLIC_GDRIVE_SPARRING_FOLDER_ID;

    if (trainingFolderId) {
      fetchGoogleDriveImages(trainingFolderId, 'latihan');
    }
    if (sparringFolderId) {
      fetchGoogleDriveImages(sparringFolderId, 'sparring');
    }

    setLoading(false);
  }, []);

  // Combine all gallery items
  const pertandinganItems: GalleryItem[] = youtubeVideos.map((video) => ({
    id: video.id,
    title: video.title,
    thumbnail: video.thumbnail,
    type: 'video',
    url: video.embedUrl,
    category: 'pertandingan',
  }));

  const allItems = [
    ...pertandinganItems,
    ...latihanImages,
    ...sparringImages,
  ];

  // Filter items based on active tab and apply pagination
  const getFilteredItems = () => {
    let items: GalleryItem[] = [];
    let currentPage = 1;

    switch (activeTab) {
      case 'semua':
        items = allItems;
        currentPage = semuaPage;
        break;
      case 'pertandingan':
        items = pertandinganItems;
        currentPage = pertandinganPage;
        break;
      case 'latihan':
        items = latihanImages;
        currentPage = latihanPage;
        break;
      case 'sparring':
        items = sparringImages;
        currentPage = sparringPage;
        break;
      default:
        items = allItems;
    }

    // Apply face search filter if active (works on all tabs, but most useful on latihan)
    if (isFilteringByFace && faceSearchResults.length > 0) {
      items = items.filter(item => faceSearchResults.includes(item.id));
      console.log(`🔍 Applied face filter: ${faceSearchResults.length} image results, Tab=${activeTab}`);
    }

    // Apply pagination to all tabs with 50 items per page
    if (items.length > 50) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      console.log(`📄 Pagination: Tab=${activeTab}, Page=${currentPage}, Total=${items.length}, Range=[${startIndex}-${endIndex}]`);
      
      return items.slice(startIndex, endIndex);
    }

    return items;
  };

  // Get total pages for current tab
  const getTotalPages = () => {
    switch (activeTab) {
      case 'semua':
        return Math.ceil(allItems.length / itemsPerPage);
      case 'pertandingan':
        return Math.ceil(pertandinganItems.length / itemsPerPage);
      case 'latihan':
        return Math.ceil(latihanImages.length / itemsPerPage);
      case 'sparring':
        return Math.ceil(sparringImages.length / itemsPerPage);
      default:
        return 1;
    }
  };

  // Get current page
  const getCurrentPage = () => {
    switch (activeTab) {
      case 'semua':
        return semuaPage;
      case 'pertandingan':
        return pertandinganPage;
      case 'latihan':
        return latihanPage;
      case 'sparring':
        return sparringPage;
      default:
        return 1;
    }
  };

  // Change page handler
  const handlePageChange = (newPage: number) => {
    console.log(`🔄 Page change: activeTab=${activeTab}, currentPage=${getCurrentPage()} → newPage=${newPage}`);
    
    switch (activeTab) {
      case 'semua':
        setSemuaPage(newPage);
        console.log(`✅ Set semuaPage to ${newPage}`);
        break;
      case 'pertandingan':
        setPertandinganPage(newPage);
        console.log(`✅ Set pertandinganPage to ${newPage}`);
        break;
      case 'latihan':
        setLatihanPage(newPage);
        console.log(`✅ Set latihanPage to ${newPage}`);
        break;
      case 'sparring':
        setSparringPage(newPage);
        console.log(`✅ Set sparringPage to ${newPage}`);
        break;
    }
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Initialize modal loading state when image is selected
  useEffect(() => {
    if (selectedImage) {
      console.log('📸 Modal opened for image:', {
        id: selectedImage.id,
        title: selectedImage.title,
        thumbnail: selectedImage.thumbnail,
        url: `https://drive.google.com/uc?export=view&id=${selectedImage.id}`,
      });
      setModalImageLoading(true);
    }
  }, [selectedImage]);

  const filteredItems = getFilteredItems();

  const handleFaceSelect = async (faceId: string) => {
    if (!faceId) {
      // Clear filter
      console.log('🧹 Clearing face filter');
      setFaceSearchResults([]);
      setIsFilteringByFace(false);
      setSelectedFaceId(null);
      return;
    }

    try {
      console.log(`🔍 Searching for faces similar to: ${faceId}`);
      
      // Use advanced ML embedding endpoint for better accuracy
      // Threshold adjusted for realistic matching with landmark-based features
      // 0.65 = Good balance between recall and precision
      const url = `/api/face/similar-advanced?faceId=${encodeURIComponent(faceId)}&threshold=0.65&topK=100`;
      console.log(`📡 Calling API: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API error:', error);
        
        // Fallback to old endpoint if advanced is not available
        console.warn('⚠️ Advanced endpoint not available, falling back to legacy endpoint');
        const fallbackResponse = await fetch(
          `/api/face/similar?faceId=${encodeURIComponent(faceId)}`
        );
        
        if (!fallbackResponse.ok) {
          const fallbackError = await fallbackResponse.json();
          alert(`❌ Gagal menemukan wajah serupa: ${fallbackError.error || 'Unknown error'}`);
          setFaceSearchResults([]);
          setIsFilteringByFace(false);
          return;
        }
        
        const fallbackData = await fallbackResponse.json();
        const imageIds = fallbackData.results.map((r: any) => r.imageId);
        console.log(`✅ Legacy endpoint found ${imageIds.length} similar images:`, imageIds);
        
        setFaceSearchResults(imageIds);
        setIsFilteringByFace(true);
        setSelectedFaceId(faceId);
        setLatihanPage(1);
        console.log(`✨ Applied face filter with ${imageIds.length} images`);
        return;
      }
      
      const data = await response.json();
      console.log('📊 API Response:', {
        success: data.success,
        totalMatches: data.results?.totalMatches,
        uniqueImages: data.results?.uniqueImages,
        imageCount: data.results?.images?.length
      });
      
      if (!data.success) {
        throw new Error(data.error || 'Pencarian gagal');
      }
      
      if (!data.results || !data.results.images) {
        console.warn('⚠️ API returned unexpected format');
        throw new Error('Format respons tidak valid');
      }
      
      const imageIds = data.results.images.map((img: any) => img.imageId);
      console.log(`✅ Found ${imageIds.length} similar images:`, imageIds);
      
      if (imageIds.length === 0) {
        // Check if API provided a hint
        const hint = data.debug?.hint || data.debug?.warning || '';
        const message = hint.includes('reprocessed') 
          ? `❌ Embeddings belum diproses. Silakan hubungi admin untuk memproses ulang wajah.\n\n${hint}`
          : `⚠️ Tidak ada gambar dengan wajah serupa ditemukan. Coba pilih wajah lain atau hubungi admin.`;
        
        alert(message);
        console.log('API hint:', hint);
        console.log('API debug info:', data.debug);
        
        setFaceSearchResults([]);
        setIsFilteringByFace(false);
        setSelectedFaceId(faceId);
        return;
      }
      
      setFaceSearchResults(imageIds);
      setIsFilteringByFace(true);
      setSelectedFaceId(faceId);
      setLatihanPage(1);  // Reset pagination to page 1 when filtering
      
      console.log(`✨ Applied face filter: ${imageIds.length} images, Quality: ${(data.results.sourceQuality * 100).toFixed(1)}%`);
    } catch (error) {
      console.error('❌ Error finding similar faces:', error);
      alert(`❌ Error finding similar faces: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setFaceSearchResults([]);
      setIsFilteringByFace(false);
      setSelectedFaceId(null);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      {/* Hero Section with Animated Marquee */}
      <AnimatedMarqueeHero
        tagline="Galeri DLOB"
        title="Koleksi Momen Terbaik DLOB"
        description="Saksikan momen-momen terbaik dari pertandingan, latihan, dan sparring badminton komunitas DLOB. Setiap foto dan video menceritakan kisah dedikasi dan semangat para pemain."
        ctaText="Jelajahi Galeri"
        images={[
          '/images/members/abdul.jpg',
          '/images/members/adi.jpg',
          '/images/members/adit.jpg',
          '/images/members/alex.jpg',
          '/images/members/anthony.jpg',
          '/images/members/ardo.jpg',
          '/images/members/aren.jpg',
          '/images/members/arifin.jpg',
          '/images/members/bagas.jpg',
          '/images/members/bibit.jpg',
          '/images/members/danif.jpg',
          '/images/members/dedi.jpg',
          '/images/members/dimas.jpg',
          '/images/members/dinda.jpg',
          '/images/members/edi.jpg',
          '/images/members/eka.jpg',
          '/images/members/fanis.jpg',
          '/images/members/ganex.jpg',
          '/images/members/gavin.jpg',
          '/images/members/hendi.jpg',
          '/images/members/herdan.jpg',
          '/images/members/herry.jpg',
          '/images/members/iyan.jpg',
          '/images/members/jonathan.jpg',
          '/images/members/kiki.jpg',
          '/images/members/lorenzo.jpg',
          '/images/members/mario.jpg',
          '/images/members/murdi.jpg',
          '/images/members/northon.jpg',
          '/images/members/rara.jpg',
          '/images/members/reyza.jpg',
          '/images/members/tian2.jpg',
          '/images/members/uti.jpg',
          '/images/members/wahyu.jpg',
          '/images/members/wien.jpg',
          '/images/members/wiwin.jpg',
          '/images/members/yaya.jpg',
          '/images/members/yogie.jpg',
          '/images/members/zaka.jpg',
        ]}
      />

      {/* Tabs Section */}
      <section className="py-12 bg-linear-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="flex flex-wrap gap-3 bg-gray-100 p-1.5 rounded-full">
            {[
              { label: 'Semua', value: 'semua' },
              { label: 'Pertandingan', value: 'pertandingan' },
              { label: 'Latihan', value: 'latihan' },
              { label: 'Sparring', value: 'sparring' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value as TabType);
                  setSelectedVideo(null);
                  // Reset pagination for all tabs when switching
                  setSemuaPage(1);
                  setPertandinganPage(1);
                  setLatihanPage(1);
                  setSparringPage(1);
                }}
                className={`px-6 py-2.5 font-semibold rounded-full transition-all ${
                  activeTab === tab.value
                    ? 'bg-[#1e4843] text-white shadow-lg'
                    : 'bg-transparent text-gray-700 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Face Gallery Carousel - Temporarily Disabled (pending implementation) */}
          {false && activeTab === 'latihan' && (
            <FaceGalleryCarousel 
              onFaceSelect={handleFaceSelect}
              selectedFaceId={selectedFaceId}
            />
          )}

          {/* Gallery Grid */}
          {(
            <>
              {loading && activeTab === 'pertandingan' ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e6461] mx-auto"></div>
                  <p className="text-gray-600 mt-4">Memuat video...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Belum ada konten untuk tab ini</p>
                </div>
              ) : (
                <>
                  {/* Filter Status Banner */}
                  {isFilteringByFace && faceSearchResults.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v8.586a1 1 0 01-1.414 1.414l-4-4A1 1 0 013 16.586v-5.172a1 1 0 00-.293-.707L.293 6.707A1 1 0 010 6V4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="font-semibold text-blue-900">
                            🔍 Hasil Pencarian: {faceSearchResults.length} gambar dengan wajah serupa
                          </p>
                          <p className="text-sm text-blue-700">
                            Menampilkan hanya gambar yang memiliki wajah mirip dengan yang Anda pilih
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFaceSelect('')}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                        title="Hapus filter dan tampilkan semua gambar"
                      >
                        <X className="w-4 h-4" />
                        Hapus Filter
                      </button>
                    </div>
                  )}

                  {/* Mobile Grid Toggle - Only visible on mobile */}
                  <div className="md:hidden flex justify-end mb-6 gap-2">
                    <button
                      onClick={() => setMobileGridCols(1)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        mobileGridCols === 1
                          ? 'bg-[#1e4843] text-white shadow-lg'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      title="Tampilkan 1 kolom"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <rect x="2" y="2" width="16" height="16" rx="2" ry="2" opacity="0.5" />
                      </svg>
                      1
                    </button>
                    <button
                      onClick={() => setMobileGridCols(2)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        mobileGridCols === 2
                          ? 'bg-[#1e4843] text-white shadow-lg'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      title="Tampilkan 2 kolom"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <rect x="2" y="2" width="7" height="16" rx="1" ry="1" opacity="0.5" />
                        <rect x="11" y="2" width="7" height="16" rx="1" ry="1" opacity="0.5" />
                      </svg>
                      2
                    </button>
                  </div>

                  {/* Gallery Grid */}
                  <div className={`grid ${mobileGridCols === 1 ? 'grid-cols-1' : 'grid-cols-2'} md:grid-cols-2 lg:grid-cols-3 gap-6`}>
                    {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="group rounded-2xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer bg-white border border-gray-200 hover:border-[#3e6461] relative"
                      onClick={() => {
                        if (item.type === 'video') {
                          setSelectedVideo({
                            id: item.id,
                            title: item.title,
                            thumbnail: item.thumbnail,
                            embedUrl: item.url,
                          });
                        } else if (item.type === 'image') {
                          setSelectedImage(item);
                        }
                      }}
                    >
                      {/* Download Button - Fixed top-right for images */}
                      {item.type === 'image' && (
                        <a
                          href={`https://drive.google.com/uc?export=download&id=${item.id}`}
                          download={item.title}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-3 right-3 z-20 flex items-center justify-center w-10 h-10 bg-[#1e4843] hover:bg-[#162f2c] text-white rounded-lg transition-all hover:scale-110 shadow-lg"
                          title="Download image"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      )}

                      {/* Image/Thumbnail Container */}
                      <div className="relative bg-gray-100 h-64 flex items-center justify-center text-6xl overflow-hidden group-hover:scale-110 transition-transform">
                        {item.type === 'image' ? (
                          <>
                            <img 
                              src={item.thumbnail} 
                              alt={item.title} 
                              className="w-full h-full object-cover"
                              onLoad={() => {
                                console.log('✓ Image loaded:', item.title, item.id);
                              }}
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                console.warn('✗ Image failed to load:', item.title, item.id, 'Current URL:', img.src);
                                
                                // First fallback: try the direct thumbnail API
                                if (!img.src.includes('thumbnail')) {
                                  img.src = `https://drive.google.com/thumbnail?id=${item.id}&sz=w400`;
                                } 
                                // Second fallback: try with different export format
                                else if (!img.src.includes('export=download')) {
                                  img.src = `https://drive.google.com/uc?export=download&id=${item.id}`;
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </>
                        ) : (
                          <>
                            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-8 h-8 text-[#3e6461] fill-[#3e6461]" />
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Title */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#3e6461] transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.type === 'video' ? '🎬 Video' : '📸 Foto'}
                        </p>
                      </div>
                    </div>
                  ))}
                  </div>

                  {/* Pagination for all tabs with more than 50 items */}
                  {getTotalPages() > 1 && (
                    <div className="mt-12 flex flex-col items-center gap-6">
                      <div className="flex flex-wrap justify-center gap-2">
                        {/* Previous Button */}
                        <button
                          onClick={() => handlePageChange(getCurrentPage() - 1)}
                          disabled={getCurrentPage() === 1}
                          className="px-4 py-2 rounded-lg border border-gray-300 hover:border-[#3e6461] hover:bg-[#3e6461]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          ← Sebelumnya
                        </button>

                        {/* Page Numbers */}
                        {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((pageNum) => {
                          // Show first page, last page, current page, and neighbors
                          const totalPages = getTotalPages();
                          const currentPage = getCurrentPage();
                          const isVisible = 
                            pageNum === 1 || 
                            pageNum === totalPages || 
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);

                          if (!isVisible) {
                            if ((pageNum === currentPage - 2 || pageNum === currentPage + 2) && pageNum > 1 && pageNum < totalPages) {
                              return (
                                <span key={pageNum} className="px-2 text-gray-400">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 rounded-lg transition-colors ${
                                pageNum === currentPage
                                  ? 'bg-[#1e4843] text-white font-semibold shadow-lg'
                                  : 'border border-gray-300 hover:border-[#3e6461] hover:bg-[#3e6461]/5'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        {/* Next Button */}
                        <button
                          onClick={() => handlePageChange(getCurrentPage() + 1)}
                          disabled={getCurrentPage() === getTotalPages()}
                          className="px-4 py-2 rounded-lg border border-gray-300 hover:border-[#3e6461] hover:bg-[#3e6461]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Selanjutnya →
                        </button>
                      </div>

                      {/* Page Info */}
                      <p className="text-sm text-gray-600">
                        Halaman {getCurrentPage()} dari {getTotalPages()} (Total: {
                          activeTab === 'semua' ? allItems.length :
                          activeTab === 'pertandingan' ? pertandinganItems.length :
                          activeTab === 'latihan' ? latihanImages.length :
                          sparringImages.length
                        } item)
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* Video Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div 
            className="relative max-w-6xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Video Container */}
            <div className="relative bg-black overflow-hidden rounded-2xl" style={{ aspectRatio: '16 / 9' }}>
              <iframe
                width="100%"
                height="100%"
                src={selectedVideo.embedUrl}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
              {/* Close Button */}
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note about Google Drive Integration */}
      <section className="py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#3e6461]/10 border border-[#3e6461]/20 rounded-xl p-6">
            <p className="text-sm text-[#2d4a47]">
              ℹ️ Tab Latihan dan Sparring menampilkan foto dari Google Drive secara real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Image Modal - Fresh Start */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative w-full max-w-5xl max-h-[90vh] bg-black rounded-2xl overflow-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-40 flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image Display Area */}
            <div className="flex-1 flex items-center justify-center bg-black p-4 min-h-64">
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Image - Using proxy URL for reliable loading */}
                {selectedImage.title.toLowerCase().endsWith('.heic') ? (
                  <div className="text-center">
                    <div className="text-white">
                      <p className="text-lg font-semibold mb-2">HEIC Format</p>
                      <p className="text-gray-300 text-sm">
                        Preview not available. Please download to view.
                      </p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.title}
                    className="max-w-full max-h-full object-contain"
                    onLoad={() => {
                      console.log('✅ Image loaded:', selectedImage.title);
                      setModalImageLoading(false);
                    }}
                    onError={(e) => {
                      console.error('❌ Image failed to load:', selectedImage.title, selectedImage.url);
                    }}
                  />
                )}
              </div>
            </div>

            {/* Footer with Actions */}
            <div className="flex items-center justify-between gap-4 p-4 bg-black/50 border-t border-white/10">
              <h3 className="text-white font-semibold truncate flex-1">
                {selectedImage.title}
              </h3>
              <a
                href={`/api/drive/image-proxy?id=${selectedImage.id}&download=true`}
                download={selectedImage.title}
                className="px-4 py-2 bg-[#1e4843] hover:bg-[#162f2c] text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

