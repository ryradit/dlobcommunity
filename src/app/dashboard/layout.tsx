'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import DashboardSidebar from '@/components/DashboardSidebar';

function DashboardContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, session, logout } = useAuth();

  // Redirect to appropriate dashboard based on role
  useEffect(() => {
    let isMounted = true;
    
    async function checkRole() {
      // Wait for loading to complete
      if (loading) return;
      
      // Only redirect to login if we're sure there's no session
      if (!session || !user) {
        try {
          // Double-check session before redirecting
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (!isMounted) return;
          
          if (!currentSession) {
            router.push('/login');
          }
        } catch (error: any) {
          if (!isMounted) return;
          if (error?.name !== 'AbortError') {
            console.error('Error checking session:', error);
          }
        }
        return;
      }

      // No need to check admin role here - admins are redirected by callback
      // This avoids race conditions and glitching between dashboards
    }

    checkRole();
    
    return () => {
      isMounted = false;
    };
  }, [user, session, loading, router]);

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

  // Always render the dashboard UI, redirect happens in the background
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto w-full">
        <div className="lg:hidden h-16"></div>
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}
