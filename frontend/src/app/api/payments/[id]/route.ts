import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    console.log('💳 Updating payment with ID:', id);
    
    // Validate UUID format
    if (!id || id === 'undefined' || id === 'null') {
      console.error('❌ Invalid payment ID:', id);
      return NextResponse.json(
        { success: false, error: `Invalid payment ID: ${id}` },
        { status: 400 }
      );
    }
    
    // Basic UUID format check
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error('❌ Invalid UUID format:', id);
      return NextResponse.json(
        { success: false, error: `Invalid UUID format: ${id}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('📋 Update request body:', body);
    const { status, paid_date, paid_amount, payment_method, notes } = body;

    // Validate the status
    if (!['pending', 'paid', 'partial'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment status' },
        { status: 400 }
      );
    }

    // Try to update in session_payments table first, then fallback to payments table
    let data, error;
    
    // First try session_payments table (if it exists)
    let sessionResult = null;
    try {
      sessionResult = await supabase
        .from('session_payments')
        .update({
          status,
          paid_date,
          paid_amount,
          payment_method,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .select('*, member:member_id(name, email)')
        .single();
    } catch (sessionError) {
      console.log('💡 session_payments table not available, using payments table');
      sessionResult = { error: { code: 'PGRST116' } };
    }

    if (sessionResult.error && sessionResult.error.code === 'PGRST116') {
      // Record not found in session_payments, try payments table
      console.log('💡 Trying payments table with basic schema...');
      
      // Only use fields that exist in the basic payments table schema
      const updateData: any = {
        status,
        notes,
        updated_at: new Date().toISOString()
      };
      
      // Add optional fields if they exist
      if (paid_date) updateData.paid_date = paid_date;
      if (payment_method) updateData.payment_method = payment_method;
      
      // Handle amount updates for membership conversions
      if (body.amount !== undefined) {
        updateData.amount = parseFloat(body.amount);
        console.log('💰 Updating amount to:', updateData.amount);
      }
      
      // Try with member relationship first, then fallback without it
      let paymentsResult = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', params.id)
        .select(`
          *,
          member:member_id(name, email)
        `)
        .single();
        
      // If member relationship fails, try without it
      if (paymentsResult.error && paymentsResult.error.message?.includes('member')) {
        console.log('💡 Member relationship failed, trying without it...');
        paymentsResult = await supabase
          .from('payments')
          .update(updateData)
          .eq('id', params.id)
          .select('*')
          .single();
      }
        
      data = paymentsResult.data;
      error = paymentsResult.error;
    } else {
      data = sessionResult.data;
      error = sessionResult.error;
    }

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Payment updated successfully:', data);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ Deleting payment:', params.id);

    // Delete payment from database
    const { error } = await supabase
      .from('session_payments')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Payment deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📊 Fetching payment details:', params.id);

    // Get payment details
    const { data, error } = await supabase
      .from('session_payments')
      .select(`
        *,
        member:member_id(name, email, phone),
        match:match_id(date, start_time)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Payment details fetched:', data);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}