/**

export const dynamic = 'force-dynamic';

 * EasyParcel Credit Balance Check API
 * Test endpoint for checking EasyParcel demo account credit balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';

/**
 * GET - Check EasyParcel credit balance
 */
export async function GET(request: NextRequest) {
  try {
    // Use singleton service instance

    console.log('🔍 Checking EasyParcel credit balance...');
    const startTime = Date.now();

    const creditInfo = await easyParcelService.checkCreditBalance();
    const responseTime = Date.now() - startTime;

    console.log('✅ Credit balance check completed:', {
      balance: creditInfo.balance,
      currency: creditInfo.currency,
      wallets: creditInfo.wallets?.length || 0,
      responseTime: `${responseTime}ms`,
    });

    return NextResponse.json({
      success: true,
      creditBalance: creditInfo,
      metadata: {
        responseTime: responseTime,
        timestamp: new Date().toISOString(),
        endpoint: process.env.EASYPARCEL_BASE_URL,
        sandbox: process.env.EASYPARCEL_SANDBOX === 'true',
      },
    });
  } catch (error) {
    console.error('❌ Credit balance check error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Credit balance check failed',
        metadata: {
          timestamp: new Date().toISOString(),
          endpoint: process.env.EASYPARCEL_BASE_URL,
        },
      },
      { status: 500 }
    );
  }
}
