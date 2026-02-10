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
    // Non-blocking redirect - only after 500ms to avoid flash
    const timer = setTimeout(() => {
      if (!loading && !user) {
        router.replace('/login');
      } else if (!loading && isAdmin && viewAs === 'admin') {
        router.replace('/admin');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [user, isAdmin, viewAs, loading, router]);

  // Always show content immediately for fast perceived performance
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <DashboardSidebar isAdmin={false} />
      <div className="flex-1 bg-zinc-950" key={`member-${pathname}`}>
        {children}
      </div>
    </div>
  );
}
