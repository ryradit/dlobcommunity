import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, memberId } = await request.json();
    
    console.log('🔄 Starting membership to daily session conversion:', { paymentId, memberId });

    if (!paymentId || !memberId) {
      return NextResponse.json({
        success: false,
        error: 'Payment ID and Member ID are required'
      }, { status: 400 });
    }

    // 1. Get the current membership payment details
    const { data: membershipPayment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentError || !membershipPayment) {
      return NextResponse.json({
        success: false,
        error: 'Membership payment not found'
      }, { status: 404 });
    }

    // Verify this is a membership payment
    if (membershipPayment.type !== 'monthly' || membershipPayment.status !== 'pending') {
      return NextResponse.json({
        success: false,
        error: 'Payment is not a convertible membership payment'
      }, { status: 400 });
    }

    console.log('💰 Converting membership payment:', {
      id: membershipPayment.id,
      amount: membershipPayment.amount,
      type: membershipPayment.type
    });

    // 2. UPDATE the existing membership payment to become a session payment (in-place conversion)
    const sessionPaymentData = {
      amount: 18000, // Standard daily session fee
      type: 'daily',
      status: 'pending',
      due_date: membershipPayment.due_date, // Keep same due date so it stays in same session group
      notes: `📅 Daily Session Fee - Converted from monthly membership (was Rp${membershipPayment.amount.toLocaleString('id-ID')})`,
      updated_at: new Date().toISOString()
    };

    const { data: sessionPayment, error: sessionError } = await supabase
      .from('payments')
      .update(sessionPaymentData)
      .eq('id', paymentId)
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Error updating payment to session:', sessionError);
      return NextResponse.json({
        success: false,
        error: 'Failed to convert payment to daily session'
      }, { status: 500 });
    }

    console.log('✅ Membership payment converted to session in-place:', sessionPayment);

    // No need to delete - we updated the existing payment record in-place

    // 3. Remove any membership status records (optional - won't fail if table doesn't exist)
    try {
      const { error: statusError } = await supabase
        .from('member_memberships')
        .delete()
        .eq('member_id', memberId)
        .eq('payment_id', paymentId);
      
      if (statusError) {
        console.log('ℹ️ Membership status table not available, skipping status cleanup');
      }
    } catch (statusErr) {
      console.log('ℹ️ Membership status tracking not available');
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionPayment,
        originalMembershipAmount: membershipPayment.amount,
        newSessionFee: 18000,
        message: `Membership converted back to daily session fee. Member will pay session fees for future matches.`
      }
    });

  } catch (error: any) {
    console.error('❌ Membership to daily conversion error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}