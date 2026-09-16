'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, Zap, TrendingUp, Calendar, Shield, Activity, UserPlus, Edit, 
  Award, Target, DollarSign, TrendingDown, Bell, HelpCircle, ShoppingBag, 
  ChevronRight, QrCode, X, ExternalLink, Loader2, CreditCard, Sparkles,
  BarChart3, Trophy, Printer, AlertTriangle
} from 'lucide-react';
import Image from 'next/image';
import { StatCardSkeleton, ActivityItemSkeleton } from '@/components/LoadingSkeletons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SystemHealthMonitor from '@/components/admin/SystemHealthMonitor';
import BranchBadge from '@/components/BranchBadge';
import BranchSelector from '@/components/BranchSelector';
import DlbcSessionSheetPrintModal from '@/components/DlbcSessionSheetPrintModal';

const BRANCH_ID = 'dlob-cikupa';
const ACCENT = '#10B981';

interface AdminStats {
  totalMembers: number;
  totalAdmins: number;
  totalMatches: number;
  pendingPayments: number;
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

export default function CikupaAdminPage() {
  const { user, isSuperAdmin } = useAuth();
  const pathname = usePathname();
  const [stats, setStats] = useState<AdminStats>({
    totalMembers: 0,
    totalAdmins: 0,
    totalMatches: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [topPerformers, setTopPerformers] = useState<PerformanceMember[]>([]);
  const [mostActivePlayers, setMostActivePlayers] = useState<{ id: string; name: string; matches: number }[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);

  // QRIS shortcut modal state
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [qrisImageUrl, setQrisImageUrl] = useState<string | null>(null);
  const [qrisLoading, setQrisLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Fetch QRIS image for quick shortcut specifically for DLBC
  useEffect(() => {
    let isMounted = true;
    setQrisLoading(true);
    fetch('/api/payment-info?branch=dlob-cikupa')
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setQrisImageUrl(data?.qrisImageUrl || null);
        }
      })
      .catch(err => console.error('Failed to fetch DLBC QRIS image:', err))
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

      try {
        const now = new Date();

        // 1. Fetch branch stats in parallel
        const [membersRes, adminsRes, matchesRes, pendingMatchRes, pendingMemRes, recentProfilesRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('branch_id', BRANCH_ID).eq('is_active', true),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('branch_id', BRANCH_ID).or('role.eq.admin,role.eq.branch_admin'),
          supabase.from('matches').select('id', { count: 'exact', head: true }).eq('branch_id', BRANCH_ID),
          supabase.from('match_members').select('id, member_name, created_at, payment_proof').eq('branch_id', BRANCH_ID).eq('payment_status', 'pending').limit(15),
          supabase.from('memberships').select('id, member_name, created_at, payment_proof').eq('branch_id', BRANCH_ID).eq('payment_status', 'pending').limit(15),
          supabase.from('profiles').select('id, full_name, created_at, updated_at').eq('branch_id', BRANCH_ID).order('created_at', { ascending: false }).limit(10),
        ]);

        const pendingTotal = (pendingMatchRes.data?.length || 0) + (pendingMemRes.data?.length || 0);

        if (mounted) {
          setStats({
            totalMembers: membersRes.count ?? 0,
            totalAdmins: adminsRes.count ?? 0,
            totalMatches: matchesRes.count ?? 0,
            pendingPayments: pendingTotal,
          });
        }

        // 2. Build live activity feed
        const activityList: ActivityItem[] = [];

        if (recentProfilesRes.data) {
          recentProfilesRes.data.forEach(p => {
            activityList.push({
              id: `reg-${p.id}`,
              type: 'registration',
              user: p.full_name || 'Member Baru DLBC',
              timestamp: p.created_at,
              icon: UserPlus,
              color: 'text-emerald-400',
            });
          });
        }

        if (pendingMatchRes.data) {
          pendingMatchRes.data.forEach(p => {
            activityList.push({
              id: `match-pay-${p.id}`,
              type: 'payment_pending',
              user: `${p.member_name} - Match DLBC`,
              timestamp: p.created_at,
              icon: Bell,
              color: 'text-amber-400',
            });
          });
        }

        if (pendingMemRes.data) {
          pendingMemRes.data.forEach(p => {
            activityList.push({
              id: `mem-pay-${p.id}`,
              type: 'payment_pending',
              user: `${p.member_name} - Membership DLBC`,
              timestamp: p.created_at,
              icon: Bell,
              color: 'text-purple-400',
            });
          });
        }

        activityList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (mounted) setActivities(activityList.slice(0, 8));

        // 3. Fetch 6 months revenue for DLBC
        const chartMonths: RevenueData[] = [];
        let curTotal = 0;
        let lastMonthRev = 0;
        let prevMonthRev = 0;

        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const start = d.toISOString();
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();

          const [matchPaidRes, memPaidRes] = await Promise.all([
            supabase.from('match_members').select('total_amount').eq('branch_id', BRANCH_ID).eq('payment_status', 'paid').gte('paid_at', start).lt('paid_at', end),
            supabase.from('memberships').select('amount').eq('branch_id', BRANCH_ID).eq('payment_status', 'paid').gte('paid_at', start).lt('paid_at', end),
          ]);

          const mSum = (matchPaidRes.data || []).reduce((s, r) => s + (r.total_amount || 0), 0);
          const memSum = (memPaidRes.data || []).reduce((s, r) => s + (r.amount || 0), 0);
          const monthRev = mSum + memSum;

          chartMonths.push({
            month: d.toLocaleDateString('id-ID', { month: 'short' }),
            label: `${d.toLocaleDateString('id-ID', { month: 'short' })} ${d.getFullYear()}`,
            amount: monthRev,
          });

          if (i === 0) {
            lastMonthRev = monthRev;
            curTotal += monthRev;
          } else if (i === 1) {
            prevMonthRev = monthRev;
          }
        }

        if (mounted) {
          setRevenueData(chartMonths);
          setTotalRevenue(lastMonthRev);
          if (prevMonthRev > 0) {
            setRevenueChange(Math.round(((lastMonthRev - prevMonthRev) / prevMonthRev) * 100));
          } else {
            setRevenueChange(lastMonthRev > 0 ? 100 : 0);
          }
        }

        // 4. Fetch Match Data for Top Performers & Most Active in DLBC
        const { data: dlbcMatches } = await supabase
          .from('matches')
          .select('id, team1_player1, team1_player2, team2_player1, team2_player2, team1_score, team2_score, winner')
          .eq('branch_id', BRANCH_ID)
          .order('match_date', { ascending: false })
          .limit(100);

        const playerMatchCount: Record<string, number> = {};
        const playerStreaks: Record<string, { name: string; currentStreak: number; type: 'win' | 'loss' }> = {};

        if (dlbcMatches && dlbcMatches.length > 0) {
          dlbcMatches.forEach(m => {
            const players = [m.team1_player1, m.team1_player2, m.team2_player1, m.team2_player2].filter(Boolean);
            players.forEach(p => {
              const name = p.trim();
              playerMatchCount[name] = (playerMatchCount[name] || 0) + 1;
            });

            if (m.winner) {
              const winningPlayers = m.winner === 'team1' ? [m.team1_player1, m.team1_player2] : [m.team2_player1, m.team2_player2];
              winningPlayers.filter(Boolean).forEach(p => {
                const name = p.trim();
                if (!playerStreaks[name]) {
                  playerStreaks[name] = { name, currentStreak: 1, type: 'win' };
                } else if (playerStreaks[name].type === 'win') {
                  playerStreaks[name].currentStreak += 1;
                }
              });
            }
          });
        }

        // Top 3 performers
        const sortedPerformers = Object.values(playerStreaks)
          .filter(p => p.currentStreak >= 1)
          .sort((a, b) => b.currentStreak - a.currentStreak)
          .slice(0, 3)
          .map((p, idx) => ({ id: `perf-${idx}`, name: p.name, streak: p.currentStreak, type: p.type }));

        // Top 5 active
        const sortedActive = Object.entries(playerMatchCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count], idx) => ({ id: `act-${idx}`, name, matches: count }));

