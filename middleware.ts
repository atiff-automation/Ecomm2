/**
 * Next.js Middleware - Optimized Session Validation
 * Trust JWT validation - database validation handled by NextAuth JWT callback
 * NO DATABASE QUERIES to prevent connection exhaustion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { addSecurityHeaders } from '@/lib/security/headers';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Redirect www to non-www (canonical URL)
  if (hostname.startsWith('www.')) {
    const url = request.nextUrl.clone();
    url.host = hostname.replace('www.', '');
    return NextResponse.redirect(url, 301);
  }

  const protectedPaths = ['/admin', '/api/admin'];

  const isProtectedPath = protectedPaths.some(path =>
    pathname.startsWith(path)
  );

  // Apply security headers to Click Pages (public pages with tracking scripts)
  const isClickPage = pathname.startsWith('/click/');

  if (!isProtectedPath) {
    const response = NextResponse.next();

    // Add security headers to Click Pages to allow tracking scripts
    if (isClickPage) {
      return addSecurityHeaders(response);
    }

    return response;
  }

  try {
    // Get and validate JWT token (NO DATABASE QUERY)
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If no token or token is invalid (empty object from NextAuth callback)
    // NextAuth will handle authentication redirect
    if (!token || !token.sub || !token.role) {
      return NextResponse.next();
    }

    // JWT is valid and user was validated in NextAuth JWT callback
    // Trust the JWT - proceed with request
    return NextResponse.next();
  } catch (error) {
    console.error('[MIDDLEWARE] Token validation error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Apply to all routes for www redirect
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
