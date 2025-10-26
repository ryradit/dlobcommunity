'use client';

import Link from "next/link";
import { ArrowLeft, Camera, Play, Trophy, Users, Heart, Star, Loader2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from "@/hooks/useLanguage";
import { youtubeService, YouTubeService } from '@/lib/youtube';

interface GalleryItem {
  id: string | number;
  type: 'image' | 'video';
  category: string;
  title: string;
  description: string;
  thumbnail: string;
  date: string;
  videoUrl?: string;
  youtubeId?: string;
  duration?: string;
  viewCount?: string;
  channelTitle?: string;
}

export default function GalleryPage() {
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<GalleryItem[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [apiConfigured, setApiConfigured] = useState(false);

  const content = {
    en: {
      title: "Community Gallery",
      hero: {
        title: "Memories from Our Badminton Community",
        subtitle: "Explore photos and videos from our matches, tournaments, and community events"
      },
      categories: {
        all: "All Media",
        photos: "Photos", 
        videos: "Videos",
        matches: "Match Highlights",
        tournaments: "Tournaments", 
        community: "Community Events",
        training: "Training Sessions"
      },
      stats: {
        photos: "500+ Photos",
        videos: "50+ Videos", 
        events: "100+ Events",
        memories: "Countless Memories"
      }
    },
    id: {
      title: "Galeri Komunitas",
      hero: {
        title: "Kenangan dari Komunitas Bulu Tangkis Kami",
        subtitle: "Jelajahi foto dan video dari pertandingan, turnamen, dan acara komunitas kami"
      },
      categories: {
        all: "Semua Media",
        photos: "Foto",
        videos: "Video", 
        matches: "Highlight Pertandingan",
        tournaments: "Turnamen",
        community: "Acara Komunitas", 
        training: "Sesi Latihan"
      },
      stats: {
        photos: "500+ Foto",
        videos: "50+ Video",
        events: "100+ Acara", 
        memories: "Kenangan Tak Terhingga"
      }
    }
  };

  const t = content[language as keyof typeof content];

  // Load YouTube videos on component mount
  useEffect(() => {
    const loadYouTubeVideos = async () => {
      setIsLoadingVideos(true);
      const isConfigured = youtubeService.isConfigured();
      setApiConfigured(isConfigured);
      
      console.log('🔧 YouTube API configured:', isConfigured);
      console.log('🔧 API Key available:', !!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY);
      console.log('🔧 Channel ID available:', !!process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID);
      
      try {
        console.log('🔄 Loading YouTube videos...');
        const videos = await youtubeService.getChannelVideos(12); // Get up to 12 videos
        
        const galleryVideos: GalleryItem[] = videos.map((video, index) => {
          const galleryItem = {
            id: video.id,
            type: 'video' as const,
            category: index === 0 ? 'matches' : // First video as featured match
                     index % 4 === 1 ? 'tournaments' :
                     index % 4 === 2 ? 'community' :
                     index % 4 === 3 ? 'training' : 'matches',
            title: video.title,
            description: video.description.substring(0, 150) + (video.description.length > 150 ? '...' : ''),
            thumbnail: video.thumbnail,
            date: new Date(video.publishedAt).toISOString().split('T')[0],
            videoUrl: YouTubeService.getWatchUrl(video.id),
            youtubeId: video.id,
            duration: YouTubeService.parseDuration(video.duration),
            viewCount: YouTubeService.formatViewCount(video.viewCount),
            channelTitle: video.channelTitle
          };
          
          console.log(`🎥 Gallery item ${index + 1}:`, {
            id: galleryItem.id,
            title: galleryItem.title,
            thumbnail: galleryItem.thumbnail
          });
          
          return galleryItem;
        });

        setYoutubeVideos(galleryVideos);
        console.log(`✅ Loaded ${galleryVideos.length} YouTube videos`);
        
        // Test thumbnail URLs for the first few videos
        if (galleryVideos.length > 0) {
          console.log('🧪 Testing thumbnail URLs...');
          galleryVideos.slice(0, 3).forEach(async (video, index) => {
            if (video.youtubeId) {
              const testUrls = [
                `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`,
                `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`,
                `https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg`
              ];
              
              console.log(`🎯 Testing ${video.title} (${video.youtubeId}):`);
              
              testUrls.forEach(async (url, urlIndex) => {
                try {
                  const response = await fetch(url, { method: 'HEAD' });
                  console.log(`  ${urlIndex + 1}. ${url} - Status: ${response.status}`);
                } catch (error) {
                  console.log(`  ${urlIndex + 1}. ${url} - Error: ${error}`);
                }
              });
            }
          });
        }

        // Add a test video with a known working thumbnail as first item
        const testVideo: GalleryItem = {
          id: 'test-video-1',
          type: 'video',
          category: 'matches',
          title: 'Test Video - Working Thumbnail',
          description: 'This is a test video to verify thumbnail functionality',
          thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', // Known working video
          date: '2024-10-25',
          videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
          youtubeId: 'dQw4w9WgXcQ',
          channelTitle: 'Test Video'
        };

        setYoutubeVideos([testVideo, ...galleryVideos]);
        
      } catch (error) {
        console.error('❌ Error loading YouTube videos:', error);
        // Add test video even on error
        const testVideo: GalleryItem = {
          id: 'test-video-error',
          type: 'video',
          category: 'matches',
          title: 'Test Video - Fallback',
          description: 'Fallback test video with working thumbnail',
          thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
          date: '2024-10-25',
          videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
          youtubeId: 'dQw4w9WgXcQ',
          channelTitle: 'Test Video'
        };
        setYoutubeVideos([testVideo]);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    loadYouTubeVideos();
  }, []);

  // Static gallery items (photos and fallback content)
  const staticGalleryItems: GalleryItem[] = [
    {
      id: 'static-1',
      type: 'image',
      category: 'matches',
      title: 'Intense Rally Match',
      description: 'Players showcasing incredible skills during Saturday evening match',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjU2NmI3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW50ZW5zZSBSYWxseSBNYXRjaDwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjYwJSIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OWJhMSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJhZG1pbnRvbiBNYXRjaCBQaG90bzwvdGV4dD48L3N2Zz4=',
      date: '2024-10-19'
    },
    {
      id: 'static-2',
      type: 'image',
      category: 'community',
      title: 'New Member Welcome',
      description: 'Welcoming new community members with a group photo',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y5ZmJmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNDE2OWU4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TmV3IE1lbWJlciBXZWxjb21lPC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNjAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTFhN2ZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q29tbXVuaXR5IEV2ZW50PC90ZXh0Pjwvc3ZnPg==', 
      date: '2024-10-05'
    },
    {
      id: 'static-3',
      type: 'image', 
      category: 'training',
      title: 'Training Session Focus',
      description: 'Members practicing their serves and techniques',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2VjZmRmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjMDU5NjY5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VHJhaW5pbmcgU2Vzc2lvbjwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjYwJSIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzBkOTQ4OCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJhZG1pbnRvbiBUcmFpbmluZzwvdGV4dD48L3N2Zz4=',
      date: '2024-09-28'
    },
    {
      id: 'static-4',
      type: 'image',
      category: 'community', 
      title: 'Community Dinner',
      description: 'Monthly community dinner and awards ceremony',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2ZlZjNjNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTI0MDBkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q29tbXVuaXR5IERpbm5lcjwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjYwJSIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2E4NGQwOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkF3YXJkcyBDZXJlbW9ueTwvdGV4dD48L3N2Zz4=',
      date: '2024-09-14'
    },
    {
      id: 'static-5',
      type: 'image',
      category: 'tournaments',
      title: 'Championship Winners',
      description: 'Celebrating our tournament champions',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2ZhZjVmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjODYxOThlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2hhbXBpb25zaGlwIFdpbm5lcnM8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI2MCUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNiYTQ1ZDciIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Ub3VybmFtZW50IENoYW1waW9uczwvdGV4dD48L3N2Zz4=',
      date: '2024-09-07'
    },
    {
      id: 'static-6',
      type: 'image',
      category: 'training',
      title: 'Coaching Session',
      description: 'Professional coaching tips and techniques workshop',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2VmZmJmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjMzc0MTUxIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q29hY2hpbmcgU2Vzc2lvbjwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjYwJSIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNvYWNoaW5nIFdvcmtzaG9wPC90ZXh0Pjwvc3ZnPg==', 
      date: '2024-08-31'
    }
  ];

  // Combine YouTube videos with static gallery items
  const allGalleryItems: GalleryItem[] = [...youtubeVideos, ...staticGalleryItems];

  const filteredItems = selectedCategory === 'all' 
    ? allGalleryItems 
    : selectedCategory === 'photos'
    ? allGalleryItems.filter((item: GalleryItem) => item.type === 'image')
    : selectedCategory === 'videos'  
    ? allGalleryItems.filter((item: GalleryItem) => item.type === 'video')
    : allGalleryItems.filter((item: GalleryItem) => item.category === selectedCategory);

  const stats = [
    { icon: Camera, label: t.stats.photos, color: 'text-blue-600' },
    { icon: Play, label: t.stats.videos, color: 'text-green-600' },
    { icon: Trophy, label: t.stats.events, color: 'text-purple-600' },
    { icon: Heart, label: t.stats.memories, color: 'text-red-600' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="gallery" showAuth={true} />
      
      {/* Hero Section */}
      <section className="bg-linear-to-br from-purple-600 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Camera className="h-20 w-20 mx-auto mb-8 text-purple-300" />
          <h1 className="text-5xl font-bold mb-6">{t.hero.title}</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">{t.hero.subtitle}</p>
        </div>
      </section>

      {/* YouTube API Status */}
      {!apiConfigured && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>YouTube API not configured:</strong> Showing fallback videos. 
                Add your YouTube API key and Channel ID to display live channel content.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingVideos && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
            <p className="text-sm text-blue-700">
              Loading latest videos from YouTube channel...
            </p>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className={`h-12 w-12 mx-auto mb-4 ${stat.color}`} />
                <div className="text-2xl font-bold text-gray-900">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-8 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {Object.entries(t.categories).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item: GalleryItem) => (
              <div 
                key={item.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
                onClick={() => {
                  if (item.type === 'video' && item.youtubeId) {
                    setSelectedVideo(item.youtubeId);
                    setIsModalOpen(true);
                  } else if (item.type === 'video' && item.videoUrl) {
                    window.open(item.videoUrl, '_blank');
                  }
                  // For images, you could add lightbox functionality here
                }}
              >
                <div className="relative">
                  {/* Thumbnail image */}
                  <div className="h-48 relative overflow-hidden">
                    {/* Debug info for videos */}
                    {item.type === 'video' && (
                      <div className="absolute top-0 left-0 z-20 bg-black bg-opacity-90 text-white text-xs p-1 max-w-full truncate">
                        ID: {item.youtubeId} | URL: {item.thumbnail?.substring(0, 30)}...
                      </div>
                    )}
                    
                    {/* Use regular img for YouTube videos to bypass Next.js Image optimization issues */}
                    {item.type === 'video' ? (
                      <img
                        src={item.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          const target = e.currentTarget;
                          console.log(`❌ Video thumbnail failed: ${target.src} for ${item.title}`);
                          
                          // Try alternative YouTube thumbnail URLs before giving up
                          if (item.youtubeId && !target.src.includes('data:image')) {
                            if (target.src.includes('maxresdefault')) {
                              console.log(`🔄 Trying hqdefault for ${item.youtubeId}`);
                              target.src = `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`;
                            } else if (target.src.includes('hqdefault')) {
                              console.log(`🔄 Trying mqdefault for ${item.youtubeId}`);
                              target.src = `https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`;
                            } else if (target.src.includes('mqdefault')) {
                              console.log(`🔄 Trying default for ${item.youtubeId}`);
                              target.src = `https://img.youtube.com/vi/${item.youtubeId}/default.jpg`;
                            } else {
                              console.log(`⭕ All YouTube thumbnails failed for ${item.youtubeId}, using fallback`);
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VmlkZW8gVGh1bWJuYWlsPC90ZXh0Pjwvc3ZnPg==';
                            }
                          }
                        }}
                        onLoad={() => console.log(`✅ Video thumbnail loaded: ${item.thumbnail} for ${item.title}`)}
                      />
                    ) : (
                      <Image
                        src={item.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'}
                        alt={item.title}
                        fill
                        className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.log(`❌ Thumbnail failed: ${target.src} for ${item.title}`);
                        
                        // Try alternative YouTube thumbnail URLs before giving up
                        if (item.type === 'video' && item.youtubeId && !target.src.includes('data:image')) {
                          if (target.src.includes('maxresdefault')) {
                            console.log(`🔄 Trying hqdefault for ${item.youtubeId}`);
                            target.src = `https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`;
                          } else if (target.src.includes('hqdefault')) {
                            console.log(`🔄 Trying mqdefault for ${item.youtubeId}`);
                            target.src = `https://i.ytimg.com/vi/${item.youtubeId}/mqdefault.jpg`;
                          } else if (target.src.includes('mqdefault')) {
                            console.log(`🔄 Trying default for ${item.youtubeId}`);
                            target.src = `https://i.ytimg.com/vi/${item.youtubeId}/default.jpg`;
                          } else {
                            console.log(`🔄 Using gray placeholder for ${item.title}`);
                            // Create a gray placeholder as data URL
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VmlkZW8gVGh1bWJuYWlsPC90ZXh0Pjwvc3ZnPg==';
                          }
                        } else if (item.type === 'image') {
                          console.log(`🔄 Using image placeholder for ${item.title}`);
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UGhvdG88L3RleHQ+PC9zdmc+';
                        }
                      }}
                      onLoad={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.log(`✅ Thumbnail loaded: ${item.title}`);
                      }}
                    />
                    {/* Video play button overlay */}
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black bg-opacity-60 rounded-full p-4">
                          <Play className="h-8 w-8 text-white fill-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Type indicator */}
                  <div className="absolute top-2 right-2">
                    {item.type === 'video' ? (
                      <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                        VIDEO
                      </div>
                    ) : (
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                        PHOTO
                      </div>
                    )}
                  </div>

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {item.type === 'video' ? (
                        <Play className="h-12 w-12 text-white" />
                      ) : (
                        <Camera className="h-12 w-12 text-white" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{item.date}</span>
                    {item.type === 'video' && (
                      <div className="flex items-center space-x-2">
                        {item.duration && (
                          <span className="text-xs bg-black bg-opacity-75 text-white px-1 rounded">
                            {item.duration}
                          </span>
                        )}
                        {item.viewCount && (
                          <span className="text-xs text-gray-500">{item.viewCount}</span>
                        )}
                      </div>
                    )}
                    {item.type === 'image' && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-xs text-gray-500">Featured</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Empty state */}
          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-500 mb-2">No items in this category</h3>
              <p className="text-gray-400">Check back later for more content!</p>
            </div>
          )}
        </div>
      </section>

      {/* Community Highlights */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Community Highlights</h2>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Highlight 1 */}
            <div className="bg-linear-to-br from-blue-50 to-purple-50 rounded-2xl p-8 text-center">
              <Trophy className="h-16 w-16 text-blue-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Championship Moments</h3>
              <p className="text-gray-600 mb-6">
                Relive the excitement of our monthly tournaments and championship matches
              </p>
              <button 
                onClick={() => setSelectedCategory('tournaments')}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Tournaments
              </button>
            </div>

            {/* Highlight 2 */}
            <div className="bg-linear-to-br from-green-50 to-blue-50 rounded-2xl p-8 text-center">
              <Users className="h-16 w-16 text-green-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Community Spirit</h3>
              <p className="text-gray-600 mb-6">
                See how our badminton family grows stronger with every gathering and event
              </p>
              <button 
                onClick={() => setSelectedCategory('community')}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                View Community
              </button>
            </div>

            {/* Highlight 3 */}
            <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-2xl p-8 text-center">
              <Star className="h-16 w-16 text-purple-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Best Moments</h3>
              <p className="text-gray-600 mb-6">
                Amazing shots, incredible rallies, and unforgettable match highlights
              </p>
              <button 
                onClick={() => setSelectedCategory('matches')}
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                View Matches
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <Camera className="h-16 w-16 mx-auto mb-6 text-blue-400" />
          <h2 className="text-3xl font-bold mb-4">
            {language === 'en' ? 'Share Your Moments' : 'Bagikan Momen Anda'}
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            {language === 'en' 
              ? 'Have great photos or videos from our community events? We\'d love to feature them in our gallery!' 
              : 'Punya foto atau video bagus dari acara komunitas kami? Kami senang menampilkannya di galeri kami!'
            }
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            <Camera className="h-5 w-5 mr-2" />
            {language === 'en' ? 'Submit Your Photos & Videos' : 'Kirim Foto & Video Anda'}
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-linear-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {language === 'en' ? 'Want to Be in Our Next Gallery?' : 'Ingin Tampil di Galeri Kami Selanjutnya?'}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {language === 'en' 
              ? 'Join our community and create memories that will last a lifetime!' 
              : 'Bergabunglah dengan komunitas kami dan ciptakan kenangan yang akan bertahan seumur hidup!'
            }
          </p>
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
          >
            {language === 'en' ? 'Join Our Community' : 'Bergabung dengan Komunitas Kami'}
          </Link>
        </div>
      </section>

      {/* YouTube Video Modal */}
      {isModalOpen && selectedVideo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
              setSelectedVideo(null);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Video Player</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedVideo(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="relative" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={YouTubeService.getEmbedUrl(selectedVideo, true)}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}