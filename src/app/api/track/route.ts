/**
 * Track Order API Endpoint
 *
 * Single endpoint for order tracking lookup
 * Following @CLAUDE.md: Type Safety, Error Handling, No Raw SQL
 *
 * POST /api/track
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import {
  RATE_LIMIT_CONFIG,
  ORDER_NUMBER_PATTERN,
  TRACKING_MESSAGES,
  TRACKING_INPUT_VALIDATION,
} from '@/lib/config/tracking-simple';

// In-memory rate limiting store
// TODO: Replace with Redis for production multi-instance deployment
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Input validation schema
 */
const trackingInputSchema = z.object({
  trackingInput: z
    .string()
    .min(TRACKING_INPUT_VALIDATION.MIN_LENGTH)
    .max(TRACKING_INPUT_VALIDATION.MAX_LENGTH),
});

/**
 * Get client IP address for rate limiting
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Check rate limit for IP address
 */
function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
} {
  const now = Date.now();

  // Clean up expired entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }

  const current = rateLimitStore.get(ip);

  if (!current) {
    // First request
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS - 1,
    };
  }

  if (now > current.resetTime) {
    // Reset window
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS - 1,
    };
  }

  if (current.count >= RATE_LIMIT_CONFIG.MAX_REQUESTS) {
    // Rate limited
    const retryAfter = Math.ceil((current.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
    };
  }

  // Increment count
  current.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS - current.count,
  };
}

/**
 * Normalize order number input
 * Handles: ORD-20250821-A1B2, ord-20250821-a1b2, ORD20250821A1B2, ord20250821a1b2
 */
function normalizeOrderNumber(input: string): string | null {
  // Remove all non-alphanumeric characters and uppercase
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Check if it matches order number pattern (ORD + 8 digits + 4 chars)
  if (cleaned.startsWith('ORD') && cleaned.length === 15) {
    // Format: ORD-YYYYMMDD-XXXX
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 11)}-${cleaned.slice(11)}`;
  }

  return null;
}

/**
 * POST /api/track
 * Track order by order number or tracking number
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip = getClientIP(request);

    // Check rate limit
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
      const minutes = Math.ceil((rateLimit.retryAfter || 0) / 60);
      return NextResponse.json(
        {
          success: false,
          error: TRACKING_MESSAGES.RATE_LIMITED.replace(
            '{minutes}',
            minutes.toString()
          ),
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const validation = trackingInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
        },
        { status: 400 }
      );
    }

    const { trackingInput } = validation.data;

    // Try to normalize as order number
    const normalizedOrderNumber = normalizeOrderNumber(trackingInput);

    // Query database
    // If normalized order number exists, search by that
    // Otherwise, search by tracking number (case-insensitive)
    const order = await prisma.order.findFirst({
      where: normalizedOrderNumber
        ? { orderNumber: normalizedOrderNumber }
        : {
            trackingNumber: {
              equals: trackingInput,
              mode: 'insensitive',
            },
          },
      select: {
        orderNumber: true,
        status: true,
        courierName: true,
        trackingNumber: true,
        trackingUrl: true,
      },
    });

    // Order not found
    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: TRACKING_MESSAGES.ORDER_NOT_FOUND,
        },
        { status: 404 }
      );
    }

    // Return order data
    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        courierName: order.courierName,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
      },
    });
  } catch (error) {
    console.error('Track API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while tracking your order. Please try again.',
      },
      { status: 500 }
    );
  }
}
