import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface ReceiptItem {
  warna: string;
  ukuran: string;
  lengan: string;
  nama_punggung: string | null;
  tanpa_nama_punggung: boolean;
  harga: number;
}

interface ReceiptPayload {
  orderId: string;
  orderNumber?: string;
  email: string;
  nama: string;
  no_wa: string;
  total_harga: number;
  created_at: string;
  items: ReceiptItem[];
}

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const colorLabel = (w: string) =>
  w === 'biru' ? 'Biru Navy' : w === 'kuning' ? 'Kuning' : 'Merah';

const colorDot = (w: string) =>
  w === 'biru' ? '#0b244c' : w === 'kuning' ? '#FFC000' : '#cc0000';

function buildReceiptHtml(p: ReceiptPayload): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
  const cLabel = (w: string) => w === 'biru' ? 'Biru' : w === 'kuning' ? 'Kuning' : 'Merah';

  const itemsRows = p.items
    .map((it) => {
      const backLabel = it.tanpa_nama_punggung
        ? '<span style="color:#6b7280;">-</span>'
        : it.nama_punggung
        ? `<strong>${it.nama_punggung}</strong>`
        : '<span style="color:#6b7280;">-</span>';
      const sleeveLabel = it.lengan === 'panjang' ? 'Panjang' : 'Pendek';
      return `
        <tr style="background:#ffffff;border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 12px;font-size:12px;color:#111827;"><strong>${cLabel(it.warna)}</strong></td>
          <td style="padding:10px 12px;font-size:12px;color:#111827;font-weight:700;">${it.ukuran}</td>
          <td style="padding:10px 12px;font-size:12px;color:#4b5563;">${sleeveLabel}</td>
          <td style="padding:10px 12px;font-size:12px;color:#111827;">${backLabel}</td>
          <td style="padding:10px 12px;font-size:12px;color:#000000;font-weight:700;text-align:right;">${fmt(it.harga)}</td>
        </tr>`;
    })
    .join('');

  const orderDate = new Date(p.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const orderNum = p.orderNumber || ('#' + p.orderId.slice(0, 8).toUpperCase());

  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>Kwitansi DLOB</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#111827;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1.5px solid #111827;border-radius:6px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.06);">
  
  <!-- Header with Brand & Red LUNAS Stamp -->
  <tr><td style="padding:28px 28px 20px;border-bottom:1.5px solid #111827;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:top;">
          <h1 style="margin:0;color:#000000;font-size:20px;font-weight:800;letter-spacing:0.5px;">DLOB COMMUNITY</h1>
          <p style="margin:2px 0 6px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Badminton Club & Community Ecosystem</p>
          <p style="margin:0;color:#000000;font-size:13px;font-weight:700;text-transform:uppercase;">KWITANSI PEMBAYARAN RESMI</p>
        </td>
        <td style="vertical-align:top;text-align:right;width:120px;">
          <!-- RED STAMP LUNAS -->
          <div style="display:inline-block;border:2.5px solid #dc2626;border-radius:4px;padding:6px 14px;text-align:center;transform:rotate(-4deg);">
            <span style="display:block;color:#dc2626;font-size:16px;font-weight:900;letter-spacing:2px;line-height:1;">LUNAS</span>
            <span style="display:block;color:#dc2626;font-size:7.5px;font-weight:800;letter-spacing:0.5px;margin-top:2px;">PAID & VERIFIED</span>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Meta Info (2 Columns) -->
  <tr><td style="padding:18px 28px 12px;border-bottom:1px solid #e5e7eb;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:top;width:50%;font-size:12px;line-height:1.6;">
          <span style="color:#6b7280;">No. Order:</span> <strong style="color:#000000;font-family:monospace;">${orderNum}</strong><br>
          <span style="color:#6b7280;">Tanggal:</span> <strong style="color:#000000;">${orderDate}</strong>
        </td>
        <td style="vertical-align:top;width:50%;font-size:12px;line-height:1.6;">
          <span style="color:#6b7280;">Pemesan:</span> <strong style="color:#000000;">${p.nama}</strong><br>
          <span style="color:#6b7280;">WhatsApp:</span> <strong style="color:#000000;">${p.no_wa}</strong>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Items Table -->
  <tr><td style="padding:18px 28px;">
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.05em;">Rincian Pesanan</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #111827;border-radius:4px;overflow:hidden;margin-bottom:16px;">
      <thead><tr style="background:#111827;color:#ffffff;">
        <th style="padding:8px 12px;font-size:11px;text-align:left;font-weight:700;text-transform:uppercase;">Item / Warna</th>
        <th style="padding:8px 12px;font-size:11px;text-align:left;font-weight:700;text-transform:uppercase;">Ukuran</th>
        <th style="padding:8px 12px;font-size:11px;text-align:left;font-weight:700;text-transform:uppercase;">Lengan</th>
        <th style="padding:8px 12px;font-size:11px;text-align:left;font-weight:700;text-transform:uppercase;">Nama Punggung</th>
        <th style="padding:8px 12px;font-size:11px;text-align:right;font-weight:700;text-transform:uppercase;">Harga</th>
      </tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <!-- Total Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
      <tr>
        <td></td>
        <td style="width:240px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #000000;background:#ffffff;padding:10px 14px;border-radius:4px;">
            <tr>
              <td style="font-size:12px;font-weight:800;color:#000000;text-transform:uppercase;">TOTAL BAYAR</td>
              <td style="font-size:16px;font-weight:900;color:#000000;text-align:right;font-family:monospace;">${fmt(p.total_harga)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Note -->
    <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:4px;padding:12px 14px;margin-bottom:20px;">
      <p style="margin:0;font-size:11.5px;color:#4b5563;line-height:1.5;">
        <strong style="color:#111827;">Keterangan:</strong> Pembayaran telah diverifikasi oleh admin DLOB Community. Kwitansi resmi dalam format PDF telah dilampirkan pada email ini.
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:8px;">
      <a href="https://www.dlobcommunity.com" style="display:inline-block;background:#000000;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;padding:10px 24px;border-radius:4px;">
        Kunjungi Website DLOB Community
      </a>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:14px 28px;border-top:1px solid #111827;background:#fafafa;text-align:center;">
    <p style="margin:0;font-size:11px;color:#6b7280;">© ${new Date().getFullYear()} DLOB Community · <a href="https://www.dlobcommunity.com" style="color:#111827;text-decoration:underline;">www.dlobcommunity.com</a></p>
    <p style="margin:3px 0 0;font-size:10px;color:#9ca3af;">Dokumen kwitansi elektronik resmi & sah. Jangan balas email ini.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

export async function POST(request: NextRequest) {
  try {
    const payload: ReceiptPayload = await request.json();
    const { email, nama, orderId } = payload;

    if (!email || !nama || !orderId) {
      return NextResponse.json({ error: 'email, nama, and orderId are required' }, { status: 400 });
    }

    const smtpHost = process.env.SMTP_HOST || 'smtp.dreamhost.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'SMTP not configured' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `DLOB Community <${smtpUser}>`,
      to: email,
      subject: `✅ Kwitansi Pembayaran Jersey DLOB — ${nama}`,
      html: buildReceiptHtml(payload),
    });

    console.log(`[Jersey Receipt] Sent to ${email} for order ${orderId}`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Jersey Receipt] Failed:', error?.message);
    return NextResponse.json({ error: 'Failed to send receipt', details: error?.message }, { status: 500 });
  }
}
