import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { analyzeMatchHistory } from '@/lib/matchAnalytics';
import {
  retrieveRelevantMemory,
  extractAndSaveMemories,
  getUserMemoryGraph,
  clearUserMemories,
} from '@/lib/coachMemory';

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

// Training video database with verified Indonesian creator YouTube tutorials
const TRAINING_VIDEOS = {
  backhand: [
    { title: 'Tips Backhand Masterclass (Taufik Hidayat)', url: 'https://www.youtube.com/watch?v=4euRuqBt_2A', difficulty: 'beginner' },
    { title: 'Tutorial Bermain Bulutangkis: Backhand (PB Djarum)', url: 'https://www.youtube.com/watch?v=4euRuqBt_2A', difficulty: 'intermediate' },
  ],
  defense: [
    { title: 'Teknik Dasar & Defense Solid (PB Djarum)', url: 'https://www.youtube.com/watch?v=Q50ZQXe_pwI', difficulty: 'beginner' },
    { title: 'Kuda-Kuda Rendah Menahan Smash (PB Djarum)', url: 'https://www.youtube.com/watch?v=Q50ZQXe_pwI', difficulty: 'intermediate' },
  ],
  smash: [
    { title: 'Teknik Pukulan Smash Badminton (Tontowi Ahmad)', url: 'https://www.youtube.com/watch?v=5YebKbCMCdc', difficulty: 'intermediate' },
    { title: 'Power Smash & Timing Menukik (Tontowi Ahmad)', url: 'https://www.youtube.com/watch?v=5YebKbCMCdc', difficulty: 'advanced' },
  ],
  footwork: [
    { title: 'Tutorial Footwork 6 Sudut Lapangan (PB Djarum)', url: 'https://www.youtube.com/watch?v=79ZyEif8Mfg', difficulty: 'beginner' },
    { title: 'Pola Langkah & Split Step Responsif (PB Djarum)', url: 'https://www.youtube.com/watch?v=79ZyEif8Mfg', difficulty: 'intermediate' },
  ],
  net_play: [
    { title: 'Tips Cara Melakukan Netting yang Benar (PB Djarum)', url: 'https://www.youtube.com/watch?v=7LxH9Dy8mrc', difficulty: 'intermediate' },
    { title: 'Seni Spinning Net Shot & Tipuan Halus (PB Djarum)', url: 'https://www.youtube.com/watch?v=7LxH9Dy8mrc', difficulty: 'advanced' },
  ],
  stamina: [
    { title: 'Latihan Fisik Atlet Bulutangkis Terarah (PB Djarum)', url: 'https://www.youtube.com/watch?v=xOAPTiVcu-g', difficulty: 'beginner' },
    { title: 'Kardio & Kelincahan Lapangan Intensif (PB Djarum)', url: 'https://www.youtube.com/watch?v=xOAPTiVcu-g', difficulty: 'intermediate' },
  ],
};

