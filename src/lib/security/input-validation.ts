/**
 * Production-Ready Input Validation and Sanitization
 * Following @CLAUDE.md centralized architecture and security best practices
 */

import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger/production-logger';

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'email' | 'sessionId' | 'enum';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: string[];
  sanitize?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData: Record<string, unknown>;
}

/**
 * Sanitize HTML and dangerous characters from string input
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/['"]/g, '') // Remove quotes
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate session ID format
 */
export function isValidSessionId(sessionId: string): boolean {
  // Session IDs should be alphanumeric with specific length
  const sessionIdPattern = /^[a-zA-Z0-9_-]{8,128}$/;
  return sessionIdPattern.test(sessionId);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email) && email.length <= 254;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limiting for IP/user
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; resetTime: number } {
  const now = Date.now();
  const key = `rate_limit:${identifier}`;
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    // Create new window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { allowed: true, resetTime: now + config.windowMs };
  }

  if (existing.count >= config.maxRequests) {
    logger.warn('Rate limit exceeded', {
      component: 'rate-limiter',
      identifier,
      count: existing.count,
      maxRequests: config.maxRequests,
    });
    return { allowed: false, resetTime: existing.resetTime };
  }

  // Increment count
  existing.count++;
  rateLimitStore.set(key, existing);
  return { allowed: true, resetTime: existing.resetTime };
}

/**
 * Validate request data against rules
 */
export function validateInput(
  data: Record<string, unknown>,
  rules: ValidationRule[]
): ValidationResult {
  const errors: string[] = [];
  const sanitizedData: Record<string, unknown> = {};

  for (const rule of rules) {
    const value = data[rule.field];

    // Check required fields
    if (
      rule.required &&
      (value === undefined || value === null || value === '')
    ) {
      errors.push(`${rule.field} is required`);
      continue;
    }

    // Skip validation for optional empty fields
    if (
      !rule.required &&
      (value === undefined || value === null || value === '')
    ) {
      continue;
    }

    const stringValue = String(value);

    // Type-specific validation
    switch (rule.type) {
      case 'string':
        if (rule.minLength && stringValue.length < rule.minLength) {
          errors.push(
            `${rule.field} must be at least ${rule.minLength} characters`
          );
        }
        if (rule.maxLength && stringValue.length > rule.maxLength) {
          errors.push(
            `${rule.field} must not exceed ${rule.maxLength} characters`
          );
        }
        if (rule.pattern && !rule.pattern.test(stringValue)) {
          errors.push(`${rule.field} format is invalid`);
        }
        sanitizedData[rule.field] = rule.sanitize
          ? sanitizeString(stringValue)
          : stringValue;
        break;

      case 'number': {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors.push(`${rule.field} must be a valid number`);
        } else {
          sanitizedData[rule.field] = numValue;
        }
        break;
      }

      case 'email':
        if (!isValidEmail(stringValue)) {
          errors.push(`${rule.field} must be a valid email address`);
        } else {
          sanitizedData[rule.field] = stringValue.toLowerCase();
        }
        break;

      case 'sessionId':
        if (!isValidSessionId(stringValue)) {
          errors.push(`${rule.field} must be a valid session ID`);
        } else {
          sanitizedData[rule.field] = stringValue;
        }
        break;

      case 'enum':
        if (!rule.enum || !rule.enum.includes(stringValue)) {
          errors.push(`${rule.field} must be one of: ${rule.enum?.join(', ')}`);
        } else {
          sanitizedData[rule.field] = stringValue;
        }
        break;

      default:
        sanitizedData[rule.field] = value;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData,
  };
}

/**
 * Extract and validate query parameters
 */
export function validateQueryParams(
  request: NextRequest,
  rules: ValidationRule[]
): ValidationResult {
  const { searchParams } = new URL(request.url);
  const data: Record<string, unknown> = {};

  // Extract all query parameters
  searchParams.forEach((value, key) => {
    data[key] = value;
  });

  return validateInput(data, rules);
}

/**
 * Extract and validate JSON body
 */
export async function validateJsonBody(
  request: NextRequest,
  rules: ValidationRule[]
): Promise<ValidationResult> {
  try {
    const body = await request.json();
    return validateInput(body, rules);
  } catch (error) {
    logger.error(
      'Failed to parse JSON body',
      { component: 'input-validation' },
      error as Error
    );
    return {
      isValid: false,
      errors: ['Invalid JSON format'],
      sanitizedData: {},
    };
  }
}

/**
 * Common validation rules for chat endpoints
 */
export const ChatValidationRules = {
  sessionId: {
    field: 'sessionId',
    type: 'sessionId' as const,
    required: true,
  },
  status: {
    field: 'status',
    type: 'enum' as const,
    enum: ['all', 'active', 'ended'],
    required: false,
  },
  timeRange: {
    field: 'range',
    type: 'enum' as const,
    enum: ['1h', '24h', '7d', '30d', '90d', 'all'],
    required: false,
  },
  limit: {
    field: 'limit',
    type: 'number' as const,
    required: false,
  },
  offset: {
    field: 'offset',
    type: 'number' as const,
    required: false,
  },
  search: {
    field: 'search',
    type: 'string' as const,
    maxLength: 200,
    sanitize: true,
    required: false,
  },
} as const;

/**
 * Get client IP address for rate limiting
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const ip = request.ip;

  // Return the first IP from forwarded header or fallback
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (ip) {
    return ip;
  }
  return 'unknown';
}
