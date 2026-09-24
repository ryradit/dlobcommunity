'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import FloatingAIChat from '@/components/FloatingAIChat';
import ProfileCompletionWarning from '@/components/ProfileCompletionWarning';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isBranchAdmin, userBranchId, viewAs, loading, canSwitchBranch, isSuperAdmin, isNeutral, switchView } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (!user) {
        // Not logged in → go to login with redirect param
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (isNeutral && pathname !== '/dashboard/choose-branch') {
        // Neutral user (no branch assigned yet) → must choose branch first
        router.replace('/dashboard/choose-branch');
      } else if (!isAdmin && userBranchId === 'dlob-cikupa' && !canSwitchBranch && !isSuperAdmin) {
        // Dedicated DLBC member → redirect to DLBC dashboard
        router.replace('/cikupa/dashboard');
      } else if (isAdmin && viewAs === 'admin') {
        // Admin visiting member dashboard; sync view state without redirecting away
        switchView('member');
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [user, isAdmin, isBranchAdmin, userBranchId, viewAs, loading, router, pathname, canSwitchBranch, isSuperAdmin, isNeutral, switchView]);

  // Always show content immediately for fast perceived performance
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#09090e] relative overflow-hidden">
      {/* Global Dashboard Aurora Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="aurora-a absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/8 dark:bg-emerald-500/6 blur-[100px]" />
        <div className="aurora-b absolute bottom-[-5%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-[#4382C8]/6 dark:bg-[#4382C8]/5 blur-[100px]" />
      </div>
      <DashboardSidebar isAdmin={false} />
      <div className="flex-1 min-w-0 relative z-10 pt-14 lg:pt-0" key={`member-${pathname}`}>
        {children}
      </div>
      <FloatingAIChat />
    </div>
  );
}

