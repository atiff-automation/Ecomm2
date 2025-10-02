/**
 * Centralized Rate Limiting Service
 * SINGLE SOURCE OF TRUTH for all rate limiting across the application
 * NO HARDCODE - All limits configurable via environment variables
 * FALLBACK: Uses in-memory rate limiting if Redis not configured
 */

import { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { RedisManager } from '@/lib/cache/redis-config';
import { rateLimit as inMemoryRateLimit } from '@/lib/rate-limit';

// CENTRALIZED CONFIGURATION - Single source of truth
const RATE_LIMIT_CONFIG = {
  NOTIFICATIONS: {
    WINDOW: parseInt(process.env.RATE_LIMIT_NOTIFICATIONS_WINDOW || '900000'), // 15 minutes
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_NOTIFICATIONS_MAX || '100'),
  },
  TELEGRAM_TEST: {
    WINDOW: parseInt(process.env.RATE_LIMIT_TELEGRAM_WINDOW || '300000'), // 5 minutes
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_TELEGRAM_MAX || '10'),
  },
  PREFERENCES_UPDATE: {
    WINDOW: parseInt(process.env.RATE_LIMIT_PREFERENCES_WINDOW || '60000'), // 1 minute
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_PREFERENCES_MAX || '20'),
  },
  DEFAULT: {
    WINDOW: parseInt(process.env.RATE_LIMIT_DEFAULT_WINDOW || '60000'), // 1 minute
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_DEFAULT_MAX || '60'),
  },
} as const;

type RateLimitType = keyof typeof RATE_LIMIT_CONFIG;

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: Date;
  identifier: string;
}

interface RateLimitOptions {
  identifier?: string;
  skipUserId?: boolean;
  customMessage?: string;
}

/**
 * CENTRALIZED Rate Limiter Class - Single Source of Truth
 */
export class RateLimiter {
  private static limiters: Map<string, Ratelimit> = new Map();

