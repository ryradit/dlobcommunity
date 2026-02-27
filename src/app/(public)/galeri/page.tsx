'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, X, Download, ZoomIn } from 'lucide-react';
import { AnimatedMarqueeHero } from '@/components/AnimatedMarqueeHero';

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
        // Use server-side API route for proper authentication
        const response = await fetch(
          `/api/drive/images?folderId=${folderId}&category=${category}`
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const images: GalleryItem[] = data.images || [];

        if (category === 'latihan') {
          setLatihanImages(images);
        } else {
          setSparringImages(images);
        }
      } catch (error) {
        console.error(`Error fetching ${category} images:`, error);
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

  // Filter items based on active tab
  const getFilteredItems = () => {
    switch (activeTab) {
      case 'semua':
        return allItems;
      case 'pertandingan':
        return pertandinganItems;
      case 'latihan':
        return latihanImages;
      case 'sparring':
        return sparringImages;
      default:
        return allItems;
    }
  };

  const filteredItems = getFilteredItems();
  const tabs: { label: string; value: TabType }[] = [
    { label: 'Semua', value: 'semua' },
    { label: 'Pertandingan', value: 'pertandingan' },
    { label: 'Latihan', value: 'latihan' },
    { label: 'Sparring', value: 'sparring' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
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
      <section className="py-12 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="flex flex-wrap gap-3 bg-gray-100 p-1.5 rounded-full inline-flex">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value);
                  setSelectedVideo(null);
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
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="group rounded-2xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer bg-white border border-gray-200 hover:border-[#3e6461]"
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
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
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

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative w-full max-w-4xl max-h-[90vh] bg-black rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image */}
            <div className="flex items-center justify-center h-full">
              <img 
                src={`https://drive.google.com/uc?export=view&id=${selectedImage.id}`}
                alt={selectedImage.title}
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.warn('Modal image failed to load:', selectedImage.id);
                  (e.target as HTMLImageElement).src = `https://drive.google.com/thumbnail?id=${selectedImage.id}&sz=w1000`;
                }}
              />
            </div>

            {/* Download Button */}
            <a
              href={`https://drive.google.com/uc?export=download&id=${selectedImage.id}`}
              download={selectedImage.title}
              className="absolute bottom-4 left-4 flex items-center gap-2 px-4 py-2 bg-[#1e4843] hover:bg-[#162f2c] text-white rounded-lg transition-colors z-10"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
