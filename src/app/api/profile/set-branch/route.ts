import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { choice } = await request.json();
    if (!['dlob-pusat', 'dlob-cikupa', 'both'].includes(choice)) {
      return NextResponse.json({ error: 'Pilihan cabang tidak valid' }, { status: 400 });
    }

    if (choice === 'both') {
      // Pending dual-branch request — admin must approve via Members page
      const { error: pendingError } = await supabaseAdmin
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', user.id);

      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          pending_dual_branch: true,
          dual_branch_requested_at: new Date().toISOString(),
        },
      });

      if (pendingError) throw pendingError;

      return NextResponse.json({
        success: true,
        status: 'pending',
        message: 'Permintaan akses dua cabang telah dikirim. Menunggu persetujuan Admin.',
      });
    }

    // Single branch — set immediately
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        branch_id: choice,
        can_switch_branch: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        branch_id: choice,
        pending_dual_branch: false,
        dual_branch_requested_at: null,
      },
    });

    return NextResponse.json({
      success: true,
      branch_id: choice,
      message: `Cabang berhasil dipilih: ${choice === 'dlob-pusat' ? 'DLOB Pusat' : 'DLBC Cikupa'}`,
    });
  } catch (error: any) {
    console.error('[set-branch] Error:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
