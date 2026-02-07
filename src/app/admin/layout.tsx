'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, viewAs, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if loading is complete and user is definitely not authorized
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!isAdmin) {
        router.replace('/dashboard');
      } else if (viewAs === 'member') {
        router.replace('/dashboard');
      }
    }
  }, [user, isAdmin, viewAs, loading, router]);

  // Show content immediately if user exists, only block if no user and loading complete
  if (!loading && !user) {
    return null;
  }

  if (!loading && (!isAdmin || viewAs === 'member')) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <DashboardSidebar isAdmin={true} />
      <div className="flex-1 bg-zinc-950" key={`admin-${pathname}`}>
        {children}
      </div>
    </div>
  );
}
