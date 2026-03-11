import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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
  membershipJustPaid?: boolean;
  membershipAmount?: number;
  matchCount?: number;
  totalAmountDue?: number;
}

export async function POST(req: NextRequest) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP not configured' }, { status: 500 });
  }

  const body = await req.json();

  // ── Check email toggle from app_settings DB ──
  try {
    const { data: setting } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'email_notifications_enabled')
      .maybeSingle();
    const isEnabled = setting ? setting.value === 'true' : true; // default on
    if (!isEnabled) {
      const mems: MemberNotification[] = body.members ?? [];
      const skipped = mems.map((m: MemberNotification) => ({ name: m.name, email: m.email, status: 'skipped', error: 'Email notifications disabled' }));
      return NextResponse.json({ results: skipped, summary: { sent: 0, failed: 0, skipped: skipped.length }, disabled: true });
    }
  } catch {
    // If DB check fails, continue sending (email is less spammy risk than WA)
  }

  const { matchDate, members }: { matchDate: string; members: MemberNotification[] } = body;

  if (!matchDate || !members?.length) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const matchDateObj = new Date(matchDate);
  const formattedDate = matchDateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Early month = day 1–7
  const isEarlyMonth = matchDateObj.getDate() <= 7;

  // Compute membership fee for this month
  const mYear = matchDateObj.getFullYear();
  const mMonth = matchDateObj.getMonth();
  const lastDay = new Date(mYear, mMonth + 1, 0).getDate();
  let saturdays = 0;
  for (let d = 1; d <= lastDay; d++) {
    if (new Date(mYear, mMonth, d).getDay() === 6) saturdays++;
  }
  const membershipFee = saturdays >= 5 ? 45000 : 40000;
  const monthLabel = matchDateObj.toLocaleDateString('id-ID', { month: 'long' });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dlob.community';
  const results: { name: string; email: string; status: string; error?: string }[] = [];

  // Shared HTML fragments
  const headerHtml = `
    <tr>
      <td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:32px;text-align:center;">
        <img src="https://dlobcommunity.com/dlob.png" alt="DLOB" style="width:56px;height:auto;margin-bottom:12px;filter:brightness(0) invert(1);" />
        <h1 style="margin:0;color:#fff;font-size:24px;font-weight:bold;">DLOB Community</h1>
        <p style="margin:6px 0 0;color:#93c5fd;font-size:14px;">🏸 Notifikasi Pertandingan</p>
      </td>
    </tr>`;

  const footerHtml = `
    <tr>
      <td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="margin:0 0 4px;color:#9ca3af;font-size:11px;font-style:italic;">Abaikan email ini jika kamu sudah membayar tunai melalui admin.</p>
        <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 DLOB Community · <a href="${appUrl}" style="color:#2563eb;text-decoration:none;">dlobcommunity.com</a></p>
      </td>
    </tr>`;

  const paymentOptionsHtml = `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin-bottom:28px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:bold;color:#1e40af;">📲 Cara Pembayaran</p>
      <p style="margin:0 0 8px;font-size:13px;color:#374151;">1️⃣ <strong>Transfer via aplikasi:</strong></p>
      <p style="margin:0 0 16px;font-size:13px;color:#374151;padding-left:20px;">
        Login ke <a href="${appUrl}/dashboard/pembayaran" style="color:#2563eb;">${appUrl}/dashboard/pembayaran</a> dan upload bukti transfer
      </p>
      <p style="margin:0;font-size:13px;color:#374151;">2️⃣ <strong>Bayar tunai langsung ke Admin di lapangan</strong></p>
    </div>`;

  const ctaButton = `<a href="${appUrl}/dashboard/pembayaran" style="display:block;text-align:center;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;font-size:15px;">Lihat Detail Pembayaran →</a>`;

  const scheduleBox = (date: string) => `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;font-weight:bold;letter-spacing:0.05em;">Jadwal Pertandingan</p>
      <p style="margin:0;font-size:20px;font-weight:bold;color:#1e3a5f;">📅 ${date}</p>
    </div>`;

  for (const member of members) {
    if (!member.email) {
      results.push({ name: member.name, email: '-', status: 'skipped', error: 'No email' });
      continue;
    }

    const isBulk = (member.matchCount ?? 1) > 1;
    const displayAmountDue = isBulk ? (member.totalAmountDue ?? member.amountDue) : member.amountDue;
    const countNote = isBulk ? ` <span style="color:#6b7280;font-size:13px;">(${member.matchCount} pertandingan)</span>` : '';

    let bodyContent = '';
    let totalForSubject = 0;

    if (member.isPaymentExempt) {
      // ── Schema 1: VIP ──────────────────────────────────────
      totalForSubject = 0;
      bodyContent = `
        <p style="margin:0 0 8px;color:#374151;font-size:16px;">Halo, <strong>${member.name}</strong>!</p>
        <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Pertandingan baru telah dijadwalkan. Kamu terdaftar sebagai anggota VIP.</p>
        ${scheduleBox(formattedDate)}
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
          <p style="margin:0;font-size:18px;font-weight:bold;color:#16a34a;">✅ VIP / Bebas Bayar — Total: Rp 0</p>
        </div>
        ${ctaButton}`;

    } else if (member.membershipJustPaid) {
      // ── Schema 2: Admin recorded membership this session ───
      const mAmount = member.membershipAmount ?? membershipFee;
      const total = displayAmountDue + mAmount;
      totalForSubject = total;
      bodyContent = `
        <p style="margin:0 0 8px;color:#374151;font-size:16px;">Halo, <strong>${member.name}</strong>!</p>
        <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Pertandingan baru dijadwalkan. Membership ${monthLabel} kamu juga sudah dicatat sekaligus.</p>
        ${scheduleBox(formattedDate)}
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 16px;font-size:12px;color:#9ca3af;text-transform:uppercase;font-weight:bold;letter-spacing:0.05em;">Rincian Tagihan</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:14px;">Shuttlecock${countNote}</td>
              <td style="padding:6px 0;font-weight:bold;color:#111827;text-align:right;">Rp ${displayAmountDue.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:14px;">Membership ${monthLabel}</td>
              <td style="padding:6px 0;font-weight:bold;color:#7c3aed;text-align:right;">Rp ${mAmount.toLocaleString('id-ID')}</td>
            </tr>
            <tr><td colspan="2" style="padding:8px 0;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0;"></td></tr>
            <tr>
              <td style="padding:6px 0;font-weight:bold;color:#111827;font-size:16px;">Total</td>
              <td style="padding:6px 0;font-weight:bold;color:#2563eb;font-size:20px;text-align:right;">Rp ${total.toLocaleString('id-ID')}</td>
            </tr>
          </table>
          <p style="margin:12px 0 0;font-size:13px;color:#16a34a;font-weight:bold;">✅ Attendance fee GRATIS sisa bulan ini!</p>
        </div>
        ${paymentOptionsHtml}
        ${ctaButton}`;

    } else if (!member.hasMembership && isEarlyMonth) {
      // ── Schema 3: Early month dual-option ─────────────────
      const totalA = displayAmountDue + member.attendanceFee;
      const totalB = displayAmountDue + membershipFee;
      totalForSubject = totalA; // show Option A in subject as default
      bodyContent = `
        <p style="margin:0 0 8px;color:#374151;font-size:16px;">Halo, <strong>${member.name}</strong>!</p>
        <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Pertandingan baru dijadwalkan. Karena masih awal bulan, kamu bisa pilih cara bayar di bawah ini${isBulk ? ` untuk ${member.matchCount} pertandingan` : ''}.</p>
        ${scheduleBox(formattedDate)}

        <!-- Option A -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:16px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:bold;color:#374151;">🅰️ Bayar per sesi (tanpa membership)</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;">Shuttlecock${countNote}</td>
              <td style="padding:4px 0;color:#111827;text-align:right;font-size:13px;">Rp ${displayAmountDue.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;">Attendance fee</td>
              <td style="padding:4px 0;color:#d97706;text-align:right;font-size:13px;">+ Rp ${member.attendanceFee.toLocaleString('id-ID')}</td>
            </tr>
            <tr><td colspan="2" style="padding:6px 0;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0;"></td></tr>
            <tr>
              <td style="padding:4px 0;font-weight:bold;color:#111827;">Total</td>
              <td style="padding:4px 0;font-weight:bold;color:#2563eb;text-align:right;font-size:16px;">Rp ${totalA.toLocaleString('id-ID')}</td>
            </tr>
          </table>
        </div>

        <!-- Option B -->
        <div style="background:#faf5ff;border:2px solid #c4b5fd;border-radius:8px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:bold;color:#7c3aed;">🅱️ Ambil Membership ${monthLabel} (${saturdays} sesi) — Rekomendasi!</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;">Shuttlecock${countNote}</td>
              <td style="padding:4px 0;color:#111827;text-align:right;font-size:13px;">Rp ${displayAmountDue.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;">Membership ${monthLabel}</td>
              <td style="padding:4px 0;color:#7c3aed;text-align:right;font-size:13px;">Rp ${membershipFee.toLocaleString('id-ID')}</td>
            </tr>
            <tr><td colspan="2" style="padding:6px 0;"><hr style="border:none;border-top:1px solid #c4b5fd;margin:0;"></td></tr>
            <tr>
              <td style="padding:4px 0;font-weight:bold;color:#111827;">Total</td>
              <td style="padding:4px 0;font-weight:bold;color:#7c3aed;text-align:right;font-size:16px;">Rp ${totalB.toLocaleString('id-ID')}</td>
            </tr>
          </table>
          <p style="margin:10px 0 0;font-size:12px;color:#16a34a;font-weight:bold;">✅ Attendance fee GRATIS sisa bulan ini!</p>
        </div>

        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;color:#92400e;">
            📌 <strong>Untuk Opsi B:</strong> buka link di bawah → aktifkan toggle <em>"Tambah Membership"</em> di halaman pembayaran → bayar sekaligus dalam 1 transfer!
          </p>
        </div>

        ${paymentOptionsHtml}
        ${ctaButton}`;

    } else {
      // ── Schema 4: Normal ───────────────────────────────────
      const total = displayAmountDue + (member.hasMembership ? 0 : member.attendanceFee);
      totalForSubject = total;
      const membershipRow = member.hasMembership
        ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Membership</td><td style="padding:6px 0;text-align:right;"><span style="background:#2563eb;color:#fff;padding:2px 10px;border-radius:10px;font-size:12px;font-weight:bold;">Aktif ✅</span></td></tr>`
        : `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Attendance fee</td><td style="padding:6px 0;font-weight:bold;color:#d97706;text-align:right;">+ Rp ${member.attendanceFee.toLocaleString('id-ID')}</td></tr>`;
      bodyContent = `
        <p style="margin:0 0 8px;color:#374151;font-size:16px;">Halo, <strong>${member.name}</strong>!</p>
        <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Pertandingan baru telah dijadwalkan. Berikut detail tagihan kamu:</p>
        ${scheduleBox(formattedDate)}
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 16px;font-size:12px;color:#9ca3af;text-transform:uppercase;font-weight:bold;letter-spacing:0.05em;">Rincian Tagihan</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:14px;">Biaya shuttlecock${countNote}</td>
              <td style="padding:6px 0;font-weight:bold;color:#111827;text-align:right;">Rp ${displayAmountDue.toLocaleString('id-ID')}</td>
            </tr>
            ${membershipRow}
            <tr><td colspan="2" style="padding:8px 0;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0;"></td></tr>
            <tr>
              <td style="padding:6px 0;font-weight:bold;color:#111827;font-size:16px;">Total</td>
              <td style="padding:6px 0;font-weight:bold;color:#2563eb;font-size:20px;text-align:right;">Rp ${total.toLocaleString('id-ID')}</td>
            </tr>
          </table>
        </div>
        ${paymentOptionsHtml}
        ${ctaButton}`;
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        ${headerHtml}
        <tr><td style="padding:32px;">${bodyContent}</td></tr>
        ${footerHtml}
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      await transporter.sendMail({
        from: `DLOB Community <${process.env.SMTP_USER}>`,
        to: member.email,
        subject: `🏸 Pertandingan${isBulk ? ` (${member.matchCount}x)` : ''} ${formattedDate} — Tagihan Rp ${totalForSubject.toLocaleString('id-ID')}`,
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
