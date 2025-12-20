import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/session';

const publicRoutes = [
  '/',
  '/pricing',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/favicon.ico',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  if (
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/invite') ||
    pathname.match(/\.(png|jpg|jpeg|svg|gif|ico)$/) // static assets
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get('session');

  // If no session, redirect to sign-in
  if (!session?.value) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Verify session
  const payload = await verifyToken(session.value);
  if (!payload) {
    // Invalid session, clear cookie and redirect
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(url);
    response.cookies.delete('session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
