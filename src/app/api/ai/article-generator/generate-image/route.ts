import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';

// Timeout for single image generation (70s generation + 30s upload)
export const maxDuration = 120; // 2 minutes

// Initialize Google Auth for Vertex AI REST API
const getAuthConfig = () => {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    return {
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    };
  } else {
    // Local: Try key file first, if missing fallback to GOOGLE_DRIVE variables
    const fs = require('fs');
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (keyPath && fs.existsSync(keyPath)) {
      return {
        keyFilename: keyPath,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      };
    }

    if (process.env.GOOGLE_DRIVE_CLIENT_EMAIL && process.env.GOOGLE_DRIVE_PRIVATE_KEY) {
      console.log('⚠️ GOOGLE_APPLICATION_CREDENTIALS file not found. Falling back to GOOGLE_DRIVE credentials.');
      const credentials = {
        type: 'service_account',
        project_id: process.env.GOOGLE_CLOUD_PROJECT_ID || 'dlobplatform',
        private_key_id: process.env.GOOGLE_DRIVE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_DRIVE_CLIENT_EMAIL)}`
      };
      return {
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      };
    }

    return {
      keyFilename: keyPath,
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

async function generateImage(prompt: string, aspectRatio: string = '16:9'): Promise<Buffer | null> {
  try {
    const foodKeywords = ['food photography', 'meal prep', 'healthy meal', 'diet plan', 'breakfast', 'lunch', 'dinner', 'snack', 'nutrition plan', 'eating', 'dish', 'plate', 'recipe'];
    const equipmentKeywords = ['product photography', 'racket product', 'shoe product', 'equipment only', 'gear only'];
    const eventKeywords = [
      'idul adha', 'eid al-adha', 'kurban', 'qurban', 'mosque', 'masjid', 'ramadan', 'lebaran', 
      'eid al-fitr', 'holiday', 'festival', 'celebration', 'hari raya', 'social event', 
      'charity', 'gathering', 'potluck', 'bbq', 'feeding', 'donation', 'community event',
      'sheep', 'goat', 'cow', 'kambing', 'domba', 'sapi', 'sharing meat', 'berkurban', 'berqurban'
    ];
    
    const isFoodImage = foodKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
    const isEquipmentImage = equipmentKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
    const isEventImage = eventKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
    const isNonAthleteImage = isFoodImage || isEquipmentImage || isEventImage;
    
    let enhancedPrompt = prompt;
    if (!isNonAthleteImage) {
      const badmintonKeywords = ['badminton', 'shuttlecock', 'racket', 'racquet'];
      const hasBadmintonKeyword = badmintonKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
      if (!hasBadmintonKeyword) {
        enhancedPrompt = `Badminton sports photography: ${prompt}, include visible badminton equipment (racket or shuttlecock or court)`;
        console.log(`⚠️ Prompt enhanced to include badminton context`);
      }
    }

    console.log(`🎨 Generating image for prompt: "${enhancedPrompt}"`);

    // 1. Try Vertex AI Service Account (Imagen 3)
    console.log('📡 Attempting image generation via Vertex AI Service Account (Imagen 3)...');
    try {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
      
      if (projectId) {
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();
        
        if (accessToken.token) {
          const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;
          const requestBody = {
            instances: [{ prompt: enhancedPrompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: aspectRatio,
              safetySetting: 'block_some',
              personGeneration: 'allow_adult',
            }
          };

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.predictions?.[0]?.bytesBase64Encoded) {
              const buffer = Buffer.from(result.predictions[0].bytesBase64Encoded, 'base64');
              console.log(`✅ Image generated via Vertex AI Imagen 3 (${buffer.length} bytes)`);
              return buffer;
            }
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Vertex AI Imagen 3 error (${response.status}):`, errorText);
          }
        } else {
          console.warn('⚠️ Failed to get access token for Vertex AI');
        }
      } else {
        console.warn('⚠️ GOOGLE_CLOUD_PROJECT_ID not set, skipping Imagen 3');
      }
    } catch (vertexError: any) {
      console.warn('⚠️ Vertex AI Service Account Imagen 3 failed/out of service:', vertexError.message || vertexError);
    }

    // 2. Fallback to Google AI Studio API Key (Imagen 4)
    const apiKey = process.env.IMAGEN_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      console.log('📡 Falling back: Attempting image generation via Google AI Studio API key (Imagen 4)...');
      try {
        const modelName = 'imagen-4.0-generate-001';
        const studioEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${apiKey}`;
        const studioRequestBody = {
          instances: [{ prompt: enhancedPrompt }],
          parameters: { sampleCount: 1, aspectRatio: aspectRatio }
        };

        const response = await fetch(studioEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studioRequestBody),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.predictions?.[0]?.bytesBase64Encoded) {
            const buffer = Buffer.from(result.predictions[0].bytesBase64Encoded, 'base64');
            console.log(`✅ Image generated via Google AI Studio Imagen 4 (${buffer.length} bytes)`);
            return buffer;
          }
        } else {
          const errText = await response.text();
          console.warn(`⚠️ Google AI Studio Imagen 4 error (${response.status}):`, errText);
        }
      } catch (studioError: any) {
        console.warn('⚠️ Google AI Studio Imagen 4 request failed:', studioError.message || studioError);
      }
    }

    // 3. Fallback to Pollinations.ai (Flux - completely free!)
    console.log('📡 Falling back: Attempting image generation via Pollinations.ai (Flux)...');
    try {
      let width = 1024;
      let height = 576;
      if (aspectRatio === '1:1') {
        width = 1024;
        height = 1024;
      } else if (aspectRatio === '4:3') {
        width = 1024;
        height = 768;
      }
      
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&nologo=true&model=flux`;
      const response = await fetch(pollinationsUrl);
      
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (buffer.length > 0) {
          console.log(`✅ Image generated via Pollinations Flux (${buffer.length} bytes)`);
          return buffer;
        }
      } else {
        console.warn(`⚠️ Pollinations.ai Flux error (${response.status})`);
      }
    } catch (pollinationsError: any) {
      console.warn('⚠️ Pollinations.ai Flux request failed:', pollinationsError.message || pollinationsError);
    }

    console.log('❌ All image generation options failed.');
    return null;
  } catch (error) {
    console.error('❌ Imagen generation failed:', error);
    return null;
  }
}

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

