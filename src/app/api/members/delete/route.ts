import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase tidak dikonfigurasi' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Verify caller authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi autentikasi tidak ditemukan. Silakan login kembali.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return NextResponse.json(
        { error: 'Unauthorized: Token autentikasi tidak valid atau telah kedaluwarsa.' },
        { status: 401 }
      );
    }

    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID diperlukan' },
        { status: 400 }
      );
    }

    // 2. Fetch caller and target profiles for hierarchy evaluation
    const [{ data: callerProfile }, { data: targetProfile }] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, email, role, branch_id').eq('id', caller.id).single(),
      supabaseAdmin.from('profiles').select('id, email, full_name, role, branch_id').eq('id', memberId).single(),
    ]);

    const callerEmail = (caller.email || callerProfile?.email || '').toLowerCase().trim();
    const callerRole = callerProfile?.role || 'member';
    const isCallerSuperAdmin = callerEmail.includes('ryradit') || callerEmail === 'ryradit@gmail.com';

    const targetEmail = (targetProfile?.email || '').toLowerCase().trim();
    const targetRole = targetProfile?.role || 'member';

    // Rule 1: No user can delete their own account
    if (caller.id === memberId) {
      return NextResponse.json(
        { error: 'Anda tidak dapat menghapus akun Anda sendiri.' },
        { status: 400 }
      );
    }

    // Rule 2: Wahyu (dlob.official.tng@gmail.com) is Admin for both DLOB & DLBC — Protected account
    if (targetEmail === 'dlob.official.tng@gmail.com') {
      return NextResponse.json(
        { 
          error: 'Hirarki Akses Ditolak: Akun Wahyu adalah Admin DLOB & DLBC dan tidak dapat dihapus oleh Admin Cabang (Edi) maupun admin lainnya.' 
        },
        { status: 403 }
      );
    }

    // Rule 3: Super Admin is protected
    if (targetEmail.includes('ryradit') || targetEmail === 'ryradit@gmail.com') {
      return NextResponse.json(
        { error: 'Hirarki Akses Ditolak: Akun Super Admin dilindungi dan tidak dapat dihapus.' },
        { status: 403 }
      );
    }

    // Rule 4: Hierarchy checks for Branch Admin (e.g. Edi) and non-super-admins
    if (!isCallerSuperAdmin) {
      // If caller is Branch Admin (e.g. Edi, edi@temp.dlob.local, or role === 'branch_admin')
      if (callerRole === 'branch_admin' || callerEmail === 'edi@temp.dlob.local') {
        if (targetRole === 'admin') {
          return NextResponse.json(
            { 
              error: 'Hirarki Akses Ditolak: Admin Cabang tidak memiliki wewenang untuk menghapus akun Administrator.' 
            },
            { status: 403 }
          );
        }

        if (targetRole === 'branch_admin') {
          return NextResponse.json(
            { 
              error: 'Hirarki Akses Ditolak: Admin Cabang tidak dapat menghapus akun sesama Admin Cabang.' 
            },
            { status: 403 }
          );
        }

        // Branch admin can only delete members belonging to their branch
        if (targetProfile?.branch_id && targetProfile.branch_id !== 'dlob-cikupa') {
          return NextResponse.json(
            { 
              error: 'Hirarki Akses Ditolak: Admin Cabang DLBC hanya dapat mengelola anggota pada cabang DLBC.' 
            },
            { status: 403 }
          );
        }
      } else if (callerRole !== 'admin') {
        // Regular members have no permission to delete any accounts
        return NextResponse.json(
          { error: 'Unauthorized: Anda tidak memiliki hak akses untuk menghapus akun.' },
          { status: 403 }
        );
      }
    }

    // 3. Delete related data from other tables
    // Delete memberships
    const { error: membershipError } = await supabaseAdmin
      .from('memberships')
      .delete()
      .eq('user_id', memberId);

    if (membershipError) {
      console.error('Error deleting memberships:', membershipError);
    }

    // Delete match members
    const { error: matchMemberError } = await supabaseAdmin
      .from('match_members')
      .delete()
      .eq('user_id', memberId);

    if (matchMemberError) {
      console.error('Error deleting match members:', matchMemberError);
    }

    // Delete from profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', memberId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      return NextResponse.json(
        { error: 'Gagal menghapus profil anggota', details: profileError.message },
        { status: 500 }
      );
    }

    // Finally, delete the auth user
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(memberId);

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      return NextResponse.json(
        { error: 'Gagal menghapus pengguna dari sistem autentikasi', details: deleteAuthError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Anggota berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete member error:', error);
    return NextResponse.json(
      { 
        error: 'Gagal menghapus anggota', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
