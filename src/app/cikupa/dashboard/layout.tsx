'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import FloatingAIChat from '@/components/FloatingAIChat';

export default function CikupaDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isSuperAdmin, isBranchAdmin, userBranchId, loading, canSwitchBranch, viewAs, switchView } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (!user) {
        // Not logged in → go to shared login, redirect back here
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      } else if (!isSuperAdmin && !isBranchAdmin && userBranchId === 'dlob-pusat' && !canSwitchBranch) {
        // Pure Pusat member → redirect to Pusat dashboard
        router.replace('/dashboard');
        return;
      } else if (viewAs === 'admin') {
        // Sync view mode to member while on member dashboard
        switchView('member');
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [user, loading, router, pathname, isSuperAdmin, isBranchAdmin, userBranchId, canSwitchBranch, viewAs, switchView]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#09090e] relative overflow-hidden">
      {/* Global Cikupa Dashboard Aurora Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="aurora-a absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/8 dark:bg-emerald-500/6 blur-[100px]" />
        <div className="aurora-b absolute bottom-[-5%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-[#4382C8]/6 dark:bg-[#4382C8]/5 blur-[100px]" />
      </div>
      <DashboardSidebar isAdmin={false} branchSlug="cikupa" />
      <div className="flex-1 min-w-0 relative z-10 pt-14 lg:pt-0" key={`cikupa-member-${pathname}`}>
        {children}
      </div>
      <FloatingAIChat />
    </div>
  );
}
