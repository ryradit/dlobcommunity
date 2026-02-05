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
    async function checkRole() {
      // Wait for loading to complete
      if (loading) return;
      
      // Only redirect to login if we're sure there's no session
      if (!session || !user) {
        // Double-check session before redirecting
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          router.push('/login');
        }
        return;
      }

      if (user) {
        // Check user role from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'admin') {
          // Redirect admin users to admin dashboard
          router.push('/admin');
        }
      }
    }

    checkRole();
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
