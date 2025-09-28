import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in-memory for development, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: process.env.NODE_ENV === 'development' ? 1000 : 100, // More generous in dev
  apiMaxRequests: process.env.NODE_ENV === 'development' ? 500 : 50, // More generous in dev
};

/**
 * Rate limiting function
 */
function checkRateLimit(
  ip: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const key = `${ip}:${Math.floor(now / windowMs)}`;

  const current = rateLimitStore.get(key) || {
    count: 0,
    resetTime: now + windowMs,
  };

  if (now > current.resetTime) {
    // Reset the counter
    current.count = 1;
    current.resetTime = now + windowMs;
  } else {
    current.count++;
  }

  rateLimitStore.set(key, current);

  // Clean up old entries
  Array.from(rateLimitStore.entries()).forEach(([storeKey, value]) => {
    if (now > value.resetTime) {
      rateLimitStore.delete(storeKey);
    }
  });

  return current.count <= maxRequests;
}

/**
 * Security headers
 */
function setSecurityHeaders(response: NextResponse): void {
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Content Type Options
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Frame Options
  response.headers.set('X-Frame-Options', 'DENY');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
}

/**
 * CSRF Token generation and validation
 */
function generateCSRFToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Get client IP
  const ip =
    request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  // Set security headers
  setSecurityHeaders(response);

  // Rate limiting (skip for auth routes in development)
  const isApiRoute = pathname.startsWith('/api');
  const isAuthRoute = pathname.startsWith('/api/auth');
  const shouldSkipRateLimit =
    process.env.NODE_ENV === 'development' && isAuthRoute;

  if (!shouldSkipRateLimit) {
    const maxRequests = isApiRoute
      ? RATE_LIMIT_CONFIG.apiMaxRequests
      : RATE_LIMIT_CONFIG.maxRequests;

    if (!checkRateLimit(ip, maxRequests, RATE_LIMIT_CONFIG.windowMs)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(
            RATE_LIMIT_CONFIG.windowMs / 1000
          ).toString(),
        },
      });
    }
  }

  // CSRF protection for API routes (except auth routes)
  // Skip CSRF in development for easier testing
  if (
    process.env.NODE_ENV === 'production' &&
    isApiRoute &&
    !pathname.startsWith('/api/auth') &&
    request.method !== 'GET'
  ) {
    const csrfToken = request.headers.get('x-csrf-token');
    const sessionToken =
      request.headers.get('authorization') ||
      request.cookies.get('next-auth.session-token')?.value;

    if (!csrfToken || !sessionToken) {
      return new NextResponse('CSRF token missing', { status: 403 });
    }

    // In production, implement proper CSRF token validation
    // For now, just check if token exists
  }

  // Protected routes
  const protectedRoutes = [
    '/admin',
    '/superadmin',
    '/member',
    '/api/admin',
    '/api/superadmin',
    '/api/members',
  ];

  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    try {
      // Use a simpler approach for middleware - just check if session exists
      // Detailed role checking will be done in API routes and page components
      const sessionToken =
        request.cookies.get('next-auth.session-token')?.value ||
        request.cookies.get('__Secure-next-auth.session-token')?.value;

      if (!sessionToken) {
        // Redirect to login for web routes
        if (!pathname.startsWith('/api')) {
          const loginUrl = new URL('/auth/signin', request.url);
          loginUrl.searchParams.set('callbackUrl', pathname);
          return NextResponse.redirect(loginUrl);
        }

        // Return 401 for API routes
        return new NextResponse('Unauthorized', { status: 401 });
      }

      // For protected routes, we'll rely on the API routes and page components
      // to do detailed authentication and authorization checks
      // This prevents Prisma from being called in the middleware (Edge Runtime)

    } catch (error) {
      console.error('[MIDDLEWARE] Session validation error: ', error);

      // Redirect to login for web routes
      if (!pathname.startsWith('/api')) {
        const loginUrl = new URL('/auth/signin', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Return 401 for API routes
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  // Add CSRF token to response headers for client-side usage
  if (!isApiRoute) {
    response.headers.set('x-csrf-token', generateCSRFToken());
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
