/**
 * Error Handling Utilities
 * Centralized error handling for tracking system
 * Based on CUSTOMER_TRACKING_IMPLEMENTATION_PLAN.md
 */

import { NextResponse } from 'next/server';
import {
  TrackingError,
  RateLimitError,
  ValidationError,
  AuthorizationError,
  SecurityLog,
} from '../types/tracking';
import { TRACKING_CONFIG } from '../config/tracking';

/**
 * Security logging for tracking events
 */
const securityLogs: SecurityLog[] = [];

export const logSecurityEvent = (
  event: Omit<SecurityLog, 'timestamp'>
): void => {
  const log: SecurityLog = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  securityLogs.push(log);

  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    console.warn('SECURITY_EVENT:', JSON.stringify(log));
  }

  // Keep only recent logs in memory (last 1000 entries)
  if (securityLogs.length > 1000) {
    securityLogs.splice(0, 500); // Remove oldest 500
  }
};

/**
 * Get recent security logs (for admin monitoring)
 */
export const getRecentSecurityLogs = (limit: number = 100): SecurityLog[] => {
  return securityLogs.slice(-limit);
};

/**
 * Create standardized API error responses
 */
export const createErrorResponse = (
  error: Error,
  request?: Request
): NextResponse => {
  // Log the error
  console.error('API Error:', error);

  // Get client IP for logging
  const ip = request ? getClientIP(request) : 'unknown';

  if (error instanceof RateLimitError) {
    logSecurityEvent({
      ip,
      userAgent: request?.headers.get('user-agent') || 'unknown',
      success: false,
      error: error.message,
      rateLimited: true,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        retryAfter: error.retryAfter,
      },
      {
        status: error.statusCode,
        headers: {
          'Retry-After': Math.ceil(error.retryAfter / 1000).toString(),
        },
      }
    );
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        field: error.field,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof AuthorizationError) {
    logSecurityEvent({
      ip,
      userAgent: request?.headers.get('user-agent') || 'unknown',
      success: false,
      error: error.message,
      rateLimited: false,
    });

    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof TrackingError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }

  // Generic error handling
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMessage = isDevelopment
    ? error.message
    : 'Internal server error. Please try again later.';

  return NextResponse.json(
    { success: false, error: errorMessage },
    { status: 500 }
  );
};

/**
 * Extract client IP from request
 */
export const getClientIP = (request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
};

/**
 * Validate request size and content
 */
export const validateRequestSize = (request: Request): void => {
  const contentLength = request.headers.get('content-length');
  const maxSize = 1024 * 1024; // 1MB limit

  if (contentLength && parseInt(contentLength, 10) > maxSize) {
    throw new ValidationError('Request too large');
  }
};

/**
 * Rate limiting check with proper error handling
 */
export const checkRateLimit = (
  rateLimitStore: Map<string, { count: number; resetTime: number }>,
  ip: string,
  config: { requestsPerWindow: number; windowMs: number }
): void => {
  const now = Date.now();

  // Clean expired entries
  const entriesToDelete: string[] = [];
  rateLimitStore.forEach((value, key) => {
    if (now > value.resetTime) {
      entriesToDelete.push(key);
    }
  });
  entriesToDelete.forEach(key => rateLimitStore.delete(key));

  const current = rateLimitStore.get(ip);

  if (!current) {
    // First request from this IP
    rateLimitStore.set(ip, { count: 1, resetTime: now + config.windowMs });
    return;
  }

  if (now > current.resetTime) {
    // Reset window
    rateLimitStore.set(ip, { count: 1, resetTime: now + config.windowMs });
    return;
  }

  if (current.count >= config.requestsPerWindow) {
    const retryAfter = current.resetTime - now;
    throw new RateLimitError(
      `Rate limit exceeded. Maximum ${config.requestsPerWindow} requests per ${Math.floor(config.windowMs / 60000)} minutes.`,
      retryAfter
    );
  }

  // Increment count
  current.count++;
};

/**
 * Sanitize user input to prevent injection attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[;\(\)]/g, '') // Remove SQL injection chars
    .trim();
};

/**
 * Validate order number ownership for customers
 */
export const validateOrderOwnership = async (
  orderId: string,
  userId: string,
  prisma: any
): Promise<boolean> => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
      select: { id: true },
    });

    return !!order;
  } catch (error) {
    console.error('Order ownership validation failed:', error);
    return false;
  }
};

/**
 * Validate guest order access via email/phone
 */
export const validateGuestOrderAccess = async (
  orderNumber: string,
  email?: string,
  phone?: string,
  prisma?: any
): Promise<boolean> => {
  if (!email && !phone) {
    return false;
  }

  try {
    const whereClause: any = { orderNumber };

    if (email) {
      whereClause.guestEmail = email.toLowerCase();
    }

    if (phone) {
      whereClause.guestPhone = phone.replace(/\s/g, '');
    }

    const order = await prisma.order.findFirst({
      where: whereClause,
      select: { id: true },
    });

    return !!order;
  } catch (error) {
    console.error('Guest order access validation failed:', error);
    return false;
  }
};

/**
 * Filter sensitive data from tracking response for guests
 */
export const filterSensitiveTrackingData = (trackingData: any): any => {
  const sensitiveFields = TRACKING_CONFIG.PRIVACY.SENSITIVE_FIELDS;

  // Create a deep copy and remove sensitive fields
  const filtered = JSON.parse(JSON.stringify(trackingData));

  // Remove sensitive fields from tracking events
  if (filtered.trackingEvents) {
    filtered.trackingEvents = filtered.trackingEvents.map((event: any) => {
      const filteredEvent = { ...event };

      // Remove detailed location information
      if (filteredEvent.location && filteredEvent.location.includes('Street')) {
        filteredEvent.location = 'Processing facility';
      }

      // Keep only basic event information
      return {
        eventName: filteredEvent.eventName,
        timestamp: filteredEvent.timestamp,
      };
    });
  }

  // Remove internal IDs and detailed information
  delete filtered.internalId;
  delete filtered.courierTrackingId;
  delete filtered.serviceType;
  delete filtered.cost;

  return filtered;
};

/**
 * Create user-friendly error messages
 */
export const getUserFriendlyErrorMessage = (error: Error): string => {
  if (error instanceof RateLimitError) {
    return `Too many requests. Please wait ${Math.ceil(error.retryAfter / 60000)} minutes before trying again.`;
  }

  if (error instanceof ValidationError) {
    return error.message;
  }

  if (error instanceof AuthorizationError) {
    return 'Access denied. Please check your credentials.';
  }

  if (error.message.includes('network') || error.message.includes('timeout')) {
    return 'Network error. Please check your connection and try again.';
  }

  if (error.message.includes('not found')) {
    return 'Order not found. Please check your order number and details.';
  }

  return 'Something went wrong. Please try again later.';
};

/**
 * Monitor tracking API performance
 */
export const trackAPIPerformance = (
  endpoint: string,
  startTime: number,
  success: boolean,
  error?: Error
): void => {
  const duration = Date.now() - startTime;

  const metric = {
    endpoint,
    duration,
    success,
    error: error?.message,
    timestamp: new Date().toISOString(),
  };

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    console.log('API_PERFORMANCE:', JSON.stringify(metric));
  }

  // Alert on slow requests
  if (duration > TRACKING_CONFIG.PERFORMANCE.REQUEST_TIMEOUT_MS / 2) {
    console.warn(`Slow API request detected: ${endpoint} took ${duration}ms`);
  }
};
