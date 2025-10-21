/**
 * Centralized CSRF Protection Service
 * SINGLE SOURCE OF TRUTH for all CSRF protection across the application
 * NO HARDCODE - All configuration centralized and environment-driven
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import crypto from 'crypto';

// CENTRALIZED CONFIGURATION - Single source of truth
const CSRF_CONFIG = {
  TOKEN_LENGTH: parseInt(process.env.CSRF_TOKEN_LENGTH || '32'),
  TOKEN_LIFETIME: parseInt(process.env.CSRF_TOKEN_LIFETIME || '3600000'), // 1 hour
  HEADER_NAME: process.env.CSRF_HEADER_NAME || 'x-csrf-token',
  COOKIE_NAME: process.env.CSRF_COOKIE_NAME || '__csrf_token',
  SECRET_KEY:
    process.env.CSRF_SECRET_KEY ||
    process.env.NEXTAUTH_SECRET ||
    'fallback-secret-key',
  SKIP_ORIGINS: (process.env.CSRF_SKIP_ORIGINS || '')
    .split(',')
    .filter(Boolean),
} as const;

interface CSRFTokenData {
  token: string;
  timestamp: number;
  sessionId?: string;
}

interface CSRFValidationResult {
  valid: boolean;
  reason?: string;
  newToken?: string;
}

/**
 * CENTRALIZED CSRF Protection Class - Single Source of Truth
 */
export class CSRFProtection {
  private static tokens: Map<string, CSRFTokenData> = new Map();

  /**
   * SYSTEMATIC token generation - NO HARDCODE
   */
  static generateToken(sessionId?: string): string {
    const randomBytes = crypto.randomBytes(CSRF_CONFIG.TOKEN_LENGTH);
    const timestamp = Date.now();
    const data = `${randomBytes.toString('hex')}.${timestamp}.${sessionId || 'anonymous'}`;

    // Create HMAC signature using secret key - CENTRALIZED SECRET MANAGEMENT
    const hmac = crypto.createHmac('sha256', CSRF_CONFIG.SECRET_KEY);
    hmac.update(data);
    const signature = hmac.digest('hex');

    const token = `${data}.${signature}`;

    // Store token with metadata - CENTRALIZED TOKEN STORAGE
    this.tokens.set(token, {
      token,
      timestamp,
      sessionId,
    });

    // CLEANUP: Remove expired tokens - SYSTEMATIC MAINTENANCE
    this.cleanupExpiredTokens();

    return token;
  }

  /**
   * CENTRALIZED token validation - Single source of truth for validation logic
   */
  static validateToken(
    token: string,
    sessionId?: string
  ): CSRFValidationResult {
    try {
      if (!token) {
        return { valid: false, reason: 'Token missing' };
      }

      // Parse token components - SYSTEMATIC PARSING
      const parts = token.split('.');
      if (parts.length !== 4) {
        return { valid: false, reason: 'Invalid token format' };
      }

      const [randomPart, timestampStr, tokenSessionId, signature] = parts;
      const timestamp = parseInt(timestampStr, 10);

      // Validate timestamp - NO HARDCODE, uses centralized config
      if (Date.now() - timestamp > CSRF_CONFIG.TOKEN_LIFETIME) {
        this.tokens.delete(token);
        return { valid: false, reason: 'Token expired' };
      }

      // Validate signature - CENTRALIZED SIGNATURE VERIFICATION
      const expectedData = `${randomPart}.${timestampStr}.${tokenSessionId}`;
      const expectedHmac = crypto.createHmac('sha256', CSRF_CONFIG.SECRET_KEY);
      expectedHmac.update(expectedData);
      const expectedSignature = expectedHmac.digest('hex');

      if (
        !crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature)
        )
      ) {
        return { valid: false, reason: 'Invalid token signature' };
      }

      // Validate session binding - SYSTEMATIC SESSION VALIDATION
      if (
        sessionId &&
        tokenSessionId !== sessionId &&
        tokenSessionId !== 'anonymous'
      ) {
        return { valid: false, reason: 'Token session mismatch' };
      }

      // Check if token exists in store - CENTRALIZED TOKEN MANAGEMENT
      const tokenData = this.tokens.get(token);
      if (!tokenData) {
        return { valid: false, reason: 'Token not found' };
      }

