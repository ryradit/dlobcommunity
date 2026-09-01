import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { renderToBuffer } from '@react-pdf/renderer';
import { JerseyReceiptPDF } from '@/lib/jerseyReceiptPDF';
import fs from 'fs';
import path from 'path';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase environment variables');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data: order, error } = await supabase
      .from('new_batch_orders')
      .select('*, new_batch_order_items(*)')
      .eq('id', id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let logoBase64: string | undefined = undefined;
    try {
      const logoFile = path.join(process.cwd(), 'public/icon-dlob-hitam.png');
      if (fs.existsSync(logoFile)) {
        const buf = fs.readFileSync(logoFile);
        logoBase64 = `data:image/png;base64,${buf.toString('base64')}`;
      }
    } catch (e) {
      console.warn('[Receipt PDF] Logo load fallback:', e);
    }

    const receiptData = {
      orderId: order.id,
      orderNumber: order.order_number,
      nama: order.nama,
      no_wa: order.no_wa,
      total_harga: order.total_harga,
      created_at: order.created_at,
      items: order.new_batch_order_items || [],
      logoSrc: logoBase64,
    };

    const pdfDoc = JerseyReceiptPDF({ data: receiptData }) as any;
    const pdfBuffer = await renderToBuffer(pdfDoc);

    const safeOrderNum = (order.order_number || `DLB-${order.id.slice(0, 8)}`).toUpperCase();
    const filename = `Kwitansi-DLOB-${safeOrderNum}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('[Receipt PDF Preview Error]:', error?.message);
    return NextResponse.json({ error: 'Failed to generate PDF receipt', details: error?.message }, { status: 500 });
  }
}
