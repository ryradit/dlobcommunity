import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// This endpoint processes the queue - should be called by cron or triggered
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Checking queue for pending jobs...');

    // Get next job from queue
    const { data: nextJob, error: queueError } = await supabase
      .rpc('get_next_queue_job');

    if (queueError) {
      console.error('❌ Queue error:', queueError);
      return NextResponse.json({ error: 'Queue error' }, { status: 500 });
    }

    if (!nextJob) {
      console.log('✅ Queue is empty');
      return NextResponse.json({ message: 'No pending jobs' });
    }

    // Fetch job details
    const { data: job } = await supabase
      .from('article_generation_queue')
      .select('*')
      .eq('id', nextJob)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    console.log('🚀 Processing job:', job.id, 'for admin:', job.admin_name);

    // Update progress: Starting
    await supabase
      .from('article_generation_queue')
      .update({
        progress_percent: 0,
        current_step: 'Memulai pembuatan artikel...'
      })
      .eq('id', job.id);

    try {
      // Call the actual article generator
      const response = await fetch(`${request.nextUrl.origin}/api/ai/article-generator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: job.prompt,
          userId: job.admin_id,
          queueId: job.id // Pass queue ID for progress updates
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Generation failed');
      }

      // Mark as completed
      await supabase
        .from('article_generation_queue')
        .update({
          status: 'completed',
          progress_percent: 100,
          current_step: 'Selesai!',
          article_id: result.article.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);

      console.log('✅ Job completed:', job.id, 'Article:', result.article.id);

      // Process next job if any
      setTimeout(() => {
        fetch(`${request.nextUrl.origin}/api/ai/article-queue/process`, {
          method: 'POST',
        }).catch(err => console.error('Failed to trigger next job:', err));
      }, 2000);

      return NextResponse.json({
        success: true,
        jobId: job.id,
        articleId: result.article.id
      });

    } catch (error) {
      console.error('❌ Generation error:', error);
      
      // Mark as failed
      await supabase
        .from('article_generation_queue')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);

      return NextResponse.json(
        { error: 'Generation failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Queue processor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
