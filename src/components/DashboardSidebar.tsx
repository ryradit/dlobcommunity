'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Menu, X, LayoutDashboard, BarChart3, CreditCard, Settings, LogOut, Home,
  Users, Shield, Sparkles, Dumbbell, FileText, TrendingUp, Sun, Moon,
  ChevronLeft, ChevronRight, MessageSquare, Trophy, ShoppingBag, Video
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import ViewSwitcher from './ViewSwitcher';
import BranchBadge from './BranchBadge';
import BranchSelector from './BranchSelector';

interface DashboardSidebarProps {
  isAdmin?: boolean;
  branchSlug?: 'pusat' | 'cikupa';
}

const springTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 35,
} as const;

const fadeSlide = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
  transition: { ...springTransition, stiffness: 300, damping: 30 },
};

export default function DashboardSidebar({ isAdmin = false, branchSlug = 'pusat' }: DashboardSidebarProps) {
  const isCikupa = branchSlug === 'cikupa';
  const prefix = isCikupa ? '/cikupa' : '';
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const { signOut, user, isSuperAdmin, canSwitchBranch } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const reduce = useReducedMotion();

  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setIsCollapsed(saved === 'true');
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev));
      return !prev;
    });
  }, []);

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

  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      const baseUrl = user.user_metadata.avatar_url.split('?')[0];
      setAvatarUrl(`${baseUrl}?t=${Date.now()}`);
    } else {
      setAvatarUrl('');
    }
  }, [user?.user_metadata?.avatar_url, user?.id]);

  const isOwner =
    user?.email?.toLowerCase().includes('ryradit') ||
    user?.email === 'ryradit@gmail.com';

  const userInitial =
    user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'U';

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';

  // ── Menu items ──
  const cikupaAdminMenuItems = [
    { label: 'Dashboard', href: `${prefix}/admin`, icon: Shield },
    { label: 'Kelola Anggota', href: `${prefix}/admin/members`, icon: Users },
    { label: 'Pembayaran', href: `${prefix}/admin/pembayaran`, icon: CreditCard },
    { label: 'Keuangan', href: `${prefix}/admin/keuangan`, icon: TrendingUp },
    { label: 'Analitik', href: `${prefix}/admin/analitik`, icon: BarChart3 },
    { label: 'Racik Tim Pintar', href: `${prefix}/admin/team-optimizer`, icon: Sparkles },
    { label: 'Statistik Member', href: `${prefix}/admin/member-statistik`, icon: Trophy },
    ...(isOwner ? [{ label: 'Analisis Video AI', href: `${prefix}/admin/video-analysis`, icon: Video }] : []),
    { label: 'Pengaturan', href: `${prefix}/admin/settings`, icon: Settings },
  ];

  const adminMenuItems = isCikupa ? cikupaAdminMenuItems : [
    { label: 'Dashboard', href: '/admin', icon: Shield },
    { label: 'Kelola Anggota', href: '/admin/members', icon: Users },
    { label: 'Pembayaran', href: '/admin/pembayaran', icon: CreditCard },
    { label: 'Keuangan', href: '/admin/keuangan', icon: TrendingUp },
    ...(isOwner ? [{ label: 'Rekap New Batch', href: '/admin/rekap-new-batch', icon: ShoppingBag }] : []),
    { label: 'Analitik', href: '/admin/analitik', icon: BarChart3 },
    { label: 'Survey Member', href: '/admin/survey', icon: MessageSquare },
    { label: 'AI Artikel Generator', href: '/admin/artikel', icon: FileText },
    { label: 'Racik Tim Pintar', href: '/admin/team-optimizer', icon: Sparkles },
    { label: 'Statistik Member', href: '/admin/member-statistik', icon: Trophy },
    ...(isOwner ? [{ label: 'Analisis Video AI', href: '/admin/video-analysis', icon: Video }] : []),
    { label: 'Pengaturan', href: '/admin/settings', icon: Settings },
  ];

  const memberMenuItems = [
    { label: 'Dashboard', href: `${prefix}/dashboard`, icon: LayoutDashboard },
    { label: 'Pembayaran', href: `${prefix}/dashboard/pembayaran`, icon: CreditCard },
    { label: 'Analitik', href: `${prefix}/dashboard/analitik`, icon: BarChart3 },
    { label: 'Training Center', href: `${prefix}/dashboard/training`, icon: Dumbbell },
    { label: 'Pengaturan Profil', href: `${prefix}/dashboard/settings`, icon: Settings },
  ];

  const menuItems = isAdmin ? adminMenuItems : memberMenuItems;

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* ── Mobile Top Bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 mobile-topbar flex items-center px-4 z-60 shrink-0">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-white/60 dark:bg-white/8 hover:bg-white/80 dark:hover:bg-white/12 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors"
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isOpen ? 'close' : 'menu'}
              initial={reduce ? false : { opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.15 }}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

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
        <div className="w-9" />
      </div>

      {/* ── Overlay ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: isCollapsed ? 64 : 260 }}
        transition={reduce ? { duration: 0 } : springTransition}
        className={`fixed left-0 top-14 h-[calc(100vh-3.5rem)] lg:top-0 lg:h-screen sidebar-glass z-50 lg:sticky lg:translate-x-0 lg:z-auto flex flex-col shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ minWidth: isCollapsed ? 64 : 260 }}
      >
        {/* ── Header: Logo + collapse ── */}
        <div
          className={`hidden lg:flex p-3 border-b border-slate-200/60 dark:border-white/[0.07] shrink-0 relative items-center ${
            isCollapsed ? 'justify-center' : 'justify-start gap-2.5'
          }`}
        >
          <Image
            src="/dlob.png"
            alt="DLOB"
            width={34}
            height={34}
            className="object-contain dark:invert transition-all duration-300 flex-shrink-0"
            style={{ width: 'auto', height: 'auto', maxWidth: '34px', maxHeight: '34px' }}
          />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div {...fadeSlide} className="flex-1 min-w-0">
                <BranchBadge size="sm" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.button
                {...fadeSlide}
                onClick={toggleCollapse}
                title="Ciutkan sidebar"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-2 flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/8 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ── Expand button when collapsed ── */}
        <AnimatePresence>
          {isCollapsed && (
            <motion.button
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleCollapse}
              title="Perluas sidebar"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="hidden lg:flex mx-auto mt-3 items-center justify-center w-8 h-8 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/8 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── Profile Card ── */}
        <div className={`shrink-0 transition-all duration-300 ${isCollapsed ? 'p-2 pt-3' : 'p-3'}`}>
          {isCollapsed ? (
            <div className="flex justify-center">
              <div
                className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#4382C8] via-[#7c5cbf] to-[#22c55e] flex items-center justify-center text-white font-bold text-sm shrink-0 avatar-ring"
                title={displayName}
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                    style={{ width: '100%', height: '100%' }}
                    unoptimized
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-premium p-3">
              {/* Aurora orbs behind card */}
              <div className="absolute inset-0 rounded-[16px] overflow-hidden pointer-events-none">
                <div className="aurora-a absolute -top-4 -right-4 w-16 h-16 rounded-full bg-[#4382C8]/20 blur-xl" />
                <div className="aurora-b absolute -bottom-2 -left-2 w-12 h-12 rounded-full bg-[#7c5cbf]/15 blur-lg" />
              </div>

              <div className="relative flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#4382C8] via-[#7c5cbf] to-[#22c55e] flex items-center justify-center text-white font-bold text-base shrink-0 avatar-ring">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      style={{ width: '100%', height: '100%' }}
                      unoptimized
                    />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-tight">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>
              </div>

              <Link
                href={isAdmin ? `${prefix}/admin/settings` : `${prefix}/dashboard/settings`}
                onClick={() => setIsOpen(false)}
                className="relative w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.07] hover:bg-[#4382C8]/10 dark:hover:bg-[#4382C8]/15 text-slate-700 dark:text-slate-300 hover:text-[#4382C8] dark:hover:text-[#7eb6f0] transition-all text-xs font-medium border border-slate-200/80 dark:border-white/[0.07]"
              >
                <Settings className="w-3.5 h-3.5" />
                Edit Profil
              </Link>
            </div>
          )}
        </div>

        {/* ── View Switcher ── */}
        {!isCollapsed && (
          <div className="px-3 pb-2 shrink-0">
            <ViewSwitcher />
          </div>
        )}

        {/* ── Branch Selector ── */}
        {!isCollapsed && (
          <BranchSelector className="mx-3 mb-2 shrink-0" />
        )}

        {/* ── Separator ── */}
        <div className="mx-3 mb-2 shrink-0">
          <div className="separator-glow" />
        </div>

        {/* ── Navigation ── */}
        <nav className={`flex-1 overflow-y-auto no-scrollbar pb-4 transition-all duration-300 ${isCollapsed ? 'px-1.5' : 'px-3'}`}>
          <div className="space-y-0.5">
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <motion.div
                  key={item.href}
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    ...springTransition,
                    delay: i * 0.03,
                    stiffness: 350,
                    damping: 32,
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    title={isCollapsed ? item.label : undefined}
                    className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium nav-item ${
                      isCollapsed ? 'justify-center' : ''
                    } ${
                      active
                        ? 'nav-active-glow'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {/* Active dot */}
                    {active && !isCollapsed && <span className="nav-dot" />}

                    <Icon
                      className={`shrink-0 transition-colors duration-150 ${
                        isCollapsed ? 'w-[18px] h-[18px]' : 'w-[17px] h-[17px]'
                      } ${active ? 'text-[#4382C8] dark:text-[#7eb6f0]' : ''}`}
                      strokeWidth={active ? 2.2 : 1.8}
                    />

                    {!isCollapsed && (
                      <span className={`truncate ${active ? 'text-[#4382C8] dark:text-[#7eb6f0]' : ''}`}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* ── Footer Actions ── */}
        <div className={`border-t border-slate-200/60 dark:border-white/[0.07] shrink-0 ${isCollapsed ? 'p-2 space-y-1' : 'p-3 space-y-1'}`}>
          {/* Theme toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-slate-200 transition-colors text-sm font-medium ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            {theme === 'dark'
              ? <Sun className="w-[17px] h-[17px] shrink-0" strokeWidth={1.8} />
              : <Moon className="w-[17px] h-[17px] shrink-0" strokeWidth={1.8} />
            }
            {!isCollapsed && <span>{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>}
          </motion.button>

          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            title={isCollapsed ? 'Kembali ke Beranda' : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-slate-200 transition-colors text-sm font-medium ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <Home className="w-[17px] h-[17px] shrink-0" strokeWidth={1.8} />
            {!isCollapsed && <span>Kembali ke Beranda</span>}
          </Link>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowLogoutModal(true)}
            title={isCollapsed ? 'Keluar' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-rose-500 dark:text-rose-400 hover:bg-rose-500/8 dark:hover:bg-rose-500/10 transition-colors text-sm font-medium ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-[17px] h-[17px] shrink-0" strokeWidth={1.8} />
            {!isCollapsed && <span>Keluar</span>}
          </motion.button>
        </div>
      </motion.aside>

      {/* ── Logout Modal ── */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ ...springTransition, stiffness: 350 }}
              onClick={e => e.stopPropagation()}
              className="glass-premium max-w-sm w-full p-6 space-y-5"
            >
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Konfirmasi Keluar</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Anda akan keluar dari akun dan kembali ke halaman beranda.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/[0.14] transition-colors text-sm font-semibold disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoggingOut ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Keluar...
                    </>
                  ) : (
                    'Ya, Keluar'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
