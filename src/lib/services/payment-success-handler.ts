/**
 * Payment Success Handler - Centralized Payment Success Logic
 * Malaysian E-commerce Platform
 *
 * SINGLE SOURCE OF TRUTH for all payment success handling
 * CENTRALIZED: All payment gateways (ToyyibPay, Billplz, Stripe, etc.) use this service
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | TYPE SAFETY | CENTRALIZED
 */

import { prisma } from '@/lib/db/prisma';
import { OrderStatusHandler } from '@/lib/notifications/order-status-handler';
import { OrderStatus, PaymentStatus } from '@prisma/client';

/**
 * TYPE SAFETY: Explicit types for payment gateways (no hardcoding)
 */
export type PaymentGateway = 'toyyibpay' | 'billplz' | 'stripe' | 'manual';

/**
 * TYPE SAFETY: Parameters for payment success handling
 */
export interface PaymentSuccessParams {
  orderReference: string;
  amount: number;
  transactionId: string;
  paymentGateway: PaymentGateway;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * TYPE SAFETY: Return type for payment success handling
 */
export interface PaymentSuccessResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
}

/**
 * CENTRALIZED: Payment Success Handler Service
 * DRY: Single implementation used by all payment gateways
 */
export class PaymentSuccessHandler {
  /**
   * SINGLE SOURCE OF TRUTH: Main handler for payment success
   * Called by all payment gateway webhooks
   *
   * @param params - Payment success parameters
   * @returns Result of payment success handling
   */
  static async handle(
    params: PaymentSuccessParams
  ): Promise<PaymentSuccessResult> {
    console.log('💰 Processing payment success:', {
      gateway: params.paymentGateway,
      orderReference: params.orderReference,
      transactionId: params.transactionId,
    });

    try {
      // Find order
      const order = await prisma.order.findFirst({
        where: { orderNumber: params.orderReference },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
          user: true,
          shippingAddress: true,
          billingAddress: true,
        },
      });

      if (!order) {
        console.error('❌ Order not found:', params.orderReference);
        return {
          success: false,
          error: `Order not found: ${params.orderReference}`,
        };
      }

      // Check if already processed (idempotency check)
      if (order.paymentStatus === 'PAID') {
        console.log('✅ Order already processed (idempotent):', order.orderNumber);
        return {
          success: true,
          orderId: order.id,
          orderNumber: order.orderNumber,
        };
      }

      // Store previous statuses for change tracking
      const previousStatus = order.status;
      const previousPaymentStatus = order.paymentStatus;

      // SINGLE SOURCE OF TRUTH: Update order status in database
      // This is the ONLY place where payment success updates the order
      console.log('💾 Updating order status to PAID:', order.orderNumber);
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID' as OrderStatus,
          paymentStatus: 'PAID' as PaymentStatus,
          paymentId: params.transactionId,
          updatedAt: new Date(),
        },
      });

      // Trigger OrderStatusHandler to handle notifications and business logic
      // This will:
      // - Send Telegram notification for new order
      // - Send email confirmation to customer
      // - Handle membership activation
      // - Create audit logs
      await OrderStatusHandler.handleOrderStatusChange({
        orderId: order.id,
        previousStatus,
        newStatus: 'PAID' as OrderStatus,
        previousPaymentStatus,
        newPaymentStatus: 'PAID' as PaymentStatus,
        triggeredBy: `${params.paymentGateway}-webhook`,
        metadata: {
          transactionId: params.transactionId,
          amount: params.amount,
          paymentGateway: params.paymentGateway,
          timestamp: params.timestamp,
          ...params.metadata,
        },
      });

      console.log('✅ Payment success handled for order:', order.orderNumber);

      return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
      };
    } catch (error) {
      console.error('❌ Failed to handle payment success:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
