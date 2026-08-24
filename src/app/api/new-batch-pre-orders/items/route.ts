import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSizePrice(size: string, sleeve: string): number {
  let base = 110000;
  if (size.startsWith('Kids') || size.startsWith('Balita')) {
    base = 100000;
  } else if (size === 'XXL') {
    base = 120000;
  } else if (size === '3XL') {
    base = 130000;
  }
  return base + (sleeve === 'panjang' ? 10000 : 0);
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase environment variables');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Recalculates total_harga and jumlah_item on new_batch_orders
async function syncOrderTotals(supabase: any, orderId: string) {
  const { data: items, error: itemsError } = await supabase
    .from('new_batch_order_items')
    .select('harga')
    .eq('order_id', orderId);

  if (itemsError) throw itemsError;

  const totalHarga = (items || []).reduce((sum: number, it: any) => sum + (it.harga || 0), 0);
  const jumlahItem = items?.length || 0;

  const { error: updateError } = await supabase
    .from('new_batch_orders')
    .update({ total_harga: totalHarga, jumlah_item: jumlahItem })
    .eq('id', orderId);

  if (updateError) throw updateError;
  return { totalHarga, jumlahItem };
}

// ── 1. ADD NEW JERSEY ITEM TO AN ORDER ────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, warna, ukuran, lengan = 'pendek', namaPunggung = '', tanpaNamaPunggung = false, customHarga } = body;

    if (!orderId || !warna || !ukuran) {
      return NextResponse.json({ error: 'Missing required fields: orderId, warna, ukuran' }, { status: 400 });
    }

    const calculatedPrice = typeof customHarga === 'number' && customHarga > 0
      ? customHarga
      : getSizePrice(ukuran, lengan);

    const supabase = getServiceClient();

    const { data: item, error: insertError } = await supabase
      .from('new_batch_order_items')
      .insert([
        {
          order_id: orderId,
          warna,
          ukuran,
          lengan,
          nama_punggung: tanpaNamaPunggung ? null : (namaPunggung || null),
          tanpa_nama_punggung: tanpaNamaPunggung || false,
          harga: calculatedPrice,
        },
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const { totalHarga, jumlahItem } = await syncOrderTotals(supabase, orderId);

    return NextResponse.json({ success: true, item, totalHarga, jumlahItem }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

// ── 2. MODIFY / EDIT AN EXISTING JERSEY ITEM ─────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, orderId, warna, ukuran, lengan, namaPunggung, tanpaNamaPunggung, customHarga } = body;

    if (!itemId || !orderId) {
      return NextResponse.json({ error: 'Missing itemId or orderId' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const patch: any = {};
    if (warna !== undefined) patch.warna = warna;
    if (ukuran !== undefined) patch.ukuran = ukuran;
    if (lengan !== undefined) patch.lengan = lengan;
    if (tanpaNamaPunggung !== undefined) {
      patch.tanpa_nama_punggung = tanpaNamaPunggung;
      patch.nama_punggung = tanpaNamaPunggung ? null : (namaPunggung || null);
    } else if (namaPunggung !== undefined) {
      patch.nama_punggung = namaPunggung ? namaPunggung.trim() : null;
    }

    if (typeof customHarga === 'number' && customHarga > 0) {
      patch.harga = customHarga;
    } else if (ukuran !== undefined || lengan !== undefined) {
      // Get current values if not passed
      const { data: cur } = await supabase.from('new_batch_order_items').select('*').eq('id', itemId).single();
      const finalUkuran = ukuran || cur?.ukuran || 'M';
      const finalLengan = lengan || cur?.lengan || 'pendek';
      patch.harga = getSizePrice(finalUkuran, finalLengan);
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from('new_batch_order_items')
      .update(patch)
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { totalHarga, jumlahItem } = await syncOrderTotals(supabase, orderId);

    return NextResponse.json({ success: true, updatedItem, totalHarga, jumlahItem });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

// ── 3. DELETE / ABORT A SINGLE JERSEY ITEM ───────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const orderId = searchParams.get('orderId');

    if (!itemId || !orderId) {
      return NextResponse.json({ error: 'Missing itemId or orderId' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { error: deleteError } = await supabase
      .from('new_batch_order_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const { totalHarga, jumlahItem } = await syncOrderTotals(supabase, orderId);

    return NextResponse.json({
      success: true,
      message: 'Jersey berhasil dibatalkan/dihapus',
      totalHarga,
      jumlahItem,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
