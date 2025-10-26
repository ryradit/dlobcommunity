import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';
import geminiService from '../services/geminiService';
import type { ApiResponse, AIInteraction } from '../types';

const router = Router();

// Parse payment message
router.post('/parse-payment', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({
        success: false,
        error: 'Message is required'
      });
      return;
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

    const request = {
      message,
      context: {
        members: members || [],
        recent_payments: recentPayments || []
      }
    };

    const aiResponse = await geminiService.parsePaymentMessage(request);

    // Log AI interaction
    await supabase
      .from('ai_interactions')
      .insert({
        member_id: req.user!.id,
        type: 'payment_parse',
        input_data: request,
        ai_response: aiResponse,
        confidence_score: aiResponse.confidence,
        created_at: new Date().toISOString()
      });

    const response: ApiResponse = {
      success: true,
      data: aiResponse
    };

    res.json(response);
  } catch (error) {
    console.error('Error parsing payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse payment message'
    });
  }
});

// Get match recommendations
router.post('/match-recommendations', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { available_members } = req.body;

    if (!available_members || !Array.isArray(available_members)) {
      res.status(400).json({
        success: false,
        error: 'Available members array is required'
      });
      return;
    }

    const aiResponse = await geminiService.generateMatchRecommendations(available_members);

    // Log AI interaction
    await supabase
      .from('ai_interactions')
      .insert({
        member_id: req.user!.id,
        type: 'match_recommendation',
        input_data: { available_members },
        ai_response: aiResponse,
        created_at: new Date().toISOString()
      });

    const response: ApiResponse = {
      success: true,
      data: aiResponse
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating match recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate match recommendations'
    });
  }
});

// Performance analysis
router.get('/performance-analysis/:member_id', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { member_id } = req.params;
    
    if (!member_id) {
      res.status(400).json({
        success: false,
        error: 'Member ID is required'
      });
      return;
    }

    // Get match history
    const { data: matchHistory } = await supabase
      .from('match_results')
      .select(`
        *,
        match:matches(
          *,
          participants:match_participants(
            member_id,
            team,
            member:members(name)
          )
        )
      `)
      .order('completed_at', { ascending: false })
      .limit(20);

    const aiResponse = await geminiService.analyzePerformance(member_id, matchHistory || []);

    // Log AI interaction
    await supabase
      .from('ai_interactions')
      .insert({
        member_id: req.user!.id,
        type: 'performance_analysis',
        input_data: { member_id, match_count: matchHistory?.length || 0 },
        ai_response: aiResponse,
        created_at: new Date().toISOString()
      });

    const response: ApiResponse = {
      success: true,
      data: aiResponse
    };

    res.json(response);
  } catch (error) {
    console.error('Error analyzing performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze performance'
    });
  }
});

// Chat assistant
router.post('/chat', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { question, context } = req.body;

    if (!question) {
      res.status(400).json({
        success: false,
        error: 'Question is required'
      });
      return;
    }

    const aiResponse = await geminiService.chatAssistant(question, context);

    // Log AI interaction
    await supabase
      .from('ai_interactions')
      .insert({
        member_id: req.user!.id,
        type: 'chat',
        input_data: { question, context },
        ai_response: { response: aiResponse },
        created_at: new Date().toISOString()
      });

    const response: ApiResponse = {
      success: true,
      data: { response: aiResponse }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in chat assistant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat request'
    });
  }
});

export default router;