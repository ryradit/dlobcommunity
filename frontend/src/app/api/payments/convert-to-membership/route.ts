import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, memberId } = await request.json();
    
    console.log('🔄 Starting membership conversion:', { paymentId, memberId });

    if (!paymentId || !memberId) {
      return NextResponse.json({
        success: false,
        error: 'Payment ID and Member ID are required'
      }, { status: 400 });
    }

    // 1. Get the current session payment details
    const { data: sessionPayment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentError || !sessionPayment) {
      return NextResponse.json({
        success: false,
        error: 'Session payment not found'
      }, { status: 404 });
    }

    // Verify this is a convertible session payment
    if (sessionPayment.amount < 18000 || sessionPayment.status !== 'pending') {
      return NextResponse.json({
        success: false,
        error: 'Payment is not eligible for membership conversion'
      }, { status: 400 });
    }

    // 2. Calculate membership fee based on current month's Saturday count
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get first and last day of current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Count Saturdays in the current month
    let saturdayCount = 0;
    const tempDate = new Date(firstDay);
    while (tempDate <= lastDay) {
      if (tempDate.getDay() === 6) { // Saturday = 6
        saturdayCount++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    // Calculate membership fee: 4 weeks = Rp40,000, 5 weeks = Rp45,000
    const membershipFee = saturdayCount === 4 ? 40000 : 45000;
    const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    console.log('💰 Membership calculation:', {
      currentMonth: monthName,
      saturdayCount,
      membershipFee
    });

    // 3. UPDATE the existing session payment to become a membership payment (in-place conversion)
    const membershipPaymentData = {
      amount: membershipFee,
      type: 'monthly',
      status: 'pending',
      due_date: sessionPayment.due_date, // KEEP SAME DUE DATE so it stays in same session group
      notes: `💳 Monthly Membership - ${monthName} (${saturdayCount} weeks) - Converted from session payment`,
      updated_at: new Date().toISOString()
    };

    const { data: membershipPayment, error: membershipError } = await supabase
      .from('payments')
      .update(membershipPaymentData)
      .eq('id', paymentId)
      .select()
      .single();

    if (membershipError) {
      console.error('❌ Error updating payment to membership:', membershipError);
      return NextResponse.json({
        success: false,
        error: 'Failed to convert payment to membership'
      }, { status: 500 });
    }

    console.log('✅ Session payment converted to membership in-place:', membershipPayment);

    // No need to delete - we updated the existing payment record in-place

    // 4. Create membership status record for tracking
    const membershipStatusData = {
      member_id: memberId,
      membership_type: 'monthly',
      start_date: firstDay.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0],
      payment_id: membershipPayment.id,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Try to create membership status (optional - won't fail if table doesn't exist)
    try {
      const { error: statusError } = await supabase
        .from('member_memberships')
        .insert(membershipStatusData);
      
      if (statusError) {
        console.log('ℹ️ Membership status table not available, skipping status record');
      }
    } catch (statusErr) {
      console.log('ℹ️ Membership status tracking not available');
    }

    return NextResponse.json({
      success: true,
      data: {
        membershipPayment,
        originalSessionAmount: sessionPayment.amount,
        membershipFee,
        saturdayCount,
        monthName,
        message: `Session payment converted to monthly membership. Member will only pay shuttlecock fees for future matches this month.`
      }
    });

  } catch (error: any) {
    console.error('❌ Membership conversion error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}