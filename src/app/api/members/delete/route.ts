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

    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID diperlukan' },
        { status: 400 }
      );
    }

    // First, delete related data from other tables
    // Delete memberships
    const { error: membershipError } = await supabaseAdmin
      .from('memberships')
      .delete()
      .eq('user_id', memberId);

    if (membershipError) {
      console.error('Error deleting memberships:', membershipError);
      // Continue anyway, we'll try to delete the user
    }

    // Delete match members
    const { error: matchMemberError } = await supabaseAdmin
      .from('match_members')
      .delete()
      .eq('user_id', memberId);

    if (matchMemberError) {
      console.error('Error deleting match members:', matchMemberError);
      // Continue anyway
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
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(memberId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json(
        { error: 'Gagal menghapus pengguna dari sistem autentikasi', details: authError.message },
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
