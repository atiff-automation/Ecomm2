import crypto from 'crypto';

/**
 * Verify webhook signature using HMAC SHA-256
 * @param payload - Raw payload string
 * @param signature - Signature from webhook header
 * @param secret - Webhook secret key
 * @returns boolean indicating if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Remove any prefix like "sha256=" if present
    const cleanSignature = signature.replace(/^sha256=/, '');
    
    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Generate webhook signature for outgoing requests
 * @param payload - Payload to sign
 * @param secret - Secret key
 * @returns Generated signature with sha256 prefix
 */
export function generateWebhookSignature(
  payload: string | object,
  secret: string
): string {
  const payloadString = typeof payload === 'string' 
    ? payload 
    : JSON.stringify(payload);
    
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadString, 'utf8')
    .digest('hex');
    
  return `sha256=${signature}`;
}

/**
 * Generate secure session ID
 * @returns Cryptographically secure random session ID
 */
export function generateSecureSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Rate limiting helper - simple in-memory store
 * Note: In production, use Redis or similar for distributed rate limiting
 */
class InMemoryRateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();
  
  /**
   * Check if request is within rate limit
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @param windowMs - Time window in milliseconds
   * @param maxRequests - Maximum requests per window
   * @returns Object with success status and remaining requests
   */
  check(
    identifier: string, 
    windowMs: number, 
    maxRequests: number
  ): { success: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);
    
    // If no entry or window expired, create new entry
    if (!entry || now > entry.resetTime) {
      const resetTime = now + windowMs;
      this.store.set(identifier, { count: 1, resetTime });
      return { 
        success: true, 
        remaining: maxRequests - 1, 
        resetTime 
      };
    }
    
    // Check if within limit
    if (entry.count < maxRequests) {
      entry.count += 1;
      this.store.set(identifier, entry);
      return { 
        success: true, 
        remaining: maxRequests - entry.count, 
        resetTime: entry.resetTime 
      };
    }
    
    // Rate limit exceeded
    return { 
      success: false, 
      remaining: 0, 
      resetTime: entry.resetTime 
    };
  }
  
  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Export singleton instance
export const rateLimiter = new InMemoryRateLimiter();

// Clean up rate limiter every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);

/**
 * Get client identifier from request for rate limiting
 * @param request - Next.js request object
 * @param fallback - Fallback identifier
 * @returns Client identifier string
 */
export function getClientIdentifier(request: Request, fallback = 'anonymous'): string {
  // Try to get IP from headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp.trim();
  }
  
  return fallback;
}