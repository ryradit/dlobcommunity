'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { GitBranch } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch, BRANCHES } from '@/contexts/BranchContext';

interface BranchSelectorProps {
  /** If true, shows compact pill version without outer title */
  compact?: boolean;
  className?: string;
}

export default function BranchSelector({ compact = false, className = '' }: BranchSelectorProps) {
  const { isSuperAdmin, canSwitchBranch, isAdmin, user } = useAuth();
  const { setActiveBranch } = useBranch();
  const router = useRouter();
  const pathname = usePathname();

  // Only Super Admin, Dual Admin, and designated multi-branch members can switch branches
  // Single-branch members are locked to their own branch
  if (!isSuperAdmin && !canSwitchBranch) {
    return null;
  }

  const isCurrentAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/cikupa/admin');
  const isCurrentCikupa = pathname.startsWith('/cikupa');
  const activeBranchId = isCurrentCikupa ? 'dlob-cikupa' : 'dlob-pusat';

  // In admin mode: only Super Admin and Dual Admin (Wahyu) can switch admin branches
  // Edi is admin of DLBC only, so he switches branch when viewing as member
  if (isCurrentAdminRoute && !isSuperAdmin && user?.email !== 'dlob.official.tng@gmail.com') {
    return null;
  }

  // Smart sub-route translation between branches
  const getDestinationUrl = (targetBranchId: 'dlob-pusat' | 'dlob-cikupa'): string => {
    if (targetBranchId === 'dlob-cikupa') {
      if (isCurrentAdminRoute) {
        if (pathname === '/admin') return '/cikupa/admin';
        if (pathname.startsWith('/admin/members')) return '/cikupa/admin/members';
        if (pathname.startsWith('/admin/pembayaran')) return '/cikupa/admin/pembayaran';
        if (pathname.startsWith('/admin/keuangan')) return '/cikupa/admin/keuangan';
        if (pathname.startsWith('/admin/analitik')) return '/cikupa/admin/analitik';
        if (pathname.startsWith('/admin/team-optimizer')) return '/cikupa/admin/team-optimizer';
        if (pathname.startsWith('/admin/member-statistik')) return '/cikupa/admin/member-statistik';
        if (pathname.startsWith('/admin/settings')) return '/cikupa/admin/settings';
        if (pathname.startsWith('/admin/match-image-extraction')) return '/cikupa/admin/match-image-extraction';
        return '/cikupa/admin';
      } else {
        if (pathname === '/dashboard') return '/cikupa/dashboard';
        if (pathname.startsWith('/dashboard/pembayaran')) return '/cikupa/dashboard/pembayaran';
        if (pathname.startsWith('/dashboard/analitik')) return '/cikupa/dashboard/analitik';
        if (pathname.startsWith('/dashboard/training-coach')) return '/cikupa/dashboard/training-coach';
        if (pathname.startsWith('/dashboard/training')) return '/cikupa/dashboard/training';
        if (pathname.startsWith('/dashboard/coaching')) return '/cikupa/dashboard/coaching';
        if (pathname.startsWith('/dashboard/settings')) return '/cikupa/dashboard/settings';
        return '/cikupa/dashboard';
      }
    } else {
      // Switching to dlob-pusat
      if (isCurrentAdminRoute) {
        if (pathname === '/cikupa/admin') return '/admin';
        if (pathname.startsWith('/cikupa/admin/members')) return '/admin/members';
        if (pathname.startsWith('/cikupa/admin/pembayaran')) return '/admin/pembayaran';
        if (pathname.startsWith('/cikupa/admin/keuangan')) return '/admin/keuangan';
        if (pathname.startsWith('/cikupa/admin/analitik')) return '/admin/analitik';
        if (pathname.startsWith('/cikupa/admin/team-optimizer')) return '/admin/team-optimizer';
        if (pathname.startsWith('/cikupa/admin/member-statistik')) return '/admin/member-statistik';
        if (pathname.startsWith('/cikupa/admin/settings')) return '/admin/settings';
        if (pathname.startsWith('/cikupa/admin/match-image-extraction')) return '/admin/match-image-extraction';
        return '/admin';
      } else {
        if (pathname === '/cikupa/dashboard') return '/dashboard';
        if (pathname.startsWith('/cikupa/dashboard/pembayaran')) return '/dashboard/pembayaran';
        if (pathname.startsWith('/cikupa/dashboard/analitik')) return '/dashboard/analitik';
        if (pathname.startsWith('/cikupa/dashboard/training-coach')) return '/dashboard/training-coach';
        if (pathname.startsWith('/cikupa/dashboard/training')) return '/dashboard/training';
        if (pathname.startsWith('/cikupa/dashboard/coaching')) return '/dashboard/coaching';
        if (pathname.startsWith('/cikupa/dashboard/settings')) return '/dashboard/settings';
        return '/dashboard';
      }
    }
  };

  const handleSelectBranch = (targetId: 'dlob-pusat' | 'dlob-cikupa') => {
    if (targetId === activeBranchId) return;
    setActiveBranch(BRANCHES[targetId]);
    const destination = getDestinationUrl(targetId);
    router.push(destination);
  };

  return (
    <div
      className={`bg-gray-100/90 dark:bg-zinc-900/90 border border-gray-200 dark:border-white/10 rounded-2xl p-1.5 backdrop-blur-md shadow-xs transition-all ${className}`}
    >
      {/* Header Info */}
      {!compact && (
        <div className="flex items-center justify-between px-2 pb-1.5 pt-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
            <GitBranch className="w-3 h-3 text-gray-400" />
            Cabang Komunitas
          </span>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border transition-all"
            style={{
              color: isCurrentCikupa ? '#10B981' : '#3B82F6',
              borderColor: isCurrentCikupa ? '#10B98140' : '#3B82F640',
              backgroundColor: isCurrentCikupa ? '#10B98115' : '#3B82F615',
            }}
          >
            {isCurrentCikupa ? 'DLBC Aktif' : 'Pusat Aktif'}
          </span>
        </div>
      )}

      {/* Dual Segmented Buttons */}
      <div className="grid grid-cols-2 gap-1.5 relative">
        {/* DLOB Pusat Button */}
        <button
          type="button"
          onClick={() => handleSelectBranch('dlob-pusat')}
          className={`relative flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
            !isCurrentCikupa
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/30'
              : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-zinc-800/70'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
              !isCurrentCikupa
                ? 'bg-cyan-300 shadow-[0_0_8px_#22d3ee] animate-pulse'
                : 'bg-gray-400 dark:bg-zinc-600'
            }`}
          />
          <div className="text-left flex flex-col min-w-0">
            <span className="truncate leading-tight">DLOB Pusat</span>
            {!compact && (
              <span
                className={`text-[9px] font-medium leading-tight ${
                  !isCurrentCikupa ? 'text-blue-100/80' : 'text-gray-400 dark:text-zinc-500'
                }`}
              >
                Tangerang
              </span>
            )}
          </div>
        </button>

        {/* DLBC Cikupa Button */}
        <button
          type="button"
          onClick={() => handleSelectBranch('dlob-cikupa')}
          className={`relative flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
            isCurrentCikupa
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 border border-emerald-400/30'
              : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-zinc-800/70'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
              isCurrentCikupa
                ? 'bg-emerald-300 shadow-[0_0_8px_#34d399] animate-pulse'
                : 'bg-gray-400 dark:bg-zinc-600'
            }`}
          />
          <div className="text-left flex flex-col min-w-0">
            <span className="truncate leading-tight">DLBC Cikupa</span>
            {!compact && (
              <span
                className={`text-[9px] font-medium leading-tight ${
                  isCurrentCikupa ? 'text-emerald-100/80' : 'text-gray-400 dark:text-zinc-500'
                }`}
              >
                Cikupa
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
