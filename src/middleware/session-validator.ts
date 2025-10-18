/**
 * Session Validation Middleware
 * Systematically validates JWT session user IDs against database
 * Auto-clears stale sessions to prevent foreign key violations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function validateSessionMiddleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-build',
  });

  // Skip validation if no token
  if (!token?.sub) {
    return NextResponse.next();
  }

  try {
    // Check if user ID from JWT token exists in database
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true },
    });

    // If user doesn't exist, clear stale session
    if (!user) {
      console.warn(
        `Stale session detected - User ID ${token.sub} not found in database`
      );

      const response = NextResponse.redirect(
        new URL('/auth/signin?error=stale-session', request.url)
      );

      // Clear NextAuth cookies
      const cookiesToClear = [
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        'next-auth.csrf-token',
        '__Host-next-auth.csrf-token',
      ];

      cookiesToClear.forEach(cookieName => {
        response.cookies.delete(cookieName);
      });

      return response;
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.next();
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Middleware matcher for admin routes and API routes that require authentication
 * Extended to cover all authenticated user endpoints
 */
export const sessionValidationPaths = [
  '/admin/:path*',
  '/api/admin/:path*',
  '/api/superadmin/:path*',
  '/api/member/:path*',
  '/api/user/:path*',
  '/api/settings/:path*',
  '/api/cart/:path*',
  '/api/orders/:path*',
  '/api/wishlist/:path*',
  '/api/site-customization/:path*',
  '/api/upload/:path*',
  '/api/chat/send/:path*',
];
