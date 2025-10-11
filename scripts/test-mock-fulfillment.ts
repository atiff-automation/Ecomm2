/**
 * Test Mock Fulfillment Flow
 *
 * This script tests the mock fulfillment endpoint to verify:
 * 1. Database fields are updated correctly
 * 2. Field mapping from API response → Database works
 * 3. No errors occur in the flow
 *
 * Usage: npx tsx scripts/test-mock-fulfillment.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMockFulfillment() {
  try {
    console.log('===== MOCK FULFILLMENT TEST =====\n');

    // Step 1: Find the order
    const orderNumber = 'ORD-20251011-Y323';
    console.log(`1. Looking for order: ${orderNumber}...`);

    const order = await prisma.order.findFirst({
      where: { orderNumber },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        trackingNumber: true,
        airwayBillNumber: true,
        airwayBillUrl: true,
        trackingUrl: true,
        airwayBillGenerated: true,
        airwayBillGeneratedAt: true,
      },
    });

    if (!order) {
      console.error(`❌ Order ${orderNumber} not found!`);
      process.exit(1);
    }

    console.log('✅ Order found!');
    console.log('\n📊 BEFORE Mock Fulfillment:');
    console.log('----------------------------');
    console.log(`Order ID: ${order.id}`);
    console.log(`Order Number: ${order.orderNumber}`);
    console.log(`Status: ${order.status}`);
    console.log(`Tracking Number: ${order.trackingNumber || 'NULL'}`);
    console.log(`AWB Number: ${order.airwayBillNumber || 'NULL'}`);
    console.log(`AWB URL: ${order.airwayBillUrl || 'NULL'}`);
    console.log(`Tracking URL: ${order.trackingUrl || 'NULL'}`);
    console.log(`AWB Generated: ${order.airwayBillGenerated}`);
    console.log(`AWB Generated At: ${order.airwayBillGeneratedAt || 'NULL'}`);

    // Step 2: Call mock fulfillment endpoint
    console.log('\n2. Calling mock fulfillment endpoint...');
    console.log(`URL: http://localhost:3000/api/admin/orders/${order.id}/fulfill-mock`);

    const response = await fetch(
      `http://localhost:3000/api/admin/orders/${order.id}/fulfill-mock`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Mock fulfillment failed:`, error);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Mock fulfillment successful!');
    console.log('\n📦 Response from API:');
    console.log(JSON.stringify(result, null, 2));

    // Step 3: Verify database was updated
    console.log('\n3. Verifying database update...');

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        trackingNumber: true,
        airwayBillNumber: true,
        airwayBillUrl: true,
        trackingUrl: true,
        airwayBillGenerated: true,
        airwayBillGeneratedAt: true,
        adminNotes: true,
      },
    });

    if (!updatedOrder) {
      console.error('❌ Order not found after update!');
      process.exit(1);
    }

    console.log('\n📊 AFTER Mock Fulfillment:');
    console.log('----------------------------');
    console.log(`Order ID: ${updatedOrder.id}`);
    console.log(`Order Number: ${updatedOrder.orderNumber}`);
    console.log(`Status: ${updatedOrder.status}`);
    console.log(`Tracking Number: ${updatedOrder.trackingNumber || 'NULL'}`);
    console.log(`AWB Number: ${updatedOrder.airwayBillNumber || 'NULL'}`);
    console.log(`AWB URL: ${updatedOrder.airwayBillUrl || 'NULL'}`);
    console.log(`Tracking URL: ${updatedOrder.trackingUrl || 'NULL'}`);
    console.log(`AWB Generated: ${updatedOrder.airwayBillGenerated}`);
    console.log(`AWB Generated At: ${updatedOrder.airwayBillGeneratedAt}`);
    console.log(`Admin Notes: ${updatedOrder.adminNotes || 'NULL'}`);

    // Step 4: Validation checks
    console.log('\n✅ VALIDATION CHECKS:');
    console.log('----------------------------');

    const checks = [
      {
        name: 'Status is READY_TO_SHIP',
        pass: updatedOrder.status === 'READY_TO_SHIP',
        expected: 'READY_TO_SHIP',
        actual: updatedOrder.status,
      },
      {
        name: 'Tracking Number is 631867054753',
        pass: updatedOrder.trackingNumber === '631867054753',
        expected: '631867054753',
        actual: updatedOrder.trackingNumber,
      },
      {
        name: 'AWB Number is 631867054753',
        pass: updatedOrder.airwayBillNumber === '631867054753',
        expected: '631867054753',
        actual: updatedOrder.airwayBillNumber,
      },
      {
        name: 'Tracking Number equals AWB Number',
        pass: updatedOrder.trackingNumber === updatedOrder.airwayBillNumber,
        expected: 'Equal values',
        actual: `${updatedOrder.trackingNumber} === ${updatedOrder.airwayBillNumber}`,
      },
      {
        name: 'AWB URL exists',
        pass: !!updatedOrder.airwayBillUrl,
        expected: 'Not NULL',
        actual: updatedOrder.airwayBillUrl || 'NULL',
      },
      {
        name: 'Tracking URL exists',
        pass: !!updatedOrder.trackingUrl,
        expected: 'Not NULL',
        actual: updatedOrder.trackingUrl || 'NULL',
      },
      {
        name: 'AWB Generated is true',
        pass: updatedOrder.airwayBillGenerated === true,
        expected: 'true',
        actual: String(updatedOrder.airwayBillGenerated),
      },
      {
        name: 'AWB Generated At is set',
        pass: !!updatedOrder.airwayBillGeneratedAt,
        expected: 'Not NULL',
        actual: updatedOrder.airwayBillGeneratedAt?.toISOString() || 'NULL',
      },
    ];

    let allPassed = true;
    checks.forEach((check, index) => {
      const icon = check.pass ? '✅' : '❌';
      console.log(`${icon} ${index + 1}. ${check.name}`);
      if (!check.pass) {
        console.log(`   Expected: ${check.expected}`);
        console.log(`   Actual: ${check.actual}`);
        allPassed = false;
      }
    });

    console.log('\n===== TEST SUMMARY =====');
    if (allPassed) {
      console.log('✅ ALL CHECKS PASSED! Field mapping is correct.');
      console.log('\n📝 Next Steps:');
      console.log('1. Check admin UI at: http://localhost:3000/admin/orders');
      console.log(`2. Open order: ${updatedOrder.orderNumber}`);
      console.log('3. Verify all fields display correctly');
      console.log('4. Test Print Packing Slip button');
      console.log('5. If everything works, proceed with real fulfillment');
    } else {
      console.log('❌ SOME CHECKS FAILED! Review the output above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testMockFulfillment();
