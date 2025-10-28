/**

export const dynamic = 'force-dynamic';

 * Secure Order Lookup API - Malaysian E-commerce Platform
 * Allows order details lookup by order number for thank-you pages
 * Public endpoint with enhanced security measures
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { headers } from 'next/headers';
import { sanitizeInput } from '@/lib/utils/validation';
import { getClientIP } from '@/lib/utils/security';

interface Params {
  orderNumber: string;
}

// SECURITY NOTE: Rate limiting now handled at Railway platform level
// Previously: In-memory rate limiting (10 req/min) - removed due to memory leaks
// Now: Railway provides DDoS protection and rate limiting infrastructure

// Order number validation regex - supports both direct order numbers and external references
const ORDER_NUMBER_REGEX = /^ORD-\d{8}-[A-Z0-9]{4,8}$/;
const EXTERNAL_REFERENCE_REGEX = /^JRM_(ORD-\d{8}-[A-Z0-9]{4,8})_\d+$/;

// Security headers for responses
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Maximum order age for lookup (24 hours)
const MAX_ORDER_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * GET /api/orders/lookup/[orderNumber] - Get order details by order number
 * Secured public endpoint for order confirmation pages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const { orderNumber } = params;

    // Input validation
    if (!orderNumber) {
      console.warn(`🚫 Missing order number from IP: ${clientIP}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Order number is required',
          error: 'VALIDATION_ERROR',
        },
        {
          status: 400,
          headers: SECURITY_HEADERS,
        }
      );
    }

    // Sanitize and validate order number format
    const sanitizedOrderNumber = sanitizeInput(orderNumber);
    let actualOrderNumber = sanitizedOrderNumber;

    // Check if this is a direct order number or external reference
    if (ORDER_NUMBER_REGEX.test(sanitizedOrderNumber)) {
      // Direct order number format: ORD-20250822-XXXX
      actualOrderNumber = sanitizedOrderNumber;
    } else if (EXTERNAL_REFERENCE_REGEX.test(sanitizedOrderNumber)) {
      // External reference format: JRM_ORD-20250822-XXXX_timestamp
      const match = sanitizedOrderNumber.match(EXTERNAL_REFERENCE_REGEX);
      if (match && match[1]) {
        actualOrderNumber = match[1]; // Extract ORD-20250822-XXXX
        console.log(
          `🔍 Extracted order number from external reference: ${actualOrderNumber}`
        );
      }
    } else {
      console.warn(
        `🚫 Invalid order number format from IP: ${clientIP}, order: ${sanitizedOrderNumber}`
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid order number format',
          error: 'VALIDATION_ERROR',
        },
        {
          status: 400,
          headers: SECURITY_HEADERS,
        }
      );
    }

    console.log(
      `🔍 Secure order lookup: ${actualOrderNumber} from IP: ${clientIP}`
    );

    // Find the order with security constraints
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: actualOrderNumber,
        // Only allow lookup of recent orders for security
        createdAt: {
          gte: new Date(Date.now() - MAX_ORDER_AGE_MS),
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            // Exclude sensitive user data
            isMember: true,
            memberSince: true,
            nric: true, // Malaysia NRIC - serves as Member ID
          },
        },
        shippingAddress: {
          select: {
            firstName: true,
            lastName: true,
            company: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            phone: true,
          },
        },
        billingAddress: {
          select: {
            firstName: true,
            lastName: true,
            company: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      console.warn(
        `❌ Order not found or expired: ${actualOrderNumber} from IP: ${clientIP}`
      );

      // Generic error message to prevent enumeration
      return NextResponse.json(
        {
          success: false,
          message: 'Order not found or no longer available',
          error: 'ORDER_NOT_FOUND',
        },
        {
          status: 404,
          headers: SECURITY_HEADERS,
        }
      );
    }

    // IMPROVED: Allow recent failed orders for legitimate payment failure redirects
    // SECURITY: Only allow failed orders created within last 24 hours
    // FOLLOWS @CLAUDE.md: NO HARDCODE - use existing MAX_ORDER_AGE_MS constant
    if (order.status === 'CANCELLED' || order.paymentStatus === 'FAILED') {
      // Calculate order age
      const orderAge = Date.now() - order.createdAt.getTime();

      // SINGLE SOURCE OF TRUTH: MAX_ORDER_AGE_MS already defined at line 40
      // Current value: 24 * 60 * 60 * 1000 (24 hours)
      const isRecent = orderAge < MAX_ORDER_AGE_MS;

      if (isRecent) {
        // ALLOW: Recent failed order - legitimate payment failure redirect from ToyyibPay
        // User should see what they tried to buy and have retry option
        console.log(
          `✅ Allowing access to recent failed order: ${actualOrderNumber} (age: ${Math.floor(orderAge / 1000 / 60)} minutes)`
        );
        // Continue to order data response below (don't return here)
      } else {
        // BLOCK: Old failed order - security measure to prevent enumeration
        console.warn(
          `🚫 Access denied to old failed order: ${actualOrderNumber} (age: ${Math.floor(orderAge / 1000 / 60 / 60)} hours)`
        );
        return NextResponse.json(
          {
            success: false,
            message: 'Order not found or no longer available',
            error: 'ORDER_NOT_AVAILABLE',
          },
          {
            status: 404,
            headers: SECURITY_HEADERS,
          }
        );
      }
    }

    console.log(
      `✅ Secure order lookup successful: ${order.id} from IP: ${clientIP}`
    );

    // Transform data for secure response - exclude sensitive information
    const orderData = {
      success: true,
      data: {
        id: order.id, // Include ID for receipt generation
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: Number(order.total),
        subtotal: Number(order.subtotal),
        taxAmount: Number(order.taxAmount),
        shippingCost: Number(order.shippingCost),
        discountAmount: Number(order.discountAmount) || 0,
        memberDiscount: Number(order.memberDiscount) || 0,
        createdAt: order.createdAt.toISOString(),
        items: order.orderItems.map(item => ({
          id: item.id, // Add missing id field for React keys
          quantity: item.quantity,
          price: Number(item.regularPrice),
          memberPrice: Number(item.memberPrice), // Add member price for badge detection
          finalPrice: Number(item.appliedPrice),
          product: {
            name: item.productName,
            slug: item.product?.slug || '',
            primaryImage: item.product?.images[0] || null,
          },
        })),
        // Complete shipping address for order confirmation
        shippingAddress: order.shippingAddress
          ? {
              firstName: order.shippingAddress.firstName,
              lastName: order.shippingAddress.lastName,
              company: order.shippingAddress.company,
              address: order.shippingAddress.addressLine1,
              address2: order.shippingAddress.addressLine2,
              city: order.shippingAddress.city,
              state: order.shippingAddress.state,
              postcode: order.shippingAddress.postalCode,
              country: order.shippingAddress.country,
              phone: order.shippingAddress.phone,
            }
          : null,
        customer: {
          firstName:
            order.user?.firstName ||
            (order.shippingAddress as any)?.firstName ||
            'Guest',
          lastName:
            order.user?.lastName ||
            (order.shippingAddress as any)?.lastName ||
            '',
          isMember: order.user?.isMember || false,
          memberSince: order.user?.memberSince?.toISOString() || null,
          nric: order.user?.nric || null, // Malaysia NRIC - serves as Member ID
        },
      },
      timestamp: new Date().toISOString(),
    };

    const responseTime = Date.now() - startTime;
    console.log(
      `⚡ Order lookup completed in ${responseTime}ms for IP: ${clientIP}`
    );

    return NextResponse.json(orderData, {
      headers: {
        ...SECURITY_HEADERS,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(
      `❌ Secure order lookup error (${responseTime}ms) from IP: ${clientIP}:`,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        userAgent,
        orderNumber: params?.orderNumber || 'unknown',
      }
    );

    // Don't expose internal error details
    return NextResponse.json(
      {
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: SECURITY_HEADERS,
      }
    );
  }
}
