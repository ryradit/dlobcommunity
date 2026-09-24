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
  const { user, isAdmin, isSuperAdmin, isBranchAdmin, userBranchId, loading, canSwitchBranch, viewAs, switchView } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      if (user) {
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
        } else if (viewAs !== 'admin') {
          switchView('admin');
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [user, isAdmin, isSuperAdmin, isBranchAdmin, userBranchId, loading, router, pathname, canSwitchBranch, viewAs, switchView]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#09090e] relative overflow-hidden">
      {/* Global Cikupa Admin Aurora Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="aurora-a absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/8 dark:bg-emerald-500/6 blur-[100px]" />
        <div className="aurora-b absolute bottom-[-5%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-[#4382C8]/6 dark:bg-[#4382C8]/5 blur-[100px]" />
      </div>
      <DashboardSidebar isAdmin={true} branchSlug="cikupa" />
      <div className="flex-1 min-w-0 relative z-10 pt-14 lg:pt-0" key={`cikupa-admin-${pathname}`}>
        {children}
      </div>
      <FloatingAIChat />
    </div>
  );
}
