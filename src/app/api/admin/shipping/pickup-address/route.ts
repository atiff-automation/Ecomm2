/**
 * Pickup Address API Route
 *
 * GET /api/admin/shipping/pickup-address - Get pickup address from BusinessProfile
 *
 * This endpoint provides read-only access to pickup address (sender information)
 * derived from BusinessProfile.shippingAddress (single source of truth).
 *
 * @module api/admin/shipping/pickup-address
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getPickupAddressFromBusinessProfile,
  validatePickupAddress,
} from '@/lib/shipping/business-profile-integration';

/**
 * GET /api/admin/shipping/pickup-address
 *
 * Retrieve pickup address from BusinessProfile with validation status
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

    // Fetch pickup address from BusinessProfile
    const pickupAddress = await getPickupAddressFromBusinessProfile();

    // Validate pickup address
    const validation = await validatePickupAddress();

    return NextResponse.json({
      success: true,
      data: {
        pickupAddress,
        validation: {
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings,
        },
      },
    });
  } catch (error) {
    console.error('[API] Get pickup address error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve pickup address',
      },
      { status: 500 }
    );
  }
}
