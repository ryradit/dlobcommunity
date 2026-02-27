import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface Message {
  role: 'ai' | 'user';
  message: string;
  timestamp: string;
}

interface SurveyQuestion {
  id: string;
  type: string;
  question: string;
  required: boolean;
}

/**
 * AI Survey Chat Agent
 * Handles conversational survey interactions with members
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { responseId, userMessage, instanceId, memberId } = body;

    console.log('📝 Survey chat request:', { responseId, instanceId, memberId: memberId || 'anonymous', messageLength: userMessage?.length });

    if (!userMessage || !instanceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use a placeholder for anonymous users
    const effectiveMemberId = memberId || '00000000-0000-0000-0000-000000000000';

    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI service not configured. Please contact administrator.' },
        { status: 500 }
      );
    }

    // Get or create survey response
    let surveyResponse;
    if (responseId) {
      console.log('🔍 Fetching existing response:', responseId);
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('id', responseId)
        .single();

      if (error) {
        console.error('❌ Error fetching response:', error);
        throw error;
      }
      surveyResponse = data;
    } else {
      console.log('✨ Creating new response for instance:', instanceId);
      // Create new response
      const { data: instanceData, error: instanceError } = await supabase
        .from('survey_instances')
        .select('*, survey_templates(*)')
        .eq('id', instanceId)
        .single();

      if (instanceError) {
        console.error('❌ Error fetching instance:', instanceError);
        throw instanceError;
      }

      const { data, error } = await supabase
        .from('survey_responses')
        .insert({
          instance_id: instanceId,
          member_id: effectiveMemberId,
          conversation: [],
          answers: {},
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating response:', error);
        throw error;
      }
      surveyResponse = data;
      console.log('✅ Response created:', surveyResponse.id);
    }

    // Get survey instance and template
    const { data: instanceData, error: instanceError } = await supabase
      .from('survey_instances')
      .select('*, survey_templates(*)')
      .eq('id', instanceId)
      .single();

    if (instanceError) throw instanceError;

    const questions = instanceData.survey_templates.questions as SurveyQuestion[];
    const conversation = surveyResponse.conversation as Message[] || [];
    const answers = surveyResponse.answers || {};

    // Add user message to conversation
    const newUserMessage: Message = {
      role: 'user',
      message: userMessage,
      timestamp: new Date().toISOString(),
    };
    conversation.push(newUserMessage);

    // Generate AI response using Gemini
    console.log('🤖 Generating AI response...');
    const aiResponse = await generateAIResponse(
      conversation,
      questions,
      answers,
      instanceData.title
    );
    console.log('✅ AI response generated');

    // Add AI message to conversation
    const newAIMessage: Message = {
      role: 'ai',
      message: aiResponse.message,
      timestamp: new Date().toISOString(),
    };
    conversation.push(newAIMessage);

    // Update answers if AI extracted any
    const updatedAnswers = { ...answers, ...aiResponse.extractedAnswers };
    
    // Check for anonymous preference
    let isAnonymous = surveyResponse.is_anonymous;
    if (aiResponse.extractedAnswers?.q1_anonymous) {
      isAnonymous = aiResponse.extractedAnswers.q1_anonymous.toLowerCase().includes('ya');
    }

    // Update survey response
    const updateData: any = {
      conversation,
      answers: updatedAnswers,
      is_anonymous: isAnonymous,
    };

    // Check if survey is complete
    if (aiResponse.isComplete) {
      updateData.completion_status = 'completed';
      updateData.completed_at = new Date().toISOString();
      
      // Calculate time spent
      const startedAt = new Date(surveyResponse.started_at);
      const completedAt = new Date();
      updateData.time_spent_seconds = Math.floor(
        (completedAt.getTime() - startedAt.getTime()) / 1000
      );

      // Perform sentiment analysis
      const sentimentAnalysis = await analyzeSentiment(conversation);
      updateData.sentiment_score = sentimentAnalysis.score;
      updateData.key_topics = sentimentAnalysis.topics;
      updateData.priority_score = sentimentAnalysis.priority;
    }

    const { data: updatedResponse, error: updateError } = await supabase
      .from('survey_responses')
      .update(updateData)
      .eq('id', surveyResponse.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      responseId: updatedResponse.id,
      aiMessage: aiResponse.message,
      isComplete: aiResponse.isComplete,
      nextQuestion: aiResponse.nextQuestion,
    });

  } catch (error) {
    console.error('❌ Survey chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { 
        error: 'Failed to process survey response',
        details: errorMessage,
        hint: 'Check if GEMINI_API_KEY is configured and database tables exist'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate AI response using Google Gemini
 */
