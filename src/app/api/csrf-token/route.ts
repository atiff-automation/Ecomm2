/**
 * CSRF Token API Endpoint - JRM E-commerce Platform
 * SINGLE SOURCE OF TRUTH for CSRF token generation and distribution
 *
 * This endpoint provides fresh CSRF tokens to frontend clients
 * Tokens are session-bound for authenticated users
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { CSRFProtection, CSRF_CONFIG } from '@/lib/security/csrf-protection';

export const dynamic = 'force-dynamic';

/**
 * GET /api/csrf-token
 * Generate and return a fresh CSRF token
 *
 * Response format matches CSRFTokenResponse interface from use-csrf-token.ts
 */
export async function GET(request: NextRequest) {
  try {
    // Get session to bind token to user - CENTRALIZED SESSION HANDLING
    const session = await getServerSession(authOptions);
    const sessionId = session?.user?.id;

    // Generate token using centralized CSRF protection - SINGLE SOURCE OF TRUTH
    const csrfToken = CSRFProtection.generateToken(sessionId);

    // Build response with token metadata - SYSTEMATIC RESPONSE
    const response = {
      success: true,
      csrfToken: csrfToken,
      expiresIn: CSRF_CONFIG.TOKEN_LIFETIME, // milliseconds
      headerName: CSRF_CONFIG.HEADER_NAME,
    };

    // Return with no-cache headers - SYSTEMATIC SECURITY
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate CSRF token',
        message:
          error instanceof Error
            ? error.message
            : 'Internal server error',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
