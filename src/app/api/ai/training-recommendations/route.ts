import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// YouTube Data API v3
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: string;
  url: string;
}

interface TrainingResponse {
  advice: string;
  videos: YouTubeVideo[];
  cached: boolean;
}

// Simple in-memory cache for common queries (in production, use Redis)
const cache = new Map<string, { data: TrainingResponse; timestamp: number }>();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

const TRAINING_SYSTEM_PROMPT = `Anda adalah pelatih badminton profesional yang berbicara dalam bahasa Indonesia. 

Tugas Anda:
1. Pahami pertanyaan/keluhan latihan badminton dari user
2. Berikan saran praktis dan konkret dalam 2-3 kalimat SAJA
3. Fokus pada teknik, footwork, mental, atau fisik sesuai pertanyaan
4. Gunakan bahasa yang mudah dipahami dan motivatif
5. JANGAN gunakan format markdown atau tanda bintang (**)
6. Setelah saran, berikan 3-5 kata kunci pencarian YouTube dalam bahasa Indonesia yang SANGAT spesifik

Format respons Anda HARUS seperti ini:
[Saran praktis 2-3 kalimat]

KEYWORDS: [keyword1], [keyword2], [keyword3], [keyword4], [keyword5]

Contoh:
User: "Backhand saya lemah, bagaimana membuat itu kuat?"
Anda: "Backhand yang kuat dimulai dari grip yang benar dan rotasi pinggul. Latih footwork agar posisi tubuh selalu tegap saat memukul, dan fokus pada follow-through penuh. Lakukan drill backhand clear 15 menit setiap latihan untuk membangun muscle memory.

KEYWORDS: teknik backhand badminton, latihan backhand clear, grip backhand yang benar, drill backhand pemula, cara memperkuat pukulan backhand"

PENTING: Selalu berikan tepat 5 keywords yang spesifik dan dalam bahasa Indonesia!`;

async function searchYouTubeVideos(keywords: string[]): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    console.error('[YouTube] ❌ API key not configured');
    return [];
  }

  try {
    const searchQuery = keywords.join(' OR ');
    console.log('[YouTube] 🔍 Searching with keywords:', keywords);
    console.log('[YouTube] 🔍 Search query:', searchQuery);
    
    const response = await fetch(
      `${YOUTUBE_SEARCH_URL}?` +
        new URLSearchParams({
          part: 'snippet',
          q: searchQuery + ' badminton',
          type: 'video',
          maxResults: '5',
          relevanceLanguage: 'id', // Indonesian content
          key: YOUTUBE_API_KEY,
          videoEmbeddable: 'true',
          safeSearch: 'strict',
          order: 'relevance',
        })
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[YouTube] ❌ API error:', errorData);
      throw new Error(`YouTube API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('[YouTube] ✅ Search response:', {
      resultCount: data.items?.length || 0,
      pageInfo: data.pageInfo
    });

    // Get video durations
    const videoIds = data.items?.map((item: any) => item.id.videoId).join(',') || '';
    
    let durations: { [key: string]: string } = {};
    if (videoIds) {
      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?` +
          new URLSearchParams({
            part: 'contentDetails',
            id: videoIds,
            key: YOUTUBE_API_KEY,
          })
      );
      
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        detailsData.items?.forEach((item: any) => {
          durations[item.id] = formatDuration(item.contentDetails.duration);
        });
      }
    }

    const videos: YouTubeVideo[] = data.items?.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      duration: durations[item.id.videoId] || '-',
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    })) || [];

    console.log('[YouTube] ✅ Returning', videos.length, 'videos');
    return videos;
  } catch (error) {
    console.error('[YouTube] ❌ Search error:', error);
    return [];
  }
}

function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '-';

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getCacheKey(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

function extractKeywords(aiResponse: string): string[] {
  const keywordMatch = aiResponse.match(/KEYWORDS:\s*(.+)/i);
  if (keywordMatch) {
    return keywordMatch[1]
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
  }
  return [];
}

function cleanAdvice(aiResponse: string): string {
  // Remove the KEYWORDS section from advice
  return aiResponse.replace(/\n*KEYWORDS:.*/i, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query diperlukan' },
        { status: 400 }
      );
    }

    console.log('[Training API] Received query:', query);

    // Check cache
    const cacheKey = getCacheKey(query);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[Training API] Returning cached response');
      return NextResponse.json({ ...cached.data, cached: true });
    }

    let advice = '';
    let searchKeywords: string[] = [];

    // Generate AI advice
    try {
      console.log('[Training API] Generating AI advice...');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      const prompt = `${TRAINING_SYSTEM_PROMPT}\n\nPertanyaan user: ${query}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();
      
      console.log('[Training API] AI response received');

      // Extract keywords and advice
      const keywords = extractKeywords(aiResponse);
      advice = cleanAdvice(aiResponse);

      // If no keywords found, generate default ones based on query
      searchKeywords = keywords.length > 0 
        ? keywords 
        : [query + ' badminton', 'teknik badminton', 'tutorial badminton indonesia'];

      console.log('[Training API] Extracted keywords:', searchKeywords);
    } catch (aiError) {
      console.error('[Training API] AI Error:', aiError);
      // Fallback: use the query itself as search terms
      advice = 'Berikut beberapa video tutorial yang mungkin dapat membantu Anda:';
      searchKeywords = [query + ' badminton tutorial', 'teknik badminton indonesia', query + ' indonesia'];
    }

    // Search YouTube videos
    console.log('[Training API] Searching YouTube with keywords:', searchKeywords);
    const videos = await searchYouTubeVideos(searchKeywords);
    
    console.log('[Training API] ✅ Found', videos.length, 'videos');
    if (videos.length === 0) {
      console.warn('[Training API] ⚠️ No videos found! Check YouTube API quota or keywords');
    }

    // If no advice was generated, create a simple one
    if (!advice || advice.trim() === '') {
      advice = 'Berikut beberapa video tutorial yang dapat membantu meningkatkan kemampuan badminton Anda. Tonton dan praktikkan teknik-teknik yang dijelaskan untuk hasil terbaik.';
    }

    const finalResponse: TrainingResponse = {
      advice,
      videos,
      cached: false,
    };

    console.log('[Training API] 📦 Returning response:', {
      adviceLength: advice.length,
      videoCount: videos.length,
      cached: false
    });

    // Cache the result
    cache.set(cacheKey, { data: finalResponse, timestamp: Date.now() });

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error('[Training API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Gagal mendapatkan rekomendasi latihan', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
