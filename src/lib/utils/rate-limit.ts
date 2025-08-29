/**
 * Rate Limiting Utility - Malaysian E-commerce Platform
 * Implements sliding window rate limiting for API endpoints
 */

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max unique tokens per interval
}

interface RateLimitState {
  count: number;
  lastReset: number;
}

class RateLimiter {
  private config: RateLimitConfig;
  private hits = new Map<string, RateLimitState>();

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async check(limit: number, token: string): Promise<void> {
    const now = Date.now();
    const key = token;

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup(now);
    }

    const current = this.hits.get(key) || { count: 0, lastReset: now };

    // Reset counter if interval has passed
    if (now - current.lastReset > this.config.interval) {
      current.count = 0;
      current.lastReset = now;
    }

    // Check if limit exceeded
    if (current.count >= limit) {
      throw new Error('Rate limit exceeded');
    }

    // Increment counter
    current.count++;
    this.hits.set(key, current);

    // Prevent memory leaks by limiting map size
    if (this.hits.size > this.config.uniqueTokenPerInterval) {
      this.cleanup(now);
    }
  }

  private cleanup(now: number): void {
    const keysToDelete: string[] = [];
    this.hits.forEach((state, key) => {
      if (now - state.lastReset > this.config.interval) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.hits.delete(key));
  }

  getStats(): { activeTokens: number; totalHits: number } {
    const totalHits = Array.from(this.hits.values()).reduce(
      (sum, state) => sum + state.count,
      0
    );
    return {
      activeTokens: this.hits.size,
      totalHits,
    };
  }
}

// Rate limiter factory
export function rateLimit(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // Strict rate limiting for sensitive operations
  strict: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100,
  }),

  // Moderate rate limiting for general API usage
  moderate: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
  }),

  // Lenient rate limiting for public endpoints
  lenient: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 1000,
  }),
};
