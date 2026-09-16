'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import FloatingAIChat from '@/components/FloatingAIChat';

export default function CikupaDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isSuperAdmin, isBranchAdmin, userBranchId, loading, canSwitchBranch, viewAs } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading && !user) {
        // Not logged in → go to shared login, redirect back here
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      } else if (!loading && viewAs === 'admin') {
        // Admin view → go to DLBC admin panel
        router.replace('/cikupa/admin');
        return;
      } else if (!loading && !isSuperAdmin && !isBranchAdmin && userBranchId === 'dlob-pusat' && !canSwitchBranch) {
        // Pure Pusat member → redirect to Pusat dashboard
        router.replace('/dashboard');
        return;
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [user, loading, router, pathname, isSuperAdmin, isBranchAdmin, userBranchId, canSwitchBranch, viewAs]);

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950">
      <DashboardSidebar isAdmin={false} branchSlug="cikupa" />
      <div className="flex-1 min-w-0 bg-white dark:bg-zinc-950 pt-14 lg:pt-0" key={`cikupa-member-${pathname}`}>
        {children}
      </div>
      <FloatingAIChat />
    </div>
  );
}
