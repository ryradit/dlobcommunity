import { createClient } from '@supabase/supabase-js';
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
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      // Create a new client for this request
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          flowType: 'pkce',
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      });

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Session exchange error:', exchangeError);
        return NextResponse.redirect(new URL('/login?error=auth', request.url));
      }

      if (data?.session) {
        // Session successfully created, redirect to dashboard
        const response = NextResponse.redirect(new URL(next, request.url));
        return response;
      }
    } catch (err) {
      console.error('Callback error:', err);
      return NextResponse.redirect(new URL('/login?error=server_error', request.url));
    }
  }

  // No code or error, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}
