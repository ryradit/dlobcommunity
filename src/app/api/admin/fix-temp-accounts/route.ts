import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST /api/admin/fix-temp-accounts
// Retroactively sets using_temp_email + must_change_password for all @temp.dlob.local accounts
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Find all profiles with temp email that are missing the flags
    const { data: tempProfiles, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .like('email', '%@temp.dlob.local');

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

    if (!tempProfiles || tempProfiles.length === 0) {
      return NextResponse.json({ updated: 0, message: 'No temp accounts found' });
    }

    // Update all of them
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ using_temp_email: true, must_change_password: true })
      .like('email', '%@temp.dlob.local');

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({
      updated: tempProfiles.length,
      accounts: tempProfiles.map(p => ({ name: p.full_name, email: p.email })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
