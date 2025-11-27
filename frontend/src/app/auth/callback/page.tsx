'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { trackCallbackStart, trackCallbackComplete } from '@/lib/auth-performance';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        trackCallbackStart();
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
        // Use upsert to handle both existing and new users efficiently
        const displayName = sessionData.session.user.user_metadata?.full_name || 
                          sessionData.session.user.user_metadata?.name || 
                          sessionData.session.user.email?.split('@')[0] || 
                          'New Member';

        console.log('Upserting member profile for faster processing...');
        
        // Single database call using upsert - creates if not exists, updates if exists
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .upsert({
            id: sessionData.session.user.id,
            email: sessionData.session.user.email,
            name: displayName,
            role: 'member', // Default role for new users
            membership_type: 'regular',
            join_date: new Date().toISOString().split('T')[0],
            is_active: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select('id, email, name, role, membership_type, is_active')
          .single();

        if (memberError) {
          console.error('Failed to upsert member profile:', memberError);
          router.push('/login?error=profile_upsert_failed');
          return;
        }

        if (!memberData.is_active) {
          console.log('Account inactive');
          router.push('/login?error=account_inactive');
          return;
        }

        // Fast redirect based on role
        console.log(`Member processed (${memberData.role}), redirecting...`);
        const redirectPath = memberData.role === 'admin' ? '/admin' : '/dashboard';
        
        // Wait a moment for auth state to propagate across tabs
        await new Promise(resolve => setTimeout(resolve, 500));
        
        trackCallbackComplete();
        // Use router.push for proper Next.js navigation and state management
        router.push(redirectPath);
      } catch (error) {
        console.error('Auth callback error:', error);
        trackCallbackComplete(); // Track even on error for debugging
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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}