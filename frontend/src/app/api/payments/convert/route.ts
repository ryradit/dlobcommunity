import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, payment_id, member_id, conversion_date } = body;

    if (action === 'convert_to_membership') {
      // Convert daily attendance payment to monthly membership
      
      // Get the daily payment to convert
      const { data: dailyPayment, error: dailyError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', payment_id)
        .eq('type', 'daily')
        .single();

      if (dailyError || !dailyPayment) {
        throw new Error('Daily payment not found');
      }

      // Calculate membership fee based on weeks in month
      const paymentDate = new Date(dailyPayment.due_date);
      const currentMonth = paymentDate.getMonth() + 1;
      const currentYear = paymentDate.getFullYear();
      
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const weeksInMonth = Math.ceil(daysInMonth / 7);
      const membershipFee = weeksInMonth === 4 ? 40000 : 45000;

      // Check if member already has membership payment for this month
      const { data: existingMembership, error: membershipCheckError } = await supabase
        .from('payments')
        .select('id')
        .eq('member_id', member_id)
        .eq('type', 'monthly')
        .gte('due_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('due_date', currentMonth === 12 ? `${currentYear + 1}-01-01` : `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`)
        .maybeSingle();

      if (membershipCheckError) {
        console.error('Error checking existing membership:', membershipCheckError);
      }

      if (existingMembership) {
        throw new Error('Member already has membership payment for this month');
      }

      // Create monthly membership payment
      const membershipPayment = {
        member_id: member_id,
        amount: membershipFee,
        type: 'monthly',
        status: 'pending',
        due_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`,
        notes: `💳 Monthly Membership Fee - ${currentYear}-${currentMonth.toString().padStart(2, '0')} (${weeksInMonth} weeks) - Converted from daily payment`
      };

      const { data: newMembership, error: createError } = await supabase
        .from('payments')
        .insert(membershipPayment)
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create membership payment: ${createError.message}`);
      }

      // Delete the daily payment
      const { error: deleteError } = await supabase
        .from('payments')
        .delete()
        .eq('id', payment_id);

      if (deleteError) {
        console.error('Failed to delete daily payment:', deleteError);
        // Don't fail the whole operation if deletion fails
      }

      return NextResponse.json({
        success: true,
        data: {
          membership_payment: newMembership,
          deleted_payment_id: payment_id,
          membership_fee: membershipFee,
          weeks_in_month: weeksInMonth
        },
        message: `Successfully converted to monthly membership (${weeksInMonth} weeks, Rp${membershipFee.toLocaleString('id-ID')})`
      });

    } else if (action === 'convert_to_daily') {
      // Convert monthly membership back to daily payments
      
      // Get the membership payment
      const { data: membershipPayment, error: membershipError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', payment_id)
        .eq('type', 'monthly')
        .single();

      if (membershipError || !membershipPayment) {
        throw new Error('Membership payment not found');
      }

      // Create daily payment for the conversion date
      const dailyPayment = {
        member_id: member_id,
        amount: 18000,
        type: 'daily',
        status: 'pending',
        due_date: conversion_date,
        notes: `📅 Daily Session Fee - Converted from monthly membership`
      };

      const { data: newDaily, error: createDailyError } = await supabase
        .from('payments')
        .insert(dailyPayment)
        .select()
        .single();

      if (createDailyError) {
        throw new Error(`Failed to create daily payment: ${createDailyError.message}`);
      }

      // Delete the membership payment
      const { error: deleteMembershipError } = await supabase
        .from('payments')
        .delete()
        .eq('id', payment_id);

      if (deleteMembershipError) {
        console.error('Failed to delete membership payment:', deleteMembershipError);
      }

      return NextResponse.json({
        success: true,
        data: {
          daily_payment: newDaily,
          deleted_membership_id: payment_id
        },
        message: 'Successfully converted to daily payment'
      });

    } else {
      throw new Error('Invalid action. Use convert_to_membership or convert_to_daily');
    }

  } catch (error: any) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const member_id = searchParams.get('member_id');
    const month = searchParams.get('month'); // YYYY-MM format
    
    if (!member_id || !month) {
      return NextResponse.json(
        { success: false, error: 'member_id and month (YYYY-MM) are required' },
        { status: 400 }
      );
    }

    const [year, monthNum] = month.split('-');
    
    // Check if member has membership for the specified month
    const { data: membershipPayment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', member_id)
      .eq('type', 'monthly')
      .gte('due_date', `${year}-${monthNum}-01`)
      .lt('due_date', monthNum === '12' ? `${parseInt(year) + 1}-01-01` : `${year}-${(parseInt(monthNum) + 1).toString().padStart(2, '0')}-01`)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        has_membership: !!membershipPayment,
        membership_payment: membershipPayment
      }
    });

  } catch (error: any) {
    console.error('Get membership status error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}