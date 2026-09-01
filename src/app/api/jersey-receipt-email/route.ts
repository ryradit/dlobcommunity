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
  const itemsRows = p.items
    .map((it, i) => {
      const backLabel = it.tanpa_nama_punggung
        ? '<em style="color:#9ca3af;">Tanpa nama</em>'
        : it.nama_punggung
        ? `<strong>${it.nama_punggung}</strong>`
        : '<em style="color:#9ca3af;">—</em>';
      const sleeveLabel = it.lengan === 'panjang' ? 'Lengan Panjang' : 'Lengan Pendek';
      return `
        <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#ffffff'};">
          <td style="padding:10px 14px;font-size:13px;color:#111827;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${colorDot(it.warna)};margin-right:6px;vertical-align:middle;"></span>
            <strong>${colorLabel(it.warna)}</strong>
          </td>
          <td style="padding:10px 14px;font-size:13px;color:#111827;font-weight:700;">${it.ukuran}</td>
          <td style="padding:10px 14px;font-size:13px;color:#4b5563;">${sleeveLabel}</td>
          <td style="padding:10px 14px;font-size:13px;">${backLabel}</td>
          <td style="padding:10px 14px;font-size:13px;color:#059669;font-weight:700;text-align:right;">${formatRp(it.harga)}</td>
        </tr>`;
    })
    .join('');

  const orderDate = new Date(p.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><title>Kwitansi Jersey DLOB</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0b244c,#1a3a6b);padding:32px;text-align:center;">
            <img src="https://dlobcommunity.com/dlob.png" alt="DLOB" style="width:60px;height:auto;margin-bottom:14px;filter:brightness(0) invert(1);">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">DLOB Community</h1>
            <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">Pre-Order Jersey New Batch</p>
          </td>
        </tr>
        <!-- Paid Banner -->
        <tr>
          <td style="background:#dcfce7;padding:16px 32px;text-align:center;border-bottom:2px dashed #bbf7d0;">
            <p style="margin:0;color:#15803d;font-size:18px;font-weight:800;">✅ Pembayaran Lunas!</p>
            <p style="margin:4px 0 0;color:#166534;font-size:13px;">Pesanan kamu telah dikonfirmasi dan akan segera diproses.</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 20px;font-size:15px;color:#374151;">Halo <strong>${p.nama}</strong>! 👋<br>Berikut kwitansi digital pembayaran jersey Pre-Order DLOB New Batch kamu.</p>
          <!-- Order Meta -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:14px 18px;margin-bottom:24px;border:1px solid #e5e7eb;">
            <tr>
              <td style="font-size:12px;color:#6b7280;padding:3px 0;width:50%;">🆔 No. Order</td>
              <td style="font-size:12px;color:#111827;font-weight:700;font-family:monospace;">${p.orderNumber || '#' + p.orderId.slice(0, 8).toUpperCase()}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#6b7280;padding:3px 0;">📅 Tanggal</td>
              <td style="font-size:12px;color:#111827;font-weight:600;">${orderDate}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#6b7280;padding:3px 0;">📱 WhatsApp</td>
              <td style="font-size:12px;color:#111827;font-weight:600;">${p.no_wa}</td>
            </tr>
          </table>
          <!-- Items -->
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Detail Pesanan</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:16px;">
            <thead>
              <tr style="background:#111827;">
                <th style="padding:10px 14px;font-size:11px;color:#d1d5db;text-align:left;">Warna</th>
                <th style="padding:10px 14px;font-size:11px;color:#d1d5db;text-align:left;">Ukuran</th>
                <th style="padding:10px 14px;font-size:11px;color:#d1d5db;text-align:left;">Lengan</th>
                <th style="padding:10px 14px;font-size:11px;color:#d1d5db;text-align:left;">Nama Punggung</th>
                <th style="padding:10px 14px;font-size:11px;color:#d1d5db;text-align:right;">Harga</th>
              </tr>
            </thead>
            <tbody>${itemsRows}</tbody>
          </table>
          <!-- Total -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b244c;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
            <tr>
              <td style="font-size:14px;color:#93c5fd;font-weight:600;">Total Pembayaran</td>
              <td style="font-size:20px;color:#fff;font-weight:800;text-align:right;font-family:monospace;">${formatRp(p.total_harga)}</td>
            </tr>
          </table>
          <!-- Note -->
          <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;margin-bottom:24px;">
            <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
              <strong>📦 Info Proses:</strong> Jersey akan diproses setelah semua pesanan terkumpul. Tim DLOB akan menghubungi kamu via WhatsApp untuk info pengiriman.
            </p>
          </div>
          <!-- CTA -->
          <div style="text-align:center;">
            <a href="https://www.dlobcommunity.com" style="display:inline-block;background:#0b244c;color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:12px 28px;border-radius:999px;">🏸 Kunjungi DLOB Community</a>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} DLOB Community · <a href="https://www.dlobcommunity.com" style="color:#2563eb;text-decoration:none;">dlobcommunity.com</a></p>
            <p style="margin:4px 0 0;font-size:11px;color:#d1d5db;">Email ini dikirim otomatis. Jangan balas email ini.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
