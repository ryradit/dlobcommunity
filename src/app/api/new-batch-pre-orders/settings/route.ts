import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verifyAdminOrOwner(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const email = (user.email || '').toLowerCase().trim();
  const fullName = (user.user_metadata?.full_name || user.user_metadata?.name || '').toLowerCase().trim();
  const isOwner = email === 'ryradit@gmail.com' || email.includes('ryradit') || fullName.includes('ryan radityatama') || fullName === 'ryan';

  if (isOwner) return user;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return (profile?.role === 'admin' || profile?.role === 'branch_admin') ? user : null;
}

// ── GET /api/new-batch-pre-orders/settings (Publicly accessible for store pages & admin)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('key, value')
      .in('key', [
        'jersey_new_batch_status',
        'jersey_rekap_new_batch_status',
        'jersey_active_batch_name',
        'jersey_closed_message'
      ]);

    if (error) {
      console.error('[Pre-Order Settings GET] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data || [];
    const statusRow = rows.find(r => r.key === 'jersey_new_batch_status');
    const rekapRow = rows.find(r => r.key === 'jersey_rekap_new_batch_status');
    const batchNameRow = rows.find(r => r.key === 'jersey_active_batch_name');
    const closedMsgRow = rows.find(r => r.key === 'jersey_closed_message');

    const settings = {
      status: (statusRow?.value === 'closed' ? 'closed' : 'open') as 'open' | 'closed',
      rekapStatus: (rekapRow?.value === 'closed' ? 'closed' : 'open') as 'open' | 'closed',
      batchName: batchNameRow?.value?.trim() || 'New Batch 2026',
      closedMessage: closedMsgRow?.value?.trim() || 'Pemesanan Pre-Order Jersey DLOB New Batch saat ini telah resmi ditutup. Nantikan informasi pembukaan batch berikutnya!',
    };

    return NextResponse.json(
      { success: true, settings },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST /api/new-batch-pre-orders/settings (Admin/Owner only)
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAdminOrOwner(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const body = await req.json();
    const { status, rekapStatus, batchName, closedMessage } = body;

    const upserts: { key: string; value: string; updated_at: string }[] = [];
    const now = new Date().toISOString();

    if (status !== undefined) {
      const val = status === 'closed' ? 'closed' : 'open';
      upserts.push({ key: 'jersey_new_batch_status', value: val, updated_at: now });
    }

    if (rekapStatus !== undefined) {
      const val = rekapStatus === 'closed' ? 'closed' : 'open';
      upserts.push({ key: 'jersey_rekap_new_batch_status', value: val, updated_at: now });
    }

    if (batchName !== undefined) {
      upserts.push({ key: 'jersey_active_batch_name', value: String(batchName).trim(), updated_at: now });
    }

    if (closedMessage !== undefined) {
      upserts.push({ key: 'jersey_closed_message', value: String(closedMessage).trim(), updated_at: now });
    }

    if (upserts.length === 0) {
      return NextResponse.json({ error: 'No valid setting fields provided' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('app_settings')
      .upsert(upserts, { onConflict: 'key' });

    if (error) {
      console.error('[Pre-Order Settings POST] Upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Batch settings successfully updated',
      updated: upserts.map(u => ({ key: u.key, value: u.value })),
    });
  } catch (err: any) {
    console.error('[Pre-Order Settings POST] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
