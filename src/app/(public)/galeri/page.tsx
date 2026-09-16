'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, X, Download, ZoomIn } from 'lucide-react';
import { AnimatedMarqueeHero } from '@/components/AnimatedMarqueeHero';
import { getMemberImageUrl } from '@/lib/membersStorage';

type TabType = 'semua' | 'pertandingan' | 'latihan' | 'sparring';
type BranchFilter = 'all' | 'dlob' | 'dlbc';

interface GalleryItem {
  id: string;
  title: string;
  thumbnail: string;
  type: 'image' | 'video';
  url: string;
  category: 'pertandingan' | 'latihan' | 'sparring';
  branch?: 'dlob' | 'dlbc' | 'all';
  createdTime?: string;
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  embedUrl: string;
}

export default function GaleriPage() {
  const [activeTab, setActiveTab] = useState<TabType>('semua');
  const [selectedBranch, setSelectedBranch] = useState<BranchFilter>('all');
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [latihanImages, setLatihanImages] = useState<GalleryItem[]>([]);
  const [dlbcImages, setDlbcImages] = useState<GalleryItem[]>([]);
  const [sparringImages, setSparringImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileGridCols, setMobileGridCols] = useState<1 | 2>(1);
  const [semuaPage, setSemuaPage] = useState(1);
  const [pertandinganPage, setPertandinganPage] = useState(1);
  const [latihanPage, setLatihanPage] = useState(1);
  const [sparringPage, setSparringPage] = useState(1);
  const [modalImageLoading, setModalImageLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const itemsPerPage = 50;

  const handleDownloadImage = async (item: GalleryItem) => {
    if (!item) return;
    try {
      setIsDownloading(true);
      let response = await fetch(`https://lh3.googleusercontent.com/d/${item.id}=s0`);
      if (!response.ok) {
        response = await fetch(`/api/drive/proxy?id=${item.id}&sz=s0`);
      }
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${item.title || 'foto-galeri'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn('Direct blob download fallback to Google Drive export download:', err);
      window.open(`https://drive.google.com/uc?export=download&id=${item.id}`, '_blank', 'noopener,noreferrer');
    } finally {
      setIsDownloading(false);
    }
  };

  const resetPages = () => {
    setSemuaPage(1);
    setPertandinganPage(1);
    setLatihanPage(1);
    setSparringPage(1);
  };

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
    const fetchGoogleDriveImages = async (
      folderId: string,
      category: 'latihan' | 'sparring',
      branch: 'dlob' | 'dlbc' = 'dlob'
    ) => {
      try {
        console.log(`🔄 Fetching ${category} (${branch}) images from folder: ${folderId}`);
        
        // Use server-side API route for proper authentication
        const response = await fetch(
          `/api/drive/images?folderId=${folderId}&category=${category}&limit=250`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API error: ${response.status} - ${errorData.error}`);
        }

        const data = await response.json();
        const images: GalleryItem[] = (data.images || []).map((img: any) => ({
          ...img,
          branch,
        }));

        console.log(`✅ Fetched ${images.length} ${category} (${branch}) images`);

        if (branch === 'dlbc') {
          setDlbcImages(images);
        } else if (category === 'latihan') {
          setLatihanImages(images);
        } else {
          setSparringImages(images);
        }
      } catch (error) {
        console.error(`❌ Error fetching ${category} (${branch}) images:`, error);
      }
    };

    const trainingFolderId = process.env.NEXT_PUBLIC_GDRIVE_TRAINING_FOLDER_ID || '1vEBxWbSSh_4UIflg9Duw6RlZVvnrHeSC';
    const sparringFolderId = process.env.NEXT_PUBLIC_GDRIVE_SPARRING_FOLDER_ID || '1bNZD-938qEvYVOY6fYLajuvecbsxET9X';
    const dlbcFolderId = process.env.NEXT_PUBLIC_GDRIVE_DLBC_FOLDER_ID || '1bgKdN9ga1TOYrBWsV9BZ46lm5vo6kh4u';

    if (trainingFolderId) {
      fetchGoogleDriveImages(trainingFolderId, 'latihan', 'dlob');
    }
    if (sparringFolderId) {
      fetchGoogleDriveImages(sparringFolderId, 'sparring', 'dlob');
    }
    if (dlbcFolderId) {
      fetchGoogleDriveImages(dlbcFolderId, 'latihan', 'dlbc');
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
    branch: 'dlob',
  }));

  const allLatihanImages: GalleryItem[] = [...latihanImages, ...dlbcImages];

  const allItems = [
    ...pertandinganItems,
    ...allLatihanImages,
    ...sparringImages,
  ];

  const getTabBaseItems = () => {
    switch (activeTab) {
      case 'semua':
        return allItems;
      case 'pertandingan':
        return pertandinganItems;
      case 'latihan':
        return allLatihanImages;
      case 'sparring':
        return sparringImages;
      default:
        return allItems;
    }
  };

  // Filter items based on active tab & selected branch, and apply pagination
  const getFilteredItems = () => {
    let items = getTabBaseItems();

    if (selectedBranch !== 'all') {
      items = items.filter((item) => item.branch === selectedBranch || item.branch === 'all');
    }

    const currentPage = getCurrentPage();

    // Apply pagination to all tabs with 50 items per page
    if (items.length > itemsPerPage) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      console.log(`📄 Pagination: Tab=${activeTab}, Branch=${selectedBranch}, Page=${currentPage}, Total=${items.length}, Range=[${startIndex}-${endIndex}]`);
      
      return items.slice(startIndex, endIndex);
    }

    return items;
  };

  const getTotalFilteredCount = () => {
    let items = getTabBaseItems();
    if (selectedBranch !== 'all') {
      items = items.filter((item) => item.branch === selectedBranch || item.branch === 'all');
    }
    return items.length;
  };

  // Get total pages for current tab and branch
  const getTotalPages = () => {
    return Math.max(1, Math.ceil(getTotalFilteredCount() / itemsPerPage));
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
        break;
      case 'pertandingan':
        setPertandinganPage(newPage);
        break;
      case 'latihan':
        setLatihanPage(newPage);
        break;
      case 'sparring':
        setSparringPage(newPage);
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

      {/* Tabs & Filter Section */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-4">
          {/* Main Activity Tabs */}
          <div className="flex flex-wrap justify-center gap-2 bg-slate-100 p-1.5 rounded-full border border-gray-200">
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
                  resetPages();
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

          {/* Secondary Branch Filter (Subtle, Inclusive, Non-discriminatory) */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            <span className="text-slate-400 font-medium mr-1 text-[11px] uppercase tracking-wider">Cabang:</span>
            {[
              { label: 'Semua Cabang', value: 'all' },
              { label: 'DLOB', value: 'dlob' },
              { label: 'DLBC Cikupa', value: 'dlbc' },
            ].map((b) => (
              <button
                key={b.value}
                onClick={() => {
                  setSelectedBranch(b.value as BranchFilter);
                  resetPages();
                }}
                className={`px-3.5 py-1 rounded-full font-semibold transition-all text-xs ${
                  selectedBranch === b.value
                    ? 'bg-[#4382C8] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {b.label}
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
                          setModalImageLoading(true);
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
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onLoad={() => {
                                console.log('✓ Image loaded:', item.title, item.id);
                              }}
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                const proxyUrl = `/api/drive/proxy?id=${item.id}&sz=w600`;
                                if (!img.src.includes('/api/drive/proxy')) {
                                  img.src = proxyUrl;
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                          </>
                        ) : (
                          <>
                            <img 
                              src={item.thumbnail} 
                              alt={item.title} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
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
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.branch === 'dlbc' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                              DLBC
                            </span>
                          )}
                          {item.branch === 'dlob' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                              DLOB
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#4382C8]/10 text-[#4382C8]">
                            {item.type === 'video' ? 'Video' : 'Foto'}
                          </span>
                        </div>
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
                        Halaman {getCurrentPage()} dari {getTotalPages()} (Total: {getTotalFilteredCount()} item)
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
                className="absolute top-4 right-4 z-50 flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors cursor-pointer backdrop-blur-sm"
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
              ℹ️ Tab Latihan dan Sparring menampilkan dokumentasi kegiatan dari Google Drive komunitas DLOB & DLBC secara real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6"
          onClick={() => {
            setSelectedImage(null);
            setModalImageLoading(false);
          }}
        >
          <div 
            className="relative w-full max-w-5xl max-h-[90vh] bg-zinc-950 rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Bar with Title & Close Button */}
            <div className="relative z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-zinc-900/90 border-b border-white/10">
              <div className="flex items-center gap-2.5 min-w-0 pr-4">
                {selectedImage.branch === 'dlbc' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shrink-0 shadow-xs">
                    DLBC Cikupa
                  </span>
                )}
                {selectedImage.branch === 'dlob' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#4382C8] text-white shrink-0 shadow-xs">
                    DLOB Pusat
                  </span>
                )}
                <h4 className="text-white text-xs sm:text-sm font-semibold truncate">
                  {selectedImage.title}
                </h4>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setModalImageLoading(false);
                }}
                className="flex items-center justify-center w-9 h-9 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-full transition-all cursor-pointer shrink-0"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Viewport Container */}
            <div className="flex-1 flex items-center justify-center min-h-[250px] sm:min-h-[350px] max-h-[75vh] overflow-hidden relative p-2 sm:p-4 bg-black">
              {/* Immediate sharp preview from preloaded thumbnail */}
              <img 
                src={selectedImage.thumbnail}
                alt={selectedImage.title}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[70vh] object-contain relative z-10"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  const proxyUrl = `/api/drive/proxy?id=${selectedImage.id}&sz=w600`;
                  if (!img.src.includes('/api/drive/proxy')) {
                    img.src = proxyUrl;
                  }
                }}
              />

              {/* High-resolution image overlay */}
              <img 
                src={`https://lh3.googleusercontent.com/d/${selectedImage.id}=w1600`}
                alt={selectedImage.title}
                referrerPolicy="no-referrer"
                className={`max-w-full max-h-[70vh] object-contain absolute inset-0 m-auto z-20 transition-opacity duration-300 ${
                  modalImageLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
                onLoad={() => setModalImageLoading(false)}
                onError={(e) => {
                  console.warn('High-res image load error, trying proxy fallback:', selectedImage.id);
                  const img = e.target as HTMLImageElement;
                  const proxyUrl = `/api/drive/proxy?id=${selectedImage.id}&sz=w1600`;
                  if (!img.src.includes('/api/drive/proxy')) {
                    img.src = proxyUrl;
                  }
                  setModalImageLoading(false);
                }}
              />

              {/* Subtle loading indicator */}
              {modalImageLoading && (
                <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-medium border border-white/10">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memuat HD...</span>
                </div>
              )}
            </div>

            {/* Modal Footer Bar with Download Button */}
            <div className="relative z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-zinc-900/90 border-t border-white/10">
              <button
                onClick={() => handleDownloadImage(selectedImage)}
                disabled={isDownloading}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-950 hover:bg-slate-100 active:scale-95 font-bold text-xs rounded-full shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? 'Mengunduh...' : 'Download Foto'}
              </button>

              <span className="text-white/40 text-xs hidden sm:inline">
                Klik di luar modal untuk menutup
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
