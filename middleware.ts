import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip session check for static assets and API routes that don't need auth
  const path = request.nextUrl.pathname;
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/api/') ||
    path.includes('/images/') ||
    path.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
            httpOnly: false, // Allow client-side access
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
            httpOnly: false,
            path: '/',
          });
        },
      },
    }
  );

  // Only refresh session if we don't have a valid token cookie
  // This reduces unnecessary auth checks on every page navigation
  const cookieNames = request.cookies.getAll().map(c => c.name);
  const hasAuthToken = cookieNames.some(name => name.includes('auth-token') && name.startsWith('sb-'));
  
  if (hasAuthToken) {
    // Allow dashboard access for all authenticated users
    // Temp email users will see warning banner in dashboard
    // No forced redirect - user decides when to update
    return response;
  }

  // For other routes or when no token, check session
  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
