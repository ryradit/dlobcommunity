import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface MemberNotification {
  name: string;
  phone: string;
  amountDue: number;
  attendanceFee: number;
  hasMembership: boolean;
  isPaymentExempt: boolean;
  // Set when admin just recorded membership payment for this session
  membershipJustPaid?: boolean;
  membershipAmount?: number;
  // Optional bulk fields (when member played in multiple matches on the same date)
  matchCount?: number;      // number of matches (if > 1, use bulk message format)
  totalAmountDue?: number;  // sum of amountDue across all matches
}

export async function POST(req: NextRequest) {
  const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

  if (!FONNTE_TOKEN) {
    return NextResponse.json({ error: 'FONNTE_TOKEN not configured' }, { status: 500 });
  }

  // ── Check WA toggle from app_settings DB (admin can toggle in settings page) ──
  const body = await req.json();
  try {
    const { data: setting } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'wa_notifications_enabled')
      .maybeSingle();
    const isEnabled = setting?.value === 'true';
    if (!isEnabled) {
      const members: MemberNotification[] = body.members ?? [];
      const skipped = members.map((m: MemberNotification) => ({ name: m.name, phone: m.phone, status: 'skipped', error: 'WA notifications disabled' }));
      return NextResponse.json({ results: skipped, summary: { sent: 0, failed: 0, skipped: skipped.length }, disabled: true });
    }
  } catch {
    // If DB check fails, fall back to env var
    if (process.env.WA_NOTIFICATION_ENABLED !== 'true') {
      const members: MemberNotification[] = body.members ?? [];
      const skipped = members.map((m: MemberNotification) => ({ name: m.name, phone: m.phone, status: 'skipped', error: 'WA notifications disabled' }));
      return NextResponse.json({ results: skipped, summary: { sent: 0, failed: 0, skipped: skipped.length }, disabled: true });
    }
  }

  const bodyParsed = body;
  const { matchDate, members, quickSend = false }: { matchDate: string; members: MemberNotification[]; quickSend?: boolean } = bodyParsed;

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

  // Early month = day 1–7 → show dual-schema membership choice
  const isEarlyMonth = matchDateObj.getDate() <= 7;

  // Calculate membership fee for this month (count Saturdays)
  const mYear = matchDateObj.getFullYear();
  const mMonth = matchDateObj.getMonth();
  const lastDay = new Date(mYear, mMonth + 1, 0).getDate();
  let saturdays = 0;
  for (let d = 1; d <= lastDay; d++) {
    if (new Date(mYear, mMonth, d).getDay() === 6) saturdays++;
  }
  const membershipFee = saturdays >= 5 ? 45000 : 40000;
  const monthLabel = matchDateObj.toLocaleDateString('id-ID', { month: 'long' });

  const results: { name: string; phone: string; status: string; error?: string }[] = [];

  for (const member of members) {
    if (!member.phone) {
      results.push({ name: member.name, phone: '-', status: 'skipped', error: 'No phone number' });
      continue;
    }

    // Format Indonesian phone: remove leading 0, add 62 prefix
    let phone = member.phone.trim().replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);
    if (!phone.startsWith('62')) phone = '62' + phone;

    const isBulk = (member.matchCount ?? 1) > 1;
    const displayAmountDue = isBulk ? (member.totalAmountDue ?? member.amountDue) : member.amountDue;
    const countLabel = isBulk ? ` (${member.matchCount} pertandingan)` : '';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dlob.community';

    const paymentSection = [
      ``,
      `Silakan bayar melalui:`,
      `1️⃣ Transfer via aplikasi:`,
      `${appUrl}/dashboard/pembayaran`,
      `2️⃣ Bayar tunai ke Admin di lapangan`,
    ];

    let message: string;

    if (member.isPaymentExempt) {
      // VIP — free
      message = [
        `🏸 Pertandingan DLOB`,
        ``,
        `Halo ${member.name}!`,
        ``,
        `Pertandingan telah dijadwalkan:`,
        `📅 ${formattedDate}`,
        ``,
        `✅ VIP / Bebas Bayar — Total: Rp 0`,
        ``,
        `_Abaikan jika kamu sudah membayar tunai melalui admin._`,
        ``,
        `— DLOB Community`,
      ].join('\n');

    } else if (member.membershipJustPaid) {
      // Admin recorded membership payment for this session
      const mAmount = member.membershipAmount ?? membershipFee;
      const totalDue = displayAmountDue + mAmount;
      message = [
        `🏸 Pertandingan DLOB`,
        ``,
        `Halo ${member.name}!`,
        ``,
        `Pertandingan telah dijadwalkan:`,
        `📅 ${formattedDate}`,
        ``,
        `💰 Tagihan kamu${countLabel}:`,
        `  • Shuttlecock: Rp ${displayAmountDue.toLocaleString('id-ID')}`,
        `  • Membership ${monthLabel}: Rp ${mAmount.toLocaleString('id-ID')}`,
        `  ━━━━━━━━━━━━━━`,
        `  Total: Rp ${totalDue.toLocaleString('id-ID')}`,
        `  ✅ Attendance fee GRATIS sisa bulan ini!`,
        ...paymentSection,
        ``,
        `_Abaikan jika kamu sudah membayar tunai melalui admin._`,
        ``,
        `— DLOB Community`,
      ].join('\n');

    } else if (!member.hasMembership && isEarlyMonth) {
      // Early month + no membership → dual-schema
      const totalRegular = displayAmountDue + member.attendanceFee;
      const totalWithMembership = displayAmountDue + membershipFee;
      const bulkHeader = isBulk
        ? `💡 Awal bulan — kamu main ${member.matchCount} pertandingan, pilih cara bayar:`
        : `💡 Awal bulan — pilih cara bayar kamu:`;
      message = [
        `🏸 Pertandingan DLOB`,
        ``,
        `Halo ${member.name}!`,
        ``,
        `Pertandingan telah dijadwalkan:`,
        `📅 ${formattedDate}`,
        ``,
        bulkHeader,
        ``,
        `🅰️ Bayar per sesi (tanpa membership):`,
        `  • Shuttlecock: Rp ${displayAmountDue.toLocaleString('id-ID')}`,
        `  • Attendance fee: Rp ${member.attendanceFee.toLocaleString('id-ID')}`,
        `  ━━━━━━━━━━━━━━`,
        `  Total: Rp ${totalRegular.toLocaleString('id-ID')}`,
        ``,
        `🅱️ Ambil membership ${monthLabel} (${saturdays} sesi):`,
        `  • Shuttlecock: Rp ${displayAmountDue.toLocaleString('id-ID')}`,
        `  • Membership: Rp ${membershipFee.toLocaleString('id-ID')}`,
        `  ━━━━━━━━━━━━━━`,
        `  Total: Rp ${totalWithMembership.toLocaleString('id-ID')}`,
        `  ✅ Attendance fee GRATIS sisa bulan ini!`,
        ...paymentSection,
        ``,
        `📌 Untuk Opsi B: buka link di atas → aktifkan toggle *"Tambah Membership"* di halaman pembayaran → bayar sekaligus dalam 1 transfer!`,
        ``,
        `_Abaikan jika kamu sudah membayar tunai melalui admin._`,
        ``,
        `— DLOB Community`,
      ].join('\n');

    } else {
      // Normal schema — has membership OR not early month
      let membershipInfo = '';
      if (member.hasMembership) {
        membershipInfo = `✅ Membership aktif (attendance fee gratis)`;
      } else {
        membershipInfo = `⚠️ Belum membership (+ attendance fee Rp ${member.attendanceFee.toLocaleString('id-ID')})`;
      }
      const totalDue = displayAmountDue + (member.hasMembership ? 0 : member.attendanceFee);
      message = [
        `🏸 Pertandingan DLOB`,
        ``,
        `Halo ${member.name}!`,
        ``,
        `Pertandingan telah dijadwalkan:`,
        `📅 ${formattedDate}`,
        ``,
        `💰 Tagihan kamu${countLabel}:`,
        `  • Biaya shuttlecock: Rp ${displayAmountDue.toLocaleString('id-ID')}`,
        membershipInfo,
        `  ━━━━━━━━━━━━━━`,
        `  Total: Rp ${totalDue.toLocaleString('id-ID')}`,
        ...paymentSection,
        ``,
        `_Abaikan jika kamu sudah membayar tunai melalui admin._`,
        ``,
        `— DLOB Community`,
      ].join('\n');
    }

    try {
      const formData = new URLSearchParams();
      formData.append('target', phone);
      formData.append('message', message);
      formData.append('countryCode', '62');
      // Tell Fonnte to also add a server-side delay (in seconds) before sending
      // This adds a second layer of protection on top of our own setTimeout
      formData.append('delay', quickSend ? '5' : '3');

      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: FONNTE_TOKEN,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();
      console.log(`[Fonnte] ${member.name} (${phone}):`, JSON.stringify(data));

      // Fonnte returns status as boolean true or string "true"
      if (data.status === true || data.status === 'true') {
        results.push({ name: member.name, phone, status: 'sent' });
      } else {
        const errMsg = data.reason || data.message || data.detail || JSON.stringify(data);
        results.push({ name: member.name, phone, status: 'failed', error: errMsg });
      }
    } catch (err) {
      results.push({ name: member.name, phone, status: 'failed', error: String(err) });
    }

    // Delay between messages to avoid WA spam detection / account ban
    // quickSend (bulk admin) = 3–6s random, normal = 4–8s random
    // Never fire simultaneously — even "quick" bulk needs human-like gaps
    if (members.indexOf(member) < members.length - 1) {
      const delay = quickSend
        ? 3000 + Math.random() * 3000   // 3–6 seconds
        : 4000 + Math.random() * 4000;  // 4–8 seconds
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  const sent = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  return NextResponse.json({ results, summary: { sent, failed, skipped } });
}
