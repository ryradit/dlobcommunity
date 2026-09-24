'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CreditCard,
  Award,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  HelpCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Dumbbell,
  BarChart3,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { StatCardSkeleton, MatchCardSkeleton } from '@/components/LoadingSkeletons';
import TutorialOverlay from '@/components/TutorialOverlay';
import ProfileCompletionWarning from '@/components/ProfileCompletionWarning';
import WeatherWidget from '@/components/WeatherWidget';
import HeadToHead from '@/components/HeadToHead';
import DashboardWelcomeModal from '@/components/DashboardWelcomeModal';
import BranchBadge from '@/components/BranchBadge';
import { useTutorial } from '@/hooks/useTutorial';
import { getTutorialSteps } from '@/lib/tutorialSteps';

const BRANCH_ID = 'dlob-cikupa';
const ACCENT = '#10B981';

const spring = { type: 'spring', stiffness: 400, damping: 30 } as const;

interface MatchMember {
  id: string;
  match_id: string;
  member_name: string;
  amount_due: number;
  attendance_fee: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  paid_at: string | null;
  matches: {
    match_number: number;
    match_date: string | null;
    created_at: string;
    shuttlecock_count: number;
    team1_score: number | null;
    team2_score: number | null;
    winner: string | null;
    team1_player1: string | null;
    team1_player2: string | null;
    team2_player1: string | null;
    team2_player2: string | null;
  };
}

