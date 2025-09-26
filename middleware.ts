/**
 * Next.js Middleware - Production-Ready Session Validation
 * Automatically validates JWT sessions against database to prevent stale session issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';

// Global Prisma instance with connection management
let prisma: PrismaClient | null = null;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}

export async function middleware(request: NextRequest) {
  // Only validate sessions for critical admin and API routes
  const { pathname } = request.nextUrl;

  const protectedPaths = [
    '/admin',
    '/api/admin',
    '/api/site-customization',
    '/api/upload'
  ];

  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  try {
    // Get JWT token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Skip validation if no token (NextAuth will handle authentication)
    if (!token?.sub) {
      return NextResponse.next();
    }

    // Validate user exists in database
    const client = getPrismaClient();
    const user = await client.user.findUnique({
      where: { id: token.sub },
      select: { id: true, email: true },
    });

    // If user doesn't exist, clear stale session and redirect
    if (!user) {
      console.warn(`[MIDDLEWARE] Stale session detected for user ID: ${token.sub}`);

      const response = NextResponse.redirect(
        new URL('/auth/signin?error=stale-session', request.url)
      );

      // Clear all NextAuth cookies
      const cookiesToClear = [
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        'next-auth.csrf-token',
        '__Host-next-auth.csrf-token',
      ];

      cookiesToClear.forEach(cookieName => {
        response.cookies.delete(cookieName);
        response.cookies.set(cookieName, '', {
          maxAge: 0,
          path: '/',
          httpOnly: true
        });
      });

      return response;
    }

    // Session is valid, proceed
    return NextResponse.next();

  } catch (error) {
    // Log error but don't break the request flow
    console.error('[MIDDLEWARE] Session validation error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Match all admin routes
    '/admin/:path*',
    // Match critical API routes that require authentication
    '/api/admin/:path*',
    '/api/site-customization/:path*',
    '/api/upload/:path*',
    // Exclude static files and internal Next.js routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};