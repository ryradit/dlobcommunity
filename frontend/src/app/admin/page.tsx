'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Trophy, 
  TrendingUp, 
  Clock,
  AlertCircle,
  CheckCircle,
  Settings,
  BarChart3
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import { useLanguage, LanguageSwitcher } from '@/hooks/useLanguage';

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  todayAttendance: number;
  pendingPayments: number;
  totalRevenue: number;
  upcomingMatches: number;
  attendanceLabel: string; // "Today's" or "Recent Saturday"
  weeklyAttendance: number;
}

export default function AdminDashboard() {
  const { language } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    todayAttendance: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    upcomingMatches: 0,
    attendanceLabel: "Today's",
    weeklyAttendance: 0
  });

  const translations = {
    en: {
      title: 'Admin Dashboard',
      subtitle: 'Welcome to DLOB administration panel',
      totalMembers: 'Total Members',
      activeThisMonth: 'active this month',
      todayAttendance: "Today's Attendance",
      recentAttendance: "Recent Saturday Attendance",
      ofTotalMembers: 'of total members',
      pendingPayments: 'Pending Payments',
      totalAmount: 'total amount',
      totalRevenue: 'Total Revenue',
      thisMonth: 'this month',
      upcomingMatches: 'Upcoming Matches',
      scheduledMatches: 'scheduled matches',
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      manageMembers: 'Manage Members',
      manageAttendance: 'Manage Attendance',
      managePayments: 'Manage Payments',
      manageMatches: 'Manage Matches',
      viewReports: 'View Reports',
      settings: 'Settings',
      nextSaturday: 'Next Saturday session',
      daysAway: 'days away',
      completedPayment: 'completed payment',
      monthlyMembership: 'Monthly Membership',
      sessionFee: 'Session Fee',
      matchFee: 'Match Fee',
      penaltyFee: 'Penalty Fee',
      tournamentEntry: 'Tournament Entry',
      payment: 'Payment',
      matchCompleted: 'Match completed at',
      field: 'Field',
      membersHavePending: 'members have pending payments totaling',
      now: 'Now',
      secondsAgo: 'seconds ago',
      minutesAgo: 'minutes ago',
      hoursAgo: 'hours ago',
      daysAgoText: 'days ago'
    },
    id: {
      title: 'Dashboard Admin',
      subtitle: 'Selamat datang di panel administrasi DLOB',
      totalMembers: 'Total Anggota',
      activeThisMonth: 'aktif bulan ini',
      todayAttendance: 'Kehadiran Hari Ini',
      recentAttendance: 'Kehadiran Sabtu Terakhir',
      ofTotalMembers: 'dari total anggota',
      pendingPayments: 'Pembayaran Tertunda',
      totalAmount: 'total jumlah',
      totalRevenue: 'Total Pendapatan',
      thisMonth: 'bulan ini',
      upcomingMatches: 'Pertandingan Mendatang',
      scheduledMatches: 'pertandingan terjadwal',
      recentActivity: 'Aktivitas Terbaru',
      quickActions: 'Aksi Cepat',
      manageMembers: 'Kelola Anggota',
      manageAttendance: 'Kelola Kehadiran',
      managePayments: 'Kelola Pembayaran',
      manageMatches: 'Kelola Pertandingan',
      viewReports: 'Lihat Laporan',
      settings: 'Pengaturan',
      nextSaturday: 'Sesi Sabtu berikutnya',
      daysAway: 'hari lagi',
      completedPayment: 'menyelesaikan pembayaran',
      monthlyMembership: 'Keanggotaan Bulanan',
      sessionFee: 'Biaya Sesi',
      matchFee: 'Biaya Pertandingan',
      penaltyFee: 'Biaya Denda',
      tournamentEntry: 'Pendaftaran Turnamen',
      payment: 'Pembayaran',
      matchCompleted: 'Pertandingan selesai pada',
      field: 'Lapangan',
      membersHavePending: 'anggota memiliki pembayaran tertunda sebesar',
      now: 'Sekarang',
      secondsAgo: 'detik lalu',
      minutesAgo: 'menit lalu',
      hoursAgo: 'jam lalu',
      daysAgoText: 'hari lalu'
    }
  };

  const t = translations[language as keyof typeof translations];

  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    type: 'attendance' | 'payment' | 'match';
    message: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
  }>>([]);

  useEffect(() => {
    // Load real dashboard data from API
    const loadDashboardData = async () => {
      try {
        console.log('🔄 Loading real admin dashboard data...');

        // Fetch all members from Supabase
        const { data: allMembers } = await supabase
          .from('members')
          .select('*');
        
        console.log('👥 Members loaded:', allMembers?.length || 0);

        // Fetch attendance data using Supabase (same as attendance management page)
        const today = new Date().toISOString().split('T')[0];
        let todayAttendance = 0;
        let attendanceLabel = "Today's";
        let weeklyAttendance = 0;
        
        console.log('📊 Loading attendance data for admin dashboard...');

        // Try to get today's attendance from Supabase
        const { data: todayAttendanceData } = await supabase
          .from('attendance')
          .select('*')
          .eq('date', today);
        
        todayAttendance = todayAttendanceData?.filter(record => record.status === 'present').length || 0;
        console.log(`📅 Today (${today}) attendance:`, todayAttendance);
        
        // If no attendance today, get the most recent Saturday attendance (like attendance page does)
        if (todayAttendance === 0) {
          const mostRecentSaturday = getMostRecentSaturday();
          const saturdayDateStr = mostRecentSaturday.toISOString().split('T')[0];
          
          // Use the same logic as attendance management page
          const { data: saturdayMembers } = await supabase
            .from('members')
            .select('*');
            
          const { data: saturdayMatches } = await supabase
            .from('matches')
            .select('*, match_participants(*)')
            .eq('date', saturdayDateStr);
            
          const { data: existingSaturdayAttendance } = await supabase
            .from('attendance')
            .select('*')
            .eq('date', saturdayDateStr);
          
          if (saturdayMembers && saturdayMatches) {
            // Generate attendance records like the attendance page does
            const attendanceRecords = [];
            const todayMatches = saturdayMatches || [];
            
            for (const member of saturdayMembers) {
              let attendanceRecord = existingSaturdayAttendance?.find(att => att.member_id === member.id);
              
              if (!attendanceRecord) {
                // Check if member participated in any matches
                const participatedInMatch = todayMatches.some((match: any) => 
                  match.match_participants?.some((p: any) => p.member_id === member.id)
                );
                
                if (participatedInMatch) {
                  attendanceRecord = {
                    member_id: member.id,
                    status: 'present',
                    check_in_method: 'match'
                  };
                } else {
                  attendanceRecord = {
                    member_id: member.id,
                    status: 'absent'
                  };
                }
              }
              
              attendanceRecords.push(attendanceRecord);
            }
            
            todayAttendance = attendanceRecords.filter(r => r.status === 'present').length;
            attendanceLabel = "Recent Saturday";
            console.log(`📅 Using Saturday (${saturdayDateStr}) attendance:`, todayAttendance);
          }
        }

        // Calculate weekly attendance (count of recent Saturday sessions)
        weeklyAttendance = todayAttendance; // For now, use Saturday attendance as weekly indicator

        // Fetch pending payments
        const paymentsResponse = await fetch('/api/payments');
        const paymentsData = await paymentsResponse.json();
        
        // Handle the new API structure: { success: true, data: { payments: [...], stats: {...} } }
        let allPayments = [];
        if (paymentsData.success && paymentsData.data) {
          // Check if data has payments property (new structure) or is direct array (old structure)
          allPayments = paymentsData.data.payments || paymentsData.data;
          // Ensure it's an array
          allPayments = Array.isArray(allPayments) ? allPayments : [];
        }
        
        const pendingPayments = allPayments.filter((p: any) => p.status === 'pending');

        // Fetch recent matches for revenue calculation
        const matchesResponse = await fetch(`/api/matches?date=${today}`);
        const matchesData = await matchesResponse.json();
        const recentMatches = matchesData.success ? matchesData.data?.matches || [] : [];
        
        // Calculate total revenue from payments
        const totalRevenue = allPayments
          .filter((p: any) => p.status === 'paid')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        // Get upcoming Saturday sessions (next 3 Saturdays)
        const upcomingMatches = getUpcomingSaturdays().length;

        console.log('📊 Dashboard Stats:', {
          totalMembers: allMembers?.length || 0,
          activeMembers: allMembers?.filter((m: any) => m.is_active !== false).length || 0,
          todayAttendance,
          attendanceLabel,
          pendingPayments: pendingPayments.length,
          totalRevenue,
          upcomingMatches,
          weeklyAttendance
        });

        setStats({
          totalMembers: allMembers?.length || 0,
          activeMembers: allMembers?.filter((m: any) => m.is_active !== false).length || 0,
          todayAttendance,
          pendingPayments: pendingPayments.length,
          totalRevenue,
          upcomingMatches,
          attendanceLabel,
          weeklyAttendance
        });

        // Generate recent activities from real data
        const activities = [];

        // Recent payments
        const recentPaidPayments = allPayments
          .filter((p: any) => p.status === 'paid' && p.paid_date)
          .sort((a: any, b: any) => new Date(b.paid_date).getTime() - new Date(a.paid_date).getTime())
          .slice(0, 2);

        recentPaidPayments.forEach((payment: any) => {
          activities.push({
            id: `payment-${payment.id}`,
            type: 'payment' as const,
            message: `${payment.member?.name || 'Member'} ${t.completedPayment}: ${formatPaymentType(payment.type)} - ${formatCurrency(payment.amount)}`,
            timestamp: formatTimeAgo(payment.paid_date),
            status: 'success' as const
          });
        });

        // Recent matches
        recentMatches.slice(0, 2).forEach((match: any) => {
          activities.push({
            id: `match-${match.id}`,
            type: 'match' as const,
            message: `${t.matchCompleted} ${match.time} - ${t.field} ${match.court_number || match.field_number || 1}`,
            timestamp: formatTimeAgo(match.created_at),
            status: 'success' as const
          });
        });

        // Pending payment warnings
        if (pendingPayments.length > 0) {
          activities.push({
            id: 'pending-payments',
            type: 'payment' as const,
            message: `${pendingPayments.length} ${t.membersHavePending} ${formatCurrency(pendingPayments.reduce((sum: number, p: any) => sum + p.amount, 0))}`,
            timestamp: t.now,
            status: 'warning' as const
          });
        }

        // Add Saturday session reminder
        const nextSaturday = getNextSaturday();
        activities.push({
          id: 'next-session',
          type: 'attendance' as const,
          message: `${t.nextSaturday}: ${nextSaturday.toLocaleDateString('id-ID')} at 8:00 PM`,
          timestamp: `${Math.ceil((nextSaturday.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} ${t.daysAway}`,
          status: 'success' as const
        });

        setRecentActivities(activities.slice(0, 6));

      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        // Fallback to basic stats if API fails
        setStats({
          totalMembers: 0,
          activeMembers: 0,
          todayAttendance: 0,
          pendingPayments: 0,
          totalRevenue: 0,
          upcomingMatches: 0,
          attendanceLabel: "Today's",
          weeklyAttendance: 0
        });
      }
    };

    loadDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPaymentType = (type: string) => {
    switch (type) {
      case 'monthly': return t.monthlyMembership;
      case 'daily': return t.sessionFee;
      case 'match': return t.matchFee;
      case 'penalty': return t.penaltyFee;
      case 'tournament': return t.tournamentEntry;
      default: return t.payment;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} ${t.secondsAgo}`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} ${t.minutesAgo}`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ${t.hoursAgo}`;
    return `${Math.floor(diffInSeconds / 86400)} ${t.daysAgoText}`;
  };

  const getMostRecentSaturday = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    if (currentDay === 6) {
      // Today is Saturday
      return today;
    } else {
      // Get last Saturday
      const daysToSubtract = currentDay === 0 ? 1 : currentDay + 1; // If Sunday, subtract 1 day; otherwise currentDay + 1
      const lastSaturday = new Date(today);
      lastSaturday.setDate(today.getDate() - daysToSubtract);
      return lastSaturday;
    }
  };

  const getNextSaturday = () => {
    const today = new Date();
    const daysUntilSaturday = (6 - today.getDay()) % 7;
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));
    nextSaturday.setHours(20, 0, 0, 0); // 8 PM
    return nextSaturday;
  };

  const getUpcomingSaturdays = () => {
    const saturdays = [];
    let current = getNextSaturday();
    
    for (let i = 0; i < 4; i++) { // Next 4 Saturdays
      saturdays.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    
    return saturdays;
  };

  const getActivityIcon = (type: string, status: string) => {
    switch (type) {
      case 'attendance':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'payment':
        return status === 'success' ? 
          <CheckCircle className="h-5 w-5 text-green-500" /> :
          <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'match':
        return <Trophy className="h-5 w-5 text-purple-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-700" />;
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        <Navigation variant="admin" />
        
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t.title}
              </h1>
              <p className="text-gray-600">
                {t.subtitle}
              </p>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-800">{t.totalMembers}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
                <p className="text-xs text-gray-700 mt-1">
                  {stats.activeMembers} {t.activeThisMonth}
                </p>
              </div>
            </div>
          </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-green-100 p-3">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-800">
                    {stats.attendanceLabel === "Today's" ? t.todayAttendance : t.recentAttendance}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{stats.todayAttendance}</p>
                  <p className="text-xs text-gray-700">
                    {stats.totalMembers > 0 
                      ? Math.round((stats.todayAttendance / stats.totalMembers) * 100) 
                      : 0}% {t.ofTotalMembers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-yellow-100 p-3">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-800">{t.pendingPayments}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
                  <p className="text-xs text-yellow-600">
                    {language === 'en' ? 'Need follow-up' : 'Perlu ditindaklanjuti'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-purple-100 p-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-800">
                    {language === 'en' ? 'Monthly Revenue' : 'Pendapatan Bulanan'}
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                  <p className="text-xs text-green-600">
                    {language === 'en' ? '+12% from last month' : '+12% dari bulan lalu'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-indigo-100 p-3">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-800">
                    {language === 'en' ? 'Weekly Activity' : 'Aktivitas Mingguan'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{stats.weeklyAttendance}</p>
                  <p className="text-xs text-gray-700">
                    {language === 'en' ? 'Last 7 days attendance' : 'Kehadiran 7 hari terakhir'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Link
            href="/admin/attendance"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {language === 'en' ? 'Attendance Management' : 'Manajemen Kehadiran'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {language === 'en' ? 'Track member attendance and mark check-ins' : 'Lacak kehadiran anggota dan tandai check-in'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-blue-600">{stats.todayAttendance}</div>
              <div className="text-sm text-gray-800">
                {stats.attendanceLabel.toLowerCase()} present ({stats.totalMembers > 0 
                  ? Math.round((stats.todayAttendance / stats.totalMembers) * 100) 
                  : 0}% of total)
              </div>
            </div>
          </Link>

            <Link
              href="/admin/payments"
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Payment Management</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Add payment requirements and track payments
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-red-600">{stats.pendingPayments}</div>
              <div className="text-sm text-gray-800">Pending payments</div>
            </div>
          </Link>

            <Link
              href="/admin/matches"
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Match Management</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Schedule matches and input results
                </p>
              </div>
              <Trophy className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-purple-600">{stats.upcomingMatches}</div>
              <div className="text-sm text-gray-800">Upcoming matches</div>
            </div>
            </Link>
          </div>

          {/* Recent Activities & Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="shrink-0">
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-700 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link
                href="/admin/activities"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View all activities →
              </Link>
            </div>
            </div>

            {/* Quick Analytics */}
            <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Analytics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-800">{stats.attendanceLabel} Attendance Rate</span>
                <span className="text-sm font-semibold text-green-600">
                  {stats.totalMembers > 0 
                    ? Math.round((stats.todayAttendance / stats.totalMembers) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${stats.totalMembers > 0 
                      ? Math.round((stats.todayAttendance / stats.totalMembers) * 100) 
                      : 0}%` 
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-800">Payment Collection Rate</span>
                <span className="text-sm font-semibold text-blue-600">
                  {stats.totalMembers > 0 
                    ? Math.round(((stats.totalMembers - stats.pendingPayments) / stats.totalMembers) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ 
                    width: `${stats.totalMembers > 0 
                      ? Math.round(((stats.totalMembers - stats.pendingPayments) / stats.totalMembers) * 100) 
                      : 0}%` 
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-800">Active Members</span>
                <span className="text-sm font-semibold text-purple-600">
                  {stats.totalMembers > 0 
                    ? Math.round((stats.activeMembers / stats.totalMembers) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ 
                    width: `${stats.totalMembers > 0 
                      ? Math.round((stats.activeMembers / stats.totalMembers) * 100) 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link
                href="/admin/analytics"
                className="flex items-center text-sm text-blue-600 hover:text-blue-500"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                View detailed analytics →
              </Link>
            </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}