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

    const { message } = await request.json();

    if (!message) {
      return createErrorResponse('Message is required', 400);
    }

    // Get members for context
    const { data: members } = await supabase
      .from('members')
      .select('id, name, phone')
      .eq('is_active', true);

    // Get recent payments for context
    const { data: recentPayments } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const aiRequest = {
      message,
      context: {
        members: members || [],
        recent_payments: recentPayments || []
      }
    };

    const aiResponse = await geminiService.parsePaymentMessage(aiRequest);

    // Log AI interaction
    await supabase
      .from('ai_interactions')
      .insert({
        member_id: user.id,
        type: 'payment_parse',
        input_data: aiRequest,
        ai_response: aiResponse,
        confidence_score: aiResponse.confidence,
        created_at: new Date().toISOString()
      });

    return createSuccessResponse(aiResponse);
  } catch (error) {
    console.error('Error parsing payment:', error);
    return createErrorResponse('Failed to parse payment message', 500);
  }
}