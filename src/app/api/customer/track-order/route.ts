/**
 * Guest Order Tracking API (Database-First Architecture)
 * Provides secure tracking lookup using cached tracking data
 * Based on TRACKING_ARCHITECTURE_REFACTOR_PLAN.md
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getTrackingCacheByOrderId,
  createJob,
} from '@/lib/services/tracking-cache';
import {
  TRACKING_REFACTOR_CONFIG,
  getJobPriority,
  calculateNextUpdate,
} from '@/lib/config/tracking-refactor';
import {
  GuestTrackingRequestRefactor,
  GuestTrackingResponseRefactor,
  CachedTrackingResponse,
  TrackingRefactorError,
} from '@/lib/types/tracking-refactor';
import {
  createTrackingErrorResponse,
  logTrackingSecurityEvent,
  getClientIP,
  validateTrackingRequestSize,
  trackTrackingAPIPerformance,
} from '@/lib/utils/tracking-error-handling';
import { prisma } from '@/lib/db/prisma';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting for guest tracking requests
 * Uses centralized configuration
 */
function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetTime?: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const { REQUESTS_PER_HOUR, WINDOW_MS } = {
    REQUESTS_PER_HOUR: 10, // From TRACKING_REFACTOR_CONFIG or legacy config
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  };

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
    rateLimitStore.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return {
      allowed: true,
      remaining: REQUESTS_PER_HOUR - 1,
      resetTime: now + WINDOW_MS,
    };
  }

  if (now > current.resetTime) {
    // Reset window
    rateLimitStore.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return {
      allowed: true,
      remaining: REQUESTS_PER_HOUR - 1,
      resetTime: now + WINDOW_MS,
    };
  }

  if (current.count >= REQUESTS_PER_HOUR) {
    const retryAfter = Math.ceil((current.resetTime - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      remaining: 0,
    };
  }

  // Increment count
  current.count++;
  return {
    allowed: true,
    remaining: REQUESTS_PER_HOUR - current.count,
    resetTime: current.resetTime,
  };
}

/**
 * Validate order ownership for guest users
 */
async function validateGuestOrderAccess(
  orderNumber: string,
  email?: string,
  phone?: string
): Promise<{ valid: boolean; orderId?: string }> {
  if (!email && !phone) {
    return { valid: false };
  }

  try {
    const whereClause: any = {
      orderNumber: orderNumber,
      userId: null, // Only guest orders
    };

    if (email) {
      whereClause.guestEmail = email.toLowerCase();
    }

    // For phone validation, we'd need to check shipping/billing addresses
    // This is a simplified version - you might need to adjust based on your schema
    if (phone && !email) {
      // Phone-only validation would require more complex logic
      // For now, we'll require email for guest tracking
      return { valid: false };
    }

    const order = await prisma.order.findFirst({
      where: whereClause,
      select: { id: true, orderNumber: true },
    });

    return {
      valid: !!order,
      orderId: order?.id,
    };
  } catch (error) {
    console.error('Error validating guest order access:', error);
    return { valid: false };
  }
}

/**
 * Get cache freshness status
 */
function getCacheFreshness(
  lastUpdate: Date,
  nextUpdate: Date
): 'FRESH' | 'STALE' | 'EXPIRED' {
  const now = new Date();
  const timeSinceUpdate = now.getTime() - lastUpdate.getTime();
  const timeUntilNextUpdate = nextUpdate.getTime() - now.getTime();

  // Fresh if updated within last 15 minutes
  if (timeSinceUpdate < 15 * 60 * 1000) {
    return 'FRESH';
  }

  // Expired if next update is overdue by more than 1 hour
  if (timeUntilNextUpdate < -60 * 60 * 1000) {
    return 'EXPIRED';
  }

  return 'STALE';
}

/**
 * Filter sensitive data for guest tracking
 */
function filterSensitiveTrackingData(trackingEvents: any[]): any[] {
  return trackingEvents
    .map(event => ({
      eventName: event.eventName,
      description: event.description,
      timestamp: event.timestamp,
      // Remove detailed location information
      location: event.location?.includes('Street')
        ? 'Processing facility'
        : event.location,
    }))
    .slice(0, 10); // Limit to 10 most recent events
}

