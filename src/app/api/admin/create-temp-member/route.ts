import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    // Verify admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('role, branch_id').eq('id', user.id).single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'branch_admin'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { full_name, branch_id } = body;
    if (!full_name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const targetBranch = branch_id || profile.branch_id || 'dlob-pusat';
    const name = full_name.trim();
    const slug = name.toLowerCase().replace(/\s+/g, '.');
    const email = `${slug}@temp.dlob.local`;

    // Check if already exists - check by name or email
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, branch_id')
      .or(`full_name.ilike.${name},email.eq.${email}`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ id: existing.id, full_name: existing.full_name, existed: true });
    }

    // Create auth user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'Dlob2026!',
      email_confirm: true,
      user_metadata: { full_name: name, branch_id: targetBranch },
    });

    if (error) {
      if (error.message?.includes('already been registered') || error.message?.includes('already exists')) {
        const { data: profileByEmail } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name')
          .eq('email', email)
          .maybeSingle();
        if (profileByEmail) {
          return NextResponse.json({ id: profileByEmail.id, full_name: profileByEmail.full_name, existed: true });
        }
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update profile created by trigger using RPC function with SECURITY DEFINER
    // This bypasses RLS policies to ensure service_role can update
    const { data: result, error: updateError } = await supabaseAdmin
      .rpc('update_profile_safe', {
        p_id: data.user.id,
        p_full_name: name,
        p_email: email,
        p_role: 'member',
        p_is_active: true,
      });

    if (updateError) {
      console.error('[create-temp-member] RPC update failed:', {
        error: updateError.message,
        code: updateError.code,
        userId: data.user.id,
        email,
      });
      
      // If update fails, try to delete the auth user we just created
      try {
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        console.warn('[create-temp-member] Cleaned up auth user after profile update failure');
      } catch (cleanupErr) {
        console.error('[create-temp-member] Cleanup failed:', cleanupErr);
      }
      
      return NextResponse.json({ error: `Failed to create profile: ${updateError.message}` }, { status: 500 });
    }

    // Ensure branch_id, test account flag, and extra profile info are set
    const updateFields: Record<string, any> = { branch_id: targetBranch };
    if (body.phone) updateFields.phone = body.phone.trim();
    if (body.playing_level) updateFields.playing_level = body.playing_level;
    if (typeof body.is_test_account === 'boolean') updateFields.is_test_account = body.is_test_account;
    if (body.role) updateFields.role = body.role;

    await supabaseAdmin
      .from('profiles')
      .update(updateFields)
      .eq('id', data.user.id);

    return NextResponse.json({ id: data.user.id, full_name: name, existed: false });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[create-temp-member] Error:', errorMessage, err);
    return NextResponse.json({ error: `Server error: ${errorMessage}` }, { status: 500 });
  }
}
