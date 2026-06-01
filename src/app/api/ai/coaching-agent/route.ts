/**
 * Coaching Agent - Agentic Loop Endpoint
 * 
 * This endpoint implements a multi-turn agentic loop where:
 * 1. User sends a coaching request
 * 2. Gemini analyzes and decides which tools to use
 * 3. Tools are executed autonomously
 * 4. Results are fed back to Gemini for synthesis
 * 5. Final coaching guidance + action items are returned
 * 6. Everything is stored in database for continuity
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGenerativeModelWithFallback } from '@/lib/gemini';
import { createClient } from '@supabase/supabase-js';
import {
  COACHING_TOOLS,
  executeTacticAnalysis,
  executeTrainingPlanGeneration,
  executeProgressTracking,
  executePeerComparison,
  executeMentalAssessment,
  executeMatchPrediction,
} from '@/lib/coachingAgent';
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

// Tool executor mapping
const toolExecutors: Record<string, Function> = {
  'analyze_tactical_patterns': executeTacticAnalysis,
  'generate_training_plan': executeTrainingPlanGeneration,
  'track_progress_metrics': executeProgressTracking,
  'compare_peer_statistics': executePeerComparison,
  'assess_mental_factors': executeMentalAssessment,
  'predict_match_outcome': executeMatchPrediction,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, userId, memberName, sessionId, agentMode = 'autonomous' } = body;

    if (!query || !userId) {
      return NextResponse.json(
        { error: 'Query and userId are required' },
        { status: 400 }
      );
    }

    console.log('[Coaching Agent] Starting agentic loop:', {
      query: query.substring(0, 60),
      userId,
      memberName,
      agentMode,
    });

    // Fetch coaching session history for context (last 5 sessions)
    const { data: sessionHistory } = await supabase
      .from('coaching_sessions')
      .select('query, response, insights, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Format history for system prompt context using JSONB insights field
    const sessionHistoryFormatted = sessionHistory?.map((s: any) => ({
      query: s.query,
      response: s.response,
      response_type: s.insights?.responseType || 'provide_analysis',
      key_finding: s.insights?.keyFinding || null,
      action_items: s.insights?.actionItems || [],
      created_at: s.created_at,
    })) || [];


    // Build multi-turn messages for agent reasoning
    const messages: any[] = [];

    // System prompt with agent instructions
    const systemPrompt = `
SISTEM: Anda adalah "Dlob Coach Agent" - pelatih bulu tangkis AI yang autonomous dan action-focused.

MODE: ${agentMode === 'autonomous' ? 'AUTONOMOUS MODE - Buat keputusan dan ambil tindakan' : 'RESPONSIVE MODE - Jawab pertanyaan'}

TOOLS TERSEDIA (Gunakan sesuai kebutuhan):
1. analyze_tactical_patterns - Analisis pola taktik dan strategi lawan
2. generate_training_plan - Buat rencana training personalisasi (2-4 minggu)
3. track_progress_metrics - Catat progress member pada metrik tertentu
4. compare_peer_statistics - Bandingkan stats dengan peer segmentation (beginner/intermediate/advanced)
5. assess_mental_factors - Evaluasi faktor psikologis (confidence, pressure response, winning mentality)
6. predict_match_outcome - Prediksi hasil pertandingan vs opponent tertentu + game plan

INSTRUKSI AGENT:
- Dalam AUTONOMOUS MODE: Proaktif gunakan 2-3 tools untuk memberikan value maksimal
- Jangan hanya menjawab bertanya - ambil inisiatif analisis & action
- Jika member belum punya training plan: buat satu otomatis
- Jika ada weakness teridentifikasi: gunakan analyze_tactical_patterns + generate_training_plan
- Simpan hasil yang signifikan (track_progress_metrics) ke database
- Berikan actionable recommendations dengan timeline jelas

KONTEKS HISTORY (5 session terakhir untuk kontinuitas):
${sessionHistoryFormatted.length > 0 ? JSON.stringify(sessionHistoryFormatted.slice(0, 3), null, 2) : 'Ini percakapan pertama'}

PLAYER INFO:
- Nama: ${memberName}
- User ID: ${userId}
- Mode: ${agentMode}

Sekarang, tangani pertanyaan member dengan tool-calling yang tepat. Gunakan tools untuk:
1. Menganalisis situasi secara mendalam
2. Membuat keputusan berdasarkan data
3. Menghasilkan aksi konkret (training plan, predictions, benchmarks)
4. Memberikan guidance yang actionable dengan progres tracking
    `;

    // Add user message
    messages.push({
      role: 'user',
      parts: [{ text: query }],
    });

    console.log('[Coaching Agent] Calling Gemini with tools - start of agentic loop');

    // ============================================================================
    // AGENTIC LOOP - Multiple turns with tool calling
    // ============================================================================
    
    let toolResults: any[] = [];
    let agentResponse: any;
    let turnCount = 0;
    const maxTurns = 3; // Prevent infinite loops

    // Call Gemini with tools - instantiated once outside the loop to keep track of successful model across turns
    const model = getGenerativeModelWithFallback({
      model: 'gemini-2.0-flash',
      // Note: In production, use proper tool definitions via optional parameters
      // For MVP, we use text-based tool detection from response content
    });

    while (turnCount < maxTurns) {
      turnCount++;
      console.log(`[Coaching Agent] Agentic turn ${turnCount}/${maxTurns}`);

      const response = await model.generateContent({
        contents: messages,
        systemInstruction: systemPrompt,
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.9, // Slightly higher for varied recommendations
        },
      });

      console.log('[Coaching Agent] Gemini response received');

      agentResponse = response.response;
      const responseText = agentResponse.text();

      // Check if we have tool calls (Gemini 2.0 function calling)
      // For now, we'll parse tool requests from the response text
      const hasToolCalls = detectToolCalls(responseText);

      if (!hasToolCalls || turnCount >= maxTurns) {
        // Final response - no more tool calls
        console.log('[Coaching Agent] Final response generated, exiting agentic loop');
        
        // Add assistant message
        messages.push({
          role: 'model',
          parts: [{ text: responseText }],
        });
        break;
      }

      // Parse and execute tools from response
      const toolsToExecute = parseToolCalls(responseText);
      console.log(`[Coaching Agent] Detected ${toolsToExecute.length} tool calls in response`);

      for (const toolCall of toolsToExecute) {
        try {
          console.log(`[Coaching Agent] Executing tool: ${toolCall.name}`);
          const executor = toolExecutors[toolCall.name];

          if (!executor) {
            console.warn(`[Coaching Agent] Tool executor not found: ${toolCall.name}`);
            continue;
          }

          const result = await executor(
            userId,
            ...(toolCall.args || [])
          );

          toolResults.push({
            tool: toolCall.name,
            result,
            timestamp: new Date(),
          });

          console.log(`[Coaching Agent] Tool ${toolCall.name} executed successfully`);
        } catch (error) {
          console.error(`[Coaching Agent] Error executing tool ${toolCall.name}:`, error);
          toolResults.push({
            tool: toolCall.name,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
          });
        }
      }

      // Add assistant response and tool results to messages
      messages.push({
        role: 'model',
        parts: [{ text: responseText }],
      });

      // Add tool results back to context
      if (toolResults.length > 0) {
        messages.push({
          role: 'user',
          parts: [{ text: `Tool Results:\n${JSON.stringify(toolResults, null, 2)}\n\nNow, synthesize these results into actionable coaching guidance for the player.` }],
        });
      }
    }

    // Extract final response text
    const finalResponseText = agentResponse.text();

    // Extract structured data from response for database
    const structuredData = extractStructuredData(finalResponseText, toolResults);

    // Save coaching session to database
    const saveResult = await saveCoachingSession({
      user_id: userId,
      session_id: sessionId,
      member_name: memberName,
      query,
      response: finalResponseText,
      response_type: 'provide_analysis',
      tool_calls: toolResults,
      key_finding: structuredData.keyFinding,
      action_items: structuredData.actionItems,
      expected_results: structuredData.expectedResults,
      mode: agentMode,
    });

    console.log('[Coaching Agent] Coaching session saved:', saveResult.id);

    return NextResponse.json({
      response: finalResponseText,
      responseType: 'provide_analysis',
      toolsExecuted: toolResults.map(t => t.tool),
      toolCount: toolResults.length,
      actionItems: structuredData.actionItems,
      keyFinding: structuredData.keyFinding,
      expectedResults: structuredData.expectedResults,
      sessionId: saveResult.id,
    });
  } catch (error) {
    console.error('[Coaching Agent] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function detectToolCalls(responseText: string): boolean {
  // Detect if response mentions using tools/functions
  const toolNames = [
    'analyze_tactical_patterns',
    'generate_training_plan',
    'track_progress_metrics',
    'compare_peer_statistics',
    'assess_mental_factors',
    'predict_match_outcome',
  ];

  const toolKeywords = [
    'analyzing',
    'generating',
    'comparing',
    'predicting',
    'assessing',
    'checked your',
    'reviewed',
    'calculated',
    '```json',
    'memanggil tool',
    'menggunakan tool',
  ];
  
  const lowerText = responseText.toLowerCase();
  return toolNames.some(name => lowerText.includes(name.toLowerCase())) ||
         toolKeywords.some(keyword => lowerText.includes(keyword));
}

function parseToolCalls(responseText: string): Array<{ name: string; args?: any[] }> {
  const toolCalls: Array<{ name: string; args?: any[] }> = [];
  
  // Look for tool invocation patterns in response
  const toolNames = [
    'analyze_tactical_patterns',
    'generate_training_plan',
    'track_progress_metrics',
    'compare_peer_statistics',
    'assess_mental_factors',
    'predict_match_outcome',
  ];

  toolNames.forEach(toolName => {
    if (responseText.toLowerCase().includes(toolName)) {
      // Try to extract parameters from context
      toolCalls.push({
        name: toolName,
        args: extractArgsFromContext(responseText, toolName),
      });
    }
  });

  return toolCalls;
}

function extractArgsFromContext(text: string, toolName: string): any[] {
  // Simple heuristic argument extraction
  // In production, use proper parsing or Gemini function calling
  const lowerText = text.toLowerCase();
  
  switch (toolName) {
    case 'generate_training_plan': {
      let focus = 'net_play';
      if (lowerText.includes('smash')) focus = 'smash';
      else if (lowerText.includes('backhand')) focus = 'backhand';
      else if (lowerText.includes('stamina') || lowerText.includes('daya tahan')) focus = 'stamina';
      else if (lowerText.includes('defense') || lowerText.includes('bertahan')) focus = 'defense';
      else if (lowerText.includes('footwork') || lowerText.includes('langkah kaki') || lowerText.includes('kelincahan')) focus = 'footwork';
      else if (lowerText.includes('net')) focus = 'net_play';

      let weeks = 2;
      const durationParamMatch = lowerText.match(/duration_weeks\s*:\s*([1-4])/);
      if (durationParamMatch) {
        weeks = parseInt(durationParamMatch[1], 10);
      } else {
        const weekMatch = lowerText.match(/([1-4])\s*(?:minggu|week)/);
        if (weekMatch) {
          weeks = parseInt(weekMatch[1], 10);
        }
      }

      let days = 3;
      const daysParamMatch = lowerText.match(/days_per_week\s*:\s*([1-7])/);
      if (daysParamMatch) {
        days = parseInt(daysParamMatch[1], 10);
      } else {
        const dayMatch = lowerText.match(/([1-7])\s*(?:hari|day)/);
        if (dayMatch) {
          days = parseInt(dayMatch[1], 10);
        }
      }

      return [focus, weeks, days];
    }
    case 'analyze_tactical_patterns':
      return ['all']; // Focus area
    case 'assess_mental_factors':
      return ['confidence']; // Assessment type
    case 'compare_peer_statistics':
      return ['intermediate']; // Skill level
    case 'predict_match_outcome':
      return ['recent_strong_opponent', true]; // Opponent, include game plan
    default:
      return [];
  }
}

function extractStructuredData(
  responseText: string,
  toolResults: any[]
): {
  keyFinding: any;
  actionItems: any[];
  expectedResults: any;
} {
  // Extract structured coaching data from response

  return {
    keyFinding: {
      severity: detectSeverity(responseText),
      title: extractTitle(responseText),
      stats: extractStats(responseText, toolResults),
    },
    actionItems: extractActionItems(responseText),
    expectedResults: {
      timeframe: detectTimeframe(responseText),
      target: detectTarget(responseText),
      metric: detectMetric(responseText),
    },
  };
}

function detectSeverity(text: string): string {
  if (text.includes('critical') || text.includes('urgent')) return 'critical';
  if (text.includes('moderate') || text.includes('important')) return 'moderate';
  return 'minor';
}

function extractTitle(text: string): string {
  // Try to find first sentence or heading
  const sentences = text.split('.').filter(s => s.trim());
  return sentences[0]?.trim().substring(0, 100) || 'Coaching Analysis';
}

function extractStats(text: string, toolResults: any[]): string[] {
  const stats: string[] = [];
  
  // Extract from tool results
  toolResults.forEach(tr => {
    if (tr.result && tr.result.predictedOutcome) {
      stats.push(`Win Probability: ${tr.result.predictedOutcome.winProbability}%`);
    }
    if (tr.result && tr.result.userStats) {
      stats.push(`Current Win Rate: ${tr.result.userStats.winRate}%`);
    }
  });

  // Extract percentages from text
  const percentMatches = text.match(/(\d+)%/g) || [];
  stats.push(...percentMatches.slice(0, 3));

  return stats;
}

function extractActionItems(text: string): Array<{ title: string; description: string; priority: string }> {
  const items: Array<{ title: string; description: string; priority: string }> = [];
  
  const lines = text.split('\n');

  // Keywords that indicate structural headers or metadata, not actionable items
  const skipKeywords = [
    'hari ', 'minggu ', 'latihan di ', 'latihan fisik', 'latihan kardio',
    'tujuan', 'jadwal latihan', 'fokus utama', 'tingkat progresi', 'target hasil',
    'memanggil tool', 'duration_weeks', 'focus_areas', 'parameter:'
  ];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (/^[\d\-\*•]/.test(trimmed)) {
      // 1. Skip dividers or very short lines
      if (trimmed.replace(/[\-\*•\s]/g, '').length < 3) return;

      const lower = trimmed.toLowerCase();
      
      // 2. Skip based on keywords
      const shouldSkip = skipKeywords.some(keyword => lower.includes(keyword));
      if (shouldSkip) return;

      // Clean leading bullet chars (e.g. *, -, •, or digits like 1.)
      const cleanedLine = trimmed.replace(/^[\d\-\*•\.]+\s*/, '');
      // Strip markdown bold markers (**)
      const cleanTitle = cleanedLine.replace(/\*\*/g, '').trim();
      const cleanDescription = trimmed.replace(/^[\d\-\*•]+\s*/, '').replace(/\*\*/g, '').trim();

      // 3. Skip header-like list items that end with a colon or are too short
      if (cleanTitle.endsWith(':') || cleanTitle.length < 5) {
        return;
      }

      items.push({
        title: cleanTitle.substring(0, 70),
        description: cleanDescription,
        priority: detectPriority(trimmed),
      });
    }
  });

  // Limit to max 5 items for a clean UI checklist
  const finalItems = items.slice(0, 5);

  return finalItems.length > 0 ? finalItems : [
    {
      title: 'Mulai latihan sesuai jadwal',
      description: 'Lakukan sesi latihan sesuai dengan program yang direkomendasikan AI Coach.',
      priority: 'high',
    },
  ];
}

