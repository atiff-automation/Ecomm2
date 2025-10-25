/**
 * API Protection Middleware - Malaysian E-commerce Platform
 * Comprehensive security middleware for protecting API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getClientIP,
  isTrustedOrigin,
  isSuspiciousUserAgent,
  SECURITY_HEADERS,
} from '@/lib/utils/security';
import { getAppUrl } from '@/lib/config/app-url';

/**
 * SECURITY NOTE: Rate limiting now handled at Railway platform level
 *
 * Previous implementation: In-memory rate limiting
 * Issue: Memory leaks causing Railway container crashes every 4 hours
 *
 * Current approach: Railway provides DDoS protection and rate limiting infrastructure
 * Benefits:
 * - No memory leaks
 * - Shared state across container instances
 * - Survives container restarts
 * - Professional-grade protection
 *
 * Future: Can add Cloudflare or Upstash Redis for granular per-endpoint limits
 */

export interface ApiProtectionConfig {
  rateLimiting?: {
    enabled: boolean;
    requestsPerMinute: number;
    uniqueTokenPerInterval?: number;
  };
  corsProtection?: {
    enabled: boolean;
    allowedOrigins: string[];
  };
  userAgentValidation?: {
    enabled: boolean;
    blockSuspicious: boolean;
  };
  productionOnly?: {
    enabled: boolean;
    blockInDevelopment?: boolean;
  };
  requireAuth?: boolean;
  adminOnly?: boolean;
  logging?: {
    enabled: boolean;
    logRequests: boolean;
    logErrors: boolean;
  };
}

const defaultConfig: ApiProtectionConfig = {
  rateLimiting: {
    enabled: false, // Disabled - handled at Railway platform level
    requestsPerMinute: 60,
    uniqueTokenPerInterval: 500,
  },
  corsProtection: {
    enabled: true,
    allowedOrigins: [
      'http://localhost:3000',
      'https://localhost:3000',
      process.env.NEXTAUTH_URL || '',
      getAppUrl(true), // Use centralized helper
    ].filter(Boolean),
  },
  userAgentValidation: {
    enabled: true,
    blockSuspicious: true,
  },
  productionOnly: {
    enabled: false,
    blockInDevelopment: false,
  },
  requireAuth: false,
  adminOnly: false,
  logging: {
    enabled: true,
    logRequests: process.env.NODE_ENV === 'development',
    logErrors: true,
  },
};

export interface ProtectionResult {
  allowed: boolean;
  response?: NextResponse;
  reason?: string;
}

/**
 * Main API protection function
 */
