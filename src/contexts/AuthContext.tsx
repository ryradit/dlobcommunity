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
  updatePassword: (newPassword: string) => Promise<void>;
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

  // Sync avatar from profiles table to user metadata
  const syncAvatarFromProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (profile?.avatar_url) {
        // Get fresh user data
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // If avatar in profile differs from user metadata, sync it
        if (currentUser && currentUser.user_metadata?.avatar_url !== profile.avatar_url) {
          const { data: { user: updatedUser }, error } = await supabase.auth.updateUser({
            data: { avatar_url: profile.avatar_url }
          });
          
          if (!error && updatedUser) {
            setUser(updatedUser);
          }
        } else if (currentUser) {
          // Even if same, ensure user state is updated
          setUser(currentUser);
        }
      } else {
        // No avatar in profile, but still update user to ensure state is fresh
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setUser(currentUser);
        }
      }
    } catch (error) {
      console.error('Error syncing avatar:', error);
    }
  };

  // Fetch user profile and role (non-blocking)
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
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          // Fetch role and sync avatar in background (non-blocking)
          if (currentSession?.user) {
            // Sync avatar first (await to ensure it completes)
            await syncAvatarFromProfile(currentSession.user.id);
            
            // Set loading to false after avatar sync
            setLoading(false);
            
            // Then fetch role
            fetchUserRole(currentSession.user.id).then((userRole) => {
              if (mounted) {
                setRole(userRole);
                
                // Restore view preference
                if (userRole === 'admin') {
                  const savedView = localStorage.getItem('viewAs') as 'admin' | 'member' | null;
                  setViewAs(savedView || 'admin');
                } else {
                  setViewAs('member');
                }
              }
            });
          } else {
            // Set loading to false if no user
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
        if (mounted) {
          setLoading(false);
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
            // Sync avatar first (await to ensure completion)
            await syncAvatarFromProfile(currentSession.user.id);
            
            // Fetch role in background (non-blocking)
            fetchUserRole(currentSession.user.id).then((userRole) => {
              if (mounted) {
                setRole(userRole);
                
                if (userRole === 'admin') {
                  const savedView = localStorage.getItem('viewAs') as 'admin' | 'member' | null;
                  setViewAs(savedView || 'admin');
                } else {
                  setViewAs('member');
                }
              }
            });
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
    setIsAdmin(false);
    setIsMember(true);
    setViewAs('member');
    localStorage.removeItem('viewAs');
    router.push('/login');
    window.location.href = '/login';
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
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName; // Just the filename, bucket name is already 'profiles'

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        
        // Provide helpful error messages
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Storage bucket belum disetup. Silakan hubungi administrator untuk menjalankan supabase-storage-setup.sql');
        }
        
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('profiles')
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

      // Refresh user to get updated metadata
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        setUser(updatedUser);
      }

      return { avatarUrl };
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      throw error;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      if (refreshedUser) {
        // Also sync avatar from profile
        await syncAvatarFromProfile(refreshedUser.id);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  // Update password
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, role, isAdmin, isMember, viewAs, loading, switchView, signUp, signIn, signInWithGoogle, signOut, updateProfile, uploadAvatar, refreshUser, updatePassword }}>
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

