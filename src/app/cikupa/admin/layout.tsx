'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import FloatingAIChat from '@/components/FloatingAIChat';

// Explicit allowlist of DLBC branch admins by exact email
// Super admin (Ryan) is always allowed via isSuperAdmin — no need to list here.
const DLBC_ADMIN_EMAILS = [
  'edi@temp.dlob.local',
  'dlob.official.tng@gmail.com',
];

function isDlbcAdminUser(user: any): boolean {
  const email = (user?.email || '').toLowerCase().trim();
  return DLBC_ADMIN_EMAILS.includes(email);
}

export default function CikupaAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isSuperAdmin, isBranchAdmin, userBranchId, loading, canSwitchBranch } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading && !user) {
        router.replace('/login');
        return;
      }
      if (!loading && user) {
        const email = user?.email?.toLowerCase().trim();
        // Allowed: Adit (Super Admin), Wahyu (canSwitchBranch / DLBC admin), Edi (DLBC admin)
        const canAccess =
          isSuperAdmin ||
          canSwitchBranch ||
          email === 'dlob.official.tng@gmail.com' ||
          email === 'edi@temp.dlob.local' ||
          (isBranchAdmin && userBranchId === 'dlob-cikupa');

        if (!canAccess) {
          // If Pusat admin (Septian, Danif), redirect to /admin. Otherwise to member dashboard.
          if (email === 'septianrifalda@gmail.com' || email === 'danif@temp.dlob.local' || (isAdmin && !isBranchAdmin)) {
            router.replace('/admin');
          } else {
            router.replace(userBranchId === 'dlob-cikupa' ? '/cikupa/dashboard' : '/dashboard');
          }
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [user, isAdmin, isSuperAdmin, isBranchAdmin, userBranchId, loading, router, canSwitchBranch]);

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950">
      <DashboardSidebar isAdmin={true} branchSlug="cikupa" />
      <div className="flex-1 min-w-0 bg-white dark:bg-zinc-950 pt-14 lg:pt-0" key={`cikupa-admin-${pathname}`}>
        {children}
      </div>
      <FloatingAIChat />
    </div>
  );
}
