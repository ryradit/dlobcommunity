import { GoogleAuth } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';

export type PlayerCardTemplateId = 'official' | 'noir';
export type PlayerCardThemeId = 'navy' | 'noir' | 'emerald' | 'crimson' | 'violet' | 'gold';

const getAuthConfig = () => {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    return {
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    };
  }

  return {
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  };
};

export const playerCardSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const auth = new GoogleAuth(getAuthConfig());
const BUCKET_NAME = 'player-cards';

const JERSEY_MAPPING: Record<PlayerCardTemplateId, string> = {
  official: 'Jersey Dlob Biru.png',
  noir: 'Jersey Dlob Balen.png',
};

export function getJerseyImagePath(templateId: PlayerCardTemplateId): string {
  return `/images/jersey/${JERSEY_MAPPING[templateId]}`;
}

export async function ensurePlayerCardsBucket() {
  const { data: buckets, error } = await playerCardSupabase.storage.listBuckets();

  if (error) {
    throw new Error(`Failed to inspect storage buckets: ${error.message}`);
  }

  const exists = buckets?.some((bucket) => bucket.name === BUCKET_NAME);
  if (exists) return;

  const { error: createError } = await playerCardSupabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 10485760,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  });

  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    throw new Error(`Failed to create storage bucket: ${createError.message}`);
  }
}

export function dataUrlToBuffer(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image payload');
  }

  const mimeType = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');
  const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';

  return { buffer, mimeType, extension };
}

export async function uploadPlayerCardAsset(path: string, buffer: Buffer, mimeType: string) {
  await ensurePlayerCardsBucket();

  const { error } = await playerCardSupabase.storage
    .from(BUCKET_NAME)
    .upload(path, buffer, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload asset: ${error.message}`);
  }

  const { data } = playerCardSupabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

export function buildPlayerCardPrompt(
  templateId: PlayerCardTemplateId,
  themeId: PlayerCardThemeId,
  memberName: string,
  matchCount: number,
  paidCount: number,
) {
  const themeDescriptors: Record<PlayerCardThemeId, string> = {
    navy: 'electric navy blue and cool cyan color palette, premium sports-tech atmosphere, bold metallic edge glow',
    noir: 'deep black chrome and silver glow palette, stealth luxury dark sports aesthetic, high-contrast monochrome depth',
    emerald: 'vivid emerald green energy trails and neon court glow, fresh dynamic modern premium sports lighting',
    crimson: 'intense crimson red light streaks and dramatic competitive energy, bold premium sports visual impact',
    violet: 'violet neon haze and futuristic premium sports-tech glow, cinematic sci-fi sports atmosphere',
    gold: 'championship gold accents and elite prestige radiance, trophy-level premium sports visual luxury',
  };

  // Detailed DLOB jersey per template
  const jerseyDescriptors: Record<PlayerCardTemplateId, string> = {
    official:
      'The athlete wears the official DLOB Community badminton jersey: a sleek performance jersey with a deep navy blue base, bold white "DLOB" lettering across the chest, silver metallic stripe details on the shoulders and sides, and a clean athletic collar. The jersey has a modern compression-fit cut designed for badminton.',
    noir:
      'The athlete wears the DLOB Noir edition badminton jersey: an all-black stealth performance jersey with subtle dark-charcoal "DLOB" lettering across the chest, silver chrome micro-stripe accents on the shoulders, and a minimal collarless design. Premium matte-black fabric with a luxury sports silhouette.',
  };

  const templateDescriptors: Record<PlayerCardTemplateId, string> = {
    official: 'Official DLOB edition: clean premium sports card with blue-silver color identity, bold athletic card framing, "DLOB Community" badge visible on the card border.',
    noir: 'DLOB Noir edition: stealth luxury dark sports card, monochrome premium identity, dramatic shadow-contrast framing, "DLOB" badge in silver on the card border.',
  };

  return [
    `Create a complete premium badminton player trading card in portrait orientation (like an NBA or football collector card but for badminton).`,
    `The card has two visual zones: RIGHT SIDE — the main athlete portrait, LEFT SIDE — player identity text panel.`,
    `Athlete on the right: a highly detailed, photorealistic male badminton player in a dynamic mid-swing action pose holding a badminton racket, with intense athletic expression.`,
    jerseyDescriptors[templateId],
    `Left panel text on card (render as clean card typography): player name "${memberName}" in large bold font, stat row showing "Matches ${matchCount}" and "Paid ${paidCount}", and the text "DLOB Community" as a small badge label.`,
    `Card visual style: ${templateDescriptors[templateId]}.`,
    `Color palette and atmosphere: ${themeDescriptors[themeId]}.`,
    `Background inside the card: dynamic badminton court energy — motion blur, light streaks, court line reflections, depth-of-field bokeh, cinematic lighting.`,
    `Add a premium holographic foil card border, subtle glow frame, collector card quality finish.`,
    `Photorealistic render, print-quality detail, no watermarks, no copyright logos other than DLOB.`,
  ].join(' ');
}

export async function generateFullPlayerCard(
  prompt: string,
  aspectRatio: string = '3:4',
) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured');
  }

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  if (!accessToken.token) {
    throw new Error('Failed to get Google access token');
  }

  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio,
        safetySetting: 'block_some',
        personGeneration: 'allow_adult',
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vertex Imagen error (${response.status}): ${text}`);
  }

  const result = await response.json();
  const prediction = result?.predictions?.[0];

  if (!prediction?.bytesBase64Encoded) {
    throw new Error('Vertex Imagen returned no image');
  }

  return Buffer.from(prediction.bytesBase64Encoded, 'base64');
}

export async function compositeMemberFaceAndJerseyOnCard(
  memberPhotoBuffer: any,
  jerseyImageBuffer: any,
  cardBuffer: any,
): Promise<Buffer> {
  try {
    // Note: Canvas package (>250MB) was removed due to Vercel serverless function size limits.
    // Face detection and compositing feature is temporarily disabled.
    // The generated card is returned as-is without face/jersey compositing.
    console.log('[Player Card] Face detection and compositing disabled (canvas package removed for deployment)');
    return cardBuffer instanceof Buffer ? cardBuffer : Buffer.from(cardBuffer);
  } catch (error: any) {
    console.warn('Face and jersey compositing failed, returning original card:', error?.message);
    return cardBuffer instanceof Buffer ? cardBuffer : Buffer.from(cardBuffer);
  }
}