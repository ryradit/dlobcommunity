import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30; // 30 seconds

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface SmartAction {
  id: string;
  type: 'pay-all' | 'pay-revisions' | 'pay-pending' | 'pay-membership';
  title: string;
  description: string;
  count?: number;
  payments?: Array<{
    id: string;
    type: 'match' | 'membership';
    amount: number;
    label: string;
    isRevision?: boolean;
  }>;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

interface SuggestionCard {
  id: string;
  type: 'attention' | 'success' | 'info' | 'warning';
  title: string;
  description: string;
  action?: {
    label: string;
    actionType: string;
    data?: any;
  };
  dismissible: boolean;
  priority: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberName, month, year } = body;

    if (!memberName) {
      return NextResponse.json(
        { error: 'Member name is required' },
        { status: 400 }
      );
    }

    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    console.log(`📊 Generating payment suggestions for member: ${memberName} (${currentMonth}/${currentYear})`);

    // Fetch member's payment data
    const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString();
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();

    const [matchMembersResult, membershipsResult] = await Promise.all([
      supabase
        .from('match_members')
        .select('*, matches(match_number, created_at)')
        .eq('member_name', memberName)
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      supabase
        .from('memberships')
        .select('*')
        .eq('member_name', memberName)
        .eq('month', currentMonth)
        .eq('year', currentYear)
    ]);

    const matchMembers = matchMembersResult.data || [];
    const memberships = membershipsResult.data || [];

    // Remove duplicates from matches (same match_id and member_name)
    const uniqueMatches = matchMembers.reduce((acc: any[], current) => {
      const existingIndex = acc.findIndex(item => item.match_id === current.match_id);
      if (existingIndex === -1) {
        acc.push(current);
      } else {
        // Keep the one with payment_proof if available
        if (current.payment_proof && !acc[existingIndex].payment_proof) {
          acc[existingIndex] = current;
        }
      }
      return acc;
    }, []);

    // Analyze data for smart actions
    const smartActions: SmartAction[] = [];
    const suggestionCards: SuggestionCard[] = [];

    // Filter out paid and cancelled
    const pendingMatches = uniqueMatches.filter(m => 
      m.payment_status === 'pending' || m.payment_status === 'rejected'
    );
    const pendingMemberships = memberships.filter(m => 
      m.payment_status === 'pending' || m.payment_status === 'rejected'
    );

    // Smart Action 1: Pay all revisions/rejections
    const rejectedPayments = [
      ...pendingMatches.filter(m => m.payment_status === 'rejected'),
      ...pendingMemberships.filter(m => m.payment_status === 'rejected')
    ];

    if (rejectedPayments.length > 0) {
      const payments = rejectedPayments.map(p => ({
        id: p.id,
        type: ('match_id' in p ? 'match' : 'membership') as 'match' | 'membership',
        amount: 'total_amount' in p ? p.total_amount : p.amount,
        label: 'match_id' in p 
          ? `Match #${(p as any).matches?.match_number || '?'} - ${p.member_name}`
          : `Iuran ${getMonthName(currentMonth)} ${currentYear}`,
        isRevision: true
      }));

      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

      smartActions.push({
        id: 'pay-revisions',
        type: 'pay-revisions',
        title: 'Bayar Revisi',
        description: `${rejectedPayments.length} pembayaran perlu revisi`,
        count: rejectedPayments.length,
        payments,
        priority: 'high',
        icon: '🔄'
      });

      suggestionCards.push({
        id: 'revisions-alert',
        type: 'attention',
        title: `⚠️ ${rejectedPayments.length} Pembayaran Perlu Revisi`,
        description: `Anda memiliki ${rejectedPayments.length} pembayaran yang ditolak dan perlu direvisi. Total: Rp ${totalAmount.toLocaleString('id-ID')}`,
        action: {
          label: 'Bayar Sekarang',
          actionType: 'pay-revisions',
          data: { payments }
        },
        dismissible: false,
        priority: 1
      });
    }

    // Smart Action 2: Pay all (pending + rejected) - Main action
    const allUnpaidPayments = [
      ...pendingMatches,
      ...pendingMemberships
    ];

    if (allUnpaidPayments.length > 0) {
      const payments = allUnpaidPayments.map(p => ({
        id: p.id,
        type: ('match_id' in p ? 'match' : 'membership') as 'match' | 'membership',
        amount: 'total_amount' in p ? p.total_amount : p.amount,
        label: 'match_id' in p 
          ? `Match #${(p as any).matches?.match_number || '?'} - ${p.member_name}`
          : `Iuran ${getMonthName(currentMonth)} ${currentYear}`,
        isRevision: p.payment_status === 'rejected'
      }));

      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

      smartActions.push({
        id: 'pay-all',
        type: 'pay-all',
        title: 'Bayar Semua Tagihan',
        description: `${allUnpaidPayments.length} tagihan siap dibayar`,
        count: allUnpaidPayments.length,
        payments,
        priority: allUnpaidPayments.length > 3 ? 'high' : 'medium',
        icon: '💰'
      });

      if (allUnpaidPayments.length >= 3) {
        suggestionCards.push({
          id: 'bulk-payment',
          type: 'info',
          title: `💡 Hemat Waktu dengan Bulk Payment`,
          description: `Anda punya ${allUnpaidPayments.length} tagihan. Transfer total Rp ${totalAmount.toLocaleString('id-ID')} dalam satu transaksi, upload bukti satu kali!`,
          action: {
            label: 'Bayar Semua Sekaligus',
            actionType: 'pay-all',
            data: { payments }
          },
          dismissible: true,
          priority: 2
        });
      }
    }

    // Smart Action 3: Pay membership only (if exists)
    const unpaidMembership = pendingMemberships[0];
    if (unpaidMembership) {
      const payment = {
        id: unpaidMembership.id,
        type: 'membership' as const,
        amount: unpaidMembership.amount,
        label: `Iuran ${getMonthName(currentMonth)} ${currentYear}`,
        isRevision: unpaidMembership.payment_status === 'rejected'
      };

      smartActions.push({
        id: 'pay-membership',
        type: 'pay-membership',
        title: 'Bayar Iuran Bulan Ini',
        description: `Iuran ${getMonthName(currentMonth)}`,
        count: 1,
        payments: [payment],
        priority: 'low',
        icon: '🎫'
      });
    }

    // Suggestion: Payments pending confirmation
    const pendingConfirmation = [
      ...uniqueMatches.filter(m => m.payment_status === 'pending' && m.payment_proof),
      ...memberships.filter(m => m.payment_status === 'pending' && m.payment_proof)
    ];

   if (pendingConfirmation.length > 0) {
      suggestionCards.push({
        id: 'pending-confirmation',
        type: 'warning',
        title: `⏳ ${pendingConfirmation.length} Pembayaran Menunggu Konfirmasi`,
        description: `Bukti pembayaran Anda sudah diupload dan sedang dalam proses verifikasi admin.`,
        dismissible: true,
        priority: 3
      });
    }

    // Success message if all paid
    const totalPayments = uniqueMatches.length + memberships.length;
    const paidPayments = [
      ...uniqueMatches.filter(m => m.payment_status === 'paid'),
      ...memberships.filter(m => m.payment_status === 'paid')
    ];

    if (paidPayments.length === totalPayments && totalPayments > 0) {
      suggestionCards.push({
        id: 'all-paid',
        type: 'success',
        title: `✅ Semua Tagihan Lunas!`,
        description: `Terima kasih! Semua ${totalPayments} pembayaran Anda sudah lunas.`,
        dismissible: true,
        priority: 0
      });
    }

    console.log(`✅ Generated ${smartActions.length} smart actions and ${suggestionCards.length} suggestions for ${memberName}`);

    return NextResponse.json({
      success: true,
      smartActions,
      suggestionCards,
      stats: {
        totalPayments,
        paidPayments: paidPayments.length,
        pendingPayments: allUnpaidPayments.length,
        rejectedPayments: rejectedPayments.length,
        pendingConfirmation: pendingConfirmation.length
      }
    });

  } catch (error) {
    console.error('❌ Error generating member payment suggestions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate suggestions', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

function getMonthName(month: number): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[month - 1] || 'Unknown';
}
