'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Users, Zap, TrendingUp, Calendar, Shield, Activity, UserPlus, Edit, Award, Target, DollarSign, TrendingDown, Bell, HelpCircle, ShoppingBag, ChevronRight, QrCode, X, ExternalLink, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { StatCardSkeleton, ActivityItemSkeleton } from '@/components/LoadingSkeletons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TutorialOverlay from '@/components/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';
import { getTutorialSteps } from '@/lib/tutorialSteps';
import SystemHealthMonitor from '@/components/admin/SystemHealthMonitor';
import BranchBadge from '@/components/BranchBadge';

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
  const { user, isSuperAdmin } = useAuth();
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
  // Cross-branch stats (super admin only)
  const [branchStats, setBranchStats] = useState<{ cikupaMembers: number; cikupaPending: number } | null>(null);

  // QRIS shortcut modal state
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [qrisImageUrl, setQrisImageUrl] = useState<string | null>(null);
  const [qrisLoading, setQrisLoading] = useState(false);

  const tutorialSteps = getTutorialSteps('dashboard');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('admin-dashboard', tutorialSteps);

  // Fetch cross-branch stats for super admin
  useEffect(() => {
    if (!isSuperAdmin) return;
    (async () => {
      const [membersRes, pendingRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('branch_id', 'dlob-cikupa').eq('is_active', true),
        supabase.from('match_members').select('id', { count: 'exact', head: true }).eq('branch_id', 'dlob-cikupa').eq('payment_status', 'pending'),
      ]);
      setBranchStats({
        cikupaMembers: membersRes.count ?? 0,
        cikupaPending: pendingRes.count ?? 0,
      });
    })();
  }, [isSuperAdmin]);

  // Fetch QRIS image for quick shortcut
  useEffect(() => {
    let isMounted = true;
    setQrisLoading(true);
    fetch('/api/payment-info')
      .then(res => res.json())
      .then(data => {
        if (isMounted && data?.qrisImageUrl) {
          setQrisImageUrl(data.qrisImageUrl);
        }
      })
      .catch(err => console.error('Failed to fetch QRIS image:', err))
      .finally(() => {
        if (isMounted) setQrisLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

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
      accent: 'blue',
    },
    {
      label: 'Admin',
      value: loading ? '...' : stats.totalAdmins.toLocaleString(),
      icon: Shield,
      accent: 'zinc',
    },
    {
      label: 'Pengguna Aktif',
      value: loading ? '...' : stats.activeProjects.toLocaleString(),
      icon: Zap,
      accent: 'purple',
    },
    {
      label: 'Pembayaran Menunggu',
      value: loading ? '...' : pendingPaymentsCount.toLocaleString(),
      icon: Bell,
      accent: 'amber',
      badge: pendingPaymentsCount > 0,
    },
    {
      label: 'Total Pengguna',
      value: loading ? '...' : stats.events.toLocaleString(),
      icon: TrendingUp,
      accent: 'emerald',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 py-4 lg:py-8 pr-4 lg:pr-8 pl-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white shadow-xs">
              <Shield className="w-6 h-6 text-slate-700 dark:text-zinc-300" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Dashboard Admin
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Selamat datang kembali, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQrisModal(true)}
              className="p-2 rounded-xl bg-white dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10 text-emerald-700 dark:text-emerald-400 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
              title="Shortcut Tampilkan QRIS Komunitas"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">QRIS</span>
            </button>
            <button
              onClick={toggleTutorial}
              className="p-2 rounded-xl bg-white dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
              title="Tampilkan panduan fitur"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Live System & API Status Monitor */}
      <SystemHealthMonitor />

      {/* Super Admin: Cross-branch DLBC overview */}
      {isSuperAdmin && branchStats !== null && (
        <div className="mb-6 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900/60 backdrop-blur-xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">DLOB Cikupa (DLBC)</p>
              <BranchBadge branchId="dlob-cikupa" branchName="DLBC" accentColor="#10B981" size="sm" />
            </div>
            <Link
              href="/cikupa/admin"
              className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors flex items-center gap-1"
            >
              Buka Admin DLBC <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
              <p className="text-xs text-slate-500 dark:text-zinc-500 mb-1">Anggota Aktif</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{branchStats.cikupaMembers}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
              <p className="text-xs text-slate-500 dark:text-zinc-500 mb-1">Tagihan Pending</p>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400">{branchStats.cikupaPending}</p>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin / Owner Exclusive: New Batch Recap Highlight */}
      {(user?.email?.toLowerCase().includes('ryradit') ||
        user?.user_metadata?.full_name?.toLowerCase().includes('ryan radityatama') ||
        user?.user_metadata?.name?.toLowerCase().includes('ryan radityatama') ||
        user?.email === 'ryradit@gmail.com') && (
        <div className="mb-8 p-5 rounded-2xl bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Rekapitulasi Pre-Order Jersey New Batch 2026
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Owner Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Pantau total jersey terpesan, matriks konveksi/vendor, dan kelola status pemesanan.
              </p>
            </div>
          </div>
          <Link
            href="/admin/rekap-new-batch"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Buka Rekapitulasi</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Stat Cards - Minimalist Style */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {loading ? (
          [...Array(5)].map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          statsDisplay.map((stat) => {
            const Icon = stat.icon;
            const isPendingPayments = stat.label === 'Pembayaran Menunggu';
            const hasPendingItems = (stat as any).badge && pendingPaymentsCount > 0;
            
            let customClass = '';
            if (stat.label === 'Total Anggota') customClass = 'stat-card-members';
            else if (stat.label === 'Pembayaran Menunggu') customClass = 'stat-card-pending-payments';
            
            const card = (
              <div
                className={`bg-white dark:bg-zinc-900/60 backdrop-blur-xl border rounded-2xl p-4 sm:p-5 transition-all shadow-xs ${customClass} ${
                  isPendingPayments && hasPendingItems
                    ? 'border-amber-500/30 hover:border-amber-500/50 bg-amber-50 dark:bg-amber-500/5 cursor-pointer'
                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl border ${
                    isPendingPayments && hasPendingItems
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
                      : 'bg-slate-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-700 dark:text-zinc-300'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {hasPendingItems && (
                    <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Menunggu
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">{stat.value}</div>
                <div className="text-xs text-slate-500 dark:text-zinc-400">{stat.label}</div>
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

      {/* Revenue Growth Chart */}
      <div className="mt-8">
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs revenue-chart">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Pertumbuhan Pendapatan</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Pendapatan bulanan riil terkonfirmasi (Jan 2026 - Sekarang)</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4">
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Total Pendapatan Terkumpul</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Rp {totalRevenue.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4">
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Perubahan MoM</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold tracking-tight ${revenueChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                </p>
                {revenueChange >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                )}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4">
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Data Periode</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{revenueData.length} Bulan</p>
            </div>
          </div>

          {/* Stock-Style Chart */}
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-slate-500 dark:text-zinc-500">Loading chart...</div>
            </div>
          ) : revenueData.length === 0 ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <DollarSign className="w-12 h-12 text-slate-400 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-zinc-500">No revenue data available</p>
                <p className="text-slate-400 dark:text-zinc-600 text-sm">Data will appear from January 2026 onwards</p>
              </div>
            </div>
          ) : (
            <div className="h-96 bg-slate-50/50 dark:bg-zinc-950/40 rounded-xl p-4 border border-gray-100 dark:border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="rgba(148,163,184,0.15)" 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="label" 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickLine={{ stroke: 'rgba(148,163,184,0.2)' }}
                    axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickLine={{ stroke: 'rgba(148,163,184,0.2)' }}
                    axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #ffffff)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                      padding: '10px 14px',
                      color: '#0f172a'
                    }}
                    labelStyle={{ 
                      color: '#64748b', 
                      fontSize: '12px',
                      marginBottom: '4px'
                    }}
                    formatter={(value: any) => [
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold" key="value">
                        Rp {value.toLocaleString('id-ID')}
                      </span>, 
                      'Pendapatan'
                    ]}
                    cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
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
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs activity-feed">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Aktivitas Sistem</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <ActivityItemSkeleton key={i} />)}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-zinc-500">Tidak ada aktivitas terbaru.</p>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {activities.map((activity) => {
                const Icon = activity.icon;
                const timeAgo = getTimeAgo(activity.timestamp);
                const isPaymentPending = activity.type === 'payment_pending';
                
                const content = (
                  <div
                    className={`flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border transition-colors ${
                      isPaymentPending 
                        ? 'hover:bg-amber-50 dark:hover:bg-amber-500/10 border-amber-500/30 cursor-pointer' 
                        : 'hover:bg-slate-100 dark:hover:bg-white/10 border-gray-100 dark:border-white/5'
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-slate-100 dark:bg-white/5 ${activity.color} ${
                      isPaymentPending ? 'animate-pulse' : ''
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 dark:text-zinc-200">
                        <span className="font-semibold text-slate-900 dark:text-white">{activity.user}</span>
                        {activity.type === 'registration' && ' bergabung ke sistem'}
                        {activity.type === 'update' && ' memperbarui profil'}
                        {activity.type === 'payment_pending' && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium"> mengirim bukti pembayaran</span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">{timeAgo}</p>
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
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs top-performers">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Performa Terbaik</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <ActivityItemSkeleton key={i} />)}
            </div>
          ) : topPerformers.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-zinc-500">Belum ada data performa.</p>
          ) : (
            <div className="space-y-3.5">
              {topPerformers.map((member, index) => {
                const isWin = member.type === 'win';
                const percentage = (member.streak / 10) * 100;
                return (
                  <div key={member.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 dark:text-zinc-500 text-xs w-4">#{index + 1}</span>
                        <span className="text-slate-800 dark:text-zinc-200 font-medium">{member.name}</span>
                      </div>
                      <span className={`text-xs font-semibold ${
                        isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {member.streak} {isWin ? 'Menang' : 'Kalah'} Beruntun
                      </span>
                    </div>
                    <div className="relative h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                          isWin ? 'bg-emerald-500' : 'bg-rose-500'
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
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs active-players">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Pemain Paling Aktif</h2>
          </div>
          {loading ? (
            <p className="text-xs text-slate-500 dark:text-zinc-500">Memuat data...</p>
          ) : mostActivePlayers.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-zinc-500">Belum ada data pertandingan.</p>
          ) : (
            <div className="space-y-3.5">
              {mostActivePlayers.map((player, index) => {
                const maxMatches = mostActivePlayers[0]?.matches || 10;
                const percentage = (player.matches / maxMatches) * 100;
                return (
                  <div key={player.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 dark:text-zinc-500 text-xs w-4">#{index + 1}</span>
                        <span className="text-slate-800 dark:text-zinc-200 font-medium">{player.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                        {player.matches} Pertandingan
                      </span>
                    </div>
                    <div className="relative h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all bg-sky-500"
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

      {/* QRIS Shortcut Modal */}
      {showQrisModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowQrisModal(false)}
        >
          <div 
            className="relative max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    QRIS Komunitas DLOB
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Shortcut cepat kode pembayaran member
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQrisModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="w-full py-4 flex flex-col items-center justify-center">
              {qrisLoading ? (
                <div className="py-12 flex flex-col items-center gap-2 text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs">Memuat barcode QRIS...</span>
                </div>
              ) : qrisImageUrl ? (
                <div className="flex flex-col items-center space-y-3 w-full">
                  <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm max-w-[280px] w-full flex items-center justify-center">
                    <Image
                      src={qrisImageUrl}
                      alt="QRIS Komunitas"
                      width={280}
                      height={280}
                      className="w-full h-auto object-contain rounded-lg"
                      unoptimized
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>QRIS Siap Dipindai Member</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                    Belum ada gambar QRIS yang diupload untuk komunitas.
                  </p>
                  <Link
                    href="/admin/settings"
                    onClick={() => setShowQrisModal(false)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4382C8] hover:underline pt-1"
                  >
                    <span>Upload di Pengaturan Admin</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="w-full pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
              <Link
                href="/admin/settings"
                onClick={() => setShowQrisModal(false)}
                className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1"
              >
                <span>Kelola di Pengaturan</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              <button
                type="button"
                onClick={() => setShowQrisModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

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
