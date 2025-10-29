'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, Camera, Video, Filter } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { youtubeService } from '@/lib/youtube';
import { googleDriveService, DrivePhoto } from '@/lib/google-drive';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import Header from '@/components/Header';
import Footer from '@/components/Footer';



type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration?: string;
  viewCount?: string;
  channelTitle: string;
};

// Button component inline since ui/button is not available
const Button = ({ 
  children, 
  variant = 'default', 
  onClick, 
  className = '' 
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  onClick?: () => void;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md font-medium transition-colors ${
      variant === 'default'
        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
    } ${className}`}
  >
    {children}
  </button>
);

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
  drivePhotoUrl?: string;
  imageLink?: string;
  webContentLink?: string;
}

export default function GalleryPage() {
  const { language } = useLanguage();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<GalleryItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'matches' | 'training' | 'community'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<GalleryItem | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const text: Record<string, any> = {
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
      watchOnYoutube: 'Watch on YouTube',
      viewFullSize: 'View Full Size'
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
      watchOnYoutube: 'Tonton di YouTube',
      viewFullSize: 'Lihat Ukuran Penuh'
    }
  };

  useEffect(() => {
    const loadGalleryContent = async () => {
      try {
        setIsLoading(true);
        
        // Fetch content in parallel
        const [videos, trainingPhotos] = await Promise.all([
          youtubeService.getChannelVideos(20),
          googleDriveService.getTrainingPhotos()
        ]);

        console.log(`📹 Fetched ${videos.length} videos from DLOB YouTube channel`);
        console.log(`📸 Fetched ${trainingPhotos.length} training photos from Google Drive`);

        // Convert YouTube videos to gallery items with smart categorization
        const youtubeItems: GalleryItem[] = videos.map((video: YouTubeVideo) => {
          // Smart categorization based on video title/description
          let category: 'matches' | 'training' | 'community' = 'matches';
          const titleLower = video.title.toLowerCase();
          const descLower = video.description.toLowerCase();
          
          if (titleLower.includes('training') || titleLower.includes('practice') || 
              titleLower.includes('technique') || titleLower.includes('lesson') ||
              descLower.includes('training') || descLower.includes('practice')) {
            category = 'training';
          } else if (titleLower.includes('community') || titleLower.includes('welcome') || 
                     titleLower.includes('member') || titleLower.includes('event') ||
                     titleLower.includes('gathering') || descLower.includes('community')) {
            category = 'community';
          }
          
          return {
            id: `youtube-${video.id}`,
            type: 'video' as const,
            category: category,
            title: video.title,
            description: video.description,
            thumbnail: video.thumbnail,
            date: video.publishedAt,
            youtubeId: video.id,
            youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`
          };
        });

        // Convert Google Drive training photos to gallery items
        const drivePhotoItems: GalleryItem[] = trainingPhotos.map((photo: DrivePhoto) => ({
          id: `drive-${photo.id}`,
          type: 'image' as const,
          category: 'training',
          title: photo.name,
          thumbnail: photo.thumbnailLink,
          date: photo.createdTime,
          imageLink: photo.imageLink,
          webContentLink: photo.webContentLink,
          drivePhotoUrl: photo.webViewLink
        }));

        // Static DLOB gallery items
        const staticItems: GalleryItem[] = [
          {
            id: 'dlob-match-1',
            type: 'image',
            category: 'matches',
            title: 'Saturday Evening Championship',
            description: 'Weekly championship finals at DLOB - intense doubles match with incredible rallies',
            thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzJkNGFhNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RExPQiBDaGFtcGlvbnNoaXA8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI2MCUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNiZGM5ZjkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TYXR1cmRheSBFdmVuaW5nIE1hdGNoPC90ZXh0Pjwvc3ZnPg==',
            date: '2024-10-19'
          },
          {
            id: 'dlob-community-1',
            type: 'image',
            category: 'community',
            title: 'DLOB Welcome Ceremony',
            description: 'Monthly welcoming ceremony for new DLOB community members',
            thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzBmNzIyMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RE1PQiBXZWxjb21lPC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNjAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjYmJmN2QwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TmV3IE1lbWJlciBDZXJlbW9ueTwvdGV4dD48L3N2Zz4=',
            date: '2024-10-05'
          }
        ];

        const allItems = [...youtubeItems, ...drivePhotoItems, ...staticItems];
        console.log(`📋 Total gallery items: ${allItems.length}`);
        
        setGalleryItems(allItems);
        setFilteredItems(allItems);
      } catch (error) {
        console.error('❌ Error loading DLOB YouTube videos:', error);
        
        // If YouTube API fails, still show static DLOB content
        const fallbackStaticItems: GalleryItem[] = [
          {
            id: 'dlob-fallback-1',
            type: 'image',
            category: 'matches',
            title: 'DLOB Championship Highlights',
            description: 'Best moments from recent DLOB badminton championships and tournaments',
            thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzJkNGFhNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RE1PQiBIaWdobGlnaHRzPC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNjAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjYmRjOWY5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2hhbXBpb25zaGlwIE1hdGNoZXM8L3RleHQ+PC9zdmc+',
            date: '2024-10-20'
          },
          {
            id: 'dlob-fallback-2',
            type: 'image',
            category: 'community',
            title: 'DLOB Community Events',
            description: 'Community gatherings, welcomes, and special events at DLOB',
            thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzBmNzIyMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RE1PQiBDb21tdW5pdHk8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI2MCUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNiYmY3ZDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TcGVjaWFsIEV2ZW50czwvdGV4dD48L3N2Zz4=',
            date: '2024-10-15'
          }
        ];
        
        setGalleryItems(fallbackStaticItems);
        setFilteredItems(fallbackStaticItems);
      } finally {
        setIsLoading(false);
      }
    };

    loadGalleryContent();
  }, []);

  const filterItems = (category: 'all' | 'matches' | 'training' | 'community') => {
    setActiveFilter(category);
    if (category === 'all') {
      setFilteredItems(galleryItems);
    } else {
      setFilteredItems(galleryItems.filter(item => item.category === category));
    }
  };

  const openVideoModal = (item: GalleryItem) => {
    if (item.type === 'video') {
      setSelectedVideo(item);
      setIsVideoModalOpen(true);
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
    setIsVideoModalOpen(false);
    // Restore background scrolling
    document.body.style.overflow = 'unset';
  };

  const openPhotoModal = (item: GalleryItem) => {
    if (item.type === 'image') {
      setSelectedPhoto(item);
      setIsPhotoModalOpen(true);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    }
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    setIsPhotoModalOpen(false);
    // Restore background scrolling
    document.body.style.overflow = 'unset';
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeVideoModal();
      }
    };

    if (isVideoModalOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isVideoModalOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="gallery" showAuth={true} />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{text[language].title}</h1>
          <p className="text-gray-600">{text[language].subtitle}</p>
        </div>

          {/* Filter Buttons */}
          <div className="mb-6">
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
          <div className="pb-12">
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
                  if (item.type === 'video') {
                    openVideoModal(item);
                  } else if (item.type === 'image') {
                    openPhotoModal(item);
                  }
                }}
              >
                <div className="relative">
                  {/* Thumbnail */}
                  <div className="h-48 relative overflow-hidden">
                    {/* Video duration badge for videos */}
                    {item.type === 'video' && (
                      <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {/* You can add duration here if available from YouTube API */}
                        VIDEO
                      </div>
                    )}
                    
                    {/* Use regular img for YouTube videos */}
                    {item.type === 'video' ? (
                      <img
                        src={item.thumbnail || item.imageLink || item.webContentLink || item.drivePhotoUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const currentSrc = target.src;
                          
                          if (item.type === 'video' && item.youtubeId) {
                            // Handle YouTube video thumbnails
                            if (target.src.includes('maxresdefault')) {
                              target.src = `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`;
                            } else if (target.src.includes('hqdefault')) {
                              target.src = `https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`;
                            } else if (target.src.includes('mqdefault')) {
                              target.src = `https://img.youtube.com/vi/${item.youtubeId}/default.jpg`;
                            } else {
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VmlkZW8gVGh1bWJuYWlsPC90ZXh0Pjwvc3ZnPg==';
                            }
                          } else {
                            // Try all available image URLs
                            if (currentSrc === item.thumbnail && item.imageLink) {
                              target.src = item.imageLink;
                            } else if (currentSrc === item.imageLink && item.webContentLink) {
                              target.src = item.webContentLink;
                            } else if (currentSrc === item.webContentLink && item.drivePhotoUrl) {
                              target.src = item.drivePhotoUrl;
                            }
                          }
                        }}
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
                      <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black group-hover:bg-opacity-30 transition-all duration-300">
                        <div className="bg-indigo-600 hover:bg-indigo-700 rounded-full p-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
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
                      <span className="text-indigo-600 font-medium">
                        {language === 'en' ? 'Play Video' : 'Putar Video'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Modal */}
      {isVideoModalOpen && selectedVideo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4 md:p-8"
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget) {
              closeVideoModal();
            }
          }}
        >
          <div className="relative w-full max-w-7xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
            {/* Close button */}
            <button
              onClick={closeVideoModal}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-colors"
              aria-label="Close video"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Loading placeholder */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white text-sm">{language === 'en' ? 'Loading video...' : 'Memuat video...'}</p>
              </div>
            </div>

            {/* YouTube embedded player */}
            {selectedVideo.youtubeId && (
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                title={selectedVideo.title}
                className="w-full h-full relative z-10"
                frameBorder="0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                onLoad={(e) => {
                  // Hide loading placeholder when iframe loads
                  const placeholder = e.currentTarget.parentElement?.querySelector('.absolute.inset-0.flex') as HTMLElement;
                  if (placeholder) {
                    placeholder.style.display = 'none';
                  }
                }}
              />
            )}

            {/* Video info overlay */}
            <div 
              className="absolute bottom-0 left-0 right-0 p-6"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)'
              }}
            >
              <h3 className="text-white text-lg font-semibold mb-2">{selectedVideo.title}</h3>
              {selectedVideo.description && (
                <p className="text-gray-300 text-sm line-clamp-2">{selectedVideo.description}</p>
              )}
              <div className="flex justify-between items-center mt-3">
                <span className="text-gray-400 text-sm">
                  {new Date(selectedVideo.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}
                </span>
                <a
                  href={selectedVideo.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                >
                  {text[language].watchOnYoutube} ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Photo Lightbox */}
      <PhotoLightbox 
        isOpen={isPhotoModalOpen}
        photo={selectedPhoto}
        onClose={closePhotoModal}
        filteredItems={filteredItems}
        onPhotoChange={setSelectedPhoto}
        language={language}
        text={text}
      />
      
      <Footer />
    </div>
  );
}