/**
 * Check order fulfillment details
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function checkFulfillment(orderNumber: string) {
  try {
    const order = await prisma.order.findFirst({
      where: { orderNumber },
      select: {
        orderNumber: true,
        status: true,
        paymentStatus: true,
        easyparcelOrderNumber: true,
        easyparcelPaymentStatus: true,
        easyparcelParcelNumber: true,
        selectedCourierServiceId: true,
        courierName: true,
        courierServiceType: true,
        courierServiceDetail: true,
        shippingCostCharged: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!order) {
      console.log(`❌ Order ${orderNumber} not found`);
      return;
    }

    console.log('\n📋 Order Fulfillment Details:');
    console.log('='.repeat(60));
    console.log(`Order Number: ${order.orderNumber}`);
    console.log(`Payment Status: ${order.paymentStatus}`);
    console.log(`Order Status: ${order.status}`);
    console.log('');
    console.log('EasyParcel Details:');
    console.log(`  - Order Number: ${order.easyparcelOrderNumber || 'N/A'}`);
    console.log(`  - Payment Status: ${order.easyparcelPaymentStatus || 'N/A'}`);
    console.log(`  - Parcel Number: ${order.easyparcelParcelNumber || 'N/A'}`);
    console.log(`  - Courier: ${order.courierName || 'N/A'}`);
    console.log(`  - Service ID: ${order.selectedCourierServiceId || 'N/A'}`);
    console.log(`  - Service Type: ${order.courierServiceType || 'N/A'}`);
    console.log(`  - Service Detail: ${order.courierServiceDetail || 'N/A'}`);
    console.log(`  - Shipping Cost: RM ${order.shippingCostCharged || 0}`);
    console.log('');
    console.log(`Created: ${order.createdAt}`);
    console.log(`Updated: ${order.updatedAt}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const orderNumber = process.argv[2] || 'ORD-20251011-BCYB';
checkFulfillment(orderNumber);
