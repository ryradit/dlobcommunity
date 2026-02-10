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
    // Non-blocking redirect - only after 500ms to avoid flash
    const timer = setTimeout(() => {
      if (!loading && !user) {
        router.replace('/login');
      } else if (!loading && (!isAdmin || viewAs === 'member')) {
        router.replace('/dashboard');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [user, isAdmin, viewAs, loading, router]);

  // Always show content immediately for fast perceived performance
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <DashboardSidebar isAdmin={true} />
      <div className="flex-1 bg-zinc-950" key={`admin-${pathname}`}>
        {children}
      </div>
    </div>
  );
}
