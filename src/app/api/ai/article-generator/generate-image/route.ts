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

async function generateImage(prompt: string, aspectRatio: string = '16:9'): Promise<Buffer | null> {
  try {
    // Only show food images for EXPLICIT nutrition/diet topics
    // Keywords are very specific to avoid showing food in training/stamina articles
    const foodKeywords = ['food photography', 'meal prep', 'healthy meal', 'diet plan', 'breakfast', 'lunch', 'dinner', 'snack', 'nutrition plan', 'eating', 'dish', 'plate', 'recipe'];
    const equipmentKeywords = ['product photography', 'racket product', 'shoe product', 'equipment only', 'gear only'];
    
    const isFoodImage = foodKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
    const isEquipmentImage = equipmentKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
    const isNonAthleteImage = isFoodImage || isEquipmentImage;
    
    let enhancedPrompt = prompt;
    
    if (!isNonAthleteImage) {
      const badmintonKeywords = ['badminton', 'shuttlecock', 'racket', 'racquet'];
      const hasBadmintonKeyword = badmintonKeywords.some(keyword => 
        prompt.toLowerCase().includes(keyword)
      );
      
      if (!hasBadmintonKeyword) {
        enhancedPrompt = `Badminton sports photography: ${prompt}, include visible badminton equipment (racket or shuttlecock or court)`;
        console.log(`⚠️ Prompt enhanced to include badminton context`);
      }
    }
    
    console.log(`🎨 Generating image with Imagen 3`);
    console.log(`📝 Full prompt: ${enhancedPrompt}`);
    
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    
    if (!projectId) {
      console.error('❌ GOOGLE_CLOUD_PROJECT_ID not set');
      return null;
    }

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    if (!accessToken.token) {
      console.error('❌ Failed to get access token');
      return null;
    }

    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;

    const requestBody = {
      instances: [
        {
          prompt: enhancedPrompt,
        }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatio,
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
    'photo-1626224583764-f87db24ac4ea',
    'photo-1606567595334-d39972c85dbe',
    'photo-1490645935967-10de6ba17061',
    'photo-1546069901-ba9599a7e63c',
    'photo-1612872087720-bb876e2e67d1',
    'photo-1511688878353-3a2f5be94cd7',
    'photo-1517649763962-0c623066013b',
    'photo-1498837167922-ddd27525d352',
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