function getFallbackImageUrl(type: 'hero' | 'body' | 'cta', index: number = 0): string {
  const placeholderImages = [
    'photo-1626224583764-f87db24ac4ea',  // Badminton court aerial view
    'photo-1606567595334-d39972c85dbe',  // Badminton player action
    'photo-1612872087720-bb876e2e67d1',  // Badminton racket and shuttlecock
    'photo-1517649763962-0c623066013b',  // Indoor sports facility
    'photo-1471864190281-a93a3070b6de',  // Badminton shuttlecock close-up
    'photo-1587280501635-68a0e82cd5ff',  // Sports training equipment
    'photo-1461896836934-ffe607ba8211',  // Sports and fitness
    'photo-1434596922112-19c563067271',  // Athletes in action
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

    const { articleId, prompt, type, index, sectionIndex } = body;

    if (!articleId || !prompt || !type) {
      return NextResponse.json(
        { error: 'articleId, prompt, and type are required' },
        { status: 400 }
      );
    }

    console.log(`🎨 Generating ${type} image for article ${articleId}, index ${index}`);

    // Get article to find slug
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('slug, content')
      .eq('id', articleId)
      .single();

    if (fetchError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Determine aspect ratio
    const aspectRatio = type === 'hero' ? '16:9' : '4:3';

    // Generate image
    const imageBuffer = await generateImage(prompt, aspectRatio);
    
    let imageUrl: string;
    let isPlaceholder = false;

    if (!imageBuffer) {
      console.log(`⚠️ Failed to generate ${type} image, using fallback`);
      imageUrl = getFallbackImageUrl(type as 'hero' | 'body' | 'cta', index);
      isPlaceholder = true;
    } else {
      // Upload to Supabase Storage
      const timestamp = Date.now();
      const fileName = `${article.slug}/${type}-${index}-${timestamp}.png`;
      const publicUrl = await uploadImageToStorage(imageBuffer, fileName);

      if (!publicUrl) {
        console.log(`⚠️ Failed to upload ${type} image, using fallback`);
        imageUrl = getFallbackImageUrl(type as 'hero' | 'body' | 'cta', index);
        isPlaceholder = true;
      } else {
        imageUrl = publicUrl;
        isPlaceholder = false;
      }
    }

    // Update article in database
    const content = article.content as any;

    if (type === 'hero') {
      content.hero_image.url = imageUrl;
      content.hero_image.is_placeholder = isPlaceholder;
    } else if (type === 'cta') {
      content.cta.image.url = imageUrl;
      content.cta.image.is_placeholder = isPlaceholder;
    } else if (type === 'body' && sectionIndex !== undefined) {
      if (content.sections[sectionIndex]?.image) {
        content.sections[sectionIndex].image.url = imageUrl;
        content.sections[sectionIndex].image.is_placeholder = isPlaceholder;
      }
    }

    const { error: updateError } = await supabase
      .from('articles')
      .update({ content })
      .eq('id', articleId);

    if (updateError) {
      console.error('❌ Failed to update article:', updateError);
      return NextResponse.json(
        { error: 'Failed to update article with new image' },
        { status: 500 }
      );
    }

    console.log(`✅ ${type} image updated successfully`);

    return NextResponse.json({
      success: true,
      imageUrl,
      isPlaceholder,
      type,
      index
    });

  } catch (error) {
    console.error('❌ Image generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate image', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