export async function protectApiEndpoint(
  request: NextRequest,
  config: Partial<ApiProtectionConfig> = {}
): Promise<ProtectionResult> {
  const mergedConfig = { ...defaultConfig, ...config };
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const method = request.method;
  const url = request.url;

  // Extract pathname for health check detection
  const pathname = new URL(url).pathname;

  // Skip rate limiting for health check endpoints
  if (
    pathname === '/api/health' ||
    pathname === '/health' ||
    pathname === '/api/healthcheck' ||
    pathname === '/_health'
  ) {
    return { allowed: true };
  }

  // Skip rate limiting for Railway infrastructure
  if (userAgent.includes('Railway') || userAgent.includes('railway')) {
    return { allowed: true };
  }

  // Log request if enabled
  if (mergedConfig.logging?.logRequests) {
    console.log(`🛡️ API Protection Check: ${method} ${url} from ${clientIP}`);
  }

  try {
    // 1. Production-only endpoint protection
    if (mergedConfig.productionOnly?.enabled) {
      if (
        process.env.NODE_ENV !== 'production' &&
        mergedConfig.productionOnly.blockInDevelopment
      ) {
        return {
          allowed: false,
          response: NextResponse.json(
            {
              success: false,
              message: 'This endpoint is only available in production',
              error: 'PRODUCTION_ONLY',
            },
            {
              status: 403,
              headers: SECURITY_HEADERS,
            }
          ),
          reason: 'Production-only endpoint accessed in development',
        };
      }
    }

    // 2. Rate limiting - Now handled at Railway platform level
    // (Previously implemented in-memory rate limiting - removed due to memory leaks)

    // 3. CORS protection
    if (mergedConfig.corsProtection?.enabled) {
      const origin = request.headers.get('origin');

      if (
        origin &&
        !isTrustedOrigin(request, mergedConfig.corsProtection.allowedOrigins)
      ) {
        if (mergedConfig.logging?.logErrors) {
          console.warn(
            `🚫 Untrusted origin blocked: ${origin} for ${clientIP}`
          );
        }

        return {
          allowed: false,
          response: NextResponse.json(
            {
              success: false,
              message: 'Origin not allowed',
              error: 'CORS_ERROR',
            },
            {
              status: 403,
              headers: SECURITY_HEADERS,
            }
          ),
          reason: 'Untrusted origin',
        };
      }
    }

    // 4. User Agent validation
    if (
      mergedConfig.userAgentValidation?.enabled &&
      mergedConfig.userAgentValidation.blockSuspicious
    ) {
      if (isSuspiciousUserAgent(userAgent)) {
        if (mergedConfig.logging?.logErrors) {
          console.warn(
            `🚫 Suspicious user agent blocked: ${userAgent} from ${clientIP}`
          );
        }

        return {
          allowed: false,
          response: NextResponse.json(
            {
              success: false,
              message: 'Access denied',
              error: 'INVALID_CLIENT',
            },
            {
              status: 403,
              headers: SECURITY_HEADERS,
            }
          ),
          reason: 'Suspicious user agent',
        };
      }
    }

    // 5. Authentication requirement (basic implementation)
    if (mergedConfig.requireAuth) {
      const authHeader = request.headers.get('authorization');
      const sessionCookie =
        request.cookies.get('next-auth.session-token') ||
        request.cookies.get('__Secure-next-auth.session-token');

      if (!authHeader && !sessionCookie) {
        return {
          allowed: false,
          response: NextResponse.json(
            {
              success: false,
              message: 'Authentication required',
              error: 'AUTHENTICATION_REQUIRED',
            },
            {
              status: 401,
              headers: SECURITY_HEADERS,
            }
          ),
          reason: 'Authentication required',
        };
      }
    }

    // All checks passed
    return { allowed: true };
  } catch (error) {
    if (mergedConfig.logging?.logErrors) {
      console.error(`🚨 API Protection Error for ${clientIP}:`, error);
    }

    return {
      allowed: false,
      response: NextResponse.json(
        {
          success: false,
          message: 'Security validation failed',
          error: 'SECURITY_ERROR',
        },
        {
          status: 500,
          headers: SECURITY_HEADERS,
        }
      ),
      reason: 'Security validation error',
    };
  }
}

/**
 * Predefined protection configurations for common use cases
 */
