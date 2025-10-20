/**
 * Shipping Initialization API Route
 *
 * GET /api/admin/shipping/init - Get all initial shipping data
 *
 * Returns: settings, pickup address, validation, and balance (conditional)
 * This endpoint combines 3 separate endpoints into one for efficiency.
 *
 * Phase 4: Combined Init Endpoint - Reduces 3 API calls to 1
 *
 * @module api/admin/shipping/init
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getShippingSettings,
  isShippingConfigured,
} from '@/lib/shipping/shipping-settings';
import {
  getPickupAddressFromBusinessProfile,
  validatePickupAddress,
} from '@/lib/shipping/business-profile-integration';
import { createEasyParcelService } from '@/lib/shipping/easyparcel-service';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Login required' },
        { status: 401 }
      );
    }

    // Authorization check
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Phase 4: Parallel fetch: Settings + Pickup (no dependencies)
    const [settings, configured, pickupAddress, pickupValidation] =
      await Promise.all([
        getShippingSettings(),
        isShippingConfigured(),
        getPickupAddressFromBusinessProfile(),
        validatePickupAddress(),
      ]);

    // Initialize response
    const responseData: {
      settings: any;
      configured: boolean;
      pickupAddress: any;
      pickupValidation: {
        isValid: boolean;
        errors: string[];
        warnings: string[];
      };
      balance?: {
        amount: number;
        currency: string;
        formatted: string;
        lowBalance: boolean;
        threshold: number;
        warning?: string;
      };
      balanceTimestamp?: string;
      balanceError?: string;
    } = {
      settings,
      configured,
      pickupAddress,
      pickupValidation: {
        isValid: pickupValidation.isValid,
        errors: pickupValidation.errors,
        warnings: pickupValidation.warnings,
      },
    };

    // Conditional: Fetch balance only if configured
    // CRITICAL: This preserves the "balance on page load" requirement
    if (configured && settings) {
      try {
        const service = createEasyParcelService(settings);
        const balanceResponse = await service.getBalance();

        if (balanceResponse.success && balanceResponse.data) {
          const amount = balanceResponse.data.balance;
          const threshold = 50.0;
          const lowBalance = amount < threshold;

          responseData.balance = {
            amount,
            currency: balanceResponse.data.currency,
            formatted: `RM ${amount.toFixed(2)}`,
            lowBalance,
            threshold,
            ...(lowBalance && {
              warning:
                'Your balance is running low. Top up to avoid fulfillment failures.',
            }),
          };
          responseData.balanceTimestamp = new Date().toISOString();
        } else {
          responseData.balanceError = 'Failed to fetch balance from EasyParcel';
        }
      } catch (balanceError) {
        console.error('[API] Balance fetch error in init:', balanceError);
        responseData.balanceError =
          balanceError instanceof Error
            ? balanceError.message
            : 'Failed to fetch balance';
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('[API] Shipping init error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to initialize shipping data',
      },
      { status: 500 }
    );
  }
}
