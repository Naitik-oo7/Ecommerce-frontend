import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, we'll check authentication on the client side
  // This middleware is a basic check - actual auth validation happens via RTK Query
  // and httpOnly cookies
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
