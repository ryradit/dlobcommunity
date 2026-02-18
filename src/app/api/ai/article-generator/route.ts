import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAuth } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';

// Increase timeout for long-running article generation
// Vercel Pro: max 300s (5 minutes), Hobby: max 10s
// Note: Article generation takes 5-8 minutes, may still timeout on 8-minute generations
export const maxDuration = 300; // 5 minutes

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize Google Auth for Vertex AI REST API
// Support both local (file) and Vercel (JSON string) environments
const getAuthConfig = () => {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    // Vercel: Use JSON string from environment variable
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    return {
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    };
  } else {
    // Local: Use file path
    return {
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    };
  }
};

const auth = new GoogleAuth(getAuthConfig());

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

interface ArticleSection {
  heading: string;
  content: string;
  has_image: boolean;
  image_prompt?: string;
  image_url?: string;
}

interface ArticleStructure {
  title: string;
  category: string;
  tags: string[];
  excerpt: string;
  seo_title: string;
  seo_description: string;
  hero_image_prompt: string;
  hero_image_url: string;
  intro: string;
  sections: ArticleSection[];
  conclusion: string;
  cta_text: string;
  cta_image_prompt: string;
  cta_image_url: string;
  read_time_minutes: number;
}

function calculateReadTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Generate image using Google Imagen 3 via Vertex AI REST API
 */
async function generateImage(prompt: string, aspectRatio: string = '16:9'): Promise<Buffer | null> {
  try {
    // Check if this is a non-athlete image (food, equipment, facility, etc)
    const nonAthleteKeywords = ['food', 'meal', 'nutrition', 'protein', 'vegetable', 'fruit', 'chicken', 'rice', 'shake', 'breakfast', 'lunch', 'dinner', 'snack', 'vitamin', 'supplement', 'product', 'equipment', 'racket', 'shuttlecock', 'shoe', 'bag', 'court', 'facility', 'gym', 'studio', 'stretching', 'yoga', 'therapy'];
    const isNonAthleteImage = nonAthleteKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
    
    // Enhance prompt based on image type
    let enhancedPrompt = prompt;
    
    if (!isNonAthleteImage) {
      // For athlete images, ensure badminton context
      const badmintonKeywords = ['badminton', 'shuttlecock', 'racket', 'racquet'];
      const hasBadmintonKeyword = badmintonKeywords.some(keyword => 
        prompt.toLowerCase().includes(keyword)
      );
      
      if (!hasBadmintonKeyword) {
        // Add badminton context if missing
        enhancedPrompt = `Badminton sports photography: ${prompt}, include visible badminton equipment (racket or shuttlecock or court)`;
        console.log(`⚠️ Prompt enhanced to include badminton context`);
      }
    }
    // For non-athlete images (food, equipment, etc), use prompt as-is
    
    console.log(`🎨 Generating image with Imagen 3`);
    console.log(`📝 Full prompt: ${enhancedPrompt}`);
    
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    
    if (!projectId) {
      console.error('❌ GOOGLE_CLOUD_PROJECT_ID not set');
      return null;
    }

    // Get access token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    if (!accessToken.token) {
      console.error('❌ Failed to get access token');
      return null;
    }

    // Vertex AI Imagen endpoint - Using Imagen 3
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;

    const requestBody = {
      instances: [
        {
          prompt: enhancedPrompt,
        }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatio, // '1:1', '9:16', '16:9', '4:3', '3:4'
        safetySetting: 'block_some',
        personGeneration: 'allow_adult',
      }
    };

    console.log(`📡 Calling Vertex AI Imagen endpoint...`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Imagen API error (${response.status}):`, errorText);
      return null;
    }

    const result = await response.json();
    
    // Extract image from response
    if (result.predictions && result.predictions.length > 0) {
      const prediction = result.predictions[0];
      
      if (prediction.bytesBase64Encoded) {
        const buffer = Buffer.from(prediction.bytesBase64Encoded, 'base64');
        console.log(`✅ Image generated successfully (${buffer.length} bytes)`);
        return buffer;
      }
    }
    
    console.log('⚠️ No image data in response');
    return null;
  } catch (error) {
    console.error('❌ Imagen generation error:', error);
    console.log('⚠️ Falling back to placeholder');
    return null;
  }
}

/**
 * Upload image to Supabase Storage
 */
async function uploadImageToStorage(
  imageBuffer: Buffer, 
  fileName: string
): Promise<string | null> {
  try {
    console.log(`📤 Uploading image to Supabase: ${fileName}`);
    
    const { data, error } = await supabase.storage
      .from('article-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('article-images')
      .getPublicUrl(fileName);

    console.log(`✅ Image uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('❌ Upload error:', error);
    return null;
  }
}

