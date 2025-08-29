/**
 * Rate Limiting Utility - Malaysian E-commerce Platform
 * Protect APIs from abuse and ensure fair usage
 */

interface RateLimitOptions {
  limit: number;
  window: string; // '1m', '1h', '1d'
  key?: string;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

class RateLimit {
  private store = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Check rate limit for identifier
   */
  async limit(
    identifier: string,
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    const key = this.generateKey(identifier, options);
    const windowMs = this.parseWindow(options.window);
    const now = Date.now();
    const resetTime = now + windowMs;

    // Get current count
    const current = this.store.get(key);

    if (!current || current.resetTime <= now) {
      // First request or window expired - reset counter
      this.store.set(key, { count: 1, resetTime });

      return {
        success: true,
        remaining: options.limit - 1,
        resetTime,
      };
    }

    // Check if limit exceeded
    if (current.count >= options.limit) {
      return {
        success: false,
        remaining: 0,
        resetTime: current.resetTime,
      };
    }

    // Increment counter
    current.count++;
    this.store.set(key, current);

    return {
      success: true,
      remaining: options.limit - current.count,
      resetTime: current.resetTime,
    };
  }

  /**
   * Generate rate limit key
   */
  private generateKey(identifier: string, options: RateLimitOptions): string {
    const keyPrefix = options.key || 'default';
    return `ratelimit:${keyPrefix}:${identifier}`;
  }

  /**
   * Parse window string to milliseconds
   */
  private parseWindow(window: string): number {
    const match = window.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(
        `Invalid window format: ${window}. Use format like '1m', '1h', '1d'`
      );
    }

    const [, value, unit] = match;
    const multiplier = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    }[unit];

    if (!multiplier) {
      throw new Error(`Invalid time unit: ${unit}`);
    }

    return parseInt(value, 10) * multiplier;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.store.entries()) {
      if (value.resetTime <= now) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }

  /**
   * Reset rate limit for identifier
   */
  async reset(identifier: string, options: RateLimitOptions): Promise<void> {
    const key = this.generateKey(identifier, options);
    this.store.delete(key);
  }

  /**
   * Get current usage for identifier
   */
  async getUsage(
    identifier: string,
    options: RateLimitOptions
  ): Promise<{
    count: number;
    remaining: number;
    resetTime: number;
  }> {
    const key = this.generateKey(identifier, options);
    const current = this.store.get(key);
    const now = Date.now();

    if (!current || current.resetTime <= now) {
      return {
        count: 0,
        remaining: options.limit,
        resetTime: now + this.parseWindow(options.window),
      };
    }

    return {
      count: current.count,
      remaining: Math.max(0, options.limit - current.count),
      resetTime: current.resetTime,
    };
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalKeys: number;
    memoryUsage: string;
  } {
    const totalKeys = this.store.size;
    const memoryUsage = `${Math.round(JSON.stringify(Array.from(this.store.entries())).length / 1024)} KB`;

    return {
      totalKeys,
      memoryUsage,
    };
  }

  /**
   * Cleanup and destroy rate limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Export singleton instance
export const rateLimit = new RateLimit();

/**
 * Rate limit middleware for Next.js API routes
 */
export function withRateLimit(options: RateLimitOptions) {
  return async (request: Request, identifier?: string) => {
    const id = identifier || getClientIdentifier(request);
    const result = await rateLimit.limit(id, options);

    if (!result.success) {
      throw new Error('Rate limit exceeded');
    }

    return result;
  };
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: Request): string {
  // Try to get IP address from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';

  return ip.trim();
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  // API endpoints
  api: { limit: 100, window: '1h', key: 'api' },
  apiStrict: { limit: 50, window: '1h', key: 'api-strict' },

  // Authentication
  login: { limit: 5, window: '15m', key: 'auth-login' },
  signup: { limit: 3, window: '1h', key: 'auth-signup' },
  passwordReset: { limit: 3, window: '1h', key: 'auth-reset' },

  // Monitoring
  errorReporting: { limit: 100, window: '1h', key: 'error-reporting' },
  performanceMonitoring: {
    limit: 200,
    window: '1h',
    key: 'performance-monitoring',
  },
  eventTracking: { limit: 500, window: '1h', key: 'event-tracking' },

  // General purpose
  general: { limit: 1000, window: '1h', key: 'general' },
  strict: { limit: 50, window: '1h', key: 'strict' },
};