  /**
   * Get or create rate limiter for specific type - DRY PRINCIPLE
   * Uses centralized Redis configuration if available, falls back to in-memory
   */
  private static getRateLimiter(type: RateLimitType): Ratelimit | null {
    // If Redis not configured, return null to use in-memory fallback
    if (!RedisManager.isConfigured()) {
      return null;
    }

    const key = `limiter_${type}`;

    if (!this.limiters.has(key)) {
      const config = RATE_LIMIT_CONFIG[type];

      try {
        const redis = RedisManager.getInstance();

        // Use centralized Redis instance
        const limiter = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(config.MAX_REQUESTS, `${config.WINDOW}ms`),
          analytics: true,
          prefix: `ratelimit:${type.toLowerCase()}`,
        });

        this.limiters.set(key, limiter);
      } catch (error) {
        console.warn(`Failed to create Redis rate limiter for ${type}, will use in-memory fallback`);
        return null;
      }
    }

    return this.limiters.get(key) || null;
  }

  /**
   * CENTRALIZED rate limiting check - Single source of truth for all rate limiting logic
   * Uses Redis if configured, falls back to in-memory rate limiting
   */
  static async checkRateLimit(
    request: NextRequest,
    type: RateLimitType,
    userId?: string,
    options: RateLimitOptions = {}
  ): Promise<RateLimitResult> {
    try {
      const limiter = this.getRateLimiter(type);
      const identifier = this.generateIdentifier(request, type, userId, options);

      // Use Redis-based rate limiting if available
      if (limiter) {
        const result = await limiter.limit(identifier);

        return {
          success: result.success,
          remaining: result.remaining,
          reset: result.reset,
          identifier,
        };
      }

      // Fallback to in-memory rate limiting
      const config = RATE_LIMIT_CONFIG[type];
      const windowSeconds = Math.floor(config.WINDOW / 1000);
      const result = await inMemoryRateLimit.limit(identifier, {
        limit: config.MAX_REQUESTS,
        window: `${windowSeconds}s`,
        key: type.toLowerCase(),
      });

      return {
        success: result.success,
        remaining: result.remaining,
        reset: new Date(result.resetTime),
        identifier,
      };
    } catch (error) {
      console.error(`Rate limiter error for ${type}:`, error);

      // FAIL SAFE - Allow request if rate limiter fails but log the error
      return {
        success: true,
        remaining: 0,
        reset: new Date(),
        identifier: 'error',
      };
    }
  }

  /**
   * SYSTEMATIC identifier generation - SINGLE SOURCE OF TRUTH
   */
  private static generateIdentifier(
    request: NextRequest,
    type: RateLimitType,
    userId?: string,
    options: RateLimitOptions = {}
  ): string {
    // Custom identifier takes priority
    if (options.identifier) {
      return options.identifier;
    }

    // User-based limiting for authenticated requests
    if (userId && !options.skipUserId) {
      return `user:${userId}`;
    }

    // IP-based limiting as fallback
    const ip = this.getClientIP(request);
    return `ip:${ip}`;
  }

  /**
   * CENTRALIZED IP extraction - DRY PRINCIPLE
   */
  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = request.headers.get('x-client-ip');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    if (realIP) {
      return realIP;
    }

    if (clientIP) {
      return clientIP;
    }

    // Fallback to connection remote address
    return request.ip || 'unknown';
  }

  /**
   * CENTRALIZED rate limit response generator - SINGLE SOURCE OF TRUTH
   */
  static createRateLimitResponse(
    result: RateLimitResult,
    type: RateLimitType,
    customMessage?: string
  ): Response {
    const config = RATE_LIMIT_CONFIG[type];

    const message = customMessage ||
      `Too many requests. Limit: ${config.MAX_REQUESTS} requests per ${config.WINDOW / 1000} seconds.`;

    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': config.MAX_REQUESTS.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.reset.getTime().toString(),
      'Retry-After': Math.round((result.reset.getTime() - Date.now()) / 1000).toString(),
    });

    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message,
        retryAfter: result.reset,
        remaining: result.remaining,
      }),
      {
        status: 429,
        headers,
      }
    );
  }

  /**
   * SYSTEMATIC middleware helper - DRY for API route integration
   */
  static async middleware(
    request: NextRequest,
    type: RateLimitType,
    userId?: string,
    options: RateLimitOptions = {}
  ): Promise<Response | null> {
    const result = await this.checkRateLimit(request, type, userId, options);

    if (!result.success) {
      return this.createRateLimitResponse(result, type, options.customMessage);
    }

    return null; // Continue processing
  }
}

/**
 * CENTRALIZED rate limit decorator for API routes - DRY PRINCIPLE
 */
export function withRateLimit(
  type: RateLimitType,
  options: RateLimitOptions = {}
) {
  return function <T extends any[], R>(
    target: (...args: T) => Promise<R>,
    context: ClassMethodDecoratorContext
  ) {
    return async function (this: any, ...args: T): Promise<R> {
      const request = args[0] as NextRequest;

      // Extract userId from session if available
      const userId = options.skipUserId ? undefined : await extractUserIdFromRequest(request);

      const rateLimitResult = await RateLimiter.middleware(request, type, userId, options);

      if (rateLimitResult) {
        return rateLimitResult as R;
      }

      return target.apply(this, args);
    };
  };
}

/**
 * Helper to extract userId from request - CENTRALIZED LOGIC
 */
async function extractUserIdFromRequest(request: NextRequest): Promise<string | undefined> {
  try {
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth/config');

    const session = await getServerSession(authOptions);
    return session?.user?.id;
  } catch (error) {
    // If session extraction fails, continue without userId
    return undefined;
  }
}

/**
 * EXPORT centralized configuration for other services
 */
export { RATE_LIMIT_CONFIG };
export type { RateLimitResult, RateLimitOptions, RateLimitType };