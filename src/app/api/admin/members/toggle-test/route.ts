import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase server configuration missing' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Verify caller authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 2. Verify caller role (admin or branch_admin)
    const callerEmail = (caller.email || '').toLowerCase().trim();
    const isSuperAdmin = callerEmail.includes('ryradit') || callerEmail === 'ryradit@gmail.com';

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, role, email, branch_id')
      .eq('id', caller.id)
      .single();

    if (!callerProfile || (callerProfile.role !== 'admin' && callerProfile.role !== 'branch_admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Admin DLOB atau Admin DLBC yang berhak mengubah label akun tes.' },
        { status: 403 }
      );
    }

    // 3. Parse body
    const body = await request.json();
    const { memberId, is_test_account } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID wajib diisi' }, { status: 400 });
    }

    // 4. Fetch target member
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, branch_id, is_test_account')
      .eq('id', memberId)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 });
    }

    const targetEmail = (targetProfile.email || '').toLowerCase().trim();

    // 5. Hierarchy check: Nobody can mark Super Admin or Wahyu as test account
    if (targetEmail.includes('ryradit') || targetEmail === 'ryradit@gmail.com') {
      return NextResponse.json(
        { error: 'Akun Super Admin tidak dapat ditandai sebagai akun tes.' },
        { status: 403 }
      );
    }
    if (targetEmail === 'dlob.official.tng@gmail.com') {
      return NextResponse.json(
        { error: 'Akun Wahyu (Admin DLOB & DLBC) tidak dapat ditandai sebagai akun tes.' },
        { status: 403 }
      );
    }

    // 6. Branch admin restriction: DLBC admin can only manage DLBC members or general members
    if (callerProfile.role === 'branch_admin' && !isSuperAdmin) {
      const callerBranch = callerProfile.branch_id || 'dlob-cikupa';
      if (targetProfile.branch_id && targetProfile.branch_id !== callerBranch) {
        return NextResponse.json(
          { error: `Admin cabang ${callerBranch} hanya dapat mengelola member cabang sendiri.` },
          { status: 403 }
        );
      }
    }

    // 7. Determine new value
    const nextValue = typeof is_test_account === 'boolean' ? is_test_account : !targetProfile.is_test_account;

    // 8. Update profile using supabaseAdmin (bypasses RLS)
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_test_account: nextValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) {
      console.error('[toggle-test] Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      memberId,
      is_test_account: nextValue,
      member: updated,
    });

  } catch (error: any) {
    console.error('[toggle-test] Server error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
