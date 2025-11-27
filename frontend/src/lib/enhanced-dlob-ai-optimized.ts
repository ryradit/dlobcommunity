import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// Enhanced DLOB AI Service with Authentication & Database Integration
// OPTIMIZED FOR PERFORMANCE - Reduced database queries, faster responses

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  sessionId?: string;
}

export interface MapData {
  type: 'gmaps';
  url: string;
  embed: string;
}

export interface DlobAIResponse {
  response: string;
  success: boolean;
  error?: string;
  contextUsed?: string[];
  map?: MapData;
}

export interface UserContext {
  user?: User | null;
  memberData?: any;
  paymentContext?: any;
  matchContext?: any;
  attendanceContext?: any;
}

export interface ChatSession {
  id: string;
  sessionToken: string;
  isAuthenticated: boolean;
  userName?: string;
  userEmail?: string;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class EnhancedDlobAIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  private supabaseClient = supabase;
  private currentSession: ChatSession | null = null;
  private userContextCache: Map<string, { context: UserContext; timestamp: number }> = new Map();

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Gemini API key not configured. DLOB AI will use fallback responses.');
    }
  }

  /**
   * Initialize or get chat session - OPTIMIZED
   */
  async initializeChatSession(user?: User | null): Promise<ChatSession> {
    if (this.currentSession) {
      return this.currentSession;
    }

    // Create session immediately without waiting for database
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const sessionId = `session_${timestamp}_${randomString}`;
    const sessionToken = user 
      ? `auth_${timestamp}_${randomString}`
      : `anon_${timestamp}_${randomString}`;

    this.currentSession = {
      id: sessionId,
      sessionToken: sessionToken,
      isAuthenticated: !!user,
      userName: user?.user_metadata?.full_name || user?.email?.split('@')[0],
      userEmail: user?.email
    };

    // Try to save to database in background (don't wait)
    this.saveSessionToDatabase(this.currentSession, user).catch(err => 
      console.warn('Session save to DB failed, continuing with memory session:', err)
    );

    return this.currentSession;
  }

  /**
   * Save session to database in background
   */
  private async saveSessionToDatabase(session: ChatSession, user?: User | null): Promise<void> {
    try {
      const sessionData = {
        id: session.id,
        session_token: session.sessionToken,
        is_authenticated: session.isAuthenticated,
        user_name: session.userName,
        user_email: session.userEmail
      };

      if (user) {
        await this.supabaseClient
          .from('chat_sessions')
          .insert({...sessionData, user_id: user.id})
          .single();
      } else {
        await this.supabaseClient
          .from('chat_sessions')
          .insert(sessionData)
          .single();
      }
    } catch (error) {
      // Ignore database errors for session saving
      console.warn('Background session save failed:', error);
    }
  }

  /**
   * Check if query is general (no personal data needed) - PERFORMANCE OPTIMIZATION
   */
  private isGeneralQuery(message: string): boolean {
    const generalKeywords = [
      'jersey', 'baju', 'kaos', 'seragam', 'merchandise',
      'jadwal', 'latihan', 'jam', 'kapan',
      'lokasi', 'alamat', 'dimana', 'tempat', 'venue', 'gor',
      'kontak', 'admin', 'hubungi', 'nomor', 'whatsapp',
      'instagram', 'tiktok', 'youtube', 'sosmed', 'social',
      'join', 'gabung', 'daftar', 'bergabung',
      'info', 'tentang', 'dlob', 'komunitas',
      'harga jersey', 'ukuran', 'size', 'warna',
      'pesan jersey', 'order jersey', 'pre order'
    ];
    
    const lowerMessage = message.toLowerCase();
    return generalKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Get user context - OPTIMIZED with caching and timeouts
   */
  async getUserContext(user: User): Promise<UserContext> {
    // Check cache first (5 minute cache)
    const cacheKey = user.id;
    const cached = this.userContextCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) {
      console.log('📦 Using cached context for:', user.email);
      return cached.context;
    }

    try {
      console.log('🔍 Getting fresh user context for:', user.email);
      
      // Quick member lookup with timeout
      const memberPromise = Promise.race([
        this.supabaseClient
          .from('members')
          .select('id, name, role, created_at')
          .eq('user_id', user.id)
          .single(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Member timeout')), 2000))
      ]);

      const { data: memberData, error: memberError } = await memberPromise.catch(() => ({ data: null, error: 'timeout' }));
      
      const context: UserContext = {
        user,
        memberData: memberData || null,
        paymentContext: null,
        matchContext: null,
        attendanceContext: null
      };

      // Cache the result
      this.userContextCache.set(cacheKey, { context, timestamp: Date.now() });
      console.log('💾 Cached context for:', user.email);

      return context;
    } catch (error) {
      console.error('❌ Error getting user context:', error);
      const fallbackContext = { user };
      this.userContextCache.set(cacheKey, { context: fallbackContext, timestamp: Date.now() });
      return fallbackContext;
    }
  }

  /**
   * Generate personalized AI response - OPTIMIZED FOR SPEED
   */
  async generatePersonalizedResponse(
    userMessage: string,
    user?: User | null
  ): Promise<DlobAIResponse> {
    const startTime = Date.now();

    try {
      // PRIORITY 1: Check for instant quick responses
      const quickResponse = this.getQuickResponse(userMessage);
      if (quickResponse) {
        // Initialize session in background (don't wait)
        this.initializeChatSession(user).catch(console.warn);
        return {
          response: quickResponse,
          success: true,
          contextUsed: ['quick_response']
        };
      }

      // PRIORITY 2: For authenticated users, check if it's a general query
      if (user && this.isGeneralQuery(userMessage)) {
        // Use general prompt instead of fetching user data
        const generalPrompt = this.buildGeneralPrompt(userMessage);
        let response: string;
        
        if (!this.apiKey) {
          response = this.getFallbackResponse(userMessage, {});
        } else {
          response = await this.callGeminiAPI(generalPrompt);
        }

        // Initialize session in background
        this.initializeChatSession(user).catch(console.warn);

        return {
          response,
          success: true,
          contextUsed: ['general_query']
        };
      }

      // PRIORITY 3: Personal queries that need user context
      let userContext: UserContext = {};
      let personalizedPrompt = '';

      if (user) {
        // Get lightweight user context
        userContext = await this.getUserContext(user);
        personalizedPrompt = this.buildPersonalizedPrompt(userMessage, userContext);
      } else {
        personalizedPrompt = this.buildGeneralPrompt(userMessage);
      }

      let response: string;
      
      if (!this.apiKey) {
        response = this.getFallbackResponse(userMessage, userContext);
      } else {
        response = await this.callGeminiAPI(personalizedPrompt);
      }

      const responseTime = Date.now() - startTime;

      // Initialize session in background
      this.initializeChatSession(user).catch(console.warn);

      // Check if response contains map placeholder
      let map: MapData | undefined;
      if (response.includes('#MAP_EMBED#')) {
        map = {
          type: 'gmaps',
          url: 'https://maps.google.com/maps?q=GOR+Badminton+Wisma+Harapan+Tangerang',
          embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.7482!2d106.6123!3d-6.1725!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f9f7b7e277d3%3A0x85d0!2sGOR+Badminton+Wisma+Harapan!5e0!3m2!1sen!2sid!4v1635475291424!5m2!1sen!2sid'
        };
        response = response.replace('#MAP_EMBED#', '');
      }

      console.log(`⚡ Response generated in ${responseTime}ms`);

      return {
        response,
        success: true,
        contextUsed: user ? ['user_context'] : ['general'],
        map
      };

    } catch (error) {
      console.error('Error generating response:', error);
      
      return {
        response: this.getFallbackResponse(userMessage, {}),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Build personalized prompt - SIMPLIFIED FOR SPEED
   */
  private buildPersonalizedPrompt(userMessage: string, userContext: UserContext): string {
    const { user, memberData } = userContext;
    const userName = memberData?.name || user?.email?.split('@')[0] || 'Member';
    
    return `Kamu adalah DLOB AI untuk ${userName}. Jawab singkat dalam Bahasa Indonesia.

DLOB Info:
- Latihan: Sabtu 20:00-23:00 WIB
- Lokasi: GOR Wisma Harapan, Tangerang
- Admin: +62 812-7073-7272
- Jersey: Pre-order sampai 15 Des 2025, mulai Rp 110k

${memberData ? `Member: ${memberData.name} (${memberData.role})` : ''}

Pertanyaan: "${userMessage}"

Jawab maksimal 2 kalimat, akhiri dengan "Ada yang lain bisa saya bantu?"`;
  }

  /**
   * Build general prompt - OPTIMIZED FOR SPEED
   */
  private buildGeneralPrompt(userMessage: string): string {
    return `Kamu adalah DLOB AI untuk komunitas badminton Indonesia. Jawab singkat dalam Bahasa Indonesia.

DLOB:
- Latihan: Sabtu 20:00-23:00 WIB 
- GOR Wisma Harapan, Tangerang
- Admin: +62 812-7073-7272
- Jersey: Pre-order sampai 15 Des 2025
- Harga: S-XL (110k), XXL (120k), 3XL (130k)
- Lengan panjang +10k
- IG: @dlob.channel

Pertanyaan: "${userMessage}"

Jawab 1-2 kalimat, akhiri "Ada yang lain bisa saya bantu?"`;
  }

  /**
   * Call Gemini API - OPTIMIZED with timeout and reduced tokens
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 second timeout

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 32,
            topP: 0.8,
            maxOutputTokens: 512, // Reduced for speed
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
          ]
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text.trim();
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Response timeout - coba lagi ya!');
      }
      throw error;
    }
  }

  /**
   * Get quick response for common questions - EXPANDED FOR SPEED
   */
  private getQuickResponse(message: string): string | null {
    const lowerMessage = message.toLowerCase();

    // Jersey queries - instant responses
    if (lowerMessage.includes('jersey') || lowerMessage.includes('baju')) {
      return "Jersey DLOB Official tersedia pre-order! 🎽 3 warna (Biru Navy, Pink, Kuning), harga mulai Rp 110k. Batas order 15 Des 2025. Order di /pre-order ya! Ada yang lain bisa saya bantu?";
    }

    if (lowerMessage.includes('harga jersey') || lowerMessage.includes('berapa jersey')) {
      return "Harga Jersey DLOB: S-XL (Rp 110k), XXL (Rp 120k), 3XL (Rp 130k). Lengan panjang +Rp 10k. Pre-order sampai 15 Des 2025! Ada yang lain bisa saya bantu?";
    }

    // Schedule queries
    if (lowerMessage.includes('jadwal') || lowerMessage.includes('jam')) {
      return "Latihan DLOB setiap Sabtu 20:00-23:00 WIB di GOR Wisma Harapan, Tangerang 🏸 Ada yang lain bisa saya bantu?";
    }

    // Location queries
    if (lowerMessage.includes('lokasi') || lowerMessage.includes('alamat')) {
      return "GOR Badminton Wisma Harapan, Jl. Wisma Lantana IV No.D07-49, Gembor, Periuk, Tangerang 🗺️ Ada yang lain bisa saya bantu?";
    }

    // Contact queries
    if (lowerMessage.includes('kontak') || lowerMessage.includes('admin')) {
      return "Kontak admin DLOB: +62 812-7073-7272, IG: @dlob.channel 📱 Ada yang lain bisa saya bantu?";
    }

    return null; // No quick response, proceed with AI
  }

  /**
   * Enhanced fallback responses - OPTIMIZED
   */
  private getFallbackResponse(userMessage: string, userContext: UserContext): string {
    const message = userMessage.toLowerCase();
    const userName = userContext.memberData?.name || userContext.user?.email?.split('@')[0] || '';
    const greeting = userName ? `Halo ${userName}! 👋` : 'Halo! 👋';

    // Jersey responses
    if (message.includes('jersey') || message.includes('baju')) {
      return `${greeting} Jersey DLOB Official pre-order aktif! 🎽 3 warna tersedia, harga mulai Rp 110k. Batas 15 Des 2025, kirim Jan 2026. Order di /pre-order! Ada yang lain bisa saya bantu?`;
    }

    // General responses
    if (message.includes('halo') || message.includes('hai')) {
      return `${greeting} Saya DLOB AI! Ada yang bisa saya bantu tentang jadwal, jersey, atau info DLOB lainnya? 🏸`;
    }

    if (message.includes('jadwal')) {
      return `${greeting} Latihan DLOB setiap Sabtu 20:00-23:00 WIB di GOR Wisma Harapan! Ada yang lain bisa saya bantu?`;
    }

    // Default
    return `${greeting} Ada yang bisa saya bantu tentang DLOB? Jadwal latihan, jersey, atau info lainnya? 🏸`;
  }

  /**
   * Get welcome message
   */
  getWelcomeMessage(user?: User | null): string {
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0];
    
    if (user && userName) {
      return `Halo ${userName}! 👋 DLOB AI siap membantu! 🏸`;
    } else if (user) {
      return `Halo! 👋 DLOB AI siap membantu! 🏸`;
    } else {
      return `Halo! 👋 DLOB AI siap membantu info komunitas badminton! 🏸`;
    }
  }

  /**
   * Get quick reply suggestions - OPTIMIZED
   */
  getQuickReplies(user?: User | null): string[] {
    if (user) {
      return [
        "Info Jersey DLOB",
        "Jadwal latihan",
        "Kontak admin",
        "Lokasi GOR"
      ];
    } else {
      return [
        "Cara join DLOB",
        "Jersey DLOB Official",
        "Jadwal latihan",
        "Lokasi GOR"
      ];
    }
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.currentSession = null;
    this.userContextCache.clear();
  }

  /**
   * Clear user context cache
   */
  clearCache(): void {
    this.userContextCache.clear();
  }
}

export const enhancedDlobAI = new EnhancedDlobAIService();