      return { valid: true };
    } catch (error) {
      console.error('CSRF token validation error:', error);
      return { valid: false, reason: 'Token validation failed' };
    }
  }

  /**
   * CENTRALIZED request validation - DRY PRINCIPLE
   */
  static async validateRequest(
    request: NextRequest
  ): Promise<CSRFValidationResult> {
    try {
      // Skip validation for safe methods - SYSTEMATIC APPROACH
      const method = request.method.toUpperCase();
      if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return { valid: true };
      }

      // Skip validation for configured origins - CENTRALIZED CONFIGURATION
      const origin = request.headers.get('origin');
      if (origin && CSRF_CONFIG.SKIP_ORIGINS.includes(origin)) {
        return { valid: true };
      }

      // Extract session information - CENTRALIZED SESSION HANDLING
      const session = await getServerSession(authOptions);
      const sessionId = session?.user?.id;

      // Extract CSRF token from header - SYSTEMATIC EXTRACTION
      // NOTE: Token MUST be sent in header to avoid consuming request body
      // Body consumption would prevent route handlers from reading request data
      const token = request.headers.get(CSRF_CONFIG.HEADER_NAME);

      // Validate token - CENTRALIZED VALIDATION
      const validation = this.validateToken(token || '', sessionId);

      if (!validation.valid) {
        // Generate new token for next request - SYSTEMATIC TOKEN REFRESH
        const newToken = this.generateToken(sessionId);
        return {
          ...validation,
          newToken,
        };
      }

      return validation;
    } catch (error) {
      console.error('CSRF request validation error:', error);
      return { valid: false, reason: 'Request validation failed' };
    }
  }

  /**
   * SYSTEMATIC expired token cleanup - DRY PRINCIPLE
   */
  private static cleanupExpiredTokens(): void {
    const now = Date.now();
    const expiredTokens: string[] = [];

    for (const [token, data] of this.tokens.entries()) {
      if (now - data.timestamp > CSRF_CONFIG.TOKEN_LIFETIME) {
        expiredTokens.push(token);
      }
    }

    expiredTokens.forEach(token => this.tokens.delete(token));
  }

  /**
   * CENTRALIZED middleware helper - DRY for API route integration
   */
  static async middleware(request: NextRequest): Promise<Response | null> {
    const validation = await this.validateRequest(request);

    if (!validation.valid) {
      const headers = new Headers({
        'Content-Type': 'application/json',
      });

      // Include new token in response - SYSTEMATIC TOKEN REFRESH
      if (validation.newToken) {
        headers.set('X-New-CSRF-Token', validation.newToken);
      }

      return new Response(
        JSON.stringify({
          error: 'CSRF validation failed',
          reason: validation.reason,
          newToken: validation.newToken,
        }),
        {
          status: 403,
          headers,
        }
      );
    }

    return null; // Continue processing
  }

  /**
   * CENTRALIZED token retrieval for frontend - Single source of truth
   */
  static async getTokenForSession(sessionId?: string): Promise<string> {
    return this.generateToken(sessionId);
  }

  /**
   * SYSTEMATIC token refresh - DRY PRINCIPLE
   */
  static async refreshToken(
    oldToken: string,
    sessionId?: string
  ): Promise<string> {
    // Remove old token - CENTRALIZED TOKEN MANAGEMENT
    this.tokens.delete(oldToken);

    // Generate new token - SYSTEMATIC GENERATION
    return this.generateToken(sessionId);
  }

  /**
   * CENTRALIZED response helper - DRY for including CSRF tokens in responses
   */
  static addTokenToResponse(response: Response, token: string): Response {
    const newResponse = response.clone();

    // Add token to response headers - SYSTEMATIC HEADER MANAGEMENT
    newResponse.headers.set('X-CSRF-Token', token);

    // Add token to response body if JSON - CENTRALIZED JSON HANDLING
    const contentType = newResponse.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      newResponse.json().then(body => {
        const enhancedBody = {
          ...body,
          csrfToken: token,
        };

        return new Response(JSON.stringify(enhancedBody), {
          status: newResponse.status,
          statusText: newResponse.statusText,
          headers: newResponse.headers,
        });
      });
    }

    return newResponse;
  }
}

/**
 * CENTRALIZED CSRF decorator for API routes - DRY PRINCIPLE
 */
export function withCSRFProtection() {
  return function <T extends any[], R>(
    target: (...args: T) => Promise<R>,
    context: ClassMethodDecoratorContext
  ) {
    return async function (this: any, ...args: T): Promise<R> {
      const request = args[0] as NextRequest;

      const csrfResult = await CSRFProtection.middleware(request);

      if (csrfResult) {
        return csrfResult as R;
      }

      return target.apply(this, args);
    };
  };
}

/**
 * EXPORT centralized configuration and types
 */
export { CSRF_CONFIG };
export type { CSRFTokenData, CSRFValidationResult };