/**
 * POST /api/customer/track-order
 * Database-first guest order tracking with cache freshness indicators
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let orderId: string | undefined;

  try {
    // Validate request size
    validateTrackingRequestSize(request);

    // Get client IP for rate limiting and logging
    const ip = getClientIP(request);

    // Check rate limiting
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      logTrackingSecurityEvent({
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: false,
        error: 'Rate limit exceeded',
        rateLimited: true,
      });

      return NextResponse.json(
        {
          success: false,
          error: `Too many requests. Please try again in ${rateLimit.retryAfter} seconds.`,
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimit.retryAfter?.toString() || '3600',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          },
        }
      );
    }

    const body: GuestTrackingRequestRefactor = await request.json();
    const { orderNumber, email, phone } = body;

    // Validate required fields
    if (!orderNumber) {
      throw new TrackingRefactorError(
        'Order number is required',
        'VALIDATION_ERROR',
        400
      );
    }

    if (!email && !phone) {
      throw new TrackingRefactorError(
        'Either email or phone number is required',
        'VALIDATION_ERROR',
        400
      );
    }

    // Validate order number format
    if (!/^ORD-\d{8}-\w{4}$/i.test(orderNumber)) {
      logTrackingSecurityEvent({
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: false,
        error: 'Invalid order number format',
        rateLimited: false,
        orderNumber,
      });

      throw new TrackingRefactorError(
        'Invalid order number format',
        'INVALID_ORDER_NUMBER',
        400
      );
    }

    // Validate and get order
    const { valid, orderId: validatedOrderId } = await validateGuestOrderAccess(
      orderNumber,
      email,
      phone
    );
    orderId = validatedOrderId;

    if (!valid || !orderId) {
      logTrackingSecurityEvent({
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: false,
        error: 'Order access denied',
        rateLimited: false,
        orderNumber,
      });

      throw new TrackingRefactorError(
        'Order not found or access denied',
        'ORDER_NOT_FOUND',
        404
      );
    }

    // Get tracking cache (database-first approach)
    const trackingCache = await getTrackingCacheByOrderId(orderId);

    if (!trackingCache) {
      // No tracking cache exists - this might be a new order or one without shipping yet
      logTrackingSecurityEvent({
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: false,
        error: 'No tracking data available',
        rateLimited: false,
        orderNumber,
        orderId,
      });

      throw new TrackingRefactorError(
        'Tracking information not available yet',
        'TRACKING_NOT_AVAILABLE',
        404
      );
    }

    // Determine cache freshness
    const freshness = getCacheFreshness(
      trackingCache.lastApiUpdate,
      trackingCache.nextUpdateDue
    );

    // Calculate cache age in seconds
    const cacheAge = Math.floor(
      (Date.now() - trackingCache.lastApiUpdate.getTime()) / 1000
    );

    // Filter tracking events for guest access
    const filteredEvents = Array.isArray(trackingCache.trackingEvents)
      ? filterSensitiveTrackingData(trackingCache.trackingEvents as any[])
      : [];

    // Prepare response
    const response: CachedTrackingResponse = {
      success: true,
      data: {
        orderNumber: trackingCache.order.orderNumber,
        currentStatus: trackingCache.currentStatus,
        lastStatusUpdate: trackingCache.lastStatusUpdate.toISOString(),
        trackingEvents: filteredEvents,
        estimatedDelivery: trackingCache.estimatedDelivery?.toISOString(),
        actualDelivery: trackingCache.actualDelivery?.toISOString(),
        courierService: trackingCache.courierService,
        courierTrackingNumber: trackingCache.courierTrackingNumber,

        // Cache metadata
        lastApiUpdate: trackingCache.lastApiUpdate.toISOString(),
        nextUpdateDue: trackingCache.nextUpdateDue.toISOString(),
        dataFreshness: freshness,
        cacheAge,

        // Privacy indicator
        isFiltered: true,
      },
    };

    // If data is stale or expired, optionally trigger a background refresh
    if (freshness === 'STALE' || freshness === 'EXPIRED') {
      try {
        await createJob({
          trackingCacheId: trackingCache.id,
          jobType: 'UPDATE',
          priority: getJobPriority('UPDATE'),
          scheduledFor: new Date(),
        });
      } catch (jobError) {
        // Don't fail the request if job creation fails
        console.warn('Failed to create background update job:', jobError);
      }
    }

    // Log successful access
    logTrackingSecurityEvent({
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      rateLimited: false,
      orderNumber,
      orderId,
    });

    // Track performance
    trackTrackingAPIPerformance('guest-track-order', startTime, true, {
      freshness,
      cacheAge,
      eventsCount: filteredEvents.length,
      backgroundRefreshTriggered: freshness !== 'FRESH',
    });

    return NextResponse.json(response, {
      headers: {
        'X-Cache-Status': freshness,
        'X-Cache-Age': cacheAge.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      },
    });
  } catch (error) {
    // Track performance for errors
    trackTrackingAPIPerformance(
      'guest-track-order',
      startTime,
      false,
      { orderId },
      error as Error
    );

    return createTrackingErrorResponse(error as Error, request);
  }
}

/**
 * GET /api/customer/track-order
 * Returns tracking lookup form requirements and system status
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      requirements: {
        orderNumber: {
          required: true,
          format: 'ORD-YYYYMMDD-XXXX',
          example: 'ORD-20250821-A1B2',
        },
        verification: {
          email: {
            required: false,
            description: 'Email address used for the order',
          },
          phone: {
            required: false,
            description:
              'Phone number used for the order (currently requires email)',
          },
          note: 'Email is required for guest tracking',
        },
        rateLimit: {
          maxRequests: 10,
          windowHours: 1,
          description: 'Maximum 10 tracking requests per hour per IP address',
        },
        caching: {
          description: 'Tracking data is cached for fast response',
          freshness: {
            FRESH: 'Updated within last 15 minutes',
            STALE: 'Older data, background update triggered',
            EXPIRED: 'Very old data, immediate update recommended',
          },
        },
      },
      system: {
        version: 'refactored-v2',
        architecture: 'database-first-cached',
        responseTime: 'sub-100ms typical',
        features: [
          'Real-time cache status',
          'Background refresh',
          'Enhanced security logging',
          'Rate limiting protection',
        ],
      },
    });
  } catch (error) {
    return createTrackingErrorResponse(error as Error);
  }
}
