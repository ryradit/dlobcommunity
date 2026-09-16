'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Shield, User } from 'lucide-react';

export default function ViewSwitcher() {
  const { isAdmin, isMember, isBranchAdmin, isSuperAdmin, userBranchId, viewAs, switchView } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Detect whether current page is admin or member route
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/cikupa/admin');
  const isMemberRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/cikupa/dashboard');

  // Active view matches current page if on admin or dashboard, otherwise falls back to viewAs
  const activeView = isAdminRoute ? 'admin' : isMemberRoute ? 'member' : viewAs;

  // Keep viewAs in AuthContext in sync with the route
  useEffect(() => {
    if (!isAdmin || !isMember) return;
    if (isAdminRoute && viewAs !== 'admin') {
      switchView('admin');
    } else if (isMemberRoute && viewAs !== 'member') {
      switchView('member');
    }
  }, [isAdmin, isMember, pathname, isAdminRoute, isMemberRoute, viewAs, switchView]);

  if (!isAdmin || !isMember) {
    return null;
  }

  const handleSwitch = (target: 'admin' | 'member') => {
    switchView(target);
    const isCikupa = pathname.startsWith('/cikupa') || (isBranchAdmin && userBranchId === 'dlob-cikupa');

    if (target === 'admin') {
      if (isCikupa && !isSuperAdmin) {
        router.push('/cikupa/admin');
      } else if (pathname.startsWith('/cikupa')) {
        router.push('/cikupa/admin');
      } else {
        router.push('/admin');
      }
    } else {
      if (isCikupa && !isSuperAdmin) {
        router.push('/cikupa/dashboard');
      } else if (pathname.startsWith('/cikupa')) {
        router.push('/cikupa/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-2 transition-all duration-300">
      <div className="flex gap-1">
        <button
          onClick={() => handleSwitch('admin')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
            activeView === 'admin'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Admin
        </button>
        <button
          onClick={() => handleSwitch('member')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
            activeView === 'member'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-800'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Member
        </button>
      </div>
    </div>
  );
}
