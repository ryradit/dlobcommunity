import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import type { Attendance, ApiResponse } from '../types';

const router = Router();

// Get attendance records
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { date, member_id } = req.query;
    
    let query = supabase
      .from('attendance')
      .select(`
        *,
        member:members(id, name, email)
      `)
      .order('date', { ascending: false });

    if (date) {
      query = query.eq('date', date);
    }
    
    if (member_id) {
      query = query.eq('member_id', member_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    const response: ApiResponse<Attendance[]> = {
      success: true,
      data: data as Attendance[]
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance records'
    });
  }
});

// Check in attendance
router.post('/checkin', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { method = 'manual', location } = req.body;
    const member_id = req.user!.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already checked in today
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('id')
      .eq('member_id', member_id)
      .eq('date', today)
      .single();

    if (existingAttendance) {
      res.status(400).json({
        success: false,
        error: 'Already checked in today'
      });
      return;
    }

    // Create attendance record
    const attendanceData = {
      member_id,
      date: today,
      check_in_time: new Date().toISOString(),
      check_in_method: method,
      ...(location && { location })
    };

    const { data, error } = await supabase
      .from('attendance')
      .insert(attendanceData)
      .select()
      .single();

    if (error) throw error;

    const response: ApiResponse<Attendance> = {
      success: true,
      data: data as Attendance,
      message: 'Successfully checked in!'
    };

    res.json(response);
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check in'
    });
  }
});

// Get attendance statistics
router.get('/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { member_id, start_date, end_date } = req.query;
    
    let query = supabase
      .from('attendance')
      .select('date, member_id');

    if (member_id) {
      query = query.eq('member_id', member_id);
    }

    if (start_date) {
      query = query.gte('date', start_date);
    }

    if (end_date) {
      query = query.lte('date', end_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate statistics
    const totalDays = data?.length || 0;
    const uniqueMembers = new Set(data?.map(a => a.member_id)).size;
    const avgAttendancePerDay = totalDays > 0 ? totalDays / uniqueMembers : 0;

    const stats = {
      total_attendances: totalDays,
      unique_members: uniqueMembers,
      average_attendance_per_member: avgAttendancePerDay,
      period: {
        start_date: start_date || 'all time',
        end_date: end_date || 'present'
      }
    };

    const response: ApiResponse = {
      success: true,
      data: stats
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance statistics'
    });
  }
});

export default router;