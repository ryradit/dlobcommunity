import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import type { Payment } from '@/types';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching all payment records...');

    const { searchParams } = new URL(request.url);
    const member_id = searchParams.get('member_id');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    
    // Fetch from session_payments table (new payment system)
    let sessionQuery = supabase
      .from('session_payments')
      .select(`
        *,
        member:member_id(id, name, email, phone),
        match:match_id(id, date, time, court_number, field_number, type)
      `)
      .order('created_at', { ascending: false });

    // Also fetch from old payments table for backward compatibility
    let paymentsQuery = supabase
      .from('payments')
      .select(`
        *,
        member:member_id(id, name, email)
      `)
      .order('created_at', { ascending: false });

    // Apply filters to both queries
    if (member_id) {
      sessionQuery = sessionQuery.eq('member_id', member_id);
      paymentsQuery = paymentsQuery.eq('member_id', member_id);
    }
    
    if (status && status !== 'all') {
      sessionQuery = sessionQuery.eq('status', status);
      paymentsQuery = paymentsQuery.eq('status', status);
    }

    if (type) {
      sessionQuery = sessionQuery.eq('type', type);
      paymentsQuery = paymentsQuery.eq('type', type);
    }

    // Execute both queries
    const [sessionResult, paymentsResult] = await Promise.all([
      sessionQuery,
      paymentsQuery
    ]);

    if (sessionResult.error) {
      console.error('❌ Session payments error:', sessionResult.error);
    }
    
    if (paymentsResult.error) {
      console.error('❌ Old payments error:', paymentsResult.error);
    }

    // Combine results, prioritizing session_payments
    const sessionPayments = sessionResult.data || [];
    const oldPayments = paymentsResult.data || [];
    
    // Transform old payments to match new format
    const transformedOldPayments = oldPayments.map(payment => ({
      ...payment,
      // Add match info if available
      match: payment.match_id ? { id: payment.match_id, date: null, time: null, court_number: null, field_number: null, type: null } : null
    }));

    const allPayments = [...sessionPayments, ...transformedOldPayments];
    
    console.log(`✅ Fetched ${allPayments.length} payment records (${sessionPayments.length} session + ${oldPayments.length} legacy)`);

    // Calculate stats
    const stats = {
      total: allPayments.length,
      pending: allPayments.filter(p => p.status === 'pending').length,
      paid: allPayments.filter(p => p.status === 'paid').length,
      partial: allPayments.filter(p => p.status === 'partial').length,
      overdue: allPayments.filter(p => {
        if (p.status !== 'pending') return false;
        const matchDate = new Date(p.match?.date || p.created_at);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff > 7; // Overdue if more than 7 days after match
      }).length,
      totalAmount: allPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      totalPaid: allPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.paid_amount || p.amount || 0), 0),
      totalPending: allPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0)
    };

    return createSuccessResponse({ payments: allPayments, stats });
  } catch (error: any) {
    console.error('❌ Error fetching payments:', error);
    return createErrorResponse('Failed to fetch payments', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Re-enable authentication after debugging
    // const user = await authenticateRequest(request);
    // if (!user) {
    //   return createErrorResponse('Authentication required', 401);
    // }
    console.log('🔄 POST /api/payments - Processing payment creation...');

    const requestBody = await request.json();
    console.log('📋 Request body:', requestBody);
    
    const { member_id, amount, type, due_date, notes, match_id } = requestBody;

    const paymentData = {
      member_id,
      amount: parseFloat(amount),
      type,
      status: 'pending' as const,
      due_date,
      notes,
      match_id: match_id || null
    };

    console.log('💾 About to insert payment data:', paymentData);

    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      throw error;
    }

    console.log('✅ Payment created successfully:', data);

    return createSuccessResponse(data as Payment, 'Payment created successfully');
  } catch (error: any) {
    console.error('❌ Error creating payment:', error);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error code:', error?.code);
    console.error('❌ Error details:', error?.details);
    return createErrorResponse(`Failed to create payment: ${error?.message || 'Unknown error'}`, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // TODO: Re-enable authentication after debugging
    // const user = await authenticateRequest(request);
    // if (!user) {
    //   return createErrorResponse('Authentication required', 401);
    // }
    console.log('🔄 PUT /api/payments - Processing payment update...');

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');
    
    if (!paymentId) {
      return createErrorResponse('Payment ID is required', 400);
    }

    const updateData = await request.json();
    
    // Remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const { data, error } = await supabase
      .from('payments')
      .update({
        ...cleanUpdateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Payment updated successfully');
  } catch (error) {
    console.error('Error updating payment:', error);
    return createErrorResponse('Failed to update payment', 500);
  }
}