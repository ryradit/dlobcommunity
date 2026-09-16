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

    // Verify caller authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Verify caller is Super Admin (Adit only)
    const callerEmail = (caller.email || '').toLowerCase().trim();
    const isAditCaller = callerEmail.includes('ryradit') || callerEmail === 'ryradit@gmail.com';

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', caller.id)
      .single();

    if (!callerProfile || callerProfile.role !== 'admin' || !isAditCaller) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Super Admin (Adit) yang berhak mengubah peran admin dan cabang.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { memberId, role, branch_id, can_switch_branch } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID wajib diisi' }, { status: 400 });
    }

    const allowedRoles = ['admin', 'branch_admin', 'member'];
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: `Peran tidak valid. Pilihan: ${allowedRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Get target member profile
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', memberId)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 });
    }

    const targetEmail = (targetProfile.email || '').toLowerCase().trim();
    const isTargetAdit = targetEmail.includes('ryradit') || targetEmail === 'ryradit@gmail.com';

    // Super Admin role can ONLY be held by Adit
    if (role === 'admin' && !isTargetAdit) {
      return NextResponse.json(
        { error: 'Peran Super Admin hanya eksklusif untuk Adit (Owner). Untuk admin lain, pilih Admin Cabang DLBC.' },
        { status: 400 }
      );
    }

    const allowedBranches = ['dlob-pusat', 'dlob-cikupa'];
    const finalBranchId = branch_id && allowedBranches.includes(branch_id)
      ? branch_id
      : (role === 'branch_admin' ? 'dlob-cikupa' : 'dlob-pusat');

    // Prevent super admin from accidentally demoting themselves
    if (caller.id === memberId && role !== 'admin') {
      return NextResponse.json(
        { error: 'Anda tidak dapat mencabut peran Super Admin dari akun Anda sendiri.' },
        { status: 400 }
      );
    }

    // Determine can_switch_branch value:
    // If explicitly passed in body, use that. Otherwise infer from role:
    // branch_admin by default can switch (they play in both), member defaults false.
    const resolvedCanSwitch = typeof can_switch_branch === 'boolean'
      ? can_switch_branch
      : role === 'branch_admin' ? true : undefined; // undefined = don't overwrite existing

    const updatePayload: Record<string, unknown> = {
      role,
      branch_id: finalBranchId,
      updated_at: new Date().toISOString(),
    };
    if (resolvedCanSwitch !== undefined) {
      updatePayload.can_switch_branch = resolvedCanSwitch;
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', memberId)
      .select('id, full_name, email, role, branch_id, can_switch_branch')
      .single();

    if (updateError) {
      console.error('[update-role] Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Gagal memperbarui peran anggota: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      member: updatedProfile,
      message: `Peran berhasil diperbarui menjadi ${role} (${finalBranchId})`,
    });
  } catch (error: any) {
    console.error('[update-role] Server error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
