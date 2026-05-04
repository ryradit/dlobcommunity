import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('\n🔄 [SYNC] Starting Google avatars sync...');

    // Get all auth users from Supabase auth
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    console.log(`📊 Found ${users?.length || 0} total users`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    // Process each user
    for (const user of users || []) {
      try {
        // Get Google picture from metadata
        const googlePicture = user.user_metadata?.picture || user.user_metadata?.picture_url;

        if (!googlePicture) {
          console.log(`  ⏭️  ${user.email}: No Google picture in metadata`);
          skipped++;
          continue;
        }

        // Check current profile avatar
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.log(`  ⚠️  ${user.email}: Profile error - ${fetchError.message}`);
          skipped++;
          continue;
        }

        if (profile?.avatar_url) {
          console.log(`  ✅ ${user.email}: Already has avatar`);
          skipped++;
          continue;
        }

        // Update profile with Google picture
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: googlePicture })
          .eq('id', user.id);

        if (updateError) {
          console.log(`  ❌ ${user.email}: Update failed - ${updateError.message}`);
          errors++;
        } else {
          console.log(`  ✅ ${user.email}: Synced avatar`);
          synced++;
        }
      } catch (err) {
        console.error(`  ❌ ${user.email}: Exception -`, err);
        errors++;
      }
    }

    console.log(`\n✨ Sync complete: ${synced} synced, ${skipped} skipped, ${errors} errors`);

    return NextResponse.json(
      {
        success: true,
        synced,
        skipped,
        errors,
        total: users?.length || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Fatal error in avatar sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
