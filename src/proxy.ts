import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Renamed from the deprecated `middleware` convention to Next 16's `proxy`.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Issue #19: Protect customer routes that require authentication
  const protectedRoutes = ['/profile', '/checkout', '/orders'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Block unauthenticated access to admin routes at the network layer.
  // The auth flow must set an `accessToken` cookie alongside localStorage
  // so proxy can read it (localStorage is not accessible here).
  const isAdminRoute = pathname.startsWith('/admin');

  // Issue #20: Token is validated by existence only in proxy.
  // Full JWT verification would require the 'jose' library for Edge runtime.
  // The API is the ultimate authority for token validation.
  const token = request.cookies.get('accessToken')?.value;

  if ((isAdminRoute || isProtectedRoute) && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