async function generateAIResponse(
  conversation: Message[],
  questions: SurveyQuestion[],
  answers: Record<string, any>,
  surveyTitle: string
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  // Build conversation context
  const conversationHistory = conversation
    .map(msg => `${msg.role === 'ai' ? 'AI' : 'User'}: ${msg.message}`)
    .join('\n');

  // Determine which questions are answered
  const answeredQuestionIds = Object.keys(answers);
  const unansweredQuestions = questions.filter(
    q => !answeredQuestionIds.includes(q.id)
  );

  const prompt = `You are a friendly AI assistant conducting a survey for DLOB Badminton Community.

Survey Title: ${surveyTitle}

Questions to ask (in order):
${questions.map((q, i) => `${i + 1}. ${q.question} (ID: ${q.id}, Required: ${q.required})`).join('\n')}

Already answered: ${answeredQuestionIds.join(', ')}
Still need to ask: ${unansweredQuestions.map(q => q.id).join(', ')}

Conversation so far:
${conversationHistory}

Instructions:
1. Be conversational and friendly in Bahasa Indonesia - like chatting with a friend
2. If the last user message answers a question, acknowledge it warmly and naturally
3. For q1_anonymous (anonymous preference): If user says "ya/anonim/rahasia" → extract "Ya, saya ingin anonim", otherwise "Tidak, cantumkan nama saya"
4. For topic questions (q2_topic): Accept any topic - management, harga (shuttlecock/membership), pertandingan, pasangan main, jadwal, fasilitas, or anything else
5. Extract the answer and store with the question ID
6. Ask the next question in a flowing, natural way - not robotic
7. If all required questions are answered, thank them warmly and mark as complete
8. Use emojis sparingly to keep it friendly 😊
9. Keep responses SHORT (1-2 sentences) - don't be too verbose
10. Match the user's energy level - if they're brief, be brief; if detailed, be more engaging

Example natural flow:
User: "Anonim aja"
AI: "Oke, feedback kamu akan tetap anonim 👍 Mau ngobrol tentang apa nih? Bisa soal manajemen, harga, pertandingan, atau yang lain..."

User: "Harga shuttlecock"
AI: "Hmm, soal harga shuttlecock ya. Ceritain dong, kenapa menurutmu jadi masalah?"

User: "Kemahalan, 80rb per tube. Kemarin cmn 70rb"
AI: "Oh gitu, naiknya lumayan juga ya dari 70rb ke 80rb per tube. Ada saran buat solusinya ga?"

Respond in this JSON format:
{
  "message": "Your conversational response in Indonesian",
  "extractedAnswers": {"question_id": "user's answer"},
  "nextQuestion": "question_id or null if complete",
  "isComplete": boolean
}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  console.log('🤖 AI raw response:', responseText.substring(0, 200));
  
  // Parse JSON response (extract from markdown if needed)
  let jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('❌ Invalid AI response format:', responseText);
    throw new Error('Invalid AI response format');
  }
  
  const aiResponse = JSON.parse(jsonMatch[0]);
  console.log('✅ Parsed AI response:', aiResponse);
  return aiResponse;
}

/**
 * Analyze sentiment of conversation using Google AI
 */
async function analyzeSentiment(conversation: Message[]) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const userMessages = conversation
    .filter(msg => msg.role === 'user')
    .map(msg => msg.message)
    .join(' ');

  const prompt = `Analyze the sentiment and key topics from this survey response:

"${userMessages}"

Provide analysis in this JSON format:
{
  "score": <number between -1.0 and 1.0>,
  "topics": ["topic1", "topic2", "topic3"],
  "priority": <number 1-10 indicating urgency/importance>
}

Score guide:
- 1.0: Very positive, enthusiastic
- 0.5: Somewhat positive
- 0.0: Neutral
- -0.5: Somewhat negative
- -1.0: Very negative, critical

Priority guide:
- 8-10: Critical issues or strong feature requests
- 5-7: Moderate feedback
- 1-4: Minor comments`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  let jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { score: 0, topics: [], priority: 5 };
  }
  
  return JSON.parse(jsonMatch[0]);
}
