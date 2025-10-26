'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Plus,
  MapPin,
  QrCode,
  UserCheck,
  Trophy
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  membershipType: 'regular' | 'premium';
  joinDate: string;
  totalSessions: number;
  attendanceRate: number;
  matchParticipation: number;
}

interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  sessionDate: string;
  checkInTime?: string;
  checkInMethod?: 'manual' | 'qr' | 'gps' | 'match';
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  isFromMatch?: boolean;
}

interface SessionStats {
  totalMembers: number;
  presentMembers: number;
  absentMembers: number;
  lateMembers: number;
  attendanceRate: number;
}

export default function AdminAttendancePage() {
  const [selectedDate, setSelectedDate] = useState('2025-10-24'); // Start with match date for testing
  const [members, setMembers] = useState<Member[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalMembers: 0,
    presentMembers: 0,
    absentMembers: 0,
    lateMembers: 0,
    attendanceRate: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'excused'>('all');
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Debug logging
  console.log('🎯 Admin Component Render - Records:', attendanceRecords?.length || 0);
  
  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  const loadAttendanceData = async (date: string = selectedDate) => {
    try {
      console.log('🔄 Loading real attendance data for:', date);

      // 1. Get all members from Supabase
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*');

      if (membersError) {
        console.error('❌ Error loading members:', membersError);
        return;
      }

      // 2. Get all matches to calculate match participation
      const { data: allMatches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          date,
          match_participants (
            member_id,
            team,
            members (
              id,
              name,
              email
            )
          )
        `);

      if (matchesError) {
        console.error('❌ Error loading matches:', matchesError);
        return;
      }

      // 3. Get manual attendance records for the selected date
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', date);

      if (attendanceError) {
        console.error('❌ Error loading attendance:', attendanceError);
      }

      const manualAttendance = attendanceData || [];

      // 4. Calculate member stats with match participation
      const processedMembers: Member[] = (membersData || []).map((member: any) => {
        // Count matches this member participated in
        const memberMatches = (allMatches || []).filter((match: any) => 
          match.match_participants?.some((p: any) => p.member_id === member.id)
        );

        // Count total sessions (unique match dates + manual attendance days)
        const matchDates = [...new Set(memberMatches.map((match: any) => match.date))];
        const manualAttendanceDates = [...new Set(manualAttendance
          .filter((att: any) => att.member_id === member.id && att.status === 'present')
          .map((att: any) => att.date))];
        
        const allAttendanceDates = [...new Set([...matchDates, ...manualAttendanceDates])];
        
        // Fair calculation: current month only (same as member dashboard)
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Get current month Saturdays
        const currentMonthSaturdays: string[] = [];
        const current = new Date(currentMonthStart);
        
        while (current.getDay() !== 6) { // 6 = Saturday
          current.setDate(current.getDate() + 1);
        }
        
        while (current.getMonth() === now.getMonth() && current <= now) {
          currentMonthSaturdays.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 7);
        }

        const hasParticipation = allAttendanceDates.length > 0;
        const totalSessionDays = Math.max(1, hasParticipation ? 1 : currentMonthSaturdays.length);
        const attendedSessions = hasParticipation ? 1 : 0;
        const attendanceRate = totalSessionDays > 0 ? (attendedSessions / totalSessionDays) * 100 : 0;

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          membershipType: member.membership_type || 'regular',
          joinDate: member.created_at?.split('T')[0] || '2025-01-01',
          totalSessions: allAttendanceDates.length,
          attendanceRate: Math.round(attendanceRate),
          matchParticipation: matchDates.length
        };
      });

      setMembers(processedMembers);

      // 5. Generate attendance records for selected date
      const dateAttendanceRecords: AttendanceRecord[] = [];

      // Get matches on selected date
      const todayMatches = (allMatches || []).filter((match: any) => match.date === date);
      const todayMatchParticipants = new Set<string>();

      console.log('📅 Processing attendance for date:', date);
      console.log('🎾 Matches found for date:', todayMatches.length);

      todayMatches.forEach((match: any) => {
        console.log(`🎾 Processing match ${match.id}:`);
        match.match_participants?.forEach((participant: any) => {
          todayMatchParticipants.add(participant.member_id);
          console.log(`   📊 Participant: ${participant.members?.name || 'Unknown'} (${participant.member_id})`);
        });
      });

      // Add match participants as present with unique records per match participation
      let recordIndex = 0;
      todayMatches.forEach((match: any) => {
        match.match_participants?.forEach((participant: any) => {
          const member = participant.members || processedMembers.find(m => m.id === participant.member_id);
          if (member) {
            recordIndex++;
            dateAttendanceRecords.push({
              id: `match-${match.id}-${participant.member_id}-${recordIndex}`,
              memberId: member.id,
              memberName: member.name,
              sessionDate: date,
              checkInTime: 'Match participation',
              checkInMethod: 'match',
              status: 'present',
              notes: `Automatically marked present through match participation (Team: ${participant.team})`,
              isFromMatch: true
            });
          }
        });
      });

      // Add manual attendance records
      manualAttendance.forEach((attendance: any) => {
        const member = processedMembers.find(m => m.id === attendance.member_id);
        if (member && !todayMatchParticipants.has(member.id)) {
          dateAttendanceRecords.push({
            id: attendance.id,
            memberId: member.id,
            memberName: member.name,
            sessionDate: date,
            checkInTime: attendance.check_in_time || undefined,
            checkInMethod: attendance.check_in_method || 'manual',
            status: attendance.status,
            notes: attendance.notes,
            isFromMatch: false
          });
        }
      });

      console.log('📊 Final attendance records generated:', dateAttendanceRecords.length);
      console.log('📊 Records preview:', dateAttendanceRecords.slice(0, 3));
      
      setAttendanceRecords(dateAttendanceRecords);

      // 6. Calculate session stats
      const totalMembers = processedMembers.length;
      const presentMembers = dateAttendanceRecords.filter(a => a.status === 'present').length;
      const absentMembers = totalMembers - presentMembers;
      const lateMembers = dateAttendanceRecords.filter(a => a.status === 'late').length;
      const attendanceRate = totalMembers > 0 ? Math.round(((presentMembers + lateMembers) / totalMembers) * 100) : 0;

      setSessionStats({
        totalMembers,
        presentMembers,
        absentMembers,
        lateMembers,
        attendanceRate
      });

      console.log('✅ Attendance data loaded:', {
        totalMembers,
        presentMembers,
        matchParticipants: todayMatchParticipants.size,
        manualAttendance: manualAttendance.length,
        attendanceRate: attendanceRate + '%'
      });

    } catch (error) {
      console.error('❌ Error loading attendance data:', error);
    }
  };

  const handleMarkAttendance = (member: Member, status: 'present' | 'absent' | 'late' | 'excused', notes?: string) => {
    const existingRecord = attendanceRecords.find(r => r.memberId === member.id);
    
    if (existingRecord) {
      // Update existing record
      const updatedRecords = attendanceRecords.map(record =>
        record.id === existingRecord.id
          ? {
              ...record,
              status,
              checkInTime: status === 'present' || status === 'late' ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : undefined,
              checkInMethod: 'manual' as const,
              notes
            }
          : record
      );
      setAttendanceRecords(updatedRecords);
    } else {
      // Create new record
      const newRecord: AttendanceRecord = {
        id: Date.now().toString(),
        memberId: member.id,
        memberName: member.name,
        sessionDate: selectedDate,
        checkInTime: status === 'present' || status === 'late' ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : undefined,
        checkInMethod: 'manual',
        status,
        notes
      };
      setAttendanceRecords([...attendanceRecords, newRecord]);
    }

    // Recalculate stats
    loadAttendanceData();
    setShowMarkAttendanceModal(false);
    setSelectedMember(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'excused':
        return <UserCheck className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'present':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'late':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'absent':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'excused':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getCheckInMethodIcon = (method?: string) => {
    switch (method) {
      case 'qr':
        return <QrCode className="h-4 w-4 text-blue-500" />;
      case 'gps':
        return <MapPin className="h-4 w-4 text-green-500" />;
      case 'manual':
        return <UserCheck className="h-4 w-4 text-purple-500" />;
      case 'match':
        return <Trophy className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.memberName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link
                href="/admin"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
                <p className="text-sm text-gray-600">Track and manage member attendance</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Automatic Attendance Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Automatic Attendance System</h3>
              <p className="text-sm text-blue-700 mt-1">
                Members are automatically marked present when they participate in matches. 
                Match participation counts as attendance for fair representation.
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Date Selector */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-3">
              <Calendar className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="font-semibold text-gray-900">Session Date</h3>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          {/* Stats Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{sessionStats.totalMembers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{sessionStats.presentMembers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-blue-600">{sessionStats.attendanceRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="all" className="text-gray-900">All Status</option>
                <option value="present" className="text-gray-900">Present</option>
                <option value="absent" className="text-gray-900">Absent</option>
                <option value="late" className="text-gray-900">Late</option>
                <option value="excused" className="text-gray-900">Excused</option>
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Attendance Records - {new Date(selectedDate).toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Check-in Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{record.memberName}</div>
                          {record.isFromMatch && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Trophy className="h-3 w-3 mr-1" />
                              Match
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {members.find(m => m.id === record.memberId)?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(record.status)}
                        <span className={`ml-2 ${getStatusBadge(record.status)}`}>
                          {record.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkInTime || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getCheckInMethodIcon(record.checkInMethod)}
                        <span className="ml-1 text-sm text-gray-600 capitalize">
                          {record.checkInMethod || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {record.isFromMatch ? (
                        <span className="text-gray-400 text-sm">Auto-generated</span>
                      ) : (
                        <button
                          onClick={() => {
                            const member = members.find(m => m.id === record.memberId);
                            if (member) {
                              setSelectedMember(member);
                              setShowMarkAttendanceModal(true);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add members who haven't been marked */}
        {members.filter(member => !attendanceRecords.some(record => record.memberId === member.id)).length > 0 && (
          <div className="bg-white rounded-lg shadow mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Members Not Yet Marked</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members
                  .filter(member => !attendanceRecords.some(record => record.memberId === member.id))
                  .map(member => (
                    <div key={member.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{member.name}</h4>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowMarkAttendanceModal(true);
                          }}
                          className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Mark
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mark Attendance Modal */}
      {showMarkAttendanceModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Mark Attendance - {selectedMember.name}
            </h3>
            <div className="space-y-3">
              {['present', 'late', 'absent', 'excused'].map(status => (
                <button
                  key={status}
                  onClick={() => handleMarkAttendance(selectedMember, status as any)}
                  className={`w-full flex items-center justify-center px-4 py-3 rounded-lg border-2 hover:bg-gray-50 ${
                    status === 'present' ? 'border-green-200 text-green-700' :
                    status === 'late' ? 'border-yellow-200 text-yellow-700' :
                    status === 'absent' ? 'border-red-200 text-red-700' :
                    'border-blue-200 text-blue-700'
                  }`}
                >
                  {getStatusIcon(status)}
                  <span className="ml-2 capitalize font-medium">{status}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowMarkAttendanceModal(false);
                  setSelectedMember(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}