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
  const { logout, user, avatarUpdateTrigger } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // Update avatar URL with cache-busting when user data changes OR when avatarUpdateTrigger changes
  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      const baseUrl = user.user_metadata.avatar_url.split('?')[0]; // Remove existing query params
      setAvatarUrl(`${baseUrl}?t=${Date.now()}`);
    }
  }, [user?.user_metadata?.avatar_url, avatarUpdateTrigger]);

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
        className={`fixed left-0 top-0 h-screen w-80 sm:w-72 bg-zinc-950 border-r border-white/10 transition-transform duration-300 z-50 lg:relative lg:translate-x-0 lg:z-auto flex flex-col overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Section with Logo & Panel Info */}
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24">
              <Image
                src="/dlob.png"
                alt="DLOB"
                width={96}
                height={96}
                className="object-contain brightness-0 invert"
              />
            </div>
          </div>
          
          {/* Panel Badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium w-full justify-center ${
            isAdmin 
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          }`}>
            {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            {isAdmin ? 'Admin Panel' : 'Member Dashboard'}
          </div>
        </div>

        {/* View Switcher for Admins */}
        <div className="px-4 pb-3">
          <ViewSwitcher />
        </div>

        {/* Profile Card */}
        <div className="p-4">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-white/10 rounded-xl p-4 shadow-lg">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                    key={avatarUrl}
                    unoptimized
                  />
                ) : (
                  <span>{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white mb-0.5 truncate">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-zinc-400 truncate leading-tight">
                  {user?.email}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 active:bg-white/20 text-white transition-all text-sm font-medium border border-white/10 hover:border-white/20"
            >
              <Settings className="w-4 h-4" />
              Edit Profil
            </Link>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
                  active
                    ? 'bg-white text-zinc-950 shadow-lg'
                    : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Kembali ke Beranda</span>
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20 hover:border-red-500/30"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
