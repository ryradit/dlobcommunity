'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Users, Zap, TrendingUp, Calendar, Shield, Activity, UserPlus, Edit, Award, Target, DollarSign, TrendingDown, Bell, HelpCircle } from 'lucide-react';
import { StatCardSkeleton, ActivityItemSkeleton } from '@/components/LoadingSkeletons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TutorialOverlay from '@/components/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';
import { getTutorialSteps } from '@/lib/tutorialSteps';

interface AdminStats {
  totalMembers: number;
  totalAdmins: number;
  activeProjects: number;
  pendingApprovals: number;
  events: number;
}

interface ActivityItem {
  id: string;
  type: 'registration' | 'update' | 'payment_pending';
  user: string;
  timestamp: string;
  icon: any;
  color: string;
}

interface PerformanceMember {
  id: string;
  name: string;
  streak: number;
  type: 'win' | 'loss';
}

interface RevenueData {
  month: string;
  label: string;
  amount: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [stats, setStats] = useState<AdminStats>({
    totalMembers: 0,
    totalAdmins: 0,
    activeProjects: 0,
    pendingApprovals: 0,
    events: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [topPerformers, setTopPerformers] = useState<PerformanceMember[]>([]);
  const [mostActivePlayers, setMostActivePlayers] = useState<{ id: string; name: string; matches: number }[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  const tutorialSteps = getTutorialSteps('dashboard');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('admin-dashboard', tutorialSteps);

  useEffect(() => {
    let mounted = true;

    async function fetchAdminStats() {
      if (!mounted) return;
      
      setLoading(true);
      
      // Fetch all stats in parallel for faster loading
      const [statsResult, activitiesResult, matchesResult, revenueResult, pendingPaymentsResult] = await Promise.allSettled([
        // Stats queries in parallel with caching
        cachedQuery(
          'admin-profile-counts',
          async () => Promise.allSettled([
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
          ]),
          30000 // 30 seconds cache
        ),
        // Recent activities with caching
        cachedQuery(
          'admin-recent-profiles',
          async () => {
            const result = await supabase
              .from('profiles')
              .select('id, full_name, created_at, updated_at')
              .order('created_at', { ascending: false })
              .limit(10);
            return result;
          },
          30000
        ),
        // Match data with caching
        cachedQuery(
          'admin-matches-data',
          async () => {
            const result = await supabase
              .from('matches')
              .select('team1_player1, team1_player2, team2_player1, team2_player2, winner, match_date, created_at')
              .order('match_date', { ascending: false });
            return result;
          },
          60000 // 1 minute cache for match data
        ),
        // Revenue data
        cachedQuery(
          'admin-revenue-monthly-v2',
          async () => {
            const matchMembersResult = await supabase
              .from('match_members')
              .select('total_amount, paid_at, matches(match_date)')
              .eq('payment_status', 'paid');
            
            const membershipsResult = await supabase
              .from('memberships')
              .select('amount, paid_at')
              .eq('payment_status', 'paid');
            
            return { matchMembers: matchMembersResult, memberships: membershipsResult };
          },
          60000
        ),
        // Pending payments with proof
        cachedQuery(
          'admin-pending-payments',
          async () => {
            const matchPayments = await supabase
              .from('match_members')
              .select('id, member_name, payment_proof, created_at, match_id')
              .eq('payment_status', 'pending')
              .not('payment_proof', 'is', null)
              .order('created_at', { ascending: false })
              .limit(10);
            
            const membershipPayments = await supabase
              .from('memberships')
              .select('id, member_name, payment_proof, created_at')
              .eq('payment_status', 'pending')
              .not('payment_proof', 'is', null)
              .order('created_at', { ascending: false })
              .limit(10);
            
            return { matchPayments, membershipPayments };
          },
          30000 // 30 seconds cache
        ),
      ]);

      // Process stats
      if (mounted && statsResult.status === 'fulfilled') {
        const [membersRes, adminsRes, activeRes, totalRes] = statsResult.value;
        
        setStats({
          totalMembers: membersRes.status === 'fulfilled' ? (membersRes.value.count || 0) : 0,
          totalAdmins: adminsRes.status === 'fulfilled' ? (adminsRes.value.count || 0) : 0,
          activeProjects: activeRes.status === 'fulfilled' ? (activeRes.value.count || 0) : 0,
          pendingApprovals: 0,
          events: totalRes.status === 'fulfilled' ? (totalRes.value.count || 0) : 0,
        });
      }

      // Process activities
      if (mounted && activitiesResult.status === 'fulfilled') {
        const result = activitiesResult.value as { data: any[] | null; error: any };
        const recentProfiles = result.data;
        const activityList: ActivityItem[] = [];
        
        if (recentProfiles) {
          recentProfiles.forEach((profile) => {
            // Registration activity
            activityList.push({
              id: `reg-${profile.id}`,
              type: 'registration',
              user: profile.full_name || 'Pengguna Baru',
              timestamp: profile.created_at,
              icon: UserPlus,
              color: 'text-blue-400',
            });

            // Update activity (if updated_at is different from created_at)
            if (profile.updated_at && profile.updated_at !== profile.created_at) {
              const updatedDate = new Date(profile.updated_at);
              const createdDate = new Date(profile.created_at);
              if (updatedDate.getTime() - createdDate.getTime() > 1000) {
                activityList.push({
                  id: `upd-${profile.id}`,
                  type: 'update',
                  user: profile.full_name || 'Pengguna',
                  timestamp: profile.updated_at,
                  icon: Edit,
                  color: 'text-purple-400',
                });
              }
            }
          });
        }

        // Add pending payment activities
        if (pendingPaymentsResult.status === 'fulfilled') {
          const payments = pendingPaymentsResult.value as {
            matchPayments: { data: any[] | null };
            membershipPayments: { data: any[] | null };
          };
          
          let pendingCount = 0;
          
          // Add match payment proofs
          if (payments.matchPayments.data) {
            payments.matchPayments.data.forEach((payment) => {
              if (payment.payment_proof !== 'CASH_PAYMENT') {
                activityList.push({
                  id: `payment-match-${payment.id}`,
                  type: 'payment_pending',
                  user: `${payment.member_name} - Match Payment`,
                  timestamp: payment.created_at,
                  icon: Bell,
                  color: 'text-amber-400',
                });
                pendingCount++;
              }
            });
          }
          
          // Add membership payment proofs
          if (payments.membershipPayments.data) {
            payments.membershipPayments.data.forEach((payment) => {
              if (payment.payment_proof !== 'CASH_PAYMENT') {
                activityList.push({
                  id: `payment-membership-${payment.id}`,
                  type: 'payment_pending',
                  user: `${payment.member_name} - Membership Payment`,
                  timestamp: payment.created_at,
                  icon: Bell,
                  color: 'text-amber-400',
                });
                pendingCount++;
              }
            });
          }
          
          setPendingPaymentsCount(pendingCount);
        }
        
        // Sort by timestamp and take top 8
        activityList.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setActivities(activityList.slice(0, 8));
      }

      // Process match data for performance stats
      if (mounted && matchesResult.status === 'fulfilled') {
        const result = matchesResult.value as { data: any[] | null; error: any };
        const matchesData = result.data;
        const playerStreaks: { [key: string]: { name: string; currentStreak: number; type: 'win' | 'loss' } } = {};

        if (matchesData && matchesData.length > 0) {
          // Group matches by player
          const playerMatches: { [key: string]: any[] } = {};

          matchesData.forEach((match) => {
            const players = [
              match.team1_player1,
              match.team1_player2,
              match.team2_player1,
              match.team2_player2,
            ];

            players.forEach((playerName) => {
              if (!playerName) return;
              
              if (!playerMatches[playerName]) {
                playerMatches[playerName] = [];
              }

              const isTeam1 = playerName === match.team1_player1 || playerName === match.team1_player2;
              const isWinner = (isTeam1 && match.winner === 'team1') || (!isTeam1 && match.winner === 'team2');

              playerMatches[playerName].push({
                date: match.match_date || match.created_at,
                isWinner,
              });
            });
          });

          // Calculate current streak for each player
          Object.keys(playerMatches).forEach((playerName) => {
            const matches = playerMatches[playerName].sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            if (matches.length > 0) {
              let currentStreak = 1;
              const latestResult = matches[0].isWinner;

              for (let i = 1; i < matches.length; i++) {
                if (matches[i].isWinner === latestResult) {
                  currentStreak++;
                } else {
                  break;
                }
              }

              playerStreaks[playerName] = {
                name: playerName,
                currentStreak,
                type: latestResult ? 'win' : 'loss',
              };
            }
          });

          // Convert to array and sort
          const performers: PerformanceMember[] = Object.values(playerStreaks).map((player, index) => ({
            id: `${player.type}-${index}`,
            name: player.name,
            streak: player.currentStreak,
            type: player.type,
          }));

          // Sort: wins first (highest to lowest), then losses (highest to lowest)
          performers.sort((a, b) => {
            if (a.type === b.type) {
              return b.streak - a.streak;
            }
            return a.type === 'win' ? -1 : 1;
          });

          setTopPerformers(performers.slice(0, 5));

          // Calculate most active players (most matches played)
          const playerMatchCount: { [key: string]: number } = {};
          matchesData.forEach((match) => {
            const players = [
              match.team1_player1,
              match.team1_player2,
              match.team2_player1,
              match.team2_player2,
            ];

            players.forEach((playerName) => {
              if (!playerName) return;
              playerMatchCount[playerName] = (playerMatchCount[playerName] || 0) + 1;
            });
          });

          const activePlayers = Object.entries(playerMatchCount)
            .map(([name, matches], index) => ({
              id: `active-${index}`,
              name,
              matches,
            }))
            .sort((a, b) => b.matches - a.matches)
            .slice(0, 5);

          setMostActivePlayers(activePlayers);
        }
      }

      // Process revenue data
      if (mounted && revenueResult.status === 'fulfilled') {
        const { value: revenueData } = revenueResult;
        if (revenueData?.matchMembers?.data && revenueData?.memberships?.data) {
          processMonthlyRevenue(revenueData.matchMembers.data, revenueData.memberships.data);
        }
      }

      if (mounted) {
        setLoading(false);
      }
    }

    // Fetch data when component mounts or pathname changes
    fetchAdminStats();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  // Process monthly revenue from Feb 2026
  const processMonthlyRevenue = (matchMembers: any[], memberships: any[]) => {
    const now = new Date();
    const monthlyData: Record<string, number> = {};
    
    // Start from Jan 2026
    const startYear = 2026;
    const startMonth = 0; // January (0-indexed)
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Generate all months from Jan 2026 to current
    let year = startYear;
    let month = startMonth;
    
    while (year < currentYear || (year === currentYear && month <= currentMonth)) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      monthlyData[key] = 0;
      
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
    
    // Aggregate revenue by month
    const allRevenue = [
      ...matchMembers.map(m => ({
        // Use match_date for match revenue (the month the match was played, not when paid)
        date: (m.matches as any)?.match_date || m.paid_at,
        amount: m.total_amount || 0
      })),
      ...memberships.map(m => ({ date: m.paid_at, amount: m.amount || 0 }))
    ].filter(r => r.date);
    
    allRevenue.forEach(r => {
      const date = new Date(r.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData.hasOwnProperty(key)) {
        monthlyData[key] += r.amount;
      }
    });
    
    // Convert to chart data
    const chartData: RevenueData[] = Object.entries(monthlyData).map(([key, amount]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        month: key,
        label: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        amount
      };
    });
    
    setRevenueData(chartData);
    
    // Calculate total and change
    const total = allRevenue.reduce((sum, r) => sum + r.amount, 0);
    setTotalRevenue(total);
    
    if (chartData.length >= 2) {
      const lastMonth = chartData[chartData.length - 1].amount;
      const previousMonth = chartData[chartData.length - 2].amount;
      const change = previousMonth > 0 ? ((lastMonth - previousMonth) / previousMonth) * 100 : 0;
      setRevenueChange(change);
    }
  };

  const statsDisplay = [
    {
      label: 'Total Anggota',
      value: loading ? '...' : stats.totalMembers.toLocaleString(),
      icon: Users,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
      borderColor: 'border-blue-100 dark:border-blue-500/25',
    },
    {
      label: 'Admin',
      value: loading ? '...' : stats.totalAdmins.toLocaleString(),
      icon: Shield,
      iconColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-500/10',
      borderColor: 'border-red-100 dark:border-red-500/25',
    },
    {
      label: 'Pengguna Aktif',
      value: loading ? '...' : stats.activeProjects.toLocaleString(),
      icon: Zap,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-500/10',
      borderColor: 'border-purple-100 dark:border-purple-500/25',
    },
    {
      label: 'Pembayaran Menunggu',
      value: loading ? '...' : pendingPaymentsCount.toLocaleString(),
      icon: Bell,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-500/10',
      borderColor: 'border-amber-100 dark:border-amber-500/25',
      badge: pendingPaymentsCount > 0,
    },
    {
      label: 'Total Pengguna',
      value: loading ? '...' : stats.events.toLocaleString(),
      icon: TrendingUp,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
      borderColor: 'border-emerald-100 dark:border-emerald-500/25',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 px-4 lg:px-8 py-6 lg:py-8 transition-colors duration-300">
      
      {/* Premium Admin Welcome Header Card */}
      <div className="mb-8 bg-gradient-to-r from-rose-600/10 via-red-600/5 to-rose-600/10 dark:from-rose-500/10 dark:via-red-500/5 dark:to-rose-500/10 border border-rose-100 dark:border-zinc-800/80 rounded-3xl p-6 lg:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-xs relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-48 h-48 bg-rose-500/20 dark:bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-48 h-48 bg-red-500/20 dark:bg-red-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 animate-pulse" />
            ADMIN PANEL
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors duration-300">
            Selamat datang kembali, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-700 dark:text-zinc-300 font-medium transition-colors duration-300">
            Kelola keanggotaan, monitor keuangan, dan pantau aktivitas komunitas DLOB dari panel ini.
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-2 self-stretch lg:self-auto justify-end">
          <button
            onClick={toggleTutorial}
            className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-gray-200 dark:border-zinc-700 text-rose-600 dark:text-rose-400 transition-all duration-300 shadow-xs hover:shadow-sm"
            title="Tampilkan panduan interaktif"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {loading ? (
          // Show skeleton loading states
          [...Array(5)].map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          statsDisplay.map((stat) => {
            const Icon = stat.icon;
            const isPendingPayments = stat.label === 'Pembayaran Menunggu';
            const hasPendingItems = (stat as any).badge && pendingPaymentsCount > 0;
            
            // Determine which className to add
            let customClass = '';
            if (stat.label === 'Total Anggota') customClass = 'stat-card-members';
            else if (stat.label === 'Pembayaran Menunggu') customClass = 'stat-card-pending-payments';
            
            const card = (
              <div
                className={`bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 transition-all duration-300 shadow-xs hover:shadow-sm hover:-translate-y-0.5 relative overflow-hidden group ${customClass} ${
                  isPendingPayments && hasPendingItems
                    ? 'border-amber-500/30 hover:border-amber-500/60 shadow-md shadow-amber-500/5 cursor-pointer'
                    : 'hover:border-rose-400/40 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${stat.bgColor} ${stat.borderColor} border ${
                    isPendingPayments && hasPendingItems ? 'animate-pulse' : ''
                  }`}>
                    <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  {hasPendingItems && (
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                  )}
                </div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1 transition-colors duration-300 tracking-tight">{stat.value}</div>
                <div className="text-sm text-gray-700 dark:text-zinc-300 font-bold transition-colors duration-300">{stat.label}</div>
                {isPendingPayments && hasPendingItems && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-bold group-hover:underline">Klik untuk verifikasi</p>
                )}
              </div>
            );
            
            return isPendingPayments && hasPendingItems ? (
              <Link key={stat.label} href="/admin/pembayaran" className="block">
                {card}
              </Link>
            ) : (
              <div key={stat.label}>
                {card}
              </div>
            );
          })
        )}
      </div>

      {/* Revenue Growth Chart - Stock Style */}
      <div className="mt-8">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs transition-colors duration-300 revenue-chart">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shadow-xs">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors duration-300">Revenue Growth</h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold mt-0.5">Pendapatan bulanan terhitung sejak Jan 2026</p>
              </div>
            </div>
          </div>
 
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 transition-colors duration-300">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-1 font-bold">Total Pendapatan</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Rp {totalRevenue.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-200/60 dark:border-zinc-800/60 rounded-xl p-4 transition-colors duration-300">
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1 font-bold">Perkembangan Bulanan</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-black tracking-tight ${revenueChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                </p>
                {revenueChange >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-200/60 dark:border-zinc-800/60 rounded-xl p-4 transition-colors duration-300">
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1 font-bold">Titik Data Pendapatan</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{revenueData.length} Bulan</p>
            </div>
          </div>

          {/* Stock-Style Chart */}
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-gray-500 dark:text-zinc-500 text-sm font-semibold">Loading chart...</div>
            </div>
          ) : revenueData.length === 0 ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <DollarSign className="w-12 h-12 text-gray-400 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-zinc-500 font-bold">Belum ada data pendapatan</p>
                <p className="text-gray-400 dark:text-zinc-600 text-xs mt-1">Data akan otomatis terisi saat match diselesaikan</p>
              </div>
            </div>
          ) : (
            <div className="h-96 bg-gray-50 dark:bg-zinc-950/50 rounded-xl p-4 border border-gray-150 dark:border-zinc-800/60 transition-colors duration-300">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e5e7eb" 
                    className="dark:stroke-zinc-850"
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="label" 
                    stroke="#9ca3af"
                    className="dark:stroke-zinc-650"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickLine={{ stroke: '#d1d5db' }}
                    axisLine={{ stroke: '#d1d5db' }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    className="dark:stroke-zinc-650"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickLine={{ stroke: '#d1d5db' }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      padding: '12px'
                    }}
                    labelStyle={{ 
                      color: '#111827', 
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}
                    formatter={(value: any) => [
                      <span className="text-emerald-600 font-bold" key="value">
                        Rp {value.toLocaleString('id-ID')}
                      </span>, 
                      'Revenue'
                    ]}
                    cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '5 5' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10b981" 
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                    dot={{
                      fill: '#10b981',
                      strokeWidth: 2,
                      r: 4,
                      stroke: '#065f46'
                    }}
                    activeDot={{
                      r: 6,
                      fill: '#10b981',
                      stroke: '#fff',
                      strokeWidth: 2
                    }}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs transition-colors duration-300 activity-feed">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20">
              <Activity className="w-4 h-4 shrink-0" />
            </div>
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors duration-300">Aktivitas Sistem</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <ActivityItemSkeleton key={i} />)}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold">Tidak ada aktivitas terbaru.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {activities.map((activity) => {
                const Icon = activity.icon;
                const timeAgo = getTimeAgo(activity.timestamp);
                const isPaymentPending = activity.type === 'payment_pending';
                
                const content = (
                  <div
                    className={`flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800/80 transition-all duration-300 ${
                      isPaymentPending ? 'hover:bg-amber-50 dark:hover:bg-amber-950/20 cursor-pointer border-amber-200 dark:border-amber-500/20' : 'hover:bg-gray-100 dark:hover:bg-zinc-850'
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-white dark:bg-zinc-900 ${activity.color} border border-gray-100 dark:border-zinc-800 ${
                      isPaymentPending ? 'animate-pulse' : ''
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 dark:text-zinc-300 font-medium">
                        <span className="font-bold text-gray-900 dark:text-white">{activity.user}</span>
                        {activity.type === 'registration' && ' bergabung ke sistem'}
                        {activity.type === 'update' && ' memperbarui profil'}
                        {activity.type === 'payment_pending' && (
                          <span className="text-amber-600 dark:text-amber-400"> mengirim bukti pembayaran - Menunggu konfirmasi</span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-500 mt-1 font-semibold">{timeAgo}</p>
                    </div>
                  </div>
                );
                
                return isPaymentPending ? (
                  <Link key={activity.id} href="/admin/pembayaran" className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={activity.id}>
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Performance Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs transition-colors duration-300 top-performers">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
              <Award className="w-4 h-4 shrink-0" />
            </div>
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors duration-300">Performa Terbaik</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <ActivityItemSkeleton key={i} />)}
            </div>
          ) : topPerformers.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold">Belum ada data performa.</p>
          ) : (
            <div className="space-y-4">
              {topPerformers.map((member, index) => {
                const isWin = member.type === 'win';
                const percentage = (member.streak / 10) * 100;
                return (
                  <div key={member.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 dark:text-zinc-650 text-xs w-6 font-bold">#{index + 1}</span>
                        <span className="text-gray-900 dark:text-white font-bold text-xs">{member.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black uppercase tracking-wider ${
                          isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                        }`}>
                          {member.streak} {isWin ? 'Win' : 'Loss'} Streak
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-100 dark:bg-zinc-800/80 rounded-full overflow-hidden border border-gray-200/30 dark:border-zinc-850">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                          isWin 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                            : 'bg-gradient-to-r from-red-500 to-rose-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Most Active Players */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs transition-colors duration-300 active-players">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-500/20">
              <Target className="w-4 h-4 shrink-0" />
            </div>
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors duration-300">Pemain Paling Aktif</h2>
          </div>
          {loading ? (
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold">Memuat data...</p>
          ) : mostActivePlayers.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold">Belum ada data pertandingan.</p>
          ) : (
            <div className="space-y-4">
              {mostActivePlayers.map((player, index) => {
                const maxMatches = mostActivePlayers[0]?.matches || 10;
                const percentage = (player.matches / maxMatches) * 100;
                return (
                  <div key={player.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 dark:text-zinc-650 text-xs w-6 font-bold">#{index + 1}</span>
                        <span className="text-gray-900 dark:text-white font-bold text-xs">{player.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                          {player.matches} Game
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-100 dark:bg-zinc-800/80 rounded-full overflow-hidden border border-gray-200/30 dark:border-zinc-850">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all bg-gradient-to-r from-cyan-500 to-blue-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tutorial Overlay */}
      <TutorialOverlay
        steps={tutorialSteps}
        isActive={isTutorialActive}
        onClose={closeTutorial}
        tutorialKey="admin-dashboard"
      />
    </div>
  );
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  return time.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
