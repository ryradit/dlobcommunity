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

        // Prioritize user_metadata full_name (most up-to-date), then profiles table, then email
        const name = user.user_metadata?.full_name || profile?.full_name || profile?.email?.split('@')[0] || '';
        setMemberName(name);

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

        if (!name) {
          setLoading(false);
          return;
        }

        // Fetch matches and membership in parallel with caching
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const [matchesResult, membershipResult] = await Promise.allSettled([
          cachedQuery(
            `member-matches-${name}`,
            async () => {
              const result = await supabase
                .from('match_members')
                .select(`
                  *,
                  matches (
                    match_number,
                    created_at,
                    shuttlecock_count
                  )
                `)
                .eq('member_name', name)
                .order('created_at', { ascending: false });
              return result;
            },
            30000 // 30 seconds cache
          ),
          cachedQuery(
            `member-membership-${name}-${currentMonth}-${currentYear}`,
            async () => {
              const result = await supabase
                .from('memberships')
                .select('*')
                .eq('member_name', name)
                .eq('month', currentMonth)
                .eq('year', currentYear)
                .maybeSingle();
              return result;
            },
            60000 // 1 minute cache for membership
          ),
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
      subtext: `${stats.pendingCount} matches`,
    },
    {
      label: 'Total Paid',
      value: loading ? '...' : `Rp ${stats.totalPaid.toLocaleString('id-ID')}`,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      subtext: `${stats.paidCount} matches`,
    },
    {
      label: 'Membership',
      value: loading ? '...' : (myMembership?.payment_status === 'paid' ? 'Active' : 'Inactive'),
      icon: Award,
      color: myMembership?.payment_status === 'paid' ? 'from-purple-500 to-purple-600' : 'from-zinc-500 to-zinc-600',
      subtext: myMembership ? `Rp ${myMembership.amount.toLocaleString('id-ID')}` : 'No membership',
    },
    {
      label: 'Total Matches',
      value: loading ? '...' : myMatches.length.toLocaleString(),
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      subtext: 'All time',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6">
      <ProfileCompletionWarning />
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isFirstLogin ? (
              <>Selamat datang di Dashboard Member, {memberName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}!</>
            ) : (
              <>Selamat datang kembali, {memberName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}!</>
            )}
          </h1>
          <p className="text-zinc-300">Berikut ringkasan pembayaran dan riwayat pertandingan Anda.</p>
        </div>
        
        <button
          onClick={toggleTutorial}
          className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-colors"
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
                className={`${cssClass} bg-zinc-900 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors`}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-zinc-300">{stat.label}</div>
                {stat.subtext && (
                  <div className="text-xs text-zinc-400 mt-1">{stat.subtext}</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Membership Status */}
      {myMembership && (
        <div className="mb-8 bg-gradient-to-br from-purple-900/50 to-purple-800/50 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-purple-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Status Membership</h3>
                <p className="text-sm text-purple-200">
                  {myMembership.weeks_in_month} minggu - Rp {myMembership.amount.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                myMembership.payment_status === 'paid'
                  ? 'bg-green-500/20 text-green-400'
                  : myMembership.payment_status === 'cancelled'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              {myMembership.payment_status === 'paid' ? 'Lunas' : myMembership.payment_status === 'cancelled' ? 'Dibatalkan' : 'Pending'}
            </span>
          </div>
          {myMembership.payment_status === 'paid' && (
            <p className="text-purple-200 text-sm mt-3">
              ✨ Anda tidak perlu membayar biaya kehadiran untuk pertandingan bulan ini!
            </p>
          )}
        </div>
      )}

      {/* Recent Matches */}
      <div className="member-recent-matches bg-zinc-900 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          Pertandingan Terkini
        </h2>
        
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <MatchCardSkeleton key={i} />)}
          </div>
        ) : myMatches.length === 0 ? (
          <p className="text-zinc-300">Belum ada pertandingan.</p>
        ) : (
          <div className="space-y-3">
            {myMatches.slice(0, 10).map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">
                      Pertandingan #{match.matches.match_number}
                    </h3>
                    {match.has_membership && (
                      <Award className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <p className="text-sm text-zinc-300">
                    {new Date(match.matches.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-zinc-400">
                    <span>Shuttlecock: Rp {match.amount_due.toLocaleString('id-ID')}</span>
                    <span>
                      Kehadiran: {match.attendance_fee > 0 
                        ? `Rp ${match.attendance_fee.toLocaleString('id-ID')}`
                        : 'Gratis'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white mb-1">
                    Rp {match.total_amount.toLocaleString('id-ID')}
                  </div>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      match.payment_status === 'paid'
                        ? 'bg-green-500/20 text-green-400'
                        : match.payment_status === 'cancelled'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
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
