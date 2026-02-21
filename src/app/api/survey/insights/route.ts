import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Generate AI Insights from Survey Responses
 * Analyzes all responses and creates actionable recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instanceId } = body;

    if (!instanceId) {
      return NextResponse.json(
        { error: 'Survey instance ID required' },
        { status: 400 }
      );
    }

    // Get all completed responses for this survey
    const { data: responses, error: responsesError } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('completion_status', 'completed');

    if (responsesError) throw responsesError;

    if (!responses || responses.length === 0) {
      return NextResponse.json(
        { error: 'No completed responses found' },
        { status: 404 }
      );
    }

    // Calculate aggregated metrics
    const totalResponses = responses.length;
    const avgSentiment = responses.reduce((sum, r) => sum + (r.sentiment_score || 0), 0) / totalResponses;
    
    const sentimentDist = {
      positive: responses.filter(r => r.sentiment_label === 'positive').length,
      neutral: responses.filter(r => r.sentiment_label === 'neutral').length,
      negative: responses.filter(r => r.sentiment_label === 'negative').length,
    };

    // Extract all user messages for analysis
    const allUserMessages = responses.flatMap(r => {
      const conversation = r.conversation as any[];
      return conversation
        .filter(msg => msg.role === 'user')
        .map(msg => msg.message);
    });

    // Extract all answers
    const allAnswers = responses.map(r => r.answers);

    // Generate AI insights
    const insights = await generateInsights(allUserMessages, allAnswers, sentimentDist);

    // Extract topic frequency
    const topicFrequency: Record<string, number> = {};
    responses.forEach(r => {
      (r.key_topics || []).forEach((topic: string) => {
        topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
      });
    });

    // Save insights to database
    const { data: savedInsights, error: insightsError } = await supabase
      .from('survey_insights')
      .insert({
        instance_id: instanceId,
        total_responses: totalResponses,
        completion_rate: 100, // Can calculate from invited members if tracked
        avg_sentiment_score: avgSentiment,
        summary: insights.summary,
        key_findings: insights.keyFindings,
        top_positive_points: insights.positivePoints,
        top_improvement_areas: insights.improvementAreas,
        feature_requests: insights.featureRequests,
        actionable_recommendations: insights.recommendations,
        sentiment_distribution: sentimentDist,
        topic_frequency: topicFrequency,
      })
      .select()
      .single();

    if (insightsError) throw insightsError;

    return NextResponse.json({
      success: true,
      insights: savedInsights,
    });

  } catch (error) {
    console.error('Survey insights generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

/**
 * Get existing insights for a survey
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get('instanceId');

    if (!instanceId) {
      return NextResponse.json(
        { error: 'Survey instance ID required' },
        { status: 400 }
      );
    }

    const { data: insights, error } = await supabase
      .from('survey_insights')
      .select('*')
      .eq('instance_id', instanceId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({
      success: true,
      insights: insights || null,
    });

  } catch (error) {
    console.error('Survey insights fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}

/**
 * Generate insights using Google AI
 */
async function generateInsights(
  userMessages: string[],
  allAnswers: any[],
  sentimentDist: { positive: number; neutral: number; negative: number }
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const messagesText = userMessages.join('\n---\n');
  const answersText = JSON.stringify(allAnswers, null, 2);

  const prompt = `You are analyzing survey responses for DLOB Badminton Community's offline programs.

Total Responses: ${userMessages.length}
Sentiment Distribution: ${sentimentDist.positive} positive, ${sentimentDist.neutral} neutral, ${sentimentDist.negative} negative

All User Responses:
${messagesText}

Structured Answers:
${answersText}

Analyze these survey responses and provide insights in this JSON format:
{
  "summary": "2-3 sentence overall summary in Indonesian",
  "keyFindings": [
    "Finding 1 (most important insight)",
    "Finding 2",
    "Finding 3"
  ],
  "positivePoints": [
    "What members loved most",
    "Second positive point",
    "Third positive point"
  ],
  "improvementAreas": [
    "Main area needing improvement",
    "Second improvement area",
    "Third improvement area"
  ],
  "featureRequests": [
    "Feature request 1 with frequency mention",
    "Feature request 2",
    "Feature request 3"
  ],
  "recommendations": [
    "Actionable recommendation 1 for admin",
    "Actionable recommendation 2",
    "Actionable recommendation 3"
  ]
}

Guidelines:
- Be specific and data-driven
- Quote member feedback when relevant
- Prioritize by frequency and sentiment
- Write in Bahasa Indonesia
- Focus on offline program improvements (schedule, pairing, venue, etc.)
- Identify patterns and trends`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  let jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid AI insights format');
  }
  
  return JSON.parse(jsonMatch[0]);
}
