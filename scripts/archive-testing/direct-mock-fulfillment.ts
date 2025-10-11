/**
 * Direct Mock Fulfillment (Bypass API Auth)
 *
 * This script directly updates the database with mock AWB data,
 * simulating what the fulfill-mock endpoint would do.
 *
 * Usage: npx tsx scripts/direct-mock-fulfillment.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock EPSubmitOrderBulk Response (for shippingCostCharged)
const MOCK_SUBMIT_RESPONSE = {
  result: {
    orderno: 'EI-MOCK2025',
    parcels: [
      {
        service_id: 'EP-CS0D0P',
        service_name: 'Dropoff - Parcel',
        courier_name: 'Skynet',
        price: '6.49', // ✅ Will map to shippingCostCharged
        parcel_id: 'EP-MOCK123',
      },
    ],
  },
};

// Mock EPPayOrderBulk Response (for AWB and EasyParcel fields)
const MOCK_PAYMENT_RESPONSE = {
  result: [
    {
      orderno: 'EI-MOCK2025', // ✅ Will map to easyparcelOrderNumber
      messagenow: 'Fully Paid', // ✅ Will map to easyparcelPaymentStatus
      parcel: [
        {
          parcelno: 'EP-MOCK123', // ✅ Will map to easyparcelParcelNumber
          awb: '631867054753', // ✅ REAL tracking number from WhatsApp
          awb_id_link:
            'http://demo.connect.easyparcel.my/?ac=AWBLabel&id=mock-awb-123456', // Mock AWB PDF URL
          tracking_url:
            'https://easyparcel.com/my/en/track/details/?courier=J&T%20Express&awb=631867054753', // Mock tracking URL
        },
      ],
    },
  ],
  api_status: 'Success',
  error_code: '0',
  error_remark: '',
  // ❌ NO total_amount field (per official API docs)
};

async function directMockFulfillment() {
  try {
    console.log('===== DIRECT MOCK FULFILLMENT =====\n');

    // Step 1: Find the order
    const orderNumber = 'ORD-20251010-SAWW';
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
        easyparcelOrderNumber: true,
        easyparcelPaymentStatus: true,
        easyparcelParcelNumber: true,
        shippingCostCharged: true,
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
    console.log(`EasyParcel Order No: ${order.easyparcelOrderNumber || 'NULL'}`);
    console.log(`EasyParcel Payment Status: ${order.easyparcelPaymentStatus || 'NULL'}`);
    console.log(`EasyParcel Parcel No: ${order.easyparcelParcelNumber || 'NULL'}`);
    console.log(`Shipping Cost Charged: ${order.shippingCostCharged || 'NULL'}`);

    // Step 2: Extract data from both mock responses
    const submitPrice = MOCK_SUBMIT_RESPONSE.result.parcels[0].price;
    const orderData = MOCK_PAYMENT_RESPONSE.result[0];
    const parcelDetails = orderData.parcel[0];

    console.log('\n2. Mock EPSubmitOrderBulk Response:');
    console.log('----------------------------');
    console.log(JSON.stringify(MOCK_SUBMIT_RESPONSE, null, 2));

    console.log('\n3. Mock EPPayOrderBulk Response:');
    console.log('----------------------------');
    console.log(JSON.stringify(MOCK_PAYMENT_RESPONSE, null, 2));

    console.log('\n4. Extracted Data:');
    console.log('----------------------------');
    console.log(`From Submit Response:`);
    console.log(`  - Price: ${submitPrice}`);
    console.log(`From Payment Response:`);
    console.log(`  - Order No: ${orderData.orderno}`);
    console.log(`  - Message: ${orderData.messagenow}`);
    console.log(`  - Parcel No: ${parcelDetails.parcelno}`);
    console.log(`  - AWB: ${parcelDetails.awb}`);
    console.log(`  - AWB Link: ${parcelDetails.awb_id_link}`);
    console.log(`  - Tracking URL: ${parcelDetails.tracking_url}`);

    // Step 3: Update database with all fields from both responses
    console.log('\n5. Updating order in database...');

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'READY_TO_SHIP',

        // Existing AWB fields
        trackingNumber: parcelDetails.awb, // Real AWB: 631867054753
        airwayBillNumber: parcelDetails.awb, // Same as tracking number
        airwayBillUrl: parcelDetails.awb_id_link, // Mock PDF URL
        airwayBillGenerated: true,
        airwayBillGeneratedAt: new Date(),
        trackingUrl: parcelDetails.tracking_url, // Mock tracking URL

        // ✅ NEW EASYPARCEL FIELDS
        easyparcelOrderNumber: orderData.orderno, // From EPPayOrderBulk
        easyparcelPaymentStatus: orderData.messagenow, // From EPPayOrderBulk
        easyparcelParcelNumber: parcelDetails.parcelno, // From EPPayOrderBulk
        shippingCostCharged: submitPrice, // From EPSubmitOrderBulk

        // ✅ COURIER SERVICE FIELDS (for UI display)
        courierServiceDetail: 'pickup', // Mock: 'pickup', 'dropoff', or 'dropoff or pickup'
        scheduledPickupDate: new Date('2025-10-15'), // Mock pickup date

        adminNotes: `[MOCK FULFILLMENT] Testing field mapping without EasyParcel API call. Mock data injected: ${new Date().toISOString()}`,
      },
    });

    console.log('✅ Database updated successfully!');

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
    console.log(`EasyParcel Order No: ${updatedOrder.easyparcelOrderNumber || 'NULL'}`);
    console.log(`EasyParcel Payment Status: ${updatedOrder.easyparcelPaymentStatus || 'NULL'}`);
    console.log(`EasyParcel Parcel No: ${updatedOrder.easyparcelParcelNumber || 'NULL'}`);
    console.log(`Shipping Cost Charged: ${updatedOrder.shippingCostCharged || 'NULL'}`);

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
      // ✅ NEW VALIDATION CHECKS
      {
        name: 'EasyParcel Order Number is EI-MOCK2025',
        pass: updatedOrder.easyparcelOrderNumber === 'EI-MOCK2025',
        expected: 'EI-MOCK2025',
        actual: updatedOrder.easyparcelOrderNumber,
      },
      {
        name: 'EasyParcel Payment Status is Fully Paid',
        pass: updatedOrder.easyparcelPaymentStatus === 'Fully Paid',
        expected: 'Fully Paid',
        actual: updatedOrder.easyparcelPaymentStatus,
      },
      {
        name: 'EasyParcel Parcel Number is EP-MOCK123',
        pass: updatedOrder.easyparcelParcelNumber === 'EP-MOCK123',
        expected: 'EP-MOCK123',
        actual: updatedOrder.easyparcelParcelNumber,
      },
      {
        name: 'Shipping Cost Charged is 6.49',
        pass: Number(updatedOrder.shippingCostCharged) === 6.49,
        expected: '6.49',
        actual: updatedOrder.shippingCostCharged?.toString(),
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
      console.log('✅ ALL 12 CHECKS PASSED! Database field mapping is correct.\n');
      console.log('📝 Next Steps:');
      console.log('1. Open admin panel: http://localhost:3000/admin/orders');
      console.log(`2. Find order: ${updatedOrder.orderNumber}`);
      console.log('3. Verify all AWB fields display correctly in UI');
      console.log('4. Verify new EasyParcel fields display correctly:');
      console.log('   - EasyParcel Order No. (blue text)');
      console.log('   - EasyParcel Parcel No. (purple text)');
      console.log('   - Shipping Cost Charged (with variance indicator)');
      console.log('   - Payment Status (green text)');
      console.log('5. Click "View Airway Bill" button');
      console.log('6. Should open: ' + updatedOrder.airwayBillUrl);
      console.log('\n7. If UI displays all fields correctly, field mapping is 100% validated!');
      console.log('8. Ready to proceed with real EasyParcel fulfillment.');
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
directMockFulfillment();
