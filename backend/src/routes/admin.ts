import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authMiddleware, AuthRequest, adminOnly } from '../middleware/auth';
import type { ApiResponse } from '../types';

const router = Router();

// All routes require admin access
router.use(adminOnly);

// Dashboard analytics
router.get('/dashboard', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7);
    
    // Get attendance stats
    const { data: todayAttendance } = await supabase
      .from('attendance')
      .select('id')
      .eq('date', today);

    const { data: monthlyAttendance } = await supabase
      .from('attendance')
      .select('id')
      .gte('date', `${thisMonth}-01`);

    // Get payment stats
    const { data: pendingPayments } = await supabase
      .from('payments')
      .select('id, amount')
      .eq('status', 'pending');

    const { data: monthlyRevenue } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .gte('created_at', `${thisMonth}-01`);

    // Get member stats
    const { data: totalMembers } = await supabase
      .from('members')
      .select('id')
      .eq('is_active', true);

    const { data: recentMatches } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'completed')
      .gte('date', `${thisMonth}-01`);

    const stats = {
      attendance: {
        today: todayAttendance?.length || 0,
        thisMonth: monthlyAttendance?.length || 0
      },
      payments: {
        pending: pendingPayments?.length || 0,
        pendingAmount: pendingPayments?.reduce((sum, p) => sum + p.amount, 0) || 0,
        monthlyRevenue: monthlyRevenue?.reduce((sum, p) => sum + p.amount, 0) || 0
      },
      members: {
        active: totalMembers?.length || 0
      },
      matches: {
        thisMonth: recentMatches?.length || 0
      }
    };

    const response: ApiResponse = {
      success: true,
      data: stats
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

// Member management
router.get('/members', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        attendance_count:attendance(count),
        recent_payments:payments(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const response: ApiResponse = {
      success: true,
      data: data
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member data'
    });
  }
});

// Deactivate member
router.patch('/members/:id/deactivate', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('members')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const response: ApiResponse = {
      success: true,
      data: data,
      message: 'Member deactivated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deactivating member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate member'
    });
  }
});

// Financial reports
router.get('/financial-report', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('payments')
      .select(`
        *,
        member:members(name, email)
      `)
      .order('created_at', { ascending: false });

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate summary
    const summary = {
      total_payments: data?.length || 0,
      total_revenue: data?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) || 0,
      pending_amount: data?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0) || 0,
      overdue_amount: data?.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0) || 0,
      by_type: data?.reduce((acc: any, payment) => {
        acc[payment.type] = (acc[payment.type] || 0) + payment.amount;
        return acc;
      }, {}) || {}
    };

    const response: ApiResponse = {
      success: true,
      data: {
        summary,
        payments: data
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating financial report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate financial report'
    });
  }
});

export default router;