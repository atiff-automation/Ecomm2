/**
 * Mock Fulfillment API Route (TESTING ONLY)
 *
 * POST /api/admin/orders/[orderId]/fulfill-mock
 *
 * This endpoint simulates the fulfillment flow WITHOUT calling EasyParcel API.
 * It injects mock EPPayOrderBulk response data directly into the database.
 *
 * **PURPOSE**: Test field mapping from API response → Database → UI without cost
 * **USAGE**: Only for order ORD-20251011-Y323 testing
 * **DELETE**: Remove this file after validation complete
 *
 * @route POST /api/admin/orders/[orderId]/fulfill-mock
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Mock EPPayOrderBulk Response Data
 * Based on official EasyParcel API documentation
 * Source: https://developers.easyparcel.com
 */
const createMockPaymentResponse = (orderNumber: string) => {
  return {
    result: [
      {
        orderno: 'EI-MOCK2025', // Mock EasyParcel order number
        messagenow: 'Fully Paid',
        parcel: [
          {
            parcelno: 'EP-MOCK123', // EasyParcel internal reference
            awb: '631867054753', // ✅ REAL tracking number from WhatsApp
            awb_id_link: 'http://demo.connect.easyparcel.my/?ac=AWBLabel&id=mock-awb-123456', // Mock AWB PDF URL
            tracking_url: `https://easyparcel.com/my/en/track/details/?courier=J&T%20Express&awb=631867054753`, // Mock tracking URL
          },
        ],
      },
    ],
    api_status: 'Success',
    error_code: '0',
    error_remark: '',
  };
};

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    console.log('[Mock Fulfillment] ===== STARTING MOCK FULFILLMENT =====');
    console.log('[Mock Fulfillment] Order ID:', params.orderId);

    // Step 1: Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized. Admin access required.',
        },
        { status: 401 }
      );
    }

    console.log('[Mock Fulfillment] Admin authenticated:', session.user.email);

    // Step 2: Fetch order
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: {
        shippingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order not found',
        },
        { status: 404 }
      );
    }

    console.log('[Mock Fulfillment] Order found:', {
      orderNumber: order.orderNumber,
      currentStatus: order.status,
    });

    // Step 3: Validate order can be fulfilled
    if (order.status !== 'PAID') {
      return NextResponse.json(
        {
          success: false,
          message: `Order cannot be fulfilled. Current status: ${order.status}. Only PAID orders can be fulfilled.`,
        },
        { status: 400 }
      );
    }

    // Step 4: Generate mock payment response
    const mockPaymentResponse = createMockPaymentResponse(order.orderNumber);
    const parcelDetails = mockPaymentResponse.result[0].parcel[0];

    console.log('[Mock Fulfillment] ===== MOCK PAYMENT RESPONSE =====');
    console.log(JSON.stringify(mockPaymentResponse, null, 2));
    console.log('[Mock Fulfillment] Parcel details extracted:', {
      parcelno: parcelDetails.parcelno,
      awb: parcelDetails.awb,
      awb_id_link: parcelDetails.awb_id_link,
      tracking_url: parcelDetails.tracking_url,
    });

    // Step 5: Update order with mock AWB data (EXACT same logic as real fulfillment)
    console.log('[Mock Fulfillment] Updating order with mock AWB data...');

    const updatedOrder = await prisma.order.update({
      where: { id: params.orderId },
      data: {
        status: 'READY_TO_SHIP',
        trackingNumber: parcelDetails.awb, // Real AWB: 631867054753
        airwayBillNumber: parcelDetails.awb, // Same as tracking number
        airwayBillUrl: parcelDetails.awb_id_link, // Mock PDF URL
        airwayBillGenerated: true,
        airwayBillGeneratedAt: new Date(),
        trackingUrl: parcelDetails.tracking_url, // Mock tracking URL
        adminNotes: `[MOCK FULFILLMENT] Testing field mapping without EasyParcel API call. Mock data injected: ${new Date().toISOString()}`,
      },
    });

    console.log('[Mock Fulfillment] ===== ORDER UPDATED SUCCESSFULLY =====');
    console.log('[Mock Fulfillment] Updated order:', {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      trackingNumber: updatedOrder.trackingNumber,
      airwayBillNumber: updatedOrder.airwayBillNumber,
      airwayBillUrl: updatedOrder.airwayBillUrl,
      trackingUrl: updatedOrder.trackingUrl,
      airwayBillGenerated: updatedOrder.airwayBillGenerated,
      airwayBillGeneratedAt: updatedOrder.airwayBillGeneratedAt,
    });

    // Step 6: Return success response
    return NextResponse.json({
      success: true,
      message: '✅ Mock fulfillment completed successfully',
      isMock: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
      },
      tracking: {
        trackingNumber: updatedOrder.trackingNumber,
        awbNumber: updatedOrder.airwayBillNumber,
        labelUrl: updatedOrder.airwayBillUrl,
        trackingUrl: updatedOrder.trackingUrl,
      },
      mockData: {
        easyParcelOrderNo: mockPaymentResponse.result[0].orderno,
        parcelNo: parcelDetails.parcelno,
        awb: parcelDetails.awb,
      },
      note: 'This was a MOCK fulfillment. No real EasyParcel API call was made. No money charged.',
    });
  } catch (error) {
    console.error('[Mock Fulfillment] ===== ERROR =====');
    console.error('[Mock Fulfillment] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Mock fulfillment failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
