import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { protectApiEndpoint, protectionConfigs } from '@/lib/middleware/api-protection';

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
 * CSRF Token generation
 */
function generateCSRFToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
}

/**
 * Determine API protection level based on pathname
 */
function getProtectionLevel(pathname: string): 'public' | 'standard' | 'authenticated' | 'admin' | 'sensitive' {
  // Admin routes - highest protection
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/superadmin')) {
    return 'admin';
  }

  // Sensitive operations - payment, webhooks, uploads
  if (
    pathname.startsWith('/api/payment') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/upload') ||
    pathname.startsWith('/api/site-customization')
  ) {
    return 'sensitive';
  }

  // Authenticated user routes
  if (
    pathname.startsWith('/api/member') ||
    pathname.startsWith('/api/user') ||
    pathname.startsWith('/api/settings') ||
    pathname.startsWith('/api/orders') ||
    pathname.startsWith('/api/wishlist') ||
    pathname.startsWith('/api/chat/send')
  ) {
    return 'authenticated';
  }

  // Cart operations - standard protection
  if (pathname.startsWith('/api/cart')) {
    return 'standard';
  }

  // Public routes - minimal protection (auth, products, health checks)
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/products') ||
    pathname.startsWith('/api/categories') ||
    pathname.startsWith('/api/health')
  ) {
    return 'public';
  }

  // Default to standard protection for unknown routes
  return 'standard';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get client IP
  const ip =
    request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  // CRITICAL: Block all test and debug endpoints in production
  if ((pathname.startsWith('/api/test') || pathname.startsWith('/api/debug')) &&
      process.env.NODE_ENV === 'production') {
    console.warn(`🚫 Blocked test endpoint access in production: ${pathname} from IP: ${ip}`);
    return NextResponse.json(
      { message: 'Not found' },
      { status: 404 }
    );
  }

  // Apply API protection middleware for all API routes
  const isApiRoute = pathname.startsWith('/api');

  if (isApiRoute) {
    // Determine protection level based on route
    const protectionLevel = getProtectionLevel(pathname);
    const config = protectionConfigs[protectionLevel];

    // Apply API protection
    const protection = await protectApiEndpoint(request, config);

    if (!protection.allowed) {
      // Return the protection middleware's response
      return protection.response!;
    }
  }

  // Continue with response
  const response = NextResponse.next();

  // Set security headers for all responses
  setSecurityHeaders(response);

  // Protected UI routes (non-API)
  const protectedUIRoutes = ['/admin', '/superadmin', '/member'];
  const isProtectedUIRoute = protectedUIRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedUIRoute) {
    try {
      // Check if session exists for UI routes
      const sessionToken =
        request.cookies.get('next-auth.session-token')?.value ||
        request.cookies.get('__Secure-next-auth.session-token')?.value;

      if (!sessionToken) {
        // Redirect to login for web routes
        const loginUrl = new URL('/auth/signin', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.error('[MIDDLEWARE] Session validation error: ', error);
      const loginUrl = new URL('/auth/signin', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
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
    // Explicitly match test/debug routes to ensure blocking
    '/api/test/:path*',
    '/api/debug/:path*',
  ],
};