/**
 * Generate and upload article image
 */
async function generateAndUploadImage(
  prompt: string, 
  type: 'hero' | 'body' | 'cta',
  articleSlug: string,
  index: number = 0
): Promise<string> {
  // Determine aspect ratio based on type
  // Imagen 3 supported aspect ratios: 1:1, 9:16, 16:9, 4:3, 3:4
  const aspectRatio = type === 'hero' ? '16:9' : type === 'cta' ? '4:3' : '4:3'; // Changed body from 3:2 to 4:3
  
  // Generate image with Imagen 3
  const imageBuffer = await generateImage(prompt, aspectRatio);
  
  if (!imageBuffer) {
    console.log(`⚠️ Failed to generate ${type} image, using placeholder`);
    // Fallback to different images from Unsplash for variety
    // Mix of badminton and sports nutrition/health images
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
    
    // Use different image based on type and index for variety
    const imageIndex = (index + (type === 'hero' ? 0 : type === 'cta' ? 7 : index + 1)) % placeholderImages.length;
    const imageId = placeholderImages[imageIndex];
    
    if (type === 'hero') return `https://images.unsplash.com/${imageId}?w=1200&h=600&fit=crop&q=80`;
    if (type === 'body') return `https://images.unsplash.com/${imageId}?w=800&h=600&fit=crop&q=80`;
    return `https://images.unsplash.com/${imageId}?w=1000&h=750&fit=crop&q=80`;
  }
  
  // Upload to Supabase Storage
  const timestamp = Date.now();
  const fileName = `${articleSlug}/${type}-${index}-${timestamp}.png`;
  const publicUrl = await uploadImageToStorage(imageBuffer, fileName);
  
  if (!publicUrl) {
    console.log(`⚠️ Failed to upload ${type} image, using badminton placeholder`);
    // Fallback with variety
    const badmintonImages = [
      'photo-1626224583764-f87db24ac4ea',
      'photo-1606567595334-d39972c85dbe',
      'photo-1519505907962-0a6cb0167c73',
      'photo-1517649763962-0c623066013b',
      'photo-1612872087720-bb876e2e67d1',
    ];
    const imageIndex = (index + (type === 'hero' ? 0 : type === 'cta' ? 4 : index + 1)) % badmintonImages.length;
    const imageId = badmintonImages[imageIndex];
    
    if (type === 'hero') return `https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&h=600&fit=crop&q=80`;
    if (type === 'body') return `https://images.unsplash.com/${imageId}?w=800&h=600&fit=crop&q=80`;
    return `https://images.unsplash.com/${imageId}?w=1000&h=750&fit=crop&q=80`;
  }
  
  return publicUrl;
}

