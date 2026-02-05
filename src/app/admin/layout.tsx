'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import DashboardSidebar from '@/components/DashboardSidebar';

function AdminContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, session, logout } = useAuth();

  // Check if user is admin
  useEffect(() => {
    async function checkAdminRole() {
      if (!loading && (!session || !user)) {
        router.push('/login');
        return;
      }

      if (user) {
        // Check user role from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'admin') {
          // Redirect non-admin users to member dashboard
          router.push('/dashboard');
        }
      }
    }

    checkAdminRole();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!session || !user) {
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
