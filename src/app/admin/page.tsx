'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Users, Zap, TrendingUp, Calendar, Shield, Activity, UserPlus, Edit, Award, Target, DollarSign, TrendingDown, Bell } from 'lucide-react';
import { StatCardSkeleton, ActivityItemSkeleton } from '@/components/LoadingSkeletons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
          'admin-revenue-monthly',
          async () => {
            const matchMembersResult = await supabase
              .from('match_members')
              .select('total_amount, paid_at')
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
      ...matchMembers.map(m => ({ date: m.paid_at, amount: m.total_amount || 0 })),
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
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Admin',
      value: loading ? '...' : stats.totalAdmins.toLocaleString(),
      icon: Shield,
      color: 'from-red-500 to-red-600',
    },
    {
      label: 'Pengguna Aktif',
      value: loading ? '...' : stats.activeProjects.toLocaleString(),
      icon: Zap,
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Pembayaran Menunggu',
      value: loading ? '...' : pendingPaymentsCount.toLocaleString(),
      icon: Bell,
      color: 'from-amber-500 to-orange-600',
      badge: pendingPaymentsCount > 0,
    },
    {
      label: 'Total Pengguna',
      value: loading ? '...' : stats.events.toLocaleString(),
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-red-400" />
          <h1 className="text-3xl font-bold text-white">
            Dashboard Admin
          </h1>
        </div>
        <p className="text-zinc-400">
          Selamat datang kembali, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}! Kelola komunitas Anda dari sini.
        </p>
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
            
            const card = (
              <div
                className={`bg-zinc-900 border rounded-xl p-6 transition-all ${
                  isPendingPayments && hasPendingItems
                    ? 'border-amber-500/30 hover:border-amber-500/50 shadow-lg shadow-amber-500/10 cursor-pointer'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`inline-flex p-3 rounded-xl bg-linear-to-br ${stat.color} mb-4 ${
                  isPendingPayments && hasPendingItems ? 'animate-pulse' : ''
                }`}>
                  <Icon className="w-6 h-6 text-white" />
                  {hasPendingItems && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-zinc-400">{stat.label}</div>
                {isPendingPayments && hasPendingItems && (
                  <p className="text-xs text-amber-400 mt-2 font-medium">Klik untuk melihat</p>
                )}
              </div>
            );
            
            return isPendingPayments && hasPendingItems ? (
              <Link key={stat.label} href="/admin/pembayaran">
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
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Revenue Growth</h2>
                <p className="text-sm text-zinc-400">Monthly revenue from Jan 2026</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-linear-to-br from-green-500/10 to-emerald-600/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm text-green-400 mb-1 font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-white">Rp {totalRevenue.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-zinc-800/50 border border-white/5 rounded-lg p-4">
              <p className="text-sm text-zinc-400 mb-1">Month-over-Month</p>
              <div className="flex items-center gap-2">
                <p className={`text-3xl font-bold ${revenueChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                </p>
                {revenueChange >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-400" />
                )}
              </div>
            </div>
            <div className="bg-zinc-800/50 border border-white/5 rounded-lg p-4">
              <p className="text-sm text-zinc-400 mb-1">Data Points</p>
              <p className="text-3xl font-bold text-white">{revenueData.length} Months</p>
            </div>
          </div>

          {/* Stock-Style Chart */}
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-zinc-500">Loading chart...</div>
            </div>
          ) : revenueData.length === 0 ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <DollarSign className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-500">No revenue data available</p>
                <p className="text-zinc-600 text-sm">Data will appear from January 2026 onwards</p>
              </div>
            </div>
          ) : (
            <div className="h-96 bg-zinc-950/50 rounded-lg p-4 border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#27272a" 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="label" 
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    tickLine={{ stroke: '#27272a' }}
                    axisLine={{ stroke: '#27272a' }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis 
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    tickLine={{ stroke: '#27272a' }}
                    axisLine={{ stroke: '#27272a' }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                      padding: '12px'
                    }}
                    labelStyle={{ 
                      color: '#e4e4e7', 
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}
                    formatter={(value: any) => [
                      <span className="text-green-400 font-bold">
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
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Aktivitas Sistem</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <ActivityItemSkeleton key={i} />)}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-zinc-400">Tidak ada aktivitas terbaru.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.map((activity) => {
                const Icon = activity.icon;
                const timeAgo = getTimeAgo(activity.timestamp);
                const isPaymentPending = activity.type === 'payment_pending';
                
                const content = (
                  <div
                    className={`flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 transition-colors ${
                      isPaymentPending ? 'hover:bg-amber-900/20 cursor-pointer border border-amber-500/20' : 'hover:bg-zinc-800'
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-zinc-900 ${activity.color} ${
                      isPaymentPending ? 'animate-pulse' : ''
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        <span className="font-semibold">{activity.user}</span>
                        {activity.type === 'registration' && ' bergabung ke sistem'}
                        {activity.type === 'update' && ' memperbarui profil'}
                        {activity.type === 'payment_pending' && (
                          <span className="text-amber-400"> mengirim bukti pembayaran - Menunggu konfirmasi</span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">{timeAgo}</p>
                    </div>
                  </div>
                );
                
                return isPaymentPending ? (
                  <Link key={activity.id} href="/admin/pembayaran">
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
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Performa Terbaik</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <ActivityItemSkeleton key={i} />)}
            </div>
          ) : topPerformers.length === 0 ? (
            <p className="text-zinc-400">Belum ada data performa.</p>
          ) : (
            <div className="space-y-4">
              {topPerformers.map((member, index) => {
                const isWin = member.type === 'win';
                const percentage = (member.streak / 10) * 100;
                return (
                  <div key={member.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-sm w-6">#{index + 1}</span>
                        <span className="text-white font-medium">{member.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          isWin ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {member.streak} {isWin ? 'Menang' : 'Kalah'} Beruntun
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                          isWin 
                            ? 'bg-linear-to-r from-green-500 to-emerald-400' 
                            : 'bg-linear-to-r from-red-500 to-rose-400'
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
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Pemain Paling Aktif</h2>
          </div>
          {loading ? (
            <p className="text-zinc-400">Memuat data...</p>
          ) : mostActivePlayers.length === 0 ? (
            <p className="text-zinc-400">Belum ada data pertandingan.</p>
          ) : (
            <div className="space-y-4">
              {mostActivePlayers.map((player, index) => {
                const maxMatches = mostActivePlayers[0]?.matches || 10;
                const percentage = (player.matches / maxMatches) * 100;
                return (
                  <div key={player.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-sm w-6">#{index + 1}</span>
                        <span className="text-white font-medium">{player.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-cyan-400">
                          {player.matches} Pertandingan
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all bg-linear-to-r from-cyan-500 to-blue-400"
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
