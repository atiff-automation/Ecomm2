/**

export const dynamic = 'force-dynamic';

 * Clear NextAuth Session API Route
 * Systematically clears stale JWT session cookies to force re-authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();

    // Clear NextAuth.js JWT session cookies
    const sessionCookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
    ];

    const response = NextResponse.json({
      success: true,
      message: 'Session cleared successfully',
    });

    // Clear all potential NextAuth cookies
    sessionCookieNames.forEach(cookieName => {
      response.cookies.delete(cookieName);
    });

    return response;
  } catch (error) {
    console.error('Error clearing session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear session' },
      { status: 500 }
    );
  }
}
