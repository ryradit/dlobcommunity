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

// Training video database
const TRAINING_VIDEOS = {
  backhand: [
    { title: 'Backhand Clear Technique', url: 'https://www.youtube.com/watch?v=abc123', difficulty: 'beginner' },
    { title: 'Advanced Backhand Drop Shot', url: 'https://www.youtube.com/watch?v=def456', difficulty: 'intermediate' },
  ],
  defense: [
    { title: 'Defense Positioning Basics', url: 'https://www.youtube.com/watch?v=ghi789', difficulty: 'beginner' },
    { title: 'Fast Defense Reaction Drills', url: 'https://www.youtube.com/watch?v=jkl012', difficulty: 'intermediate' },
  ],
  smash: [
    { title: 'Power Smash Tutorial', url: 'https://www.youtube.com/watch?v=mno345', difficulty: 'intermediate' },
    { title: 'Jump Smash Technique', url: 'https://www.youtube.com/watch?v=pqr678', difficulty: 'advanced' },
  ],
  footwork: [
    { title: 'Basic Footwork Patterns', url: 'https://www.youtube.com/watch?v=stu901', difficulty: 'beginner' },
    { title: 'Court Coverage Optimization', url: 'https://www.youtube.com/watch?v=vwx234', difficulty: 'intermediate' },
  ],
  net_play: [
    { title: 'Net Kill Techniques', url: 'https://www.youtube.com/watch?v=yza567', difficulty: 'intermediate' },
    { title: 'Net Spinning and Deception', url: 'https://www.youtube.com/watch?v=bcd890', difficulty: 'advanced' },
  ],
  stamina: [
    { title: 'Stamina Building for Badminton', url: 'https://www.youtube.com/watch?v=efg123', difficulty: 'beginner' },
    { title: 'Interval Training for Court Sports', url: 'https://www.youtube.com/watch?v=hij456', difficulty: 'intermediate' },
  ],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, userId, stats, partnerStats, opponentStats, recentMatches, sessionHistory } = body;

    if (!query || !userId) {
      return NextResponse.json(
        { error: 'Query and userId are required' },
        { status: 400 }
      );
    }

    // Get user's existing weaknesses and goals
    const [weaknessesResult, goalsResult, recommendationsResult] = await Promise.all([
      supabase
        .from('identified_weaknesses')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active'),
      supabase
        .from('training_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active'),
      supabase
        .from('training_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false),
    ]);

    const existingWeaknesses = weaknessesResult.data || [];
    const activeGoals = goalsResult.data || [];
    const pendingRecommendations = recommendationsResult.data || [];

    // Build context for AI
    const contextPrompt = `
SISTEM: Anda adalah "Dlob Coach Agent" - pelatih bulu tangkis virtual yang personal, motivasi, dan actionable.

ATURAN KOMUNIKASI:
- SELALU gunakan "Anda" untuk berbicara langsung ke pemain
- Gunakan Bahasa Indonesia yang natural dan motivasi
- Berikan saran yang SPESIFIK dan ACTIONABLE
- Sertakan angka dan data untuk kredibilitas
- Tone: Supportive tapi jujur, seperti personal coach

DATA PERFORMA PEMAIN:
${stats ? `
- Total Pertandingan: ${stats.totalMatches}
- Win Rate: ${stats.winRate}%
- Streak Saat Ini: ${stats.currentStreak.count} ${stats.currentStreak.type || 'none'}
- Streak Menang Terpanjang: ${stats.longestWinStreak}
- Skor Rata-rata: ${stats.averageScore}
- Form Terkini (5 match): ${recentMatches?.map((m: any) => m.isWinner ? 'W' : 'L').join('-') || 'N/A'}
` : 'Data performa belum tersedia'}

PARTNER TERBAIK:
${partnerStats?.slice(0, 3).map((p: any) => `- ${p.name}: ${p.winRate}% (${p.matches} match)`).join('\n') || 'Belum ada data partner'}

LAWAN YANG SERING DIHADAPI:
${opponentStats?.slice(0, 3).map((o: any) => `- ${o.name}: Record ${o.wins}W-${o.losses}L`).join('\n') || 'Belum ada data lawan'}

KELEMAHAN YANG TERIDENTIFIKASI:
${existingWeaknesses.length > 0 
  ? existingWeaknesses.map(w => `- ${w.weakness_type} (${w.severity}): ${w.description}`).join('\n')
  : 'Belum ada kelemahan yang teridentifikasi'}

GOAL AKTIF:
${activeGoals.length > 0
  ? activeGoals.map(g => `- ${g.goal_title}: ${g.progress_percentage}% tercapai`).join('\n')
  : 'Belum ada goal aktif'}

REKOMENDASI TRAINING PENDING:
${pendingRecommendations.length > 0
  ? pendingRecommendations.map(r => `- ${r.title} (${r.priority} priority)`).join('\n')
  : 'Tidak ada rekomendasi pending'}

RIWAYAT PERCAKAPAN (3 terakhir):
${sessionHistory?.slice(-3).map((s: any) => `User: ${s.query}\nCoach: ${s.response}`).join('\n\n') || 'Ini percakapan pertama'}

PERTANYAAN PEMAIN: "${query}"

TUGAS ANDA:
1. Analisis pertanyaan dan data performa
2. Identifikasi kelemahan/masalah (jika ada)
3. Berikan saran yang SPESIFIK dan ACTIONABLE
4. Rekomendasikan video training yang relevan
5. Suggest goal baru (jika perlu)
6. Motivasi dengan data konkret

FORMAT RESPONS JSON:
{
  "response": "Jawaban conversational yang natural dan motivasi (2-4 paragraf)",
  "actionItems": [
    {
      "title": "Judul action item",
      "description": "Deskripsi spesifik apa yang harus dilakukan",
      "priority": "high" | "medium" | "low",
      "timeframe": "1 minggu" | "2 minggu" | "1 bulan"
    }
  ],
  "videoRecommendations": [
    {
      "category": "backhand" | "defense" | "smash" | "footwork" | "net_play" | "stamina",
      "reason": "Kenapa video ini relevan",
      "priority": "high" | "medium" | "low"
    }
  ],
  "weaknessIdentified": {
    "type": "backhand" | "defense" | "stamina" | "net_play" | "smash" | "footwork" | null,
    "severity": "critical" | "moderate" | "minor",
    "description": "Deskripsi kelemahan yang teridentifikasi"
  },
  "goalSuggestion": {
    "title": "Judul goal yang disarankan",
    "targetValue": 80,
    "targetDate": "2026-03-15",
    "type": "win_rate" | "matches_played" | "skill_improvement"
  },
  "motivationalQuote": "Quote motivasi singkat"
}

CONTOH RESPONS YANG BAGUS:
Pertanyaan: "Aku sering kalah dari lawan yang agresif, kenapa ya?"

Response:
"Dari data performa Anda, saya lihat win rate turun 20% saat menghadapi pemain dengan playstyle agresif. Ini normal! Pemain agresif memaksa Anda bermain di posisi defense terus-menerus, dan dari 10 match terakhir, 70% kekalahan terjadi karena defense yang kurang solid.

Masalahnya bukan Anda tidak bisa defense, tapi positioning dan reaction time yang perlu ditingkatkan. Saya rekomendasikan fokus ke 3 hal:

1. **Defense Positioning**: Tonton video 'Defense Positioning Basics' yang saya rekomendasikan. Latihlah stance yang benar agar Anda bisa react lebih cepat ke smash lawan.

2. **Fast Reaction Drills**: Lakukan drill defense reaction 3x seminggu. Partner dengan [nama partner terbaik] yang punya smash kuat untuk sparring.

3. **Counter Attack**: Jangan hanya bertahan! Setelah defense solid, pelajari timing untuk counter-attack. Ini akan membuat lawan agresif jadi ragu.

Target realistis: Dalam 2 minggu, tingkatkan win rate vs pemain agresif dari 30% ke 50%. Saya akan monitor progress Anda!"

Respond HANYA dengan JSON yang valid (tanpa markdown).`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(contextPrompt);
    const text = result.response.text();
    
    let coachingResponse;
    try {
      coachingResponse = JSON.parse(text);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      coachingResponse = {
        response: text,
        actionItems: [],
        videoRecommendations: [],
        weaknessIdentified: null,
        goalSuggestion: null,
        motivationalQuote: "Terus berlatih, hasil tidak akan mengkhianati usaha!"
      };
    }

    // Map video recommendations to actual URLs
    const videoRecommendationsWithUrls = coachingResponse.videoRecommendations?.map((rec: any) => {
      const category = rec.category || 'defense';
      const videos = TRAINING_VIDEOS[category as keyof typeof TRAINING_VIDEOS] || [];
      const recommendedVideo = videos[0]; // Take first video for simplicity
      
      return {
        ...rec,
        title: recommendedVideo?.title || 'Training Video',
        url: recommendedVideo?.url || '#',
        difficulty: recommendedVideo?.difficulty || 'beginner',
      };
    }) || [];

    // Save coaching session to database
    await supabase
      .from('coaching_sessions')
      .insert({
        user_id: userId,
        query: query,
        response: coachingResponse.response,
        insights: coachingResponse,
      });

    // If weakness identified, save it
    if (coachingResponse.weaknessIdentified?.type) {
      await supabase
        .from('identified_weaknesses')
        .insert({
          user_id: userId,
          weakness_type: coachingResponse.weaknessIdentified.type,
          severity: coachingResponse.weaknessIdentified.severity,
          description: coachingResponse.weaknessIdentified.description,
        });
    }

    // If goal suggested, save it
    if (coachingResponse.goalSuggestion?.title) {
      await supabase
        .from('training_goals')
        .insert({
          user_id: userId,
          goal_type: coachingResponse.goalSuggestion.type,
          goal_title: coachingResponse.goalSuggestion.title,
          target_value: coachingResponse.goalSuggestion.targetValue,
          target_date: coachingResponse.goalSuggestion.targetDate,
        });
    }

    // Save training recommendations
    if (videoRecommendationsWithUrls.length > 0) {
      const recommendations = videoRecommendationsWithUrls.map((video: any) => ({
        user_id: userId,
        recommendation_type: 'video',
        title: video.title,
        description: video.reason,
        video_url: video.url,
        priority: video.priority,
      }));
      
      await supabase
        .from('training_recommendations')
        .insert(recommendations);
    }

    return NextResponse.json({
      success: true,
      response: coachingResponse.response,
      actionItems: coachingResponse.actionItems || [],
      videoRecommendations: videoRecommendationsWithUrls,
      weaknessIdentified: coachingResponse.weaknessIdentified,
      goalSuggestion: coachingResponse.goalSuggestion,
      motivationalQuote: coachingResponse.motivationalQuote,
    });

  } catch (error: any) {
    console.error('Dlob Coach Agent Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process coaching request',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
