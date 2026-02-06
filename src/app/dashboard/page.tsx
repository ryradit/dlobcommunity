'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import { CreditCard, Award, TrendingUp, Calendar, CheckCircle, Clock } from 'lucide-react';

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
  const { user } = useAuth();
  const pathname = usePathname();
  const [myMatches, setMyMatches] = useState<MatchMember[]>([]);
  const [myMembership, setMyMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberName, setMemberName] = useState('');

  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;

      setLoading(true);
      try {
        // Get user profile to get full name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();

        const name = profile?.full_name || profile?.email?.split('@')[0] || '';
        setMemberName(name);

        // Fetch user's matches
        const { data: matchesData, error: matchesError } = await supabase
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

        if (!matchesError) {
          setMyMatches(matchesData || []);
        }

        // Fetch current membership
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const { data: membershipData, error: membershipError } = await supabase
          .from('memberships')
          .select('*')
          .eq('member_name', name)
          .eq('month', currentMonth)
          .eq('year', currentYear)
          .maybeSingle();

        if (!membershipError) {
          setMyMembership(membershipData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user, pathname]);

  // Calculate stats
  const totalPending = myMatches
    .filter(m => m.payment_status === 'pending')
    .reduce((sum, m) => sum + m.total_amount, 0);

  const totalPaid = myMatches
    .filter(m => m.payment_status === 'paid')
    .reduce((sum, m) => sum + m.total_amount, 0);

  const pendingCount = myMatches.filter(m => m.payment_status === 'pending').length;
  const paidCount = myMatches.filter(m => m.payment_status === 'paid').length;

  const statsDisplay = [
    {
      label: 'Total Pending',
      value: loading ? '...' : `Rp ${totalPending.toLocaleString('id-ID')}`,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      subtext: `${pendingCount} matches`,
    },
    {
      label: 'Total Paid',
      value: loading ? '...' : `Rp ${totalPaid.toLocaleString('id-ID')}`,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      subtext: `${paidCount} matches`,
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Selamat datang kembali, {memberName || user?.email?.split('@')[0] || 'User'}!
        </h1>
        <p className="text-zinc-300">Berikut ringkasan pembayaran dan riwayat pertandingan Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsDisplay.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-zinc-900 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors"
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
        })}
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
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          Pertandingan Terkini
        </h2>
        
        {loading ? (
          <p className="text-zinc-300">Memuat...</p>
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
    </div>
  );
}
