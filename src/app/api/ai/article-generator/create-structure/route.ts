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
    'photo-1626224583764-f87db24ac4ea', // Badminton court aerial view
    'photo-1606567595334-d39972c85dbe', // Badminton player action
    'photo-1612872087720-bb876e2e67d1', // Badminton racket and shuttlecock
    'photo-1517649763962-0c623066013b', // Indoor sports facility
    'photo-1471864190281-a93a3070b6de', // Badminton shuttlecock close-up
    'photo-1587280501635-68a0e82cd5ff', // Sports training equipment
    'photo-1461896836934-ffe607ba8211', // Sports and fitness
    'photo-1434596922112-19c563067271', // Athletes in action
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

⚠️ ANALISIS TOPIK ARTIKEL (WAJIB DILAKUKAN TERLEBIH DAHULU):
SEBELUM generate gambar, tentukan KATEGORI UTAMA artikel:
1. BADMINTON FOKUS: Tentang teknik, strategi, latihan, permainan → WAJIB semua gambar tentang badminton/pemain
2. KOMUNITAS/EVENT: Tentang acara DLOB, gathering, sosialisasi, event komunitas → WAJIB pemain badminton/lapangan DLOB
3. NUTRISI/DIET: KHUSUS artikel yang FOKUS membahas nutrisi/makanan untuk atlet → Boleh gambar makanan
4. PERALATAN: KHUSUS review/rekomendasi gear badminton → Boleh gambar peralatan + atlet demonstrasi
5. KESEHATAN: Tentang injury prevention, kesehatan atlet, recovery → WAJIB gambar pemain demonstrasi/latihan

⚠️ ATURAN KETAT GAMBAR RELEVANSI (BREAKER RULE):
❌ JANGAN PERNAH GUNAKAN GAMBAR:
- Sport lain (cycling, running, basketball, football, dll) - ATURAN ABSOLUTE
- Makanan jika artikel BUKAN fokus nutrisi (hanya menyebut "protein" tidak cukup)
- Abstract atau umum yang tidak spesifik
- Wajah tanpa konteks badminton (portrait random)
- Olahraga outdoor yang bukan badminton

✅ WAJIB GUNAKAN:
- Badminton court dengan shuttlecock dan racket
- Player dengan DLOB jersey (black/white/blue)
- Indoor sports facility yang spesifik badminton
- Badminton equipment close-ups
- Actionable, situational gambar yang relevan dengan narasi

ATURAN GAMBAR BERDASARKAN KATEGORI ARTIKEL:

1. ARTIKEL BADMINTON (TEKNIK/STRATEGI/LATIHAN/TIPS):
   RULE: 100% semua gambar HARUS badminton-related dengan atlet/lapangan/equipment
   - Hero: "Professional badminton player in action shot during intense rally, wearing DLOB jersey, holding racket mid-swing, indoor badminton court background, sharp focus"
   - Body A: "Close-up of badminton player demonstrating correct grip technique, hands holding DLOB racket, white background, professional sports photography"
   - Body B: "Wide shot of indoor badminton court with net, players in DLOB jersey during practice, professional lighting, clear court markings"
   - CTA: "Inspiring badminton player in DLOB jersey celebrating winning point, dynamic pose, badminton court setting"
   NO FOOD, NO OTHER SPORTS ALLOWED!

2. ARTIKEL KOMUNITAS/EVENT/SILATURAHMI:
   RULE: Focus pada pemain badminton, lapangan, gathering moment, but BADMINTON-centric
   - Hero: "Group of badminton players in DLOB jersey gathered at court during community event, friendly atmosphere, smiling faces"
   - Body: "Badminton court scene with multiple players during DLOB tournament/gathering, social moment, team spirit"
   - CTA: "DLOB badminton community members together on court ready to play, unity and friendship"
   NO UNRELATED SPORTS! No cycling, no random gatherings without badminton context!

3. ARTIKEL NUTRISI (HANYA jika FOKUS pembahasan nutrisi):
   RULE: Maksimal 60% gambar makanan, minimal 40% tetap pemain badminton
   - Hero: "Professional food photography of healthy athlete meal with balanced proteins and carbs"
   - Body 1: Bisa food prep atau meal
   - Body 2: WAJIB "Badminton player in DLOB jersey training with energy and focus, demonstrating the result of proper nutrition"
   - CTA: "Badminton athlete eating nutritious meal, energized and ready to train harder"

4. ARTIKEL PERALATAN (raket, sepatu, net, dll):
   RULE: Mix product + player demonstration
   - Hero: "Professional product photography of new badminton racket with shuttlecocks"
   - Body 1: "Close-up detail shot of badminton racket strings and head"
   - Body 2: "Player in DLOB jersey holding and using the equipment during match/practice"
   - CTA: "Complete badminton gear display with racket, shoes, and shuttlecock on premium background"

5. ARTIKEL KESEHATAN/INJURY/RECOVERY:
   RULE: Pemain demonstrasi, physiotherapy, training
   - Hero: "Badminton player receiving professional physiotherapy massage on shoulder after training, clinical setting"
   - Body: "Athlete doing recovery exercises or stretching routine"
   - CTA: "Healthy badminton player in DLOB jersey demonstrating proper form and fitness"

VALIDASI SEBELUM OUTPUT (WAJIB LAKUKAN CHECK):
❓ Untuk setiap gambar prompt, tanya diri sendiri:
1. Apakah prompt ini SPESIFIK atau GENERIC? → Harus SPESIFIK
2. Apakah gambar ini 100% relevan dengan isi artikel/section? → Harus YES
3. Apakah mencakup badminton elements (racket/court/shuttlecock/jersey) jika memang BADMINTON artikel? → Harus YES
4. Apakah menghindari unrelated sports? → Harus TIDAK ada olahraga lain
5. Adalah apakah prompt ini ACTIONABLE dan VISUAL? → Harus YES

