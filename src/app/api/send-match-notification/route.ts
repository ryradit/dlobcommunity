import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.dreamhost.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface MemberNotification {
  name: string;
  email: string;
  amountDue: number;
  attendanceFee: number;
  hasMembership: boolean;
  isPaymentExempt: boolean;
  matchCount?: number;
  totalAmountDue?: number;
}

export async function POST(req: NextRequest) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP not configured' }, { status: 500 });
  }

  const body = await req.json();
  const { matchDate, members }: { matchDate: string; members: MemberNotification[] } = body;

  if (!matchDate || !members?.length) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const formattedDate = new Date(matchDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dlob.community';
  const results: { name: string; email: string; status: string; error?: string }[] = [];

  for (const member of members) {
    if (!member.email) {
      results.push({ name: member.name, email: '-', status: 'skipped', error: 'No email' });
      continue;
    }

    const isBulk = (member.matchCount ?? 1) > 1;
    const displayAmountDue = isBulk ? (member.totalAmountDue ?? member.amountDue) : member.amountDue;
    const totalDue = member.isPaymentExempt ? 0 : displayAmountDue + member.attendanceFee;
    const countLabel = isBulk ? ` (${member.matchCount} pertandingan)` : '';

    let membershipBadge = '';
    let membershipRow = '';
    if (member.isPaymentExempt) {
      membershipBadge = '<span style="background:#16a34a;color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:bold;">VIP / Bebas Bayar</span>';
      membershipRow = `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Status</td><td style="padding:6px 0;font-weight:bold;color:#16a34a;">${membershipBadge}</td></tr>`;
    } else if (member.hasMembership) {
      membershipBadge = '<span style="background:#2563eb;color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:bold;">Membership Aktif</span>';
      membershipRow = `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Membership</td><td style="padding:6px 0;">${membershipBadge}</td></tr>`;
    } else {
      membershipRow = `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Attendance Fee</td><td style="padding:6px 0;font-weight:bold;color:#d97706;">+ Rp ${member.attendanceFee.toLocaleString('id-ID')}</td></tr>`;
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:32px;text-align:center;">
            <img src="https://dlobcommunity.com/dlob.png" alt="DLOB" style="width:56px;height:auto;margin-bottom:12px;filter:brightness(0) invert(1);" />
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:bold;">DLOB Community</h1>
            <p style="margin:6px 0 0;color:#93c5fd;font-size:14px;">🏸 Notifikasi Pertandingan</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;color:#374151;font-size:16px;">Halo, <strong>${member.name}</strong>!</p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
              Pertandingan baru telah dijadwalkan. Berikut detail tagihan kamu:
            </p>

            <!-- Match Info Box -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;font-weight:bold;letter-spacing:0.05em;">Jadwal Pertandingan</p>
              <p style="margin:0;font-size:20px;font-weight:bold;color:#1e3a5f;">📅 ${formattedDate}</p>
            </div>

            <!-- Payment Table -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 16px;font-size:12px;color:#9ca3af;text-transform:uppercase;font-weight:bold;letter-spacing:0.05em;">Rincian Tagihan</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;color:#6b7280;font-size:14px;">Biaya shuttlecock${countLabel}</td>
                  <td style="padding:6px 0;font-weight:bold;color:#111827;text-align:right;">Rp ${displayAmountDue.toLocaleString('id-ID')}</td>
                </tr>
                ${membershipRow.replace('</td></tr>', '</td><td></td></tr>').replace('<td style="padding:6px 0;', '<td style="padding:6px 0;').replace('</td><td></td></tr>', `</td><td style="text-align:right;"></td></tr>`)}
                <tr><td colspan="2" style="padding:8px 0;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0;"></td></tr>
                <tr>
                  <td style="padding:6px 0;font-weight:bold;color:#111827;font-size:16px;">Total</td>
                  <td style="padding:6px 0;font-weight:bold;color:#2563eb;font-size:20px;text-align:right;">Rp ${totalDue.toLocaleString('id-ID')}</td>
                </tr>
              </table>
            </div>

            <!-- Payment Options -->
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin-bottom:28px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:bold;color:#1e40af;">📲 Cara Pembayaran</p>
              <p style="margin:0 0 8px;font-size:13px;color:#374151;">1️⃣ <strong>Transfer via aplikasi:</strong></p>
              <p style="margin:0 0 16px;font-size:13px;color:#374151;padding-left:20px;">
                Login ke <a href="${appUrl}/dashboard/pembayaran" style="color:#2563eb;">${appUrl}/dashboard/pembayaran</a> dan upload bukti transfer
              </p>
              <p style="margin:0;font-size:13px;color:#374151;">2️⃣ <strong>Bayar tunai langsung ke Admin di lapangan</strong></p>
            </div>

            <a href="${appUrl}/dashboard/pembayaran" style="display:block;text-align:center;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;font-size:15px;">
              Lihat Detail Pembayaran →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 DLOB Community · <a href="${appUrl}" style="color:#2563eb;text-decoration:none;">dlobcommunity.com</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      await transporter.sendMail({
        from: `DLOB Community <${process.env.SMTP_USER}>`,
        to: member.email,
        subject: `🏸 Pertandingan${isBulk ? ` (${member.matchCount}x)` : ''} ${formattedDate} — Tagihan Rp ${totalDue.toLocaleString('id-ID')}`,
        html,
      });
      results.push({ name: member.name, email: member.email, status: 'sent' });
    } catch (err: any) {
      console.error(`[Email] Failed for ${member.name}:`, err.message);
      results.push({ name: member.name, email: member.email, status: 'failed', error: err.message });
    }
  }

  const sent = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  return NextResponse.json({ results, summary: { sent, failed, skipped } });
}
