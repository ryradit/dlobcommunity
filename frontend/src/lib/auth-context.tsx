'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isDemoMode } from '@/lib/supabase';
import { AuthUser, AuthService } from '@/lib/auth';
import { sessionSync } from '@/lib/session-sync';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  register: (userData: { email: string; password: string; name: string; phone?: string }) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Start session sync manager for cross-tab synchronization
    sessionSync.startPeriodicSync((syncedUser) => {
      if (JSON.stringify(user) !== JSON.stringify(syncedUser)) {
        console.log('🔄 Session synced from manager:', syncedUser?.email || 'signed out');
        setUser(syncedUser);
      }
    });

    // Cross-tab authentication synchronization
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'supabase.auth.token' || event.key?.includes('sb-')) {
        console.log('🔄 Auth token changed in another tab, syncing...');
        // Delay to ensure token is fully written
        setTimeout(async () => {
          try {
            const currentUser = await AuthService.getCurrentUser();
            setUser(currentUser);
            console.log('✅ Auth state synced across tabs');
          } catch (error) {
            console.error('❌ Error syncing auth across tabs:', error);
            setUser(null);
          }
        }, 100);
      }
    };

    // Listen for auth changes in other tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }

    // Listen for focus events to check auth state when user returns to tab
    const handleFocus = async () => {
      if (sessionChecked) {
        console.log('🎯 Tab focused, checking auth state...');
        try {
          const currentUser = await AuthService.getCurrentUser();
          if ((user === null) !== (currentUser === null)) {
            console.log('🔄 Auth state changed while away, updating...');
            setUser(currentUser);
          }
        } catch (error) {
          console.error('Error checking auth on focus:', error);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }

    // Only listen for auth changes if not in demo mode
    if (!isDemoMode) {
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔐 Auth state changed:', event);
          setSessionChecked(true);
          
          if (session?.user) {
            try {
              const currentUser = await AuthService.getCurrentUser();
              setUser(currentUser);
              console.log('✅ User authenticated:', currentUser?.email);
            } catch (error) {
              console.error('❌ Error getting user after auth change:', error);
              setUser(null);
            }
          } else {
            setUser(null);
            console.log('🚪 User signed out');
          }
          
          setLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
        if (typeof window !== 'undefined') {
          window.removeEventListener('storage', handleStorageChange);
          window.removeEventListener('focus', handleFocus);
        }
      };
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await AuthService.login({ email, password });
      
      // In demo mode, manually set the user state and store in localStorage
      if (isDemoMode) {
        const authUser: AuthUser = {
          id: result.profile.id,
          email: result.profile.email,
          name: result.profile.name,
          role: result.profile.role,
          membership_type: result.profile.membership_type
        };
        localStorage.setItem('demo-user', JSON.stringify(authUser));
        setUser(authUser);
      }
      
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await AuthService.loginWithGoogle();
      
      // In demo mode, handle Google login simulation
      if (isDemoMode) {
        throw new Error('Google Sign-In not available in demo mode. Please use regular login.');
      }
      
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (userData: { email: string; password: string; name: string; phone?: string }) => {
    try {
      setLoading(true);
      const result = await AuthService.register(userData);
      // User state will be updated by the auth state change listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // In demo mode, clear localStorage and set user to null
      if (isDemoMode) {
        localStorage.removeItem('demo-user');
        setUser(null);
        setLoading(false);
        return;
      }
      
      await AuthService.logout();
      // User state will be updated by the auth state change listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    await AuthService.resetPassword(email);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      loginWithGoogle,
      register,
      logout,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}