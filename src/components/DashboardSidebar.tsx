'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, LayoutDashboard, BarChart3, CreditCard, Settings, LogOut, Home, User, Users, Shield, Sparkles } from 'lucide-react';
import Image from 'next/image';
import ViewSwitcher from './ViewSwitcher';

interface DashboardSidebarProps {
  isAdmin?: boolean;
}

export default function DashboardSidebar({ isAdmin = false }: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // Update avatar URL with cache-busting when user data changes
  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      const baseUrl = user.user_metadata.avatar_url.split('?')[0];
      setAvatarUrl(`${baseUrl}?t=${Date.now()}`);
    }
  }, [user?.user_metadata?.avatar_url]);

  const adminMenuItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: Shield,
    },
    {
      label: 'Kelola Anggota',
      href: '/admin/members',
      icon: Users,
    },
    {
      label: 'Pembayaran',
      href: '/admin/pembayaran',
      icon: CreditCard,
    },
    {
      label: 'Analitik',
      href: '/admin/analitik',
      icon: BarChart3,
    },
    {
      label: 'Team Optimizer',
      href: '/admin/team-optimizer',
      icon: Sparkles,
    },
    {
      label: 'Pengaturan',
      href: '/admin/settings',
      icon: Settings,
    },
  ];

  const memberMenuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Analitik',
      href: '/dashboard/analitik',
      icon: BarChart3,
    },
    {
      label: 'Pembayaran',
      href: '/dashboard/pembayaran',
      icon: CreditCard,
    },
    {
      label: 'Pengaturan Profil',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  const menuItems = isAdmin ? adminMenuItems : memberMenuItems;

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-white transition-colors border border-white/20 shadow-lg"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-zinc-950 border-r border-white/10 transition-transform duration-300 z-50 lg:relative lg:translate-x-0 lg:z-auto flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Section with Logo */}
        <div className="p-4 border-b border-white/10 shrink-0">
          <div className="flex justify-center">
            <div className="relative w-16 h-16">
              <Image
                src="/dlob.png"
                alt="DLOB"
                width={64}
                height={64}
                className="object-contain brightness-0 invert"
              />
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="p-4 shrink-0">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-white/10 rounded-xl p-3.5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    width={44}
                    height={44}
                    className="w-full h-full object-cover"
                    key={avatarUrl}
                    unoptimized
                  />
                ) : (
                  <span>{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white mb-1 truncate">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-zinc-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-all text-xs font-medium border border-white/10"
            >
              <Settings className="w-3.5 h-3.5" />
              Edit Profil
            </Link>
          </div>
        </div>

        {/* View Switcher for dual-role users */}
        <div className="px-4 pb-3 shrink-0">
          <ViewSwitcher />
        </div>

        {/* Navigation Menu */}
        <nav className="px-4 space-y-1.5 flex-1 overflow-y-auto pb-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-sm font-medium whitespace-nowrap ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                    : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 space-y-2 shrink-0">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-300 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
          >
            <Home className="w-4.5 h-4.5 flex-shrink-0" />
            <span>Kembali ke Beranda</span>
          </Link>

          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20 text-sm font-medium"
          >
            <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
