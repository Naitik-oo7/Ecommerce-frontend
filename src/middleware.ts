import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Block unauthenticated access to admin routes at the network layer.
  // The auth flow must set an `accessToken` cookie alongside localStorage
  // so middleware can read it (localStorage is not accessible here).
  const isAdminRoute = pathname.startsWith('/admin');
  const token = request.cookies.get('accessToken')?.value;

  if (isAdminRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
