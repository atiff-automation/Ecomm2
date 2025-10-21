/**
 * Public Membership Configuration Display API
 * Provides membership config for client-side components
 * No authentication required - read-only public config
 */

import { NextResponse } from 'next/server';
import { getMembershipConfiguration } from '@/lib/config/membership-config';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/membership/config/display
 * Returns membership configuration for UI display purposes
 */
export async function GET() {
  try {
    const config = await getMembershipConfiguration();

    return NextResponse.json({
      enablePromotionalExclusion: config.enablePromotionalExclusion,
      requireQualifyingProducts: config.requireQualifyingProducts,
      membershipThreshold: config.membershipThreshold,
    });
  } catch (error) {
    console.error('Error fetching membership display config:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch membership configuration',
        // Return defaults on error
        enablePromotionalExclusion: true,
        requireQualifyingProducts: true,
        membershipThreshold: 80,
      },
      { status: 500 }
    );
  }
}
