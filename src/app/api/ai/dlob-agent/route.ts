import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// YouTube search function
async function searchYouTube(query: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&q=${encodeURIComponent(query + ' badminton tutorial')}&` +
        `type=video&maxResults=3&key=${process.env.YOUTUBE_API_KEY}&` +
        `relevanceLanguage=id&safeSearch=strict`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.items?.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      duration: 'Video',
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    })) || [];
  } catch (error) {
    console.error('YouTube search error:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, conversationHistory } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Detect query type using AI
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        responseMimeType: 'application/json',
      },
    });

    // Build conversation context
    const conversationContext = conversationHistory
      ?.slice(-5)
      .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Agent'}: ${msg.content}`)
      .join('\n') || 'Ini percakapan pertama';

    const systemPrompt = `Anda adalah "Dlob Agent" - asisten pintar untuk komunitas badminton DLOB yang dapat membantu dengan:

1. **Info Umum**: Membership, pembayaran, fitur dashboard, kontak admin
2. **Coaching**: Teknik bermain, tips improvement, strategi
3. **Analisis Performa**: Insight berbasis data (jika user menyebutkan statistik)

KONTEKS PERCAKAPAN:
${conversationContext}

PERTANYAAN BARU: "${query}"

TUGAS:
1. Deteksi jenis pertanyaan (general/coaching/analysis)
2. Jika pertanyaan tentang TEKNIK/COACHING, rekomendasikan 1-2 kata kunci untuk pencarian video YouTube
3. Berikan jawaban yang natural, helpful, dan friendly dalam Bahasa Indonesia
4. Jika pertanyaan memerlukan data performa user tapi tidak ada, minta user membuka halaman Analitik

FORMAT RESPONS JSON:
{
  "response": "Jawaban lengkap dalam Bahasa Indonesia (2-4 paragraf, gunakan \\n untuk jeda)",
  "queryType": "general" | "coaching" | "analysis",
  "videoKeywords": ["keyword1", "keyword2"] | null
}

CONTOH PERTANYAAN & RESPONS:

**Q: "Bagaimana cara bergabung DLOB?"**
{
  "response": "Untuk bergabung DLOB, Anda bisa hubungi admin kami di 0821-1506-8555 (WhatsApp).\\n\\nSetelah bergabung, Anda akan mendapatkan akses ke dashboard member dengan fitur: manajemen pembayaran, jadwal pertandingan, statistik performa, dan AI insights!",
  "queryType": "general",
  "videoKeywords": null
}

**Q: "Tips meningkatkan smash saya"**
{
  "response": "Smash yang kuat membutuhkan kombinasi teknik, timing, dan power! Berikut tips untuk meningkatkan smash Anda:\\n\\n1. **Footwork**: Posisikan kaki dengan benar - kaki kiri di depan (untuk right-handed) saat memukul\\n2. **Timing**: Pukul shuttlecock di titik tertinggi untuk maksimalkan power\\n3. **Putaran Pinggul**: Gunakan rotasi pinggul dan bahu, bukan hanya lengan\\n4. **Follow Through**: Lanjutkan gerakan raket setelah impact\\n\\nSaya rekomendasikan video tutorial untuk visualisasi yang lebih jelas!",
  "queryType": "coaching",
  "videoKeywords": ["smash technique", "power smash"]
}

**Q: "Analisis performa saya"**
{
  "response": "Untuk menganalisis performa Anda secara detail, silakan buka halaman **Analitik** di dashboard member.\\n\\nDi sana Anda akan menemukan:\\n• Win rate dan statistik lengkap\\n• Analisis partner terbaik\\n• Form pertandingan terkini\\n• AI Insights untuk improvement tips\\n\\nApakah ada aspek performa spesifik yang ingin Anda tanyakan?",
  "queryType": "analysis",
  "videoKeywords": null
}

Respond dengan JSON yang valid.`;

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();
    
    let aiResponse;
    try {
      aiResponse = JSON.parse(text);
    } catch {
      // Fallback if JSON parsing fails
      aiResponse = {
        response: text,
        queryType: 'general',
        videoKeywords: null
      };
    }

    // Search YouTube if coaching query
    let videos = null;
    if (aiResponse.videoKeywords && aiResponse.videoKeywords.length > 0) {
      const videoPromises = aiResponse.videoKeywords.map((keyword: string) => 
        searchYouTube(keyword)
      );
      const videoResults = await Promise.all(videoPromises);
      videos = videoResults.flat().slice(0, 3); // Max 3 videos
    }

    return NextResponse.json({
      response: aiResponse.response,
      queryType: aiResponse.queryType,
      videos: videos
    });

  } catch (error: any) {
    console.error('Dlob Agent Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
