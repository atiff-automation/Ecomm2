/**
 * Test API Response for Order
 * Check if new EasyParcel fields are returned
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAPIResponse() {
  try {
    const orderNumber = 'ORD-20251010-SAWW';

    console.log(`\n🔍 Testing API response for order: ${orderNumber}\n`);

    // Fetch order exactly like the API does
    const order = await prisma.order.findFirst({
      where: { orderNumber },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isMember: true,
            memberSince: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: {
                  where: { isPrimary: true },
                  select: {
                    url: true,
                    altText: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        shippingAddress: true,
        billingAddress: true,
        shipment: {
          include: {
            trackingEvents: {
              orderBy: { eventTime: 'desc' },
            },
          },
        },
      },
    });

    if (!order) {
      console.error('❌ Order not found!');
      return;
    }

    // Check for new fields
    console.log('📊 Order Data:');
    console.log('----------------------------');
    console.log(`Order Number: ${order.orderNumber}`);
    console.log(`Status: ${order.status}`);
    console.log(`Tracking Number: ${order.trackingNumber || 'NULL'}`);
    console.log('\n🆕 AWB Fields:');
    console.log(`  airwayBillGenerated: ${order.airwayBillGenerated}`);
    console.log(`  airwayBillGeneratedAt: ${order.airwayBillGeneratedAt || 'NULL'}`);
    console.log(`  airwayBillNumber: ${order.airwayBillNumber || 'NULL'}`);
    console.log(`  airwayBillUrl: ${order.airwayBillUrl || 'NULL'}`);
    console.log(`  trackingUrl: ${order.trackingUrl || 'NULL'}`);
    console.log('\n🆕 EasyParcel Fields:');
    console.log(`  easyparcelOrderNumber: ${order.easyparcelOrderNumber || 'NULL'}`);
    console.log(`  easyparcelPaymentStatus: ${order.easyparcelPaymentStatus || 'NULL'}`);
    console.log(`  easyparcelParcelNumber: ${order.easyparcelParcelNumber || 'NULL'}`);
    console.log(`  shippingCostCharged: ${order.shippingCostCharged || 'NULL'}`);

    // Transform the data like the API does
    const orderData = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      trackingNumber: order.trackingNumber,

      // AWB Information
      airwayBillGenerated: order.airwayBillGenerated,
      airwayBillGeneratedAt: order.airwayBillGeneratedAt?.toISOString() || null,
      airwayBillNumber: order.airwayBillNumber,
      airwayBillUrl: order.airwayBillUrl,
      trackingUrl: order.trackingUrl,

      // EasyParcel Fields
      easyparcelOrderNumber: order.easyparcelOrderNumber,
      easyparcelPaymentStatus: order.easyparcelPaymentStatus,
      easyparcelParcelNumber: order.easyparcelParcelNumber,
      shippingCostCharged: order.shippingCostCharged ? Number(order.shippingCostCharged) : null,
    };

    console.log('\n📤 Transformed API Response:');
    console.log('----------------------------');
    console.log(JSON.stringify(orderData, null, 2));

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPIResponse();
