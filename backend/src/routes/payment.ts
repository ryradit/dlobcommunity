import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import type { Payment, ApiResponse } from '../types';

const router = Router();

// Get payments
router.get('/', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { member_id, status, type } = req.query;
    
    let query = supabase
      .from('payments')
      .select(`
        *,
        member:members(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (member_id) {
      query = query.eq('member_id', member_id);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw error;

    const response: ApiResponse<Payment[]> = {
      success: true,
      data: data as Payment[]
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments'
    });
  }
});

// Create payment
router.post('/', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { member_id, amount, type, due_date, notes } = req.body;

    const paymentData = {
      member_id,
      amount: parseFloat(amount),
      type,
      status: 'pending' as const,
      due_date,
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) throw error;

    const response: ApiResponse<Payment> = {
      success: true,
      data: data as Payment,
      message: 'Payment created successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment'
    });
  }
});

// Mark payment as paid
router.patch('/:id/paid', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { payment_method, transaction_id } = req.body;

    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString(),
        payment_method,
        transaction_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const response: ApiResponse<Payment> = {
      success: true,
      data: data as Payment,
      message: 'Payment marked as paid'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment'
    });
  }
});

export default router;