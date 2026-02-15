import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    console.log('[Clear Verification] Clearing flag for user:', userId);

    // Clear the pending_email_verification flag
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ pending_email_verification: false })
      .eq('id', userId);

    if (error) {
      console.error('[Clear Verification] Error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('[Clear Verification] ✅ Flag cleared successfully');

    return NextResponse.json({
      success: true,
      message: 'Verification flag cleared'
    });

  } catch (error) {
    console.error('[Clear Verification] Error:', error);
    return NextResponse.json(
      { error: 'Failed to clear verification flag' },
      { status: 500 }
    );
  }
}
