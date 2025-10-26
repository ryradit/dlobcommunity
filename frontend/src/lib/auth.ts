import { NextRequest } from 'next/server';
import { supabase, isDemoMode } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  membership_type?: 'regular' | 'premium';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  membership_type?: 'regular' | 'premium';
}

// Client-side authentication functions
export class AuthService {
  static async login(credentials: LoginCredentials) {
    try {
      // Check if we're in demo mode
      if (isDemoMode) {
        return this.handleDemoLogin(credentials);
      }

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Authentication failed');
      }

      // Get user profile from members table
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, email, name, role, membership_type, is_active')
        .eq('email', credentials.email)
        .single();

      if (memberError || !memberData || !memberData.is_active) {
        // Sign out if profile doesn't exist or is inactive
        await supabase.auth.signOut();
        throw new Error('Account not found or inactive. Please contact admin.');
      }

      return {
        user: authData.user,
        profile: memberData,
        session: authData.session
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Demo mode login for development/testing
  static async handleDemoLogin(credentials: LoginCredentials) {
    console.log('🎭 Demo mode login attempt:', credentials.email);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Demo credentials
    const demoAccounts = {
      'admin@dlob.com': {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@dlob.com',
        name: 'Admin User',
        role: 'admin' as const,
        membership_type: 'premium' as const,
        password: 'password123'
      },
      'member@dlob.com': {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'member@dlob.com',
        name: 'Member User',
        role: 'member' as const,
        membership_type: 'regular' as const,
        password: 'password123'
      }
    };

    const account = demoAccounts[credentials.email as keyof typeof demoAccounts];
    
    if (!account || account.password !== credentials.password) {
      throw new Error('Invalid demo credentials. Try: admin@dlob.com/password123 or member@dlob.com/password123');
    }

    // Return mock auth data
    return {
      user: {
        id: account.id,
        email: account.email,
        created_at: new Date().toISOString()
      },
      profile: {
        id: account.id,
        email: account.email,
        name: account.name,
        role: account.role,
        membership_type: account.membership_type,
        is_active: true
      },
      session: {
        access_token: 'demo-token',
        refresh_token: 'demo-refresh-token',
        expires_in: 3600,
        user: {
          id: account.id,
          email: account.email
        }
      }
    };
  }

  static async register(userData: RegisterData) {
    try {
      // Check if we're in demo mode
      if (isDemoMode) {
        return this.handleDemoRegister(userData);
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone
          }
        }
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        if (authError.message.includes('Email already registered')) {
          throw new Error('Email already registered. Please use a different email or try logging in.');
        }
        throw new Error(`Registration failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Registration failed - no user created');
      }

      // Wait a moment for database trigger to create profile (if trigger is set up)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if profile was created by trigger, if not create manually
      let { data: memberData, error: memberSelectError } = await supabase
        .from('members')
        .select('id, email, name, role, membership_type, is_active')
        .eq('id', authData.user.id)
        .single();

      // If profile doesn't exist, create it manually
      if (memberSelectError || !memberData) {
        console.log('Profile not found, creating manually...');
        
        const { data: insertedMember, error: memberError } = await supabase
          .from('members')
          .insert({
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            phone: userData.phone,
            role: 'member',
            membership_type: userData.membership_type || 'regular',
            join_date: new Date().toISOString().split('T')[0],
            is_active: true
          })
          .select()
          .single();

        if (memberError) {
          // If profile creation fails, clean up auth user
          console.error('Database error creating member profile:', memberError);
          
          // Don't delete auth user if it's just a duplicate error (trigger might have created it)
          if (memberError.code !== '23505') {
            await supabase.auth.admin.deleteUser(authData.user.id);
          }
          
          // Provide more specific error messages
          if (memberError.code === '23505') {
            // Profile already exists (probably created by trigger), that's okay
            console.log('Profile already exists, continuing...');
            // Try to get the existing profile
            const { data: existingMember } = await supabase
              .from('members')
              .select('id, email, name, role, membership_type, is_active')
              .eq('id', authData.user.id)
              .single();
            memberData = existingMember;
          } else if (memberError.code === '42P01') {
            throw new Error('Database tables not found. Please run the database schema first.');
          } else if (memberError.code === '42501') {
            throw new Error('Database permission denied. Please check RLS policies.');
          } else {
            throw new Error(`Failed to create user profile: ${memberError.message}`);
          }
        } else {
          memberData = insertedMember;
        }
      }

      if (!memberData) {
        throw new Error('Failed to create or retrieve user profile');
      }

      return {
        user: authData.user,
        profile: memberData,
        session: authData.session
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Demo mode registration
  static async handleDemoRegister(userData: RegisterData) {
    console.log('🎭 Demo mode registration:', userData.email);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if email already exists in demo accounts
    const existingEmails = ['admin@dlob.com', 'member@dlob.com'];
    if (existingEmails.includes(userData.email)) {
      throw new Error('Email already exists in demo mode');
    }

    // Generate demo user data
    const userId = `demo-${Date.now()}`;
    
    return {
      user: {
        id: userId,
        email: userData.email,
        created_at: new Date().toISOString()
      },
      profile: {
        id: userId,
        email: userData.email,
        name: userData.name,
        role: 'member' as const,
        membership_type: userData.membership_type || 'regular' as const,
        is_active: true
      },
      session: {
        access_token: 'demo-token',
        refresh_token: 'demo-refresh-token',
        expires_in: 3600,
        user: {
          id: userId,
          email: userData.email
        }
      }
    };
  }

  static async logout() {
    try {
      // In demo mode, just clear localStorage
      if (isDemoMode) {
        localStorage.removeItem('demo-user');
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // In demo mode, check localStorage for demo session
      if (isDemoMode) {
        const demoUser = localStorage.getItem('demo-user');
        if (demoUser) {
          return JSON.parse(demoUser);
        }
        return null;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return null;
      }

      // Get user profile
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, email, name, role, membership_type, is_active')
        .eq('id', session.user.id)
        .single();

      if (memberError || !memberData || !memberData.is_active) {
        return null;
      }

      return {
        id: memberData.id,
        email: memberData.email,
        name: memberData.name,
        role: memberData.role,
        membership_type: memberData.membership_type
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  static async loginWithGoogle() {
    try {
      // Check if we're in demo mode
      if (isDemoMode) {
        throw new Error('Google Sign-In not available in demo mode. Please use regular email/password login.');
      }

      // Sign in with Google
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        // Handle specific Google provider not enabled error
        if (error.message.includes('provider is not enabled') || error.message.includes('Unsupported provider')) {
          throw new Error('Google Sign-In is not yet configured. Please use email/password login or contact admin to enable Google authentication.');
        }
        throw new Error(error.message);
      }

      // The actual user data will be available after redirect
      return data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }
}

// Server-side authentication for API routes
export async function authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    // For API routes, we'll use the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the session token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Get user profile from members table
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('id, email, name, role, membership_type, is_active')
      .eq('id', user.id)
      .single();

    if (memberError || !memberData || !memberData.is_active) {
      return null;
    }

    return {
      id: memberData.id,
      email: memberData.email,
      name: memberData.name,
      role: memberData.role,
      membership_type: memberData.membership_type
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function createErrorResponse(message: string, status: number = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createSuccessResponse(data: any, message?: string) {
  return new Response(JSON.stringify({ 
    success: true, 
    data, 
    ...(message && { message }) 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}