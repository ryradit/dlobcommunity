'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, X, Download, ZoomIn } from 'lucide-react';
import { AnimatedMarqueeHero } from '@/components/AnimatedMarqueeHero';
import { getMemberImageUrl } from '@/lib/membersStorage';

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

  const filteredItems = getFilteredItems();

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      {/* Hero Section with Animated Marquee */}
      <AnimatedMarqueeHero
        tagline="Galeri DLOB"
        title="Koleksi Momen Terbaik DLOB"
        description="Saksikan momen-momen terbaik dari pertandingan, latihan, dan sparring badminton komunitas DLOB. Setiap foto dan video menceritakan kisah dedikasi dan semangat para pemain."
        ctaText="Jelajahi Galeri"
        images={[
          'abdul.jpg',
          'adi.jpg',
          'adit.jpg',
          'alex.jpg',
          'anthony.jpg',
          'ardo.jpg',
          'aren.jpg',
          'arifin.jpg',
          'bagas.jpg',
          'bibit.jpg',
          'danif.jpg',
          'dedi.jpg',
          'dimas.jpg',
          'dinda.jpg',
          'edi.jpg',
          'eka.jpg',
          'fanis.jpg',
          'ganex.jpg',
          'gavin.jpg',
          'hendi.jpg',
          'herdan.jpg',
          'herry.jpg',
          'iyan.jpg',
          'jonathan.jpg',
          'kiki.jpg',
          'lorenzo.jpg',
          'mario.jpg',
          'murdi.jpg',
          'northon.jpg',
          'rara.jpg',
          'reyza.jpg',
          'tian2.jpg',
          'uti.jpg',
          'wahyu.jpg',
          'wien.jpg',
          'wiwin.jpg',
          'yaya.jpg',
          'yogie.jpg',
          'zaka.jpg',
        ].map(getMemberImageUrl)}
      />

      {/* Tabs Section */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-full border border-gray-200">
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
                  setSemuaPage(1);
                  setPertandinganPage(1);
                  setLatihanPage(1);
                  setSparringPage(1);
                }}
                className={`px-6 py-2.5 text-xs sm:text-sm font-bold rounded-full transition-all duration-200 ${
                  activeTab === tab.value
                    ? 'bg-zinc-950 text-white shadow-md'
                    : 'text-slate-600 hover:text-zinc-950 hover:bg-white/80'
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
          {/* Gallery Grid */}
          {(
            <>
              {loading && activeTab === 'pertandingan' ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-950 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Memuat video...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Belum ada konten untuk tab ini</p>
                </div>
              ) : (
                <>
                  {/* Mobile Grid Toggle - Only visible on mobile */}
                  <div className="md:hidden flex justify-end mb-6 gap-2">
                    <button
                      onClick={() => setMobileGridCols(1)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                        mobileGridCols === 1
                          ? 'bg-zinc-950 text-white shadow-lg'
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
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                        mobileGridCols === 2
                          ? 'bg-zinc-950 text-white shadow-lg'
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
                      className="group rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer bg-white border border-gray-100 hover:border-[#4382C8]/30"
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
                      {/* Image/Thumbnail Container */}
                      <div className="relative bg-slate-100 h-64 flex items-center justify-center text-6xl overflow-hidden">
                        {item.type === 'image' ? (
                          <>
                            <img 
                              src={item.thumbnail} 
                              alt={item.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onLoad={() => {
                                console.log('✓ Image loaded:', item.title, item.id);
                              }}
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                if (!img.src.includes('thumbnail')) {
                                  img.src = `https://drive.google.com/thumbnail?id=${item.id}&sz=w400`;
                                } else if (!img.src.includes('export=download')) {
                                  img.src = `https://drive.google.com/uc?export=download&id=${item.id}`;
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                          </>
                        ) : (
                          <>
                            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 group-hover:scale-110 transition-transform">
                                <Play className="w-6 h-6 text-zinc-950 fill-zinc-950" />
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Title & Badge */}
                      <div className="p-5 flex items-center justify-between gap-3">
                        <h3 className="font-bold text-sm text-gray-900 group-hover:text-[#4382C8] transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#4382C8]/10 text-[#4382C8]">
                          {item.type === 'video' ? 'Video' : 'Foto'}
                        </span>
                      </div>
                    </div>
                  ))}
                  </div>

                  {/* Pagination for all tabs with more than 50 items */}
                  {getTotalPages() > 1 && (
                    <div className="mt-12 flex flex-col items-center gap-6">
                      <div className="flex flex-wrap justify-center items-center gap-2">
                        {/* Previous Button */}
                        <button
                          onClick={() => handlePageChange(getCurrentPage() - 1)}
                          disabled={getCurrentPage() === 1}
                          className="px-5 py-2.5 rounded-full border border-gray-300 hover:border-zinc-900 hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
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
                              className={`w-10 h-10 rounded-full transition-all flex items-center justify-center text-sm font-medium ${
                                pageNum === currentPage
                                  ? 'bg-zinc-950 text-white font-bold shadow-md scale-105'
                                  : 'border border-gray-300 hover:border-zinc-900 hover:bg-zinc-100'
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
                          className="px-5 py-2.5 rounded-full border border-gray-300 hover:border-zinc-900 hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
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
          <div className="bg-zinc-100 border border-zinc-200 rounded-xl p-6">
            <p className="text-sm text-zinc-800">
              ℹ️ Tab Latihan dan Sparring menampilkan foto dari Google Drive secara real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedImage(null);
            setModalImageLoading(false);
          }}
        >
          <div 
            className="relative w-full max-w-5xl max-h-[90vh] bg-black rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedImage(null);
                setModalImageLoading(false);
              }}
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image Container with Loading Spinner */}
            <div className="flex-1 flex items-center justify-center min-h-0 overflow-auto relative">
              {/* Thumbnail Blur Background (shows while loading) */}
              <img 
                src={selectedImage.thumbnail}
                alt={selectedImage.title}
                className="absolute inset-0 w-full h-full object-contain blur-sm opacity-30 pointer-events-none"
              />
              
              {/* Loading Spinner */}
              {modalImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              )}

              {/* Full Resolution Image */}
              <img 
                src={`https://drive.google.com/uc?export=view&id=${selectedImage.id}`}
                alt={selectedImage.title}
                className="w-full h-auto max-h-full object-contain relative z-10"
                onLoadStart={() => setModalImageLoading(true)}
                onLoad={() => setModalImageLoading(false)}
                onError={(e) => {
                  console.warn('Modal image failed with export=view, trying alternative URL:', selectedImage.id);
                  const img = e.target as HTMLImageElement;
                  
                  // Fallback strategy: try different sizes and formats
                  if (!img.src.includes('export=download')) {
                    // Try download export with medium size
                    img.src = `https://drive.google.com/uc?export=download&id=${selectedImage.id}`;
                    console.log('Trying export=download');
                  } else if (!img.src.includes('sz=w800')) {
                    // Try smaller size (800px) which might load faster
                    img.src = `https://drive.google.com/uc?export=view&id=${selectedImage.id}&sz=w800`;
                    console.log('Trying sz=w800');
                  } else if (!img.src.includes('sz=w400')) {
                    // Try even smaller size (400px)
                    img.src = `https://drive.google.com/uc?export=view&id=${selectedImage.id}&sz=w400`;
                    console.log('Trying sz=w400');
                  } else {
                    // Use thumbnail as final fallback
                    img.src = selectedImage.thumbnail;
                    console.warn('Using thumbnail as last resort fallback');
                  }
                  setModalImageLoading(false);
                }}
              />
            </div>

            {/* Download Button */}
            <a
              href={`https://drive.google.com/uc?export=download&id=${selectedImage.id}`}
              download={selectedImage.title}
              className="absolute bottom-4 left-4 flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-full shadow-lg transition-all z-10"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="w-4 h-4" />
              Download Foto
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
