'use client';

import { useEffect, useState } from 'react';
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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  // Check if user is admin
  useEffect(() => {
    async function checkAdminRole() {
      // Wait for auth to finish loading
      if (loading) {
        return;
      }

      // Redirect to login if no session
      if (!session || !user) {
        router.push('/login');
        return;
      }

      try {
        // Check user role from profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          // If profile doesn't exist, user is not admin
          setIsAdmin(false);
          router.push('/dashboard');
          return;
        }

        if (profile?.role === 'admin') {
          setIsAdmin(true);
        } else {
          // Redirect non-admin users to member dashboard
          setIsAdmin(false);
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
        router.push('/dashboard');
      } finally {
        setCheckingRole(false);
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

  // Show loading spinner while checking auth or role
  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Memverifikasi akses admin...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated or not admin
  if (!session || !user || !isAdmin) {
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
