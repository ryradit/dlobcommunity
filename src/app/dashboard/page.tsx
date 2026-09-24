'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, Award, Calendar, CheckCircle, Clock, HelpCircle, BookOpen, ChevronDown, ChevronUp, ArrowRight, Zap } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { StatCardSkeleton, MatchCardSkeleton } from '@/components/LoadingSkeletons';
import TutorialOverlay from '@/components/TutorialOverlay';
import ProfileCompletionWarning from '@/components/ProfileCompletionWarning';
import WeatherWidget from '@/components/WeatherWidget';
import HeadToHead from '@/components/HeadToHead';
import DashboardWelcomeModal from '@/components/DashboardWelcomeModal';
import { useTutorial } from '@/hooks/useTutorial';
import { getTutorialSteps } from '@/lib/tutorialSteps';

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

const spring = {
  type: 'spring',
  stiffness: 320,
  damping: 32,
} as const;

function StatCard({
  label,
  value,
  subtext,
  colorClass,
  delay = 0,
}: {
  label: string;
  value: string;
  subtext?: string;
  colorClass: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay }}
      className="glass-premium stat-card-glow p-5 flex flex-col gap-1"
    >
      {/* Color accent strip */}
      <div className={`h-0.5 w-10 rounded-full mb-2 ${colorClass}`} />
      <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtext}</p>}
    </motion.div>
  );
}

