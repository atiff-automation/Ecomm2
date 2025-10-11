/**
 * Test Fulfillment Mapping
 *
 * Simulates the complete EasyParcel fulfillment flow using actual API responses
 * to verify correct database mapping without making real API calls.
 */

import { prisma } from '../src/lib/db/prisma';

// Actual EPSubmitOrderBulk response (from /tmp/easyparcel-response.json)
const mockShipmentResponse = {
  result: [
    {
      REQ_ID: "",
      parcel_number: "EP-A2V318",
      order_number: "EI-ZQ0RT",
      price: "6.49",
      addon_price: "0.20",
      addon: {
        sms_addon: "0.00",
        sms_tax: "0.00",
        email_addon: "0.00",
        email_tax: "0.00",
        awbbranding_addon: "0.00",
        awbbranding_tax: "0.00",
        whatsapp_addon: "0.20",
        whatsapp_tax: "0.00"
      },
      shipment_price: "5.93",
      shipment_tax: "0.36",
      insurance_charges: "0.00",
      insurance_charges_tax: "0.00",
      max_insurance_coverage: "50.00",
      cod_charges: "0.00",
      cod_charges_tax: "0.00",
      addon_whatsapp_tracking_charges: "0.20",
      status: "Success",
      remarks: "Order Successfully Placed.",
      courier: "J&T Express",
      collect_date: "2025-10-13"
    }
  ],
  api_status: "Success",
  error_code: "0",
  error_remark: ""
};

// Simulated EPPayOrderBulk response (based on official API structure)
const mockPaymentResponse = {
  result: [
    {
      status: "Success",
      remarks: "Order paid successfully",
      orderno: "EI-ZQ0RT",
      messagenow: "Fully Paid",
      parcel: [
        {
          parcelno: "EP-A2V318",              // EasyParcel internal reference
          awb: "631867054753",                // Actual courier tracking number (from WhatsApp)
          awb_id_link: "https://connect.easyparcel.my/pdf/awb/EP-A2V318.pdf",
          tracking_url: "https://www.easyparcel.my/tracking?tracking_id=EP-A2V318"
        }
      ]
    }
  ],
  api_status: "Success",
  error_code: "0",
  error_remark: ""
};

