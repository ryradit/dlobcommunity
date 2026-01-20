import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const member_id = searchParams.get('member_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    
    console.log('📊 Calculating attendance stats for member:', member_id);

    // If member_id is specified, calculate attendance rate for that specific member
    if (member_id) {
      // Get manual attendance records
      let attendanceQuery = supabase
        .from('attendance')
        .select('date')
        .eq('member_id', member_id);

      if (start_date) {
        attendanceQuery = attendanceQuery.gte('date', start_date);
      }

      if (end_date) {
        attendanceQuery = attendanceQuery.lte('date', end_date);
      }

      const { data: attendanceData, error: attendanceError } = await attendanceQuery;

      if (attendanceError) throw attendanceError;

      // Get match participation as attendance (matches where member played)
      let matchQuery = supabase
        .from('matches')
        .select('date')
        .eq('match_participants.member_id', member_id);

      if (start_date) {
        matchQuery = matchQuery.gte('date', start_date);
      }

      if (end_date) {
        matchQuery = matchQuery.lte('date', end_date);
      }

      const { data: matchData, error: matchError } = await matchQuery;

      if (matchError) {
        console.log('⚠️ Error fetching match data for attendance:', matchError.message);
      }

      // Get all session dates (Saturdays) in the time period
      const now = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      
      const actualStartDate = start_date ? new Date(start_date) : threeMonthsAgo;
      const actualEndDate = end_date ? new Date(end_date) : now;
      
      // Generate all Saturdays in the period (DLOB sessions are on Saturdays)
      const allSaturdays: string[] = [];
      const current = new Date(actualStartDate);
      
      // Find the first Saturday
      while (current.getDay() !== 6) { // 6 = Saturday
        current.setDate(current.getDate() + 1);
      }
      
      // Collect all Saturdays until end date
      while (current <= actualEndDate) {
        allSaturdays.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 7); // Next Saturday
      }

      console.log('📅 Total Saturdays (sessions) in period:', allSaturdays.length);

      // Combine attendance and match participation dates
      const attendedDates = new Set<string>();
      
      // Add manual attendance dates
      attendanceData?.forEach(record => {
        attendedDates.add(record.date);
      });

      // Add match participation dates
      matchData?.forEach(match => {
        attendedDates.add(match.date);
      });

      console.log('✅ Member attended on dates:', Array.from(attendedDates));
      console.log('📊 From attendance records:', attendanceData?.length || 0);
      console.log('🏸 From match participation:', matchData?.length || 0);

      // Calculate attendance rate
      const attendanceRate = allSaturdays.length > 0 ? 
        (Array.from(attendedDates).filter(date => allSaturdays.includes(date)).length / allSaturdays.length) * 100 : 0;

      const stats = {
        attendance_rate: Math.round(attendanceRate),
        total_sessions: allSaturdays.length,
        attended_sessions: Array.from(attendedDates).filter(date => allSaturdays.includes(date)).length,
        manual_attendance: attendanceData?.length || 0,
        match_participation: matchData?.length || 0,
        recent_attendance: attendanceData?.slice(-10) || [],
        period: {
          start_date: actualStartDate.toISOString().split('T')[0],
          end_date: actualEndDate.toISOString().split('T')[0]
        }
      };

      console.log('📊 Final attendance stats:', stats);
      return createSuccessResponse(stats);
    }

    // General stats (no specific member)
    let query = supabase
      .from('attendance')
      .select('date, member_id');

    if (start_date) {
      query = query.gte('date', start_date);
    }

    if (end_date) {
      query = query.lte('date', end_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate general statistics
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

    return createSuccessResponse(stats);
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    return createErrorResponse('Failed to fetch attendance statistics', 500);
  }
}