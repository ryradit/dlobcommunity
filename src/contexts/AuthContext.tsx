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
  updateProfile: (data: Record<string, any>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<{ avatarUrl: string }>;
  refreshUser: () => Promise<void>;
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
  const [initialLoad, setInitialLoad] = useState(true);
  const router = useRouter();

  // Fetch user profile and role
  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    try {
      // Add timeout for role fetch to prevent hanging
      const rolePromise = supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Role fetch timeout')), 8000)
      );

      const { data: profile } = await Promise.race([rolePromise, timeoutPromise]) as any;
      
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
      console.error('Error fetching user role:', error);
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

  // Initialize auth state - ONLY run once on mount
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (mounted && currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Fetch role quickly
          const userRole = await fetchUserRole(currentSession.user.id);
          setRole(userRole);
          
          // Restore view preference
          if (userRole === 'admin') {
            const savedView = localStorage.getItem('viewAs') as 'admin' | 'member' | null;
            setViewAs(savedView || 'admin');
          } else {
            setViewAs('member');
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialLoad(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes (login/logout only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      // Only handle sign in and sign out events
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            const userRole = await fetchUserRole(currentSession.user.id);
            setRole(userRole);
            
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
        }
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

  // Update user profile
  const updateProfile = async (data: Record<string, any>) => {
    if (!user) throw new Error('No user logged in');
    
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);
      
    if (error) throw error;
    
    // Refresh user metadata
    await refreshUser();
  };

  // Upload avatar
  const uploadAvatar = async (file: File): Promise<{ avatarUrl: string }> => {
    if (!user) throw new Error('No user logged in');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = data.publicUrl;

    // Update profile with new avatar URL
    await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id);

    // Update auth metadata
    await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl }
    });

    await refreshUser();

    return { avatarUrl };
  };

  // Refresh user data
  const refreshUser = async () => {
    const { data: { user: refreshedUser } } = await supabase.auth.getUser();
    if (refreshedUser) {
      setUser(refreshedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, role, isAdmin, isMember, viewAs, loading, switchView, signUp, signIn, signInWithGoogle, signOut, updateProfile, uploadAvatar, refreshUser }}>
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

