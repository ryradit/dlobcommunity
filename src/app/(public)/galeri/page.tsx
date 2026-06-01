'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, X, Download, ZoomIn, Sparkles, ChevronDown, ChevronUp, Search, Film, Image as ImageIcon } from 'lucide-react';
import { AnimatedMarqueeHero } from '@/components/AnimatedMarqueeHero';
import { FaceGalleryCarousel } from '@/components/FaceGalleryCarousel';
import GalleryComments from '@/components/GalleryComments';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showFaceFilter, setShowFaceFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 50;

  interface FeaturedItems {
    video1: any;
    video2: any;
    image1: GalleryItem | null;
    image2: GalleryItem | null;
  }
  const [featured, setFeatured] = useState<FeaturedItems>({
    video1: null,
    video2: null,
    image1: null,
    image2: null
  });
  const [featuredInitialized, setFeaturedInitialized] = useState(false);

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

  // Set random featured content strictly once on page load/reload
  useEffect(() => {
    if (featuredInitialized) return;
    if (youtubeVideos.length === 0 || allItems.length === 0) return;

    const allImages = allItems.filter(item => item.type === 'image');
    if (allImages.length === 0) return;

    // Initial select
    const v1 = youtubeVideos[Math.floor(Math.random() * youtubeVideos.length)];
    const v2 = youtubeVideos.length > 1 
      ? youtubeVideos.filter(v => v.id !== v1.id)[Math.floor(Math.random() * (youtubeVideos.length - 1))]
      : v1;
    const img1 = allImages[Math.floor(Math.random() * allImages.length)];
    const img2 = allImages.length > 1
      ? allImages.filter(img => img.id !== img1.id)[Math.floor(Math.random() * (allImages.length - 1))]
      : img1;

    setFeatured({
      video1: v1,
      video2: v2,
      image1: img1,
      image2: img2
    });
    setFeaturedInitialized(true);
  }, [youtubeVideos, allItems, featuredInitialized]);

  // Helper to get matching items before pagination
  const getSearchedItems = () => {
    let items: GalleryItem[] = [];

    if (isFilteringByFace) {
      items = faceSearchResults.map(id => {
        const existing = allItems.find(item => item.id === id);
        if (existing) return existing;
        
        return {
          id: id,
          title: 'Foto Latihan',
          thumbnail: `/api/drive/image-proxy?id=${id}`,
          type: 'image' as const,
          url: `/api/drive/image-proxy?id=${id}`,
          category: 'latihan' as const,
        };
      });
    } else {
      switch (activeTab) {
        case 'semua':
          items = allItems;
          break;
        case 'pertandingan':
          items = pertandinganItems;
          break;
        case 'latihan':
          items = latihanImages;
          break;
        case 'sparring':
          items = sparringImages;
          break;
        default:
          items = allItems;
      }
    }

    if (searchQuery.trim() !== '') {
      items = items.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return items;
  };

  // Filter items based on active tab and apply pagination
  const getFilteredItems = () => {
    const items = getSearchedItems();
    const currentPage = getCurrentPage();

    if (items.length > itemsPerPage) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return items.slice(startIndex, endIndex);
    }

    return items;
  };

  // Get total pages for current tab
  const getTotalPages = () => {
    const items = getSearchedItems();
    return Math.ceil(items.length / itemsPerPage);
  };

  // Get current page
  const getCurrentPage = () => {
    if (isFilteringByFace) {
      return latihanPage;
    }
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
    
    if (isFilteringByFace) {
      setLatihanPage(newPage);
      console.log(`✅ Set latihanPage to ${newPage} (face filter active)`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
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
      
      const url = `/api/face/similar-advanced?faceId=${encodeURIComponent(faceId)}&threshold=0.65&topK=100`;
      console.log(`📡 Calling API: ${url}`);
      
      let response;
      let useFallback = false;
      
      try {
        response = await fetch(url);
        if (!response.ok) {
          useFallback = true;
          try {
            const error = await response.json();
            console.warn('⚠️ Advanced search API error (falling back to legacy):', error);
          } catch (e) {
            console.warn('⚠️ Advanced search API returned non-JSON error response');
          }
        }
      } catch (err) {
        console.warn('⚠️ Failed to fetch advanced face search:', err);
        useFallback = true;
      }
      
      if (useFallback) {
        // Fallback to old endpoint if advanced is not available
        console.warn('⚠️ Advanced endpoint not available, falling back to legacy endpoint');
        const fallbackResponse = await fetch(
          `/api/face/similar?faceId=${encodeURIComponent(faceId)}&threshold=0.87`
        );
        
        if (!fallbackResponse.ok) {
          let errorMsg = 'Unknown error';
          try {
            const fallbackError = await fallbackResponse.json();
            errorMsg = fallbackError.error || errorMsg;
          } catch (e) {}
          alert(`❌ Gagal menemukan wajah serupa: ${errorMsg}`);
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
      
      const data = await response!.json();
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

  const gridItems = (activeTab === 'pertandingan' && searchQuery === '' && getCurrentPage() === 1)
    ? filteredItems.slice(1)
    : filteredItems;

  // Marquee images: combine all dynamically loaded images from Google Drive.
  // Fall back to default local member avatars if the API has not finished loading them yet.
  const defaultMarqueeImages = [
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
  ];

  const galleryImages = allItems.filter(item => item.type === 'image').map(item => item.thumbnail);
  const marqueeImages = galleryImages.length > 0 ? galleryImages : defaultMarqueeImages;

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      {/* Hero Section with Animated Marquee */}
      <AnimatedMarqueeHero
        tagline="Galeri DLOB"
        title="Koleksi Momen Terbaik DLOB"
        description=""
        ctaText="Jelajahi Galeri"
        images={marqueeImages}
      />

      {/* Gallery Control Console */}
      <section id="gallery-console" className="py-6 sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 bg-neutral-100 p-1 rounded-2xl w-fit">
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
                    setSearchQuery('');
                    // Reset pagination for all tabs when switching
                    setSemuaPage(1);
                    setPertandinganPage(1);
                    setLatihanPage(1);
                    setSparringPage(1);
                  }}
                  className={`relative px-5 py-2 text-xs md:text-sm font-bold rounded-xl transition-all duration-300 z-10 ${
                    activeTab === tab.value
                      ? 'text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {activeTab === tab.value && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-[#1e4843] rounded-xl -z-10 shadow-sm"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Actions: Search & Face Filter Trigger */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Text Search Input */}
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Cari momen/pemain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 rounded-xl bg-neutral-50 text-neutral-800 placeholder-neutral-400 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#1e4843] text-xs transition-all"
                />
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>

              {/* Face Search Button */}
              {activeTab === 'latihan' && (
                <button
                  onClick={() => setShowFaceFilter(!showFaceFilter)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all duration-300 border ${
                    showFaceFilter
                      ? 'bg-[#1e4843] text-white border-[#1e4843] hover:bg-[#1a3f3b]'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${showFaceFilter ? 'text-white animate-pulse' : 'text-[#3e6461]'}`} />
                  <span className="hidden sm:inline">{showFaceFilter ? 'Tutup Filter Wajah' : 'Cari Wajah'}</span>
                  <span className="sm:hidden">Wajah</span>
                  {showFaceFilter ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>

          </div>

          {/* Expanded Face Recognition Slider Panel */}
          {activeTab === 'latihan' && showFaceFilter && (
            <div className="mt-4 p-4 bg-slate-50 border border-neutral-200/60 rounded-2xl shadow-inner animate-in slide-in-from-top-3 duration-300">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#1e4843] animate-pulse" />
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">AI Face Scan & Filter</h4>
              </div>
              <FaceGalleryCarousel 
                onFaceSelect={handleFaceSelect}
                selectedFaceId={selectedFaceId}
              />
            </div>
          )}
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Featured Showcase on Semua Tab */}
          {activeTab === 'semua' && searchQuery === '' && getCurrentPage() === 1 && featured.video1 && (
            <div className="mb-14">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1e4843] animate-pulse" />
                  <h3 className="text-xs md:text-sm font-bold text-[#1e4843] uppercase tracking-wider">Sorotan Utama (Featured)</h3>
                </div>
                <span className="text-[9px] text-[#1e4843] font-extrabold uppercase tracking-wider bg-[#1e4843]/5 px-2.5 py-1 rounded-md animate-pulse">
                  Dipilih Secara Acak
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Slot 1: Video 1 */}
                <FeaturedSlot 
                  item={featured.video1} 
                  type="video" 
                  badge="Featured Video"
                  onPlay={() => setSelectedVideo(featured.video1)} 
                />
                
                {/* Slot 2: Image 1 */}
                <FeaturedSlot 
                  item={featured.image1} 
                  type="image" 
                  badge="Featured Photo"
                  onClick={() => setSelectedImage(featured.image1)} 
                />

                {/* Slot 3: Video 2 */}
                <FeaturedSlot 
                  item={featured.video2} 
                  type="video" 
                  badge="Featured Video"
                  onPlay={() => setSelectedVideo(featured.video2)} 
                />

                {/* Slot 4: Image 2 */}
                <FeaturedSlot 
                  item={featured.image2} 
                  type="image" 
                  badge="Featured Photo"
                  onClick={() => setSelectedImage(featured.image2)} 
                />
              </div>
            </div>
          )}

          {/* YouTube Video Spotlight */}
          {activeTab === 'pertandingan' && searchQuery === '' && getCurrentPage() === 1 && youtubeVideos.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Sorotan Pertandingan</h3>
              </div>
              <div 
                onClick={() => setSelectedVideo(youtubeVideos[0])}
                className="group relative bg-neutral-900 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-neutral-800 cursor-pointer aspect-16/9 md:aspect-[21/9]"
              >
                <img 
                  src={youtubeVideos[0].thumbnail} 
                  alt={youtubeVideos[0].title} 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-102 transition-transform duration-700 ease-out" 
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/35 to-transparent flex flex-col justify-end p-6 md:p-10">
                  <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-md w-fit mb-3">
                    Video Terbaru
                  </span>
                  <h4 className="text-white text-lg md:text-3xl font-extrabold max-w-2xl leading-tight group-hover:text-red-400 transition-colors">
                    {youtubeVideos[0].title}
                  </h4>
                  <p className="text-neutral-400 text-xs md:text-sm mt-2 flex items-center gap-2">
                    <span>Komunitas DLOB YouTube Channel</span>
                    <span>•</span>
                    <span>Klik untuk Putar</span>
                  </p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/95 text-red-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-6 h-6 md:w-8 md:h-8 fill-red-600 ml-1" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gallery Content Area */}
          {loading && activeTab === 'pertandingan' ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e4843] mx-auto"></div>
              <p className="text-gray-500 mt-4 font-medium">Memuat video...</p>
            </div>
          ) : gridItems.length === 0 ? (
            <div className="bg-white border border-neutral-100 shadow-xs rounded-3xl p-16 text-center max-w-md mx-auto">
              <div className="w-14 h-14 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-neutral-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-800 mb-1">Momen Tidak Ditemukan</h3>
              <p className="text-neutral-500 text-xs font-light">
                Tidak ada foto atau video yang sesuai dengan kriteria pencarian Anda. Coba kata kunci lainnya.
              </p>
            </div>
          ) : (
            <>
              {/* Filter Status Banner */}
              {isFilteringByFace && faceSearchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-5 bg-[#3e6461]/5 border border-[#3e6461]/15 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center backdrop-blur-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#3e6461]/10 text-[#3e6461]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-800 text-sm md:text-base">
                        Hasil Pencarian: {faceSearchResults.length} Gambar Wajah Serupa
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Menampilkan hanya foto latihan yang memiliki kemiripan wajah tinggi dengan pilihan Anda.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFaceSelect('')}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] flex items-center gap-2 whitespace-nowrap shadow-xs"
                    title="Hapus filter dan tampilkan semua"
                  >
                    <X className="w-3.5 h-3.5" />
                    Hapus Filter
                  </button>
                </motion.div>
              )}

              {/* Mobile Grid Toggle - Only visible on mobile */}
              <div className="md:hidden flex justify-end mb-6 gap-2">
                <button
                  onClick={() => setMobileGridCols(1)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    mobileGridCols === 1
                      ? 'bg-[#1e4843] text-white shadow-md'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                  title="Tampilkan 1 kolom"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="2" y="2" width="16" height="16" rx="2" ry="2" opacity="0.5" />
                  </svg>
                  1 Kolom
                </button>
                <button
                  onClick={() => setMobileGridCols(2)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    mobileGridCols === 2
                      ? 'bg-[#1e4843] text-white shadow-md'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                  title="Tampilkan 2 kolom"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="2" y="2" width="7" height="16" rx="1" ry="1" opacity="0.5" />
                    <rect x="11" y="2" width="7" height="16" rx="1" ry="1" opacity="0.5" />
                  </svg>
                  2 Kolom
                </button>
              </div>

              {/* Gallery Grid */}
              <motion.div 
                layout
                className={`grid ${mobileGridCols === 1 ? 'grid-cols-1' : 'grid-cols-2'} md:grid-cols-2 lg:grid-cols-3 gap-8`}
              >
                <AnimatePresence mode="popLayout">
                  {gridItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 24, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ 
                            duration: 0.45, 
                            delay: Math.min(index * 0.015, 0.25),
                            ease: [0.16, 1, 0.3, 1] 
                          }}
                          className="group relative flex flex-col overflow-hidden bg-white border border-neutral-100 hover:border-neutral-200 rounded-2xl shadow-xs hover:shadow-xl transition-all duration-500 cursor-pointer"
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
                          {/* Download Button - Fixed top-right for images, reveals on hover */}
                          {item.type === 'image' && (
                            <a
                              href={`https://drive.google.com/uc?export=download&id=${item.id}`}
                              download={item.title}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-3 right-3 z-20 flex items-center justify-center w-9 h-9 bg-neutral-950/60 backdrop-blur-md text-white rounded-xl opacity-0 group-hover:opacity-100 hover:bg-[#1e4843] hover:scale-105 transition-all duration-300 shadow-lg"
                              title="Download image"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}

                          {/* Image/Thumbnail Container */}
                          <div className="relative bg-neutral-50 aspect-[4/3] w-full overflow-hidden border-b border-neutral-100">
                            {item.type === 'image' ? (
                              <>
                                <img 
                                  src={item.thumbnail} 
                                  alt={item.title} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
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
                                <div className="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/5 transition-colors duration-300" />
                              </>
                            ) : (
                              <>
                                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/45 transition-all duration-300 flex items-center justify-center">
                                  <div className="w-14 h-14 bg-white/95 text-[#1e4843] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <Play className="w-5 h-5 fill-[#1e4843] ml-0.5" />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Info footer */}
                          <div className="p-5 flex flex-col justify-between flex-grow">
                            <div>
                              <div className="flex items-center gap-1.5 mb-2.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  item.category === 'pertandingan' ? 'bg-amber-400' :
                                  item.category === 'latihan' ? 'bg-[#3e6461]' :
                                  'bg-indigo-400'
                                }`} />
                                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                                  {item.category}
                                </span>
                              </div>
                              <h3 className="font-semibold text-neutral-800 tracking-tight leading-snug line-clamp-2 group-hover:text-[#1e4843] transition-colors duration-300">
                                {item.title}
                              </h3>
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                              <span className="flex items-center gap-1 font-medium">
                                {item.type === 'video' ? '🎬 Video Pertandingan' : '📸 Foto Komunitas'}
                              </span>
                              <span className="font-semibold group-hover:translate-x-0.5 transition-transform duration-300 text-[#3e6461] flex items-center gap-0.5">
                                {item.type === 'video' ? 'Putar Video' : 'Lihat Foto'}
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-0.5">→</span>
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>

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
        </div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Video Container */}
              <div className="relative bg-black overflow-hidden rounded-2xl shadow-2xl border border-neutral-800" style={{ aspectRatio: '16 / 9' }}>
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
                  className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 bg-neutral-900/60 backdrop-blur-md text-white rounded-xl hover:bg-neutral-800 transition-colors shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note about Google Drive Integration */}
      <section className="py-12 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-neutral-50/50 border border-neutral-200/60 rounded-2xl p-6 flex items-start gap-3">
            <span className="text-base">ℹ️</span>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Tab <strong>Latihan</strong> dan <strong>Sparring</strong> menampilkan foto dari Google Drive secara real-time. Hubungi admin komunitas jika foto Anda belum muncul atau ingin melakukan verifikasi wajah.
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Comments Section - At the bottom of the page */}
      <section className="py-16 bg-neutral-50/40 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-neutral-100 p-8 shadow-xs">
            <GalleryComments 
              galleryItemId="gallery-page" 
              title="Gallery"
            />
          </div>
        </div>
      </section>

      {/* Image Modal - Fresh Start */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-4xl max-h-[85vh] bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-40 flex items-center justify-center w-9 h-9 bg-neutral-900/60 backdrop-blur-md text-white rounded-xl hover:bg-neutral-800 transition-colors shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Image Display Area */}
              <div className="flex-1 flex items-center justify-center bg-neutral-950 p-4 min-h-64 overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Image - Using proxy URL for reliable loading */}
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.title}
                      className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-sm"
                      onLoad={() => {
                        console.log('✅ Image loaded:', selectedImage.title);
                        setModalImageLoading(false);
                      }}
                      onError={(e) => {
                        console.error('❌ Image failed to load:', selectedImage.title, selectedImage.url);
                      }}
                    />
                </div>
              </div>

              {/* Footer with Actions */}
              <div className="flex items-center justify-between gap-4 p-5 bg-neutral-900 border-t border-neutral-800">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm md:text-base truncate">
                    {selectedImage.title}
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
                    📸 Foto Latihan / Sparring
                  </p>
                </div>
                <a
                  href={`/api/drive/image-proxy?id=${selectedImage.id}&download=true`}
                  download={selectedImage.title}
                  className="px-4 py-2 bg-[#1e4843] hover:bg-[#162f2c] text-white rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] flex items-center gap-2 whitespace-nowrap shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// Polished featured content card slot component with exit/entry Framer Motion transitions
const FeaturedSlot = ({ 
  item, 
  type, 
  badge,
  onPlay, 
  onClick 
}: { 
  item: any; 
  type: 'video' | 'image'; 
  badge: string;
  onPlay?: () => void; 
  onClick?: () => void; 
}) => {
  if (!item) return null;
  
  return (
    <div 
      onClick={type === 'video' ? onPlay : onClick}
      className="group relative bg-neutral-900 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 border border-neutral-200/50 cursor-pointer aspect-4/3 w-full"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 w-full h-full flex flex-col justify-end"
        >
          <img 
            src={item.thumbnail} 
            alt={item.title} 
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-103 transition-transform duration-700 ease-out" 
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/45 to-transparent" />
          
          {/* Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md text-white ${
              type === 'video' ? 'bg-red-600 animate-pulse' : 'bg-[#1e4843]'
            }`}>
              {badge}
            </span>
          </div>

          {/* Icon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {type === 'video' ? (
              <div className="w-12 h-12 bg-white/95 text-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Play className="w-4 h-4 fill-red-600 ml-0.5" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-white/95 text-[#1e4843] rounded-xl flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                <Search className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Title Area */}
          <div className="relative p-4 z-10 mt-auto">
            <h4 className="text-white text-xs font-bold leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors">
              {item.title}
            </h4>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

