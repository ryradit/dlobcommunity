interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
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

export class DlobAIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Gemini API key not configured. DLOB AI will use fallback responses.');
    }
  }

  /**
   * Generate AI response using Gemini
   */
  async generateResponse(userMessage: string): Promise<string> {
    if (!this.apiKey) {
      return this.getFallbackResponse(userMessage);
    }

    try {
      // Create context-aware prompt for DLOB community
      const systemPrompt = `Kamu adalah DLOB AI, asisten virtual untuk komunitas badminton DLOB di Indonesia. 
      
Identitas & Peran:
- Nama: DLOB AI
- Bahasa utama: Bahasa Indonesia (ramah dan santai)
- Komunitas: DLOB (Dinas Badminton Community)
- Lokasi: Indonesia
- Expertise: Badminton, komunitas olahraga, manajemen kehadiran, pembayaran

Tentang DLOB:
- Platform komunitas badminton modern dengan teknologi AI
- Fitur utama: manajemen kehadiran, pembayaran otomatis, jadwal pertandingan, analytics
- Sesi latihan: Setiap Sabtu malam
- Sistem pembayaran otomatis dan tracking performa
- Galeri video YouTube terintegrasi
- Dashboard anggota dan admin

Gaya komunikasi:
- Gunakan bahasa Indonesia yang ramah dan santai
- Sapaan: "Halo!" atau "Hai!"
- Panggilan: "Kak" atau "teman"
- Emoji yang sesuai: 🏸 🎾 💪 👋 😊
- Responsif dan membantu
- SELALU akhiri jawaban dengan "Ada yang lain bisa saya bantu?"
- Jika tidak tahu jawabannya, jujur dan arahkan ke admin

Topik yang bisa dibahas:
- Cara join komunitas DLOB
- Jadwal latihan dan pertandingan
- Sistem pembayaran
- Fitur-fitur platform
- Tips bermain badminton
- Info umum komunitas
- Troubleshooting platform

Pertanyaan user: "${userMessage}"

Jawab dalam Bahasa Indonesia dengan ramah dan informatif:`;

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: systemPrompt
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

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Fallback responses when Gemini API is not available
   */
  private getFallbackResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    // Common badminton/DLOB related responses
    if (message.includes('halo') || message.includes('hai') || message.includes('hello')) {
      return "Halo! 👋 Saya DLOB AI, asisten virtual komunitas badminton DLOB. Ada yang bisa saya bantu hari ini? 🏸";
    }
    
    if (message.includes('join') || message.includes('gabung') || message.includes('daftar')) {
      return "Untuk bergabung dengan komunitas DLOB, kak bisa klik tombol 'Gabung Komunitas' di halaman utama atau langsung ke halaman register. Setelah itu, kak bisa ikut latihan rutin setiap Sabtu malam! 🏸💪\n\nAda yang lain bisa saya bantu?";
    }
    
    if (message.includes('jadwal') || message.includes('latihan') || message.includes('main')) {
      return "Latihan rutin DLOB dilakukan setiap Sabtu malam kak! Untuk jadwal lebih detail, bisa cek di dashboard member atau hubungi admin komunitas. 📅🏸\n\nAda yang lain bisa saya bantu?";
    }
    
    if (message.includes('bayar') || message.includes('pembayaran') || message.includes('biaya')) {
      return "DLOB punya sistem pembayaran otomatis yang memudahkan tracking kontribusi member. Kak bisa lihat detail pembayaran di menu Payments setelah login ke dashboard. 💰\n\nAda yang lain bisa saya bantu?";
    }
    
    if (message.includes('fitur') || message.includes('platform') || message.includes('teknologi')) {
      return "Platform DLOB punya fitur keren seperti: tracking kehadiran otomatis, manajemen pembayaran, analytics performa, galeri video, dan dashboard member/admin yang lengkap! 🚀\n\nAda yang lain bisa saya bantu?";
    }
    
    if (message.includes('badminton') || message.includes('tips') || message.includes('teknik')) {
      return "Badminton adalah olahraga yang asyik! Di DLOB kita fokus pada pengembangan skill dan komunitas yang solid. Yuk gabung latihan rutin untuk improve teknik bareng-bareng! 🏸🎯\n\nAda yang lain bisa saya bantu?";
    }
    
    if (message.includes('galeri') || message.includes('video') || message.includes('foto')) {
      return "DLOB punya galeri keren yang terintegrasi dengan YouTube channel! Kak bisa lihat highlight pertandingan dan sesi latihan di menu Gallery. 📹🏸\n\nAda yang lain bisa saya bantu?";
    }
    
    if (message.includes('admin') || message.includes('kontak') || message.includes('bantuan')) {
      return "Kalau ada pertanyaan lebih lanjut, kak bisa hubungi admin DLOB melalui halaman Contact atau langsung chat di grup komunitas. Admin siap membantu! 📞👥\n\nAda yang lain bisa saya bantu?";
    }
    
    // Default response
    return "Terima kasih sudah bertanya! 😊 Saya DLOB AI siap membantu tentang komunitas badminton DLOB. Bisa tanyakan tentang cara join, jadwal latihan, fitur platform, atau hal lainnya seputar DLOB. Ada yang spesifik ingin ditanyakan kak? 🏸";
  }

  /**
   * Get welcome message
   */
  getWelcomeMessage(): string {
    const welcomeMessages = [
      "Halo! 👋 Saya DLOB AI, asisten virtual komunitas badminton DLOB. Ada yang bisa saya bantu? 🏸",
      "Hai! Selamat datang di DLOB! 😊 Saya di sini untuk membantu pertanyaan seputar komunitas badminton kita. 🏸",
      "Hello! Saya DLOB AI 🤖 Mau tanya tentang jadwal latihan, cara join, atau fitur platform DLOB? 🏸",
    ];
    
    return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  }

  /**
   * Get quick reply suggestions
   */
  getQuickReplies(): string[] {
    return [
      "Cara join komunitas DLOB",
      "Jadwal latihan badminton",
      "Info pembayaran",
      "Fitur platform DLOB",
      "Tips bermain badminton",
      "Kontak admin"
    ];
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const dlobAI = new DlobAIService();
export type { ChatMessage };