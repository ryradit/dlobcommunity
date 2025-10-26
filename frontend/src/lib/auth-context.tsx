'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isDemoMode } from '@/lib/supabase';
import { AuthUser, AuthService } from '@/lib/auth';

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

  useEffect(() => {
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

    // Only listen for auth changes if not in demo mode
    if (!isDemoMode) {
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event);
          
          if (session?.user) {
            try {
              const currentUser = await AuthService.getCurrentUser();
              setUser(currentUser);
            } catch (error) {
              console.error('Error getting user after auth change:', error);
              setUser(null);
            }
          } else {
            setUser(null);
          }
          
          setLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
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