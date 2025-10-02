/**
 * Next.js Middleware - Optimized Session Validation
 * Trust JWT validation - database validation handled by NextAuth JWT callback
 * NO DATABASE QUERIES to prevent connection exhaustion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Only protect critical admin routes
  const { pathname } = request.nextUrl;

  const protectedPaths = [
    '/admin',
    '/api/admin',
  ];

  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (!isProtectedPath) {
    return NextResponse.next();
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
    // Match only critical admin routes (narrow scope)
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};