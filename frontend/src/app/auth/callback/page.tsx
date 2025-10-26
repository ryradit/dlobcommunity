'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/login?error=auth_callback_failed');
          return;
        }

        if (data.session?.user) {
          // Check if user has a member profile
          const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select('id, email, name, role, membership_type, is_active')
            .eq('id', data.session.user.id)
            .single();

          if (memberError || !memberData) {
            // Create member profile for new Google user
            const displayName = data.session.user.user_metadata?.full_name || 
                              data.session.user.user_metadata?.name || 
                              data.session.user.email?.split('@')[0] || 
                              'New Member';

            const { data: newMember, error: createError } = await supabase
              .from('members')
              .insert({
                id: data.session.user.id,
                email: data.session.user.email,
                name: displayName,
                role: 'member',
                membership_type: 'regular',
                join_date: new Date().toISOString().split('T')[0],
                is_active: true
              })
              .select()
              .single();

            if (createError) {
              console.error('Failed to create member profile:', createError);
              router.push('/login?error=profile_creation_failed');
              return;
            }
            
            // Redirect to member dashboard
            router.push('/dashboard');
          } else if (!memberData.is_active) {
            // Account exists but is inactive
            router.push('/login?error=account_inactive');
            return;
          } else {
            // Redirect based on role
            if (memberData.role === 'admin') {
              router.push('/admin');
            } else {
              router.push('/dashboard');
            }
          }
        } else {
          // No session, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=callback_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign-in...</p>
      </div>
    </div>
  );
}