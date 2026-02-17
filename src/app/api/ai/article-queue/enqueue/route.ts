import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { prompt, userId, userName } = await request.json();

    if (!prompt || !userId) {
      return NextResponse.json(
        { error: 'Prompt and userId required' },
        { status: 400 }
      );
    }

    console.log('📋 Adding to generation queue:', { userId, prompt: prompt.substring(0, 50) });

    // Check if user already has a pending/processing job
    const { data: existingJobs } = await supabase
      .from('article_generation_queue')
      .select('id, status, position')
      .eq('admin_id', userId)
      .in('status', ['pending', 'processing'])
      .single();

    if (existingJobs) {
      return NextResponse.json(
        { 
          error: 'Anda sudah memiliki artikel yang sedang diproses',
          queueItem: existingJobs
        },
        { status: 409 }
      );
    }

    // Count pending jobs for position estimation
    const { count: pendingCount } = await supabase
      .from('article_generation_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: processingCount } = await supabase
      .from('article_generation_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing');

    const position = (pendingCount || 0) + 1;
    const hasProcessing = (processingCount || 0) > 0;
    
    // Estimate completion time (6 minutes per article)
    const minutesPerArticle = 6;
    const waitMinutes = hasProcessing ? position * minutesPerArticle : 0;
    const estimatedCompletion = new Date(Date.now() + waitMinutes * 60 * 1000);

    // Add to queue
    const { data: queueItem, error } = await supabase
      .from('article_generation_queue')
      .insert({
        admin_id: userId,
        admin_name: userName || 'Admin',
        prompt: prompt,
        status: 'pending',
        position: position,
        estimated_completion_at: estimatedCompletion.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Queue error:', error);
      return NextResponse.json(
        { error: 'Failed to add to queue', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Added to queue:', queueItem.id, 'Position:', position);

    // If no one is processing, trigger processor
    if (!hasProcessing) {
      console.log('🚀 Triggering queue processor...');
      // Trigger processor asynchronously (don't wait)
      fetch(`${request.nextUrl.origin}/api/ai/article-queue/process`, {
        method: 'POST',
      }).catch(err => console.error('Failed to trigger processor:', err));
    }

    return NextResponse.json({
      success: true,
      queueItem: {
        id: queueItem.id,
        position: position,
        estimatedWaitMinutes: waitMinutes,
        estimatedCompletion: estimatedCompletion.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Enqueue error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
