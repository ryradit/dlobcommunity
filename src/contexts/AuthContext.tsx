'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import Cookie from 'js-cookie';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  avatarUpdateTrigger: number;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: { 
    full_name?: string; 
    phone?: string; 
    avatar_url?: string;
    playing_level?: string;
    dominant_hand?: string;
    years_playing?: string;
    achievements?: string;
    partner_preferences?: string;
    instagram_url?: string;
  }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUpdateTrigger, setAvatarUpdateTrigger] = useState(0);
  let timeoutId: NodeJS.Timeout | null = null;

  // Set session timeout
  const setSessionTimeout = () => {
    if (timeoutId) clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      logout();
    }, SESSION_TIMEOUT);

    // Store timeout in cookie
    Cookie.set('session_timestamp', new Date().getTime().toString(), {
      expires: 1 / 24 // 1 hour
    });
  };

  // Check session on mount and listen for auth changes
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const initializeAuth = async () => {
      try {
        // Add a small delay to let Supabase client fully initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!isMounted) return;
        
        // Get current session with retry logic
        let retries = 3;
        let currentSession = null;
        
        while (retries > 0 && isMounted) {
          try {
            const { data: { session: sess }, error } = await supabase.auth.getSession();
            if (error && error.name === 'AbortError') {
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 200));
                continue;
              }
            }
            currentSession = sess;
            break;
          } catch (err: any) {
            if (err?.name === 'AbortError' && retries > 0) {
              retries--;
              await new Promise(resolve => setTimeout(resolve, 200));
            } else {
              throw err;
            }
          }
        }
        
        if (currentSession && isMounted) {
          setSession(currentSession);
          setUser(currentSession.user);
          setSessionTimeout();
          
          // Fetch profile data from profiles table and merge with user metadata (non-blocking)
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();
            
            // Merge profile data with user metadata
            if (profile && isMounted) {
              currentSession.user.user_metadata = {
                ...currentSession.user.user_metadata,
                ...profile
              };
              setUser({...currentSession.user});
            }
          } catch (profileError: any) {
            // Ignore abort errors
            if (profileError?.name !== 'AbortError' && !abortController.signal.aborted) {
              console.log('Profile not yet created, using auth data only');
            }
          }
        }
      } catch (error: any) {
        // Only log non-abort errors
        if (error?.name !== 'AbortError' && !abortController.signal.aborted) {
          console.error('Error initializing auth:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Subscribe to auth changes (handles implicit flow from hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        
        if (!isMounted) return;
        
        setSession(newSession);
        
        if (newSession) {
          setUser(newSession.user);
          setSessionTimeout();
          
          // Fetch profile data from profiles table and merge with user metadata (non-blocking)
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newSession.user.id)
              .single();
            
            // Merge profile data with user metadata
            if (profile && isMounted) {
              newSession.user.user_metadata = {
                ...newSession.user.user_metadata,
                ...profile
              };
              setUser({...newSession.user});
            }
          } catch (profileError: any) {
            // Ignore abort errors
            if (profileError?.name !== 'AbortError' && !abortController.signal.aborted) {
              console.log('Profile not yet created, using auth data only');
            }
          }
        } else {
          setUser(null);
          if (timeoutId) clearTimeout(timeoutId);
        }
        
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      abortController.abort();
      subscription?.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Reset timeout on user activity
  useEffect(() => {
    if (!session) return;

    const resetTimeout = () => {
      setSessionTimeout();
    };

    window.addEventListener('mousedown', resetTimeout);
    window.addEventListener('keydown', resetTimeout);

    return () => {
      window.removeEventListener('mousedown', resetTimeout);
      window.removeEventListener('keydown', resetTimeout);
    };
  }, [session]);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      Cookie.remove('session_timestamp');
      
      // Redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        // Fetch fresh profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        // Merge profile data with user metadata
        if (profile) {
          currentUser.user_metadata = {
            ...currentUser.user_metadata,
            ...profile
          };
        }
        
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const updateProfile = async (updates: { 
    full_name?: string; 
    phone?: string; 
    avatar_url?: string;
    playing_level?: string;
    dominant_hand?: string;
    years_playing?: string;
    achievements?: string;
    partner_preferences?: string;
    instagram_url?: string;
  }) => {
    try {
      if (!user) throw new Error('No user logged in');

      console.log('Updating profile with:', updates);

      // FIRST: Update profiles table (critical for persistence)
      const upsertData = { 
        id: user.id,
        email: user.email, // Required field
        ...updates
      };
      
      console.log('Attempting to upsert profile data:', JSON.stringify(upsertData, null, 2));
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert(upsertData, {
          onConflict: 'id'
        })
        .select();

      console.log('Profile upsert response:', { data: profileData, error: profileError });

      if (profileError) {
        console.error('Profile table update error:', profileError);
        throw profileError;
      }

      console.log('Profile table updated successfully');

      // THEN: Update auth user metadata (this triggers USER_UPDATED event)
      const { data: authData, error } = await supabase.auth.updateUser({
        data: updates,
      });

      console.log('Auth update response:', { data: authData, error });

      if (error) {
        console.error('Auth update error:', error);
        throw error;
      }

      console.log('Auth metadata updated successfully');

      if (profileError) {
        console.error('Profile table update error:', profileError);
        throw profileError;
      }

      console.log('Profile table updated successfully');

      // Refresh user data from both auth and profiles table
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        // Fetch updated profile data from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', updatedUser.id)
          .single();
        
        // Merge profile data with user metadata
        if (profile) {
          updatedUser.user_metadata = {
            ...updatedUser.user_metadata,
            ...profile
          };
        }
        
        setUser(updatedUser);
      }
      
      console.log('User data refreshed with profile data');
    } catch (error) {
      console.error('updateProfile error:', error);
      throw error;
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    try {
      console.log('📤 uploadAvatar: Starting upload for file:', file.name, file.type, file.size);
      
      if (!user) {
        console.error('❌ uploadAvatar: No user logged in');
        throw new Error('No user logged in');
      }

      // Use consistent file name - upsert will overwrite existing
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      console.log('📤 uploadAvatar: File path:', filePath);
      console.log('📤 uploadAvatar: Uploading to storage bucket "profiles"...');
      
      // Direct upload with upsert (skipping delete to avoid delays)
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Automatically overwrites existing file
        });

      console.log('📤 uploadAvatar: Upload response:', { data: uploadData, error: uploadError });

      if (uploadError) {
        console.error('❌ uploadAvatar: Upload failed:', uploadError);
        throw uploadError;
      }

      // Get public URL with timestamp to bust cache
      console.log('📤 uploadAvatar: Getting public URL...');
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      console.log('✅ uploadAvatar: Public URL generated:', publicUrl);
      
      // Trigger avatar update to force sidebar re-render
      setAvatarUpdateTrigger(prev => prev + 1);
      
      return publicUrl;
    } catch (error) {
      console.error('❌ uploadAvatar: Error caught:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, avatarUpdateTrigger, signUp, signIn, signInWithGoogle, logout, refreshUser, updateProfile, uploadAvatar }}>
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
