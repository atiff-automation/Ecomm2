/**
 * Webhook Logs Checker
 *
 * This script checks audit logs for webhook activity
 * Usage: npx tsx scripts/check-webhook-logs.ts [orderNumber]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWebhookLogs(orderNumber?: string) {
  try {
    console.log('🔍 Checking webhook activity logs...');
    console.log('');

    if (orderNumber) {
      // Find specific order
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          toyyibpayBillCode: true,
          createdAt: true,
          updatedAt: true,
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
      console.log('   Bill Code:', order.toyyibpayBillCode || 'Not set');
      console.log('   Created:', order.createdAt.toLocaleString());
      console.log('   Updated:', order.updatedAt.toLocaleString());
      console.log('');

      // Get logs for this order
      const logs = await prisma.auditLog.findMany({
        where: {
          OR: [
            { resourceId: order.id },
            {
              details: {
                path: ['orderNumber'],
                equals: orderNumber,
              },
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(`📋 Found ${logs.length} audit logs for this order:`);
      console.log('');

      logs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.action} - ${log.createdAt.toLocaleString()}`);
        console.log('   Resource:', log.resource);
        if (log.details) {
          console.log('   Details:', JSON.stringify(log.details, null, 2));
        }
        console.log('');
      });

    } else {
      // Show recent webhook activity
      const webhookLogs = await prisma.auditLog.findMany({
        where: {
          OR: [
            { action: 'ORDER_STATUS_CHANGE' },
            { action: 'TOYYIBPAY_AMOUNT_MISMATCH' },
            { action: 'TOYYIBPAY_WEBHOOK_ERROR' },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      console.log(`📋 Recent webhook activity (${webhookLogs.length} logs):`);
      console.log('');

      webhookLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.action} - ${log.createdAt.toLocaleString()}`);
        console.log('   IP:', log.ipAddress);
        if (log.details) {
          const details = log.details as any;
          if (details.orderNumber) console.log('   Order:', details.orderNumber);
          if (details.newStatus) console.log('   New Status:', details.newStatus);
          if (details.newPaymentStatus) console.log('   Payment Status:', details.newPaymentStatus);
          if (details.toyyibpayBillCode) console.log('   Bill Code:', details.toyyibpayBillCode);
        }
        console.log('');
      });

      // Show orders awaiting payment
      console.log('⏳ Orders currently awaiting payment:');
      console.log('');

      const awaitingOrders = await prisma.order.findMany({
        where: {
          paymentStatus: 'PENDING',
          toyyibpayBillCode: { not: null },
        },
        select: {
          orderNumber: true,
          toyyibpayBillCode: true,
          status: true,
          paymentStatus: true,
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      if (awaitingOrders.length === 0) {
        console.log('   No orders awaiting payment');
      } else {
        console.table(awaitingOrders.map(o => ({
          'Order': o.orderNumber,
          'Bill Code': o.toyyibpayBillCode,
          'Status': o.status,
          'Payment': o.paymentStatus,
          'Total': `RM ${o.total}`,
          'Age': getTimeDifference(o.createdAt),
        })));
      }
    }

  } catch (error) {
    console.error('❌ Error checking logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getTimeDifference(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
}

// Main execution
const args = process.argv.slice(2);
const orderNumber = args[0];

checkWebhookLogs(orderNumber);
