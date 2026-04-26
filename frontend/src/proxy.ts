import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Route Protection Proxy
 * (renamed from "middleware" — deprecated in Next.js 16)
 *
 * Strategy: Edge-compatible token check via cookie.
 * Client-side auth (AuthContext) still guards UI state.
 * This adds a server-side redirect layer for SEO safety.
 */

const PROTECTED_ROUTES = [
  '/dashboard',
  '/battles',
  '/profile',
  '/settings',
  '/host',
  '/play',
  '/create',
  '/admin',
  '/institution',
  '/friends',
  '/leaderboard',
  '/marketplace',
  '/tournaments',
  '/events',
];

const PUBLIC_ONLY_ROUTES = ['/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('/favicon.ico') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|woff|woff2|ttf|ico)$/)
  ) {
    return NextResponse.next();
  }

  // Read lightweight session cookie (set by frontend on login)
  const sessionCookie = request.cookies.get('samarpan_session')?.value;
  const isAuthenticated = !!sessionCookie;

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  const isPublicOnly = PUBLIC_ONLY_ROUTES.some(r => pathname.startsWith(r));

  // Redirect unauthenticated users away from protected pages
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect already-authenticated users away from /auth
  if (isPublicOnly && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add security headers on every response
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow'); // only for admin routes
  return response;
}

export const config = {
  matcher: [
    // Match everything except static assets and API
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
