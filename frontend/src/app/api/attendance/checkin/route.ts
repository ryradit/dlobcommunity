import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import type { Attendance } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    const { method = 'manual', location } = await request.json();
    const member_id = user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already checked in today
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('id')
      .eq('member_id', member_id)
      .eq('date', today)
      .single();

    if (existingAttendance) {
      return createErrorResponse('Already checked in today', 400);
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

    return createSuccessResponse(data as Attendance, 'Successfully checked in!');
  } catch (error) {
    console.error('Error checking in:', error);
    return createErrorResponse('Failed to check in', 500);
  }
}