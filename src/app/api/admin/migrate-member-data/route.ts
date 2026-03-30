import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Verify caller is an authenticated admin
async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return false;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return false;
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return profile?.role === 'admin';
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin access
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { sourceMemberId, sourceMemberName, targetMemberId } = body;

    if (!sourceMemberId || !sourceMemberName || !targetMemberId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get target member data
    const { data: targetMember, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', targetMemberId)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json(
        { success: false, error: 'Target member not found' },
        { status: 404 }
      );
    }

    // Get all match_members entries for source member
    const { data: sourceMatches, error: matchError } = await supabaseAdmin
      .from('match_members')
      .select('*')
      .eq('member_name', sourceMemberName);

    if (matchError) {
      console.error('Error fetching source matches:', matchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch source member matches' },
        { status: 500 }
      );
    }

    if (!sourceMatches || sourceMatches.length === 0) {
      return NextResponse.json(
        { success: true, message: 'No matches to migrate', migratedCount: 0 },
        { status: 200 }
      );
    }

    // Update all match_members entries: change member_name from source to target
    const { error: updateError } = await supabaseAdmin
      .from('match_members')
      .update({ member_name: targetMember.full_name })
      .eq('member_name', sourceMemberName);

    if (updateError) {
      console.error('Error updating match_members:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to migrate match data' },
        { status: 500 }
      );
    }

    // Log the migration in audit table if exists
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(
        req.headers.get('authorization')?.replace('Bearer ', '')
      );

      if (user) {
        const { data: adminProfile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();

        if (adminProfile) {
          // Try to insert into audit log (table may not exist, but we'll attempt it)
          await supabaseAdmin
            .from('member_migration_audit')
            .insert({
              source_member_id: sourceMemberId,
              source_member_name: sourceMemberName,
              target_member_id: targetMemberId,
              target_member_name: targetMember.full_name,
              migrated_matches_count: sourceMatches.length,
              migrated_by_id: user.id,
              migrated_by_name: adminProfile.full_name,
              migrated_by_email: adminProfile.email,
            });
        }
      }
    } catch (auditError) {
      console.error('Note: Could not log migration audit (table may not exist):', auditError);
      // Not critical - continue
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Migration completed successfully',
        migratedCount: sourceMatches.length,
        sourceMember: sourceMemberName,
        targetMember: targetMember.full_name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during migration',
      },
      { status: 500 }
    );
  }
}
