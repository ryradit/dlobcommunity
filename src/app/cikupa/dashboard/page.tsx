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
  Dumbbell,
  BarChart3,
} from 'lucide-react';
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

interface MatchMember {
  id: string;
  match_id: string;
  member_name: string;
  amount_due: number;
  attendance_fee: number;
  has_membership: boolean;
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

interface Membership {
  id: string;
  member_name: string;
  month: number;
  year: number;
  weeks_in_month: number;
  amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  paid_at: string | null;
  created_at: string;
}

export default function CikupaDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [myMatches, setMyMatches] = useState<MatchMember[]>([]);
  const [myMembership, setMyMembership] = useState<Membership | null>(null);
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

        // Fetch matches for this member in DLBC
        const matchesQuery = supabase
          .from('match_members')
          .select(`
            id, match_id, member_name, amount_due, attendance_fee,
            has_membership, total_amount, payment_status, paid_at,
            matches!inner(match_number, match_date, created_at,
              shuttlecock_count, team1_score, team2_score, winner,
              team1_player1, team1_player2, team2_player1, team2_player2)
          `)
          .ilike('member_name', queryName)
          .eq('branch_id', BRANCH_ID)
          .order('created_at', { referencedTable: 'matches', ascending: false });

        const now = new Date();
        const [matchesRes, membershipRes] = await Promise.all([
          matchesQuery,
          supabase
            .from('memberships')
            .select('*')
            .ilike('member_name', queryName)
            .eq('branch_id', BRANCH_ID)
            .eq('month', now.getMonth() + 1)
            .eq('year', now.getFullYear())
            .maybeSingle(),
        ]);

