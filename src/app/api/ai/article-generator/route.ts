import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAuth } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize Google Auth for Vertex AI REST API
const auth = new GoogleAuth({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

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
    // Enhance prompt to ensure badminton context
    let enhancedPrompt = prompt;
    const badmintonKeywords = ['badminton', 'shuttlecock', 'racket', 'racquet'];
    const hasBadmintonKeyword = badmintonKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
    
    if (!hasBadmintonKeyword) {
      // Add badminton context if missing
      enhancedPrompt = `Badminton sports photography: ${prompt}, include visible badminton equipment (racket or shuttlecock or court)`;
      console.log(`⚠️ Prompt enhanced to include badminton context`);
    }
    
    console.log(`🎨 Generating image with Imagen 3: ${enhancedPrompt.substring(0, 80)}...`);
    
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
    console.log(`⚠️ Failed to generate ${type} image, using badminton placeholder`);
    // Fallback to badminton-specific placeholder using Unsplash
    // Using badminton keyword ensures sports-related images
    const randomNum = Math.floor(Math.random() * 20) + 1; // Variation in results
    if (type === 'hero') return `https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&h=600&fit=crop&q=80`;
    if (type === 'body') return `https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=600&fit=crop&q=80`;
    return `https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1000&h=750&fit=crop&q=80`;
  }
  
  // Upload to Supabase Storage
  const timestamp = Date.now();
  const fileName = `${articleSlug}/${type}-${index}-${timestamp}.png`;
  const publicUrl = await uploadImageToStorage(imageBuffer, fileName);
  
  if (!publicUrl) {
    console.log(`⚠️ Failed to upload ${type} image, using badminton placeholder`);
    // Fallback to badminton-specific placeholder
    if (type === 'hero') return `https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&h=600&fit=crop&q=80`;
    if (type === 'body') return `https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=600&fit=crop&q=80`;
    return `https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1000&h=750&fit=crop&q=80`;
  }
  
  return publicUrl;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, userId } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('📝 Generating article from prompt:', prompt);

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
SETIAP prompt gambar HARUS menyebutkan elemen badminton secara EKSPLISIT:
- WAJIB termasuk kata kunci: "badminton" atau "badminton court" atau "shuttlecock" atau "badminton racket"
- WAJIB menyebutkan elemen visual: "player holding badminton racket", "shuttlecock in motion", "indoor badminton court with green/blue floor", "badminton net"
- Hindari prompt yang terlalu abstrak atau umum
- Format: "Professional photo of [subject] in badminton context, [badminton elements], [lighting/style]"

CONTOH PROMPT YANG BENAR:
✅ "Professional photo of a focused badminton player holding a racket on an indoor court, shuttlecock in mid-air, dramatic lighting, high quality sports photography"
✅ "Close-up shot of badminton player's hands gripping a racket with shuttlecocks visible, indoor court background, professional sports photography"
✅ "Wide angle view of badminton doubles match in action, players positioned on court, shuttlecock near the net, indoor stadium lighting"

CONTOH PROMPT YANG SALAH (JANGAN SEPERTI INI):
❌ "Person thinking deeply" (terlalu umum, tidak ada elemen badminton)
❌ "Athlete training" (tidak spesifik badminton)
❌ "Sports equipment" (harus spesifik: badminton racket and shuttlecock)

FORMAT OUTPUT (JSON):
{
  "title": "Judul artikel yang menarik dan SEO-friendly",
  "category": "pilih: Tips & Trik / Kesehatan / Strategi / Komunitas / Berita",
  "tags": ["tag1", "tag2", "tag3"],
  "excerpt": "Ringkasan 2-3 kalimat yang menarik",
  "seo_title": "SEO title maksimal 60 karakter",
  "seo_description": "Meta description maksimal 155 karakter",
  "hero_image_prompt": "Professional badminton photo with VISIBLE badminton elements (racket/shuttlecock/court/net/player), high quality, detailed description",
  "intro": "Paragraf pembuka 2-3 paragraf yang engaging",
  "sections": [
    {
      "heading": "Sub Judul 1",
      "content": "Konten lengkap 300-500 kata",
      "has_image": true/false,
      "image_prompt": "MUST include badminton elements: racket/shuttlecock/court/player - detailed prompt for AI"
    }
  ],
  "conclusion": "Kesimpulan yang kuat dan memorable",
  "cta_text": "Ajakan untuk pembaca (misal: Bergabunglah dengan DLOB!)",
  "cta_image_prompt": "Inspiring badminton scene with VISIBLE badminton elements (racket/shuttlecock/court), call-to-action composition"
}

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
    articleData.hero_image_url = await generateAndUploadImage(articleData.hero_image_prompt, 'hero', slug, 0);
    logProgress('Hero image');
    
    if (totalImages > 1) await waitForQuota();
    
    // 2. CTA image  
    console.log(`🎨 [2/${totalImages}] Generating CTA image...`);
    articleData.cta_image_url = await generateAndUploadImage(articleData.cta_image_prompt, 'cta', slug, 0);
    logProgress('CTA image');
    
    // 3. Section images
    let sectionImageIndex = 3;
    for (let i = 0; i < articleData.sections.length; i++) {
      const section = articleData.sections[i];
      if (section.has_image && section.image_prompt) {
        if (sectionImageIndex > 2) await waitForQuota();
        
        console.log(`🎨 [${sectionImageIndex}/${totalImages}] Generating section ${i + 1} image...`);
        section.image_url = await generateAndUploadImage(section.image_prompt, 'body', slug, i);
        logProgress(`Section ${i + 1} image`);
        
        sectionImageIndex++;
      }
    }
    
    const totalElapsed = ((Date.now() - startTime) / 60000).toFixed(1);
    console.log(`✅ All ${totalImages} images generated in ${totalElapsed} minutes`);

    // Calculate read time
    const fullText = articleData.intro + 
      articleData.sections.map(s => s.content).join(' ') + 
      articleData.conclusion;
    articleData.read_time_minutes = calculateReadTime(fullText);

    console.log('📸 Images generated, read time:', articleData.read_time_minutes, 'minutes');

    // Step 3: Save to database
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
