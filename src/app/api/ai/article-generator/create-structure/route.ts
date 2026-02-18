import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Short timeout - just generating text structure
export const maxDuration = 60; // 1 minute

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface ArticleStructure {
  title: string;
  category: string;
  tags: string[];
  excerpt: string;
  seo_title: string;
  seo_description: string;
  hero_image_prompt: string;
  intro: string;
  sections: Array<{
    heading: string;
    content: string;
    has_image: boolean;
    image_prompt?: string;
  }>;
  conclusion: string;
  cta_text: string;
  cta_image_prompt: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function calculateReadTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

function getFallbackImageUrl(type: 'hero' | 'body' | 'cta', index: number = 0): string {
  const placeholderImages = [
    'photo-1626224583764-f87db24ac4ea', // Badminton court
    'photo-1606567595334-d39972c85dbe', // Badminton player
    'photo-1490645935967-10de6ba17061', // Healthy food bowl
    'photo-1546069901-ba9599a7e63c', // Fresh salad
    'photo-1612872087720-bb876e2e67d1', // Badminton equipment
    'photo-1511688878353-3a2f5be94cd7', // Fruits and vegetables
    'photo-1517649763962-0c623066013b', // Indoor sport
    'photo-1498837167922-ddd27525d352', // Healthy meal
  ];

  const imageIndex = (index + (type === 'hero' ? 0 : type === 'cta' ? 7 : index + 1)) % placeholderImages.length;
  const imageId = placeholderImages[imageIndex];

  if (type === 'hero') return `https://images.unsplash.com/${imageId}?w=1200&h=600&fit=crop&q=80`;
  if (type === 'body') return `https://images.unsplash.com/${imageId}?w=800&h=600&fit=crop&q=80`;
  return `https://images.unsplash.com/${imageId}?w=1000&h=750&fit=crop&q=80`;
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { prompt, userId, userName } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('📝 Step 1/2: Generating article structure from prompt:', prompt);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const systemPrompt = `Kamu adalah AI penulis artikel profesional untuk komunitas badminton DLOB.

TUGAS: Buat artikel lengkap dalam format JSON berdasarkan prompt dari user.

STRUKTUR ARTIKEL (WAJIB DIIKUTI):
1. Hero Image (gambar utama yang menarik)
2. Paragraf Pembuka (2-3 paragraf engaging)
3. 3-5 Sub-Judul dengan konten masing-masing (300-500 kata per bagian)
4. Gambar Penjelas setiap 300-500 kata
5. Kesimpulan yang kuat
6. CTA (Call to Action) dengan gambar

ATURAN GAMBAR (WAJIB - SANGAT PENTING):
- Hero Image: Wajib ada, harus eye-catching dan berkualitas tinggi
- Body Images: Sisipkan setiap 300-500 kata untuk breaking the wall
- Semua gambar harus punya deskripsi prompt untuk AI image generator
- Gambar harus relevan 100% dengan konten di sekitarnya

⚠️ ATURAN KHUSUS PROMPT GAMBAR BADMINTON (WAJIB DIIKUTI):
SETIAP prompt gambar HARUS relevan dengan konteks artikel dan bagiannya:

A. UNTUK GAMBAR PEMAIN/ATLET BADMINTON:
- WAJIB termasuk kata kunci: "badminton" atau "badminton court" atau "shuttlecock" atau "badminton racket"
- WAJIB menyebutkan elemen visual: "player holding badminton racket", "shuttlecock in motion", "indoor badminton court with green/blue floor", "badminton net"
- WAJIB menyebutkan: "wearing DLOB jersey" atau "in DLOB uniform" atau "DLOB badminton team jersey" untuk setiap gambar yang menampilkan pemain
- Warna jersey DLOB: hitam atau putih dengan logo DLOB
- PENTING: Sesuaikan usia/demografi pemain dengan target artikel:
  * Artikel tentang anak-anak → "children aged 6-12" atau "young kids" atau "junior badminton players"
  * Artikel tentang remaja → "teenage players" atau "youth badminton athletes"
  * Artikel tentang dewasa → "adult players" atau "professional badminton athletes"
  * Artikel tentang lansia → "senior players" atau "elderly badminton enthusiasts"

B. UNTUK GAMBAR NON-ATLET (nutrisi, peralatan, fasilitas, dll):
- JIKA tentang NUTRISI/MAKANAN: Tunjukkan makanan sehat, meal prep, protein, buah, sayuran, minuman olahraga, suplemen
  * Contoh: "Professional food photography of healthy athlete meal with grilled chicken, brown rice, vegetables and fruits on white plate, clean lighting, top view"
  * Contoh: "Sports nutrition spread showing protein shake, bananas, energy bars, and bottled water on wooden table, natural lighting"
- JIKA tentang PERALATAN: Tunjukkan raket, shuttlecock, sepatu badminton, tas, grip, senar
  * Contoh: "Professional product photography of badminton racket with shuttlecocks on clean background, studio lighting"
- JIKA tentang FASILITAS: Tunjukkan lapangan, gedung olahraga, gym, area pemanasan
  * Contoh: "Wide angle shot of professional indoor badminton court with green floor, white net, and stadium seating"
- JIKA tentang KESEHATAN/MEDIS: Tunjukkan stretching, physiotherapy, injury prevention, medical care
  * Contoh: "Professional photo of athlete stretching leg muscles on yoga mat, fitness studio environment"

C. ATURAN UMUM:
- SETIAP gambar harus BERBEDA dan unik - variasikan angle, pose, dan komposisi
- Hindari prompt yang terlalu abstrak atau umum
- Pastikan gambar 100% relevan dengan konten bagian artikel tersebut
- Gunakan kata kunci spesifik untuk hasil terbaik

FORMAT OUTPUT (JSON):
{
  "title": "Judul artikel yang menarik dan SEO-friendly",
  "category": "pilih: Tips & Trik / Kesehatan / Strategi / Komunitas / Berita",
  "tags": ["tag1", "tag2", "tag3"],
  "excerpt": "Ringkasan 2-3 kalimat yang menarik",
  "seo_title": "SEO title maksimal 60 karakter",
  "seo_description": "Meta description maksimal 155 karakter",
  "hero_image_prompt": "Gambar utama yang menarik - bisa atlet badminton (dengan DLOB jersey + usia spesifik) ATAU makanan/peralatan/fasilitas tergantung topik artikel. Professional photography, dramatic lighting",
  "intro": "Paragraf pembuka 2-3 paragraf yang engaging",
  "sections": [
    {
      "heading": "Sub Judul 1",
      "content": "Konten lengkap 300-500 kata",
      "has_image": true/false,
      "image_prompt": "SESUAIKAN dengan konten bagian ini: Jika tentang atlet → sertakan DLOB jersey + usia spesifik + elemen badminton. Jika tentang nutrisi → food photography makanan sehat. Jika tentang peralatan → product shot raket/shuttlecock. Jika tentang fasilitas → lapangan/gym. SETIAP gambar HARUS BERBEDA angle/komposisi!"
    }
  ],
  "conclusion": "Kesimpulan yang kuat dan memorable",
  "cta_text": "Ajakan untuk pembaca (misal: Bergabunglah dengan DLOB!)",
  "cta_image_prompt": "Inspiring image sesuai tema artikel - bisa pemain DLOB yang motivational ATAU makanan/peralatan/fasilitas yang mendukung CTA, professional photography, BERBEDA dari gambar lain"
}

PENTING - VARIASI DAN RELEVANSI GAMBAR:
- Analisis setiap bagian artikel untuk tentukan jenis gambar yang paling relevan
- Artikel nutrisi → lebih banyak gambar makanan, meal prep, minuman
- Artikel teknik → lebih banyak gambar atlet demonstrasi teknik (dengan DLOB jersey)
- Artikel peralatan → lebih banyak produk shot raket, sepatu, tas
- Artikel kesehatan → mix antara atlet stretching dan makanan sehat
- SETIAP gambar HARUS berbeda:
  * Gambar 1: Misalnya hero shot atlet atau makanan utama
  * Gambar 2: Misalnya close-up detail atau bahan makanan
  * Gambar 3: Misalnya wide shot suasana atau variasi menu
  * Gambar 4: Misalnya different angle atau presentation style
- Pastikan 100% relevan dengan konten di sekitarnya!

GAYA PENULISAN:
- Bahasa Indonesia formal tapi friendly
- Target: Pemain badminton dari pemula hingga profesional
- Tone: Informatif, inspiratif, actionable
- Gunakan contoh konkret dan data jika relevan
- Hindari jargon yang terlalu teknis

PROMPT USER: ${prompt}

Buat artikel lengkap sekarang dalam format JSON yang sempurna!`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    // Extract JSON from response
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      jsonText = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      jsonText = responseText.split('```')[1].split('```')[0].trim();
    }

    const articleData: ArticleStructure = JSON.parse(jsonText);
    const slug = generateSlug(articleData.title);

    console.log('✅ Article structure generated:', articleData.title);

    // Calculate read time
    const fullText = articleData.intro + 
      articleData.sections.map(s => s.content).join(' ') + 
      articleData.conclusion;
    const readTime = calculateReadTime(fullText);

    // Create content with fallback images (will be replaced with AI images later)
    const content = {
      hero_image: {
        url: getFallbackImageUrl('hero', 0),
        alt: articleData.title,
        prompt: articleData.hero_image_prompt,
        is_placeholder: true
      },
      intro: articleData.intro,
      sections: articleData.sections.map((section, index) => ({
        heading: section.heading,
        content: section.content,
        image: section.has_image ? {
          url: getFallbackImageUrl('body', index),
          alt: section.heading,
          prompt: section.image_prompt!,
          is_placeholder: true
        } : null
      })),
      conclusion: articleData.conclusion,
      cta: {
        text: articleData.cta_text,
        image: {
          url: getFallbackImageUrl('cta', 0),
          alt: 'Call to Action',
          prompt: articleData.cta_image_prompt,
          is_placeholder: true
        }
      }
    };

    // Save to database with fallback images
    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        title: articleData.title,
        slug: slug,
        content: content,
        category: articleData.category,
        tags: articleData.tags,
        excerpt: articleData.excerpt,
        read_time_minutes: readTime,
        author_id: userId,
        author_name: userName || 'Admin DLOB',
        original_prompt: prompt,
        generation_model: 'gemini-2.5-flash-lite',
        seo_title: articleData.seo_title,
        seo_description: articleData.seo_description,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save article', details: error.message },
        { status: 500 }
      );
    }

    console.log('💾 Article saved to database with ID:', article.id);
    console.log('📊 Images to generate:', {
      hero: 1,
      body: articleData.sections.filter(s => s.has_image).length,
      cta: 1,
      total: 2 + articleData.sections.filter(s => s.has_image).length
    });

    return NextResponse.json({
      success: true,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        category: article.category,
        excerpt: article.excerpt,
        read_time: article.read_time_minutes,
        content: article.content,
        status: article.status
      },
      imagesToGenerate: {
        hero: { prompt: articleData.hero_image_prompt, type: 'hero', index: 0 },
        body: articleData.sections
          .map((section, index) => section.has_image ? {
            prompt: section.image_prompt!,
            type: 'body' as const,
            index,
            sectionIndex: index
          } : null)
          .filter(Boolean),
        cta: { prompt: articleData.cta_image_prompt, type: 'cta', index: 0 }
      }
    });

  } catch (error) {
    console.error('❌ Article structure generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate article structure', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
