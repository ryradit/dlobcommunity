import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_JERSEY_BATCHES, JerseyBatch } from '@/lib/jerseyBatches';

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

function repairBatchImages(batches: JerseyBatch[]): JerseyBatch[] {
  const defaultOfficial = DEFAULT_JERSEY_BATCHES.find((d) => d.slug === 'official');
  const defaultNoir = DEFAULT_JERSEY_BATCHES.find((d) => d.slug === 'noir');

  // Filter out new-batch-2026 because it is merged into official
  const filtered = batches.filter((b) => b.slug !== 'new-batch-2026' && b.id !== 'new-batch-2026');

  // If official is missing, prepend it
  const hasOfficial = filtered.some((b) => b.slug === 'official' || b.id === 'official');
  const list = (hasOfficial || !defaultOfficial) ? filtered : [defaultOfficial, ...filtered];

  return list.map((b) => {
    if (b.slug === 'official' || b.id === 'official-classic' || b.id === 'official') {
      return {
        ...b,
        name: 'Jersey DLOB Official',
        tagline: defaultOfficial?.tagline || b.tagline,
        description: defaultOfficial?.description || b.description,
        startingPrice: defaultOfficial?.startingPrice || b.startingPrice,
        colorVariants: defaultOfficial ? defaultOfficial.colorVariants : b.colorVariants,
        introductionVideos: defaultOfficial ? defaultOfficial.introductionVideos : b.introductionVideos,
      };
    }
    if (b.slug === 'noir' || b.id === 'noir-concept' || b.id === 'noir') {
      return {
        ...b,
        colorVariants: defaultNoir ? defaultNoir.colorVariants : b.colorVariants,
      };
    }
    return {
      ...b,
      colorVariants: (b.colorVariants || []).map((cv) => ({
        ...cv,
        images: (cv.images || []).map((img) =>
          img.replace('/dlob-member-photos/model/', '/members/model/')
        ),
      })),
    };
  });
}

// ── GET /api/store/batches?slug=... ────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug');

    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'jersey_batches_data')
      .maybeSingle();

    if (error) {
      console.error('[Batches GET] Supabase error:', error);
    }

    let batches: JerseyBatch[] = DEFAULT_JERSEY_BATCHES;

    if (data?.value) {
      try {
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          batches = parsed;
        }
      } catch (err) {
        console.error('[Batches GET] JSON parse error, using defaults:', err);
      }
    }

    batches = repairBatchImages(batches);

    if (data?.value && (data.value.includes('new-batch-2026') || data.value.includes('/dlob-member-photos/'))) {
      supabaseAdmin
        .from('app_settings')
        .upsert({
          key: 'jersey_batches_data',
          value: JSON.stringify(batches),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })
        .then(() => console.log('[Batches GET] Auto-merged new-batch-2026 into official and synced database'));
    }

    if (slug) {
      const batch = batches.find((b) => b.slug === slug || b.id === slug);
      if (!batch) {
        return NextResponse.json({ error: `Batch with slug "${slug}" not found` }, { status: 404 });
      }
      return NextResponse.json(
        { success: true, batch },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }

    return NextResponse.json(
      { success: true, batches },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST /api/store/batches ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAdminOrOwner(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const body = await req.json();

    // Fetch existing batches
    const { data: curData } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'jersey_batches_data')
      .maybeSingle();

    let existingBatches: JerseyBatch[] = DEFAULT_JERSEY_BATCHES;
    if (curData?.value) {
      try {
        const parsed = JSON.parse(curData.value);
        if (Array.isArray(parsed)) existingBatches = parsed;
      } catch { /* use default */ }
    }

    let updatedBatches: JerseyBatch[] = [];

    // Case 1: Overwriting full array of batches
    if (Array.isArray(body.batches)) {
      updatedBatches = body.batches;
    }
    // Case 2: Quick toggle status or single batch update
    else if (body.slug && (body.status !== undefined || body.rekapStatus !== undefined)) {
      const idx = existingBatches.findIndex((b) => b.slug === body.slug || b.id === body.slug);
      if (idx === -1) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
      }
      const target = { ...existingBatches[idx] };
      if (body.status !== undefined) {
        target.status = body.status;
        target.badge = body.status === 'open' ? 'PRE-ORDER AKTIF' : body.status === 'coming-soon' ? 'SEGERA HADIR' : 'BATCH DITUTUP';
        target.badgeType = body.status === 'open' ? 'active-preorder' : body.status === 'coming-soon' ? 'coming-soon' : 'closed';
      }
      if (body.rekapStatus !== undefined) {
        target.rekapStatus = body.rekapStatus;
      }
      target.updatedAt = new Date().toISOString();
      updatedBatches = [...existingBatches];
      updatedBatches[idx] = target;
    }
    // Case 3: Upsert a single batch
    else if (body.batch && typeof body.batch === 'object') {
      const newOrUpdated: JerseyBatch = body.batch;
      if (!newOrUpdated.name || !newOrUpdated.slug) {
        return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
      }
      const cleanSlug = newOrUpdated.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
      newOrUpdated.slug = cleanSlug;
      newOrUpdated.updatedAt = new Date().toISOString();

      const existingIdx = existingBatches.findIndex((b) => b.slug === cleanSlug || b.id === newOrUpdated.id);
      if (existingIdx !== -1) {
        updatedBatches = [...existingBatches];
        updatedBatches[existingIdx] = { ...updatedBatches[existingIdx], ...newOrUpdated };
      } else {
        newOrUpdated.id = cleanSlug;
        newOrUpdated.createdAt = newOrUpdated.createdAt || new Date().toISOString();
        updatedBatches = [newOrUpdated, ...existingBatches];
      }
    } else {
      return NextResponse.json({ error: 'Invalid payload: provide batches[], batch, or slug' }, { status: 400 });
    }

    updatedBatches = repairBatchImages(updatedBatches);

    // Save to app_settings
    const { error: saveError } = await supabaseAdmin
      .from('app_settings')
      .upsert({
        key: 'jersey_batches_data',
        value: JSON.stringify(updatedBatches),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Batches successfully saved',
      batches: updatedBatches,
    });
  } catch (err: any) {
    console.error('[Batches POST] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE /api/store/batches?slug=... ──────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyAdminOrOwner(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const slug = req.nextUrl.searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    const { data: curData } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'jersey_batches_data')
      .maybeSingle();

    let existingBatches: JerseyBatch[] = DEFAULT_JERSEY_BATCHES;
    if (curData?.value) {
      try {
        const parsed = JSON.parse(curData.value);
        if (Array.isArray(parsed)) existingBatches = parsed;
      } catch { /* use default */ }
    }

    const filtered = existingBatches.filter((b) => b.slug !== slug && b.id !== slug);

    await supabaseAdmin
      .from('app_settings')
      .upsert({
        key: 'jersey_batches_data',
        value: JSON.stringify(filtered),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    return NextResponse.json({
      success: true,
      message: `Batch "${slug}" deleted`,
      batches: filtered,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
