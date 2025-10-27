/**
 * Order Status Change Handler - Malaysian E-commerce Platform
 * Handles all order status changes and triggers appropriate notifications
 * Works with ANY payment method - not tied to specific payment gateways
 */

import { prisma } from '@/lib/db/prisma';
import { simplifiedTelegramService } from '@/lib/telegram/simplified-telegram-service';
import { emailService } from '@/lib/email/email-service';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { activateUserMembership } from '@/lib/membership';
import { maskNRIC } from '@/lib/validation/nric';

interface OrderStatusChangeData {
  orderId: string;
  previousStatus?: OrderStatus;
  newStatus: OrderStatus;
  previousPaymentStatus?: PaymentStatus;
  newPaymentStatus: PaymentStatus;
  triggeredBy: string; // webhook, admin, system, etc.
  metadata?: Record<string, any>;
}

export class OrderStatusHandler {
  /**
   * Main handler for order status changes
   */
  static async handleOrderStatusChange(data: OrderStatusChangeData) {
    console.log('🔄 Order status change:', {
      orderId: data.orderId,
      statusChange: `${data.previousStatus} → ${data.newStatus}`,
      paymentStatusChange: `${data.previousPaymentStatus} → ${data.newPaymentStatus}`,
      triggeredBy: data.triggeredBy,
    });

    // Get full order details
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        user: true,
        pendingMembership: true,
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
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      console.error('❌ Order not found:', data.orderId);
      return false;
    }

    // Handle payment status changes
    if (
      data.newPaymentStatus === 'PAID' &&
      data.previousPaymentStatus !== 'PAID'
    ) {
      await this.handlePaymentSuccess(order, data);
    }

