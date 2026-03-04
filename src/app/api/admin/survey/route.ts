import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    // Verify admin token
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (token) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      const uid = data?.user?.id;
      if (uid) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', uid)
          .maybeSingle();
        if (profile?.role !== 'admin') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('survey_submissions')
      .select('*')
      .order('completed_at', { ascending: false, nullsFirst: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ submissions: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
