import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Just pass through to the app
  // Auth is handled client-side in the layout
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
