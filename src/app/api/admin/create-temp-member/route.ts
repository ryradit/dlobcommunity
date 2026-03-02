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

    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .ilike('full_name', name)
      .single();

    if (existing) {
      return NextResponse.json({ id: existing.id, full_name: existing.full_name, existed: true });
    }

    // Create auth user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'Dlob2026!',
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Upsert profile
    await supabaseAdmin.from('profiles').upsert({
      id: data.user.id,
      full_name: name,
      email,
      role: 'member',
    });

    return NextResponse.json({ id: data.user.id, full_name: name, existed: false });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