export default function CikupaDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [myMatches, setMyMatches] = useState<MatchMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberName, setMemberName] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [expandRecentMatches, setExpandRecentMatches] = useState(true);

  // Tutorial for member dashboard
  const tutorialSteps = getTutorialSteps('member-dashboard');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('member-dashboard', tutorialSteps);

  useEffect(() => {
    async function fetchUserData() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        // Get member profile (authoritative name)
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, last_dashboard_visit')
          .eq('id', user.id)
          .single();

        const profileName = (profile?.full_name || '').trim();
        const displayName = (user.user_metadata?.full_name || profileName || profile?.email?.split('@')[0] || '').trim();
        const queryName = profileName || displayName;
        setMemberName(displayName);

        // Check if first time login
        const isFirst = !profile?.last_dashboard_visit;
        setIsFirstLogin(isFirst);
        setShowWelcomeModal(isFirst);

        if (isFirst) {
          supabase
            .from('profiles')
            .update({ last_dashboard_visit: new Date().toISOString() })
            .eq('id', user.id)
            .then(() => {});
        }

        if (!queryName) {
          setLoading(false);
          return;
        }

        // Fetch matches for this member in DLBC (Shuttlecock + Attendance fee)
        const matchesRes = await supabase
          .from('match_members')
          .select(`
            id, match_id, member_name, amount_due, attendance_fee,
            total_amount, payment_status, paid_at,
            matches!inner(match_number, match_date, created_at,
              shuttlecock_count, team1_score, team2_score, winner,
              team1_player1, team1_player2, team2_player1, team2_player2)
          `)
          .ilike('member_name', queryName)
          .eq('branch_id', BRANCH_ID)
          .order('created_at', { referencedTable: 'matches', ascending: false });

        setMyMatches((matchesRes.data as any) || []);
      } catch (err) {
        console.error('DLBC dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) fetchUserData();
  }, [user, authLoading, pathname]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPending = myMatches
      .filter(m => m.payment_status === 'pending')
      .reduce((sum, m) => sum + (m.total_amount ?? 0), 0);

    const totalPaid = myMatches
      .filter(m => m.payment_status === 'paid')
      .reduce((sum, m) => sum + (m.total_amount ?? 0), 0);

    const pendingCount = myMatches.filter(m => m.payment_status === 'pending').length;
    const paidCount = myMatches.filter(m => m.payment_status === 'paid').length;

    return { totalPending, totalPaid, pendingCount, paidCount };
  }, [myMatches]);

  const statsDisplay = [
    {
      label: 'Total Pending',
      value: loading ? '...' : `Rp ${stats.totalPending.toLocaleString('id-ID')}`,
      icon: Clock,
      colorBar: 'bg-amber-500',
      subtext: `${stats.pendingCount} sesi belum lunas`,
      alert: stats.pendingCount > 0,
    },
    {
      label: 'Total Lunas',
      value: loading ? '...' : `Rp ${stats.totalPaid.toLocaleString('id-ID')}`,
      icon: CheckCircle,
      colorBar: 'bg-emerald-500',
      subtext: `${stats.paidCount} sesi lunas`,
    },
    {
      label: 'Total Sesi DLBC',
      value: loading ? '...' : myMatches.length.toLocaleString(),
      icon: Calendar,
      colorBar: 'bg-teal-500',
      subtext: 'Sepanjang waktu di Cikupa',
    },
  ];

  const displayName = memberName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#09090e] transition-colors duration-300">
      {/* Aurora ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="aurora-a absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/8 dark:bg-emerald-500/6 blur-[100px]" />
        <div className="aurora-b absolute bottom-[-5%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-[#4382C8]/6 dark:bg-[#4382C8]/5 blur-[100px]" />
      </div>
      <div className="relative z-10 py-6 lg:py-8 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 max-w-7xl mx-auto space-y-6">
      <ProfileCompletionWarning />

      {/* Top Header */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-premium p-5"
      >
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {isFirstLogin ? (
                <>Selamat datang di DLBC, {displayName.split(' ')[0]}!</>
              ) : (
                <>Halo kembali, {displayName.split(' ')[0]}!</>
              )}
            </h1>
            <BranchBadge size="sm" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ringkasan pembayaran dan riwayat sesi bermain Anda di cabang DLBC Cikupa.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <WeatherWidget />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowWelcomeModal(true)}
            className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition-colors border border-purple-500/20"
            title="Lihat panduan fitur dashboard"
            disabled={showWelcomeModal}
          >
            <BookOpen className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleTutorial}
            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors border border-emerald-500/20"
            title="Tampilkan panduan interaktif"
            disabled={showWelcomeModal}
          >
            <HelpCircle className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          statsDisplay.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: i * 0.04 }}
              className={`glass-premium stat-card-glow p-4 sm:p-5 flex flex-col justify-between ${
                stat.alert ? 'ring-1 ring-amber-400/30' : ''
              }`}
            >
              <div>
                <div className={`h-0.5 w-8 rounded-full mb-3 ${stat.colorBar}`} />
                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
                  {stat.value}
                </p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                  {stat.label}
                </p>
              </div>
              {stat.subtext && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                  {stat.subtext}
                </p>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Head-to-Head Section */}
      {!loading && memberName && (
        <div>
          <HeadToHead memberName={memberName} branchId={BRANCH_ID} />
        </div>
      )}

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <motion.div whileHover={{ y: -2 }} transition={{ ...spring, stiffness: 500, damping: 25 }}>
          <Link
            href="/cikupa/dashboard/pembayaran"
            className="flex items-center gap-3.5 p-4 rounded-2xl glass-premium hover:border-emerald-500/40 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Pembayaran</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Tagihan & QRIS DLBC</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} transition={{ ...spring, stiffness: 500, damping: 25 }}>
          <Link
            href="/cikupa/dashboard/analitik"
            className="flex items-center gap-3.5 p-4 rounded-2xl glass-premium hover:border-purple-500/40 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Analitik DLBC</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Statistik performa main</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} transition={{ ...spring, stiffness: 500, damping: 25 }}>
          <Link
            href="/cikupa/dashboard/training"
            className="flex items-center gap-3.5 p-4 rounded-2xl glass-premium hover:border-blue-500/40 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Training Center</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Tips & teknik bermain</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        </motion.div>
      </div>

      {/* Recent Matches */}
      <div className="glass-premium overflow-hidden">
        <button
          onClick={() => setExpandRecentMatches(!expandRecentMatches)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white text-left">
              Sesi Terakhir DLBC ({myMatches.length})
            </h2>
          </div>
          {expandRecentMatches ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {expandRecentMatches && (
          <div className="p-4 sm:p-5 border-t border-slate-200/60 dark:border-white/[0.06]">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <MatchCardSkeleton key={i} />
                ))}
              </div>
            ) : myMatches.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-1">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Belum ada sesi bermain di DLBC</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Sesi yang Anda ikuti di Cikupa akan muncul di sini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {myMatches.slice(0, 9).map((match, i) => {
                  const team1Score = match.matches?.team1_score;
                  const team2Score = match.matches?.team2_score;
                  const winner = match.matches?.winner;
                  const hasScore = team1Score !== null && team2Score !== null;

                  const isTeam1 =
                    match.matches?.team1_player1 === memberName || match.matches?.team1_player2 === memberName;
                  const isTeam2 =
                    match.matches?.team2_player1 === memberName || match.matches?.team2_player2 === memberName;
                  const isWinner =
                    (isTeam1 && winner === 'team1') ||
                    (isTeam2 && winner === 'team2') ||
                    winner === 'team1';

                  const statusClass =
                    match.payment_status === 'paid'
                      ? 'pill-paid'
                      : match.payment_status === 'cancelled'
                      ? 'pill-cancelled'
                      : 'pill-pending';

                  const statusLabel =
                    match.payment_status === 'paid'
                      ? 'Lunas'
                      : match.payment_status === 'cancelled'
                      ? 'Batal'
                      : 'Pending';

                  return (
                    <motion.div
                      key={match.id}
                      initial={reduce ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring, delay: i * 0.03 }}
                      className="glass-premium p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Match #{match.matches?.match_number ?? '—'}
                          </span>
                        </div>
                        <span className={`pill-status ${statusClass}`}>{statusLabel}</span>
                      </div>

                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        {match.matches?.match_date
                          ? new Date(match.matches.match_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : new Date(match.matches?.created_at ?? '').toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                      </p>

                      {/* Score */}
                      {hasScore ? (
                        <div
                          className={`flex items-center justify-center py-2 rounded-xl ${
                            isWinner
                              ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20'
                              : 'bg-slate-100 dark:bg-white/[0.04] ring-1 ring-slate-200/60 dark:ring-white/[0.06]'
                          }`}
                        >
                          <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                            {team1Score}
                          </span>
                          <span className="text-slate-400 mx-2 text-xs font-medium">-</span>
                          <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                            {team2Score}
                          </span>
                          <span
                            className={`ml-2 text-[10px] font-bold uppercase tracking-wider ${
                              isWinner ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                            }`}
                          >
                            {isWinner ? 'Menang' : 'Kalah'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] ring-1 ring-slate-200/60 dark:ring-white/[0.06]">
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Belum ada skor</span>
                        </div>
                      )}

                      {/* Cost Details */}
                      <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] text-xs">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400 dark:text-slate-500">Shuttlecock</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Rp {(match.amount_due ?? 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400 dark:text-slate-500">Kehadiran</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {(match.attendance_fee ?? 0) > 0
                              ? `Rp ${(match.attendance_fee ?? 0).toLocaleString('id-ID')}`
                              : 'Gratis'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60 dark:border-white/[0.05]">
                          <span className="text-[11px] font-bold text-slate-900 dark:text-white">Total</span>
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            Rp {(match.total_amount ?? 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tutorial Overlay */}
      {!showWelcomeModal && (
        <TutorialOverlay
          steps={tutorialSteps}
          isActive={isTutorialActive}
          onClose={closeTutorial}
          tutorialKey="member-dashboard"
        />
      )}

      {/* Welcome Modal */}
      <DashboardWelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        memberName={memberName}
      />
      </div>{/* end relative z-10 */}
    </div>
  );
}

