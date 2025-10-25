/**
 * Retry Payment API Endpoint
 * Creates new order from failed order and generates new payment link
 * FOLLOWS @CLAUDE.md: DRY | NO HARDCODE | SINGLE SOURCE OF TRUTH
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { toyyibPayService } from '@/lib/payments/toyyibpay-service';
import { getClientIP } from '@/lib/utils/security';
import { rateLimit } from '@/lib/utils/rate-limit';

// SECURITY: Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// SINGLE SOURCE OF TRUTH: Retry window constant
const MAX_RETRY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

interface RetryPaymentRequest {
  failedOrderNumber: string;
}

interface RetryPaymentResponse {
  success: boolean;
  newOrderNumber?: string;
  paymentUrl?: string;
  error?: string;
  unavailableItems?: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse<RetryPaymentResponse>> {
  const clientIP = getClientIP(request);
  const startTime = Date.now();

  try {
    // SECURITY: Rate limiting (5 retries per minute per IP)
    try {
      await limiter.check(5, clientIP);
    } catch {
      console.warn(`🚫 Rate limit exceeded for retry payment from IP: ${clientIP}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Too many retry attempts. Please wait a moment.',
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body: RetryPaymentRequest = await request.json();
    const { failedOrderNumber } = body;

    // Input validation
    if (!failedOrderNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order number is required',
        },
        { status: 400 }
      );
    }

    console.log(`🔄 Retry payment request for order: ${failedOrderNumber} from IP: ${clientIP}`);

    // SINGLE SOURCE OF TRUTH: Fetch failed order with all relationships
    const failedOrder = await prisma.order.findUnique({
      where: { orderNumber: failedOrderNumber },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                stockQuantity: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isMember: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    // Validation: Order exists
    if (!failedOrder) {
      console.warn(`❌ Order not found: ${failedOrderNumber}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    // Validation: Order is actually failed/cancelled
    if (failedOrder.status !== 'CANCELLED' || failedOrder.paymentStatus !== 'FAILED') {
      console.warn(
        `❌ Order is not failed: ${failedOrderNumber} (status: ${failedOrder.status}, payment: ${failedOrder.paymentStatus})`
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Order is not eligible for retry',
        },
        { status: 400 }
      );
    }

    // SECURITY: Check retry window (24 hours)
    const orderAge = Date.now() - failedOrder.createdAt.getTime();
    if (orderAge > MAX_RETRY_WINDOW_MS) {
      console.warn(
        `❌ Order too old for retry: ${failedOrderNumber} (age: ${Math.floor(orderAge / 1000 / 60 / 60)} hours)`
      );
      return NextResponse.json(
        {
          success: false,
          error: 'This order is no longer available for retry. Please place a new order.',
        },
        { status: 400 }
      );
    }

    // CRITICAL: Check stock availability for ALL items
    const unavailableItems: string[] = [];
    for (const item of failedOrder.orderItems) {
      const product = item.product;

      if (!product) {
        console.error(`❌ Product not found for order item: ${item.id}`);
        unavailableItems.push(item.productName);
        continue;
      }

      if (product.stockQuantity < item.quantity) {
        console.warn(
          `❌ Insufficient stock for ${product.name}: need ${item.quantity}, have ${product.stockQuantity}`
        );
        unavailableItems.push(product.name);
      }
    }

    // Return stock unavailability error
    if (unavailableItems.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'OUT_OF_STOCK',
          unavailableItems,
        },
        { status: 400 }
      );
    }

    // DRY: Create NEW order (fresh order number, fresh stock deduction)
    // FOLLOWS @CLAUDE.md: Clean separation - old order stays CANCELLED, new order is PENDING
    const newOrder = await prisma.order.create({
      data: {
        // Generate new order number
        orderNumber: `ORD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,

        // Link to user if exists
        userId: failedOrder.userId,

        // Copy order details from failed order
        subtotal: failedOrder.subtotal,
        discountAmount: failedOrder.discountAmount,
        memberDiscount: failedOrder.memberDiscount,
        taxAmount: failedOrder.taxAmount,
        shippingCost: failedOrder.shippingCost,
        total: failedOrder.total,

        // Initial status
        status: 'PENDING',
        paymentStatus: 'PENDING',

        // Copy membership flags
        wasEligibleForMembership: failedOrder.wasEligibleForMembership,

        // Copy addresses
        shippingAddress: failedOrder.shippingAddress
          ? {
              create: {
                firstName: failedOrder.shippingAddress.firstName,
                lastName: failedOrder.shippingAddress.lastName,
                company: failedOrder.shippingAddress.company,
                addressLine1: failedOrder.shippingAddress.addressLine1,
                addressLine2: failedOrder.shippingAddress.addressLine2,
                city: failedOrder.shippingAddress.city,
                state: failedOrder.shippingAddress.state,
                postalCode: failedOrder.shippingAddress.postalCode,
                country: failedOrder.shippingAddress.country,
                phone: failedOrder.shippingAddress.phone,
              },
            }
          : undefined,

        billingAddress: failedOrder.billingAddress
          ? {
              create: {
                firstName: failedOrder.billingAddress.firstName,
                lastName: failedOrder.billingAddress.lastName,
                company: failedOrder.billingAddress.company,
                addressLine1: failedOrder.billingAddress.addressLine1,
                addressLine2: failedOrder.billingAddress.addressLine2,
                city: failedOrder.billingAddress.city,
                state: failedOrder.billingAddress.state,
                postalCode: failedOrder.billingAddress.postalCode,
                country: failedOrder.billingAddress.country,
                phone: failedOrder.billingAddress.phone,
                email: failedOrder.billingAddress.email,
              },
            }
          : undefined,

        // Copy order items (this will trigger stock deduction)
        orderItems: {
          create: failedOrder.orderItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            regularPrice: item.regularPrice,
            memberPrice: item.memberPrice,
            appliedPrice: item.appliedPrice,
          })),
        },
      },
    });

    // Deduct stock for new order
    for (const item of failedOrder.orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    console.log(`✅ New order created: ${newOrder.orderNumber} (retry of ${failedOrderNumber})`);

    // SINGLE SOURCE OF TRUTH: Create payment bill using toyyibPay service
    const paymentResult = await toyyibPayService.createBill({
      billName: `Order ${newOrder.orderNumber}`,
      billDescription: `Payment for order ${newOrder.orderNumber}`,
      billAmount: Number(newOrder.total),
      billTo: failedOrder.user?.firstName
        ? `${failedOrder.user.firstName} ${failedOrder.user.lastName}`
        : failedOrder.shippingAddress?.firstName
          ? `${failedOrder.shippingAddress.firstName} ${failedOrder.shippingAddress.lastName}`
          : 'Guest',
      billEmail: failedOrder.user?.email || failedOrder.billingAddress?.email || 'guest@example.com',
      billPhone: failedOrder.shippingAddress?.phone || '',
      externalReferenceNo: newOrder.orderNumber,
      paymentChannel: '2', // Both FPX and Credit Card
    });

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      // Rollback: Cancel new order and restore stock
      await prisma.order.update({
        where: { id: newOrder.id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
        },
      });

      for (const item of failedOrder.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              increment: item.quantity,
            },
          },
        });
      }

      console.error(`❌ Payment bill creation failed for ${newOrder.orderNumber}:`, paymentResult.error);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create payment link. Please try again or contact support.',
        },
        { status: 500 }
      );
    }

    // Update order with ToyyibPay bill code
    await prisma.order.update({
      where: { id: newOrder.id },
      data: {
        toyyibpayBillCode: paymentResult.billCode,
      },
    });

    // Create audit log
    if (failedOrder.user) {
      await prisma.auditLog.create({
        data: {
          userId: failedOrder.user.id,
          action: 'PAYMENT_RETRY',
          resource: 'ORDER',
          resourceId: newOrder.id,
          details: {
            originalOrder: failedOrderNumber,
            newOrder: newOrder.orderNumber,
            amount: Number(newOrder.total),
            billCode: paymentResult.billCode,
          },
          ipAddress: clientIP,
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
    }

    const responseTime = Date.now() - startTime;
    console.log(
      `✅ Payment retry successful in ${responseTime}ms: ${failedOrderNumber} → ${newOrder.orderNumber}`
    );

    return NextResponse.json({
      success: true,
      newOrderNumber: newOrder.orderNumber,
      paymentUrl: paymentResult.paymentUrl,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Retry payment error (${responseTime}ms) from IP: ${clientIP}:`, error);

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while processing your request. Please try again.',
      },
      { status: 500 }
    );
  }
}