function normalizeQuery(q: string): string {
  return (q || '')
    .toLowerCase()
    .replace(/[?!.,;:_]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      userId,
      memberName,
      sessionId,
      stats,
      partnerStats,
      opponentStats,
      recentMatches,
      completedDrills,
      videoAnalysisContext,
      forceRefresh,
    } = body;

    console.log('[Coach Agent] Received request:', {
      query: query?.substring(0, 50),
      userId,
      memberName,
      sessionId,
      forceRefresh: !!forceRefresh,
      completedDrillsCount: completedDrills ? (Array.isArray(completedDrills) ? completedDrills.length : Object.keys(completedDrills).length) : 0,
    });

    if (!query || (!userId && !memberName)) {
      return NextResponse.json(
        { error: 'Query and either userId or memberName are required' },
        { status: 400 }
      );
    }

    // Fetch coaching session history from database for continuity (including rich insights)
    let sessionHistory: any[] = [];
    if (userId) {
      try {
        const { data: sessions, error } = await supabase
          .from('coaching_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(8); // Last 8 sessions for deep context

        if (error) {
          console.warn('[Coach Agent] Error fetching session history:', error);
        } else {
          sessionHistory = sessions?.map(s => ({
            id: s.id,
            query: s.query,
            response: s.response,
            responseType: s.insights?.responseType || s.response_type || 'provide_analysis',
            timestamp: s.created_at,
            keyFinding: s.insights?.keyFinding || s.key_finding || null,
            actionItems: s.insights?.actionItems || s.action_items || [],
            expectedResults: s.insights?.expectedResults || s.expected_results || null,
            weaknessOptions: s.insights?.weaknessOptions || s.weakness_options || [],
            insights: s.insights || null,
          })) || [];
          console.log('[Coach Agent] Loaded structured session history:', sessionHistory.length, 'sessions');
        }
      } catch (error) {
        console.error('[Coach Agent] Failed to fetch session history:', error);
      }
    }

    // Fetch Knowledge Graph persistent memory for deep structured recall
    let memoryContextData: any = null;
    let memoryPromptContext = '';
    if (userId) {
      try {
        memoryContextData = await retrieveRelevantMemory(supabase, userId, query);
        memoryPromptContext = memoryContextData.contextText || '';
        if (memoryContextData.entities.length > 0) {
          console.log(`[Coach Agent] 🧠 Knowledge Graph retrieved ${memoryContextData.entities.length} entities for user ${userId}`);
        }
      } catch (memErr) {
        console.warn('[Coach Agent] Error retrieving knowledge graph memory:', memErr);
      }
    }

    // Fetch real match analytics if memberName or userId provided
    let matchAnalytics: any = null;
    if (memberName || userId) {
      try {
        console.log('[Coach Agent] Fetching match analytics for:', { memberName, userId });
        matchAnalytics = await analyzeMatchHistory(memberName, userId);
        console.log('[Coach Agent] Match analytics received:', {
          totalMatches: matchAnalytics.totalMatches,
          winRate: matchAnalytics.overallStats.winRate,
          latestMatchDate: matchAnalytics.latestMatchDate,
          hasAnalytics: !!matchAnalytics,
        });
      } catch (error) {
        console.error('[Coach Agent] Error fetching match analytics:', error);
      }
    }

    // ── SMART TOKEN CACHING & DEDUPLICATION ──
    // If user asks the same question and no new matches have been logged since last session, return cached (0 token burn)
    if (!forceRefresh && userId && sessionHistory.length > 0) {
      const normCurrentQuery = normalizeQuery(query);
      const cachedMatch = sessionHistory.find(s => {
        const normPastQuery = normalizeQuery(s.query || '');
        return normPastQuery === normCurrentQuery;
      });

      if (cachedMatch) {
        const sessionTime = new Date(cachedMatch.timestamp).getTime();
        const latestMatchTime = matchAnalytics?.latestMatchDate ? new Date(matchAnalytics.latestMatchDate).getTime() : 0;
        const isWithinTtl = (Date.now() - sessionTime) < 24 * 60 * 60 * 1000; // 24 hours TTL
        const noNewMatchesSince = !matchAnalytics?.latestMatchDate || sessionTime >= latestMatchTime;

        if (noNewMatchesSince && isWithinTtl) {
          console.log(`[Coach Agent] ⚡ Cache HIT for query: "${query}". Zero tokens burned! (Cached at ${cachedMatch.timestamp})`);
          const actionItems = cachedMatch.actionItems || [];
          const trainingRecommendations = actionItems.map((item: any) => ({
            ...item,
            title: item.title || 'Training Video',
            url: '#',
            difficulty: 'intermediate',
          }));

          return NextResponse.json({
            success: true,
            responseType: cachedMatch.responseType,
            response: cachedMatch.response,
            keyFinding: cachedMatch.keyFinding,
            actionItems: cachedMatch.actionItems,
            expectedResults: cachedMatch.expectedResults,
            weaknessOptions: cachedMatch.weaknessOptions,
            trainingRecommendations,
            isCached: true,
            cachedAt: cachedMatch.timestamp,
            tokensBurned: 0,
          });
        } else {
          console.log(`[Coach Agent] Cache MISS or invalidated (new match: ${!noNewMatchesSince}, expired: ${!isWithinTtl})`);
        }
      }
    }

    // ── PROGRESSION & MATCH DELTA CALCULATION ──
    let matchDeltaContext = '';
    if (sessionHistory.length > 0 && matchAnalytics?.rawMatches && matchAnalytics.rawMatches.length > 0) {
      const previousSession = sessionHistory[0];
      const prevSessionTime = new Date(previousSession.timestamp).getTime();
      
      const matchesAfter = matchAnalytics.rawMatches.filter(
        (m: any) => new Date(m.matchDate).getTime() > prevSessionTime
      );
      const matchesBefore = matchAnalytics.rawMatches.filter(
        (m: any) => new Date(m.matchDate).getTime() <= prevSessionTime
      );

      if (matchesAfter.length > 0) {
        const winsAfter = matchesAfter.filter((m: any) => m.isWinner).length;
        const wrAfter = Math.round((winsAfter / matchesAfter.length) * 100);
        const winsBefore = matchesBefore.filter((m: any) => m.isWinner).length;
        const wrBefore = matchesBefore.length > 0 ? Math.round((winsBefore / matchesBefore.length) * 100) : 0;
        const diff = wrAfter - wrBefore;
        const diffStr = diff >= 0 ? `+${diff}%` : `${diff}%`;

        matchDeltaContext = `
📊 DATA PERFORMA NYATA SEJAK SESI SEBELUMNYA (${new Date(previousSession.timestamp).toLocaleDateString('id-ID')}):
- Pertandingan baru yang dimainkan sejak sesi terakhir: ${matchesAfter.length} pertandingan (${winsAfter} Menang, ${matchesAfter.length - winsAfter} Kalah)
- Win Rate pertandingan baru: ${wrAfter}% (dibandingkan win rate sebelumnya ${wrBefore}% → tren ${diffStr})
- Evaluasi Taktis: ${diff >= 0 ? 'Pemain menunjukkan perbaikan nyata di lapangan setelah sesi lalu! Berikan apresiasi dan bawa ke level tantangan berikutnya (Progressive Overload).' : 'Pemain masih menemui kesulitan di pertandingan baru. Evaluasi penyebabnya dengan empati dan sesuaikan fokus drill agar lebih mudah dikuasai.'}
`;
      } else {
        matchDeltaContext = `
📊 STATUS MATCH SEJAK SESI SEBELUMNYA (${new Date(previousSession.timestamp).toLocaleDateString('id-ID')}):
- Belum ada pertandingan baru tercatat sejak sesi terakhir (${new Date(previousSession.timestamp).toLocaleDateString('id-ID')}). Pemain sedang dalam fase penguasaan drill mandiri.
`;
      }
    }

    // ── STATUS DRILL LATIHAN YANG DISELESAIKAN PEMAIN ──
    let completedDrillsContext = '';
    let completedList: string[] = [];
    if (completedDrills) {
      if (Array.isArray(completedDrills)) {
        completedList = completedDrills;
      } else if (typeof completedDrills === 'object') {
        completedList = Object.keys(completedDrills).filter(k => Boolean(completedDrills[k]));
      }
    }

    const drillNameMap: Record<string, string> = {
      drill_smash_power: '💥 Latihan Tenaga & Akurasi Smash (Senin)',
      drill_backhand_clear: '🎾 Penguatan Backhand Clear & Grip Switch (Selasa)',
      drill_footwork_corners: '🏃 Footwork 6 Titik Sudut & Split Step (Rabu)',
      drill_net_spin: '🎯 Net Play Tipis & Net Kill (Kamis)',
      drill_defense_reaction: '🛡️ Reflex Pertahanan Smash Cepat (Jumat)',
      drill_serve_variation: '🏸 Variasi Servis Pendek & Flick (Sabtu)',
      drill_match_simulation: '🏆 Simulasi Pertandingan & Evaluasi Taktis (Minggu)',
    };

    if (completedList.length > 0) {
      const formattedList = completedList.map(id => drillNameMap[id] || id);
      completedDrillsContext = `
🏋️ DRILL LATIHAN YANG SUDAH BERHASIL DISELESAIKAN PEMAIN:
${formattedList.map(d => `- ✓ ${d}`).join('\n')}
(PENTING: Apresiasi dedikasi pemain dalam menyelesaikan latihan ini, dan rancang tahapan drill berikutnya yang melengkapi latihan ini!)
`;
    } else {
      completedDrillsContext = `
🏋️ STATUS DRILL MINGGUAN: Pemain belum menandai drill minggu ini sebagai selesai. Dorong pemain untuk mencoba drill pertama dengan repetisi ringan.
`;
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

    // Get user's recent video analyses from Supabase (member_video_analyses)
    let recentVideoAnalyses: any[] = [];
    if (userId) {
      try {
        const { data: vData } = await supabase
          .from('member_video_analyses')
          .select('stroke_type, overall_score, grade, doubles_metrics, court_radar, biomechanics, critical_fixes, coach_recommendation, analyzed_at')
          .eq('user_id', userId)
          .order('analyzed_at', { ascending: false })
          .limit(3);
        if (vData) recentVideoAnalyses = vData;
      } catch (vErr) {
        console.warn('[Coach Agent] Video analysis fetch error:', vErr);
      }
    }

    // Build Video Analysis Synthesis Context
    let videoSynthesisContext = '';
    if (videoAnalysisContext) {
      try {
        const strokeTypeStr = videoAnalysisContext.strokeType || 'Taktik Ganda';
        const scoreStr = videoAnalysisContext.overallScore ?? 80;
        const gradeStr = videoAnalysisContext.grade || 'A-';
        const modeStr = videoAnalysisContext.mode === 'doubles_tactics' ? 'Taktik & Rotasi Lapangan Ganda' : 'Biomekanik Pukulan Solo';

        let dmStr = '';
        if (videoAnalysisContext.doublesMetrics) {
          const dm = videoAnalysisContext.doublesMetrics;
          dmStr = `
- Formasi Dominan: ${dm.formationName || dm.formation || 'Formasi Ganda'}
- Skor Sinergi Rotasi: ${dm.synergyScore ?? 80}/100
- Efisiensi Tutup Lapangan: ${dm.coverageEfficiency ?? 75}% Area Aman
- Seam Defense (Garis Tengah): ${dm.seamDefense || 'Rapi'}
- Kecepatan Transisi: ${dm.transitionSpeed || 'Optimal'}`;
        }

        let blindspotStr = '';
        if (Array.isArray(videoAnalysisContext.courtRadar?.exposedZones)) {
          const exposed = videoAnalysisContext.courtRadar.exposedZones
            .filter((z: any) => z && z.status === 'exposed')
            .map((z: any) => `${z.name || z.zone || 'Zona'} (${z.note || 'rawan diserang'})`);
          blindspotStr = exposed.length > 0 ? exposed.join(', ') : 'Semua zona aman';
        } else {
          blindspotStr = 'Perlu menjaga koordinasi rotasi';
        }

        let fixesStr = '';
        if (Array.isArray(videoAnalysisContext.criticalFixes) && videoAnalysisContext.criticalFixes.length > 0) {
          fixesStr = `\n- Koreksi Kritis Pelatih: ${videoAnalysisContext.criticalFixes.join('; ')}`;
        }

        videoSynthesisContext = `
📹 HASIL REKAMAN ANALISIS VIDEO AKTIF (BARU SAJA DIANALISIS):
- Fokus / Taktik: ${strokeTypeStr}
- Skor Evaluasi: ${scoreStr}/100 (Grade: ${gradeStr})
- Mode: ${modeStr}${dmStr}
- Deteksi Celah / Blindspot Terbuka: ${blindspotStr}${fixesStr}
- Rekomendasi Awal: ${videoAnalysisContext.coachRecommendation || 'Tingkatkan latihan rotasi bertahap'}

CRITICAL COACHING INSTRUCTION:
Pemain sedang menanyakan hasil rekaman video ini. Anda WAJIB MENGHUBUNGKAN kelemahan taktis/spasial di video ini dengan riwayat pertandingan aktual pemain (${matchAnalytics?.totalMatches || 0} match, win rate ${finalStats?.winRate || 0}%) dan drill yang pernah diselesaikan! Jelaskan secara objektif mengapa celah rotasi di video ini menyebabkan mereka kehilangan poin di pertandingan sesungguhnya.
`;
      } catch (synthErr) {
        console.warn('[Coach Agent] Error building video synthesis context:', synthErr);
        videoSynthesisContext = `\n📹 Catatan Video Analisis: Fokus pada perbaikan taktik dan rotasi lapangan ganda.\n`;
      }
    } else if (Array.isArray(recentVideoAnalyses) && recentVideoAnalyses.length > 0) {
      try {
        videoSynthesisContext = `
📹 RIWAYAT REKAMAN VIDEO SEBELUMNYA DI SUPABASE (${recentVideoAnalyses.length} analisis):
${recentVideoAnalyses
  .map((v, i) => {
    const fixes = Array.isArray(v.critical_fixes)
      ? v.critical_fixes.slice(0, 2).join(', ')
      : typeof v.critical_fixes === 'string'
      ? v.critical_fixes
      : 'Perbaiki posisi';
    return `${i + 1}. [${v.analyzed_at ? new Date(v.analyzed_at).toLocaleDateString('id-ID') : 'Terbaru'}] ${v.stroke_type || 'Stroke'} - Skor ${v.overall_score || 80}/100 (${v.grade || 'A-'}). Koreksi: ${fixes}`;
  })
  .join('\n')}
`;
      } catch (recErr) {
        console.warn('[Coach Agent] Error formatting recent video analyses:', recErr);
      }
    }

    // Build context for AI with real match analytics
    const firstName = matchAnalytics?.memberName?.split(' ')[0] || memberName?.split(' ')[0] || memberName || 'Anda';
    const displayName = matchAnalytics?.memberName || memberName || 'Member';

    const contextPrompt = `
SISTEM: Anda adalah "Dlob Coach Agent" - pelatih bulu tangkis virtual yang personal, motivasi, dan actionable.
Anda memiliki akses ke riwayat pertandingan REAL dan data performa ACTUAL member.

🎯 NAMA PEMAIN ANDA SAAT INI: ${displayName} (panggil dengan "${firstName}" atau "Anda")
CRITICAL: JANGAN PERNAH gunakan placeholder seperti [Nama Member], [X], [Y], atau [tanda kurung]. Selalu gunakan nama asli "${firstName}" atau "Anda"!
CRITICAL: JANGAN PERNAH menyebut nama model "Gemini", "Google", "LLM", atau teknologi AI yang mendasarinya. Identitas Anda adalah 100% "DLOB AI Coach" (Pelatih Resmi DLOB Community).

ATURAN KOMUNIKASI:
- SELALU panggil pemain dengan nama "${firstName}" atau "Anda" - BUKAN placeholder apapun
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

📝 RIWAYAT LENGKAP COACHING TERAKHIR (Untuk Kontinuitas, Evaluasi, & Pembelajaran Bertahap):
${sessionHistory && sessionHistory.length > 0 ? 
  sessionHistory.slice(0, 3).map((s: any, idx: number) => `
[Sesi ${idx + 1} - ${new Date(s.timestamp).toLocaleDateString('id-ID')}]
- Pertanyaan Pemain: "${s.query}"
- Key Finding Lalu: ${s.keyFinding?.title || 'Analisis umum'} (Severity: ${s.keyFinding?.severity || 'N/A'})
- Action Items / Drill yang Pernah Ditugaskan:
${(s.actionItems || []).map((a: any) => `  * ${a.title}: ${a.description} (Target: ${a.expectedOutcome || 'N/A'})`).join('\n') || '  (Tidak ada drill terstruktur)'}
- Target Metrik Lalu: ${s.expectedResults?.target || 'N/A'}
- Ringkasan Respons Coach Lalu: "${s.response ? s.response.substring(0, 250) + '...' : 'N/A'}"`).join('\n---\n')
  : 'Ini percakapan PERTAMA kita - Belum ada riwayat sesi sebelumnya'}

${matchDeltaContext}
${completedDrillsContext}
${memoryPromptContext}

🧠 KONTINUITAS & PROGRESSIVE LEARNING (SANGAT PENTING):
- Jika ini sesi lanjutan (ada riwayat sesi sebelumnya): Anda WAJIB MENGAKUI dan MENGHUBUNGKAN sesi ini dengan apa yang telah dibahas dan dilatih sebelumnya.
- Jika pemain telah menyelesaikan drill atau data match delta menunjukkan win rate membaik:
  → Berikan apresiasi spesifik atas dedikasi dan peningkatan di lapangan.
  → Rekomendasikan TAHAP LANJUTAN (Progressive Overload / Fase 2) dengan tantangan teknis atau intensitas yang lebih tinggi.
- Jika hasil pertandingan baru belum membaik:
  → Bedah faktor penentu secara mendalam (misal timing footwork, antisipasi, ketenangan di poin kritis) dan berikan koreksi taktis mikro.
- Di dalam field 'response', WAJIB sertakan section:
  ### **🎯 Langkah Lanjutan Berikutnya (Next Progression):**
  Rancang 2-3 langkah konkret untuk dieksekusi pemain mulai hari ini hingga sesi evaluasi berikutnya.

💡 KONTEKS UNTUK KONTINUITAS:
- Apakah user membahas weakness yang SAMA dengan session sebelumnya? Jika ya, progress apa yang sudah dibuat?
- Apakah ada action items dari session lalu yang belum diselesaikan? Tanyakan progressnya!
- Jika user mencoba weakness baru, acknowledge dan bandingkan dengan pola sebelumnya
- Gunakan riwayat untuk membangun relationship continuity - tunjukkan kamu MENGINGAT pembicaraan lalu
${videoSynthesisContext}
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
  "response": "Penjelasan coach yang komprehensif, mendalam, menggunakan format Markdown kaya. WAJIB gunakan nama pemain nyata '${firstName}' (BUKAN [Nama Member] atau placeholder apapun). Format:\n\n${firstName}, rencana latihan **\"[Nama Program]\"** kamu telah berhasil dirancang...\n\n[Jika ada sesi lalu: Evaluasi capaian dari sesi sebelumnya, status drill yang selesai, dan data perkembangan pertandingan]\n\nBerikut ringkasan aksi yang harus dieksekusi untuk memastikan peningkatan [angka nyata]% dalam [waktu]:\n\n### **Roadmap Latihan: [Fokus Area]**\n*   **Minggu 1 (Fase Pengenalan):** [Penjelasan volume repetisi dan teknik dasar (*grip* & *swing*)]\n*   **Minggu 2 (Fase Pemantapan):** [Penjelasan intensitas dan repetisi lanjutan]\n\n### **Instruksi Eksekusi:**\n1.  **[Kunci Teknik Utama]:** [Penjelasan detail kualitas gerakan vs tenaga kasar]\n2.  **Tracking Mandiri:** [Panduan format pencatatan]\n3.  **Evaluasi:** [Arahan evaluasi berkala]\n\n### **🎯 Langkah Lanjutan Berikutnya (Next Progression):**\n[Jelaskan langkah konkret berikutnya: jika drill sebelumnya sudah dikuasai atau win rate membaik, rekomendasikan tantangan tingkat lanjut / progressive overload]\n\n### **Analisis Taktis Tambahan:**\n[Saran spesifik berdasarkan data mereka]\n\n**[Pertanyaan penutup interaktif?]**",
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


Respond HANYA dengan JSON yang valid (tanpa markdown codeblock wrapper). Nilai string di dalam field 'response' harus mengandung format rich Markdown (asterisks **, *, ### headers, dan numbered lists).

CONTOH RESPONSE YANG BAGUS (Action-Focused dengan Rich Markdown):
Q: "Apa yang perlu saya improve untuk lawan trio lawan?"
A: {
  "responseType": "provide_analysis",
  "keyFinding": {
    "severity": "critical",
    "title": "Anda 0% WR vs Lawan A, B, C",
    "stats": ["0 Win dari 5 Matches", "Defensive positioning gap di net", "Score sama (40.2 vs 40.2)"]
  },
  "response": "Adit, rencana taktis **\"Net Defense & Counter Execution\"** kamu telah disiapkan berdasarkan riwayat 5 pertandingan terakhir. Meskipun rekor saat ini masih tertinggal, celah ini sangat terukur dan bisa kita balikkan menjadi keunggulan.\n\nBerikut adalah ringkasan aksi yang harus kamu eksekusi untuk memastikan peningkatan 25-35% dalam dua minggu ke depan:\n\n### **Roadmap Latihan: Fokus Net Defense**\n*   **Minggu 1 (Fase Pengenalan):** Kamu akan fokus pada volume rendah (25 reps per drill) untuk memastikan teknik dasar (*neutral grip* dan *split step timing*) tepat sebelum masuk ke kecepatan penuh.\n*   **Minggu 2 (Fase Pemantapan):** Intensitas ditingkatkan menjadi 60% dengan penambahan repetisi (30 reps) untuk membangun reflek pertahanan dan daya tahan otot pergelangan tangan.\n\n### **Instruksi Eksekusi:**\n1.  **Jangan Over-swing:** Pada minggu pertama, fokuslah pada kualitas *tap* dan *block* raket di depan dada. Pertahanan kokoh lahir dari antisipasi efisien, bukan tenaga kasar.\n2.  **Tracking Mandiri:** Lakukan pencatatan sederhana di catatan HP setiap selesai latihan. Gunakan format ini:\n    *   *Hari [X]: [Nama Drill] - [Jumlah Repetisi Berhasil] / [Total Repetisi]*\n    *   *Catatan: (Apakah posisi raket sudah stabil di depan net?)*\n3.  **Evaluasi Berkala:** Kirimkan catatan mingguanmu kepada saya untuk penyesuaian intensitas drill.\n\n### **Analisis Taktis Tambahan:**\nBerdasarkan pola lawan yang sering mengeksploitasi area depan, selalu lakukan **shadow swing** selama 5 menit sebelum turun ke lapangan untuk mengunci memori otot *thumb grip* kamu.\n\n**Apakah kamu ingin saya menjelaskan drill khusus untuk mengantisipasi pukulan smash silang lawan, atau kamu ingin fokus memantapkan net defense terlebih dahulu?**",
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
  "response": "Adit, rencana latihan **\"Clutch Finish & Mental Pressure\"** kamu telah disusun berdasarkan evaluasi performa match ketat. Meskipun win rate di poin kritis masih 40%, perbedaan ini murni masalah eksekusi penutupan set, bukan skill gap.\n\nBerikut ringkasan aksi yang harus kamu eksekusi untuk memastikan peningkatan 55-60% dalam dua minggu ke depan:\n\n### **Roadmap Latihan: Fokus Penutupan Poin Kritis**\n*   **Minggu 1 (Fase Pengenalan):** Kamu akan fokus pada smash repetisi di bawah simulasi tekanan (18-18 hingga 20-20) untuk mengontrol desakan terburu-buru.\n*   **Minggu 2 (Fase Pemantapan):** Intensitas ditingkatkan menjadi 70% conversion rate dengan penekanan pada ketenangan rally panjang.\n\n### **Instruksi Eksekusi:**\n1.  **Jangan Terburu-buru Mematikan Kok:** Pada skor krusial di atas 18, utamakan bola aman yang menekan dibanding memaksakan smash spekulatif yang berisiko keluar.\n2.  **Tracking Mandiri:** Catat setiap kali kamu berhasil mengonversi set ketat di buku catatan latihan HP:\n    *   *Hari [X]: [Simulasi Skor Ketat] - [Jumlah Poin Berhasil] / [Total Percobaan]*\n    *   *Catatan: (Apakah emosi dan detak jantung tetap terkontrol?)*\n3.  **Evaluasi Berkala:** Kirimkan catatan mingguanmu agar kita bisa menyempurnakan strategi penempatan bola.\n\n### **Analisis Taktis Tambahan:**\nSebelum masuk ke game, luangkan 5 menit untuk **shadow footwork** dan visualisasi ketenangan saat match point. Ini akan memprogram alam bawah sadar kamu untuk tetap rileks.\n\n**Apakah kamu ingin fokus melatih variasi servis pendek di poin kritis, atau kamu lebih memilih memantapkan kesabaran rally belakang?**",
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

    const MODEL_CANDIDATES = [
      'gemini-3.5-flash-lite',  // Primary Tier 1: Ultra-fast (~800ms - 1.5s), generous quota
      'gemini-3-flash-preview', // Primary Tier 2: High intelligence & fast (~1.7s)
      'gemini-3.1-flash-lite',  // Secondary Fallback: Robust (~3.5s)
      'gemini-2.5-flash',       // Tertiary Fallback: Deep reasoning
    ];

    let text = '';
    let lastGenError: any = null;

    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            topK: 40,
            responseMimeType: 'application/json',
          },
        });

        // Strict 8s timeout per model to eliminate long hanging / freeze
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after 8000ms on ${modelName}`)), 8000)
        );

        const result: any = await Promise.race([
          model.generateContent(contextPrompt),
          timeoutPromise,
        ]);

        text = result.response.text();
        if (text) {
          console.log(`[Coach Agent] ✓ Successfully generated response using model: ${modelName}`);
          break;
        }
      } catch (genErr: any) {
        lastGenError = genErr;
        console.warn(`[Coach Agent] Model ${modelName} failed (${genErr?.status || genErr?.message?.slice(0, 80)}), trying next fallback...`);
      }
    }

    if (!text && lastGenError) {
      throw lastGenError;
    }

    console.log('[Coach Agent] Raw response (first 200 chars):', text.substring(0, 200));
    
    let coachingResponse: any;
    try {
      let cleaned = text.trim();
      // Remove markdown codeblock wrapper if present
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }
      // Extract from first { to last }
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      coachingResponse = JSON.parse(cleaned);
      console.log('[Coach Agent] ✓ JSON parsed successfully, has fields:', Object.keys(coachingResponse).join(', '));
    } catch (parseError) {
      // Fallback if JSON parsing fails - extract readable response rather than dumping raw JSON
      console.error('[Coach Agent] ⚠️ JSON parsing failed:', parseError instanceof Error ? parseError.message : String(parseError));
      console.log('[Coach Agent] Extracting response field from text');

      let extractedResponse = '';
      const responseMatch = text.match(/"response"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (responseMatch) {
        try {
          extractedResponse = JSON.parse(`"${responseMatch[1]}"`);
        } catch {
          extractedResponse = responseMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
      } else {
        extractedResponse = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      }

      coachingResponse = {
        responseType: 'provide_analysis',
        response: extractedResponse || text,
        keyFinding: {
          severity: 'moderate',
          title: 'Analisis Sesi Latihan',
          stats: ['Rencana taktis disiapkan'],
        },
        actionItems: [
          {
            title: 'Latihan Terarah',
            description: 'Pusatkan latihan pada konsistensi gerakan dan komunikasi rotasi.',
            priority: 'high',
            timeframe: '1 minggu',
            expectedOutcome: 'Peningkatan konsistensi rotasi di lapangan',
          },
        ],
        expectedResults: {
          timeframe: '1 minggu',
          target: 'Evaluasi peningkatan footwork',
          metric: 'Efisiensi rotasi',
        },
        weaknessOptions: [],
        weaknessIdentified: null,
        goalSuggestion: null,
        motivationalQuote: 'Terus berlatih, hasil tidak akan mengkhianati usaha!',
        videoRecommendations: [],
      };
    }

    // Map video recommendations to actual URLs
    const rawVideoRecs = Array.isArray(coachingResponse?.videoRecommendations)
      ? coachingResponse.videoRecommendations
      : [];
    const videoRecommendationsWithUrls = rawVideoRecs.map((rec: any) => {
      const category = rec?.category || 'defense';
      const videos = TRAINING_VIDEOS[category as keyof typeof TRAINING_VIDEOS] || [];
      const recommendedVideo = videos[0]; // Take first video for simplicity
      
      return {
        ...rec,
        title: recommendedVideo?.title || rec?.title || 'Training Video',
        url: recommendedVideo?.url || '#',
        difficulty: recommendedVideo?.difficulty || 'beginner',
      };
    });

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
    if (userId && coachingResponse.weaknessIdentified?.type) {
      try {
        await supabase
          .from('identified_weaknesses')
          .insert({
            user_id: userId,
            weakness_type: coachingResponse.weaknessIdentified.type,
            severity: coachingResponse.weaknessIdentified.severity,
            description: coachingResponse.weaknessIdentified.description,
          });
      } catch (wErr) {
        console.warn('[Coach Agent] Could not save identified weakness:', wErr);
      }
    }

    // If goal suggested, save it
    if (userId && coachingResponse.goalSuggestion?.title) {
      try {
        await supabase
          .from('training_goals')
          .insert({
            user_id: userId,
            goal_type: coachingResponse.goalSuggestion.type,
            goal_title: coachingResponse.goalSuggestion.title,
            target_value: coachingResponse.goalSuggestion.targetValue,
            target_date: coachingResponse.goalSuggestion.targetDate,
          });
      } catch (gErr) {
        console.warn('[Coach Agent] Could not save goal suggestion:', gErr);
      }
    }

    // Save training recommendations
    if (userId && videoRecommendationsWithUrls.length > 0) {
      try {
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
      } catch (rErr) {
        console.warn('[Coach Agent] Could not save training recommendations:', rErr);
      }
    }

    // Asynchronously trigger Knowledge Graph memory extraction & entity linking
    if (userId && coachingResponse?.response) {
      extractAndSaveMemories(
        supabase,
        userId,
        query,
        coachingResponse.response,
        coachingResponse,
        displayName,
        sessionId
      ).catch(e => console.warn('[Coach Agent] Background memory extraction error:', e));
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
      memoryContext: {
        totalRemembered: memoryContextData?.summary?.totalEntities || 0,
        entities: memoryContextData?.entities?.map((e: any) => ({
          name: e.name,
          type: e.entity_type,
          confidence: e.confidence,
          mentions: e.mention_count,
        })) || [],
        summary: memoryContextData?.summary || null,
      },
      isCached: false,
      tokensBurned: 1,
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

// Memory Inspection & Privacy Management Endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action') || 'get_memory';

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (action === 'clear_memory') {
      const cleared = await clearUserMemories(supabase, userId);
      return NextResponse.json({ success: cleared, message: 'Knowledge graph memory cleared' });
    }

    const graph = await getUserMemoryGraph(supabase, userId);
    return NextResponse.json({ success: true, graph });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
