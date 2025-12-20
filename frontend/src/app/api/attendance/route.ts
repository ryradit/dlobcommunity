import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import type { Attendance } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const member_id = searchParams.get('member_id');
    
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

    return createSuccessResponse(data as Attendance[]);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return createErrorResponse('Failed to fetch attendance records', 500);
  }
}

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