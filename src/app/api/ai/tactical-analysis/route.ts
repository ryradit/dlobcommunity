import { NextRequest, NextResponse } from 'next/server';
import { getGenerativeModelWithFallback } from '@/lib/gemini';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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

function createHash(data: any): string {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // 1. Fetch Profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profileData?.full_name) {
      return NextResponse.json(
        { error: 'Profile not found or missing full name' },
        { status: 404 }
      );
    }

    // 2. Fetch all completed matches
    const { data: allMatchesData, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .not('winner', 'is', null)
      .order('match_date', { ascending: false });

    if (matchesError) {
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: 500 }
      );
    }

    const userNameLower = profileData.full_name.trim().toLowerCase();
    const userWords = userNameLower.split(/\s+/).filter((w: string) => w.length > 2);

    const matchesPlayerName = (dbPlayerName: string) => {
      if (!dbPlayerName) return false;
      const dbNameLower = dbPlayerName.trim().toLowerCase();
      if (dbNameLower === userNameLower) return true;
      const dbWords = dbNameLower.split(/\s+/).filter((w: string) => w.length > 2);
      return userWords.some((uw: string) => dbWords.includes(uw));
    };

    // Find the latest match
    const userMatch = allMatchesData.find((match: any) => {
      return matchesPlayerName(match.team1_player1) ||
             matchesPlayerName(match.team1_player2) ||
             matchesPlayerName(match.team2_player1) ||
             matchesPlayerName(match.team2_player2);
    });

    if (!userMatch) {
      return NextResponse.json({
        found: false,
        message: 'Belum ada data pertandingan terarsip untuk akun Anda.'
      });
    }

    // Prepare match details for analysis
    const isTeam1 = matchesPlayerName(userMatch.team1_player1) || matchesPlayerName(userMatch.team1_player2);
    const userTeam = isTeam1 ? 'team1' : 'team2';
    const isWinner = userMatch.winner === userTeam;
    
    const userScore = isTeam1 ? userMatch.team1_score : userMatch.team2_score;
    const opponentScore = isTeam1 ? userMatch.team2_score : userMatch.team1_score;

    let partner = '';
    let opponents: string[] = [];
    if (isTeam1) {
      const isP1User = matchesPlayerName(userMatch.team1_player1);
      partner = isP1User ? userMatch.team1_player2 : userMatch.team1_player1;
      opponents = [userMatch.team2_player1, userMatch.team2_player2].filter(Boolean);
    } else {
      const isP1User = matchesPlayerName(userMatch.team2_player1);
      partner = isP1User ? userMatch.team2_player2 : userMatch.team2_player1;
      opponents = [userMatch.team1_player1, userMatch.team1_player2].filter(Boolean);
    }

    const matchDetails = {
      matchId: userMatch.id,
      matchDate: userMatch.match_date,
      partner,
      opponents,
      isWinner,
      userScore,
      opponentScore,
    };

    // Hash match details for cache key
    const statsHash = 'tactical-' + createHash(matchDetails);

    // Check cache
    const { data: cachedInsight, error: cacheError } = await supabase
      .from('ai_insights')
      .select('response_data, expires_at')
      .eq('user_id', userId)
      .eq('insight_type', 'performance')
      .eq('stats_hash', statsHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedInsight && !cacheError) {
      console.log('✅ Returning cached tactical AI insights');
      return NextResponse.json({
        found: true,
        matchDetails,
        analysis: cachedInsight.response_data
      });
    }

    // Call Gemini
    const model = getGenerativeModelWithFallback({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
      systemInstruction: 'You are an elite professional badminton coach and tactical analyst. Always respond in Bahasa Indonesia using "Anda" (you) to directly address the player. Be concise, precise, and highly constructive. Limit the analysis to 2 sentences max.',
    });

    const prompt = `Analisis taktis pertandingan terakhir saya secara singkat dan padat (maksimal 2 kalimat).
    Detail Pertandingan:
    - Pemain (Saya): ${profileData.full_name}
    - Partner: ${partner || 'Tidak ada (Single)'}
    - Lawan: ${opponents.join(' & ')}
    - Hasil: ${isWinner ? 'MENANG' : 'KALAH'}
    - Skor Kami: ${userScore}
    - Skor Lawan: ${opponentScore}

    Berikan output dalam format JSON valid (tanpa markdown atau block code):
    {
      "analysis": "2 kalimat analisis taktis: 1 kalimat mengenai poin positif atau apa yang terjadi, dan 1 kalimat berupa instruksi taktis konkret untuk latihan ke depan. Gunakan kata ganti 'Anda' untuk menyapa saya.",
      "attackEfficiency": angka dari 50 hingga 95,
      "defenseSolidity": angka dari 50 hingga 95
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }
    
    const analysisResult = JSON.parse(jsonMatch[0]);

    // Save to cache
    await supabase
      .from('ai_insights')
      .upsert({
        user_id: userId,
        insight_type: 'performance',
        stats_hash: statsHash,
        response_data: analysisResult,
      }, {
        onConflict: 'user_id,insight_type,stats_hash'
      });

    return NextResponse.json({
      found: true,
      matchDetails,
      analysis: analysisResult
    });

  } catch (error: any) {
    console.error('AI Tactical Analysis Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate tactical analysis',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
