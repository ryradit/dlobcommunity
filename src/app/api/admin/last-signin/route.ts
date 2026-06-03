import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
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

    // Verify requester is an admin
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Otorisasi diperlukan' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Sesi tidak valid' },
        { status: 401 }
      );
    }

    const { data: requesterProfile, error: requesterError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (requesterError || !requesterProfile || requesterProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya administrator yang dapat mengakses data ini' },
        { status: 403 }
      );
    }

    // List all users to get their last_sign_in_at
    const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });

    if (listError) {
      throw listError;
    }

    // Map user id -> last_sign_in_at
    const lastSignInMap: Record<string, string | null> = {};
    data.users.forEach(u => {
      lastSignInMap[u.id] = u.last_sign_in_at || null;
    });

    return NextResponse.json({
      success: true,
      lastSignInMap
    });
  } catch (error) {
    console.error('Error fetching last sign in:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data login terakhir', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
