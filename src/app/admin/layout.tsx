'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import FloatingAIChat from '@/components/FloatingAIChat';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isSuperAdmin, isBranchAdmin, userBranchId, viewAs, loading, isAdmin, canSwitchBranch } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading && !user) {
        router.replace('/login');
      } else if (!loading) {
        const email = user?.email?.toLowerCase().trim();
        const isEdi = email === 'edi@temp.dlob.local';
        const isDualAdmin = isSuperAdmin || email === 'dlob.official.tng@gmail.com';
        const isAllowedPusatAdmin =
          isDualAdmin ||
          email === 'septianrifalda@gmail.com' ||
          email === 'danif@temp.dlob.local' ||
          (isAdmin && !isBranchAdmin);

        if (viewAs === 'member') {
          router.replace('/dashboard');
        } else if (isEdi || (isBranchAdmin && !isDualAdmin)) {
          // Edi or DLBC-only admin gets redirected to DLBC admin
          router.replace('/cikupa/admin');
        } else if (!isAllowedPusatAdmin) {
          router.replace('/dashboard');
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [user, isSuperAdmin, isBranchAdmin, userBranchId, viewAs, loading, router, isAdmin, canSwitchBranch]);

  // Always show content immediately for fast perceived performance
  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950">
      <DashboardSidebar isAdmin={true} />
      <div className="flex-1 min-w-0 bg-white dark:bg-zinc-950 pt-14 lg:pt-0" key={`admin-${pathname}`}>
        {children}
      </div>
      <FloatingAIChat />
    </div>
  );
}