Jika ada prompt yang TIDAK memenuhi kriteria ini, REVISI SEBELUM OUTPUT!

FORMAT OUTPUT (JSON - WAJIB IKUTI PARAMETER IMAGE DENGAN KETAT):
{
  "title": "Judul artikel yang menarik dan SEO-friendly",
  "category": "Tentukan kategori yang AKURAT: Tips & Trik / Strategi / Komunitas / Kesehatan / Berita",
  "tags": ["tag1", "tag2", "tag3"],
  "excerpt": "Ringkasan 2-3 kalimat yang menarik",
  "seo_title": "SEO title maksimal 60 karakter",
  "seo_description": "Meta description maksimal 155 karakter",
  "hero_image_prompt": "⚠️ WAJIB IKUTI RULE BERDASARKAN KATEGORI DI ATAS. Jika Tips/Strategi/Kesehatan → Ketik prompt BADMINTON PLAYER dengan DLOB jersey. Jika Komunitas/Event → ketik BADMINTON COURT dengan players berkumpul. Jika FOKUS Nutrisi → bisa food. Jika Equipment Review → product. JANGAN GENERIC, JANGAN UNRELATED SPORTS!",
  "intro": "Paragraf pembuka 2-3 paragraf yang engaging (TANPA MARKDOWN ** atau *)",
  "sections": [\n    {\n      "heading": "Sub Judul 1",\n      "content": "Konten lengkap 300-500 kata (TANPA MARKDOWN ** atau *)",\n      "has_image": true/false,\n      "image_prompt": "⚠️ SANGAT PENTING: Analisis isi section ini. Jika tentang teknik/latihan/strategi → WAJIB 'badminton player DLOB jersey demonstrating [SPECIFIC TECHNIQUE]'. Jika tentang nutrisi KHUSUS → bisa food. Jika tentang komunitas → pemain berkumpul di court. SELALU SPESIFIK, SELALU RELEVAN, TIDAK BOLEH GAMBAR OLAHRAGA LAIN SEPERTI CYCLING/RUNNING!"\n    }\n  ],\n  "conclusion": "Kesimpulan yang kuat dan memorable (TANPA MARKDOWN ** atau *)",\n  "cta_text": "Ajakan untuk pembaca (misal: Bergabunglah dengan DLOB!) - TANPA MARKDOWN ** atau *",\n  "cta_image_prompt": "⚠️ INSPIRATIONAL shot sesuai kategori. BADMINTON articles → player DLOB jersey celebrating/training. NUTRISI articles → athlete meal + badminton context. KOMUNITAS → group playing together. SELALU badminton-related!"\n}

PENTING - VARIASI DAN RELEVANSI GAMBAR:
- Analisis TOPIK UTAMA artikel untuk tentukan jenis gambar yang dominan
- ⚠️ ATURAN PENTING: Artikel latihan/stamina/kecepatan/teknik/strategi → SEMUA gambar HARUS atlet badminton dengan DLOB jersey
- Artikel KHUSUS nutrisi/diet/makanan → Boleh mayoritas gambar makanan, tapi minimal 1 gambar atlet dengan DLOB jersey
- Artikel review peralatan → Mix product shot dengan atlet demonstrasi (DLOB jersey)
- JANGAN menampilkan gambar makanan hanya karena artikel menyebut "protein" atau "nutrisi" di dalam konteks latihan
- SETIAP gambar HARUS berbeda:
  * Gambar 1: Misalnya wide shot pemain atau teknik tertentu
  * Gambar 2: Misalnya close-up detail gerakan atau ekspresi
  * Gambar 3: Misalnya medium shot dari angle berbeda
  * Gambar 4: Misalnya action shot atau situasi berbeda
- Pastikan 100% relevan dengan TOPIK UTAMA artikel!

GAYA PENULISAN:
- Bahasa Indonesia formal tapi friendly
- Target: Pemain badminton dari pemula hingga profesional
- Tone: Informatif, inspiratif, actionable
- Gunakan contoh konkret dan data jika relevan
- Hindari jargon yang terlalu teknis

⚠️ FORMAT TEKS (SANGAT PENTING):
- JANGAN gunakan Markdown formatting (**, *, _, ##, dll)
- JANGAN gunakan tanda ** untuk bold text
- Gunakan teks biasa saja, tanpa formatting apapun
- Struktur dengan paragraf yang jelas, tanpa markup
- Contoh SALAH: "**Badminton**" atau "*penting*"
- Contoh BENAR: "Badminton" atau "penting"

LANGKAH PERTAMA SEBELUM GENERATE ARTIKEL:
1. BACA user prompt dengan seksama
2. TENTUKAN kategori utama artikel (Badminton/Komunitas/Nutrisi/Equipment/Kesehatan?)
3. REVIEW setiap image prompt untuk memastikan SESUAI dengan kategori
4. JIKA ada image prompt yang TIDAK sesuai kategori → REVISI SEBELUM OUTPUT
5. CONTOH CHECK: "Apakah user minta artikel tentang tips latihan smash?" → Ya → Semua gambar HARUS badminton dengan demonstrasi teknik
6. CONTOH CHECK: "Apakah user minta artikel tentang silaturahmi komunitas?" → Ya → Gambar HARUS pemain berkumpul di lapangan badminton, bukan olahraga lain

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
