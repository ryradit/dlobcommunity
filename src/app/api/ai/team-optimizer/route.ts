import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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

function createHash(data: any): string {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerStats, mode, numTeams, userId, tournamentType } = body;

    if (!playerStats || !mode) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Create hash for caching
    const statsHash = createHash({ playerStats, mode, numTeams });
    console.log('🔍 Team optimizer hash:', statsHash);

    // Check cache
    if (userId) {
      const { data: cachedResult, error: cacheError } = await supabase
        .from('ai_insights')
        .select('response_data, expires_at')
        .eq('user_id', userId)
        .eq('insight_type', 'team_optimizer')
        .eq('stats_hash', statsHash)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cacheError) {
        console.log('⚠️ Cache lookup error:', cacheError.message);
      }

      if (cachedResult && !cacheError) {
        console.log('✅ Returning cached team optimization');
        return NextResponse.json(cachedResult.response_data);
      } else {
        console.log('🔄 No cache found, generating new team composition...');
      }
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
      },
      systemInstruction: 'You are a badminton team composition expert. Always respond in Bahasa Indonesia for descriptions. Analyze partnerships and suggest optimal team pairings.',
    });

    const modeDescriptions = {
      balanced: 'Buat tim yang seimbang dengan skill level merata',
      competitive: 'Maksimalkan kekuatan tim untuk kompetisi',
      training: 'Campur pemain berpengalaman dengan pemula untuk pembelajaran',
      exciting: 'Buat pertandingan yang seru dan kompetitif'
    };

    const tournamentStrategy = tournamentType === 'internal'
      ? `STRATEGI TURNAMEN INTERNAL (Kompetisi Adil & Seimbang):
        - Prioritas: Ciptakan pertandingan yang FAIR dan COMPETITIVE
        - Hindari menempatkan semua pemain terbaik di satu tim
        - Fokus pada CHEMISTRY terbukti dari history (bukan asumsi)
        - Pastikan AI untuk BALANCE: setiap tim harus punya peluang menang 45-55%
        - Rekomendasi: Mix hot players dengan stable players untuk keseimbangan`
      : `STRATEGI TURNAMEN EKSTERNAL (Maksimalkan Kemenangan):
        - Prioritas: Pilih PEMAIN TERBAIK + PARTNERSHIP TERBUKTI KUAT
        - Fokus pada WINNING composition, bukan balance
        - Gunakan hot players (form➚) PERTAMA, hindari slump players
        - Partnership: ONLY gunakan yang proven (80%+ WR, 3+ matches)
        - Target: Tim dengan 70%+ win probability melawan kompetitor eksternal`;

    const playerDataSummary = playerStats.map((p: any) => `
- **${p.name}**:
  * Win Rate: ${p.winRate}% (${p.totalMatches} matches) | Recent: ${p.recentWinRate}%
  * Skill Level: ${p.skillLevel}/100 | Trend: ${p.skillTrendDirection || 'unknown'}
  * Form Status: ${p.formTrend || 'unknown'} (${p.formTrendPercentage >= 0 ? '+' : ''}${p.formTrendPercentage || 0}%)
  * Partnership Quality: ${p.partnershipQuality || 'N/A'}
  * Last Match: ${p.lastMatchDate ? new Date(p.lastMatchDate).toLocaleDateString('id-ID') : 'No recent matches'}
  * Matches Last Month: ${p.matchesLastMonth || 0}
  * BEST PARTNERSHIPS (proven chemistry):
${p.bestPartners && p.bestPartners.length > 0 
  ? p.bestPartners.map((bp: any, idx: number) => 
      `    ${idx + 1}. ${bp.partner}: ${bp.winRate}% WR (${bp.matches} games together) ${bp.matches >= 3 ? '✓ RELIABLE' : '🔄 DEVELOPING'}`
    ).join('\n')
  : '    • Belum ada partnership terbukti'}
  * WORST PARTNERSHIPS (to avoid):
${p.worstPartners && p.worstPartners.length > 0 
  ? p.worstPartners.map((wp: any) => 
      `    ❌ ${wp.partner}: ${wp.winRate}% WR (${wp.matches} games)`
    ).join('\n')
  : '    • Tidak ada partnership yang buruk'}
  * Recent Matches Performance:
${p.recentMatches && p.recentMatches.length > 0
  ? p.recentMatches.map((rm: any) => 
      `    ${rm.won ? '✅' : '❌'} ${rm.score} vs ${rm.opponent}`
    ).join('\n')
  : '    • Belum ada pertandingan terakhir'}`).join('\n');

    const prompt = `PENTING: Semua deskripsi dan insight HARUS dalam Bahasa Indonesia.

Kamu adalah ahli BADMINTON composition. Analisis data pemain MENDALAM dan buat komposisi tim yang OPTIMAL.

TOURNAMENT TYPE: ${tournamentType?.toUpperCase() || 'BALANCED'}
${tournamentStrategy}

MODE: ${mode} - ${modeDescriptions[mode as keyof typeof modeDescriptions]}
JUMLAH TIM: ${numTeams || 'auto'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADVANCED PLAYER DATA (Berdasarkan FULL HISTORY):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${playerDataSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL COMPOSITION RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. CHEMISTRY PRIORITY:
   - ✓ Gunakan PROVEN partnerships (3+ matches, 60%+ WR) PERTAMA
   - ✗ Hindari worst partnerships sama sekali
   - 🔄 Untuk partnerships baru: pair dengan pemain experienced

2. FORM & RECENCY PRIORITY (${tournamentType === 'external' ? 'CRITICAL FOR EXTERNAL' : 'for fairness'}):
   - 🔥 HOT players (form↑) → Prioritas tinggi
   - ⚠️  SLUMP players → Hindari untuk external, seimbangkan untuk internal
   - 📊 STABLE players → Default pilihan yang reliable
   - 📅 Recent activity-nya > Inactive players untuk momentum

3. SKILL LEVEL STRATEGY:
   ${mode === 'balanced' ? '- Mix tiers: high (70+) + mid (40-70) + low (< 40) untuk fairness' : ''}
   ${mode === 'competitive' ? '- Dominasi dengan high skill (70+), minimize low skill (<40)' : ''}
   ${mode === 'training' ? '- Pair experienced (most matches) dengan newcomers (0-5 matches)' : ''}
   ${mode === 'exciting' ? '- Balance skill: setiap tim 50-50 winRate prediction' : ''}

4. STRONG PARTNERSHIPS are EVERYTHING:
   - Over-weight chemistry (2x multiplier vs individual skill)
   - Partnership dengan 5+ matches lebih reliable dari 3 matches
   - Win rate 80%+ partnership > 2 individual 70% skilled players

5. AVOID AT ALL COSTS:
   - ❌ Worst partnerships (WR < 40%)
   - ❌ Pairing slump players together (external)
   - ❌ Inactive players (no recent matches) untuk high-stakes
   - ❌ Skill imbalance > 30 points dalam same team

6. TOURNAMENT-SPECIFIC RULES:
   ${tournamentType === 'external' ? `
   - ONLY use proven partnerships (3+ matches minimum)
   - Prioritize hot form players (recent wins)
   - Minimize slump players entirely
   - Target: 65%+ win probability untuk tim yang kuat` : `
   - Balance setiap tim untuk fair competition
   - Mix chemistry qualities (tidak semua proven)
   - Include developing partnerships untuk learning
   - Target: 45-55% win probability untuk excitement`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE FORMAT (VALID JSON ONLY, no markdown):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "teams": [
    {
      "teamId": 1,
      "player1": "Nama Player 1",
      "player2": "Nama Player 2",
      "skillLevel": 75,
      "chemistry": "high",
      "chemistryScore": 85,
      "winRate": 68,
      "reasoning": "Penjelasan SPESIFIK mengapa tim ini optimal: reference partnership WR, form status, match count. Contoh: 'Pasangan ini terbukti 80% WR dari 5 pertandingan terakhir. Ana sedang hot (+15% form), partnership chemistry terpercaya.' (Bahasa Indonesia, max 2 kalimat)"
    }
  ],
  "matchups": [
    {
      "team1Id": 1,
      "team2Id": 2,
      "winProbability": { "team1": 62, "team2": 38 },
      "expectedScore": "21-17",
      "excitement": "high",
      "reasoning": "Alasan matchup prediction: perbandingan partnership strength, form status, skill gap (Bahasa Indonesia, 1-2 kalimat)"
    }
  ],
  "summary": "Ringkasan TOURNAMENT-SPECIFIC strategy dan key strengths (2-3 kalimat Bahasa Indonesia)",
  "recommendations": [
    "Insight ACTIONABLE berdasarkan data real (Bahasa Indonesia)",
    "Risk mitigation atau opportunity maksimization"
  ],
  "tournamentInsights": {
    "strategySuitability": "${tournamentType === 'external' ? 'High win potential' : 'Fair & balanced competition'}",
    "strengthAreas": ["Partnership X dengan 85% WR", "Form trend positif (4 dari 5 menang)"],
    "riskAreas": ["Player Y dalam slump", "Developing partnership Z"],
    "keyStrengths": "Penjelasan kekuatan utama komposisi (1 kalimat)"
  }
}

VALIDATION:
- Setiap team HARUS memiliki valid player names dari input
- Chemistry score harus match dengan actual partnership data
- Win rate prediction harus reasonable berdasarkan skill + chemistry
- Semua reasoning HARUS dalam Bahasa Indonesia
- Jangan invent partnerships yang tidak ada di data

GENERATE NOW:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up response
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }
    
    const optimization = JSON.parse(jsonMatch[0]);
    
    // Save to cache
    if (userId) {
      const { error: saveError } = await supabase
        .from('ai_insights')
        .upsert({
          user_id: userId,
          insight_type: 'team_optimizer',
          stats_hash: statsHash,
          response_data: optimization,
        }, {
          onConflict: 'user_id,insight_type,stats_hash'
        });
      
      if (saveError) {
        console.error('❌ Failed to save team optimization to cache:', saveError.message);
      } else {
        console.log('💾 Saved team optimization to cache successfully');
      }
    }

    return NextResponse.json(optimization);
  } catch (error: any) {
    console.error('Team Optimizer Error:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to generate team composition',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
