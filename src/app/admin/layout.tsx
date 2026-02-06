'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import DashboardSidebar from '@/components/DashboardSidebar';

function AdminContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, session, logout, isAdmin, viewAs } = useAuth();
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Check if user has admin access and is viewing as admin
  useEffect(() => {
    let isMounted = true;
    
    async function checkAccess() {
      console.log('🔒 [Admin Layout] Checking access - loading:', loading, 'session:', !!session, 'user:', !!user, 'isAdmin:', isAdmin, 'viewAs:', viewAs);
      
      // Wait for auth to finish loading
      if (loading) {
        console.log('⏳ [Admin Layout] Auth still loading...');
        return;
      }

      // Redirect to login if no session
      if (!session || !user) {
        console.log('❌ [Admin Layout] No session/user - redirecting to /login');
        if (isMounted) {
          router.push('/login');
        }
        return;
      }

      // If not admin or viewing as member, redirect to member dashboard
      if (!isAdmin) {
        console.log('🚫 [Admin Layout] User is NOT admin - redirecting to /dashboard');
        if (isMounted) {
          router.push('/dashboard');
        }
        return;
      }
      
      if (viewAs === 'member') {
        console.log('👤 [Admin Layout] Admin viewing as member - redirecting to /dashboard');
        if (isMounted) {
          router.push('/dashboard');
        }
        return;
      }

      console.log('✅ [Admin Layout] Access granted - isAdmin:', isAdmin, 'viewAs:', viewAs);
      if (isMounted) {
        setCheckingAccess(false);
      }
    }

    checkAccess();
    
    return () => {
      isMounted = false;
    };
  }, [user, session, loading, isAdmin, viewAs, router]);

  // Handle inactivity timeout
  useEffect(() => {
    if (!session) return;

    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        logout();
        router.push('/login?error=session_timeout');
      }, 60 * 60 * 1000); // 1 hour
    };

    const handleActivity = () => resetTimer();

    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('scroll', handleActivity);

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [session, logout, router]);

  // Show loading while checking access
  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Memverifikasi akses admin...</p>
        </div>
      </div>
    );
  }

  // Don't render admin panel if not admin or viewing as member
  if (!isAdmin || viewAs === 'member') {
    return null;
  }

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <DashboardSidebar isAdmin={true} />
      <main className="flex-1 overflow-y-auto w-full">
        <div className="lg:hidden h-16"></div>
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminContent>{children}</AdminContent>
    </AuthProvider>
  );
}
