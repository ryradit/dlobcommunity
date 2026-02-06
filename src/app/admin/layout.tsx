'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, viewAs, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  console.log('🔒 [Admin Layout] State:', { loading, hasUser: !!user, isAdmin, viewAs });

  useEffect(() => {
    console.log('🔒 [Admin Layout] Effect triggered:', { loading, hasUser: !!user, isAdmin, viewAs });
    if (!loading) {
      if (!user) {
        console.log('❌ No user, redirecting to login');
        router.replace('/login');
      } else if (!isAdmin) {
        console.log('❌ Not admin, redirecting to dashboard');
        router.replace('/dashboard');
      } else if (viewAs === 'member') {
        console.log('🔄 Admin viewing as member, redirecting to dashboard');
        router.replace('/dashboard');
      } else {
        console.log('✅ Admin access granted');
      }
    }
  }, [user, isAdmin, viewAs, loading, router]);

  console.log('🔒 [Admin Layout] Rendering check - user:', !!user, 'isAdmin:', isAdmin, 'viewAs:', viewAs);

  // Only show null briefly during initial load with no user - avoid showing loading screen on refresh
  if (!loading && (!user || !isAdmin || viewAs === 'member')) {
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
