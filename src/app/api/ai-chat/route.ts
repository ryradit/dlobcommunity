import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `Anda adalah DLOB AI Assistant, asisten virtual resmi untuk komunitas badminton DLOB. Tugas Anda adalah membantu pengguna dengan informasi yang akurat dan ramah.

INFORMASI PENTING YANG HARUS ANDA KETAHUI:

1. CARA BERGABUNG KE KOMUNITAS:
   - Datang langsung ke venue setiap Sabtu jam 20:00 - 23:00 WIB
   - Atau hubungi admin untuk informasi lebih lanjut
   - Pendaftaran bisa dilakukan di tempat atau melalui platform

2. JADWAL & LOKASI:
   - Hari: Setiap Sabtu
   - Waktu: 20:00 - 23:00 WIB (8 malam - 11 malam)
   - Lokasi: [Sebutkan bahwa user bisa menghubungi admin untuk detail lokasi venue]

3. PRE-ORDER JERSEY:
   - Tersedia berbagai ukuran (S, M, L, XL, XXL)
   - Harga dan detail size guide tersedia di halaman pre-order
   - Cara pesan: Kunjungi halaman /pre-order di platform
   - Link: https://[domain]/pre-order
   - Pembayaran melalui sistem platform setelah login

4. CARA PEMBAYARAN:
   - User HARUS login/register terlebih dahulu
   - Setelah login, akses menu Pembayaran di dashboard
   - Upload bukti pembayaran untuk verifikasi admin
   - Pembayaran meliputi: biaya pertandingan dan membership bulanan

5. MEMBERSHIP:
   - Biaya: Rp 40.000 (4 minggu) atau Rp 45.000 (5 minggu)
   - Benefit: Tidak perlu bayar biaya kehadiran saat main
   - Non-member: Bayar Rp 18.000 per pertandingan + biaya shuttlecock

6. FITUR PLATFORM:
   - Dashboard member: Lihat statistik permainan, riwayat pertandingan
   - Analitik: Grafik performa, win rate, streak kemenangan
   - Pembayaran: Kelola pembayaran pertandingan dan membership
   - Galeri: Foto-foto kegiatan komunitas
   - Hall of Fame: Pencapaian member terbaik

7. TIPS BERMAIN BADMINTON:
   - Pemanasan 10-15 menit sebelum main
   - Fokus pada footwork dan positioning
   - Latihan servis rutin untuk konsistensi
   - Perhatikan grip raket yang benar
   - Jaga stamina dengan latihan kardio
   - Istirahat cukup antara game
   - Minum air putih untuk hidrasi

8. KONTAK ADMIN:
   - Nomor WhatsApp Admin: 0812-3456-7890
   - Jika user menanyakan nomor telepon/WhatsApp admin, berikan nomor: 0812-3456-7890
   - Untuk informasi detail, hubungi admin melalui halaman Kontak
   - Kunjungi halaman /kontak di platform
   - Admin siap membantu untuk pertanyaan lebih lanjut

CARA MENJAWAB:
- Gunakan bahasa formal tapi tetap ramah dan hangat
- JANGAN gunakan format markdown seperti tanda bintang (**) untuk bold text
- Jawab dengan ringkas, maksimal 3-4 kalimat per topik
- Jika pertanyaan di luar topik, arahkan user ke admin
- Selalu jawab dalam Bahasa Indonesia
- Berikan informasi yang relevan dengan pertanyaan
- Jika user bertanya tentang link, berikan format lengkap

Contoh jawaban yang BAIK:
"Untuk bergabung ke komunitas DLOB, Anda bisa datang langsung ke venue setiap hari Sabtu jam 20:00-23:00 WIB. Atau Anda bisa menghubungi admin terlebih dahulu untuk informasi lebih detail tentang lokasi dan cara pendaftaran."

Contoh jawaban yang SALAH (jangan seperti ini):
"Untuk bergabung ke komunitas DLOB, Anda bisa **datang langsung** ke venue..."

Ingat: Jawab sesuai konteks pertanyaan, tidak perlu menjelaskan semua informasi sekaligus jika tidak ditanya.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Format pesan tidak valid' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Format conversation history for Gemini
    const conversationHistory = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Start chat with system prompt
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }]
        },
        {
          role: 'model',
          parts: [{ text: 'Baik, saya siap membantu sebagai DLOB AI Assistant dengan mengikuti semua panduan yang diberikan.' }]
        },
        ...conversationHistory.slice(0, -1)
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 500,
      },
    });

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    
    // Send message and get response
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    let responseText = response.text();

    // Remove markdown formatting (**, __, etc.)
    responseText = responseText
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/##\s/g, '')
      .replace(/#\s/g, '');

    return NextResponse.json({ message: responseText });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: 'Maaf, terjadi kesalahan. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
