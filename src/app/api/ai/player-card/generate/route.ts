import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  buildPlayerCardPrompt,
  compositeMemberFaceAndJerseyOnCard,
  dataUrlToBuffer,
  generateFullPlayerCard,
  getJerseyImagePath,
  playerCardSupabase,
  PlayerCardTemplateId,
  PlayerCardThemeId,
  uploadPlayerCardAsset,
} from '@/lib/playerCardServer';

export const maxDuration = 120;

const MONTHLY_SUCCESS_LIMIT = 1;
const MONTHLY_ATTEMPT_LIMIT = 3;

export async function POST(request: NextRequest) {
  let generationId: string | null = null;

  try {
    const body = await request.json();
    const { imageDataUrl, userId, memberName, templateId, themeId, matchCount, paidCount } = body as {
      imageDataUrl?: string;
      userId?: string;
      memberName?: string;
      templateId?: PlayerCardTemplateId;
      themeId?: PlayerCardThemeId;
      matchCount?: number;
      paidCount?: number;
    };

    if (!imageDataUrl || !userId || !memberName || !templateId || !themeId) {
      return NextResponse.json({ error: 'imageDataUrl, userId, memberName, templateId, and themeId are required' }, { status: 400 });
    }

    generationId = crypto.randomUUID();
    const prompt = buildPlayerCardPrompt(
      templateId,
      themeId,
      memberName,
      matchCount ?? 0,
      paidCount ?? 0,
    );

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();

    // Only block on processing rows created within the last 3 minutes (matches maxDuration=120s).
    // Rows older than that are considered stuck/abandoned and should not block new generations.
    const activeWindowStart = new Date(Date.now() - 3 * 60 * 1000).toISOString();

    const { data: activeGeneration } = await playerCardSupabase
      .from('player_card_generations')
      .select('id, status')
      .eq('user_id', userId)
      .eq('status', 'processing')
      .gte('created_at', activeWindowStart)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeGeneration) {
      return NextResponse.json(
        { error: 'Ada generate yang masih berjalan, tunggu sebentar lalu coba lagi.' },
        { status: 409 }
      );
    }

    const { count: successCount, error: successCountError } = await playerCardSupabase
      .from('player_card_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', monthStart)
      .lt('created_at', nextMonthStart);

    if (successCountError) {
      throw new Error(successCountError.message);
    }

    if ((successCount || 0) >= MONTHLY_SUCCESS_LIMIT) {
      return NextResponse.json(
        { error: `Batas sukses bulanan tercapai (${MONTHLY_SUCCESS_LIMIT}/bulan).` },
        { status: 429 }
      );
    }

    const { count: attemptCount, error: attemptCountError } = await playerCardSupabase
      .from('player_card_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['processing', 'generated', 'completed'])
      .gte('created_at', monthStart)
      .lt('created_at', nextMonthStart);

    if (attemptCountError) {
      throw new Error(attemptCountError.message);
    }

    if ((attemptCount || 0) >= MONTHLY_ATTEMPT_LIMIT) {
      return NextResponse.json(
        { error: `Batas percobaan bulanan tercapai (${MONTHLY_ATTEMPT_LIMIT}/bulan).` },
        { status: 429 }
      );
    }

    const { buffer: sourceBuffer, mimeType: sourceMimeType, extension: sourceExtension } = dataUrlToBuffer(imageDataUrl);
    const sourceBase64 = imageDataUrl.split(',')[1] ?? '';

    const sourcePath = `${userId}/${generationId}/source.${sourceExtension}`;
    const sourceImageUrl = await uploadPlayerCardAsset(sourcePath, sourceBuffer, sourceMimeType);

    const { error: insertError } = await playerCardSupabase
      .from('player_card_generations')
      .insert({
        id: generationId,
        user_id: userId,
        member_name: memberName,
        template_id: templateId,
        theme_id: themeId,
        status: 'processing',
        source_image_url: sourceImageUrl,
        generation_prompt: prompt,
        metadata: {
          source_mime_type: sourceMimeType,
        },
      });

    if (insertError) {
      throw new Error(insertError.message);
    }

    // Vertex generates the COMPLETE player card using the prompt
    let cardBuffer = await generateFullPlayerCard(prompt, '3:4');

    // Load the selected DLOB jersey image
    const jerseyPath = getJerseyImagePath(templateId);
    const jerseyImagePath = join(process.cwd(), 'public', jerseyPath.replace(/^\//, ''));
    const jerseyImageBuffer = readFileSync(jerseyImagePath);

    // Composite member's face and DLOB jersey onto the generated card
    console.log('Compositing member face and DLOB jersey onto generated card...');
    const composedCard = await compositeMemberFaceAndJerseyOnCard(sourceBuffer, jerseyImageBuffer, cardBuffer);
    const finalCard = composedCard instanceof Buffer ? composedCard : Buffer.from(composedCard);

    const finalCardPath = `${userId}/${generationId}/final-card.png`;
    const finalCardUrl = await uploadPlayerCardAsset(finalCardPath, finalCard, 'image/png');

    const { error: updateError } = await playerCardSupabase
      .from('player_card_generations')
      .update({
        status: 'completed',
        final_card_url: finalCardUrl,
        background_image_url: finalCardUrl, // keep for backward compat in history
        metadata: {
          source_mime_type: sourceMimeType,
          generated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        },
      })
      .eq('id', generationId)
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      success: true,
      generation: {
        id: generationId,
        sourceImageUrl,
        finalCardUrl,
        templateId,
        themeId,
        prompt,
        status: 'completed',
      },
      limits: {
        monthlySuccessLimit: MONTHLY_SUCCESS_LIMIT,
        monthlyAttemptLimit: MONTHLY_ATTEMPT_LIMIT,
        successUsed: (successCount || 0) + 1,
        attemptsUsed: (attemptCount || 0) + 1,
      },
    });
  } catch (error: any) {
    console.error('Player card generation failed:', error);

    if (generationId) {
      await playerCardSupabase
        .from('player_card_generations')
        .update({
          status: 'failed',
          failure_reason: error?.message || 'Unknown generation error',
        })
        .eq('id', generationId);
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to generate player card background' },
      { status: 500 }
    );
  }
}
