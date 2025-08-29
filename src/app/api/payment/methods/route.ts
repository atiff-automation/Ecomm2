/**
 * Payment Methods API
 * Returns available payment methods for customer selection
 */

import { NextRequest, NextResponse } from 'next/server';
import { paymentRouter } from '@/lib/payments/payment-router';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Getting available payment methods');

    // Get available payment methods
    const availableMethods = await paymentRouter.getAvailablePaymentMethods();
    const gatewayAvailability = await paymentRouter.getGatewayAvailability();
    const defaultMethod = await paymentRouter.getDefaultPaymentMethod();

    // Filter to only return available methods
    const activeMethods = availableMethods.filter(method => method.available);

    console.log('📋 Available payment methods:', {
      total: availableMethods.length,
      active: activeMethods.length,
      default: defaultMethod,
    });

    return NextResponse.json({
      success: true,
      methods: availableMethods,
      activeMethods: activeMethods,
      defaultMethod: defaultMethod,
      availability: gatewayAvailability,
      hasAvailableGateways: activeMethods.length > 0,
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get payment methods',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
