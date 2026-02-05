'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import DashboardSidebar from '@/components/DashboardSidebar';

function DashboardContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, session, logout } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);

  // Check auth and redirect to login if not authenticated
  useEffect(() => {
    if (!loading) {
      if (!session || !user) {
        router.push('/login');
        return;
      }
      setIsAuthorized(true);

      // Check if session is about to expire (within 5 minutes)
      if (session.expires_at) {
        const expiresAt = session.expires_at * 1000;
        const timeLeft = expiresAt - Date.now();
        const fiveMinutesMs = 5 * 60 * 1000;

        if (timeLeft < fiveMinutesMs && timeLeft > 0) {
          setSessionWarning(true);
        }
      }
    }
  }, [user, session, loading, router]);

  // Handle inactivity and session expiration
  useEffect(() => {
    if (!session || !isAuthorized) return;

    let inactivityTimer: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      // 1 hour of inactivity
      inactivityTimer = setTimeout(() => {
        logout();
        router.push('/login?error=session_timeout');
      }, 60 * 60 * 1000);
    };

    // Activity listeners
    const handleActivity = () => resetInactivityTimer();

    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Initial timer
    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [session, isAuthorized, logout, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Always render the layout to avoid 404s
  // Auth redirect will happen in the useEffect
  return (
    <div className="flex h-screen bg-zinc-950">
      {isAuthorized && <DashboardSidebar />}
      <main className="flex-1 overflow-y-auto">
        {/* Session Warning Banner */}
        {sessionWarning && isAuthorized && (
          <div className="sticky top-0 z-40 w-full bg-yellow-500/10 border-b border-yellow-500/50 px-4 py-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <p className="text-sm text-yellow-400">
                ⚠️ Sesi Anda akan berakhir dalam 5 menit. Lakukan aktivitas untuk melanjutkan.
              </p>
              <button
                onClick={() => setSessionWarning(false)}
                className="text-yellow-400 hover:text-yellow-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}
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
