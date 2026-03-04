'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Menu, X, LayoutDashboard, BarChart3, CreditCard, Settings, LogOut, Home, Users, Shield, Sparkles, Dumbbell, FileText, TrendingUp, Sun, Moon, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import ViewSwitcher from './ViewSwitcher';

interface DashboardSidebarProps {
  isAdmin?: boolean;
}

export default function DashboardSidebar({ isAdmin = false }: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setIsCollapsed(saved === 'true');
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev));
      return !prev;
    });
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  // Update avatar URL with cache-busting when user data changes
  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      const baseUrl = user.user_metadata.avatar_url.split('?')[0];
      setAvatarUrl(`${baseUrl}?t=${Date.now()}`);
    } else {
      setAvatarUrl(''); // Clear avatar if none exists
    }
  }, [user?.user_metadata?.avatar_url, user?.id]); // Also watch user id to ensure refresh on user change

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
      label: 'Keuangan',
      href: '/admin/keuangan',
      icon: TrendingUp,
    },
    {
      label: 'Analitik',
      href: '/admin/analitik',
      icon: BarChart3,
    },
    {
      label: 'Survey Member',
      href: '/admin/survey',
      icon: MessageSquare,
    },
    {
      label: 'AI Artikel Generator',
      href: '/admin/artikel',
      icon: FileText,
    },
    {
      label: 'Racik Tim Pintar',
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
      label: 'Pembayaran',
      href: '/dashboard/pembayaran',
      icon: CreditCard,
    },
    {
      label: 'Analitik',
      href: '/dashboard/analitik',
      icon: BarChart3,
    },
    {
      label: 'Training Center',
      href: '/dashboard/training',
      icon: Dumbbell,
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
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-white/10 flex items-center px-4 z-[60] shrink-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg text-gray-900 dark:text-white transition-colors border border-gray-200 dark:border-white/20"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex-1 flex justify-center">
          <Image
            src="/dlob.png"
            alt="DLOB"
            width={36}
            height={36}
            className="object-contain dark:invert"
            style={{ width: 'auto', height: '36px' }}
          />
        </div>
        {/* spacer to balance the button */}
        <div className="w-9" />
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
        className={`fixed left-0 top-14 h-[calc(100vh-3.5rem)] lg:top-0 lg:h-screen bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-white/10 transition-all duration-300 z-50 lg:sticky lg:translate-x-0 lg:z-auto flex flex-col shrink-0 ${
          isCollapsed ? 'w-16' : 'w-72'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header Section with Logo + Collapse Toggle — desktop only */}
        <div className="hidden lg:flex p-3 border-b border-gray-200 dark:border-white/10 shrink-0 transition-colors duration-300 relative items-center justify-center">
          <Image
            src="/dlob.png"
            alt="DLOB"
            width={isCollapsed ? 32 : 48}
            height={isCollapsed ? 32 : 48}
            className="object-contain dark:invert transition-all duration-300"
            style={{ width: 'auto', height: 'auto', maxWidth: isCollapsed ? '32px' : '48px', maxHeight: isCollapsed ? '32px' : '48px' }}
          />
          {/* Desktop collapse toggle — only visible when expanded */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              title="Ciutkan sidebar"
              className="hidden lg:flex absolute right-2 items-center justify-center w-7 h-7 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all duration-300 shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand button — shown at top of nav when collapsed */}
        {isCollapsed && (
          <button
            onClick={toggleCollapse}
            title="Perluas sidebar"
            className="hidden lg:flex mx-auto mt-3 items-center justify-center w-8 h-8 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all duration-300 shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Profile Card */}
        <div className={`shrink-0 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {isCollapsed ? (
            <div className="flex justify-center">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0" title={user?.user_metadata?.full_name || user?.email || ''}>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Profile" width={36} height={36} className="w-full h-full object-cover" style={{ width: '100%', height: '100%' }} key={avatarUrl} unoptimized />
                ) : (
                  <span>{user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-linear-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-900/50 border border-gray-200 dark:border-white/10 rounded-xl p-3.5 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-base shrink-0">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Profile" width={44} height={44} className="w-full h-full object-cover" style={{ width: '100%', height: '100%' }} key={avatarUrl} unoptimized />
                  ) : (
                    <span>{user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1 truncate transition-colors duration-300">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-zinc-400 truncate transition-colors duration-300">
                    {user?.email}
                  </p>
                </div>
              </div>
              <Link
                href={isAdmin ? "/admin/settings" : "/dashboard/settings"}
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/15 text-gray-900 dark:text-white transition-all text-xs font-medium border border-gray-300 dark:border-white/10"
              >
                <Settings className="w-3.5 h-3.5" />
                Edit Profil
              </Link>
            </div>
          )}
        </div>

        {/* View Switcher for dual-role users */}
        {!isCollapsed && (
          <div className="px-4 pb-3 shrink-0">
            <ViewSwitcher />
          </div>
        )}

        {/* Navigation Menu */}
        <nav className={`space-y-1 flex-1 overflow-y-auto pb-4 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-sm font-medium ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                    : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className={`border-t border-gray-200 dark:border-white/10 space-y-1.5 shrink-0 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300 text-sm font-medium border border-gray-200 dark:border-white/10 ${isCollapsed ? 'justify-center' : ''}`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
            {!isCollapsed && <span>{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>}
          </button>

          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            title={isCollapsed ? 'Kembali ke Beranda' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300 text-sm font-medium ${isCollapsed ? 'justify-center' : ''}`}
          >
            <Home className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Kembali ke Beranda</span>}
          </Link>

          <button
            onClick={() => setShowLogoutModal(true)}
            title={isCollapsed ? 'Keluar' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20 text-sm font-medium ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <LogOut className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Konfirmasi Keluar</h3>
                <p className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-300">Apakah Anda yakin ingin keluar?</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-zinc-300 text-sm transition-colors duration-300">
              Anda akan keluar dari akun dan kembali ke halaman beranda.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Keluar...</span>
                  </>
                ) : (
                  'Ya, Keluar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
