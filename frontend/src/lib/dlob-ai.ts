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
      // OPTIMIZED: Shorter, focused prompt for faster responses
      const systemPrompt = `Kamu DLOB AI untuk komunitas badminton Indonesia. Jawab singkat dalam Bahasa Indonesia.

DLOB:
- Latihan: Sabtu 20:00-23:00 WIB, GOR Wisma Harapan, Tangerang
- Admin: +62 812-7073-7272
- IG: @dlob.channel
- Jersey: Pre-order sampai 15 Des 2025, mulai Rp 110k (S-XL), XXL (120k), 3XL (130k)
- 3 warna: Biru Navy, Pink, Kuning
- Order: /pre-order

Pertanyaan: "${userMessage}"

Jawab maksimal 2 kalimat, akhiri "Ada yang lain bisa saya bantu?"`;

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
            temperature: 0.7,     // Reduced for faster, more consistent responses
            topK: 32,            // Reduced for speed
            topP: 0.8,           // Reduced for speed
            maxOutputTokens: 512, // Reduced for shorter, faster responses
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
    
    if (message.includes('jersey') || message.includes('baju') || message.includes('kaos') || message.includes('seragam') || message.includes('merchandise')) {
      return "Jersey DLOB Official sedang pre-order nih! 👕 Tersedia 3 warna (Biru Navy, Pink, Kuning) dengan bahan Milano Standard premium. Harga mulai Rp 110.000 untuk ukuran S-XL. Batas pre-order sampai 15 Desember 2025, pengiriman Januari 2026. Order di /pre-order ya! 🏸\n\nAda yang lain bisa saya bantu?";
    }
    
    if (message.includes('harga jersey') || message.includes('berapa jersey') || message.includes('ukuran jersey')) {
      return "Info lengkap Jersey DLOB: 💰\n\nLengan Pendek:\n• S/M/L/XL: Rp 110.000\n• XXL: Rp 120.000\n• 3XL: Rp 130.000\n\nLengan Panjang (+Rp 10.000)\n\nUkuran tersedia S sampai 3XL dengan panduan ukuran lengkap di /store. Pre-order sampai 15 Des 2025! 👕🏸\n\nAda yang lain bisa saya bantu?";
    }
    
    if (message.includes('pesan jersey') || message.includes('beli jersey') || message.includes('order jersey') || message.includes('pre order')) {
      return "Cara order Jersey DLOB gampang kok! 📝\n\n1. Online: Kunjungi /pre-order untuk isi form\n2. Lihat koleksi: Check /store untuk detail\n3. Kontak admin: +62 812-7073-7272\n\nPembayaran via transfer bank, estimasi kirim Januari 2026. Buruan pesan sebelum batas waktu 15 Desember ya! 🏸👕\n\nAda yang lain bisa saya bantu?";
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
      "Info Jersey DLOB Official",
      "Harga dan ukuran jersey",
      "Cara pesan jersey",
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