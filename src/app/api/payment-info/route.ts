import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_BANK_INFO = {
  holderName: 'Septian Dwiyo Rifalda',
  banks: [
    { name: 'Permata Bank', number: '9937 296 220' },
    { name: 'Jenius', number: '90012823396' },
    { name: 'Mandiri', number: '1700 1093 5998 56' },
    { name: 'BNI', number: '0389 125635' },
    { name: 'Blu (BCA Digital)', number: '0022 2208 9889' },
    { name: 'BCA', number: '5871 788 087' },
  ],
  ewallets: [
    { name: 'DANA', number: '0821 1113 4140' },
    { name: 'Gopay', number: '0812 7073 272' },
    { name: 'ShopeePay', number: '0821 1113 4140' },
  ],
};

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from('app_settings')
      .select('key, value')
      .in('key', ['bank_accounts', 'qris_image_url']);

    const rows = data ?? [];
    const bankRow = rows.find(r => r.key === 'bank_accounts');
    const qrisRow = rows.find(r => r.key === 'qris_image_url');

    let bankInfo = DEFAULT_BANK_INFO;
    if (bankRow?.value) {
      try { bankInfo = JSON.parse(bankRow.value); } catch { /* use default */ }
    }

    const qrisImageUrl = qrisRow?.value || null;

    return NextResponse.json({ bankInfo, qrisImageUrl });
  } catch {
    return NextResponse.json({ bankInfo: DEFAULT_BANK_INFO, qrisImageUrl: null });
  }
}
