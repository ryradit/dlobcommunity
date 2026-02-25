import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30; // 30 seconds

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
  type: 'auto-confirm' | 'confirm-all' | 'send-reminders' | 'flag-suspicious' | 'generate-report';
  title: string;
  description: string;
  count?: number;
  payments?: Array<{
    id: string;
    type: 'match' | 'membership';
    memberName: string;
    amount: number;
    matchId?: string;
    proofUrl?: string | null;
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
    const { month, year } = body;

    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    console.log(`📊 Generating payment suggestions for ${currentMonth}/${currentYear}`);

    // Fetch payment data
    const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString();
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();

    // First, fetch matches filtered by match_date (not created_at)
    const matchesResult = await supabase
      .from('matches')
      .select('id')
      .gte('match_date', startDate)
      .lte('match_date', endDate);

    const matchesInMonth = matchesResult.data || [];
    const matchIds = matchesInMonth.map(m => m.id);

    // Then fetch match_members only for matches in this month
    const [matchMembersResult, membershipsResult] = await Promise.all([
      matchIds.length > 0
        ? supabase
            .from('match_members')
            .select('id, member_name, total_amount, payment_status, paid_at, payment_proof, match_id, created_at')
            .in('match_id', matchIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from('memberships')
        .select('id, member_name, amount, payment_status, paid_at, payment_proof, created_at')
        .eq('month', currentMonth)
        .eq('year', currentYear)
    ]);

    const matchMembers = matchMembersResult.data || [];
    const memberships = membershipsResult.data || [];

    // Analyze data for smart actions
    const smartActions: SmartAction[] = [];
    const suggestionCards: SuggestionCard[] = [];

    // Smart Action 1: Auto-confirm verified payments
    const verifiedPayments = [
      ...matchMembers.filter(m => m.payment_status === 'pending' && m.payment_proof),
      ...memberships.filter(m => m.payment_status === 'pending' && m.payment_proof)
    ];

    if (verifiedPayments.length > 0) {
      const payments = verifiedPayments.map(p => ({
        id: p.id,
        type: 'member_name' in p && 'match_id' in p ? 'match' as const : 'membership' as const,
        memberName: p.member_name,
        amount: 'total_amount' in p ? p.total_amount : p.amount,
        matchId: 'match_id' in p ? p.match_id : undefined,
        proofUrl: p.payment_proof // Include proof URL for validation
      }));

      smartActions.push({
        id: 'auto-confirm-verified',
        type: 'auto-confirm',
        title: `Auto-Confirm Verified (${verifiedPayments.length})`,
        description: `${verifiedPayments.length} pembayaran dengan bukti siap dikonfirmasi`,
        count: verifiedPayments.length,
        payments,
        priority: 'high',
        icon: '✅'
      });

      // Add success suggestion card
      suggestionCards.push({
        id: 'verified-payments-ready',
        type: 'success',
        title: '💡 Pembayaran Siap Dikonfirmasi',
        description: `Ditemukan ${verifiedPayments.length} pembayaran dengan bukti transfer yang valid. Konfirmasi sekarang untuk update status member.`,
        action: {
          label: 'Konfirmasi Semua',
          actionType: 'auto-confirm',
          data: { payments }
        },
        dismissible: true,
        priority: 1
      });
    }

    // Smart Action 1B: Confirm ALL pending payments (including without proof - requires extra confirmation)
    const allPendingPayments = [
      ...matchMembers.filter(m => m.payment_status === 'pending'),
      ...memberships.filter(m => m.payment_status === 'pending')
    ];

    if (allPendingPayments.length > 0) {
      const payments = allPendingPayments.map(p => ({
        id: p.id,
        type: 'member_name' in p && 'match_id' in p ? 'match' as const : 'membership' as const,
        memberName: p.member_name,
        amount: 'total_amount' in p ? p.total_amount : p.amount,
        matchId: 'match_id' in p ? p.match_id : undefined,
        proofUrl: p.payment_proof
      }));

      const withoutProofCount = allPendingPayments.filter(p => !p.payment_proof).length;

      smartActions.push({
        id: 'confirm-all-pending',
        type: 'confirm-all',
        title: `Confirm All Pending (${allPendingPayments.length})`,
        description: withoutProofCount > 0 
          ? `${allPendingPayments.length} total (⚠️ ${withoutProofCount} tanpa bukti)`
          : `${allPendingPayments.length} pembayaran pending`,
        count: allPendingPayments.length,
        payments,
        priority: withoutProofCount > 0 ? 'medium' : 'high',
        icon: '⚡'
      });
    }

    // Smart Action 2: Send reminders for overdue payments
    const overduePayments = [
      ...matchMembers.filter(m => {
        if (m.payment_status !== 'pending') return false;
        const daysSinceCreated = (Date.now() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreated > 7; // 7 days overdue
      }),
      ...memberships.filter(m => {
        if (m.payment_status !== 'pending') return false;
        const daysSinceCreated = (Date.now() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreated > 7;
      })
    ];

    if (overduePayments.length > 0) {
      smartActions.push({
        id: 'send-reminders-overdue',
        type: 'send-reminders',
        title: `Send Reminders (${overduePayments.length})`,
        description: `${overduePayments.length} pembayaran tertunda >7 hari`,
        count: overduePayments.length,
        priority: 'high',
        icon: '📨'
      });

      // Add attention suggestion card
      suggestionCards.push({
        id: 'overdue-payments',
        type: 'attention',
        title: '⚠️ Pembayaran Tertunda',
        description: `${overduePayments.length} member belum bayar selama lebih dari 7 hari. Kirim reminder otomatis?`,
        action: {
          label: 'Kirim Reminder',
          actionType: 'send-reminders',
          data: { count: overduePayments.length }
        },
        dismissible: true,
        priority: 2
      });
    }

    // Smart Action 3: Flag suspicious payments (no proof, high amount)
    const suspiciousPayments = matchMembers.filter(m => 
      m.payment_status === 'pending' && 
      !m.payment_proof && 
      m.total_amount > 50000
    );

    if (suspiciousPayments.length > 0) {
      smartActions.push({
        id: 'flag-suspicious',
        type: 'flag-suspicious',
        title: `Review High-Value (${suspiciousPayments.length})`,
        description: `${suspiciousPayments.length} pembayaran >50k tanpa bukti`,
        count: suspiciousPayments.length,
        priority: 'medium',
        icon: '🔍'
      });

      suggestionCards.push({
        id: 'suspicious-payments',
        type: 'warning',
        title: '🔍 Perlu Verifikasi Manual',
        description: `${suspiciousPayments.length} pembayaran bernilai tinggi tanpa bukti transfer. Hubungi member untuk konfirmasi.`,
        action: {
          label: 'Lihat Detail',
          actionType: 'flag-suspicious'
        },
        dismissible: true,
        priority: 3
      });
    }

    // Smart Action 4: Generate monthly report
    const totalPaid = matchMembers.filter(m => m.payment_status === 'paid').reduce((sum, m) => sum + m.total_amount, 0)
      + memberships.filter(m => m.payment_status === 'paid').reduce((sum, m) => sum + m.amount, 0);

    smartActions.push({
      id: 'generate-report',
      type: 'generate-report',
      title: 'Generate Monthly Report',
      description: `Laporan lengkap bulan ${new Date(currentYear, currentMonth - 1).toLocaleDateString('id-ID', { month: 'long' })}`,
      priority: 'low',
      icon: '📊'
    });

    // Add info card about report
    if (totalPaid > 0) {
      suggestionCards.push({
        id: 'monthly-summary',
        type: 'info',
        title: '📊 Rekap Bulan Ini',
        description: `Total pendapatan: Rp ${totalPaid.toLocaleString('id-ID')}. Generate laporan lengkap dengan analisa AI?`,
        action: {
          label: 'Generate Report',
          actionType: 'generate-report'
        },
        dismissible: true,
        priority: 4
      });
    }

    console.log(`✅ Generated ${smartActions.length} smart actions and ${suggestionCards.length} suggestions`);

    return NextResponse.json({
      success: true,
      smartActions,
      suggestionCards,
      metadata: {
        month: currentMonth,
        year: currentYear,
        totalPayments: matchMembers.length + memberships.length,
        pendingCount: matchMembers.filter(m => m.payment_status === 'pending').length + 
                      memberships.filter(m => m.payment_status === 'pending').length
      }
    });

  } catch (error) {
    console.error('❌ Payment suggestions error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate suggestions', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
