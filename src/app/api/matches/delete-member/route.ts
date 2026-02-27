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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID diperlukan' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('match_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error deleting match member:', error);
      return NextResponse.json(
        { error: 'Gagal menghapus entri pembayaran', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Entri pembayaran berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete match member error:', error);
    return NextResponse.json(
      { 
        error: 'Gagal menghapus entri pembayaran', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
