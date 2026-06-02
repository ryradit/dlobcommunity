'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, Award, TrendingUp, Calendar, CheckCircle, Clock, HelpCircle, BookOpen, ChevronDown, ChevronUp, Zap, ArrowRight } from 'lucide-react';
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

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [myMatches, setMyMatches] = useState<MatchMember[]>([]);
  const [myMembership, setMyMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberName, setMemberName] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Tutorial for member dashboard
  const tutorialSteps = getTutorialSteps('member-dashboard');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('member-dashboard', tutorialSteps);

  useEffect(() => {
    async function fetchUserData() {
      // Show loading immediately
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        // First, get user profile for the name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, last_dashboard_visit')
          .eq('id', user.id)
          .single();

        // profiles.full_name is the authoritative name used by admin when creating matches.
        // user_metadata.full_name is only used for the greeting display.
        const profileName = (profile?.full_name || '').trim();
        const displayName = (user.user_metadata?.full_name || profileName || profile?.email?.split('@')[0] || '').trim();
        const queryName = profileName || displayName; // what admin stored in match_members
        setMemberName(queryName);

        console.log('[Dashboard] profileName:', profileName, '| displayName:', displayName, '| queryName:', queryName);

        // Check if this is first time visiting dashboard
        const isFirst = !profile?.last_dashboard_visit;
        setIsFirstLogin(isFirst);
        setShowWelcomeModal(isFirst);

        // Update last_dashboard_visit timestamp (do this in background, don't wait)
        if (isFirst) {
          supabase
            .from('profiles')
            .update({ last_dashboard_visit: new Date().toISOString() })
            .eq('id', user.id)
            .then(() => console.log('Dashboard visit timestamp updated'));
        }

        if (!queryName) {
          setLoading(false);
          return;
        }

        // Fetch matches and membership in parallel with caching
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const [matchesResult, membershipResult] = await Promise.allSettled([
          // Invalidate stale match cache so newly-added matches always appear
          (() => { queryCache.invalidate(`member-matches-${queryName}`); return Promise.resolve(); })().then(() =>
          cachedQuery(
            `member-matches-${queryName}`,
            async () => {
              const result = await supabase
                .from('match_members')
                .select(`
                  *,
                  matches (
                    match_number,
                    match_date,
                    created_at,
                    shuttlecock_count,
                    team1_score,
                    team2_score,
                    winner,
                    team1_player1,
                    team1_player2,
                    team2_player1,
                    team2_player2
                  )
                `)
                .ilike('member_name', queryName)
                .order('created_at', { ascending: false });
              console.log('[Dashboard] matches result:', result.data?.length, result.error);
              return result;
            },
            30000
          )),
          // Membership always fetched fresh — no cache
          supabase
            .from('memberships')
            .select('*')
            .ilike('member_name', queryName)
            .eq('month', currentMonth)
            .eq('year', currentYear)
            .maybeSingle(),
        ]);

        // Process matches
        if (matchesResult.status === 'fulfilled') {
          const result = matchesResult.value as { data: any[] | null; error: any };
          if (!result.error) {
            setMyMatches(result.data || []);
          }
        }

        // Process membership
        if (membershipResult.status === 'fulfilled') {
          const result = membershipResult.value as { data: any | null; error: any };
          if (!result.error) {
            setMyMembership(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user, pathname]);

  // Calculate stats - memoized to avoid recalculation on every render
  const stats = useMemo(() => {
    const totalPending = myMatches
      .filter(m => m.payment_status === 'pending')
      .reduce((sum, m) => sum + m.total_amount, 0);

    const totalPaid = myMatches
      .filter(m => m.payment_status === 'paid')
      .reduce((sum, m) => sum + m.total_amount, 0);

    const pendingCount = myMatches.filter(m => m.payment_status === 'pending').length;
    const paidCount = myMatches.filter(m => m.payment_status === 'paid').length;

    return { totalPending, totalPaid, pendingCount, paidCount };
  }, [myMatches]);

  const statsDisplay = [
    {
      label: 'Total Pending',
      value: loading ? '...' : `Rp ${stats.totalPending.toLocaleString('id-ID')}`,
      icon: Clock,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-500/10',
      borderColor: 'border-amber-100 dark:border-amber-500/25',
      subtext: `${stats.pendingCount} pertandingan`,
    },
    {
      label: 'Total Lunas',
      value: loading ? '...' : `Rp ${stats.totalPaid.toLocaleString('id-ID')}`,
      icon: CheckCircle,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
      borderColor: 'border-emerald-100 dark:border-emerald-500/25',
      subtext: `${stats.paidCount} pertandingan`,
    },
    {
      label: 'Membership',
      value: loading ? '...' : (myMembership?.payment_status === 'paid' ? 'Aktif' : 'Tidak Aktif'),
      icon: Award,
      iconColor: myMembership?.payment_status === 'paid' ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-500 dark:text-zinc-400',
      bgColor: myMembership?.payment_status === 'paid' ? 'bg-purple-50 dark:bg-purple-500/10' : 'bg-zinc-50 dark:bg-zinc-500/10',
      borderColor: myMembership?.payment_status === 'paid' ? 'border-purple-100 dark:border-purple-500/25' : 'border-zinc-200/50 dark:border-zinc-500/20',
      subtext: myMembership ? `Rp ${myMembership.amount.toLocaleString('id-ID')}` : 'Belum ada membership',
    },
    {
      label: 'Total Pertandingan',
      value: loading ? '...' : myMatches.length.toLocaleString(),
      icon: Calendar,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
      borderColor: 'border-blue-100 dark:border-blue-500/25',
      subtext: 'Sepanjang waktu',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 px-4 lg:px-8 py-6 lg:py-8 transition-colors duration-300">
      <ProfileCompletionWarning />
      
      {/* Premium Welcome Header Card */}
      <div className="mb-8 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 dark:from-blue-500/10 dark:via-indigo-500/5 dark:to-purple-500/10 border border-indigo-100 dark:border-zinc-800/80 rounded-3xl p-6 lg:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-xs relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-48 h-48 bg-blue-500/20 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-48 h-48 bg-purple-500/20 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            MEMBER AREA
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors duration-300">
            {isFirstLogin ? (
              <>Selamat datang di Dashboard Member, {memberName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}!</>
            ) : (
              <>Selamat datang kembali, {memberName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}!</>
            )}
          </h1>
          <p className="text-gray-700 dark:text-zinc-300 font-medium transition-colors duration-300">
            Berikut ringkasan status pembayaran, keaktifan membership, dan riwayat pertandingan Anda.
          </p>
        </div>
        
        <div className="relative z-10 flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <WeatherWidget />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWelcomeModal(true)}
              className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 hover:bg-purple-50 dark:hover:bg-purple-500/10 border border-gray-200 dark:border-zinc-700 text-purple-600 dark:text-purple-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs hover:shadow-sm"
              title="Lihat panduan fitur dashboard"
              disabled={showWelcomeModal}
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <button
              onClick={toggleTutorial}
              className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-gray-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs hover:shadow-sm"
              title="Tampilkan panduan interaktif"
              disabled={showWelcomeModal}
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          // Show skeleton loading states
          [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          statsDisplay.map((stat, index) => {
            const Icon = stat.icon;
            const cssClass = index === 0 ? 'member-stat-matches' : index === 1 ? 'member-stat-membership' : index === 2 ? 'member-stat-winrate' : '';
            return (
              <div
                key={stat.label}
                className={`${cssClass} bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 hover:border-indigo-400/40 dark:hover:border-zinc-700 transition-all duration-300 shadow-xs hover:shadow-sm hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${stat.bgColor} ${stat.borderColor} border`}>
                    <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  {/* Subtle indicator dots */}
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-zinc-800" />
                </div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1 transition-colors duration-300 tracking-tight">{stat.value}</div>
                <div className="text-sm text-gray-700 dark:text-zinc-300 font-bold transition-colors duration-300">{stat.label}</div>
                {stat.subtext && (
                  <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1 font-semibold transition-colors duration-300">{stat.subtext}</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Membership Status */}
      {myMembership && (
        <div className="mb-8 bg-linear-to-br from-purple-600/5 via-fuchsia-600/5 to-purple-600/10 dark:from-purple-950/20 dark:via-fuchsia-950/10 dark:to-purple-900/10 border border-purple-200/60 dark:border-purple-500/20 rounded-3xl p-6 shadow-xs relative overflow-hidden transition-all duration-300 hover:shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-purple-100 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 shadow-xs">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white transition-colors duration-300">Status Membership</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300 font-semibold mt-0.5 transition-colors duration-300">
                  {myMembership.weeks_in_month} minggu • Rp {myMembership.amount.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold border transition-colors duration-300 ${
                  myMembership.payment_status === 'paid'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20'
                    : (myMembership.payment_status as string) === 'cancelled'
                    ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/60 dark:border-red-500/20'
                    : (myMembership.payment_status as string) === 'rejected'
                    ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/60 dark:border-red-500/20'
                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20'
                }`}
              >
                {myMembership.payment_status === 'paid' ? 'Lunas' :
                  (myMembership.payment_status as string) === 'cancelled' ? 'Dibatalkan' :
                  (myMembership.payment_status as string) === 'rejected' ? 'Ditolak' :
                  (myMembership as any).payment_proof ? 'Menunggu Verifikasi' : 'Belum Bayar'}
              </span>
            </div>
          </div>
          {myMembership.payment_status === 'paid' && (
            <div className="mt-4 pt-4 border-t border-purple-200/50 dark:border-purple-500/10 flex items-center gap-2 text-purple-700 dark:text-purple-300 text-xs font-semibold relative z-10 transition-colors duration-300">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span>Anda bebas biaya kehadiran untuk seluruh pertandingan di bulan ini!</span>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions Section */}
      {!loading && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">
              Aksi Cepat Member
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Bayar Tagihan */}
            <Link 
              href="/dashboard/pembayaran"
              className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-5 hover:border-emerald-400/40 dark:hover:border-emerald-500/30 transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 group flex flex-col justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-450 transition-colors text-sm">
                      Bayar Tagihan
                    </h3>
                    {stats.totalPending > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 animate-pulse">
                        Ada Tagihan
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-650 dark:text-zinc-400 font-medium leading-relaxed">
                    Bayar tagihan pertandingan bulanan, sewa lapangan, shuttlecock, & iuran membership Anda.
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-500">
                  {stats.totalPending > 0 ? (
                    <span className="text-red-650 dark:text-red-400 font-extrabold">
                      Rp {stats.totalPending.toLocaleString('id-ID')} pending
                    </span>
                  ) : (
                    'Semua tagihan lunas'
                  )}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-450 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                  Akses <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>

            {/* Card 2: Asisten Coach AI */}
            <Link 
              href="/dashboard/training"
              className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-5 hover:border-indigo-400/40 dark:hover:border-indigo-500/30 transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 group flex flex-col justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-450 transition-colors text-sm">
                    Asisten Coach AI
                  </h3>
                  <p className="text-xs text-gray-650 dark:text-zinc-400 font-medium leading-relaxed">
                    Konsultasikan target pukulan (Smash, Backhand) Anda dan rancang program latihan mandiri.
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-500">
                  Tanya taktik & teknik
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-450 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                  Konsultasi <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Head-to-Head Section */}
      {!loading && memberName && (
        <div className="mb-8">
          <HeadToHead memberName={memberName} />
        </div>
      )}



      {/* Tutorial Overlay - Disabled while welcome modal is open */}
      {!showWelcomeModal && (
        <TutorialOverlay
          steps={tutorialSteps}
          isActive={isTutorialActive}
          onClose={closeTutorial}
          tutorialKey="member-dashboard"
        />
      )}

      {/* Welcome Modal - Shows on first login */}
      <DashboardWelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        memberName={memberName}
      />
    </div>
  );
}
