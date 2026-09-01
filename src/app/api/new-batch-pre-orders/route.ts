import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import nodemailer from 'nodemailer';

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

// Send exclusive email notification only to ryradit@gmail.com
async function sendNewBatchOrderEmailNotification(order: {
  id: string;
  nama: string;
  no_wa: string;
  total_harga: number;
  jumlah_item: number;
  items: Array<{
    warna: string;
    ukuran: string;
    lengan: string;
    nama_punggung: string | null;
    tanpa_nama_punggung: boolean;
    harga: number;
  }>;
}) {
  try {
    const smtpHost = process.env.SMTP_HOST || 'smtp.dreamhost.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.warn('[New Batch Notification] SMTP credentials not configured, skipping email.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const formatRp = (n: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const waClean = order.no_wa.replace(/\D/g, '');
    const waLink = `https://wa.me/${waClean.startsWith('0') ? '62' + waClean.slice(1) : waClean}`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dlobcommunity.com';
    const recapLink = `${siteUrl}/admin/rekap-new-batch`;

    const itemsHtml = order.items
      .map((it) => {
        const colorName = it.warna === 'biru' ? 'Biru Navy' : it.warna === 'kuning' ? 'Kuning' : 'Merah';
        const colorDot = it.warna === 'biru' ? '#0b244c' : it.warna === 'kuning' ? '#FFC000' : '#ff0000';
        const sleeveName = it.lengan === 'panjang' ? 'Lengan Panjang (+10k)' : 'Lengan Pendek';
        const backName = it.tanpa_nama_punggung
          ? '<em>(Tanpa nama)</em>'
          : it.nama_punggung
          ? `<strong>${it.nama_punggung}</strong>`
          : '-';

        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 12px; font-size: 13px; color: #1f2937;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${colorDot}; margin-right: 6px;"></span>
              <strong>${colorName}</strong>
            </td>
            <td style="padding: 10px 12px; font-size: 13px; color: #111827; font-weight: bold;">${it.ukuran}</td>
            <td style="padding: 10px 12px; font-size: 13px; color: #4b5563;">${sleeveName}</td>
            <td style="padding: 10px 12px; font-size: 13px; color: #111827; font-family: monospace;">${backName}</td>
            <td style="padding: 10px 12px; font-size: 13px; color: #059669; font-weight: bold; text-align: right;">${formatRp(it.harga)}</td>
          </tr>
        `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pesanan Jersey DLOB New Batch Baru</title>
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0b244c 0%, #1a365d 100%); padding: 28px 32px; color: #ffffff;">
            <div style="display: inline-block; padding: 4px 12px; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 20px; font-size: 11px; font-weight: bold; color: #34d399; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">
              Notifikasi Khusus Owner
            </div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
              🏸 Pesanan Pre-Order New Batch Masuk!
            </h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1;">
              Ada pesanan jersey baru yang baru saja di-submit oleh customer.
            </p>
          </div>

          <!-- Customer Details -->
          <div style="padding: 24px 32px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; width: 140px;">Nama Pemesan:</td>
                <td style="padding: 6px 0; font-size: 15px; color: #0f172a; font-weight: bold;">${order.nama}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">No. WhatsApp:</td>
                <td style="padding: 6px 0; font-size: 14px;">
                  <a href="${waLink}" style="color: #059669; text-decoration: none; font-weight: bold; font-family: monospace;">
                    ${order.no_wa} ↗ (Chat WA)
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Waktu Order:</td>
                <td style="padding: 6px 0; font-size: 13px; color: #334155;">
                  ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'short' })} WIB
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Total Pembayaran:</td>
                <td style="padding: 6px 0; font-size: 18px; color: #059669; font-weight: 800; font-family: monospace;">
                  ${formatRp(order.total_harga)} <span style="font-size: 12px; color: #64748b; font-weight: normal;">(${order.jumlah_item} jersey)</span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Items Table -->
          <div style="padding: 24px 32px;">
            <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
              Rincian Jersey (${order.jumlah_item} pcs)
            </h3>
            <table style="width: 100%; border-collapse: collapse; text-align: left; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 11px; text-transform: uppercase;">
                  <th style="padding: 8px 12px;">Warna</th>
                  <th style="padding: 8px 12px;">Size</th>
                  <th style="padding: 8px 12px;">Lengan</th>
                  <th style="padding: 8px 12px;">Nama Punggung</th>
                  <th style="padding: 8px 12px; text-align: right;">Harga</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Action CTA -->
            <div style="margin-top: 28px; text-align: center;">
              <a href="${recapLink}" style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: #000000; font-size: 13px; font-weight: bold; text-decoration: none; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                Buka Rekapitulasi di Admin Dashboard →
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 16px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
              Email notifikasi eksklusif ini hanya dikirimkan ke <strong>ryradit@gmail.com</strong> (Owner D'LOB Community).
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"DLOB Jersey System" <${smtpUser}>`,
      to: 'ryradit@gmail.com',
      subject: `🏸 Pre-Order New Batch: ${order.nama} (${order.jumlah_item} Jersey - ${formatRp(order.total_harga)})`,
      html: htmlContent,
    });

    console.log(`[New Batch Notification] Email successfully sent to ryradit@gmail.com for order ${order.id}`);
  } catch (err: any) {
    console.error('[New Batch Notification] Failed to send email to ryradit@gmail.com:', err.message);
  }
}

// ── Order Number Generator: dlb{YYYYMMDD}-{queue} (WIB) ─────
async function generateOrderNumber(supabase: ReturnType<typeof getServiceClient>): Promise<string> {
  // WIB = UTC+7
  const wibMs  = Date.now() + 7 * 3600 * 1000;
  const wibNow = new Date(wibMs);
  const y = wibNow.getUTCFullYear();
  const m = wibNow.getUTCMonth();
  const d = wibNow.getUTCDate();
  const dateStr = `${y}${String(m + 1).padStart(2, '0')}${String(d).padStart(2, '0')}`;

  // WIB day boundary in UTC  (WIB midnight = UTC 17:00 prev day)
  const wibDayStartUTC = new Date(Date.UTC(y, m, d)     - 7 * 3600 * 1000).toISOString();
  const wibDayEndUTC   = new Date(Date.UTC(y, m, d + 1) - 7 * 3600 * 1000).toISOString();

  const { count } = await supabase
    .from('new_batch_orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', wibDayStartUTC)
    .lt('created_at', wibDayEndUTC);

  const queue = String((count ?? 0) + 1).padStart(2, '0');
  return `dlb${dateStr}-${queue}`;
}

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const { nama, noWa, items, email } = body;

    if (!nama || !noWa || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: nama, noWa, items[]' },
        { status: 400 }
      );
    }

    const validSizes = [
      // Adult
      'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL',
      // Kids
      'Kids S', 'Kids M', 'Kids L', 'Kids XL',
      // Balita
      'Balita XS', 'Balita S', 'Balita M', 'Balita L', 'Balita XL',
    ];
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

    // Generate unique order number (dlbYYYYMMDD-NN)
    const orderNumber = await generateOrderNumber(supabase);

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
      .insert([{ nama, no_wa: noWa, email: email || null, order_number: orderNumber, total_harga: totalHarga, jumlah_item: items.length }])
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

    // Trigger exclusive email notification to ryradit@gmail.com asynchronously
    sendNewBatchOrderEmailNotification({
      id: order.id,
      nama,
      no_wa: noWa,
      total_harga: totalHarga,
      jumlah_item: items.length,
      items: lineItems,
    }).catch((err) => {
      console.error('[Background Email Error]:', err);
    });

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
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields: id, status' }, { status: 400 });
    }

    const validStatuses = ['pending', 'confirmed', 'paid', 'produced', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('new_batch_orders')
      .update({ status })
      .eq('id', id)
      .select('*, new_batch_order_items(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-send receipt email when marked paid and email is available
    if (status === 'paid' && data?.email) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dlobcommunity.com';
      fetch(`${baseUrl}/api/jersey-receipt-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: data.id,
          orderNumber: data.order_number || data.id.slice(0, 8).toUpperCase(),
          email: data.email,
          nama: data.nama,
          no_wa: data.no_wa,
          total_harga: data.total_harga,
          created_at: data.created_at,
          items: data.new_batch_order_items || [],
        }),
      }).catch((err) => console.error('[Receipt Email Fire Error]:', err));
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { error } = await supabase
      .from('new_batch_orders')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Order successfully deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

