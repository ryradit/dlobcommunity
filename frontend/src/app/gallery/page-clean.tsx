'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, Camera, Video, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/hooks/useLanguage';
import { getChannelVideos, type YouTubeVideo } from '@/lib/youtube';

interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  category: 'all' | 'matches' | 'training' | 'community';
  title: string;
  description?: string;
  thumbnail: string;
  date: string;
  youtubeId?: string;
  youtubeUrl?: string;
}

export default function GalleryPage() {
  const { language } = useLanguage();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<GalleryItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'matches' | 'training' | 'community'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const text = {
    en: {
      title: 'Gallery',
      subtitle: 'Moments from our badminton community',
      filterAll: 'All',
      filterMatches: 'Matches',
      filterTraining: 'Training',
      filterCommunity: 'Community',
      loadingVideos: 'Loading videos from YouTube...',
      noContent: 'No content available',
      videoFrom: 'Video from',
      photoFrom: 'Photo from',
      watchOnYoutube: 'Watch on YouTube'
    },
    id: {
      title: 'Galeri',
      subtitle: 'Momen dari komunitas badminton kami',
      filterAll: 'Semua',
      filterMatches: 'Pertandingan',
      filterTraining: 'Latihan',
      filterCommunity: 'Komunitas',
      loadingVideos: 'Memuat video dari YouTube...',
      noContent: 'Tidak ada konten tersedia',
      videoFrom: 'Video dari',
      photoFrom: 'Foto dari',
      watchOnYoutube: 'Tonton di YouTube'
    }
  };

  useEffect(() => {
    const loadYouTubeVideos = async () => {
      try {
        console.log('🚀 Starting YouTube video fetch...');
        setIsLoading(true);
        
        const videos = await getChannelVideos();
        console.log(`📹 Fetched ${videos.length} videos from YouTube`);

        // Convert YouTube videos to gallery items
        const youtubeItems: GalleryItem[] = videos.map((video: YouTubeVideo) => {
          console.log(`🎬 Processing video: ${video.title} (${video.id})`);
          console.log(`📸 Thumbnail URL: ${video.thumbnail}`);
          
          return {
            id: `youtube-${video.id}`,
            type: 'video' as const,
            category: 'matches' as const, // You can categorize based on video title/description
            title: video.title,
            description: video.description,
            thumbnail: video.thumbnail,
            date: video.publishedAt,
            youtubeId: video.id,
            youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`
          };
        });

        // Static gallery items
        const staticItems: GalleryItem[] = [
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
            description: 'Focused training session improving technique and strategy',
            thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2ZlZjNjNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjZjU5ZTBiIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VHJhaW5pbmcgU2Vzc2lvbiBGb2N1czwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjYwJSIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZiYmYyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJhZG1pbnRvbiBUcmFpbmluZzwvdGV4dD48L3N2Zz4=',
            date: '2024-09-28'
          }
        ];

        // Add a test video with known working thumbnail
        const testVideo: GalleryItem = {
          id: 'test-video',
          type: 'video',
          category: 'matches',
          title: 'Test Video - Rick Roll',
          description: 'Test video to verify thumbnail loading',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
          date: '2024-01-01',
          youtubeId: 'dQw4w9WgXcQ',
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        };

        const allItems = [...youtubeItems, testVideo, ...staticItems];
        console.log(`📋 Total gallery items: ${allItems.length}`);
        
        setGalleryItems(allItems);
        setFilteredItems(allItems);
      } catch (error) {
        console.error('❌ Error loading YouTube videos:', error);
        // Fallback to static content only
        const staticItems: GalleryItem[] = [
          {
            id: 'fallback-1',
            type: 'image',
            category: 'matches',
            title: 'Recent Match Highlights',
            description: 'Best moments from our recent badminton matches',
            thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y5ZmJmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNDE2OWU4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UmVjZW50IE1hdGNoIEhpZ2hsaWdodHM8L3RleHQ+PC9zdmc+',
            date: '2024-10-15'
          }
        ];
        setGalleryItems(staticItems);
        setFilteredItems(staticItems);
      } finally {
        setIsLoading(false);
      }
    };

    loadYouTubeVideos();
  }, []);

  const filterItems = (category: 'all' | 'matches' | 'training' | 'community') => {
    setActiveFilter(category);
    if (category === 'all') {
      setFilteredItems(galleryItems);
    } else {
      setFilteredItems(galleryItems.filter(item => item.category === category));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{text[language].title}</h1>
              <p className="text-gray-600 mt-2">{text[language].subtitle}</p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => filterItems('all')}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {text[language].filterAll}
          </Button>
          <Button
            variant={activeFilter === 'matches' ? 'default' : 'outline'}
            onClick={() => filterItems('matches')}
            className="flex items-center gap-2"
          >
            <Video className="h-4 w-4" />
            {text[language].filterMatches}
          </Button>
          <Button
            variant={activeFilter === 'training' ? 'default' : 'outline'}
            onClick={() => filterItems('training')}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            {text[language].filterTraining}
          </Button>
          <Button
            variant={activeFilter === 'community' ? 'default' : 'outline'}
            onClick={() => filterItems('community')}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            {text[language].filterCommunity}
          </Button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{text[language].loadingVideos}</p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{text[language].noContent}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
                onClick={() => {
                  if (item.type === 'video' && item.youtubeUrl) {
                    window.open(item.youtubeUrl, '_blank');
                  }
                }}
              >
                <div className="relative">
                  {/* Thumbnail */}
                  <div className="h-48 relative overflow-hidden">
                    {/* Debug info for videos */}
                    {item.type === 'video' && (
                      <div className="absolute top-0 left-0 z-20 bg-black bg-opacity-90 text-white text-xs p-1 max-w-full truncate">
                        ID: {item.youtubeId}
                      </div>
                    )}
                    
                    {/* Use regular img for YouTube videos */}
                    {item.type === 'video' ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          console.log(`❌ Video thumbnail failed: ${target.src}`);
                          
                          if (item.youtubeId && !target.src.includes('data:image')) {
                            if (target.src.includes('maxresdefault')) {
                              target.src = `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`;
                            } else if (target.src.includes('hqdefault')) {
                              target.src = `https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`;
                            } else if (target.src.includes('mqdefault')) {
                              target.src = `https://img.youtube.com/vi/${item.youtubeId}/default.jpg`;
                            } else {
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VmlkZW8gVGh1bWJuYWlsPC90ZXh0Pjwvc3ZnPg==';
                            }
                          }
                        }}
                        onLoad={() => console.log(`✅ Video thumbnail loaded: ${item.title}`)}
                      />
                    ) : (
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    )}
                    
                    {/* Video play button overlay */}
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black group-hover:bg-opacity-20 transition-colors duration-300">
                        <div className="bg-red-600 rounded-full p-3 shadow-lg">
                          <Play className="h-6 w-6 text-white fill-white" />
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
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      {item.type === 'video' ? text[language].videoFrom : text[language].photoFrom}{' '}
                      {new Date(item.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}
                    </span>
                    {item.type === 'video' && (
                      <span className="text-red-600 font-medium">
                        {text[language].watchOnYoutube}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}