'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import FloatingAIChat from '@/components/FloatingAIChat';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isSuperAdmin, isBranchAdmin, userBranchId, viewAs, loading, isAdmin, canSwitchBranch, switchView } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      const email = user?.email?.toLowerCase().trim();
      const isEdi = email === 'edi@temp.dlob.local';
      const isDualAdmin = isSuperAdmin || email === 'dlob.official.tng@gmail.com';
      const isAllowedPusatAdmin =
        isDualAdmin ||
        email === 'septianrifalda@gmail.com' ||
        email === 'danif@temp.dlob.local' ||
        (isAdmin && !isBranchAdmin);

      if (isEdi || (isBranchAdmin && !isDualAdmin)) {
        // Edi or DLBC-only admin gets redirected to DLBC admin
        router.replace('/cikupa/admin');
      } else if (!isAllowedPusatAdmin) {
        // Non-admin trying to access Pusat admin -> redirect to member dashboard
        router.replace('/dashboard');
      } else if (viewAs !== 'admin') {
        // Authorized admin on an admin route; sync view state
        switchView('admin');
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [user, isSuperAdmin, isBranchAdmin, userBranchId, viewAs, loading, router, pathname, isAdmin, canSwitchBranch, switchView]);

  // Always show content immediately for fast perceived performance
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#09090e] relative overflow-hidden">
      {/* Global Admin Aurora Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="aurora-a absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/8 dark:bg-emerald-500/6 blur-[100px]" />
        <div className="aurora-b absolute bottom-[-5%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-[#4382C8]/6 dark:bg-[#4382C8]/5 blur-[100px]" />
      </div>
      <DashboardSidebar isAdmin={true} />
      <div className="flex-1 min-w-0 relative z-10 pt-14 lg:pt-0" key={`admin-${pathname}`}>
        {children}
      </div>
      <FloatingAIChat />
    </div>
  );
}