    // Handle order status changes
    switch (data.newStatus) {
      case 'CONFIRMED':
        if (data.previousStatus !== 'CONFIRMED') {
          await this.handleOrderConfirmed(order, data);
        }
        break;
      case 'PROCESSING':
        await this.handleOrderProcessing(order, data);
        break;
      case 'SHIPPED':
        await this.handleOrderShipped(order, data);
        break;
      case 'DELIVERED':
        await this.handleOrderDelivered(order, data);
        break;
      case 'CANCELLED':
        await this.handleOrderCancelled(order, data);
        break;
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: order.userId,
        action: 'ORDER_STATUS_CHANGE',
        resource: 'ORDER',
        resourceId: order.id,
        details: {
          orderNumber: order.orderNumber,
          previousStatus: data.previousStatus,
          newStatus: data.newStatus,
          previousPaymentStatus: data.previousPaymentStatus,
          newPaymentStatus: data.newPaymentStatus,
          triggeredBy: data.triggeredBy,
          metadata: data.metadata,
        },
        ipAddress: 'system',
        userAgent: data.triggeredBy,
      },
    });

    return true;
  }

  /**
   * Handle successful payment - MAIN TELEGRAM NOTIFICATION TRIGGER
   */
  private static async handlePaymentSuccess(
    order: any,
    data: OrderStatusChangeData
  ) {
    console.log('💰 Payment success detected for order:', order.orderNumber);

    // ✅ STEP 1: Activate membership (if applicable)
    if (order.pendingMembership && order.user && !order.user.isMember) {
      try {
        const pending = order.pendingMembership;
        const nric = pending.registrationData?.nric;

        console.log('🎯 Activating membership for user:', order.user.id);
        console.log('📋 Qualifying amount:', Number(pending.qualifyingAmount));
        console.log('🆔 NRIC:', nric ? maskNRIC(nric) : 'N/A');

        const activated = await activateUserMembership(
          order.user.id,
          Number(pending.qualifyingAmount),
          order.id,
          nric
        );

        if (activated) {
          await prisma.pendingMembership.delete({
            where: { id: pending.id },
          });
          console.log('✅ Membership activated and pending record deleted');
        } else {
          console.error('❌ Failed to activate membership');
        }
      } catch (error) {
        console.error('❌ Error during membership activation:', error);
      }
    }

    // ✅ STEP 2: Send Telegram notification for successful payment
    try {
      const customerName = order.user
        ? `${order.user.firstName} ${order.user.lastName} (${order.user.email})`
        : `${order.shippingAddress.firstName} ${order.shippingAddress.lastName} (${order.guestEmail})`;

      await simplifiedTelegramService.sendNewOrderNotification({
        orderNumber: order.orderNumber,
        customerName,
        total: Number(order.total),
        items: order.orderItems.map((item: any) => ({
          name: item.productName || item.product.name,
          quantity: item.quantity,
          price: Number(item.appliedPrice),
        })),
        paymentMethod:
          order.paymentMethod?.toUpperCase() || data.triggeredBy.toUpperCase(),
        createdAt: new Date(),
      });

      console.log(
        '✅ Telegram notification sent for paid order:',
        order.orderNumber
      );
    } catch (error) {
      console.error('❌ Failed to send Telegram notification:', error);
    }

    // ✅ STEP 3: Send email confirmation (with membership info if applicable)
    try {
      if (order.user) {
        // Fetch fresh user data to get updated membership info
        const freshUser = await prisma.user.findUnique({
          where: { id: order.user.id },
          select: { isMember: true, memberSince: true, nric: true },
        });

        await emailService.sendOrderConfirmation({
          orderNumber: order.orderNumber,
          customerName: `${order.user.firstName} ${order.user.lastName}`,
          customerEmail: order.user.email,
          items: order.orderItems.map((item: any) => ({
            name: item.productName || item.product.name,
            quantity: item.quantity,
            price: Number(item.appliedPrice),
          })),
          subtotal: Number(order.subtotal),
          taxAmount: Number(order.taxAmount),
          shippingCost: Number(order.shippingCost),
          total: Number(order.total),
          paymentMethod: order.paymentMethod || 'Unknown',
          // Include membership info if newly activated
          membershipInfo: freshUser?.isMember && freshUser?.nric ? {
            isNewMember: true,
            memberId: freshUser.nric,
            memberSince: freshUser.memberSince,
          } : undefined,
        });

        console.log('✅ Order confirmation email sent to:', order.user.email);
      }
    } catch (error) {
      console.error('❌ Failed to send email confirmation:', error);
    }
  }

  /**
   * Handle order confirmed
   */
  private static async handleOrderConfirmed(
    order: any,
    data: OrderStatusChangeData
  ) {
    console.log('✅ Order confirmed:', order.orderNumber);
    // Additional logic for confirmed orders
  }

  /**
   * Handle order processing
   */
  private static async handleOrderProcessing(
    order: any,
    data: OrderStatusChangeData
  ) {
    console.log('⚙️ Order processing:', order.orderNumber);
    // Send processing notification if needed
  }

  /**
   * Handle order shipped
   */
  private static async handleOrderShipped(
    order: any,
    data: OrderStatusChangeData
  ) {
    console.log('🚚 Order shipped:', order.orderNumber);
    // No notifications for shipped status
  }

  /**
   * Handle order delivered
   */
  private static async handleOrderDelivered(
    order: any,
    data: OrderStatusChangeData
  ) {
    console.log('🎉 Order delivered:', order.orderNumber);

    // Send delivery email to customer
    try {
      if (order.user) {
        await emailService.sendShippingNotification({
          orderNumber: order.orderNumber,
          customerName: `${order.user.firstName} ${order.user.lastName}`,
          customerEmail: order.user.email,
          trackingNumber: order.trackingNumber || '',
          courierName: order.courierName || 'Courier',
          estimatedDelivery: order.estimatedDelivery || 'N/A',
          trackingUrl: order.trackingUrl || '',
          items: order.orderItems.map((item: any) => ({
            name: item.productName || item.product?.name || 'Product',
            quantity: item.quantity,
            price: Number(item.appliedPrice),
          })),
        });
        console.log('✅ Delivery email sent to customer:', order.user.email);
      }
    } catch (error) {
      console.error('❌ Failed to send delivery email:', error);
    }
  }

  /**
   * Handle order cancelled
   */
  private static async handleOrderCancelled(
    order: any,
    data: OrderStatusChangeData
  ) {
    console.log('❌ Order cancelled:', order.orderNumber);
    // No notifications for cancelled status
  }

  /**
   * Handle airway bill generation failure
   * Simple notification approach as per implementation plan
   */
  static async handleAirwayBillFailure(orderId: string, error: any) {
    console.log('⚠️ Airway bill generation failed for order:', orderId);

    try {
      // Get order details for notification
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          orderNumber: true,
          status: true,
          paymentStatus: true,
        },
      });

      if (!order) {
        console.error(
          'Order not found for airway bill failure notification:',
          orderId
        );
        return;
      }

      // Send admin notification via Telegram
      const errorMessage =
        typeof error === 'string' ? error : error?.message || 'Unknown error';

      await simplifiedTelegramService.sendMessage({
        message: `⚠️ AIRWAY BILL GENERATION FAILED\n\nOrder: #${order.orderNumber}\nError: ${errorMessage}\nStatus: ${order.status}\nPayment: ${order.paymentStatus}\n\nPlease check the order and retry manually if needed.`,
        channel: 'orders',
      });

      console.log(
        '✅ Airway bill failure notification sent for order:',
        order.orderNumber
      );
    } catch (notificationError) {
      console.error(
        '❌ Failed to send airway bill failure notification:',
        notificationError
      );
    }

    // Create audit log for the failure
    try {
      await prisma.auditLog.create({
        data: {
          action: 'AIRWAY_BILL_GENERATION_FAILED',
          resource: 'ORDER',
          resourceId: orderId,
          details: {
            error:
              typeof error === 'string'
                ? error
                : error?.message || 'Unknown error',
            timestamp: new Date().toISOString(),
          },
          ipAddress: 'system',
          userAgent: 'airway_bill_service',
        },
      });
    } catch (auditError) {
      console.error(
        '❌ Failed to create audit log for airway bill failure:',
        auditError
      );
    }
  }
}

/**
 * Convenience function to update order status and trigger notifications
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  newPaymentStatus?: PaymentStatus,
  triggeredBy: string = 'system',
  metadata?: Record<string, any>
) {
  // Get current order status
  const currentOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, paymentStatus: true },
  });

  if (!currentOrder) {
    throw new Error('Order not found');
  }

  // Update the order
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      ...(newPaymentStatus && { paymentStatus: newPaymentStatus }),
      updatedAt: new Date(),
    },
  });

  // Trigger status change handler
  await OrderStatusHandler.handleOrderStatusChange({
    orderId,
    previousStatus: currentOrder.status,
    newStatus,
    previousPaymentStatus: currentOrder.paymentStatus,
    newPaymentStatus: newPaymentStatus || currentOrder.paymentStatus,
    triggeredBy,
    metadata,
  });

  return updatedOrder;
}