        if (mounted) {
          setTopPerformers(sortedPerformers);
          setMostActivePlayers(sortedActive);
        }

      } catch (err) {
        console.error('Error in fetchAdminStats:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAdminStats();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/80 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-400" />
              Admin Dashboard DLBC
            </h1>
            <BranchBadge branchId={BRANCH_ID} />
          </div>
          <p className="text-sm text-zinc-400">
            Pusat komando & monitoring operasional cabang Cikupa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <BranchSelector />
          <button
            onClick={() => setShowQrisModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            QRIS DLBC
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/cikupa/admin/members" className="group">
          <div className="p-5 rounded-2xl border bg-zinc-900/60 border-white/10 group-hover:border-emerald-500/40 transition-all relative overflow-hidden">
            <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400">Anggota DLBC</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{stats.totalMembers}</div>
            <p className="text-xs text-emerald-400 mt-2 font-semibold flex items-center gap-1">
              Kelola anggota <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </Link>

        <Link href="/cikupa/admin/pembayaran" className="group">
          <div className="p-5 rounded-2xl border bg-zinc-900/60 border-white/10 group-hover:border-amber-500/40 transition-all relative overflow-hidden">
            <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400">Menunggu Bayar</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Bell className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-400">{stats.pendingPayments}</div>
            <p className="text-xs text-amber-400 mt-2 font-semibold flex items-center gap-1">
              Validasi bayar <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </Link>

        <Link href="/cikupa/admin/analitik" className="group">
          <div className="p-5 rounded-2xl border bg-zinc-900/60 border-white/10 group-hover:border-blue-500/40 transition-all relative overflow-hidden">
            <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400">Pertandingan DLBC</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{stats.totalMatches}</div>
            <p className="text-xs text-blue-400 mt-2 font-semibold flex items-center gap-1">
              Skor & Analitik <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </Link>

        <Link href="/cikupa/admin/keuangan" className="group">
          <div className="p-5 rounded-2xl border bg-zinc-900/60 border-white/10 group-hover:border-purple-500/40 transition-all relative overflow-hidden">
            <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400">Kas Masuk Bulan Ini</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-white">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-purple-400 mt-2 font-semibold flex items-center gap-1">
              Buku Kas DLBC <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </Link>
      </div>

      {/* Revenue Chart Section */}
      <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Tren Pendapatan DLBC (6 Bulan Terakhir)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Pertumbuhan pemasukan match & membership cabang Cikupa
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-zinc-400">Bulan Ini</div>
              <div className="text-base font-black text-emerald-400">
                Rp {totalRevenue.toLocaleString('id-ID')}
              </div>
            </div>
            <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-0.5 ${
              revenueChange >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {revenueChange >= 0 ? '+' : ''}{revenueChange}%
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dlbcRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACCENT} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#71717a" 
                fontSize={11} 
                tickLine={false} 
                tickFormatter={v => `Rp ${(v / 1000).toFixed(0)}k`} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  borderColor: '#27272a',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px'
                }}
                formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, 'Pendapatan']}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke={ACCENT} 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#dlbcRevenueGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Live Activity Feed + Top Performers + Most Active */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Live Activity Feed */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              Aktivitas Terkini DLBC
            </h3>
            <span className="text-[11px] text-zinc-500 font-medium">Real-time Cikupa</span>
          </div>

          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs">
                Belum ada aktivitas tercatat di cabang Cikupa
              </div>
            ) : (
              activities.map(act => {
                const Icon = act.icon;
                return (
                  <div key={act.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-zinc-800 ${act.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{act.user}</p>
                        <p className="text-[11px] text-zinc-400">
                          {act.type === 'registration' && 'Pendaftaran Akun Anggota'}
                          {act.type === 'payment_pending' && 'Menunggu Konfirmasi Bukti'}
                          {act.type === 'update' && 'Pembaruan Profil'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(act.timestamp).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Performers & Most Active Players */}
        <div className="space-y-5">
          {/* Top Performers */}
          <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Win Streak Tertinggi DLBC
              </h3>
            </div>

            <div className="space-y-2.5">
              {topPerformers.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">Belum ada streak tercatat</p>
              ) : (
                topPerformers.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/50 border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-zinc-300 text-black' : 'bg-amber-700 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white">{p.name}</span>
                    </div>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      🔥 {p.streak} Win
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Most Active */}
          <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Pemain Paling Aktif DLBC
              </h3>
            </div>

            <div className="space-y-2">
              {mostActivePlayers.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">Belum ada data match</p>
              ) : (
                mostActivePlayers.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-zinc-300 font-semibold">{p.name}</span>
                    <span className="font-bold text-emerald-400">{p.matches} Match</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          Aksi Cepat Admin DLBC
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/cikupa/admin/pembayaran"
            className="p-3.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-200">Input Match & Kasir</span>
          </Link>

          <Link
            href="/cikupa/admin/members"
            className="p-3.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-200">Kelola Anggota</span>
          </Link>

          <Link
            href="/cikupa/admin/team-optimizer"
            className="p-3.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-200">Racik Tim Pintar</span>
          </Link>

          <Link
            href="/cikupa/admin/member-statistik"
            className="p-3.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-200">Statistik Member</span>
          </Link>

          <Link
            href="/cikupa/admin/analitik"
            className="p-3.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-200">Skor & Analitik</span>
          </Link>

          <Link
            href="/cikupa/admin/keuangan"
            className="p-3.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-200">Buku Kas DLBC</span>
          </Link>

          <button
            onClick={() => setShowPrintModal(true)}
            className="p-3.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Printer className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-200">Cetak Lembar Sesi</span>
          </button>

          <button
            onClick={() => setShowQrisModal(true)}
            className="p-3.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-200">Barcode QRIS</span>
          </button>
        </div>
      </div>

      {/* System Health Monitor Scoped */}
      <SystemHealthMonitor />

      {/* QRIS Modal */}
      {showQrisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                QRIS Resmi DLBC (Cikupa)
              </h3>
              <button
                onClick={() => setShowQrisModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-800/80 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center min-h-[220px]">
              {qrisLoading ? (
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              ) : qrisImageUrl ? (
                <div className="bg-white p-3 rounded-xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrisImageUrl} alt="QRIS DLBC" className="max-h-64 object-contain mx-auto" />
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1">
                      Belum Dikonfigurasi
                    </span>
                    <h4 className="text-xs font-bold text-white">QRIS DLBC Belum Aktif</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 max-w-[240px] mx-auto leading-relaxed">
                      Metode QRIS khusus DLBC Cikupa belum dikonfigurasi. Member saat ini melakukan pembayaran via Bank Transfer / Tunai.
                    </p>
                  </div>
                  <Link
                    href="/cikupa/admin/settings"
                    onClick={() => setShowQrisModal(false)}
                    aria-label="Konfigurasi QRIS di Pengaturan"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 transition-all"
                  >
                    <span>Konfigurasi QRIS di Pengaturan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            <p className="text-[11px] text-zinc-400">
              {qrisImageUrl ? 'Gunakan barcode ini untuk verifikasi pembayaran pemain cabang Cikupa' : 'Upload QRIS cabang Cikupa melalui Pengaturan Admin DLBC'}
            </p>

            <button
              onClick={() => setShowQrisModal(false)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Session Sheet Print Modal */}
      <DlbcSessionSheetPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
      />
    </div>
  );
}