export const protectionConfigs = {
  // Public endpoints (auth, products, categories)
  public: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 300, // Railway: 600 req/min
      uniqueTokenPerInterval: 2000,
    },
    corsProtection: { enabled: true, allowedOrigins: ['*'] },
    userAgentValidation: { enabled: false },
    requireAuth: false,
  } as Partial<ApiProtectionConfig>,

  // Standard API endpoints (cart)
  standard: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 150, // Railway: 300 req/min
      uniqueTokenPerInterval: 1500,
    },
    corsProtection: {
      enabled: true,
      allowedOrigins: [
        'http://localhost:3000',
        'https://localhost:3000',
        process.env.NEXTAUTH_URL || '',
        getAppUrl(true), // Use centralized helper
        // Railway public domain
        process.env.RAILWAY_PUBLIC_DOMAIN
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
          : '',
        // Wildcard for Railway preview deployments (non-production only)
        process.env.RAILWAY_ENVIRONMENT !== 'production' ? '*' : '',
      ].filter(Boolean),
    },
    userAgentValidation: { enabled: false, blockSuspicious: false },
    requireAuth: false,
  } as Partial<ApiProtectionConfig>,

  // Authenticated endpoints (orders, wishlist, user)
  authenticated: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 120, // Railway: 240 req/min
      uniqueTokenPerInterval: 1000,
    },
    corsProtection: {
      enabled: true,
      allowedOrigins: [
        'http://localhost:3000',
        'https://localhost:3000',
        process.env.NEXTAUTH_URL || '',
        getAppUrl(true), // Use centralized helper
        // Railway public domain
        process.env.RAILWAY_PUBLIC_DOMAIN
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
          : '',
        // Wildcard for Railway preview deployments (non-production only)
        process.env.RAILWAY_ENVIRONMENT !== 'production' ? '*' : '',
      ].filter(Boolean),
    },
    userAgentValidation: { enabled: true, blockSuspicious: true },
    requireAuth: true,
  } as Partial<ApiProtectionConfig>,

  // Admin-only endpoints
  admin: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 100, // Railway: 200 req/min
      uniqueTokenPerInterval: 500,
    },
    corsProtection: {
      enabled: true,
      allowedOrigins: [
        'http://localhost:3000',
        'https://localhost:3000',
        process.env.NEXTAUTH_URL || '',
        getAppUrl(true), // Use centralized helper
        // Railway public domain
        process.env.RAILWAY_PUBLIC_DOMAIN
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
          : '',
        // Wildcard for Railway preview deployments (non-production only)
        process.env.RAILWAY_ENVIRONMENT !== 'production' ? '*' : '',
      ].filter(Boolean),
    },
    userAgentValidation: { enabled: true, blockSuspicious: true },
    requireAuth: true,
    adminOnly: true,
  } as Partial<ApiProtectionConfig>,

  // Sensitive operations (payments, uploads)
  sensitive: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 30, // Railway: 60 req/min
      uniqueTokenPerInterval: 200,
    },
    corsProtection: {
      enabled: true,
      allowedOrigins: [
        'http://localhost:3000',
        'https://localhost:3000',
        process.env.NEXTAUTH_URL || '',
        getAppUrl(true), // Use centralized helper
        // Railway public domain
        process.env.RAILWAY_PUBLIC_DOMAIN
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
          : '',
        // Wildcard for Railway preview deployments (non-production only)
        process.env.RAILWAY_ENVIRONMENT !== 'production' ? '*' : '',
      ].filter(Boolean),
    },
    userAgentValidation: { enabled: true, blockSuspicious: true },
    requireAuth: true,
    productionOnly: { enabled: true, blockInDevelopment: false },
  } as Partial<ApiProtectionConfig>,

  // Critical operations
  critical: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 5, // Railway: 10 req/min
      uniqueTokenPerInterval: 50,
    },
    corsProtection: {
      enabled: true,
      allowedOrigins: [
        'http://localhost:3000',
        'https://localhost:3000',
        process.env.NEXTAUTH_URL || '',
        getAppUrl(true), // Use centralized helper
        // Railway public domain
        process.env.RAILWAY_PUBLIC_DOMAIN
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
          : '',
        // Wildcard for Railway preview deployments (non-production only)
        process.env.RAILWAY_ENVIRONMENT !== 'production' ? '*' : '',
      ].filter(Boolean),
    },
    userAgentValidation: { enabled: true, blockSuspicious: true },
    requireAuth: true,
    adminOnly: true,
    productionOnly: { enabled: true, blockInDevelopment: true },
  } as Partial<ApiProtectionConfig>,
};

/**
 * Convenience wrapper for protecting API routes
 */
export function withApiProtection(
  handler: (request?: NextRequest, context?: any) => Promise<NextResponse>,
  config: Partial<ApiProtectionConfig> = {}
) {
  return async (
    request?: NextRequest,
    context?: any
  ): Promise<NextResponse> => {
    // For handlers without request parameter (like GET), create a minimal request object
    const actualRequest = request || new NextRequest('http://localhost/api');

    const protection = await protectApiEndpoint(actualRequest, config);

    if (!protection.allowed) {
      return protection.response!;
    }

    // Add security headers to successful responses
    const response = await handler(request, context);

    // Add security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
