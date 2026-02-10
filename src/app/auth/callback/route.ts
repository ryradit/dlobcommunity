import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  // Handle OAuth error - be more specific about empty errors
  if (error !== null) {
    if (!error || error.trim() === '') {
      console.error('❌ [OAuth Callback] Empty error parameter detected');
      return NextResponse.redirect(new URL(`/login?error=unknown_oauth_error&error_description=${encodeURIComponent('OAuth returned an empty error. This may indicate a configuration issue with redirect URLs.')}`, request.url));
    }
    
    console.error('❌ [OAuth Callback] OAuth error:', { error, error_description });
    const description = error_description || 'OAuth authentication failed';
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(description)}`, request.url));
  }

  // Handle authorization code flow (PKCE)
  if (code) {
    try {
      const cookieStore = await cookies();
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              const value = cookieStore.get(name)?.value;
              return value;
            },
            set(name: string, value: string, options: CookieOptions) {
              cookieStore.set({ 
                name, 
                value, 
                ...options,
                httpOnly: false, // Allow client-side JavaScript to read cookies
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                path: '/',
              });
            },
            remove(name: string, options: CookieOptions) {
              cookieStore.set({ name, value: '', ...options });
            },
          },
        }
      );

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('❌ [OAuth Callback] Session exchange failed:', {
          message: exchangeError.message,
          status: exchangeError.status,
          name: exchangeError.name,
          code: (exchangeError as any)?.code,
          details: exchangeError,
        });
        
        // Provide more specific error message
        let userMessage = exchangeError.message || 'Session exchange failed';
        if (exchangeError.message?.includes('verifier')) {
          userMessage = 'PKCE verifier mismatch. This usually happens if you opened multiple login windows. Please try again.';
        } else if (exchangeError.message?.includes('expired')) {
          userMessage = 'Authorization code expired. Please try logging in again.';
        } else if (exchangeError.message?.includes('used')) {
          userMessage = 'Authorization code already used. Please try logging in again.';
        }
        
        return NextResponse.redirect(new URL(`/login?error=auth&error_description=${encodeURIComponent(userMessage)}`, request.url));
      }

      if (data?.session) {
        // Check user role to redirect appropriately
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .single();

          if (profileError) {
            console.error('⚠️ [OAuth Callback] Profile fetch error:', profileError.message);
          }

          const redirectPath = profile?.role === 'admin' ? '/admin' : '/dashboard';
          return NextResponse.redirect(new URL(redirectPath, request.url));
        } catch (roleError) {
          console.error('⚠️ [OAuth Callback] Role check error:', roleError);
          // If role check fails, default to dashboard
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } else {
        console.error('❌ [OAuth Callback] No session in response');
        return NextResponse.redirect(new URL('/login?error=no_session', request.url));
      }
    } catch (err: any) {
      console.error('❌ [OAuth Callback] Unexpected error:', {
        message: err?.message,
        stack: err?.stack,
        name: err?.name,
      });
      return NextResponse.redirect(new URL(`/login?error=server_error&error_description=${encodeURIComponent(err?.message || 'Unknown server error')}`, request.url));
    }
  }

  // No code or error, redirect to login
  console.warn('⚠️ [OAuth Callback] No code or error in URL');
  return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
}
