import { NextRequest, NextResponse } from 'next/server';

interface MemberNotification {
  name: string;
  phone: string;
  amountDue: number;
  attendanceFee: number;
  hasMembership: boolean;
  isPaymentExempt: boolean;
  // Optional bulk fields (when member played in multiple matches on the same date)
  matchCount?: number;      // number of matches (if > 1, use bulk message format)
  totalAmountDue?: number;  // sum of amountDue across all matches
}

export async function POST(req: NextRequest) {
  const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

  if (!FONNTE_TOKEN) {
    return NextResponse.json({ error: 'FONNTE_TOKEN not configured' }, { status: 500 });
  }

  const body = await req.json();
  const { matchDate, members, quickSend = false }: { matchDate: string; members: MemberNotification[]; quickSend?: boolean } = body;

  if (!matchDate || !members?.length) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const formattedDate = new Date(matchDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
    const totalDue = member.isPaymentExempt ? 0 : displayAmountDue + member.attendanceFee;

    let membershipInfo = '';
    if (member.isPaymentExempt) {
      membershipInfo = '✅ VIP / Bebas Bayar';
    } else if (member.hasMembership) {
      membershipInfo = '✅ Membership aktif (attendance fee gratis)';
    } else {
      membershipInfo = '⚠️ Belum membership (+ attendance fee Rp ' + member.attendanceFee.toLocaleString('id-ID') + ')';
    }

    const countLabel = isBulk ? ` (${member.matchCount} pertandingan)` : '';

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dlob.community';

    const paymentSection = member.isPaymentExempt ? [] : [
      ``,
      `Silakan bayar melalui:`,
      `1️⃣ Transfer via aplikasi:`,
      `${appUrl}/dashboard/pembayaran`,
      `2️⃣ Bayar tunai ke Admin di lapangan`,
    ];

    const message = [
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
      `— DLOB Community`,
    ].join('\n');

    try {
      const formData = new URLSearchParams();
      formData.append('target', phone);
      formData.append('message', message);
      formData.append('countryCode', '62');

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

    // Delay between messages to avoid WA spam detection
    // quickSend (bulk admin) = 200ms, normal = 2-4s random
    if (members.indexOf(member) < members.length - 1) {
      const delay = quickSend ? 200 : (2000 + Math.random() * 2000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  const sent = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  return NextResponse.json({ results, summary: { sent, failed, skipped } });
}
