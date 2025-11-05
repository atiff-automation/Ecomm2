/**
 * Public Shipping Settings API
 *
 * GET /api/shipping/init - Get public shipping settings for display
 *
 * This is a PUBLIC endpoint (no auth required) that returns only
 * non-sensitive shipping information for customer-facing displays
 * (e.g., free shipping text on product pages).
 *
 * IMPORTANT: Do NOT expose sensitive data (API keys, credentials, etc.)
 *
 * @module api/shipping/init
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShippingSettings } from '@/lib/shipping/shipping-settings';

/**
 * GET /api/shipping/init
 *
 * Returns public shipping settings for customer display purposes
 * No authentication required - this is public data
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch shipping settings (includes all config)
    const settings = await getShippingSettings();

    // If no settings configured, return empty response
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          settings: null,
        },
      });
    }

    // Extract ONLY public-facing settings (no sensitive data)
    const publicSettings = {
      freeShippingEnabled: settings.freeShippingEnabled,
      freeShippingThreshold: settings.freeShippingThreshold,
      freeShippingEligibleStates: settings.freeShippingEligibleStates,
    };

    return NextResponse.json({
      success: true,
      data: {
        settings: publicSettings,
      },
    });
  } catch (error) {
    console.error('[API] Public shipping init error:', error);

    // Don't expose detailed error messages to public
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to load shipping settings',
      },
      { status: 500 }
    );
  }
}
