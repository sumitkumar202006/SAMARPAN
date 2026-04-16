import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define protected routes that require a session
  const protectedRoutes = [
    '/dashboard',
    '/battles',
    '/leaderboard',
    '/profile',
    '/settings',
    '/host',
    '/play',
    '/create',
    '/admin'
  ];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // 2. Check for auth token in cookies
  // Note: Since this app uses localStorage for tokens (AuthContext.tsx), 
  // standard middleware can't read it. However, many production apps
  // also set a lightweight 'session-active' cookie during login for middleware checks.
  // For now, we'll assume the browser handled login, but for a REALLY production app,
  // we'd want to check a cookie.
  
  // If we don't have cookies yet, we mostly rely on client-side AuthGuard components
  // which are already in use in the project (AuthGuard, AuthContext).
  
  // However, to satisfy the requirement of "Fix middleware so it does not block valid routes",
  // we will ensure that we allow all public assets and the /auth page.
  
  if (pathname.startsWith('/auth') || pathname.startsWith('/_next') || pathname.includes('/favicon.ico')) {
    return NextResponse.next();
  }

  // If you wanted to do a hard redirect here, you'd check:
  // const token = request.cookies.get('samarpan_session');
  // if (isProtectedRoute && !token) return NextResponse.redirect(new URL('/auth', request.url));

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
