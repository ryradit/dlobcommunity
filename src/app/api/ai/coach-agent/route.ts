import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { analyzeMatchHistory } from '@/lib/matchAnalytics';

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
    const { query, userId, memberName, sessionId, stats, partnerStats, opponentStats, recentMatches } = body;

    console.log('[Coach Agent] Received request:', { query: query?.substring(0, 50), userId, memberName, sessionId });

    if (!query || (!userId && !memberName)) {
      return NextResponse.json(
        { error: 'Query and either userId or memberName are required' },
        { status: 400 }
      );
    }

    // Fetch coaching session history from database for continuity
    let sessionHistory: any[] = [];
    if (userId) {
      try {
        const { data: sessions, error } = await supabase
          .from('coaching_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5); // Last 5 sessions for context

        if (error) {
          console.warn('[Coach Agent] Error fetching session history:', error);
        } else {
          sessionHistory = sessions?.map(s => ({
            query: s.query,
            response: s.response,
            responseType: s.response_type,
            timestamp: s.created_at,
          })) || [];
          console.log('[Coach Agent] Loaded session history:', sessionHistory.length, 'sessions');
        }
      } catch (error) {
        console.error('[Coach Agent] Failed to fetch session history:', error);
        // Continue without history
      }
    }

    // Fetch real match analytics if memberName or userId provided
    let matchAnalytics = null;
    if (memberName || userId) {
      try {
        console.log('[Coach Agent] Fetching match analytics for:', { memberName, userId });
        matchAnalytics = await analyzeMatchHistory(memberName, userId);
        console.log('[Coach Agent] Match analytics received:', {
          totalMatches: matchAnalytics.totalMatches,
          winRate: matchAnalytics.overallStats.winRate,
          hasAnalytics: !!matchAnalytics,
        });
      } catch (error) {
        console.error('[Coach Agent] Error fetching match analytics:', error);
        // Continue without match data
      }
    }

    // Use real analytics data, fallback to provided stats
    const finalStats = matchAnalytics?.overallStats
      ? {
          totalMatches: matchAnalytics.totalMatches,
          winRate: matchAnalytics.overallStats.winRate,
          currentStreak: matchAnalytics.currentStreak,
          longestWinStreak: matchAnalytics.longestWinStreak.count,
          averageScore: matchAnalytics.overallStats.averageScore,
          averageScoreAgainst: matchAnalytics.overallStats.averageScoreAgainst,
        }
      : stats;

    const finalPartnerStats = matchAnalytics?.partnerStats || partnerStats;
    const finalOpponentStats = matchAnalytics?.opponentStats || opponentStats;
    const finalRecentForm = matchAnalytics?.recentForm || recentMatches;

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

    // Build context for AI with real match analytics
    const contextPrompt = `
SISTEM: Anda adalah "Dlob Coach Agent" - pelatih bulu tangkis virtual yang personal, motivasi, dan actionable.
Anda memiliki akses ke riwayat pertandingan REAL dan data performa ACTUAL member.

ATURAN KOMUNIKASI:
- SELALU gunakan "Anda" untuk berbicara langsung ke pemain
- Gunakan Bahasa Indonesia yang natural dan motivasi
- Berikan saran yang SPESIFIK dan ACTIONABLE berdasarkan DATA ACTUAL
- Sertakan angka, statistik, dan pola dari match history mereka
- Tone: Supportive tapi jujur, seperti personal coach yang mengenal gaya bermain mereka

📊 PROFIL PERFORMA PEMAIN (Dari ${matchAnalytics ? matchAnalytics.totalMatches + ' match actual' : 'data yang tersedia'}):
${finalStats ? `
- Total Pertandingan: ${finalStats.totalMatches}
- Win Rate: ${finalStats.winRate}%
- Streak Saat Ini: ${finalStats.currentStreak.count}x ${finalStats.currentStreak.type || 'none'}
- Streak Menang Terpanjang: ${finalStats.longestWinStreak}x
- Skor Rata-rata: ${finalStats.averageScore} (Lawan: ${finalStats.averageScoreAgainst})
${matchAnalytics?.recentForm ? `- Form Terkini: ${matchAnalytics.recentForm.join('')}` : ''}
${matchAnalytics?.performanceTrends && matchAnalytics.performanceTrends.length > 0 ?
  `- Trend: ${matchAnalytics.performanceTrends[1]?.trend} (${matchAnalytics.performanceTrends[1]?.changePercent ?? 0 > 0 ? '+' : ''}${matchAnalytics.performanceTrends[1]?.changePercent}% bulan ini)` :
  ''}
` : 'Data performa belum tersedia'}

👥 PARTNER TERBAIK (Berdasarkan chemistry score):
${finalPartnerStats?.slice(0, 3).map((p: any) => `- ${p.name}: ${p.winRate}% WR (${p.totalMatches} match, chemistry: ${p.chemistry}/100)`).join('\n') || 'Belum ada data'}

⚠️ LAWAN YANG BERMASALAH (Difficulty rating):
${finalOpponentStats?.filter((o: any) => o.difficulty === 'hard').slice(0, 3).map((o: any) => `- ${o.name}: ${o.winRate}% WR (CRITICAL - Focus area!)`).join('\n') || 'Tidak ada lawan sulit teridentifikasi'}
${finalOpponentStats?.filter((o: any) => o.difficulty === 'easy').slice(0, 2).map((o: any) => `- ${o.name}: ${o.winRate}% WR (Strength - Keep it up!)`).join('\n') || ''}

🔴 KELEMAHAN TERIDENTIFIKASI (Dari match pattern analysis):
${matchAnalytics?.weakAreas && matchAnalytics.weakAreas.length > 0 ? matchAnalytics.weakAreas.map((w: any) => `- ${w.pattern} [${w.severity}] (${w.affectedMatches} match terdampak, WR: ${w.winRateInArea}%)`).join('\n') : 'Belum ada pola kelemahan teridentifikasi'}
${existingWeaknesses.length > 0 ? '\nDari input sebelumnya:\n' + existingWeaknesses.map(w => `- ${w.weakness_type}: ${w.description}`).join('\n') : ''}

💪 KEKUATAN (Berdasarkan match history):
${matchAnalytics?.strengths && matchAnalytics.strengths.length > 0 ? matchAnalytics.strengths.map((s: any) => `- ${s.pattern} (${s.affectedMatches} match)`).join('\n') : 'Terus cari pola kemenangan'}

🎯 GOAL AKTIF:
${activeGoals.length > 0
  ? activeGoals.map(g => `- ${g.goal_title}: ${g.progress_percentage}% tercapai`).join('\n')
  : 'Belum ada goal aktif - Recommend membuat goal baru!'}

📝 RIWAYAT PERCAKAPAN COACHING (5 sesi terakhir - UNTUK KONTINUITAS):
${sessionHistory && sessionHistory.length > 0 ? 
  sessionHistory.slice(0, 5).map((s: any, idx: number) => `
[Session ${idx + 1}] ${new Date(s.timestamp).toLocaleDateString('id-ID')}
User: "${s.query}"
Coach Response Type: ${s.responseType}
Summary: ${s.response ? s.response.substring(0, 100) + '...' : 'N/A'}`).join('\n---\n')
  : 'Ini percakapan PERTAMA kita - Belum ada riwayat sebelumnya'}

💡 KONTEKS UNTUK KONTINUITAS:
- Apakah user membahas weakness yang SAMA dengan session sebelumnya? Jika ya, progress apa yang sudah dibuat?
- Apakah ada action items dari session lalu yang belum diselesaikan? Tanyakan progressnya!
- Jika user mencoba weakness baru, acknowledge dan bandingkan dengan pola sebelumnya
- Gunakan riwayat untuk membangun relationship continuity - tunjukkan kamu MENGINGAT pembicaraan lalu

❓ PERTANYAAN PEMAIN SAAT INI:
"${query}"

✅ TUGAS ANDA:

🔴 PENTING: BACA QUERY DENGAN HATI-HATI!

JIKA PERTANYAAN DIMULAI DENGAN "analisis weakness:" atau "analisis weakness :"
(Contoh: "analisis weakness: Kesulitan Mengkonversi", "analisis weakness: Performa Melawan Wiwin")
→ USER SUDAH MEMILIH WEAKNESS SPESIFIK
→ LANGSUNG BERIKAN JENIS 2 (provide_analysis) - JANGAN BERTANYA LAGI!
→ Parse weakness name dari query dan analisis secara MENDALAM dengan data actual mereka
→ Match weakness name dengan weak areas dalam analytics data
→ Berikan keyFinding, actionItems, expectedResults yang SPECIFIC untuk weakness itu

JIKA PERTANYAAN TENTANG IMPROVEMENT/KELEMAHAN/APA YANG PERLU DITINGKATKAN (TANPA "analisis weakness:"):
(Contoh: "apa yang perlu ditingkatkan?", "mana kelemahan saya?", "weakness apa?")
- JANGAN langsung analisis mendalam
- Daripada, TANYAKAN weakness mana yang ingin di-explore
- Tampilkan "weaknessOptions" array dengan 3-4 pilihan weakness dari data mereka
- Setiap option adalah kelemahan yang terdeteksi dari match data mereka
- User akan memilih satu dengan format "analisis weakness: [weakness name]", kemudian Anda analyze secara mendalam

JIKA PERTANYAAN SPESIFIK LAINNYA (tentang opponent tertentu, metrik tertentu, goal tertentu, atau greeting):
- Langsung analisis dan berikan solusi
- Reference SPESIFIK pola/statistik dari data mereka

FORMAT RESPONS JSON - ADA DUA JENIS (ACTION-FOCUSED):

JENIS 1 - UNTUK PERTANYAAN GENERAL IMPROVEMENT (Progressive Disclosure):
{
  "responseType": "ask_weakness",
  "response": "Brief intro (1 kalimat) - minta user pilih weakness mana yang ingin dianalisis",
  "weaknessOptions": [
    {
      "id": "weakness_1",
      "title": "Nama kelemahan (e.g., 'Net Position vs Aggressive Opponents')",
      "description": "1-2 kalimat penjelasan dari match data mereka (e.g., '0% WR vs 3 lawan spesifik')",
      "severity": "critical" | "moderate" | "minor",
      "affectedMatches": 5,
      "impact": "Angka impact (e.g., '5 match terdampak, WR: 0%')"
    }
  ],
  "motivationalQuote": "Quote motivasi pendek"
}

JENIS 2 - UNTUK PERTANYAAN SPESIFIK (Action-Focused Format - PENTING!):
{
  "responseType": "provide_analysis",
  "keyFinding": {
    "severity": "critical" | "moderate" | "minor",
    "title": "Satu kalimat findings utama (e.g., 'Anda 0% WR vs opponent X')",
    "stats": [
      "Win Rate: X%",
      "Matches: X dari Y",
      "Root Cause: Singkat"
    ]
  },
  "response": "SINGKAT! Hanya 2-3 kalimat yang memotivasi + quick context (bukan panjang lebar!)",
  "actionItems": [
    {
      "title": "Spesifik drill/practice (PENDEK!)",
      "description": "Kenapa ini penting + target hasil singkat",
      "priority": "high" | "medium" | "low",
      "timeframe": "1 minggu" | "2 minggu" | "1 bulan",
      "expectedOutcome": "e.g., 'Target 20-30% WR improvement'"
    }
  ],
  "videoRecommendations": [
    {
      "category": "backhand" | "defense" | "smash" | "footwork" | "net_play" | "stamina",
      "reason": "Kenapa video ini cocok (1 kalimat)",
      "priority": "high" | "medium" | "low"
    }
  ],
  "expectedResults": {
    "timeframe": "2 minggu" | "1 bulan",
    "target": "Target spesifik (e.g., '30% WR')",
    "metric": "Metrik yang diukur"
  },
  "motivationalQuote": "Quote motivasi personal (singkat!)"
}


Respond HANYA dengan JSON yang valid (tanpa markdown).

CONTOH RESPONSE YANG BAGUS (Action-Focused):
Q: "Apa yang perlu saya improve untuk lawan trio lawan?"
A: {
  "responseType": "provide_analysis",
  "keyFinding": {
    "severity": "critical",
    "title": "Anda 0% WR vs Lawan A, B, C",
    "stats": ["0 Win dari 5 Matches", "Defensive positioning gap di net", "Score sama (40.2 vs 40.2)"]
  },
  "response": "Adit, patternnya jelas: mereka exploit net defense. Tapi ini fixable dalam 2 minggu with right drill!",
  "actionItems": [
    {
      "title": "Net positioning drill - 30 min daily",
      "description": "Close gaps saat lawan serang net. Video di bawah.",
      "priority": "high",
      "timeframe": "1 minggu",
      "expectedOutcome": "Defensive consistency +40%"
    },
    {
      "title": "Study opponent timing pattern",
      "description": "Learn kapan mereka attack. Anticipate better.",
      "priority": "high",
      "timeframe": "1 minggu",
      "expectedOutcome": "Read opponent -1 step ahead"
    }
  ],
  "expectedResults": {
    "timeframe": "2 minggu",
    "target": "20-30% WR improvement",
    "metric": "Win rate vs trio"
  },
  "motivationalQuote": "Ini pattern fix, bukan skill gap. Tergantung drillmu aja!"
}

CONTOH PROGRESSIVE FLOW:
1. User: "Apa yang perlu saya improve?"
   → Coach: responseType="ask_weakness" dengan 3-4 pilihan weakness dari analytics mereka
   Contoh options: "Kesulitan Mengkonversi Pertandingan Ketat", "Performa vs Wiwin/Anan", "Net Play Defense", dst

2. User: "analisis weakness: Kesulitan Mengkonversi Pertandingan Ketat"
   → Coach: LANGSUNG responseType="provide_analysis" (JANGAN TANYA LAGI!)
   → Find matching weak area dari matchAnalytics.weakAreas
   → Berikan keyFinding, actionItems, expectedResults yang SPECIFIC untuk weakness itu
   
CONTOH JENIS 2 RESPONSE UNTUK "analisis weakness: Kesulitan Mengkonversi Pertandingan Ketat":
{
  "responseType": "provide_analysis",
  "keyFinding": {
    "severity": "critical",
    "title": "Skor rata-rata sama dengan lawan, tapi WR hanya 40%",
    "stats": [
      "5 match terdampak dari 5 match terakhir",
      "Average score sama: 40.2 vs 40.2",
      "Root cause: Inconsistent close-out di skor tinggi"
    ]
  },
  "response": "Adit, pattternnya jelas: Anda kesulitan break ties di pertandingan ketat. Bagusnya ini PURE execution issue, bukan skill gap - fixable dalam 2 minggu!",
  "actionItems": [
    {
      "title": "High-pressure smash practice - 20 min daily",
      "description": "Drill smash saat score tied (18-18, 19-19, 20-20). Target: convert 70% dari opportunities.",
      "priority": "high",
      "timeframe": "1 minggu",
      "expectedOutcome": "Convert rate dari 40% → 70% di score ketat"
    },
    {
      "title": "Mental conditioning - 10 min daily",
      "description": "Visualization technique saat score tied. Review film Taufik Lee Chong Wei moment2 closing out.",
      "priority": "high",
      "timeframe": "1 minggu",
      "expectedOutcome": "Composure +60% saat pressure moment"
    },
    {
      "title": "Opponent study - 3x seminggu",
      "description": "Analisis pola opponent saat push kemenangan. Apa timing favorit mereka attack saat score ketat?",
      "priority": "medium",
      "timeframe": "2 minggu",
      "expectedOutcome": "Anticipation accuracy +50%"
    }
  ],
  "expectedResults": {
    "timeframe": "2 minggu",
    "target": "55-60% WR (dari sebelumnya 40%)",
    "metric": "Win rate di pertandingan ketat (score ±5 points)"
  },
  "motivationalQuote": "Difference antara 40% dan 60% WR adalah mental, bukan physical. Uda bisa!"
}

---
PENGINGAT PENTING:
- JANGAN loop dengan "ask_weakness" jika user sudah kirim "analisis weakness: [name]"
- Parse weakness name dari query dengan case-insensitive matching
- Cari matching weak area dalam matchAnalytics.weakAreas atau opponentStats
- Jika weakness match dengan opponent tertentu (e.g., "vs Wiwin"), gunakan finalOpponentStats untuk detailed analysis
- Berikan CONCRETE actionItems, bukan generic advice
- Jangan tanya lagi, LANGSUNG solusi!`;

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
    
    console.log('[Coach Agent] Gemini raw response (first 200 chars):', text.substring(0, 200));
    
    let coachingResponse;
    try {
      coachingResponse = JSON.parse(text);
      console.log('[Coach Agent] ✓ JSON parsed successfully, has fields:', Object.keys(coachingResponse).join(', '));
    } catch (parseError) {
      // Fallback if JSON parsing fails - create structured response from text
      console.error('[Coach Agent] ⚠️ JSON parsing failed:', parseError instanceof Error ? parseError.message : String(parseError));
      console.log('[Coach Agent] Using text as fallback response');
      
      coachingResponse = {
        responseType: 'provide_analysis',
        response: text,
        keyFinding: {
          severity: 'moderate',
          title: 'Analysis',
          stats: ['Response generated but structured data unavailable'],
        },
        actionItems: [
          {
            title: 'Re-analyze request',
            description: 'Coach response generated but technical issue occurred',
            priority: 'high',
            timeframe: '1 minggu',
            expectedOutcome: 'Structured analysis will be available on next request',
          },
        ],
        expectedResults: {
          timeframe: '1 minggu',
          target: 'Complete coaching analysis',
          metric: 'Structured feedback',
        },
        weaknessOptions: [],
        weaknessIdentified: null,
        goalSuggestion: null,
        motivationalQuote: 'Terus berlatih, hasil tidak akan mengkhianati usaha!',
        videoRecommendations: [],
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

    // Save coaching session to database with complete structured data
    if (userId) {
      try {
        const savePayload = {
          user_id: userId,
          session_id: sessionId || null,
          member_name: memberName || null,
          query: query,
          response: coachingResponse.response,
          // Save ALL structured data in the insights JSONB column
          insights: {
            responseType: coachingResponse.responseType || 'provide_analysis',
            keyFinding: coachingResponse.keyFinding,
            actionItems: coachingResponse.actionItems,
            expectedResults: coachingResponse.expectedResults,
            weaknessOptions: coachingResponse.weaknessOptions,
            fullResponse: coachingResponse,
          },
          created_at: new Date().toISOString(),
        };

        console.log('[Coach Agent] 💾 Saving to Supabase with payload:', {
          user_id: savePayload.user_id,
          session_id: savePayload.session_id,
          member_name: savePayload.member_name,
          query_length: savePayload.query?.length,
          response_length: savePayload.response?.length,
          insights: {
            responseType: savePayload.insights.responseType,
            has_keyFinding: !!savePayload.insights.keyFinding,
            has_actionItems: !!savePayload.insights.actionItems && savePayload.insights.actionItems.length > 0,
            has_expectedResults: !!savePayload.insights.expectedResults,
            actionItems_count: savePayload.insights.actionItems?.length || 0,
          },
        });

        const { error: saveError } = await supabase
          .from('coaching_sessions')
          .insert(savePayload);

        if (saveError) {
          console.error('[Coach Agent] ❌ Error saving coaching session:', {
            code: saveError.code,
            message: saveError.message,
            hint: (saveError as any).hint,
            details: saveError.details,
          });
        } else {
          console.log('[Coach Agent] ✅ Coaching session saved successfully!', {
            sessionId,
            with_insights: {
              keyFinding: !!coachingResponse.keyFinding,
              actionItems: coachingResponse.actionItems?.length || 0,
              expectedResults: !!coachingResponse.expectedResults,
            },
          });
        }
      } catch (error) {
        console.error('[Coach Agent] ❌ Exception while saving coaching session:', error instanceof Error ? error.message : String(error));
      }
    } else {
      console.warn('[Coach Agent] ⚠️ No userId provided - coaching session NOT saved to database');
    }

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
      responseType: coachingResponse.responseType || 'provide_analysis', // 'ask_weakness' or 'provide_analysis'
      response: coachingResponse.response,
      keyFinding: coachingResponse.keyFinding, // New: Finding summary with stats
      weaknessOptions: coachingResponse.weaknessOptions || [], // For progressive disclosure
      actionItems: coachingResponse.actionItems || [],
      expectedResults: coachingResponse.expectedResults, // New: Expected outcomes
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
