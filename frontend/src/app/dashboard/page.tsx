'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Trophy,
  Calendar,
  Bell,
  BarChart3,
  Target,
  Award,
  AlertCircle
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useLanguage, LanguageSwitcher } from '@/hooks/useLanguage';

interface MemberStats {
  attendanceRate: number;
  totalMatches: number;
  winRate: number;
  currentRanking: number;
  totalMembers: number;
  pendingPayments: number;
  nextSession: string;
}

interface PaymentDue {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'overdue';
}



export default function MemberDashboard() {
  const { language } = useLanguage();
  const [memberName, setMemberName] = useState('John Doe');
  const [stats, setStats] = useState<MemberStats>({
    attendanceRate: 0,
    totalMatches: 0,
    winRate: 0,
    currentRanking: 0,
    totalMembers: 0,
    pendingPayments: 0,
    nextSession: ''
  });

  const translations = {
    en: {
      title: 'Member Dashboard',
      subtitle: 'Welcome back to DLOB Community',
      attendanceRate: 'Attendance Rate',
      thisMonth: 'this month',
      totalMatches: 'Total Matches',
      matchesPlayed: 'matches played',
      winRate: 'Win Rate',
      winLossRatio: 'win/loss ratio',
      currentRanking: 'Current Ranking',
      outOf: 'out of',
      members: 'members',
      pendingPayments: 'Pending Payments',
      totalAmount: 'total amount',
      nextSession: 'Next Session',
      daysAway: 'days away',
      quickActions: 'Quick Actions',
      markAttendance: 'Mark Attendance',
      checkInSaturday: 'Check-in for Saturday sessions',
      viewMatches: 'View Matches',
      seeResults: 'See your match history and results',
      makePayment: 'Make Payment',
      payFees: 'Pay your membership fees',
      viewLeaderboard: 'View Leaderboard',
      checkRanking: 'Check your ranking and stats',
      recentActivity: 'Recent Activity',
      playedMatch: 'played a match',
      won: 'won',
      lost: 'lost',
      checkedIn: 'checked in for Saturday session',
      paidFee: 'paid membership fee',
      joinedTournament: 'joined tournament',
      achievedRank: 'achieved new rank',
      now: 'Now',
      minutesAgo: 'minutes ago',
      hoursAgo: 'hours ago',
      daysAgo: 'days ago',
      upcomingEvents: 'Upcoming Events',
      saturdaySession: 'Saturday Session',
      monthlyTournament: 'Monthly Tournament',
      specialEvent: 'Special Event'
    },
    id: {
      title: 'Dashboard Anggota',
      subtitle: 'Selamat datang kembali di Komunitas DLOB',
      attendanceRate: 'Tingkat Kehadiran',
      thisMonth: 'bulan ini',
      totalMatches: 'Total Pertandingan',
      matchesPlayed: 'pertandingan dimainkan',
      winRate: 'Tingkat Kemenangan',
      winLossRatio: 'rasio menang/kalah',
      currentRanking: 'Peringkat Saat Ini',
      outOf: 'dari',
      members: 'anggota',
      pendingPayments: 'Pembayaran Tertunda',
      totalAmount: 'total jumlah',
      nextSession: 'Sesi Berikutnya',
      daysAway: 'hari lagi',
      quickActions: 'Aksi Cepat',
      markAttendance: 'Tandai Kehadiran',
      checkInSaturday: 'Check-in untuk sesi Sabtu',
      viewMatches: 'Lihat Pertandingan',
      seeResults: 'Lihat riwayat dan hasil pertandingan Anda',
      makePayment: 'Lakukan Pembayaran',
      payFees: 'Bayar iuran keanggotaan Anda',
      viewLeaderboard: 'Lihat Papan Peringkat',
      checkRanking: 'Periksa peringkat dan statistik Anda',
      recentActivity: 'Aktivitas Terbaru',
      playedMatch: 'bermain pertandingan',
      won: 'menang',
      lost: 'kalah',
      checkedIn: 'check-in untuk sesi Sabtu',
      paidFee: 'membayar iuran keanggotaan',
      joinedTournament: 'bergabung turnamen',
      achievedRank: 'meraih peringkat baru',
      now: 'Sekarang',
      minutesAgo: 'menit lalu',
      hoursAgo: 'jam lalu',
      daysAgo: 'hari lalu',
      upcomingEvents: 'Acara Mendatang',
      saturdaySession: 'Sesi Sabtu',
      monthlyTournament: 'Turnamen Bulanan',
      specialEvent: 'Acara Khusus'
    }
  };

  const t = translations[language as keyof typeof translations];

  const [paymentsDue, setPaymentsDue] = useState<PaymentDue[]>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: 'match' | 'attendance' | 'payment';
    description: string;
    date: string;
    result?: 'win' | 'loss' | 'draw';
  }>>([]);

  useEffect(() => {
    // Load real member data from API
    const loadMemberData = async () => {
      try {
        console.log('🔄 Loading real member dashboard data...');

        // Get current user info with Google OAuth support
        let currentUser;
        let isAuthenticated = false;
        
        try {
          // Get Supabase session for Google OAuth users
          const { data: { session } } = await supabase.auth.getSession();
          console.log('📱 Dashboard Supabase session:', session ? 'Found' : 'Not found');
          
          if (session) {
            console.log('👤 Dashboard session user email:', session.user?.email);
          }

          // Prepare headers with session token if available
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
            console.log('🔑 Dashboard: Sending access token with request');
          }

          const userResponse = await fetch('/api/auth/me', {
            credentials: 'include',
            headers,
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.success && userData.user) {
              currentUser = userData.user;
              isAuthenticated = true;
              console.log('✅ Dashboard: Authenticated user:', currentUser.name, '(ID:', currentUser.id, ')');
              
              // Special debugging for Kevin
              if (currentUser.email === 'kevinharyono55@gmail.com' || currentUser.name.includes('Kevin')) {
                console.log('🎯 DASHBOARD - KEVIN DETECTED! Email:', currentUser.email, 'ID:', currentUser.id);
              }
            }
          }
        } catch (authError) {
          console.log('❌ Dashboard: Authentication failed, using demo mode');
        }
        
        // If no authenticated user, use demo mode
        if (!currentUser) {
          console.log('🎭 Dashboard: Using demo mode...');
          const membersResponse = await fetch('/api/members');
          const membersData = await membersResponse.json();
          
          if (membersData.success && membersData.data && membersData.data.length > 0) {
            const demoUser = membersData.data.find((m: any) => 
              m.name.toLowerCase().includes('ryan radityatama')
            ) || membersData.data[0];
            
            currentUser = {
              id: demoUser.id,
              name: demoUser.name,
              email: demoUser.email || 'demo@dlob.com',
              role: demoUser.role || 'member'
            };
            
            console.log('👤 Dashboard demo user:', currentUser.name);
          } else {
            // Final fallback
            currentUser = {
              id: 'demo-id',
              name: 'Demo User',
              email: 'demo@dlob.com',
              role: 'member'
            };
          }
        }
        setMemberName(currentUser.name || 'Member');

        // Get all members for ranking calculation
        const membersResponse = await fetch('/api/members');
        const membersData = await membersResponse.json();
        const allMembers = membersData.success ? membersData.data : [];

        // Get member's match history first
        const matchesResponse = await fetch('/api/matches?all=true');
        const matchesData = await matchesResponse.json();
        const allMatches = matchesData.success ? matchesData.data?.matches || [] : [];
        
        // Filter matches where current user participated
        const memberMatches = allMatches.filter((match: any) => 
          match.match_participants?.some((p: any) => p.member_id === currentUser.id)
        );

        // Get member's attendance history
        const attendanceResponse = await fetch(`/api/attendance/stats?member_id=${currentUser.id}`);
        const attendanceData = await attendanceResponse.json();
        let memberAttendance = attendanceData.success ? attendanceData.data : {};
        
        // Always use fair attendance calculation (same as analytics page)
        console.log('📊 Dashboard: Using fair attendance calculation (current month only)...');
        
        // Calculate attendance from member matches
        const matchDates = [...new Set(memberMatches.map((match: any) => match.date))] as string[];
        
        // Fair calculation: current month only for proper representation
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Get Saturdays in current month only
        const currentMonthSaturdays: string[] = [];
        const current = new Date(currentMonthStart);
        
        // Find the first Saturday of current month
        while (current.getDay() !== 6) { // 6 = Saturday
          current.setDate(current.getDate() + 1);
        }
        
        // Collect Saturdays in current month only
        while (current.getMonth() === now.getMonth() && current <= now) {
          currentMonthSaturdays.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 7); // Next Saturday
        }
        
        // For fair calculation: If user has matches, count as 1 session with 100% attendance
        const hasMatchParticipation = matchDates.length > 0;
        const totalSessionDays = Math.max(1, hasMatchParticipation ? 1 : currentMonthSaturdays.length);
        const attendedSessions = hasMatchParticipation ? 1 : 0;
        const calculatedAttendanceRate = totalSessionDays > 0 ? 
          (attendedSessions / totalSessionDays) * 100 : 0;
        
        memberAttendance = {
          attendance_rate: Math.round(calculatedAttendanceRate),
          total_sessions: totalSessionDays,
          attended_sessions: attendedSessions,
          match_participation: matchDates.length
        };
        
        console.log('📊 Dashboard fair attendance calculation:', {
          matchDates: matchDates.length,
          hasMatchParticipation,
          totalSessionDays,
          attendedSessions,
          attendanceRate: memberAttendance.attendance_rate + '%'
        });

        // Calculate win rate using score-based logic (same as analytics page)
        const matchesWithResults = memberMatches.filter((match: any) => match.match_results?.length > 0);
        const wins = matchesWithResults.filter((match: any) => {
          const result = match.match_results[0];
          const userParticipant = match.match_participants.find((p: any) => p.member_id === currentUser.id);
          if (!userParticipant || !result) return false;
          
          // Use score-based winner determination (same as analytics page)
          if (result.team1_score && result.team2_score) {
            const userTeam = userParticipant.team === 'team1' ? 1 : 2;
            const userScore = userTeam === 1 ? result.team1_score : result.team2_score;
            const opponentScore = userTeam === 1 ? result.team2_score : result.team1_score;
            return userScore > opponentScore;
          }
          
          // Fallback to winner_team field if scores not available
          const userTeam = userParticipant.team === 'team1' ? 1 : 2;
          return result.winner_team === userTeam;
        }).length;

        const winRate = matchesWithResults.length > 0 ? Math.round((wins / matchesWithResults.length) * 100) : 0;

        // Calculate attendance rate (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const attendanceRate = memberAttendance.attendance_rate || 0;

        // Get member's pending payments (use same session token if available)
        const { data: { session: paymentSession } } = await supabase.auth.getSession();
        const paymentHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (paymentSession?.access_token) {
          paymentHeaders['Authorization'] = `Bearer ${paymentSession.access_token}`;
        }

        const paymentsResponse = await fetch(`/api/payments?member_id=${currentUser.id}`, {
          credentials: 'include',
          headers: paymentHeaders,
        });
        const paymentsData = await paymentsResponse.json();
        
        // Handle the new API structure: { success: true, data: { payments: [...], stats: {...} } }
        let memberPayments = [];
        if (paymentsData.success && paymentsData.data) {
          // Check if data has payments property (new structure) or is direct array (old structure)
          memberPayments = paymentsData.data.payments || paymentsData.data;
          // Ensure it's an array
          memberPayments = Array.isArray(memberPayments) ? memberPayments : [];
        }
        
        const pendingPayments = memberPayments.filter((p: any) => p.status === 'pending');
        
        // Enhanced debugging for payment amounts
        const totalPaymentAmount = memberPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        const pendingPaymentAmount = pendingPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        
        console.log('💰 Dashboard payment data loaded:');
        console.log('   Total payments:', memberPayments.length, '- Total amount:', totalPaymentAmount);
        console.log('   Pending payments:', pendingPayments.length, '- Pending amount:', pendingPaymentAmount);
        
        // Special debugging for Kevin
        if (currentUser.email === 'kevinharyono55@gmail.com' || currentUser.name.includes('Kevin')) {
          console.log('🎯 DASHBOARD KEVIN PAYMENT CHECK:');
          console.log('🎯 User ID used for payments:', currentUser.id);
          console.log('🎯 Total payment amount:', totalPaymentAmount, '(should be 27000)');
          console.log('🎯 Pending payment amount:', pendingPaymentAmount, '(should be 27000)');
          console.log('🎯 All payments:', memberPayments.map((p: any) => `${p.type}: ${p.amount}`));
        }

        // Calculate current ranking (based on win rate and participation)
        interface MemberStat {
          id: string;
          name: string;
          matches: number;
          wins: number;
          winRate: number;
        }

        const memberStats: MemberStat[] = allMembers.map((member: any) => {
          const memberMatches = allMatches.filter((match: any) => 
            match.match_participants?.some((p: any) => p.member_id === member.id)
          );
          const wins = memberMatches.filter((match: any) => {
            const result = match.match_results?.[0];
            if (!result) return false;
            const userParticipant = match.match_participants?.find((p: any) => p.member_id === member.id);
            if (!userParticipant) return false;
            
            // Use score-based winner determination (consistent with analytics)
            if (result.team1_score && result.team2_score) {
              const userTeam = userParticipant.team === 'team1' ? 1 : 2;
              const userScore = userTeam === 1 ? result.team1_score : result.team2_score;
              const opponentScore = userTeam === 1 ? result.team2_score : result.team1_score;
              return userScore > opponentScore;
            }
            
            // Fallback to winner_team field
            const userTeam = userParticipant.team === 'team1' ? 1 : 2;
            return result.winner_team === userTeam;
          }).length;
          
          return {
            id: member.id,
            name: member.name,
            matches: memberMatches.length,
            wins,
            winRate: memberMatches.length > 0 ? (wins / memberMatches.length) * 100 : 0
          };
        }).sort((a: MemberStat, b: MemberStat) => {
          // Sort by win rate, then by number of matches
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          return b.matches - a.matches;
        });

        const currentRanking = memberStats.findIndex((m: MemberStat) => m.id === currentUser.id) + 1;

        // Get next Saturday session
        const nextSaturday = getNextSaturday();

        console.log('📊 Member Stats:', {
          attendanceRate,
          totalMatches: memberMatches.length,
          winRate,
          currentRanking,
          totalMembers: allMembers.length,
          pendingPayments: pendingPayments.length,
          nextSession: nextSaturday.toISOString()
        });

        setStats({
          attendanceRate: Math.round(attendanceRate),
          totalMatches: memberMatches.length,
          winRate,
          currentRanking: currentRanking > 0 ? currentRanking : allMembers.length,
          totalMembers: allMembers.length,
          pendingPayments: pendingPayments.length,
          nextSession: nextSaturday.toISOString()
        });

        // Set payments due
        const paymentsWithDates = pendingPayments.map((payment: any) => ({
          id: payment.id,
          description: getPaymentDescription(payment),
          amount: payment.amount,
          dueDate: payment.due_date,
          status: payment.status as 'pending' | 'overdue'
        }));
        setPaymentsDue(paymentsWithDates);

        // Generate recent activity from real data
        const activities: Array<{
          id: string;
          type: 'match' | 'attendance' | 'payment';
          description: string;
          date: string;
          result?: 'win' | 'loss' | 'draw';
        }> = [];

        // Recent matches
        const recentMatches = memberMatches
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3);

        recentMatches.forEach((match: any) => {
          const result = match.match_results?.[0];
          let matchResult: 'win' | 'loss' | 'draw' | undefined;
          
          if (result) {
            const userParticipant = match.match_participants?.find((p: any) => p.member_id === currentUser.id);
            if (userParticipant) {
              // Use score-based winner determination (consistent with analytics)
              if (result.team1_score && result.team2_score) {
                const userTeam = userParticipant.team === 'team1' ? 1 : 2;
                const userScore = userTeam === 1 ? result.team1_score : result.team2_score;
                const opponentScore = userTeam === 1 ? result.team2_score : result.team1_score;
                matchResult = userScore > opponentScore ? 'win' : 'loss';
              } else {
                // Fallback to winner_team field
                const userTeam = userParticipant.team === 'team1' ? 1 : 2;
                matchResult = result.winner_team === userTeam ? 'win' : 'loss';
              }
            }
          }

          activities.push({
            id: `match-${match.id}`,
            type: 'match' as const,
            description: `Match at Field ${match.court_number || match.field_number || 1} - ${match.time}`,
            date: match.date,
            result: matchResult
          });
        });

        // Recent attendance
        if (memberAttendance.recent_attendance) {
          memberAttendance.recent_attendance.slice(0, 2).forEach((attendance: any) => {
            activities.push({
              id: `attendance-${attendance.id}`,
              type: 'attendance' as const,
              description: `Saturday session attendance`,
              date: attendance.date
            });
          });
        }

        // Recent payments
        const recentPaidPayments = memberPayments
          .filter((p: any) => p.status === 'paid' && p.paid_date)
          .sort((a: any, b: any) => new Date(b.paid_date).getTime() - new Date(a.paid_date).getTime())
          .slice(0, 2);

        recentPaidPayments.forEach((payment: any) => {
          activities.push({
            id: `payment-${payment.id}`,
            type: 'payment' as const,
            description: `Paid ${getPaymentDescription(payment)} - ${formatCurrency(payment.amount)}`,
            date: payment.paid_date?.split('T')[0] || payment.due_date
          });
        });

        // Sort activities by date
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentActivity(activities.slice(0, 5));

      } catch (error) {
        console.error('❌ Error loading member data:', error);
        // Fallback to basic stats if API fails
        setStats({
          attendanceRate: 0,
          totalMatches: 0,
          winRate: 0,
          currentRanking: 0,
          totalMembers: 0,
          pendingPayments: 0,
          nextSession: getNextSaturday().toISOString()
        });
        setMemberName('Member');
      }
    };

    loadMemberData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPaymentDescription = (payment: any) => {
    switch (payment.type) {
      case 'monthly':
        return 'Monthly Membership Fee';
      case 'daily':
        return 'Saturday Session Fee';
      case 'match':
        return 'Match Shuttlecock Fee';
      case 'penalty':
        return 'Late Payment Penalty';
      case 'tournament':
        return 'Tournament Entry Fee';
      default:
        return 'Payment Fee';
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

  const getActivityIcon = (type: string, result?: string) => {
    switch (type) {
      case 'match':
        return result === 'win' ? 
          <Trophy className="h-4 w-4 text-green-500" /> :
          result === 'loss' ?
          <Trophy className="h-4 w-4 text-red-500" /> :
          <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'attendance':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const totalPaymentsDue = paymentsDue.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation variant="member" />
        
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

          {/* Payment Alerts */}
          {paymentsDue.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <h3 className="text-sm font-medium text-yellow-800">
                  You have {paymentsDue.length} pending payment(s) totaling {formatCurrency(totalPaymentsDue)}
                </h3>
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-3">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t.attendanceRate}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</p>
                <p className="text-xs text-green-600">
                  {language === 'en' ? 'Great consistency!' : 'Konsistensi yang bagus!'}
                </p>
              </div>
            </div>
          </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 p-3">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.winRate}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.winRate}%</p>
                  <p className="text-xs text-blue-600">{stats.totalMatches} {t.matchesPlayed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-purple-100 p-3">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.currentRanking}</p>
                  <p className="text-2xl font-bold text-gray-900">#{stats.currentRanking}</p>
                  <p className="text-xs text-gray-500">of {stats.totalMembers} members</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-red-100 p-3">
                  <DollarSign className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
                  <p className="text-xs text-red-600">
                    {formatCurrency(totalPaymentsDue)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Link
            href="/dashboard/payments"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">My Payments</h3>
                <p className="text-sm text-gray-600 mt-1">
                  View payment history and pending dues
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-red-600">{stats.pendingPayments}</div>
              <div className="text-sm text-gray-500">Pending payments</div>
            </div>
          </Link>

            <Link
              href="/dashboard/analytics"
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Performance Analytics</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Get insights on your performance trends
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-blue-600">{stats.winRate}%</div>
              <div className="text-sm text-gray-500">Current win rate</div>
            </div>
          </Link>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Next Session</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Upcoming badminton session
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
              <div className="mt-4">
                <div className="text-sm font-bold text-purple-600">
                  {formatDate(stats.nextSession)}
                </div>
                <div className="text-sm text-gray-500">Saturday, 9:00 AM</div>
              </div>
            </div>
          </div>

          {/* Payments Due & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payments Due */}
            <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payments Due</h3>
            {paymentsDue.length > 0 ? (
              <div className="space-y-4">
                {paymentsDue.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{payment.description}</h4>
                        <p className="text-sm text-gray-600">
                          Due: {formatDate(payment.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(payment.amount)}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status === 'pending' ? 'Pending' : 'Overdue'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No pending payments</p>
            )}
            <div className="mt-4 pt-4 border-t">
              <Link
                href="/dashboard/payments"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View all payments →
              </Link>
            </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="shrink-0 mt-1">
                    {getActivityIcon(activity.type, activity.result)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                  {activity.result && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity.result === 'win' ? 'bg-green-100 text-green-800' :
                      activity.result === 'loss' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {activity.result.toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link
                href="/dashboard/history"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View full history →
              </Link>
            </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}