/**
 * Production Security Headers
 * Following @CLAUDE.md centralized security approach
 */

import { NextResponse } from 'next/server';

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval
      "style-src 'self' 'unsafe-inline'", // Required for styled-components
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // Prevent XSS attacks
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    ['camera=()', 'microphone=()', 'geolocation=()', 'interest-cohort=()'].join(
      ', '
    )
  );

  return response;
}

/**
 * Create secure JSON response with headers
 */
export function createSecureResponse(
  data: unknown,
  options: { status?: number; headers?: Record<string, string> } = {}
): NextResponse {
  const response = NextResponse.json(data, {
    status: options.status || 200,
    headers: options.headers,
  });

  return addSecurityHeaders(response);
}
