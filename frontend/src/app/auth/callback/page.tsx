'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Processing auth callback...');
        
        // Check for error in URL params first
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error('OAuth error:', error, errorDescription);
          router.push(`/login?error=${error}`);
          return;
        }

        // Get current session (Supabase should have processed URL hash already)
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          router.push('/login?error=session_error');
          return;
        }

        if (!sessionData.session?.user) {
          console.error('No session found after callback');
          router.push('/login?error=no_session');
          return;
        }

        console.log('User authenticated:', sessionData.session.user.email);
        // Check if user has a member profile
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id, email, name, role, membership_type, is_active')
          .eq('id', sessionData.session.user.id)
          .single();

        if (memberError || !memberData) {
          console.log('Creating new member profile...');
          // Create member profile for new Google user
          const displayName = sessionData.session.user.user_metadata?.full_name || 
                            sessionData.session.user.user_metadata?.name || 
                            sessionData.session.user.email?.split('@')[0] || 
                            'New Member';

          const { data: newMember, error: createError } = await supabase
            .from('members')
            .insert({
              id: sessionData.session.user.id,
              email: sessionData.session.user.email,
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
          
          console.log('New member created, redirecting to dashboard...');
          router.replace('/dashboard');
        } else if (!memberData.is_active) {
          console.log('Account inactive');
          router.push('/login?error=account_inactive');
          return;
        } else {
          console.log(`Existing member found (${memberData.role}), redirecting...`);
          // Redirect based on role
          if (memberData.role === 'admin') {
            router.replace('/admin');
          } else {
            router.replace('/dashboard');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=callback_error');
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (!isProcessing) {
    return (
      <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-gray-600">Authentication processing failed. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign-in...</p>
        <p className="mt-2 text-sm text-gray-500">Processing authentication tokens...</p>
      </div>
    </div>
  );
}