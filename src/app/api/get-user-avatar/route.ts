import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Fetch user profile with avatar_url
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user avatar for user:', userId, error);
      return NextResponse.json(
        { avatarUrl: null },
        { status: 200 }
      );
    }

    console.log(`User ${userId} avatar data:`, data);

    if (!data?.avatar_url) {
      console.log(`No avatar_url for user ${userId}`);
      return NextResponse.json(
        { avatarUrl: null },
        { status: 200 }
      );
    }

    if (!data?.avatar_url) {
      console.log(`No avatar_url for user ${userId}`);
      return NextResponse.json(
        { avatarUrl: null },
        { status: 200 }
      );
    }

    // Return avatar URL as-is (should already be a valid public URL or path)
    const avatarUrl = data.avatar_url;
    console.log(`Returning avatar URL for user ${userId}:`, avatarUrl);
    return NextResponse.json(
      { avatarUrl: avatarUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in get-user-avatar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
