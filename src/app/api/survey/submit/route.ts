import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { answers, memberName, isAnonymous, authToken } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'answers required' }, { status: 400 });
    }

    // Resolve member_id from token if provided
    let memberId: string | null = null;
    if (authToken) {
      const { data } = await supabaseAdmin.auth.getUser(authToken);
      memberId = data?.user?.id ?? null;
    }

    const { data, error } = await supabaseAdmin
      .from('survey_submissions')
      .insert({
        member_id: memberId,
        member_name: memberName || null,
        is_anonymous: isAnonymous ?? !memberId,
        answers,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[survey/submit]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err: any) {
    console.error('[survey/submit] unexpected error', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
