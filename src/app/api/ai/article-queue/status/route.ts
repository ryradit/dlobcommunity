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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queueId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!queueId && !userId) {
      return NextResponse.json(
        { error: 'Queue ID or User ID required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('article_generation_queue')
      .select('*');

    if (queueId) {
      query = query.eq('id', queueId);
    } else if (userId) {
      query = query.eq('admin_id', userId).in('status', ['pending', 'processing']);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (error) {
      console.error('Status check error:', error);
      return NextResponse.json(
        { error: 'Failed to check status', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({
        status: 'not_found',
        message: 'No active generation found'
      });
    }

    return NextResponse.json({
      success: true,
      queueItem: data
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
