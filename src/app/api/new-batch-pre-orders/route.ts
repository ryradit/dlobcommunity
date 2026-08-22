import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSizePrice(size: string, sleeve: string): number {
  let base = 110000;
  if (size === 'XXL') base = 120000;
  if (size === '3XL') base = 130000;
  return base + (sleeve === 'panjang' ? 10000 : 0);
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase environment variables');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const { nama, noWa, items } = body;

    if (!nama || !noWa || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: nama, noWa, items[]' },
        { status: 400 }
      );
    }

    const validSizes   = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    const validColors  = ['biru', 'kuning', 'merah'];
    const validSleeves = ['pendek', 'panjang'];

    // Validate every item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!validColors.includes(item.warna))
        return NextResponse.json({ error: `Item ${i + 1}: invalid warna "${item.warna}"` }, { status: 400 });
      if (!validSizes.includes(item.ukuran))
        return NextResponse.json({ error: `Item ${i + 1}: invalid ukuran "${item.ukuran}"` }, { status: 400 });
      if (!validSleeves.includes(item.lengan || 'pendek'))
        return NextResponse.json({ error: `Item ${i + 1}: invalid lengan` }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Calculate totals
    const itemsWithPrice = items.map((item: any) => ({
      warna:               item.warna,
      ukuran:              item.ukuran,
      lengan:              item.lengan || 'pendek',
      nama_punggung:       item.tanpaNamaPunggung ? null : (item.namaPunggung || null),
      tanpa_nama_punggung: item.tanpaNamaPunggung || false,
      harga:               getSizePrice(item.ukuran, item.lengan || 'pendek'),
    }));

    const totalHarga = itemsWithPrice.reduce((sum: number, it: any) => sum + it.harga, 0);

    // Insert order header
    const { data: order, error: orderError } = await supabase
      .from('new_batch_orders')
      .insert([{ nama, no_wa: noWa, total_harga: totalHarga, jumlah_item: items.length }])
      .select()
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      return NextResponse.json({ error: 'Failed to save order', details: orderError.message }, { status: 500 });
    }

    // Insert line items
    const lineItems = itemsWithPrice.map((it: any) => ({ ...it, order_id: order.id }));
    const { error: itemsError } = await supabase.from('new_batch_order_items').insert(lineItems);

    if (itemsError) {
      console.error('Items insert error:', itemsError);
      // Roll back header
      await supabase.from('new_batch_orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Failed to save order items', details: itemsError.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, data: { ...order, items: lineItems }, message: 'Pre-order berhasil disimpan' },
      { status: 201 }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('new_batch_orders')
      .select('*, new_batch_order_items(*)')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
