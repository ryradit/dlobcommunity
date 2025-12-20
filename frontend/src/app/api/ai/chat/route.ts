import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import geminiService from '@/lib/services/geminiService';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    const { question, context } = await request.json();

    if (!question) {
      return createErrorResponse('Question is required', 400);
    }

    const aiResponse = await geminiService.chatAssistant(question, context);

    // Log AI interaction
    await supabase
      .from('ai_interactions')
      .insert({
        member_id: user.id,
        type: 'chat',
        input_data: { question, context },
        ai_response: { response: aiResponse },
        created_at: new Date().toISOString()
      });

    return createSuccessResponse({ response: aiResponse });
  } catch (error) {
    console.error('Error in chat assistant:', error);
    return createErrorResponse('Failed to process chat request', 500);
  }
}