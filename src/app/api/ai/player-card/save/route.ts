import { NextRequest, NextResponse } from 'next/server';
import { dataUrlToBuffer, playerCardSupabase, uploadPlayerCardAsset } from '@/lib/playerCardServer';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { generationId, userId, cardDataUrl } = body as {
      generationId?: string;
      userId?: string;
      cardDataUrl?: string;
    };

    if (!generationId || !userId || !cardDataUrl) {
      return NextResponse.json({ error: 'generationId, userId, and cardDataUrl are required' }, { status: 400 });
    }

    const { data: generation, error: fetchError } = await playerCardSupabase
      .from('player_card_generations')
      .select('id, user_id')
      .eq('id', generationId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !generation) {
      return NextResponse.json({ error: 'Generation record not found' }, { status: 404 });
    }

    const { buffer, mimeType } = dataUrlToBuffer(cardDataUrl);
    const finalPath = `${userId}/${generationId}/final-card.png`;
    const finalCardUrl = await uploadPlayerCardAsset(finalPath, buffer, mimeType || 'image/png');

    const { error: updateError } = await playerCardSupabase
      .from('player_card_generations')
      .update({
        final_card_url: finalCardUrl,
        status: 'completed',
        metadata: {
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
      finalCardUrl,
    });
  } catch (error: any) {
    console.error('Player card save failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save final player card' },
      { status: 500 }
    );
  }
}
