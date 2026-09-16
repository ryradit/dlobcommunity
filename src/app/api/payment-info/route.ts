import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_PUSAT_BANK_INFO = {
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

const DEFAULT_DLBC_BANK_INFO = {
  holderName: '',
  banks: [] as { name: string; number: string }[],
  ewallets: [] as { name: string; number: string }[],
};

export async function GET(request: NextRequest) {
  let isDlbc = false;
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || searchParams.get('branch_id') || 'dlob-pusat';
    isDlbc = branch === 'dlob-cikupa' || branch === 'cikupa';

    const bankKey = isDlbc ? 'bank_accounts_dlob-cikupa' : 'bank_accounts';
    const qrisKey = isDlbc ? 'qris_image_url_dlob-cikupa' : 'qris_image_url';

    const { data } = await supabaseAdmin
      .from('app_settings')
      .select('key, value')
      .in('key', [bankKey, qrisKey]);

    const rows = data ?? [];
    const bankRow = rows.find(r => r.key === bankKey);
    const qrisRow = rows.find(r => r.key === qrisKey);

    const defaultBank = isDlbc ? DEFAULT_DLBC_BANK_INFO : DEFAULT_PUSAT_BANK_INFO;
    let bankInfo = defaultBank;
    if (bankRow?.value) {
      try { 
        const parsed = JSON.parse(bankRow.value);
        if (parsed && typeof parsed === 'object') {
          bankInfo = parsed;
        }
      } catch { /* use default */ }
    }

    const qrisImageUrl = qrisRow?.value || null;

    return NextResponse.json({ bankInfo, qrisImageUrl });
  } catch {
    return NextResponse.json({
      bankInfo: isDlbc ? DEFAULT_DLBC_BANK_INFO : DEFAULT_PUSAT_BANK_INFO,
      qrisImageUrl: null,
    });
  }
}
