import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MembershipCalculationService } from '@/lib/services/membershipCalculation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const memberId = searchParams.get('member_id');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    switch (action) {
      case 'membership_status': {
        if (!memberId) {
          return NextResponse.json(
            { success: false, error: 'Member ID is required' },
            { status: 400 }
          );
        }

        // Get member's membership payments
        const { data: membershipPayments, error } = await supabase
          .from('membership_payments')
          .select('*')
          .eq('member_id', memberId);

        if (error) {
          throw new Error(`Failed to get membership payments: ${error.message}`);
        }

        // Check current membership status
        const now = new Date();
        const membershipStatus = MembershipCalculationService.checkMembershipStatus(
          membershipPayments || [],
          now
        );

        return NextResponse.json({
          success: true,
          data: {
            membershipStatus,
            membershipPayments: membershipPayments || []
          }
        });
      }

      case 'monthly_fee': {
        const feeMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        const feeYear = year ? parseInt(year) : new Date().getFullYear();

        const monthlyFee = MembershipCalculationService.calculateMonthlyFee(feeYear, feeMonth);
        
        return NextResponse.json({
          success: true,
          data: { monthlyFee }
        });
      }

      case 'saturday_sessions': {
        const sessionsMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        const sessionsYear = year ? parseInt(year) : new Date().getFullYear();

        const saturdaySessions = MembershipCalculationService.getSaturdaySessionsInMonth(
          sessionsYear, 
          sessionsMonth
        );

        const nextSession = MembershipCalculationService.getNextSaturdaySession();

        return NextResponse.json({
          success: true,
          data: {
            saturdaySessions: saturdaySessions.map(s => s.toISOString()),
            nextSession: nextSession.toISOString(),
            totalSessions: saturdaySessions.length
          }
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Membership API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create_membership_payment': {
        const { member_id, month, year } = body;
        
        if (!member_id || !month || !year) {
          return NextResponse.json(
            { success: false, error: 'Member ID, month, and year are required' },
            { status: 400 }
          );
        }

        // Calculate membership fee
        const monthlyFee = MembershipCalculationService.calculateMonthlyFee(year, month);

        // Create membership payment record
        const { data: membershipPayment, error: membershipError } = await supabase
          .from('membership_payments')
          .insert({
            member_id,
            month,
            year,
            amount: monthlyFee.amount,
            weeks_in_month: monthlyFee.weeksInMonth,
            status: 'unpaid'
          })
          .select()
          .single();

        if (membershipError) {
          throw new Error(`Failed to create membership payment: ${membershipError.message}`);
        }

        // Create corresponding payment record
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .insert({
            member_id,
            amount: monthlyFee.amount,
            type: 'monthly',
            status: 'pending',
            due_date: monthlyFee.dueDate,
            notes: monthlyFee.description
          })
          .select()
          .single();

        if (paymentError) {
          throw new Error(`Failed to create payment record: ${paymentError.message}`);
        }

        return NextResponse.json({
          success: true,
          data: {
            membershipPayment,
            payment,
            monthlyFee
          }
        });
      }

      case 'calculate_session_payment': {
        const { member_id, session_date, shuttlecocks_used } = body;
        
        if (!member_id || !session_date) {
          return NextResponse.json(
            { success: false, error: 'Member ID and session date are required' },
            { status: 400 }
          );
        }

        const sessionDate = new Date(session_date);
        const shuttlecocksUsed = shuttlecocks_used || 1;

        // Get member's membership status
        const { data: membershipPayments, error } = await supabase
          .from('membership_payments')
          .select('*')
          .eq('member_id', member_id);

        if (error) {
          throw new Error(`Failed to get membership payments: ${error.message}`);
        }

        const membershipStatus = MembershipCalculationService.checkMembershipStatus(
          membershipPayments || [],
          sessionDate
        );

        const sessionPayment = MembershipCalculationService.calculateSessionPayment(
          member_id,
          sessionDate,
          shuttlecocksUsed,
          membershipStatus
        );

        return NextResponse.json({
          success: true,
          data: {
            sessionPayment,
            membershipStatus
          }
        });
      }

      case 'create_session_payments': {
        const { member_ids, session_date, shuttlecocks_used } = body;
        
        if (!member_ids || !session_date || !Array.isArray(member_ids)) {
          return NextResponse.json(
            { success: false, error: 'Member IDs array and session date are required' },
            { status: 400 }
          );
        }

        const sessionDate = new Date(session_date);
        const shuttlecocksUsed = shuttlecocks_used || 1;

        // Get membership status for all members
        const membershipData: Record<string, any[]> = {};
        
        for (const memberId of member_ids) {
          const { data: payments } = await supabase
            .from('membership_payments')
            .select('*')
            .eq('member_id', memberId);
          
          membershipData[memberId] = payments || [];
        }

        // Calculate session payments
        const sessionPayments = MembershipCalculationService.calculateGroupSessionPayments(
          member_ids,
          sessionDate,
          shuttlecocksUsed,
          membershipData
        );

        // Create payment records in database
        const paymentRecords = sessionPayments.map(sp => ({
          member_id: sp.memberId,
          amount: sp.totalFee,
          type: 'daily' as const,
          status: 'pending' as const,
          due_date: sp.sessionDate,
          shuttlecock_fee: sp.shuttlecockFee,
          attendance_fee: sp.sessionFee,
          notes: `Saturday session - ${sessionDate.toLocaleDateString('id-ID')}. ` +
                `${sp.hasMembership ? 'Membership active' : 'No membership (Rp18,000 + shuttlecock)'}`
        }));

        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .insert(paymentRecords)
          .select();

        if (paymentsError) {
          throw new Error(`Failed to create payment records: ${paymentsError.message}`);
        }

        // Generate payment summary
        const paymentSummary = MembershipCalculationService.generatePaymentSummary(
          sessionPayments,
          sessionDate
        );

        return NextResponse.json({
          success: true,
          data: {
            sessionPayments,
            payments,
            paymentSummary,
            totalRevenue: sessionPayments.reduce((sum, sp) => sum + sp.totalFee, 0)
          }
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Membership API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}