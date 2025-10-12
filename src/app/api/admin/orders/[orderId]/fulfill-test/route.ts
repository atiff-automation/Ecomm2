/**
 * Mock Fulfillment Test API Route
 *
 * PURPOSE: Test payment validation logic with captured EasyParcel responses
 * NO COST: Does NOT call real EasyParcel API - uses mock responses
 *
 * This endpoint simulates the fulfillment process using real captured
 * API responses, allowing you to verify the validation logic works
 * correctly on production without incurring EasyParcel charges.
 *
 * Usage:
 * POST /api/admin/orders/[orderId]/fulfill-test
 * Body: { mode: 'success' | 'insufficient_balance' | 'custom', customResponse?: {...} }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SHIPPING_ERROR_CODES } from '@/lib/shipping/constants';

// Real EasyParcel payment response structure
interface EasyParcelPaymentResponse {
  api_status: string;
  error_code: string;
  error_remark: string;
  result: Array<{
    status: string;
    remarks: string;
    orderno?: string;
    messagenow?: string;
    parcel?: Array<{
      parcelno: string;
      awb: string;
      awb_id_link: string;
      tracking_url: string;
    }>;
  }>;
}

// Request schema
const testFulfillmentSchema = z.object({
  mode: z.enum(['success', 'insufficient_balance', 'custom']).default('success'),
  customResponse: z.any().optional(),
});

// REAL CAPTURED RESPONSES FROM PRODUCTION

// Response from order ORD-20251012-NJCX (2025-10-12)
// This is the actual response that failed with old validation
const MOCK_SUCCESS_RESPONSE: EasyParcelPaymentResponse = {
  api_status: 'Success',
  error_code: '0',
  error_remark: '',
  result: [
    {
      status: 'Success',
      orderno: 'EI-ZQ932',
      messagenow: 'Payment Done',  // ⚠️ NOT "Fully Paid" - caused the original failure
      remarks: '',
      parcel: [
        {
          parcelno: 'EP-A2V7KE',
          awb: '631875892940',
          awb_id_link: 'https://connect.easyparcel.my/?ac=AWBLabel&id=RVAtMTBGcWlpNVpQIzI2OTY0ODA1OA%3D%3D',
          tracking_url: 'https://app.easyparcel.com/my/en/track/details/?courier=JnT-Express&awb=631875892940',
        },
      ],
    },
  ],
};

// Mock insufficient balance response (simulated)
const MOCK_INSUFFICIENT_BALANCE_RESPONSE: EasyParcelPaymentResponse = {
  api_status: 'Success',
  error_code: '0',
  error_remark: '',
  result: [
    {
      status: 'Success',
      messagenow: 'Insufficient Balance',
      remarks: 'Please top up your EasyParcel credit',
      parcel: [],  // No AWB generated = payment failed
    },
  ],
};

/**
 * Validate payment response (same logic as easyparcel-service.ts)
 */
function validateMockPaymentResponse(response: EasyParcelPaymentResponse, orderNumber: string) {
  console.log('[MockTest] Validating payment response...');
  console.log('[MockTest] Response:', JSON.stringify(response, null, 2));

  // Step 1: Check API status
  if (response.api_status !== 'Success' || response.error_code !== '0') {
    throw new Error(response.error_remark || 'Failed to process order payment');
  }

  // Step 2: Extract bulk result
  const bulkResult = response.result?.[0];
  if (!bulkResult || bulkResult.status !== 'Success') {
    throw new Error(bulkResult?.remarks || 'Failed to process order payment');
  }

  // Step 3: Check for parcel data (THE CRITICAL CHECK)
  const parcels = bulkResult.parcel || [];
  console.log('[MockTest] Parcel count:', parcels.length);

  if (parcels.length === 0) {
    console.log('[MockTest] ❌ No parcel data - payment failed');
    throw new Error('No parcel details returned after payment');
  }

  // Step 4: Check messagenow for actual failures only
  console.log('[MockTest] messagenow:', bulkResult.messagenow);
  if (bulkResult.messagenow) {
    const message = bulkResult.messagenow.toLowerCase();
    if (message.includes('insufficient') || message.includes('not enough credit')) {
      console.log('[MockTest] ❌ Insufficient balance detected');
      throw new Error(bulkResult.messagenow);
    }
  }

  // Step 5: Success! Extract AWB details
  const firstParcel = parcels[0];
  console.log('[MockTest] ✅ Payment validated successfully');
  console.log('[MockTest] AWB:', firstParcel.awb);

  return {
    success: true,
    data: {
      order_number: bulkResult.orderno || orderNumber,
      payment_status: bulkResult.messagenow,
      parcels: parcels.map((p) => ({
        parcelno: p.parcelno,
        awb: p.awb,
        awb_id_link: p.awb_id_link,
        tracking_url: p.tracking_url,
      })),
    },
  };
}

