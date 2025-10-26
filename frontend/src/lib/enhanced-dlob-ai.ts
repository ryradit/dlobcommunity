import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// Enhanced DLOB AI Service with Authentication & Database Integration
// Provides personalized, context-aware responses

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  sessionId?: string;
}

export interface DlobAIResponse {
  response: string;
  success: boolean;
  error?: string;
  contextUsed?: string[];
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

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Gemini API key not configured. DLOB AI will use fallback responses.');
    }
  }

  /**
   * Initialize or get chat session
   */
  async initializeChatSession(user?: User | null): Promise<ChatSession> {
    if (this.currentSession) {
      return this.currentSession;
    }

    try {
      if (user) {
        // Authenticated user session
        const { data: session, error } = await this.supabaseClient
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            session_token: `auth_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            is_authenticated: true,
            user_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            user_email: user.email
          })
          .select()
          .single();

        if (error) throw error;

        this.currentSession = {
          id: session.id,
          sessionToken: session.session_token,
          isAuthenticated: true,
          userName: session.user_name,
          userEmail: session.user_email
        };
      } else {
        // Anonymous user session
        const sessionToken = `anon_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        
        const { data: session, error } = await this.supabaseClient
          .from('chat_sessions')
          .insert({
            session_token: sessionToken,
            is_authenticated: false
          })
          .select()
          .single();

        if (error) throw error;

        this.currentSession = {
          id: session.id,
          sessionToken: sessionToken,
          isAuthenticated: false
        };
      }

      return this.currentSession;
    } catch (error) {
      console.error('Error initializing chat session:', error);
      // Fallback session
      return {
        id: `fallback_${Date.now()}`,
        sessionToken: `fallback_${Math.random().toString(36).substring(2)}`,
        isAuthenticated: false
      };
    }
  }

  /**
   * Get user context from database
   */
  async getUserContext(user: User): Promise<UserContext> {
    try {
      console.log('🔍 Getting user context for:', user.email);
      
      // Get member data
      const { data: memberData, error: memberError } = await this.supabaseClient
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('👤 Member data:', memberData, memberError);

      // Try to refresh user context cache (might fail if functions don't exist)
      try {
        await this.supabaseClient.rpc('refresh_user_context_cache', { 
          p_user_id: user.id 
        });
        console.log('✅ Context cache refreshed');
      } catch (rpcError) {
        console.warn('⚠️ RPC refresh failed (expected in demo mode):', rpcError);
      }

      // Get cached context data
      const { data: contextCache, error: cacheError } = await this.supabaseClient
        .from('user_context_cache')
        .select('context_type, context_data')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString());

      console.log('💾 Context cache:', contextCache, cacheError);

      // If no cached data, try to get direct payment data
      let paymentContext = null;
      if (!contextCache?.length) {
        console.log('📊 No cache found, getting direct payment data...');
        
        const { data: payments, error: paymentError } = await this.supabaseClient
          .from('payments')
          .select('*')
          .eq('member_id', memberData?.id)
          .order('created_at', { ascending: false });

        console.log('💰 Direct payments:', payments, paymentError);

        if (payments?.length) {
          const pending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);
          const overdue = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + (p.amount || 0), 0);
          const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
          
          paymentContext = {
            pending_payments: pending,
            overdue_payments: overdue,
            total_paid: totalPaid,
            payment_count: payments.length,
            last_payment_date: payments.find(p => p.status === 'paid')?.created_at || null
          };
          
          console.log('💵 Calculated payment context:', paymentContext);
        }
      }

      const context: UserContext = {
        user,
        memberData,
        paymentContext
      };

      // Parse cached context data if available
      contextCache?.forEach((cache: any) => {
        console.log('🏷️ Processing cache:', cache.context_type, cache.context_data);
        switch (cache.context_type) {
          case 'payments':
            context.paymentContext = cache.context_data;
            break;
          case 'matches':
            context.matchContext = cache.context_data;
            break;
          case 'attendance':
            context.attendanceContext = cache.context_data;
            break;
        }
      });

      console.log('🎯 Final context:', context);
      return context;
    } catch (error) {
      console.error('❌ Error getting user context:', error);
      return { user };
    }
  }

  /**
   * Save chat message to database
   */
  async saveChatMessage(
    sessionId: string,
    messageText: string,
    isUserMessage: boolean,
    contextUsed?: string[],
    responseTime?: number
  ): Promise<void> {
    try {
      await this.supabaseClient
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          message_text: messageText,
          is_user_message: isUserMessage,
          ai_model: 'gemini-2.0-flash',
          context_used: contextUsed?.join(', ') || null,
          response_time_ms: responseTime || null,
          message_metadata: contextUsed ? { context_types: contextUsed } : null
        });

      // Update session last message time and count
      await this.supabaseClient
        .from('chat_sessions')
        .update({
          last_message_at: new Date().toISOString(),
          message_count: this.supabaseClient.rpc('increment', { column_name: 'message_count' })
        })
        .eq('id', sessionId);

    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  }

  /**
   * Generate personalized AI response
   */
  async generatePersonalizedResponse(
    userMessage: string,
    user?: User | null
  ): Promise<DlobAIResponse> {
    const startTime = Date.now();
    let contextUsed: string[] = [];

    try {
      // Check for specific quick responses first
      const quickResponse = this.getQuickResponse(userMessage);
      if (quickResponse) {
        return {
          response: quickResponse,
          success: true,
          contextUsed: []
        };
      }

      // Initialize session
      const session = await this.initializeChatSession(user);
      
      // Save user message
      await this.saveChatMessage(session.id, userMessage, true);

      let userContext: UserContext = {};
      let personalizedPrompt = '';

      if (user) {
        // Get user context for personalized response
        userContext = await this.getUserContext(user);
        personalizedPrompt = this.buildPersonalizedPrompt(userMessage, userContext);
        
        // Track what context was used
        if (userContext.paymentContext) contextUsed.push('payments');
        if (userContext.matchContext) contextUsed.push('matches');
        if (userContext.attendanceContext) contextUsed.push('attendance');
        if (userContext.memberData) contextUsed.push('member_data');
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

      // Save AI response
      await this.saveChatMessage(
        session.id, 
        response, 
        false, 
        contextUsed, 
        responseTime
      );

      // Log analytics
      await this.logAnalytics(session.id, userMessage, true, false, responseTime, !!user);

      return {
        response,
        success: true,
        contextUsed
      };

    } catch (error) {
      console.error('Error generating personalized response:', error);
      
      // Log error analytics
      if (this.currentSession) {
        await this.logAnalytics(
          this.currentSession.id, 
          userMessage, 
          false, 
          true, 
          Date.now() - startTime,
          !!user,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }

      return {
        response: this.getFallbackResponse(userMessage, {}),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Build personalized prompt for authenticated users
   */
  private buildPersonalizedPrompt(userMessage: string, userContext: UserContext): string {
    const { user, memberData, paymentContext, matchContext, attendanceContext } = userContext;
    
    let contextInfo = '';
    let specificInstructions = '';
    
    if (memberData) {
      contextInfo += `\nData User:
- Nama: ${memberData.name}
- Status: ${memberData.role === 'admin' ? 'Admin' : 'Member'}
- Bergabung: ${new Date(memberData.created_at).toLocaleDateString('id-ID')}`;
    }

    if (paymentContext) {
      const pendingAmount = paymentContext.pending_payments || 0;
      const overdueAmount = paymentContext.overdue_payments || 0;
      const totalPaid = paymentContext.total_paid || 0;
      
      contextInfo += `\nInformasi Pembayaran REAL DATA:
- Tagihan pending: Rp ${pendingAmount.toLocaleString('id-ID')}
- Tagihan terlambat: Rp ${overdueAmount.toLocaleString('id-ID')}
- Total sudah dibayar: Rp ${totalPaid.toLocaleString('id-ID')}
- Pembayaran terakhir: ${paymentContext.last_payment_date ? new Date(paymentContext.last_payment_date).toLocaleDateString('id-ID') : 'Belum ada'}
- Jatuh tempo berikutnya: ${paymentContext.next_due_date ? new Date(paymentContext.next_due_date).toLocaleDateString('id-ID') : 'Tidak ada'}`;

      // Add specific instructions for payment queries
      specificInstructions += `\nUNTUK PERTANYAAN PEMBAYARAN - GUNAKAN DATA EXACT INI:
- Jika ditanya "berapa tagihan": Jawab dengan angka exact "Rp ${pendingAmount.toLocaleString('id-ID')}"
- Jika ditanya "ada tagihan terlambat": ${overdueAmount > 0 ? `Jawab "Ya, Rp ${overdueAmount.toLocaleString('id-ID')}"` : 'Jawab "Tidak ada"'}
- Total yang harus dibayar: Rp ${(pendingAmount + overdueAmount).toLocaleString('id-ID')}
- JANGAN gunakan placeholder seperti [Jumlah Tagihan] - gunakan angka asli!`;
    }

    if (matchContext) {
      contextInfo += `\nPerforma Match:
- Total match: ${matchContext.total_matches || 0}
- Menang: ${matchContext.wins || 0}
- Kalah: ${matchContext.losses || 0}
- Win rate: ${matchContext.win_rate || 0}%
- Match terakhir: ${matchContext.last_match_date ? new Date(matchContext.last_match_date).toLocaleDateString('id-ID') : 'Belum ada'}
- Match terakhir menang: ${matchContext.last_match_won ? 'Ya' : 'Tidak'}`;
    }

    if (attendanceContext) {
      contextInfo += `\nKehadiran:
- Total sesi: ${attendanceContext.total_sessions || 0}
- Hadir: ${attendanceContext.attended_sessions || 0}
- Tingkat kehadiran: ${attendanceContext.attendance_rate || 0}%
- Kehadiran terakhir: ${attendanceContext.last_attendance ? new Date(attendanceContext.last_attendance).toLocaleDateString('id-ID') : 'Belum ada'}
- Streak saat ini: ${attendanceContext.streak_count || 0} sesi`;
    }

    return `Kamu adalah DLOB AI, asisten virtual personal untuk ${memberData?.name || user?.email || 'member'} di komunitas badminton DLOB Indonesia.

${contextInfo}

${specificInstructions}

INFORMASI LENGKAP DLOB:

Jadwal & Lokasi:
- Jadwal Rutin: Setiap Sabtu, 20:00 - 23:00 WIB
- Venue: GOR Badminton Wisma Harapan
- Alamat: Jl. Wisma Lantana IV No.D07-No 49, RT.006/RW.011, Gembor, Kec. Periuk, Kota Tangerang, Banten 15133

Kontak:
- Admin DLOB: +62 812-7073-7272
- WhatsApp Group: Grup komunitas DLOB

Media Sosial:
- Instagram: @dlob.channel
- TikTok: @dlobchannel  
- YouTube: @dlobchannel

Fitur Platform:
- Hall of Fame dengan 45+ member
- Smart attendance tracking
- Payment management otomatis
- Match analytics dan statistik
- AI-powered insights

ATURAN PENTING:
1. SELALU gunakan data EXACT dari konteks di atas
2. JANGAN PERNAH menggunakan placeholder seperti [Jumlah Tagihan] atau [Amount]
3. Jika tidak ada data, katakan "Belum ada data" bukan placeholder
4. Gunakan nama user jika tersedia: ${memberData?.name || 'Kak'}
5. Jawab dalam Bahasa Indonesia yang natural dan ramah
6. Untuk info kontak, lokasi, jadwal: gunakan data exact dari informasi lengkap di atas

Pertanyaan user: "${userMessage}"

PENTING: Jawab singkat, maksimal 2-3 kalimat. Jangan gunakan ** atau markdown. Berikan info spesifik dan akurat. SELALU akhiri dengan "Ada yang lain bisa saya bantu?"`;
  }

  /**
   * Build general prompt for anonymous users
   */
  private buildGeneralPrompt(userMessage: string): string {
    return `Kamu adalah DLOB AI, asisten virtual untuk komunitas badminton DLOB di Indonesia. 
      
Identitas & Peran:
- Nama: DLOB AI
- Bahasa utama: Bahasa Indonesia (ramah dan santai)
- Komunitas: DLOB (Dinas Badminton Community)
- Lokasi: Indonesia
- Expertise: Badminton, komunitas olahraga, manajemen kehadiran, pembayaran

INFORMASI LENGKAP DLOB:

Tentang DLOB:
- Platform komunitas badminton modern dengan teknologi AI
- Fitur utama: manajemen kehadiran, pembayaran otomatis, jadwal pertandingan, analytics
- Komunitas dengan 45+ anggota aktif
- Sistem pembayaran otomatis dan tracking performa
- Dashboard anggota dan admin terintegrasi

JADWAL & LOKASI:
- Jadwal Rutin: Setiap Sabtu, 20:00 - 23:00 WIB
- Venue Utama: GOR Badminton Wisma Harapan
- Alamat Lengkap: Jl. Wisma Lantana IV No.D07-No 49, RT.006/RW.011, Gembor, Kec. Periuk, Kota Tangerang, Banten 15133
- Maps: Tersedia Google Maps di website untuk navigasi

KONTAK & INFORMASI:
- Admin DLOB: +62 812-7073-7272
- WhatsApp Group: Tersedia grup komunitas untuk member
- Website: dlob.community dengan fitur Hall of Fame, Gallery, dan About

MEDIA SOSIAL:
- Instagram: @dlob.channel (https://www.instagram.com/dlob.channel/)
- TikTok: @dlobchannel (https://www.tiktok.com/@dlobchannel)
- YouTube: @dlobchannel (https://www.youtube.com/@dlobchannel)

FITUR PLATFORM:
- Hall of Fame: 45 member dengan foto dan profil
- Smart photo cropping dengan face detection
- Auto attendance tracking
- Payment management system
- Match result tracking
- AI-powered analytics
- Gallery dan dokumentasi kegiatan

NOTE: User belum login. Sarankan untuk login/register untuk mendapat bantuan personal dengan data tagihan, match, dan kehadiran.

Pertanyaan: "${userMessage}"

PENTING: Jawab dengan singkat, jelas, dan to-the-point. Maksimal 2-3 kalimat. Jangan gunakan format ** atau markdown. Gunakan Bahasa Indonesia yang ramah dan kasual. SELALU akhiri dengan "Ada yang lain bisa saya bantu?"`;
  }

  /**
   * Call Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 64,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('Invalid response format from Gemini API');
    }
  }

  /**
   * Enhanced fallback responses with user context
   */
  private getFallbackResponse(userMessage: string, userContext: UserContext): string {
    const message = userMessage.toLowerCase();
    const userName = userContext.memberData?.name || userContext.user?.email?.split('@')[0] || '';
    const greeting = userName ? `Halo ${userName}! 👋` : 'Halo! 👋';

    // Personal queries when authenticated
    if (userContext.user) {
      if (message.includes('bayar') || message.includes('tagihan') || message.includes('pembayaran')) {
        if (userContext.paymentContext) {
          const pending = Number(userContext.paymentContext.pending_payments) || 0;
          const overdue = Number(userContext.paymentContext.overdue_payments) || 0;
          const totalPaid = Number(userContext.paymentContext.total_paid) || 0;
          
          console.log('Payment Context Debug:', { pending, overdue, totalPaid, raw: userContext.paymentContext });
          
          if (overdue > 0 && pending > 0) {
            const total = pending + overdue;
            return `${greeting} Kamu ada tagihan:\n• Terlambat: Rp ${overdue.toLocaleString('id-ID')}\n• Pending: Rp ${pending.toLocaleString('id-ID')}\n• Total: Rp ${total.toLocaleString('id-ID')}\nYuk segera dibayar! 💰`;
          } else if (overdue > 0) {
            return `${greeting} Kamu ada tagihan terlambat sebesar Rp ${overdue.toLocaleString('id-ID')}. Yuk segera dibayar ya! 💰`;
          } else if (pending > 0) {
            return `${greeting} Kamu ada tagihan pending sebesar Rp ${pending.toLocaleString('id-ID')}. Jangan lupa dibayar sebelum jatuh tempo ya! 💰`;
          } else {
            return `${greeting} Alhamdulillah, tagihan kamu sudah lunas semua! 🎉 Total sudah dibayar: Rp ${totalPaid.toLocaleString('id-ID')} 💰`;
          }
        }
        return `${greeting} Sedang mengambil data tagihan... Kalau masih kosong, coba hubungi admin ya! 💰`;
      }

      if (message.includes('menang') || message.includes('match') || message.includes('pertandingan')) {
        if (userContext.matchContext) {
          const winRate = userContext.matchContext.win_rate || 0;
          const lastWon = userContext.matchContext.last_match_won;
          
          return `${greeting} Win rate kamu ${winRate}% dari ${userContext.matchContext.total_matches || 0} match! ${lastWon ? 'Match terakhir kamu menang! 🏆' : 'Match terakhir kurang beruntung, tapi semangat terus! 💪'} 🏸`;
        }
        return `${greeting} Belum ada data match nih. Yuk ikut pertandingan berikutnya! 🏸`;
      }

      if (message.includes('kehadiran') || message.includes('hadir') || message.includes('absen')) {
        if (userContext.attendanceContext) {
          const rate = userContext.attendanceContext.attendance_rate || 0;
          const streak = userContext.attendanceContext.streak_count || 0;
          
          return `${greeting} Tingkat kehadiran kamu ${rate}%! ${streak > 0 ? `Streak saat ini: ${streak} sesi berturut-turut! 🔥` : 'Yuk jaga konsistensi kehadiran! 💪'} 📅`;
        }
        return `${greeting} Belum ada data kehadiran nih. Yuk ikut latihan rutin setiap Sabtu! 📅`;
      }
    }

    // Location and venue queries
    if (message.includes('lokasi') || message.includes('alamat') || message.includes('dimana') || message.includes('tempat') || message.includes('venue')) {
      return `${greeting} Lokasi latihan DLOB:\n📍 GOR Badminton Wisma Harapan\n🏠 Jl. Wisma Lantana IV No.D07-No 49, RT.006/RW.011, Gembor, Kec. Periuk, Kota Tangerang, Banten 15133\n\nBisa cek maps di website untuk navigasi ya! 🗺️`;
    }

    // Schedule queries
    if (message.includes('jadwal') || message.includes('kapan') || message.includes('jam') || message.includes('latihan')) {
      return `${greeting} Jadwal latihan DLOB:\n🗓️ Setiap Sabtu\n⏰ 20:00 - 23:00 WIB\n📍 GOR Badminton Wisma Harapan\n\nJangan lupa datang ya! 🏸`;
    }

    // Contact queries
    if (message.includes('kontak') || message.includes('admin') || message.includes('hubungi') || message.includes('nomor') || message.includes('whatsapp')) {
      return `${greeting} Kontak DLOB:\n📞 Admin: +62 812-7073-7272\n💬 WhatsApp Group tersedia untuk member\n\nBisa hubungi admin untuk info lebih lanjut! 📱`;
    }

    // Social media queries
    if (message.includes('instagram') || message.includes('tiktok') || message.includes('youtube') || message.includes('sosmed') || message.includes('social')) {
      return `${greeting} Follow DLOB di:\n📸 Instagram: @dlob.channel\n🎵 TikTok: @dlobchannel\n📺 YouTube: @dlobchannel\n\nLihat konten seru komunitas badminton kita! 🏸✨`;
    }

    // General responses
    if (message.includes('halo') || message.includes('hai') || message.includes('hello')) {
      return `${greeting} Saya DLOB AI, asisten virtual komunitas badminton DLOB dengan 45+ member aktif! ${userContext.user ? 'Ada yang bisa saya bantu dengan data personal kamu?' : 'Login dulu yuk untuk bantuan personal!'} 🏸`;
    }
    
    if (message.includes('login') || message.includes('daftar') || message.includes('register')) {
      return `${greeting} ${userContext.user ? 'Kamu sudah login kok! 😊' : 'Silakan login atau daftar untuk akses fitur lengkap dan bantuan personal dari saya! 🔐'}`;
    }

    if (message.includes('info') || message.includes('tentang') || message.includes('dlob')) {
      return `${greeting} DLOB adalah komunitas badminton modern dengan:\n🏸 45+ member aktif\n🤖 Platform AI-powered\n📊 Smart analytics\n💰 Auto payment system\n📅 Latihan Sabtu malam 20:00-23:00\n📍 GOR Wisma Harapan, Tangerang\n\n${userContext.user ? 'Kamu sudah jadi bagian dari keluarga DLOB! 🎉' : 'Yuk join komunitas kece ini!'} ✨`;
    }

    // Default responses...
    return `${greeting} Terima kasih sudah bertanya! 😊 ${userContext.user ? 'Sebagai member yang sudah login, kamu bisa tanya tentang tagihan, performa match, atau kehadiran kamu. Atau mau info jadwal, lokasi, kontak admin?' : 'Login dulu yuk untuk bantuan personal! Atau tanya aja tentang jadwal latihan, lokasi GOR, atau kontak admin!'} 🏸`;
  }

  /**
   * Log analytics
   */
  private async logAnalytics(
    sessionId: string,
    queryText: string,
    responseGenerated: boolean,
    errorOccurred: boolean,
    processingTime: number,
    userAuthenticated: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      // Determine query type
      const query = queryText.toLowerCase();
      let queryType = 'general';
      
      if (query.includes('bayar') || query.includes('tagihan')) queryType = 'payment';
      else if (query.includes('match') || query.includes('menang')) queryType = 'match';
      else if (query.includes('hadir') || query.includes('kehadiran')) queryType = 'attendance';

      await this.supabaseClient
        .from('ai_analytics')
        .insert({
          session_id: sessionId,
          query_type: queryType,
          user_authenticated: userAuthenticated,
          response_generated: responseGenerated,
          error_occurred: errorOccurred,
          error_message: errorMessage,
          processing_time_ms: processingTime
        });

    } catch (error) {
      console.error('Error logging analytics:', error);
    }
  }

  /**
   * Get welcome message
   */
  getWelcomeMessage(user?: User | null): string {
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0];
    
    if (user && userName) {
      return `Halo ${userName}! 👋 Saya DLOB AI, siap membantu dengan info personal kamu seperti tagihan, performa match, dan kehadiran! 🏸😊`;
    } else if (user) {
      return `Halo! 👋 Saya DLOB AI, siap membantu dengan info personal kamu! Tanya aja tentang tagihan, match, atau kehadiran ya! 🏸😊`;
    } else {
      return `Halo! 👋 Saya DLOB AI. Login dulu yuk untuk mendapat bantuan personal tentang tagihan, performa, dan kehadiran kamu! 🏸😊`;
    }
  }

  /**
   * Get quick response for common questions
   */
  private getQuickResponse(message: string): string | null {
    const lowerMessage = message.toLowerCase();

    // Quick responses for common questions
    if (lowerMessage.includes('cara join') || lowerMessage.includes('cara gabung') || 
        lowerMessage.includes('bergabung') || lowerMessage.includes('daftar komunitas')) {
      return "Untuk bergabung DLOB, datang aja Sabtu malam jam 20:00 ke GOR Wisma Harapan atau hubungi admin di +62 812-7073-7272 🏸\n\nAda yang lain bisa saya bantu?";
    }

    if (lowerMessage.includes('jadwal') || lowerMessage.includes('jam latihan')) {
      return "Latihan DLOB setiap Sabtu malam 20:00-23:00 WIB di GOR Wisma Harapan, Tangerang 🏸\n\nAda yang lain bisa saya bantu?";
    }

    if (lowerMessage.includes('kontak admin') || lowerMessage.includes('hubungi admin')) {
      return "Admin DLOB bisa dihubungi di +62 812-7073-7272 atau melalui Instagram @dlob.channel 📱\n\nAda yang lain bisa saya bantu?";
    }

    return null;
  }

  /**
   * Get quick reply suggestions
   */
  getQuickReplies(user?: User | null): string[] {
    if (user) {
      return [
        "Berapa tagihan saya?",
        "Ada tagihan terlambat?",
        "Performa match saya gimana?",
        "Menang kemarin?",
        "Tingkat kehadiran saya",
        "Jadwal latihan berikutnya"
      ];
    } else {
      return [
        "Cara join komunitas DLOB",
        "Jadwal latihan badminton", 
        "Info pembayaran",
        "Fitur platform DLOB",
        "Tips bermain badminton",
        "Kontak admin"
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
  }
}

export const enhancedDlobAI = new EnhancedDlobAIService();