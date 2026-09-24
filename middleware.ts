import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Redirect old domain to new domain (301 permanent redirect)
  const hostname = request.nextUrl.hostname;
  if (hostname === 'dlobcommunity.online' || hostname === 'www.dlobcommunity.online') {
    const newUrl = new URL(request.nextUrl);
    newUrl.hostname = 'dlobcommunity.com';
    return NextResponse.redirect(newUrl, { status: 301 });
  }

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
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              httpOnly: false,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              path: '/',
            })
          );
        },
      },
    }
  );

  // Only refresh session if we don't have a valid token cookie
  // This reduces unnecessary auth checks on every page navigation
  const cookieNames = request.cookies.getAll().map(c => c.name);
  const hasAuthToken = cookieNames.some(name => 
    name.startsWith('sb-') && (name.includes('auth-token') || name.includes('-token'))
  );
  
  if (hasAuthToken) {
    // Allow dashboard access for all authenticated users
    // Temp email users will see warning banner in dashboard
    // No forced redirect - user decides when to update
    return response;
  }

  // Protect /dashboard, /admin, /cikupa/dashboard, and /cikupa/admin routes if no session
  if (
    path.startsWith('/dashboard') ||
    path.startsWith('/admin') ||
    path.startsWith('/cikupa/dashboard') ||
    path.startsWith('/cikupa/admin')
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      const redirectTarget = request.nextUrl.pathname + (request.nextUrl.search || '');
      loginUrl.searchParams.set('redirect', redirectTarget);
      return NextResponse.redirect(loginUrl);
    }
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
