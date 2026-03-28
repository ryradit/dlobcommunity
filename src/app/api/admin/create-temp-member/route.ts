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
      .from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { full_name } = await request.json();
    if (!full_name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const name = full_name.trim();
    const slug = name.toLowerCase().replace(/\s+/g, '.');
    const email = `${slug}@temp.dlob.local`;

    // Check if already exists - check by exact name match first, then by email
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('full_name', name)
      .single();

    if (existing) {
      return NextResponse.json({ id: existing.id, full_name: existing.full_name, existed: true });
    }

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      return NextResponse.json({ error: `Failed to check existing profile: ${checkError.message}` }, { status: 500 });
    }

    // Create auth user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'Dlob2026!',
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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

    return NextResponse.json({ id: data.user.id, full_name: name, existed: false });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[create-temp-member] Error:', errorMessage, err);
    return NextResponse.json({ error: `Server error: ${errorMessage}` }, { status: 500 });
  }
}
