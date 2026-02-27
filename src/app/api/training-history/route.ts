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

// GET - Fetch training history for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('training_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Training History] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch training history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ history: data || [] });
  } catch (error) {
    console.error('[Training History] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save or update training session (prevents duplicates)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, query, advice, videos } = body;

    if (!userId || !query || !advice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Normalize query for comparison
    const queryNormalized = query.toLowerCase().trim();

    // Check if this query already exists for this user
    const { data: existingEntry, error: fetchError } = await supabase
      .from('training_history')
      .select('id')
      .eq('user_id', userId)
      .eq('query_normalized', queryNormalized)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[Training History] Fetch error:', fetchError);
    }

    let data;
    let error;

    if (existingEntry) {
      // Update existing entry with fresh data
      console.log('[Training History] ♻️ Updating existing entry:', existingEntry.id);
      const result = await supabase
        .from('training_history')
        .update({
          advice,
          videos: videos || [],
          created_at: new Date().toISOString() // Update timestamp to keep it at top
        })
        .eq('id', existingEntry.id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Insert new entry
      console.log('[Training History] ✨ Creating new entry for query:', query);
      const result = await supabase
        .from('training_history')
        .insert({
          user_id: userId,
          query,
          advice,
          videos: videos || []
        })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('[Training History] Save error:', error);
      return NextResponse.json(
        { error: 'Failed to save training history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Training History] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a training history item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'ID and User ID are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('training_history')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[Training History] Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete training history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Training History] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
