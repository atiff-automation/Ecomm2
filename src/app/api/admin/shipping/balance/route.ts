/**
 * EasyParcel Account Balance API Route
 *
 * GET /api/admin/shipping/balance - Get current EasyParcel credit balance
 *
 * @module api/admin/shipping/balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getShippingSettingsOrThrow } from '@/lib/shipping/shipping-settings';
import { createEasyParcelService } from '@/lib/shipping/easyparcel-service';

/**
 * GET /api/admin/shipping/balance
 *
 * Retrieve current EasyParcel account credit balance
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized - Login required' }, { status: 401 });
    }

    // Authorization check
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get shipping settings
    const settings = await getShippingSettingsOrThrow();

    // Create EasyParcel service
    const service = createEasyParcelService(settings);

    // Fetch balance
    const balanceResponse = await service.getBalance();

    if (!balanceResponse.success || !balanceResponse.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'BALANCE_FETCH_FAILED',
          message: 'Failed to fetch balance from EasyParcel',
        },
        { status: 500 }
      );
    }

    const amount = balanceResponse.data.balance;
    const threshold = 50.00;
    const lowBalance = amount < threshold;

    return NextResponse.json({
      success: true,
      balance: {
        amount,
        currency: balanceResponse.data.currency,
        formatted: `RM ${amount.toFixed(2)}`,
        lowBalance,
        threshold,
        ...(lowBalance && {
          warning: 'Your balance is running low. Top up to avoid fulfillment failures.',
        }),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Get balance error:', error);

    // Handle configuration errors
    if (error instanceof Error && error.message.includes('not configured')) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_CONFIGURED',
          message: 'Shipping is not configured. Please configure shipping settings first.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve account balance',
      },
      { status: 500 }
    );
  }
}
