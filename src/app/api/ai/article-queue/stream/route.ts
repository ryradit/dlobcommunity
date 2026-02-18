import { NextRequest } from 'next/server';
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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queueId = searchParams.get('id');

  if (!queueId) {
    return new Response('Queue ID required', { status: 400 });
  }

  // Set up SSE headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send initial connection message
      sendEvent({ type: 'connected', queueId });

      // Poll for updates every 3 seconds
      const pollInterval = setInterval(async () => {
        try {
          const { data: queueItem, error } = await supabase
            .from('article_generation_queue')
            .select('*')
            .eq('id', queueId)
            .single();

          if (error) {
            console.error('SSE query error:', error);
            sendEvent({ type: 'error', error: 'Failed to fetch status' });
            return;
          }

          if (!queueItem) {
            sendEvent({ type: 'error', error: 'Queue item not found' });
            clearInterval(pollInterval);
            controller.close();
            return;
          }

          // Send progress update
          sendEvent({
            type: 'progress',
            queueItem: {
              id: queueItem.id,
              status: queueItem.status,
              position: queueItem.position,
              progress_percent: queueItem.progress_percent,
              current_step: queueItem.current_step,
              article_id: queueItem.article_id,
              error_message: queueItem.error_message
            }
          });

          // Close connection when completed or failed
          if (queueItem.status === 'completed' || queueItem.status === 'failed') {
            clearInterval(pollInterval);
            sendEvent({ type: 'done', status: queueItem.status });
            controller.close();
          }
        } catch (err) {
          console.error('SSE polling error:', err);
          sendEvent({ 
            type: 'error', 
            error: err instanceof Error ? err.message : 'Unknown error' 
          });
        }
      }, 3000); // Poll every 3 seconds on server side

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
