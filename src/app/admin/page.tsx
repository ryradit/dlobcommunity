'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import { Users, Zap, TrendingUp, Calendar, Shield } from 'lucide-react';

interface AdminStats {
  totalMembers: number;
  totalAdmins: number;
  activeProjects: number;
  pendingApprovals: number;
  events: number;
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

  useEffect(() => {
    async function fetchAdminStats() {
      setLoading(true);
      try {
        // Fetch total members count
        const { count: membersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'member');

        // Fetch total admins count
        const { count: adminsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');

        // Fetch active users count
        const { count: activeUsersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // Fetch total users
        const { count: totalUsersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalMembers: membersCount || 0,
          totalAdmins: adminsCount || 0,
          activeProjects: activeUsersCount || 0,
          pendingApprovals: 0,
          events: totalUsersCount || 0,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAdminStats();
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
              <div className="text-sm text-zinc-400">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Pendaftaran Pengguna Terbaru</h2>
          <p className="text-zinc-400">
            {loading ? 'Memuat...' : 'Tidak ada pendaftaran terbaru.'}
          </p>
        </div>
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Aktivitas Sistem</h2>
          <p className="text-zinc-400">
            {loading ? 'Memuat...' : 'Tidak ada aktivitas terbaru.'}
          </p>
        </div>
      </div>
    </div>
  );
}
