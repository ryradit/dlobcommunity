'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type UserRole = 'admin' | 'member';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  isAdmin: boolean;
  isMember: boolean;
  viewAs: 'admin' | 'member';
  loading: boolean;
  switchView: (view: 'admin' | 'member') => void;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>('member');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(true);
  const [viewAs, setViewAs] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch user profile and role
  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      const userRole = profile?.role === 'admin' ? 'admin' : 'member';
      
      // Set flags for dual role support
      if (userRole === 'admin') {
        setIsAdmin(true);
        setIsMember(true); // Admins can access both
      } else {
        setIsAdmin(false);
        setIsMember(true);
      }
      
      return userRole;
    } catch (error) {
      setIsAdmin(false);
      setIsMember(true);
      return 'member';
    }
  };

  // Switch view for dual-role users
  const switchView = (view: 'admin' | 'member') => {
    setViewAs(view);
    localStorage.setItem('viewAs', view);
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    // Force loading to false after 5 seconds max
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout - forcing complete');
        setLoading(false);
      }
    }, 5000);

    const initAuth = async () => {
      try {
        console.log('🔐 Starting auth initialization...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Auth session error:', error);
          throw error;
        }
        
        console.log('📝 Session:', currentSession ? 'Found' : 'None');
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            console.log('👤 Fetching role for:', currentSession.user.email);
            const userRole = await fetchUserRole(currentSession.user.id);
            console.log('✅ Role:', userRole, 'isAdmin:', isAdmin, 'isMember:', isMember);
            setRole(userRole);
            
            // Restore saved view preference for dual-role users
            if (userRole === 'admin') {
              const savedView = localStorage.getItem('viewAs') as 'admin' | 'member' | null;
              setViewAs(savedView || 'admin');
            } else {
              setViewAs('member');
            }
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        if (mounted) {
          clearTimeout(loadingTimeout);
          console.log('✅ Auth initialization complete');
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (mounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          const userRole = await fetchUserRole(currentSession.user.id);
          setRole(userRole);
          
          // Restore saved view
          if (userRole === 'admin') {
            const savedView = localStorage.getItem('viewAs') as 'admin' | 'member' | null;
            setViewAs(savedView || 'admin');
          } else {
            setViewAs('member');
          }
        } else {
          setRole('member');
          setIsAdmin(false);
          setIsMember(true);
          setViewAs('member');
        }
        
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign up with email and password
  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    // Create profile
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        email: email,
        role: 'member',
      });
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const userRole = await fetchUserRole(data.user.id);
      setRole(userRole);
      
      // Redirect based on role
      if (userRole === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole('member');
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, session, role, isAdmin, isMember, viewAs, loading, switchView, signUp, signIn, signInWithGoogle, signOut }}>
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

