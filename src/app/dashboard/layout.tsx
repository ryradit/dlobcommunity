'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import FloatingAIChat from '@/components/FloatingAIChat';
import ProfileCompletionWarning from '@/components/ProfileCompletionWarning';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isBranchAdmin, userBranchId, viewAs, loading, canSwitchBranch, isSuperAdmin, isNeutral } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading && !user) {
        // Not logged in → go to login
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (!loading && user && isNeutral && pathname !== '/dashboard/choose-branch') {
        // Neutral user (no branch assigned yet) → must choose branch first
        router.replace('/dashboard/choose-branch');
      } else if (!loading && viewAs === 'admin') {
        const email = user?.email?.toLowerCase().trim();
        if (isBranchAdmin && !isSuperAdmin && email !== 'dlob.official.tng@gmail.com') {
          router.replace('/cikupa/admin');
        } else {
          router.replace('/admin');
        }
      } else if (!loading && !isAdmin && userBranchId === 'dlob-cikupa' && !canSwitchBranch && !isSuperAdmin) {
        // Dedicated DLBC member → redirect to DLBC dashboard
        router.replace('/cikupa/dashboard');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [user, isAdmin, isBranchAdmin, userBranchId, viewAs, loading, router, pathname, canSwitchBranch, isSuperAdmin, isNeutral]);

  // Always show content immediately for fast perceived performance
  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950">
      <DashboardSidebar isAdmin={false} />
      <div className="flex-1 min-w-0 bg-white dark:bg-zinc-950 pt-14 lg:pt-0" key={`member-${pathname}`}>
        {children}
      </div>
      <FloatingAIChat />
    </div>
  );
}
