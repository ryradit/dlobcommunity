interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration?: string;
  viewCount?: string;
  channelTitle: string;
}

interface YouTubeAPIResponse {
  items: Array<{
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        high: { url: string };
        medium: { url: string };
        default: { url: string };
        maxres?: { url: string };
      };
      publishedAt: string;
      channelTitle: string;
    };
  }>;
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

interface YouTubeVideoDetailsResponse {
  items: Array<{
    id: string;
    contentDetails: {
      duration: string;
    };
    statistics: {
      viewCount: string;
    };
  }>;
}

export class YouTubeService {
  private apiKey: string;
  private channelId: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
    this.channelId = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || '';
    
    if (!this.apiKey) {
      console.warn('YouTube API key not configured. Using fallback data.');
    }
    if (!this.channelId) {
      console.warn('YouTube Channel ID not configured. Using fallback data.');
    }
  }

  /**
   * Get videos from the configured YouTube channel
   */
  async getChannelVideos(maxResults: number = 10): Promise<YouTubeVideo[]> {
    if (!this.apiKey || !this.channelId) {
      return this.getFallbackVideos();
    }

    try {
      // First, get the channel's videos
      const searchUrl = `${this.baseUrl}/search?` +
        `key=${this.apiKey}&` +
        `channelId=${this.channelId}&` +
        `part=snippet&` +
        `order=date&` +
        `type=video&` +
        `maxResults=${maxResults}`;

      const searchResponse = await fetch(searchUrl);
      
      if (!searchResponse.ok) {
        console.error('YouTube API search request failed:', searchResponse.statusText);
        return this.getFallbackVideos();
      }

      const searchData: YouTubeAPIResponse = await searchResponse.json();

      if (!searchData.items || searchData.items.length === 0) {
        console.log('No videos found for channel:', this.channelId);
        return this.getFallbackVideos();
      }

      // Get video IDs for detailed info
      const videoIds = searchData.items.map(item => item.id.videoId).join(',');

      // Get video details (duration, view count, etc.)
      const detailsUrl = `${this.baseUrl}/videos?` +
        `key=${this.apiKey}&` +
        `id=${videoIds}&` +
        `part=contentDetails,statistics`;

      const detailsResponse = await fetch(detailsUrl);
      const detailsData: YouTubeVideoDetailsResponse = await detailsResponse.json();

      // Combine search results with detailed info
      const videos: YouTubeVideo[] = searchData.items.map((item, index) => {
        const details = detailsData.items?.find(d => d.id === item.id.videoId);
        
        // Force use of reliable YouTube thumbnail URLs instead of API-provided ones
        const videoId = item.id.videoId;
        
        // Always use the most reliable thumbnail URL format
        let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        
        // Log what the API provided vs what we're using
        const apiThumbnail = item.snippet.thumbnails.high?.url || 
                           item.snippet.thumbnails.medium?.url || 
                           item.snippet.thumbnails.default?.url;
        
        console.log(`📸 Video ${videoId}: API provided: ${apiThumbnail}`);
        console.log(`📸 Video ${videoId}: Using instead: ${thumbnailUrl}`);
        
        // Try multiple thumbnail URL formats as backup
        const fallbackUrls = [
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
          `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          `https://i.ytimg.com/vi/${videoId}/default.jpg`
        ];
        
        console.log(`🔍 Testing thumbnail URLs for ${videoId}:`);
        fallbackUrls.forEach((url, index) => {
          console.log(`  ${index + 1}. ${url}`);
        });
        
        console.log(`📸 Video ${item.id.videoId}: ${item.snippet.title} - Thumbnail: ${thumbnailUrl}`);
        
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: thumbnailUrl,
          publishedAt: item.snippet.publishedAt,
          duration: details?.contentDetails?.duration,
          viewCount: details?.statistics?.viewCount,
          channelTitle: item.snippet.channelTitle
        };
      });

      console.log(`✅ Successfully fetched ${videos.length} videos from YouTube channel`);
      return videos;

    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      return this.getFallbackVideos();
    }
  }

  /**
   * Get a specific video by ID
   */
  async getVideoById(videoId: string): Promise<YouTubeVideo | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const url = `${this.baseUrl}/videos?` +
        `key=${this.apiKey}&` +
        `id=${videoId}&` +
        `part=snippet,contentDetails,statistics`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return null;
      }

      const item = data.items[0];
      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.maxres?.url || 
                  item.snippet.thumbnails.high?.url || 
                  item.snippet.thumbnails.medium?.url ||
                  item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt,
        duration: item.contentDetails?.duration,
        viewCount: item.statistics?.viewCount,
        channelTitle: item.snippet.channelTitle
      };

    } catch (error) {
      console.error('Error fetching YouTube video:', error);
      return null;
    }
  }

  /**
   * Parse YouTube duration format (PT4M13S) to readable format
   */
  static parseDuration(duration?: string): string {
    if (!duration) return '';
    
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Format view count to readable format
   */
  static formatViewCount(viewCount?: string): string {
    if (!viewCount) return '';
    
    const count = parseInt(viewCount);
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    } else {
      return `${count} views`;
    }
  }

  /**
   * Generate all possible thumbnail URLs for a video ID
   */
  static getAllThumbnailUrls(videoId: string): string[] {
    const baseUrls = [
      'https://img.youtube.com/vi',
      'https://i.ytimg.com/vi'
    ];
    
    const qualities = [
      'maxresdefault.jpg',
      'hqdefault.jpg',
      'mqdefault.jpg',
      'default.jpg'
    ];
    
    const urls: string[] = [];
    
    baseUrls.forEach(baseUrl => {
      qualities.forEach(quality => {
        urls.push(`${baseUrl}/${videoId}/${quality}`);
      });
    });
    
    return urls;
  }

  /**
   * Get the best available thumbnail URL for a video
   */
  static async getBestThumbnail(videoId: string): Promise<string> {
    const thumbnailUrls = this.getAllThumbnailUrls(videoId);
    
    for (const url of thumbnailUrls) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.log(`✅ Found working thumbnail: ${url}`);
          return url;
        }
      } catch (error) {
        // Continue to next URL
      }
    }
    
    console.log(`❌ No working thumbnail found for ${videoId}, using default`);
    return thumbnailUrls[0]; // Return first URL as fallback
  }

  /**
   * Fallback videos when API is not available
   */
  private getFallbackVideos(): YouTubeVideo[] {
    return [
      {
        id: 'gnpG-lcESTk',
        title: 'Epic Badminton Rally - DLOB Community',
        description: 'Amazing badminton rally showcasing incredible skills and techniques from our community members',
        thumbnail: 'https://i.ytimg.com/vi/gnpG-lcESTk/hqdefault.jpg',
        publishedAt: '2024-10-20T00:00:00Z',
        channelTitle: 'DLOB Badminton Community'
      },
      {
        id: 'dQw4w9WgXcQ',
        title: 'Monthly Tournament Finals Highlight',
        description: 'The exciting final match of our monthly championship tournament',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        publishedAt: '2024-10-12T00:00:00Z',
        channelTitle: 'DLOB Badminton Community'
      },
      {
        id: 'j5ilvKWlcz4',
        title: 'Badminton Training Techniques',
        description: 'Professional training session with advanced techniques and tips',
        thumbnail: 'https://i.ytimg.com/vi/j5ilvKWlcz4/hqdefault.jpg',
        publishedAt: '2024-10-10T00:00:00Z',
        channelTitle: 'DLOB Badminton Community'
      }
    ];
  }

  /**
   * Check if YouTube API is configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.channelId);
  }

  /**
   * Get YouTube embed URL for video
   */
  static getEmbedUrl(videoId: string, autoplay = false): string {
    return `https://www.youtube.com/embed/${videoId}${autoplay ? '?autoplay=1' : ''}`;
  }

  /**
   * Get YouTube watch URL for video
   */
  static getWatchUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
}

export const youtubeService = new YouTubeService();