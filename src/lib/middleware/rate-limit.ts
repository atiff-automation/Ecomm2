import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, getClientIdentifier } from '@/lib/chat/security';
import { CHAT_CONFIG } from '@/lib/chat/validation';
import { createChatError } from '@/lib/chat/errors';

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

/**
 * Rate limiting middleware for chat API endpoints
 */
export function createRateLimitMiddleware(options: RateLimitOptions = {}) {
  const {
    windowMs = CHAT_CONFIG.RATE_LIMITS.WINDOW,
    maxRequests = CHAT_CONFIG.RATE_LIMITS.MAX_MESSAGES,
    keyGenerator = (request: NextRequest) => getClientIdentifier(request),
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Too many requests, please try again later'
  } = options;

  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // Generate rate limit key
      const identifier = keyGenerator(request);
      
      // Check rate limit
      const result = rateLimiter.check(identifier, windowMs, maxRequests);
      
      if (!result.success) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        
        const errorResponse = NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message,
              details: {
                limit: maxRequests,
                remaining: 0,
                resetTime: new Date(result.resetTime).toISOString(),
                retryAfter
              }
            }
          },
          { status: 429 }
        );

        // Add rate limit headers
        errorResponse.headers.set('X-RateLimit-Limit', maxRequests.toString());
        errorResponse.headers.set('X-RateLimit-Remaining', '0');
        errorResponse.headers.set('X-RateLimit-Reset', result.resetTime.toString());
        errorResponse.headers.set('Retry-After', retryAfter.toString());

        return errorResponse;
      }

      // Execute the handler
      const response = await handler(request);

      // Add rate limit headers to successful responses
      if (!skipSuccessfulRequests || (skipFailedRequests && !response.ok)) {
        response.headers.set('X-RateLimit-Limit', maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
      }

      return response;

    } catch (error) {
      console.error('Rate limit middleware error:', error);
      
      // Continue without rate limiting if middleware fails
      return await handler(request);
    }
  };
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: RateLimitOptions = {}
) {
  const middleware = createRateLimitMiddleware(options);

  return async function rateLimitedHandler(
    request: NextRequest,
    context?: any
  ): Promise<NextResponse> {
    return middleware(request, (req) => handler(req, context));
  };
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  // Standard chat API rate limiting
  CHAT_API: {
    windowMs: CHAT_CONFIG.RATE_LIMITS.WINDOW,
    maxRequests: CHAT_CONFIG.RATE_LIMITS.MAX_MESSAGES,
    message: 'Too many messages sent. Please wait before sending another message.'
  },

  // Relaxed rate limiting for session creation (development)
  SESSION_CREATE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    message: 'Too many session creation attempts. Please try again later.'
  },

  // Lenient rate limiting for message retrieval
  MESSAGE_READ: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // Increased from 30 to 60 to handle polling better
    message: 'Too many message requests. Please slow down.'
  },

  // Very strict rate limiting for webhook endpoints
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Webhook rate limit exceeded.'
  },

  // Development/testing rate limiting (more permissive)
  DEVELOPMENT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Development rate limit exceeded.'
  }
} as const;

/**
 * IP-based rate limiting key generator
 */
export function ipKeyGenerator(request: NextRequest): string {
  return getClientIdentifier(request, 'unknown-ip');
}

/**
 * User-based rate limiting key generator
 * Requires user ID in request headers or query params
 */
export function userKeyGenerator(request: NextRequest): string {
  // Try to get user ID from various sources
  const userId = request.headers.get('x-user-id') ||
                 request.nextUrl.searchParams.get('userId');
  
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fallback to IP-based limiting
  return ipKeyGenerator(request);
}

/**
 * Session-based rate limiting key generator
 */
export function sessionKeyGenerator(request: NextRequest): string {
  const sessionId = request.headers.get('x-session-id') ||
                   request.nextUrl.searchParams.get('sessionId');
  
  if (sessionId) {
    return `session:${sessionId}`;
  }
  
  // Fallback to IP-based limiting
  return ipKeyGenerator(request);
}