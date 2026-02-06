'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, viewAs, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    } else if (!loading && isAdmin && viewAs === 'admin') {
      // Redirect to admin if user is viewing as admin
      router.replace('/admin');
    }
  }, [user, isAdmin, viewAs, loading, router]);

  // Only show null briefly during initial load with no user - avoid showing loading screen on refresh
  if (!loading && (!user || (isAdmin && viewAs === 'admin'))) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <DashboardSidebar isAdmin={false} />
      <div className="flex-1 bg-zinc-950" key={`member-${pathname}`}>
        {children}
      </div>
    </div>
  );
}