        setMyMatches((matchesRes.data as any) || []);
        setMyMembership(membershipRes.data || null);
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
      color: 'from-amber-500 to-amber-600',
      subtext: `${stats.pendingCount} sesi belum lunas`,
    },
    {
      label: 'Total Lunas',
      value: loading ? '...' : `Rp ${stats.totalPaid.toLocaleString('id-ID')}`,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      subtext: `${stats.paidCount} sesi lunas`,
    },
    {
      label: 'Membership',
      value: loading ? '...' : (myMembership?.payment_status === 'paid' ? 'Aktif' : 'Tidak Aktif'),
      icon: Award,
      color: myMembership?.payment_status === 'paid' ? 'from-purple-500 to-purple-600' : 'from-zinc-500 to-zinc-600',
      subtext: myMembership ? `Rp ${myMembership.amount.toLocaleString('id-ID')}` : 'Belum ada membership',
    },
    {
      label: 'Total Sesi DLBC',
      value: loading ? '...' : myMatches.length.toLocaleString(),
      icon: Calendar,
      color: 'from-teal-500 to-emerald-600',
      subtext: 'Sepanjang waktu di Cikupa',
    },
  ];

  const displayName = memberName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6 transition-colors duration-300">
      <ProfileCompletionWarning />

      {/* Top Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
              {isFirstLogin ? (
                <>Selamat datang di DLBC, {displayName.split(' ')[0]}! 👋</>
              ) : (
                <>Halo kembali, {displayName.split(' ')[0]}! 👋</>
              )}
            </h1>
            <BranchBadge size="sm" />
          </div>
          <p className="text-gray-600 dark:text-zinc-400 font-medium text-sm transition-colors duration-300">
            Berikut ringkasan pembayaran dan riwayat sesi bermain Anda di cabang DLBC Cikupa.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <WeatherWidget />
          <button
            onClick={() => setShowWelcomeModal(true)}
            className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/10 hover:bg-purple-200 dark:hover:bg-purple-500/20 border border-purple-300 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 transition-colors"
            title="Lihat panduan fitur dashboard"
            disabled={showWelcomeModal}
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button
            onClick={toggleTutorial}
            className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 transition-colors"
            title="Tampilkan panduan interaktif"
            disabled={showWelcomeModal}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {loading ? (
          [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          statsDisplay.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md duration-300"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-4 shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-zinc-400 font-semibold">
                  {stat.label}
                </div>
                {stat.subtext && (
                  <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1 font-medium">
                    {stat.subtext}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Membership Status Banner */}
      {myMembership && (
        <div className="mb-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-2 border-purple-200 dark:border-purple-500/30 rounded-2xl p-5 sm:p-6 shadow-sm transition-colors duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Status Membership DLBC</h3>
                  <BranchBadge size="sm" />
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                  {myMembership.weeks_in_month} minggu — Rp {myMembership.amount.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold border self-start sm:self-auto ${
                myMembership.payment_status === 'paid'
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-transparent'
                  : myMembership.payment_status === 'cancelled'
                  ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-transparent'
                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-transparent'
              }`}
            >
              {myMembership.payment_status === 'paid' ? '✓ Lunas' : myMembership.payment_status === 'cancelled' ? 'Dibatalkan' : '⏳ Pending'}
            </span>
          </div>
          {myMembership.payment_status === 'paid' && (
            <p className="text-purple-700 dark:text-purple-300 text-xs sm:text-sm mt-3 font-medium">
              ✨ Member DLBC aktif: Bebas biaya kehadiran untuk seluruh sesi bermain bulan ini!
            </p>
          )}
        </div>
      )}

      {/* Head-to-Head Section */}
      {!loading && memberName && (
        <div className="mb-8">
          <HeadToHead memberName={memberName} branchId={BRANCH_ID} />
        </div>
      )}

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        <Link
          href="/cikupa/dashboard/pembayaran"
          className="flex items-center gap-3 p-4 rounded-2xl border bg-white dark:bg-zinc-900 border-gray-200 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Pembayaran</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">Tagihan & QRIS</p>
          </div>
        </Link>

        <Link
          href="/cikupa/dashboard/analitik"
          className="flex items-center gap-3 p-4 rounded-2xl border bg-white dark:bg-zinc-900 border-gray-200 dark:border-white/10 hover:border-purple-400 dark:hover:border-purple-500/50 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Analitik DLBC</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">Statistik performa</p>
          </div>
        </Link>

        <Link
          href="/cikupa/dashboard/training"
          className="flex items-center gap-3 p-4 rounded-2xl border bg-white dark:bg-zinc-900 border-gray-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Training Center</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">Tips & teknik main</p>
          </div>
        </Link>
      </div>

      {/* Recent Matches (Sesi Terakhir) */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm transition-colors duration-300 overflow-hidden">
        <button
          onClick={() => setExpandRecentMatches(!expandRecentMatches)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white text-left">
              Sesi Terakhir DLBC ({myMatches.length})
            </h2>
          </div>
          {expandRecentMatches ? (
            <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
          )}
        </button>

        {expandRecentMatches && (
          <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-white/5">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <MatchCardSkeleton key={i} />
                ))}
              </div>
            ) : myMatches.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 mb-1">
                  <Calendar className="w-6 h-6" />
                </div>
                <p className="text-base font-bold text-gray-800 dark:text-zinc-200">Belum ada sesi bermain di DLBC</p>
                <p className="text-xs text-gray-500 dark:text-zinc-500">Sesi yang Anda ikuti di Cikupa akan muncul di sini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myMatches.slice(0, 9).map((match) => {
                  const team1Score = match.matches?.team1_score;
                  const team2Score = match.matches?.team2_score;
                  const winner = match.matches?.winner;
                  const hasScore = team1Score !== null && team2Score !== null;

                  // Determine if this member's team won
                  const isTeam1 =
                    match.matches?.team1_player1 === memberName || match.matches?.team1_player2 === memberName;
                  const isTeam2 =
                    match.matches?.team2_player1 === memberName || match.matches?.team2_player2 === memberName;
                  const isWinner =
                    (isTeam1 && winner === 'team1') ||
                    (isTeam2 && winner === 'team2') ||
                    winner === 'team1'; // fallback

                  return (
                    <div
                      key={match.id}
                      className="flex flex-col p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-900 rounded-xl border border-gray-200 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md duration-300"
                    >
                      {/* Header: Match Number & Membership Badge */}
                      <div className="flex items-start justify-between mb-2.5 pb-2.5 border-b border-gray-200 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                            Match #{match.matches?.match_number ?? '—'}
                          </h3>
                          {match.has_membership && (
                            <span title="Membership Bebas Biaya Hadir">
                              <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                          {match.matches?.match_date
                            ? new Date(match.matches.match_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : new Date(match.matches?.created_at ?? '').toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })}
                        </span>
                      </div>

                      {/* Prominent Score Section */}
                      <div className="mb-3">
                        {hasScore ? (
                          <div
                            className={`flex items-center justify-center py-2.5 px-3 rounded-xl ${
                              isWinner
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40'
                                : 'bg-gray-200 dark:bg-zinc-700/60 border border-gray-300 dark:border-zinc-600/50'
                            }`}
                          >
                            <div className="text-center">
                              <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                {team1Score}
                                <span className="text-sm font-semibold mx-2 text-gray-500">-</span>
                                {team2Score}
                              </p>
                              <p
                                className={`text-[11px] font-bold mt-0.5 ${
                                  isWinner
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-gray-600 dark:text-zinc-400'
                                }`}
                              >
                                {isWinner ? '✓ Menang' : 'Kalah'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-white/5">
                            <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold">Belum ada skor</p>
                          </div>
                        )}
                      </div>

                      {/* Cost Details */}
                      <div className="space-y-1.5 mb-3 pb-3 border-b border-gray-200 dark:border-white/10 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-zinc-400">Shuttlecock:</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            Rp {(match.amount_due ?? 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-zinc-400">Kehadiran:</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {(match.attendance_fee ?? 0) > 0
                              ? `Rp ${(match.attendance_fee ?? 0).toLocaleString('id-ID')}`
                              : 'Gratis'}
                          </span>
                        </div>
                      </div>

                      {/* Total & Status */}
                      <div className="flex items-end justify-between mt-auto">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500">Total</p>
                          <p className="text-base font-black text-gray-900 dark:text-white">
                            Rp {(match.total_amount ?? 0).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border whitespace-nowrap ${
                            match.payment_status === 'paid'
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                              : match.payment_status === 'cancelled'
                              ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800'
                              : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {match.payment_status === 'paid' ? 'Lunas' : match.payment_status === 'cancelled' ? 'Batal' : 'Pending'}
                        </span>
                      </div>
                    </div>
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
    </div>
  );
}
