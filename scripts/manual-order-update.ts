/**
 * Manual Order Status Update
 *
 * Emergency tool to manually update order payment status
 * Usage: npx tsx scripts/manual-order-update.ts <orderNumber> <status>
 *
 * Examples:
 *   npx tsx scripts/manual-order-update.ts ORD-001 PAID
 *   npx tsx scripts/manual-order-update.ts ORD-001 FAILED
 */

import { PrismaClient } from '@prisma/client';
import { OrderStatusHandler } from '../src/lib/notifications/order-status-handler';

const prisma = new PrismaClient();

type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
type OrderStatus = 'PENDING' | 'PAID' | 'READY_TO_SHIP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

async function updateOrderStatus(orderNumber: string, newPaymentStatus: PaymentStatus) {
  try {
    console.log('🔍 Finding order:', orderNumber);
    console.log('');

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      console.error('❌ Order not found:', orderNumber);
      return;
    }

    console.log('📦 Current Order Status:');
    console.log('   Order Number:', order.orderNumber);
    console.log('   Current Status:', order.status);
    console.log('   Current Payment Status:', order.paymentStatus);
    console.log('   Total:', `RM ${order.total}`);
    console.log('   Bill Code:', order.toyyibpayBillCode || 'Not set');
    console.log('');

    if (order.paymentStatus === newPaymentStatus) {
      console.log('⚠️  Order already has payment status:', newPaymentStatus);
      console.log('');
      return;
    }

    // Determine new order status based on payment status
    let newOrderStatus: OrderStatus = 'PENDING';
    if (newPaymentStatus === 'PAID') {
      newOrderStatus = 'PAID';
    } else if (newPaymentStatus === 'FAILED') {
      newOrderStatus = 'CANCELLED';
    }

    console.log('📝 Updating order...');
    console.log('   New Payment Status:', newPaymentStatus);
    console.log('   New Order Status:', newOrderStatus);
    console.log('');

    // Confirm update
    console.log('⚠️  Are you sure you want to update this order? (Ctrl+C to cancel)');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Store previous statuses for notification handler
    const previousStatus = order.status;
    const previousPaymentStatus = order.paymentStatus;

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newOrderStatus,
        paymentStatus: newPaymentStatus,
        paymentId: `MANUAL-${Date.now()}`,
        updatedAt: new Date(),
      },
    });

    // Reserve inventory if paid
    if (newPaymentStatus === 'PAID') {
      console.log('📦 Reserving inventory...');
      for (const item of order.orderItems) {
        if (item.product) {
          const newStock = Math.max(0, item.product.stockQuantity - item.quantity);
          await prisma.product.update({
            where: { id: item.productId },
            data: { stockQuantity: newStock },
          });
          console.log(`   - ${item.productName}: ${item.product.stockQuantity} → ${newStock}`);
        }
      }
    }

    // Trigger notification handler (sends Telegram & Email)
    console.log('📢 Triggering notifications...');
    try {
      await OrderStatusHandler.handleOrderStatusChange({
        orderId: order.id,
        previousStatus,
        newStatus: newOrderStatus,
        previousPaymentStatus,
        newPaymentStatus,
        triggeredBy: 'manual-script',
        metadata: {
          reason: 'Manual order status update via script',
          updatedAt: new Date().toISOString(),
        },
      });
      console.log('   ✅ Notifications sent (Telegram + Email)');
    } catch (notificationError) {
      console.error('   ⚠️ Failed to send notifications:', notificationError);
    }

    console.log('');
    console.log('✅ Order updated successfully!');
    console.log('   Order Number:', updatedOrder.orderNumber);
    console.log('   New Status:', updatedOrder.status);
    console.log('   New Payment Status:', updatedOrder.paymentStatus);
    console.log('   Payment ID:', updatedOrder.paymentId);
    console.log('');

  } catch (error) {
    console.error('❌ Error updating order:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: npx tsx scripts/manual-order-update.ts <orderNumber> <status>');
  console.log('');
  console.log('Status options: PENDING | PAID | FAILED | REFUNDED');
  console.log('');
  console.log('Examples:');
  console.log('  npx tsx scripts/manual-order-update.ts ORD-001 PAID');
  console.log('  npx tsx scripts/manual-order-update.ts ORD-001 FAILED');
  console.log('');
  process.exit(1);
}

const orderNumber = args[0];
const status = args[1].toUpperCase() as PaymentStatus;

const validStatuses: PaymentStatus[] = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
if (!validStatuses.includes(status)) {
  console.error('❌ Invalid status:', status);
  console.log('Valid statuses:', validStatuses.join(', '));
  process.exit(1);
}

updateOrderStatus(orderNumber, status);