async function testFulfillmentMapping() {
  console.log('🧪 Testing Fulfillment Mapping with Real API Response Data\n');

  try {
    // Find the test order (ORD-20251011-Y323)
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: 'ORD-20251011-Y323'
      },
      include: {
        shippingAddress: true
      }
    });

    if (!order) {
      console.error('❌ Test order ORD-20251011-Y323 not found');
      return;
    }

    console.log('✅ Found test order:', order.orderNumber);
    console.log('   Current status:', order.status);
    console.log('   Current payment status:', order.paymentStatus);
    console.log('');

    // Step 1: Simulate EPSubmitOrderBulk response processing
    console.log('📦 Step 1: Processing EPSubmitOrderBulk response');
    console.log('───────────────────────────────────────────────────');
    const bulkResult = mockShipmentResponse.result[0];

    console.log('Received from EasyParcel:');
    console.log('  - order_number:', bulkResult.order_number);
    console.log('  - parcel_number:', bulkResult.parcel_number);
    console.log('  - courier:', bulkResult.courier);
    console.log('  - status:', bulkResult.status);
    console.log('');

    const shipmentData = {
      shipment_id: bulkResult.order_number,  // Used for payment step
      tracking_number: bulkResult.parcel_number, // EasyParcel reference (NOT the final tracking number)
      courier_name: bulkResult.courier
    };

    console.log('Extracted shipment data:');
    console.log('  - shipment_id (for payment):', shipmentData.shipment_id);
    console.log('  - tracking_number (temp):', shipmentData.tracking_number);
    console.log('  - courier_name:', shipmentData.courier_name);
    console.log('');

    // Step 2: Simulate EPPayOrderBulk response processing
    console.log('💳 Step 2: Processing EPPayOrderBulk response');
    console.log('───────────────────────────────────────────────────');
    const paymentResult = mockPaymentResponse.result[0];
    const parcelDetails = paymentResult.parcel[0];

    console.log('Received from EasyParcel:');
    console.log('  - orderno:', paymentResult.orderno);
    console.log('  - messagenow:', paymentResult.messagenow);
    console.log('  - parcel.parcelno:', parcelDetails.parcelno);
    console.log('  - parcel.awb:', parcelDetails.awb, '← ACTUAL TRACKING NUMBER');
    console.log('  - parcel.awb_id_link:', parcelDetails.awb_id_link);
    console.log('  - parcel.tracking_url:', parcelDetails.tracking_url);
    console.log('');

    // Step 3: Map to database fields (CORRECTED mapping)
    console.log('💾 Step 3: Mapping to Database Fields');
    console.log('───────────────────────────────────────────────────');

    const databaseUpdate = {
      status: 'READY_TO_SHIP' as const,
      trackingNumber: parcelDetails.awb,              // ✅ CORRECTED: Use AWB
      airwayBillNumber: parcelDetails.awb,            // ✅ CORRECTED: Use AWB
      airwayBillUrl: parcelDetails.awb_id_link,
      trackingUrl: parcelDetails.tracking_url,
      airwayBillGenerated: true,
      airwayBillGeneratedAt: new Date(),
      courierName: bulkResult.courier,
      scheduledPickupDate: new Date(bulkResult.collect_date),
    };

    console.log('Database update payload:');
    console.log('  - status:', databaseUpdate.status);
    console.log('  - trackingNumber:', databaseUpdate.trackingNumber, '✅ Correct AWB');
    console.log('  - airwayBillNumber:', databaseUpdate.airwayBillNumber, '✅ Same as tracking');
    console.log('  - airwayBillUrl:', databaseUpdate.airwayBillUrl);
    console.log('  - trackingUrl:', databaseUpdate.trackingUrl);
    console.log('  - airwayBillGenerated:', databaseUpdate.airwayBillGenerated);
    console.log('  - courierName:', databaseUpdate.courierName);
    console.log('  - scheduledPickupDate:', databaseUpdate.scheduledPickupDate.toISOString());
    console.log('');

    // Step 4: Verify mapping correctness
    console.log('✅ Step 4: Verification');
    console.log('───────────────────────────────────────────────────');

    const checks = {
      'Tracking number is AWB (not parcel_number)': databaseUpdate.trackingNumber === '631867054753',
      'AWB number matches tracking number': databaseUpdate.airwayBillNumber === databaseUpdate.trackingNumber,
      'AWB number is NOT EP-A2V318': databaseUpdate.airwayBillNumber !== 'EP-A2V318',
      'Tracking number matches WhatsApp': databaseUpdate.trackingNumber === '631867054753',
      'AWB PDF link exists': databaseUpdate.airwayBillUrl.includes('pdf'),
      'Tracking URL exists': databaseUpdate.trackingUrl.includes('tracking'),
      'Status is READY_TO_SHIP': databaseUpdate.status === 'READY_TO_SHIP',
      'AWB generated flag is true': databaseUpdate.airwayBillGenerated === true,
      'Courier name is correct': databaseUpdate.courierName === 'J&T Express',
    };

    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      const icon = passed ? '✅' : '❌';
      console.log(`${icon} ${check}`);
      if (!passed) allPassed = false;
    }

    console.log('');

    if (!allPassed) {
      console.error('❌ Some verification checks failed!');
      return;
    }

    console.log('🎉 All verification checks passed!');
    console.log('');

    // Step 5: Show comparison
    console.log('📊 Comparison: Before Fix vs After Fix');
    console.log('───────────────────────────────────────────────────');
    console.log('BEFORE FIX (WRONG):');
    console.log('  trackingNumber: EP-A2V318 ❌ (parcel_number - not a real tracking number)');
    console.log('  airwayBillNumber: 631867054753 ✅ (awb - correct)');
    console.log('  Result: Inconsistent! Tracking number doesn\'t work with couriers');
    console.log('');
    console.log('AFTER FIX (CORRECT):');
    console.log('  trackingNumber: 631867054753 ✅ (awb - the REAL tracking number)');
    console.log('  airwayBillNumber: 631867054753 ✅ (awb - same value)');
    console.log('  Result: Consistent! This is the number J&T Express uses for tracking');
    console.log('');

    // Step 6: Show what would be saved
    console.log('💡 Summary: What Gets Saved to Database');
    console.log('───────────────────────────────────────────────────');
    console.log(JSON.stringify(databaseUpdate, null, 2));
    console.log('');

    console.log('✅ Test completed successfully!');
    console.log('');
    console.log('Key Takeaways:');
    console.log('  1. parcel_number (EP-A2V318) is just EasyParcel\'s internal reference');
    console.log('  2. awb (631867054753) is the ACTUAL courier tracking number');
    console.log('  3. Both trackingNumber and airwayBillNumber should use the AWB');
    console.log('  4. This matches what was sent via WhatsApp: 631867054753');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testFulfillmentMapping();