function MatchCard({ match, delay = 0 }: { match: MatchMember; delay?: number }) {
  const reduce = useReducedMotion();
  const team1Score = match.matches.team1_score;
  const team2Score = match.matches.team2_score;
  const winner = match.matches.winner;
  const hasScore = team1Score !== null && team2Score !== null;

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
      ? 'Dibatalkan'
      : 'Pending';

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay }}
      className="glass-premium p-4 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          Match #{match.matches.match_number}
        </span>
        <span className={`pill-status ${statusClass}`}>{statusLabel}</span>
      </div>

      {/* Date */}
      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
        {new Date(match.matches.match_date ?? match.matches.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </p>

      {/* Score */}
      {hasScore ? (
        <div
          className={`flex items-center justify-center py-2 rounded-xl ${
            winner === 'team1'
              ? 'bg-emerald-500/10 dark:bg-emerald-500/10 ring-1 ring-emerald-500/20'
              : 'bg-slate-100 dark:bg-white/[0.04] ring-1 ring-slate-200/60 dark:ring-white/[0.06]'
          }`}
        >
          <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {team1Score}
          </span>
          <span className="text-slate-400 mx-2 text-sm font-medium">vs</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {team2Score}
          </span>
          {winner === 'team1' && (
            <span className="ml-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Menang
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center py-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] ring-1 ring-slate-200/60 dark:ring-white/[0.06]">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Belum ada skor</span>
        </div>
      )}

      {/* Cost breakdown */}
      <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Shuttlecock</span>
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Rp {match.amount_due.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Kehadiran</span>
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            {match.attendance_fee > 0 ? `Rp ${match.attendance_fee.toLocaleString('id-ID')}` : 'Gratis'}
          </span>
        </div>
        <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60 dark:border-white/[0.05]">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            Rp {match.total_amount.toLocaleString('id-ID')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [myMatches, setMyMatches] = useState<MatchMember[]>([]);
  const [myMembership, setMyMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberName, setMemberName] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeInitialSlide, setWelcomeInitialSlide] = useState(0);
  const [expandRecentMatches, setExpandRecentMatches] = useState(true);
  const reduce = useReducedMotion();

  const tutorialSteps = getTutorialSteps('member-dashboard');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('member-dashboard', tutorialSteps);

  useEffect(() => {
    async function fetchUserData() {
      if (!user) { setLoading(false); return; }
      setLoading(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, last_dashboard_visit')
          .eq('id', user.id)
          .single();

        const profileName = (profile?.full_name || '').trim();
        const displayName = (user.user_metadata?.full_name || profileName || profile?.email?.split('@')[0] || '').trim();
        const queryName = profileName || displayName;
        setMemberName(displayName);

        const isFirst = !profile?.last_dashboard_visit;
        setIsFirstLogin(isFirst);
        setShowWelcomeModal(isFirst);

        if (isFirst) {
          supabase.from('profiles').update({ last_dashboard_visit: new Date().toISOString() }).eq('id', user.id).then(() => {});
        }

        if (!queryName) { setLoading(false); return; }

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const [matchesResult, membershipResult] = await Promise.allSettled([
          (() => { queryCache.invalidate(`member-matches-${queryName}`); return Promise.resolve(); })().then(() =>
            cachedQuery(
              `member-matches-${queryName}`,
              async () => {
                const result = await supabase
                  .from('match_members')
                  .select(`*, matches (match_number, match_date, created_at, shuttlecock_count, team1_score, team2_score, winner, team1_player1, team1_player2, team2_player1, team2_player2)`)
                  .ilike('member_name', queryName)
                  .or('branch_id.is.null,branch_id.eq.dlob-pusat')
                  .order('created_at', { ascending: false });
                return result;
              },
              30000
            )
          ),
          supabase
            .from('memberships')
            .select('*')
            .ilike('member_name', queryName)
            .or('branch_id.is.null,branch_id.eq.dlob-pusat')
            .eq('month', currentMonth)
            .eq('year', currentYear)
            .maybeSingle(),
        ]);

        if (matchesResult.status === 'fulfilled') {
          const result = matchesResult.value as { data: any[] | null; error: any };
          if (!result.error) setMyMatches(result.data || []);
        }
        if (membershipResult.status === 'fulfilled') {
          const result = membershipResult.value as { data: any | null; error: any };
          if (!result.error) setMyMembership(result.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, [user, pathname]);

  const stats = useMemo(() => {
    const totalPending = myMatches.filter(m => m.payment_status === 'pending').reduce((sum, m) => sum + m.total_amount, 0);
    const totalPaid = myMatches.filter(m => m.payment_status === 'paid').reduce((sum, m) => sum + m.total_amount, 0);
    const pendingCount = myMatches.filter(m => m.payment_status === 'pending').length;
    const paidCount = myMatches.filter(m => m.payment_status === 'paid').length;
    return { totalPending, totalPaid, pendingCount, paidCount };
  }, [myMatches]);

  const displayName = memberName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Athlete';
  const greetingText = isFirstLogin ? `Selamat datang, ${displayName}!` : `Selamat datang kembali, ${displayName}`;

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#09090e] transition-colors duration-300">
      {/* ── Aurora ambient layer ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="aurora-a absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-[#4382C8]/10 dark:bg-[#4382C8]/8 blur-[100px]" />
        <div className="aurora-b absolute top-[30%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#7c5cbf]/8 dark:bg-[#7c5cbf]/6 blur-[110px]" />
        <div className="aurora-c absolute bottom-[-5%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-[#22c55e]/6 dark:bg-[#22c55e]/4 blur-[90px]" />
      </div>

      <div className="relative z-10 py-6 lg:py-8 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8">
        <ProfileCompletionWarning />

        {/* ── Page Header ── */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.04 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
        >
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {greetingText}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Ringkasan pembayaran dan riwayat pertandingan Anda
            </p>

            {/* Feature spotlight — no badge icon */}
            <div className="mt-3 inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#4382C8]/8 dark:bg-[#4382C8]/12 border border-[#4382C8]/20 dark:border-[#4382C8]/25">
              <Zap className="w-3.5 h-3.5 text-[#4382C8] dark:text-[#7eb6f0] shrink-0" strokeWidth={2.2} />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Training Center 2.0 & DLOB AI Coach telah aktif!
              </span>
              <button
                onClick={() => { setWelcomeInitialSlide(3); setShowWelcomeModal(true); }}
                className="text-xs font-bold text-[#4382C8] dark:text-[#7eb6f0] hover:underline shrink-0"
              >
                Lihat
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <WeatherWidget />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setWelcomeInitialSlide(0); setShowWelcomeModal(true); }}
              disabled={showWelcomeModal}
              className="p-2 rounded-xl glass-premium text-slate-600 dark:text-slate-400 hover:text-[#4382C8] dark:hover:text-[#7eb6f0] transition-colors disabled:opacity-40"
              title="Panduan fitur"
            >
              <BookOpen className="w-5 h-5" strokeWidth={1.8} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTutorial}
              disabled={showWelcomeModal}
              className="p-2 rounded-xl glass-premium text-slate-600 dark:text-slate-400 hover:text-[#4382C8] dark:hover:text-[#7eb6f0] transition-colors disabled:opacity-40"
              title="Tutorial interaktif"
            >
              <HelpCircle className="w-5 h-5" strokeWidth={1.8} />
            </motion.button>
          </div>
        </motion.div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard
                label="Total Pending"
                value={`Rp ${stats.totalPending.toLocaleString('id-ID')}`}
                subtext={`${stats.pendingCount} pertandingan`}
                colorClass="bg-amber-400"
                delay={0.06}
              />
              <StatCard
                label="Total Lunas"
                value={`Rp ${stats.totalPaid.toLocaleString('id-ID')}`}
                subtext={`${stats.paidCount} pertandingan`}
                colorClass="bg-emerald-400"
                delay={0.09}
              />
              <StatCard
                label="Membership"
                value={myMembership?.payment_status === 'paid' ? 'Aktif' : 'Tidak Aktif'}
                subtext={myMembership ? `Rp ${myMembership.amount.toLocaleString('id-ID')}` : 'Belum ada'}
                colorClass={myMembership?.payment_status === 'paid' ? 'bg-violet-400' : 'bg-slate-400'}
                delay={0.12}
              />
              <StatCard
                label="Total Pertandingan"
                value={myMatches.length.toLocaleString()}
                subtext="Sepanjang waktu"
                colorClass="bg-[#4382C8]"
                delay={0.15}
              />
            </>
          )}
        </div>

        {/* ── Membership Status ── */}
        <AnimatePresence>
          {myMembership && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={spring}
              className="glass-premium mb-8 p-5"
            >
              {/* Aurora orb */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

              <div className="relative flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Status Membership Bulan Ini</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {myMembership.weeks_in_month} minggu &bull; Rp {myMembership.amount.toLocaleString('id-ID')}
                  </p>
                  {myMembership.payment_status === 'paid' && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                      Biaya kehadiran gratis untuk bulan ini
                    </p>
                  )}
                </div>
                <span
                  className={`pill-status ${
                    myMembership.payment_status === 'paid'
                      ? 'pill-paid'
                      : (myMembership.payment_status as string) === 'cancelled'
                      ? 'pill-cancelled'
                      : 'pill-pending'
                  }`}
                >
                  {myMembership.payment_status === 'paid'
                    ? 'Lunas'
                    : (myMembership.payment_status as string) === 'cancelled'
                    ? 'Dibatalkan'
                    : (myMembership as any).payment_proof
                    ? 'Menunggu Verifikasi'
                    : 'Belum Bayar'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Quick Links ── */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.18 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
        >
          <Link
            href="/dashboard/training"
            className="glass-premium p-5 flex items-center justify-between group"
          >
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Training Center</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Analitik & program latihan AI</p>
            </div>
            <ArrowRight
              className="w-4 h-4 text-slate-400 group-hover:text-[#4382C8] dark:group-hover:text-[#7eb6f0] transition-all group-hover:translate-x-1"
              strokeWidth={2}
            />
          </Link>
          <Link
            href="/dashboard/pembayaran"
            className="glass-premium p-5 flex items-center justify-between group"
          >
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Pembayaran</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Riwayat & status tagihan</p>
            </div>
            <ArrowRight
              className="w-4 h-4 text-slate-400 group-hover:text-[#4382C8] dark:group-hover:text-[#7eb6f0] transition-all group-hover:translate-x-1"
              strokeWidth={2}
            />
          </Link>
        </motion.div>

        {/* ── Head-to-Head ── */}
        {!loading && memberName && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.21 }}
            className="mb-8"
          >
            <HeadToHead memberName={memberName} />
          </motion.div>
        )}

        {/* ── Recent Matches ── */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.24 }}
          className="glass-premium member-recent-matches"
        >
          <button
            onClick={() => setExpandRecentMatches(!expandRecentMatches)}
            className="w-full px-5 py-4 flex items-center gap-3 hover:bg-[#4382C8]/4 dark:hover:bg-white/[0.02] transition-colors rounded-t-2xl"
          >
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex-1 text-left">
              Pertandingan Terkini
            </h2>
            <span className="text-xs text-slate-400 font-medium tabular-nums">
              {myMatches.length} total
            </span>
            <motion.div
              animate={{ rotate: expandRecentMatches ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-slate-400" strokeWidth={2} />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {expandRecentMatches && (
              <motion.div
                initial={reduce ? false : { height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 border-t border-slate-200/60 dark:border-white/[0.06] pt-4">
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => <MatchCardSkeleton key={i} />)}
                    </div>
                  ) : myMatches.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-slate-400 dark:text-slate-500">Belum ada pertandingan.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myMatches.slice(0, 6).map((match, i) => (
                        <MatchCard key={match.id} match={match} delay={i * 0.04} />
                      ))}
                    </div>
                  )}
                  {myMatches.length > 6 && (
                    <div className="mt-4 text-center">
                      <Link
                        href="/dashboard/pembayaran"
                        className="text-xs font-semibold text-[#4382C8] dark:text-[#7eb6f0] hover:underline"
                      >
                        Lihat semua {myMatches.length} pertandingan
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Tutorial & Welcome Modal */}
      {!showWelcomeModal && (
        <TutorialOverlay
          steps={tutorialSteps}
          isActive={isTutorialActive}
          onClose={closeTutorial}
          tutorialKey="member-dashboard"
        />
      )}
      <DashboardWelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => { setShowWelcomeModal(false); setWelcomeInitialSlide(0); }}
        memberName={memberName}
        initialSlide={welcomeInitialSlide}
      />
    </div>
  );
}
