import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PaymentParseRequest, PaymentParseResponse, GeminiPrompt } from '../types';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async parsePaymentMessage(request: PaymentParseRequest): Promise<PaymentParseResponse> {
    try {
      const prompt = this.buildPaymentParsePrompt(request);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const parsed = JSON.parse(text);
      
      return {
        member_id: parsed.member_id,
        amount: parsed.amount,
        confidence: parsed.confidence || 0,
        reasoning: parsed.reasoning || 'AI analysis completed',
        suggestions: parsed.suggestions || []
      };
    } catch (error) {
      console.error('Error parsing payment message:', error);
      return {
        confidence: 0,
        reasoning: 'Failed to parse payment message',
        suggestions: ['Please check the message format and try again']
      };
    }
  }

  async generateMatchRecommendations(availableMembers: string[]): Promise<any> {
    try {
      const prompt = this.buildMatchRecommendationPrompt(availableMembers);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return JSON.parse(text);
    } catch (error) {
      console.error('Error generating match recommendations:', error);
      return {
        recommended_matches: [],
        error: 'Failed to generate recommendations'
      };
    }
  }

  async analyzePerformance(memberId: string, matchHistory: any[]): Promise<any> {
    try {
      const prompt = this.buildPerformanceAnalysisPrompt(memberId, matchHistory);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return JSON.parse(text);
    } catch (error) {
      console.error('Error analyzing performance:', error);
      return {
        analysis: 'Performance analysis failed',
        recommendations: []
      };
    }
  }

  async chatAssistant(question: string, context?: any): Promise<string> {
    try {
      const prompt = this.buildChatPrompt(question, context);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      console.error('Error in chat assistant:', error);
      return 'I apologize, but I encountered an error. Please try asking your question again.';
    }
  }

  private buildPaymentParsePrompt(request: PaymentParseRequest): string {
    return `
You are an AI assistant for DLOB badminton community that helps parse payment messages.

Payment Message: "${request.message}"

Available Members: ${JSON.stringify(request.context?.members || [])}

Your task is to analyze the payment message and identify:
1. Which member made the payment (match by name, phone, or other identifiers)
2. The payment amount
3. Your confidence level (0-1)
4. Reasoning for your analysis

Respond ONLY with valid JSON in this exact format:
{
  "member_id": "member_uuid_or_null",
  "amount": number_or_null,
  "confidence": 0.8,
  "reasoning": "Explanation of analysis",
  "suggestions": ["suggestion1", "suggestion2"]
}

Rules:
- If you can't identify the member with high confidence, set member_id to null
- If amount is unclear, set to null
- Confidence should be between 0 and 1
- Always provide reasoning
- Suggest alternatives if identification is uncertain
`;
  }

  private buildMatchRecommendationPrompt(availableMembers: string[]): string {
    return `
You are an AI assistant for DLOB badminton community that creates fair match pairings.

Available Members: ${JSON.stringify(availableMembers)}

Create fair and balanced match recommendations for badminton games.

Respond ONLY with valid JSON in this exact format:
{
  "recommended_matches": [
    {
      "team1": ["member1", "member2"],
      "team2": ["member3", "member4"],
      "confidence": 0.9,
      "reasoning": "Explanation for this pairing",
      "expected_competitiveness": 0.8
    }
  ]
}

Rules:
- Create balanced teams based on assumed skill levels
- Ensure all members are included
- Provide reasoning for each match
- Expected competitiveness should be 0-1 (higher = more competitive)
`;
  }

  private buildPerformanceAnalysisPrompt(memberId: string, matchHistory: any[]): string {
    return `
You are an AI assistant analyzing badminton performance for member: ${memberId}

Match History: ${JSON.stringify(matchHistory)}

Analyze the performance and provide insights.

Respond ONLY with valid JSON in this exact format:
{
  "win_rate": 0.75,
  "recent_trend": "improving|declining|stable",
  "strengths": ["strength1", "strength2"],
  "areas_for_improvement": ["area1", "area2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "performance_score": 0.8
}
`;
  }

  private buildChatPrompt(question: string, context?: any): string {
    return `
You are a helpful AI assistant for DLOB badminton community. Answer questions about badminton, the community, scheduling, payments, and general inquiries.

Context: ${JSON.stringify(context || {})}
Question: ${question}

Provide a helpful, friendly response. Keep it concise and relevant to badminton or community activities.
`;
  }
}

export default new GeminiService();