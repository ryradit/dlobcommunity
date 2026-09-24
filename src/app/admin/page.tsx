'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Zap, TrendingUp, Shield, Activity, UserPlus, Edit, Award,
  Target, DollarSign, TrendingDown, Bell, HelpCircle, ShoppingBag,
  ChevronRight, QrCode, X, ExternalLink, Loader2
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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

const spring = { type: 'spring', stiffness: 320, damping: 32 } as const;

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return time.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export default function AdminDashboardPage() {
  const { user, isSuperAdmin } = useAuth();
  const pathname = usePathname();
  const [stats, setStats] = useState<AdminStats>({
    totalMembers: 0, totalAdmins: 0, activeProjects: 0, pendingApprovals: 0, events: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [topPerformers, setTopPerformers] = useState<PerformanceMember[]>([]);
  const [mostActivePlayers, setMostActivePlayers] = useState<{ id: string; name: string; matches: number }[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [branchStats, setBranchStats] = useState<{ cikupaMembers: number; cikupaPending: number } | null>(null);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [qrisImageUrl, setQrisImageUrl] = useState<string | null>(null);
  const [qrisLoading, setQrisLoading] = useState(false);
  const reduce = useReducedMotion();

  const tutorialSteps = getTutorialSteps('dashboard');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('admin-dashboard', tutorialSteps);

  const isOwner =
    user?.email?.toLowerCase().includes('ryradit') ||
    user?.user_metadata?.full_name?.toLowerCase().includes('ryan radityatama') ||
    user?.user_metadata?.name?.toLowerCase().includes('ryan radityatama') ||
    user?.email === 'ryradit@gmail.com';

  useEffect(() => {
    if (!isSuperAdmin) return;
    (async () => {
      const [membersRes, pendingRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('branch_id', 'dlob-cikupa').eq('is_active', true),
        supabase.from('match_members').select('id', { count: 'exact', head: true }).eq('branch_id', 'dlob-cikupa').eq('payment_status', 'pending'),
      ]);
      setBranchStats({ cikupaMembers: membersRes.count ?? 0, cikupaPending: pendingRes.count ?? 0 });
    })();
  }, [isSuperAdmin]);

  useEffect(() => {
    let isMounted = true;
    setQrisLoading(true);
    fetch('/api/payment-info')
      .then(res => res.json())
      .then(data => { if (isMounted && data?.qrisImageUrl) setQrisImageUrl(data.qrisImageUrl); })
      .catch(err => console.error('Failed to fetch QRIS:', err))
      .finally(() => { if (isMounted) setQrisLoading(false); });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchAdminStats() {
      if (!mounted) return;
      setLoading(true);

      const [statsResult, activitiesResult, matchesResult, revenueResult, pendingPaymentsResult] = await Promise.allSettled([
        cachedQuery('admin-profile-counts', async () =>
          Promise.allSettled([
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
          ]), 30000
        ),
        cachedQuery('admin-recent-profiles', async () => {
          const result = await supabase.from('profiles').select('id, full_name, created_at, updated_at').order('created_at', { ascending: false }).limit(10);
          return result;
        }, 30000),
        cachedQuery('admin-matches-data', async () => {
          const result = await supabase.from('matches').select('team1_player1, team1_player2, team2_player1, team2_player2, winner, match_date, created_at').order('match_date', { ascending: false });
          return result;
        }, 60000),
        cachedQuery('admin-revenue-monthly-v2', async () => {
          const matchMembersResult = await supabase.from('match_members').select('total_amount, paid_at, matches(match_date)').eq('payment_status', 'paid');
          const membershipsResult = await supabase.from('memberships').select('amount, paid_at').eq('payment_status', 'paid');
          return { matchMembers: matchMembersResult, memberships: membershipsResult };
        }, 60000),
        cachedQuery('admin-pending-payments', async () => {
          const matchPayments = await supabase.from('match_members').select('id, member_name, payment_proof, created_at, match_id').eq('payment_status', 'pending').not('payment_proof', 'is', null).order('created_at', { ascending: false }).limit(10);
          const membershipPayments = await supabase.from('memberships').select('id, member_name, payment_proof, created_at').eq('payment_status', 'pending').not('payment_proof', 'is', null).order('created_at', { ascending: false }).limit(10);
          return { matchPayments, membershipPayments };
        }, 30000),
      ]);

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

      if (mounted && activitiesResult.status === 'fulfilled') {
        const result = activitiesResult.value as { data: any[] | null; error: any };
        const recentProfiles = result.data;
        const activityList: ActivityItem[] = [];
        if (recentProfiles) {
          recentProfiles.forEach((profile) => {
            activityList.push({ id: `reg-${profile.id}`, type: 'registration', user: profile.full_name || 'Pengguna Baru', timestamp: profile.created_at, icon: UserPlus, color: 'text-blue-400' });
            if (profile.updated_at && profile.updated_at !== profile.created_at) {
              const updatedDate = new Date(profile.updated_at);
              const createdDate = new Date(profile.created_at);
              if (updatedDate.getTime() - createdDate.getTime() > 1000) {
                activityList.push({ id: `upd-${profile.id}`, type: 'update', user: profile.full_name || 'Pengguna', timestamp: profile.updated_at, icon: Edit, color: 'text-purple-400' });
              }
            }
          });
        }
        if (pendingPaymentsResult.status === 'fulfilled') {
          const payments = pendingPaymentsResult.value as { matchPayments: { data: any[] | null }; membershipPayments: { data: any[] | null } };
          let pendingCount = 0;
          payments.matchPayments.data?.forEach((p) => {
            if (p.payment_proof !== 'CASH_PAYMENT') { activityList.push({ id: `payment-match-${p.id}`, type: 'payment_pending', user: `${p.member_name} - Match Payment`, timestamp: p.created_at, icon: Bell, color: 'text-amber-400' }); pendingCount++; }
          });
          payments.membershipPayments.data?.forEach((p) => {
            if (p.payment_proof !== 'CASH_PAYMENT') { activityList.push({ id: `payment-membership-${p.id}`, type: 'payment_pending', user: `${p.member_name} - Membership Payment`, timestamp: p.created_at, icon: Bell, color: 'text-amber-400' }); pendingCount++; }
          });
          setPendingPaymentsCount(pendingCount);
        }
        activityList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(activityList.slice(0, 8));
      }

      if (mounted && matchesResult.status === 'fulfilled') {
        const result = matchesResult.value as { data: any[] | null; error: any };
        const matchesData = result.data;
        if (matchesData && matchesData.length > 0) {
          const playerMatches: { [key: string]: any[] } = {};
          matchesData.forEach((match) => {
            [match.team1_player1, match.team1_player2, match.team2_player1, match.team2_player2].forEach((playerName) => {
              if (!playerName) return;
              if (!playerMatches[playerName]) playerMatches[playerName] = [];
              const isTeam1 = playerName === match.team1_player1 || playerName === match.team1_player2;
              const isWinner = (isTeam1 && match.winner === 'team1') || (!isTeam1 && match.winner === 'team2');
              playerMatches[playerName].push({ date: match.match_date || match.created_at, isWinner });
            });
          });

          const performers: PerformanceMember[] = [];
          Object.keys(playerMatches).forEach((playerName, index) => {
            const matches = playerMatches[playerName].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (matches.length > 0) {
              let currentStreak = 1;
              const latestResult = matches[0].isWinner;
              for (let i = 1; i < matches.length; i++) {
                if (matches[i].isWinner === latestResult) currentStreak++;
                else break;
              }
              performers.push({ id: `perf-${index}`, name: playerName, streak: currentStreak, type: latestResult ? 'win' : 'loss' });
            }
          });
          performers.sort((a, b) => a.type === b.type ? b.streak - a.streak : a.type === 'win' ? -1 : 1);
          setTopPerformers(performers.slice(0, 5));

          const playerMatchCount: { [key: string]: number } = {};
          matchesData.forEach((match) => {
            [match.team1_player1, match.team1_player2, match.team2_player1, match.team2_player2].forEach((playerName) => {
              if (!playerName) return;
              playerMatchCount[playerName] = (playerMatchCount[playerName] || 0) + 1;
            });
          });
          setMostActivePlayers(Object.entries(playerMatchCount).map(([name, matches], i) => ({ id: `active-${i}`, name, matches })).sort((a, b) => b.matches - a.matches).slice(0, 5));
        }
      }

      if (mounted && revenueResult.status === 'fulfilled') {
        const { value: rv } = revenueResult;
        if (rv?.matchMembers?.data && rv?.memberships?.data) processMonthlyRevenue(rv.matchMembers.data, rv.memberships.data);
      }

      if (mounted) setLoading(false);
    }

    fetchAdminStats();
    return () => { mounted = false; };
  }, [pathname]);

  const processMonthlyRevenue = (matchMembers: any[], memberships: any[]) => {
    const now = new Date();
    const monthlyData: Record<string, number> = {};
    let year = 2026, month = 0;
    while (year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth())) {
      monthlyData[`${year}-${String(month + 1).padStart(2, '0')}`] = 0;
      month++;
      if (month > 11) { month = 0; year++; }
    }
    const allRevenue = [
      ...matchMembers.map(m => ({ date: (m.matches as any)?.match_date || m.paid_at, amount: m.total_amount || 0 })),
      ...memberships.map(m => ({ date: m.paid_at, amount: m.amount || 0 })),
    ].filter(r => r.date);
    allRevenue.forEach(r => {
      const date = new Date(r.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (key in monthlyData) monthlyData[key] += r.amount;
    });
    const chartData: RevenueData[] = Object.entries(monthlyData).map(([key, amount]) => {
      const [y, m] = key.split('-');
      return { month: key, label: new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }), amount };
    });
    setRevenueData(chartData);
    const total = allRevenue.reduce((s, r) => s + r.amount, 0);
    setTotalRevenue(total);
    if (chartData.length >= 2) {
      const last = chartData[chartData.length - 1].amount;
      const prev = chartData[chartData.length - 2].amount;
      setRevenueChange(prev > 0 ? ((last - prev) / prev) * 100 : 0);
    }
  };

  const statsDisplay = [
    { label: 'Total Anggota', value: loading ? '...' : stats.totalMembers.toLocaleString(), colorBar: 'bg-[#4382C8]' },
    { label: 'Admin', value: loading ? '...' : stats.totalAdmins.toLocaleString(), colorBar: 'bg-slate-400' },
    { label: 'Pengguna Aktif', value: loading ? '...' : stats.activeProjects.toLocaleString(), colorBar: 'bg-violet-400' },
    {
      label: 'Pembayaran Pending',
      value: loading ? '...' : pendingPaymentsCount.toLocaleString(),
      colorBar: pendingPaymentsCount > 0 ? 'bg-amber-400' : 'bg-slate-400',
      href: pendingPaymentsCount > 0 ? '/admin/pembayaran' : undefined,
      alert: pendingPaymentsCount > 0,
    },
    { label: 'Total Pengguna', value: loading ? '...' : stats.events.toLocaleString(), colorBar: 'bg-emerald-400' },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#09090e] transition-colors duration-300">
      {/* ── Aurora ambient ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="aurora-a absolute top-[-5%] right-[5%] w-[40vw] h-[40vw] rounded-full bg-[#4382C8]/8 dark:bg-[#4382C8]/6 blur-[110px]" />
        <div className="aurora-b absolute bottom-[10%] left-[0%] w-[35vw] h-[35vw] rounded-full bg-[#7c5cbf]/6 dark:bg-[#7c5cbf]/5 blur-[100px]" />
        <div className="aurora-c absolute top-[40%] left-[40%] w-[25vw] h-[25vw] rounded-full bg-emerald-500/5 blur-[90px]" />
      </div>

      <div className="relative z-10 py-6 lg:py-8 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 space-y-6">
        {/* ── Page Header ── */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.04 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Dashboard Admin
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Selamat datang kembali, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowQrisModal(true)}
              className="p-2 rounded-xl glass-premium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Shortcut QRIS"
            >
              <QrCode className="w-4 h-4" strokeWidth={1.8} />
              <span className="hidden sm:inline">QRIS</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={toggleTutorial}
              className="p-2 rounded-xl glass-premium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Panduan fitur"
            >
              <HelpCircle className="w-4 h-4" strokeWidth={1.8} />
            </motion.button>
          </div>
        </motion.div>

        {/* ── System Health ── */}
        <SystemHealthMonitor />

        {/* ── Super Admin: Branch Overview ── */}
        {isSuperAdmin && branchStats !== null && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="glass-premium p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">DLOB Cikupa (DLBC)</p>
                <BranchBadge branchId="dlob-cikupa" branchName="DLBC" accentColor="#10B981" size="sm" />
              </div>
              <Link href="/cikupa/admin" className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                Buka Admin DLBC <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
                <p className="text-[11px] text-slate-500 dark:text-slate-500 mb-1">Anggota Aktif</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{branchStats.cikupaMembers}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
                <p className="text-[11px] text-slate-500 dark:text-slate-500 mb-1">Tagihan Pending</p>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400">{branchStats.cikupaPending}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Owner Exclusive: New Batch Recap ── */}
        {isOwner && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.06 }}
            className="glass-premium p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.8} />
                <p className="text-sm font-bold text-slate-900 dark:text-white">Rekap Pre-Order Jersey New Batch 2026</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">Owner</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pantau total jersey terpesan, konveksi, dan status pemesanan</p>
            </div>
            <Link
              href="/admin/rekap-new-batch"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors flex items-center gap-1.5 shrink-0"
            >
              Buka Rekapitulasi <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        )}

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {loading ? (
            [...Array(5)].map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            statsDisplay.map((stat, i) => {
              const card = (
                <motion.div
                  key={stat.label}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: i * 0.04 }}
                  className={`glass-premium stat-card-glow p-4 ${stat.alert ? 'ring-1 ring-amber-400/30' : ''}`}
                >
                  <div className={`h-0.5 w-8 rounded-full mb-3 ${stat.colorBar}`} />
                  <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
                  {stat.alert && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">Perlu tindakan</p>
                  )}
                </motion.div>
              );
              return stat.href ? <Link key={stat.label} href={stat.href}>{card}</Link> : <div key={stat.label}>{card}</div>;
            })
          )}
        </div>

        {/* ── Revenue Chart ── */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.22 }}
          className="glass-premium p-5 sm:p-6 revenue-chart"
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Pertumbuhan Pendapatan</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Jan 2026 hingga sekarang</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-slate-400 dark:text-slate-500">Total</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Rp {(totalRevenue / 1000000).toFixed(1)}M</p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${revenueChange >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                {revenueChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <span className="text-sm text-slate-400 dark:text-slate-500">Memuat grafik...</span>
            </div>
          ) : revenueData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2">
              <DollarSign className="w-8 h-8 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
              <p className="text-sm text-slate-400 dark:text-slate-500">Data pendapatan belum tersedia</p>
            </div>
          ) : (
            <div className="h-64 rounded-xl overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" height={60} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '8px 12px', color: '#0f172a' }}
                    formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                    cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#revenueGradient)" dot={false} activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} animationDuration={1200} animationEasing="ease-in-out" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* ── 3-column lower grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Activity Feed */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.26 }}
            className="glass-premium p-5 activity-feed"
          >
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Aktivitas Sistem</h2>
            {loading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <ActivityItemSkeleton key={i} />)}</div>
            ) : activities.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">Tidak ada aktivitas terbaru.</p>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto no-scrollbar">
                {activities.map((activity) => {
                  const Icon = activity.icon;
                  const isPending = activity.type === 'payment_pending';
                  const content = (
                    <div className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-colors table-row-hover ${isPending ? 'ring-1 ring-amber-400/20' : ''}`}>
                      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${activity.color} ${isPending ? 'animate-pulse' : ''}`} strokeWidth={2} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                          <span className="font-semibold text-slate-900 dark:text-white">{activity.user}</span>
                          {activity.type === 'registration' && ' bergabung'}
                          {activity.type === 'update' && ' memperbarui profil'}
                          {activity.type === 'payment_pending' && <span className="text-amber-600 dark:text-amber-400"> mengirim bukti bayar</span>}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{getTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  );
                  return isPending ? <Link key={activity.id} href="/admin/pembayaran">{content}</Link> : <div key={activity.id}>{content}</div>;
                })}
              </div>
            )}
          </motion.div>

          {/* Top Performers */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.3 }}
            className="glass-premium p-5 top-performers"
          >
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Performa Terbaik</h2>
            {loading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <ActivityItemSkeleton key={i} />)}</div>
            ) : topPerformers.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">Belum ada data performa.</p>
            ) : (
              <div className="space-y-3.5">
                {topPerformers.map((member, index) => {
                  const isWin = member.type === 'win';
                  return (
                    <div key={member.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 w-4">#{index + 1}</span>
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[100px]">{member.name}</span>
                        </div>
                        <span className={`text-[11px] font-semibold ${isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {member.streak} {isWin ? 'W' : 'L'}
                        </span>
                      </div>
                      <div className="h-1 bg-slate-100 dark:bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full stat-bar-fill ${isWin ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min((member.streak / 10) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Most Active Players */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.34 }}
            className="glass-premium p-5 active-players"
          >
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Pemain Paling Aktif</h2>
            {loading ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">Memuat...</p>
            ) : mostActivePlayers.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">Belum ada data pertandingan.</p>
            ) : (
              <div className="space-y-3.5">
                {mostActivePlayers.map((player, index) => {
                  const maxMatches = mostActivePlayers[0]?.matches || 10;
                  return (
                    <div key={player.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 w-4">#{index + 1}</span>
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[100px]">{player.name}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#4382C8] dark:text-[#7eb6f0]">{player.matches}x</span>
                      </div>
                      <div className="h-1 bg-slate-100 dark:bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#4382C8] stat-bar-fill"
                          style={{ width: `${(player.matches / maxMatches) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── QRIS Modal ── */}
      <AnimatePresence>
        {showQrisModal && (
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 sm:p-0"
            onClick={() => setShowQrisModal(false)}
          >
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ ...spring, stiffness: 380 }}
              onClick={e => e.stopPropagation()}
              className="glass-premium max-w-sm w-full p-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/[0.07] mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">QRIS Komunitas DLOB</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Shortcut kode pembayaran member</p>
                </div>
                <button onClick={() => setShowQrisModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors">
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>

              <div className="flex flex-col items-center">
                {qrisLoading ? (
                  <div className="py-10 flex flex-col items-center gap-2 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs">Memuat QRIS...</span>
                  </div>
                ) : qrisImageUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 max-w-[240px] w-full">
                      <Image src={qrisImageUrl} alt="QRIS" width={240} height={240} className="w-full h-auto object-contain rounded-lg" unoptimized />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      QRIS Siap Dipindai Member
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <QrCode className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" strokeWidth={1.5} />
                    <p className="text-xs text-slate-400 dark:text-slate-500">Belum ada QRIS yang diupload</p>
                    <Link href="/admin/settings" onClick={() => setShowQrisModal(false)} className="text-xs font-semibold text-[#4382C8] hover:underline">
                      Upload di Pengaturan
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-white/[0.07] mt-4">
                <Link href="/admin/settings" onClick={() => setShowQrisModal(false)} className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors">
                  Kelola <ExternalLink className="w-3 h-3" />
                </Link>
                <button onClick={() => setShowQrisModal(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.14] transition-colors">
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TutorialOverlay steps={tutorialSteps} isActive={isTutorialActive} onClose={closeTutorial} tutorialKey="admin-dashboard" />
    </div>
  );
}
