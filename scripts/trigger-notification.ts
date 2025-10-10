/**
 * Trigger Notification for Existing Order
 *
 * Manually triggers Telegram/Email notifications for an order
 * Usage: npx tsx scripts/trigger-notification.ts <orderNumber>
 */

import { PrismaClient } from '@prisma/client';
import { OrderStatusHandler } from '../src/lib/notifications/order-status-handler';

const prisma = new PrismaClient();

async function triggerNotification(orderNumber: string) {
  try {
    console.log('🔍 Finding order:', orderNumber);

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
      },
    });

    if (!order) {
      console.error('❌ Order not found:', orderNumber);
      return;
    }

    console.log('📦 Order Details:');
    console.log('   Order Number:', order.orderNumber);
    console.log('   Status:', order.status);
    console.log('   Payment Status:', order.paymentStatus);
    console.log('');

    console.log('📢 Triggering notifications...');

    // Trigger notification handler
    await OrderStatusHandler.handleOrderStatusChange({
      orderId: order.id,
      previousStatus: 'PENDING',
      newStatus: order.status,
      previousPaymentStatus: 'PENDING',
      newPaymentStatus: order.paymentStatus,
      triggeredBy: 'manual-notification-trigger',
      metadata: {
        reason: 'Manual notification trigger via script',
        triggeredAt: new Date().toISOString(),
      },
    });

    console.log('');
    console.log('✅ Notifications triggered successfully!');
    console.log('   Check your Telegram channel for the notification');

  } catch (error) {
    console.error('❌ Error triggering notification:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: npx tsx scripts/trigger-notification.ts <orderNumber>');
  console.log('');
  console.log('Example:');
  console.log('  npx tsx scripts/trigger-notification.ts ORD-20251010-3JXN');
  process.exit(1);
}

const orderNumber = args[0];
triggerNotification(orderNumber);
