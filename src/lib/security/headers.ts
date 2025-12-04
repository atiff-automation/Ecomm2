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
  // Allows tracking scripts for Click Pages analytics (Facebook Pixel, Google Analytics, GTM)
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      // Allow tracking scripts: Next.js, Facebook Pixel, Google Analytics, GTM
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'", // Required for styled-components
      "img-src 'self' data: https:", // Allow all HTTPS images (includes tracking pixels)
      "font-src 'self' data:",
      // Allow connections to tracking services
      "connect-src 'self' https: https://www.facebook.com https://www.google-analytics.com https://analytics.google.com",
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
