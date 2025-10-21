/**
 * CSRF Token Endpoint - JRM E-commerce Platform
 * Provides CSRF tokens to frontend clients for state-changing requests
 *
 * CENTRALIZED TOKEN DISTRIBUTION - Single source of truth for CSRF tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { CSRFProtection } from '@/lib/security/csrf-protection';

export const dynamic = 'force-dynamic';

/**
 * GET /api/csrf-token - Fetch CSRF token for current session
 *
 * SYSTEMATIC TOKEN GENERATION:
 * - Generates session-bound CSRF token
 * - No authentication required (tokens can be generated for anonymous users)
 * - Token automatically expires after configured lifetime (default: 1 hour)
 *
 * Usage:
 * ```typescript
 * const response = await fetch('/api/csrf-token');
 * const { csrfToken } = await response.json();
 *
 * // Use in subsequent requests
 * await fetch('/api/admin/products', {
 *   method: 'POST',
 *   headers: { 'x-csrf-token': csrfToken },
 *   body: JSON.stringify(data)
 * });
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // Get current session (if authenticated)
    const session = await getServerSession(authOptions);
    const sessionId = session?.user?.id;

    // Generate CSRF token - CENTRALIZED TOKEN GENERATION
    const csrfToken = await CSRFProtection.getTokenForSession(sessionId);

    // Return token with metadata - SYSTEMATIC RESPONSE FORMAT
    return NextResponse.json({
      success: true,
      csrfToken,
      expiresIn: parseInt(process.env.CSRF_TOKEN_LIFETIME || '3600000'), // milliseconds
      headerName: process.env.CSRF_HEADER_NAME || 'x-csrf-token',
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate CSRF token',
        message: 'An error occurred while generating the security token. Please refresh and try again.',
      },
      { status: 500 }
    );
  }
}