export async function POST(request: NextRequest) {
  // Global error wrapper to ALWAYS return JSON
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body', details: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    const { prompt, userId, queueId } = body;
    
    // Helper to update queue progress
    const updateQueueProgress = async (percent: number, step: string) => {
      if (!queueId) return;
      try {
        await supabase
          .from('article_generation_queue')
          .update({
            progress_percent: percent,
            current_step: step
          })
          .eq('id', queueId);
      } catch (err) {
        console.error('Failed to update queue progress:', err);
      }
    };

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('📝 Generating article from prompt:', prompt);
    await updateQueueProgress(5, 'Memulai pembuatan artikel...');

    // Step 1: Generate article structure with Gemini 2.5 Flash Lite
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

CONTOH PROMPT YANG BENAR:

ATLET BADMINTON:
✅ "Professional photo of children aged 8-10 wearing black DLOB jerseys practicing badminton on indoor court, holding junior rackets, shuttlecock in mid-air, cheerful expressions, dramatic lighting"
✅ "Close-up shot of teenage badminton player in white DLOB uniform gripping a racket, indoor court background, professional sports photography"
✅ "Wide angle view of adult badminton doubles match, players wearing DLOB team jerseys, shuttlecock near the net, indoor stadium lighting"

NUTRISI/MAKANAN:
✅ "Top-down professional food photography of balanced athlete breakfast with oatmeal, berries, banana, protein shake, and almonds on marble table, natural morning light"
✅ "Colorful healthy meal prep containers with grilled chicken, quinoa, broccoli and sweet potato, arranged neatly, clean studio lighting"
✅ "Sports nutrition still life with fresh fruits (banana, apple, orange), energy bars, water bottle, and protein powder on wooden surface"

PERALATAN:
✅ "Professional product shot of premium badminton racket with carbon fiber frame and fresh shuttlecocks on white background, studio lighting"
✅ "Close-up detail of badminton shoe sole with grip pattern, athletic footwear product photography"

CONTOH PROMPT YANG SALAH:
❌ "Person thinking deeply" (terlalu umum, tidak relevan)
❌ "Athlete training" (tidak spesifik)
❌ "Food" (terlalu umum, harus detail makanan apa)
❌ "Badminton player on court" (untuk atlet: tidak menyebutkan DLOB jersey atau usia)

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
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      jsonText = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      jsonText = responseText.split('```')[1].split('```')[0].trim();
    }

    const articleData: ArticleStructure = JSON.parse(jsonText);

    console.log('✅ Article structure generated:', articleData.title);

    // Generate slug first (needed for image paths)
    const slug = generateSlug(articleData.title);
    await updateQueueProgress(10, 'Struktur artikel selesai, memulai pembuatan gambar...');

    // Step 2: Generate images using Google Imagen 3 via Vertex AI
    // Note: Imagen 3 has quota limit of 1 request/minute, so we generate sequentially with delays
    console.log('🎨 Starting sequential image generation with Imagen 3...');
    
    // Count total images to generate
    const sectionImagesCount = articleData.sections.filter(s => s.has_image && s.image_prompt).length;
    const totalImages = 2 + sectionImagesCount; // hero + CTA + sections
    const estimatedMinutes = Math.ceil(totalImages * 1.2); // 1.2 min per image (60s delay + generation time)
    
    console.log(`📊 Total images to generate: ${totalImages}`);
    console.log(`⏱️  Estimated completion time: ${estimatedMinutes} minutes`);
    console.log(`🔄 Progress: 0/${totalImages} (0%)`);
    
    let completedImages = 0;
    const startTime = Date.now();
    
    // Helper function to show progress
    const logProgress = (imageName: string) => {
      completedImages++;
      const elapsedMinutes = ((Date.now() - startTime) / 60000).toFixed(1);
      const progressPercent = Math.round((completedImages / totalImages) * 100);
      const remainingImages = totalImages - completedImages;
      const estimatedRemaining = Math.ceil(remainingImages * 1.2);
      
      console.log(`✅ ${imageName} generated (${completedImages}/${totalImages})`);
      console.log(`🔄 Progress: ${progressPercent}% | Elapsed: ${elapsedMinutes}min | Remaining: ~${estimatedRemaining}min`);
      console.log(`${'█'.repeat(Math.floor(progressPercent/5))}${'░'.repeat(20 - Math.floor(progressPercent/5))} ${progressPercent}%`);
    };
    
    // Helper function to wait between requests (quota: 1 req/min)
    const waitForQuota = async (seconds: number = 65) => {
      console.log(`⏳ Waiting ${seconds} seconds for quota cooldown...`);
      await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    };
    
    // Generate images sequentially with delays
    
    // 1. Hero image
    console.log(`🎨 [1/${totalImages}] Generating hero image...`);
    await updateQueueProgress(15, 'Menghasilkan Hero Image...');
    articleData.hero_image_url = await generateAndUploadImage(articleData.hero_image_prompt, 'hero', slug, 0);
    logProgress('Hero image');
    await updateQueueProgress(25, 'Hero Image selesai');
    
    if (totalImages > 1) await waitForQuota();
    
    // 2. Section images
    let sectionImageIndex = 2;
    for (let i = 0; i < articleData.sections.length; i++) {
      const section = articleData.sections[i];
      if (section.has_image && section.image_prompt) {
        if (sectionImageIndex > 1) await waitForQuota();
        
        const sectionProgress = 30 + ((i + 1) / sectionImagesCount) * 35; // 30-65%
        await updateQueueProgress(Math.floor(sectionProgress), `Menghasilkan gambar konten ${i + 1}...`);
        console.log(`🎨 [${sectionImageIndex}/${totalImages}] Generating section ${i + 1} image...`);
        section.image_url = await generateAndUploadImage(section.image_prompt, 'body', slug, i);
        logProgress(`Section ${i + 1} image`);
        
        sectionImageIndex++;
      }
    }
    
    // 3. CTA image (last before saving)
    if (sectionImageIndex > 1) await waitForQuota();
    console.log(`🎨 [${sectionImageIndex}/${totalImages}] Generating CTA image...`);
    await updateQueueProgress(70, 'Menghasilkan CTA Image...');
    articleData.cta_image_url = await generateAndUploadImage(articleData.cta_image_prompt, 'cta', slug, 0);
    logProgress('CTA image');
    await updateQueueProgress(80, 'CTA Image selesai');
    
    const totalElapsed = ((Date.now() - startTime) / 60000).toFixed(1);
    console.log(`✅ All ${totalImages} images generated in ${totalElapsed} minutes`);

    // Calculate read time
    const fullText = articleData.intro + 
      articleData.sections.map(s => s.content).join(' ') + 
      articleData.conclusion;
    articleData.read_time_minutes = calculateReadTime(fullText);

    console.log('📸 Images generated, read time:', articleData.read_time_minutes, 'minutes');

    // Step 3: Save to database
    await updateQueueProgress(85, 'Menyimpan artikel ke database...');
    const content = {
      hero_image: {
        url: articleData.hero_image_url,
        alt: articleData.title,
        prompt: articleData.hero_image_prompt
      },
      intro: articleData.intro,
      sections: articleData.sections.map(section => ({
        heading: section.heading,
        content: section.content,
        image: section.has_image ? {
          url: section.image_url!,
          alt: section.heading,
          prompt: section.image_prompt!
        } : null
      })),
      conclusion: articleData.conclusion,
      cta: {
        text: articleData.cta_text,
        image: {
          url: articleData.cta_image_url,
          alt: 'Call to Action',
          prompt: articleData.cta_image_prompt
        }
      }
    };

    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        title: articleData.title,
        slug: slug,
        content: content,
        category: articleData.category,
        tags: articleData.tags,
        excerpt: articleData.excerpt,
        read_time_minutes: articleData.read_time_minutes,
        author_id: userId,
        author_name: 'Admin DLOB', // TODO: Get from user profile
        original_prompt: prompt,
        generation_model: 'gemini-2.5-flash-lite',
        seo_title: articleData.seo_title,
        seo_description: articleData.seo_description,
        status: 'draft' // Admin will review and publish; created_at and published_at auto-populate from DB
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

    console.log('💾 Article saved to database:', article.id);
    await updateQueueProgress(100, 'Selesai!');

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
      }
    });

  } catch (error) {
    console.error('❌ Article generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate article', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
