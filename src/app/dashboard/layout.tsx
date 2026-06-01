'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import FloatingAIChat from '@/components/FloatingAIChat';
import ProfileCompletionWarning from '@/components/ProfileCompletionWarning';

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

  // Always show sidebar immediately, but only render children once auth loading finishes
  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950">
      <DashboardSidebar isAdmin={false} />
      <div className="flex-1 min-w-0 bg-white dark:bg-zinc-950 pt-14 lg:pt-0" key={`member-${pathname}`}>
        {loading ? (
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          children
        )}
      </div>
      <FloatingAIChat />
    </div>
  );
}
