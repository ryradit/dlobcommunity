import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('\n🔍 [DEBUG] Checking auth metadata...');

    // Get all auth users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const results = [];

    // Check each user
    for (const user of users || []) {
      const result: any = {
        email: user.email,
        id: user.id,
        auth_provider: user.app_metadata?.provider,
        metadata_keys: Object.keys(user.user_metadata || {}),
        picture: user.user_metadata?.picture,
        picture_url: user.user_metadata?.picture_url,
        avatar_url: user.user_metadata?.avatar_url,
        all_metadata: user.user_metadata,
      };

      // Check profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      result.profile_avatar_url = profile?.avatar_url;

      results.push(result);

      console.log(`\n📋 User: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Provider: ${user.app_metadata?.provider}`);
      console.log(`   Auth metadata keys: ${Object.keys(user.user_metadata || {}).join(', ')}`);
      console.log(`   user_metadata.picture: ${user.user_metadata?.picture}`);
      console.log(`   user_metadata.picture_url: ${user.user_metadata?.picture_url}`);
      console.log(`   Profile avatar_url: ${profile?.avatar_url}`);
    }

    return NextResponse.json(
      {
        total_users: users?.length || 0,
        users: results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
