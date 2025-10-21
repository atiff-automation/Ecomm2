/**
 * CSRF Protection Middleware
 * Simple wrapper for applying CSRF protection to API routes
 *
 * Following CLAUDE.md standards:
 * - DRY principle (reusable middleware)
 * - Type safety (explicit types)
 * - Security first (CSRF protection)
 * - No hardcoding (uses centralized CSRF service)
 */

import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/security/csrf-protection';

/**
 * Check CSRF token for the request
 * Returns error response if CSRF validation fails, null if valid
 *
 * @param request - NextRequest object
 * @returns NextResponse with error if invalid, null if valid
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   const csrfCheck = await checkCSRF(request);
 *   if (csrfCheck) return csrfCheck;
 *
 *   // Your route logic here...
 * }
 */
export async function checkCSRF(
  request: NextRequest
): Promise<NextResponse | null> {
  const result = await CSRFProtection.middleware(request);

  if (result) {
    // CSRF validation failed - return error response
    return NextResponse.json(
      {
        error: 'CSRF validation failed. Please refresh the page and try again.',
        code: 'CSRF_INVALID',
      },
      { status: 403 }
    );
  }

  // CSRF validation passed
  return null;
}

/**
 * Generate CSRF token for client
 * Use this in GET routes to provide tokens to the frontend
 *
 * @param sessionId - Optional session ID for token binding
 * @returns CSRF token string
 *
 * @example
 * export async function GET() {
 *   const token = await generateCSRFToken(session?.user?.id);
 *   return NextResponse.json({ csrfToken: token });
 * }
 */
export async function generateCSRFToken(sessionId?: string): Promise<string> {
  return CSRFProtection.getTokenForSession(sessionId);
}
