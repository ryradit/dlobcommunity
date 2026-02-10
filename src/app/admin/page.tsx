'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import { usePathname } from 'next/navigation';
import { Users, Zap, TrendingUp, Calendar, Shield, Activity, UserPlus, Edit, Award, Target } from 'lucide-react';
import { StatCardSkeleton, ActivityItemSkeleton, ChartSkeleton } from '@/components/LoadingSkeletons';

interface AdminStats {
  totalMembers: number;
  totalAdmins: number;
  activeProjects: number;
  pendingApprovals: number;
  events: number;
}

interface ActivityItem {
  id: string;
  type: 'registration' | 'update';
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

export default function AdminDashboardPage() {
  const { user } = useAuth();
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

  useEffect(() => {
    let mounted = true;

    async function fetchAdminStats() {
      if (!mounted) return;
      
      setLoading(true);
      
      // Fetch all stats in parallel for faster loading
      const [statsResult, activitiesResult, matchesResult] = await Promise.allSettled([
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

  const statsDisplay = [
    {
      label: 'Total Anggota',
      value: loading ? '...' : stats.totalMembers.toLocaleString(),
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Admin',
      value: loading ? '...' : stats.totalAdmins.toLocaleString(),
      icon: Shield,
      color: 'from-red-500 to-red-600',
    },
    {
      label: 'Pengguna Aktif',
      value: loading ? '...' : stats.activeProjects.toLocaleString(),
      icon: Zap,
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Total Pengguna',
      value: loading ? '...' : stats.events.toLocaleString(),
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
    },
    {
      label: 'Acara',
      value: loading ? '...' : stats.events.toLocaleString(),
      icon: Calendar,
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-red-400" />
          <h1 className="text-3xl font-bold text-white">
            Dashboard Admin
          </h1>
        </div>
        <p className="text-zinc-400">
          Selamat datang kembali, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}! Kelola komunitas Anda dari sini.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {loading ? (
          // Show skeleton loading states
          [...Array(5)].map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          statsDisplay.map((stat) => {
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
                <div className="text-sm text-zinc-400">{stat.label}</div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Aktivitas Sistem</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <ActivityItemSkeleton key={i} />)}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-zinc-400">Tidak ada aktivitas terbaru.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.map((activity) => {
                const Icon = activity.icon;
                const timeAgo = getTimeAgo(activity.timestamp);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                  >
                    <div className={`p-2 rounded-lg bg-zinc-900 ${activity.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        <span className="font-semibold">{activity.user}</span>
                        {activity.type === 'registration' && ' bergabung ke sistem'}
                        {activity.type === 'update' && ' memperbarui profil'}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">{timeAgo}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Performance Chart */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Performa Terbaik</h2>
          </div>
          {loading ? (
            <ChartSkeleton />
          ) : topPerformers.length === 0 ? (
            <p className="text-zinc-400">Belum ada data performa.</p>
          ) : (
            <div className="space-y-4">
              {topPerformers.map((member, index) => {
                const isWin = member.type === 'win';
                const percentage = (member.streak / 10) * 100;
                return (
                  <div key={member.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-sm w-6">#{index + 1}</span>
                        <span className="text-white font-medium">{member.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          isWin ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {member.streak} {isWin ? 'Menang' : 'Kalah'} Beruntun
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                          isWin 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                            : 'bg-gradient-to-r from-red-500 to-rose-400'
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
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Pemain Paling Aktif</h2>
          </div>
          {loading ? (
            <p className="text-zinc-400">Memuat data...</p>
          ) : mostActivePlayers.length === 0 ? (
            <p className="text-zinc-400">Belum ada data pertandingan.</p>
          ) : (
            <div className="space-y-4">
              {mostActivePlayers.map((player, index) => {
                const maxMatches = mostActivePlayers[0]?.matches || 10;
                const percentage = (player.matches / maxMatches) * 100;
                return (
                  <div key={player.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-sm w-6">#{index + 1}</span>
                        <span className="text-white font-medium">{player.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-cyan-400">
                          {player.matches} Pertandingan
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all bg-gradient-to-r from-cyan-500 to-blue-400"
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
