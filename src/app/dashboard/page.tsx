'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import { usePathname } from 'next/navigation';
import { CreditCard, Award, TrendingUp, Calendar, CheckCircle, Clock, HelpCircle } from 'lucide-react';
import { StatCardSkeleton, MatchCardSkeleton } from '@/components/LoadingSkeletons';
import TutorialOverlay from '@/components/TutorialOverlay';
import ProfileCompletionWarning from '@/components/ProfileCompletionWarning';
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
        setMemberName(displayName);

        console.log('[Dashboard] profileName:', profileName, '| displayName:', displayName, '| queryName:', queryName);

        // Check if this is first time visiting dashboard
        const isFirst = !profile?.last_dashboard_visit;
        setIsFirstLogin(isFirst);

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
                    shuttlecock_count
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
      color: 'from-yellow-500 to-yellow-600',
      subtext: `${stats.pendingCount} pertandingan`,
    },
    {
      label: 'Total Lunas',
      value: loading ? '...' : `Rp ${stats.totalPaid.toLocaleString('id-ID')}`,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      subtext: `${stats.paidCount} pertandingan`,
    },
    {
      label: 'Membership',
      value: loading ? '...' : (myMembership?.payment_status === 'paid' ? 'Aktif' : 'Tidak Aktif'),
      icon: Award,
      color: myMembership?.payment_status === 'paid' ? 'from-purple-500 to-purple-600' : 'from-zinc-500 to-zinc-600',
      subtext: myMembership ? `Rp ${myMembership.amount.toLocaleString('id-ID')}` : 'Belum ada membership',
    },
    {
      label: 'Total Pertandingan',
      value: loading ? '...' : myMatches.length.toLocaleString(),
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      subtext: 'Sepanjang waktu',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6 transition-colors duration-300">
      <ProfileCompletionWarning />
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
            {isFirstLogin ? (
              <>Selamat datang di Dashboard Member, {memberName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}!</>
            ) : (
              <>Selamat datang kembali, {memberName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}!</>
            )}
          </h1>
          <p className="text-gray-700 dark:text-zinc-300 font-medium transition-colors duration-300">Berikut ringkasan pembayaran dan riwayat pertandingan Anda.</p>
        </div>
        
        <button
          onClick={toggleTutorial}
          className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/10 hover:bg-blue-200 dark:hover:bg-blue-500/20 border-2 border-blue-300 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 transition-colors duration-300"
          title="Tampilkan panduan fitur"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
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
                className={`${cssClass} bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 hover:border-gray-400 dark:hover:border-white/20 transition-colors shadow-sm duration-300`}
              >
                <div className={`inline-flex p-3 rounded-xl bg-linear-to-br ${stat.color} mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 transition-colors duration-300">{stat.value}</div>
                <div className="text-sm text-gray-700 dark:text-zinc-300 font-semibold transition-colors duration-300">{stat.label}</div>
                {stat.subtext && (
                  <div className="text-xs text-gray-600 dark:text-zinc-400 mt-1 font-medium transition-colors duration-300">{stat.subtext}</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Membership Status */}
      {myMembership && (
        <div className="mb-8 bg-linear-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 border-2 border-purple-300 dark:border-purple-500/30 rounded-xl p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Status Membership</h3>
                <p className="text-sm text-purple-700 dark:text-purple-200 font-medium transition-colors duration-300">
                  {myMembership.weeks_in_month} minggu - Rp {myMembership.amount.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-colors duration-300 ${
                myMembership.payment_status === 'paid'
                  ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-300 dark:border-transparent'
                  : (myMembership.payment_status as string) === 'cancelled'
                  ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-transparent'
                  : (myMembership.payment_status as string) === 'rejected'
                  ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-transparent'
                  : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-transparent'
              }`}
            >
              {myMembership.payment_status === 'paid' ? 'Lunas' :
                (myMembership.payment_status as string) === 'cancelled' ? 'Dibatalkan' :
                (myMembership.payment_status as string) === 'rejected' ? 'Ditolak' :
                (myMembership as any).payment_proof ? 'Menunggu Verifikasi' : 'Belum Bayar'}
            </span>
          </div>
          {myMembership.payment_status === 'paid' && (
            <p className="text-purple-700 dark:text-purple-200 text-sm mt-3 font-medium transition-colors duration-300">
              ✨ Anda tidak perlu membayar biaya kehadiran untuk pertandingan bulan ini!
            </p>
          )}
        </div>
      )}

      {/* Recent Matches */}
      <div className="member-recent-matches bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 shadow-sm transition-colors duration-300">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 transition-colors duration-300">
          <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
          Pertandingan Terkini
        </h2>
        
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <MatchCardSkeleton key={i} />)}
          </div>
        ) : myMatches.length === 0 ? (
          <p className="text-gray-700 dark:text-zinc-300 font-medium transition-colors duration-300">Belum ada pertandingan.</p>
        ) : (
          <div className="space-y-3">
            {myMatches.slice(0, 10).map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-4 bg-gray-100 dark:bg-zinc-800/50 rounded-lg border-2 border-gray-300 dark:border-white/5 hover:border-gray-400 dark:hover:border-white/10 transition-colors shadow-sm duration-300"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white transition-colors duration-300">
                      Pertandingan #{match.matches.match_number}
                    </h3>
                    {match.has_membership && (
                      <Award className="w-4 h-4 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-zinc-300 font-medium transition-colors duration-300">
                    {new Date(match.matches.match_date ?? match.matches.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-600 dark:text-zinc-400 font-semibold transition-colors duration-300">
                    <span>Shuttlecock: Rp {match.amount_due.toLocaleString('id-ID')}</span>
                    <span>
                      Kehadiran: {match.attendance_fee > 0 
                        ? `Rp ${match.attendance_fee.toLocaleString('id-ID')}`
                        : 'Gratis'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900 dark:text-white mb-1 transition-colors duration-300">
                    Rp {match.total_amount.toLocaleString('id-ID')}
                  </div>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border-2 transition-colors duration-300 ${
                      match.payment_status === 'paid'
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-300 dark:border-transparent'
                        : match.payment_status === 'cancelled'
                        ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-transparent'
                        : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-transparent'
                    }`}
                  >
                    {match.payment_status === 'paid' ? 'Lunas' : match.payment_status === 'cancelled' ? 'Dibatalkan' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tutorial Overlay */}
      <TutorialOverlay
        steps={tutorialSteps}
        isActive={isTutorialActive}
        onClose={closeTutorial}
        tutorialKey="member-dashboard"
      />
    </div>
  );
}
