'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, X, Download, ZoomIn, Sparkles, Film, Image as ImageIcon } from 'lucide-react';
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
          return;
        }

        const channelRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
        );
        const channelData = await channelRes.json();
        const uploadsPlaylistId =
          channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

        if (!uploadsPlaylistId) {
          return;
        }

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

        if (branch === 'dlbc') {
          setDlbcImages(images);
        } else if (category === 'latihan') {
          setLatihanImages(images);
        } else {
          setSparringImages(images);
        }
      } catch (error) {
        console.error(`Error fetching ${category} (${branch}) images:`, error);
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

  const getFilteredItems = () => {
    let items = getTabBaseItems();

    if (selectedBranch !== 'all') {
      items = items.filter((item) => item.branch === selectedBranch || item.branch === 'all');
    }

    const currentPage = getCurrentPage();

    if (items.length > itemsPerPage) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
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

  const getTotalPages = () => {
    return Math.max(1, Math.ceil(getTotalFilteredCount() / itemsPerPage));
  };

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

  const handlePageChange = (newPage: number) => {
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredItems = getFilteredItems();

  return (
    <main className="min-h-screen bg-white text-zinc-950 font-sans overflow-x-clip">
      
      {/* Hero Section with Animated Marquee */}
      <AnimatedMarqueeHero
        tagline="Arsip Visual DLOB"
        title="Koleksi Dokumentasi & Momen Lapangan"
        description="Saksikan rekaman pertandingan, sesi drill latihan, dan kebersamaan komunitas bulu tangkis DLOB Pusat & DLBC Cikupa."
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
      <section className="py-8 bg-zinc-50 border-y border-zinc-200/80 sticky top-16 z-30 backdrop-blur-md bg-zinc-50/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Main Activity Tabs */}
          <div className="flex flex-wrap justify-center gap-1.5 p-1.5 rounded-full bg-zinc-200/80 border border-zinc-300 shadow-inner">
            {[
              { label: 'Semua Momen', value: 'semua' },
              { label: 'Pertandingan', value: 'pertandingan' },
              { label: 'Latihan Rutin', value: 'latihan' },
              { label: 'Sparring', value: 'sparring' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value as TabType);
                  setSelectedVideo(null);
                  resetPages();
                }}
                className={`px-5 py-2 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
                  activeTab === tab.value
                    ? 'bg-zinc-950 text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Secondary Branch Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 font-mono text-[11px] uppercase tracking-wider">Cabang:</span>
            {[
              { label: 'Semua', value: 'all' },
              { label: 'DLOB Pusat', value: 'dlob' },
              { label: 'DLBC Cikupa', value: 'dlbc' },
            ].map((b) => (
              <button
                key={b.value}
                onClick={() => {
                  setSelectedBranch(b.value as BranchFilter);
                  resetPages();
                }}
                className={`px-3.5 py-1 rounded-full font-bold transition-all text-xs cursor-pointer ${
                  selectedBranch === b.value
                    ? 'bg-[#4382C8] text-white shadow-xs'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {loading && activeTab === 'pertandingan' ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-950 border-t-transparent mx-auto"></div>
              <p className="text-zinc-500 mt-4 text-sm font-medium">Memuat arsip video...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-base font-medium">Belum ada konten untuk kategori ini.</p>
            </div>
          ) : (
            <>
              {/* Mobile Grid Toggle */}
              <div className="md:hidden flex justify-end mb-6 gap-2">
                <button
                  onClick={() => setMobileGridCols(1)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    mobileGridCols === 1
                      ? 'bg-zinc-950 text-white shadow-md'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  1 Kolom
                </button>
                <button
                  onClick={() => setMobileGridCols(2)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    mobileGridCols === 2
                      ? 'bg-zinc-950 text-white shadow-md'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  2 Kolom
                </button>
              </div>

              {/* Doppelrand Gallery Grid */}
              <div className={`grid ${mobileGridCols === 1 ? 'grid-cols-1' : 'grid-cols-2'} md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8`}>
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
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
                    className="group cursor-pointer"
                  >
                    <div className="doppelrand-shell p-1.5 rounded-[2rem] bg-zinc-100/90 hover:bg-zinc-200/70 border border-zinc-200/80 shadow-sm hover:shadow-xl hover:shadow-[#4382C8]/10 transition-all duration-300">
                      <div className="rounded-[calc(2rem-0.375rem)] overflow-hidden bg-white">
                        
                        {/* Media Thumbnail Container */}
                        <div className="relative bg-zinc-950 h-64 overflow-hidden">
                          <img 
                            src={item.thumbnail} 
                            alt={item.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              const proxyUrl = `/api/drive/proxy?id=${item.id}&sz=w600`;
                              if (!img.src.includes('/api/drive/proxy')) {
                                img.src = proxyUrl;
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent pointer-events-none" />

                          {item.type === 'video' ? (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-[#4382C8] group-hover:text-white transition-all shadow-lg text-zinc-950">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </div>
                            </div>
                          ) : (
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-8 h-8 rounded-full bg-zinc-950/70 backdrop-blur-md text-white flex items-center justify-center">
                                <ZoomIn className="w-4 h-4" />
                              </div>
                            </div>
                          )}

                          {/* Branch indicator */}
                          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                            {item.branch === 'dlbc' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-zinc-950 shadow-xs">
                                DLBC
                              </span>
                            )}
                            {item.branch === 'dlob' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#4382C8] text-white shadow-xs">
                                DLOB
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Type Footer */}
                        <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-white">
                          <h3 className="font-bold text-sm text-zinc-950 group-hover:text-[#4382C8] transition-colors line-clamp-1">
                            {item.title}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-600 shrink-0">
                            {item.type === 'video' ? 'Video' : 'Foto'}
                          </span>
                        </div>

                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {getTotalPages() > 1 && (
                <div className="mt-16 flex flex-col items-center gap-4">
                  <div className="flex flex-wrap justify-center items-center gap-2">
                    <button
                      onClick={() => handlePageChange(getCurrentPage() - 1)}
                      disabled={getCurrentPage() === 1}
                      className="px-5 py-2.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold text-xs"
                    >
                      ← Sebelumnya
                    </button>

                    {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((pageNum) => {
                      const totalPages = getTotalPages();
                      const currentPage = getCurrentPage();
                      const isVisible = 
                        pageNum === 1 || 
                        pageNum === totalPages || 
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);

                      if (!isVisible) {
                        if ((pageNum === currentPage - 2 || pageNum === currentPage + 2) && pageNum > 1 && pageNum < totalPages) {
                          return (
                            <span key={pageNum} className="px-2 text-zinc-400 text-xs">
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
                          className={`w-9 h-9 rounded-full transition-all flex items-center justify-center text-xs font-mono font-bold cursor-pointer ${
                            pageNum === currentPage
                              ? 'bg-zinc-950 text-white shadow-md scale-105'
                              : 'border border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(getCurrentPage() + 1)}
                      disabled={getCurrentPage() === getTotalPages()}
                      className="px-5 py-2.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold text-xs"
                    >
                      Selanjutnya →
                    </button>
                  </div>

                  <p className="text-xs text-zinc-500 font-mono">
                    Halaman {getCurrentPage()} dari {getTotalPages()} (Total: {getTotalFilteredCount()} item)
                  </p>
                </div>
              )}
            </>
          )}

        </div>
      </section>

      {/* Video Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div 
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-zinc-950 overflow-hidden rounded-3xl shadow-2xl border border-white/15" style={{ aspectRatio: '16 / 9' }}>
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
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-50 flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors cursor-pointer backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6"
          onClick={() => {
            setSelectedImage(null);
            setModalImageLoading(false);
          }}
        >
          <div 
            className="relative w-full max-w-5xl max-h-[90vh] bg-zinc-950 rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Bar */}
            <div className="relative z-50 flex items-center justify-between px-5 sm:px-6 py-3.5 bg-zinc-900 border-b border-white/10">
              <div className="flex items-center gap-2.5 min-w-0 pr-4">
                {selectedImage.branch === 'dlbc' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-zinc-950 shrink-0">
                    DLBC Cikupa
                  </span>
                )}
                {selectedImage.branch === 'dlob' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#4382C8] text-white shrink-0">
                    DLOB Pusat
                  </span>
                )}
                <h4 className="text-white text-xs sm:text-sm font-semibold truncate">
                  {selectedImage.title}
                </h4>
              </div>

              <button
                onClick={() => {
                  setSelectedImage(null);
                  setModalImageLoading(false);
                }}
                className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewport */}
            <div className="flex-1 flex items-center justify-center min-h-[250px] sm:min-h-[350px] max-h-[75vh] overflow-hidden relative p-3 sm:p-5 bg-black">
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

              <img 
                src={`https://lh3.googleusercontent.com/d/${selectedImage.id}=w1600`}
                alt={selectedImage.title} 
                referrerPolicy="no-referrer"
                className={`max-w-full max-h-[70vh] object-contain absolute inset-0 m-auto z-20 transition-opacity duration-300 ${
                  modalImageLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
                onLoad={() => setModalImageLoading(false)}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  const proxyUrl = `/api/drive/proxy?id=${selectedImage.id}&sz=w1600`;
                  if (!img.src.includes('/api/drive/proxy')) {
                    img.src = proxyUrl;
                  }
                  setModalImageLoading(false);
                }}
              />

              {modalImageLoading && (
                <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-mono border border-white/10">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memuat HD...</span>
                </div>
              )}
            </div>

            {/* Footer Bar */}
            <div className="relative z-50 flex items-center justify-between px-5 sm:px-6 py-3.5 bg-zinc-900 border-t border-white/10">
              <button
                onClick={() => handleDownloadImage(selectedImage)}
                disabled={isDownloading}
                className="group inline-flex items-center gap-2 px-5 py-2 bg-white text-zinc-950 hover:bg-zinc-100 active:scale-[0.98] font-bold text-xs rounded-full shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloading ? 'Mengunduh...' : 'Unduh Foto Asli'}</span>
              </button>

              <span className="text-zinc-400 text-xs hidden sm:inline font-mono">
                ESC atau klik di luar untuk menutup
              </span>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
