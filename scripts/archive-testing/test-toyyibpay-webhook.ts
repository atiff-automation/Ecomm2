/**
 * ToyyibPay Webhook Testing Script
 *
 * This script helps test and debug ToyyibPay webhook functionality
 * Usage: npx tsx scripts/test-toyyibpay-webhook.ts <billcode> [status]
 *
 * Examples:
 *   npx tsx scripts/test-toyyibpay-webhook.ts abc123 1      # Test successful payment
 *   npx tsx scripts/test-toyyibpay-webhook.ts abc123 3      # Test failed payment
 *   npx tsx scripts/test-toyyibpay-webhook.ts abc123        # Check current status
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WebhookTestData {
  refno: string;
  status: '1' | '2' | '3'; // 1=success, 2=pending, 3=fail
  reason: string;
  billcode: string;
  order_id: string;
  amount: string;
  transaction_time: string;
}

async function testWebhook(billcode: string, status?: '1' | '2' | '3') {
  try {
    console.log('🔍 Testing ToyyibPay webhook for billcode:', billcode);
    console.log('');

    // Find order by billcode
    const order = await prisma.order.findFirst({
      where: {
        toyyibpayBillCode: billcode,
      },
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
      console.error('❌ Order not found for billcode:', billcode);
      console.log('');
      console.log('💡 Available billcodes:');
      const orders = await prisma.order.findMany({
        where: {
          toyyibpayBillCode: { not: null },
        },
        select: {
          orderNumber: true,
          toyyibpayBillCode: true,
          status: true,
          paymentStatus: true,
          total: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      console.table(orders);
      return;
    }

    console.log('✅ Order found:');
    console.log('   Order Number:', order.orderNumber);
    console.log('   Current Status:', order.status);
    console.log('   Payment Status:', order.paymentStatus);
    console.log('   Total:', `RM ${order.total}`);
    console.log('   Customer:', order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Guest');
    console.log('');

    if (!status) {
      console.log('💡 To test webhook, run:');
      console.log(`   npx tsx scripts/test-toyyibpay-webhook.ts ${billcode} 1  # Success`);
      console.log(`   npx tsx scripts/test-toyyibpay-webhook.ts ${billcode} 3  # Failed`);
      console.log('');
      return;
    }

    // Prepare webhook test data
    const amountCents = Math.round(Number(order.total) * 100);
    const webhookData: WebhookTestData = {
      refno: `TEST-${Date.now()}`,
      status: status,
      reason: status === '1' ? 'Payment successful' : status === '3' ? 'Payment failed' : 'Payment pending',
      billcode: billcode,
      order_id: order.id,
      amount: amountCents.toString(),
      transaction_time: new Date().toISOString(),
    };

    console.log('📤 Sending webhook test data:');
    console.log(JSON.stringify(webhookData, null, 2));
    console.log('');

    // Get Railway URL from environment or use localhost
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const fullUrl = `${webhookUrl}/api/webhooks/toyyibpay`;

    console.log('🔗 Webhook URL:', fullUrl);
    console.log('');

    // Send webhook request
    const formData = new URLSearchParams();
    Object.entries(webhookData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    console.log('⏳ Sending webhook request...');
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const responseData = await response.json();
    console.log('');
    console.log('📥 Webhook response:', response.status, response.statusText);
    console.log(JSON.stringify(responseData, null, 2));
    console.log('');

    // Check updated order status
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      select: {
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentId: true,
      },
    });

    console.log('📊 Updated order status:');
    console.log('   Order Number:', updatedOrder?.orderNumber);
    console.log('   Status:', updatedOrder?.status);
    console.log('   Payment Status:', updatedOrder?.paymentStatus);
    console.log('   Payment ID:', updatedOrder?.paymentId || 'Not set');
    console.log('');

    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed!');
    }

  } catch (error) {
    console.error('❌ Error testing webhook:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function listRecentOrders() {
  console.log('📋 Recent orders with ToyyibPay billcodes:');
  console.log('');

  const orders = await prisma.order.findMany({
    where: {
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
    take: 20,
    orderBy: { createdAt: 'desc' },
  });

  console.table(orders.map(o => ({
    'Order Number': o.orderNumber,
    'Bill Code': o.toyyibpayBillCode,
    'Status': o.status,
    'Payment': o.paymentStatus,
    'Total': `RM ${o.total}`,
    'Created': o.createdAt.toLocaleString(),
  })));

  await prisma.$disconnect();
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: npx tsx scripts/test-toyyibpay-webhook.ts <billcode> [status]');
  console.log('');
  console.log('Examples:');
  console.log('  npx tsx scripts/test-toyyibpay-webhook.ts abc123        # Check order status');
  console.log('  npx tsx scripts/test-toyyibpay-webhook.ts abc123 1      # Test successful payment');
  console.log('  npx tsx scripts/test-toyyibpay-webhook.ts abc123 3      # Test failed payment');
  console.log('');
  listRecentOrders();
} else {
  const billcode = args[0];
  const status = args[1] as '1' | '2' | '3' | undefined;
  testWebhook(billcode, status);
}
