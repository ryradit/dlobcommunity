import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  // Handle OAuth error
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
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
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              cookieStore.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
              cookieStore.set({ name, value: '', ...options });
            },
          },
        }
      );

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Session exchange error:', exchangeError);
        return NextResponse.redirect(new URL('/login?error=auth', request.url));
      }

      if (data?.session) {
        // Check user role to redirect appropriately
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .single();

          const redirectPath = profile?.role === 'admin' ? '/admin' : '/dashboard';
          return NextResponse.redirect(new URL(redirectPath, request.url));
        } catch (roleError) {
          // If role check fails, default to dashboard
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    } catch (err) {
      console.error('Callback error:', err);
      return NextResponse.redirect(new URL('/login?error=server_error', request.url));
    }
  }

  // No code or error, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}