/**
 * POST /api/admin/orders/[orderId]/fulfill-test
 * Test fulfillment with mock EasyParcel responses
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { orderId } = params;

    console.log('[MockTest] ========================================');
    console.log('[MockTest] MOCK FULFILLMENT TEST STARTING');
    console.log('[MockTest] Order ID:', orderId);
    console.log('[MockTest] ========================================');

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        trackingNumber: true,
        airwayBillNumber: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('[MockTest] Order found:', {
      orderNumber: order.orderNumber,
      status: order.status,
      hasTracking: !!order.trackingNumber,
    });

    // Parse request body
    const body = await request.json();
    const validation = testFulfillmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { mode, customResponse } = validation.data;

    // Select mock response based on mode
    let mockResponse: EasyParcelPaymentResponse;

    switch (mode) {
      case 'success':
        mockResponse = MOCK_SUCCESS_RESPONSE;
        console.log('[MockTest] Using SUCCESS response (Payment Done)');
        break;

      case 'insufficient_balance':
        mockResponse = MOCK_INSUFFICIENT_BALANCE_RESPONSE;
        console.log('[MockTest] Using INSUFFICIENT BALANCE response');
        break;

      case 'custom':
        if (!customResponse) {
          return NextResponse.json(
            { success: false, message: 'customResponse required for custom mode' },
            { status: 400 }
          );
        }
        mockResponse = customResponse as EasyParcelPaymentResponse;
        console.log('[MockTest] Using CUSTOM response');
        break;

      default:
        mockResponse = MOCK_SUCCESS_RESPONSE;
    }

    // Simulate payment validation
    try {
      const validationResult = validateMockPaymentResponse(
        mockResponse,
        `TEST-${order.orderNumber}`
      );

      console.log('[MockTest] ========================================');
      console.log('[MockTest] ✅ VALIDATION PASSED');
      console.log('[MockTest] ========================================');
      console.log('[MockTest] Result:', JSON.stringify(validationResult, null, 2));

      return NextResponse.json({
        success: true,
        message: 'Mock fulfillment test passed! Validation logic accepted the response.',
        test: {
          mode,
          orderNumber: order.orderNumber,
          orderId: order.id,
        },
        // Use exact field names from EasyParcel API response
        easyparcel_response: validationResult.data,
        note: 'This was a TEST - no real API calls made, order NOT updated in database',
      });
    } catch (error) {
      console.log('[MockTest] ========================================');
      console.log('[MockTest] ❌ VALIDATION FAILED');
      console.log('[MockTest] ========================================');
      console.error('[MockTest] Error:', error);

      return NextResponse.json(
        {
          success: false,
          message: 'Mock fulfillment test failed! Validation logic rejected the response.',
          test: {
            mode,
            orderNumber: order.orderNumber,
            orderId: order.id,
          },
          error: error instanceof Error ? error.message : 'Unknown error',
          note: 'This was a TEST - no real API calls made, order NOT updated in database',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[MockTest] ❌ Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Mock fulfillment test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