function detectTimeframe(text: string): string {
  if (text.includes('week')) return '1-2 weeks';
  if (text.includes('month')) return '2-4 weeks';
  if (text.includes('day')) return 'Daily';
  return 'Ongoing';
}

function detectTarget(text: string): string {
  // Extract goal target from text
  const patterns = [
    /improve.*?(\d+)%/i,
    /reach.*?(\d+)/i,
    /achieve.*?(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return `${match[1]}% improvement`;
  }

  return 'Measurable improvement';
}

function detectMetric(text: string): string {
  const metrics = ['win_rate', 'score_average', 'consistency', 'form'];
  for (const metric of metrics) {
    if (text.toLowerCase().includes(metric.replace('_', ' '))) {
      return metric;
    }
  }
  return 'overall_performance';
}

function detectPriority(line: string): string {
  const urgentWords = ['critical', 'urgent', 'important', 'must', 'immediately'];
  if (urgentWords.some(word => line.toLowerCase().includes(word))) return 'high';
  return 'medium';
}

async function saveCoachingSession(data: any) {
  const savePayload = {
    user_id: data.user_id,
    session_id: data.session_id || null,
    member_name: data.member_name || null,
    query: data.query,
    response: data.response,
    insights: {
      responseType: data.response_type || 'provide_analysis',
      keyFinding: data.key_finding,
      actionItems: data.action_items,
      expectedResults: data.expected_results,
      toolsExecuted: data.tool_calls,
      mode: data.mode,
      timestamp: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
  };

  const { error, data: result } = await supabase
    .from('coaching_sessions')
    .insert([savePayload])
    .select();

  if (error) {
    console.error('[Coaching Agent] Error saving session:', error);
    throw error;
  }

  return result && (result as any[]).length > 0 ? (result as any[])[0] : { id: null };
}
