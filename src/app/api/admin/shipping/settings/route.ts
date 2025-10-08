/**
 * Shipping Settings API Routes
 *
 * GET    /api/admin/shipping/settings - Get current shipping settings
 * POST   /api/admin/shipping/settings - Save/update shipping settings
 * DELETE /api/admin/shipping/settings - Delete shipping settings
 *
 * @module api/admin/shipping/settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getShippingSettings,
  saveShippingSettings,
  isShippingConfigured,
  deleteShippingSettings,
} from '@/lib/shipping/shipping-settings';
import { createEasyParcelService } from '@/lib/shipping/easyparcel-service';
import { ShippingSettingsValidationSchema } from '@/lib/shipping/validation';
import type { ShippingSettings } from '@/lib/shipping/types';
import { validatePickupAddress } from '@/lib/shipping/business-profile-integration';

/**
 * GET /api/admin/shipping/settings
 *
 * Retrieve current shipping settings
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

    // Fetch settings
    const settings = await getShippingSettings();
    const configured = await isShippingConfigured();

    return NextResponse.json({
      success: true,
      data: {
        settings,
        configured,
      },
    });
  } catch (error) {
    console.error('[API] Get shipping settings error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve shipping settings',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/shipping/settings
 *
 * Save or update shipping settings
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body using centralized schema
    const body = await request.json();
    const validation = ShippingSettingsValidationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid settings data',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const settingsData = validation.data;

    // Clear unused strategy data to prevent conflicts
    // Only keep the data relevant to the selected strategy
    if (settingsData.courierSelectionMode === 'selected') {
      // SELECTED mode: keep selectedCouriers, clear priorityCouriers
      settingsData.priorityCouriers = undefined;
    } else if (settingsData.courierSelectionMode === 'priority') {
      // PRIORITY mode: keep priorityCouriers, clear selectedCouriers
      settingsData.selectedCouriers = undefined;
    } else {
      // CHEAPEST or SHOW_ALL modes: clear both (not needed)
      settingsData.selectedCouriers = undefined;
      settingsData.priorityCouriers = undefined;
    }

    // Validate pickup address from BusinessProfile BEFORE saving
    const pickupValidation = await validatePickupAddress();

    if (!pickupValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_PICKUP_ADDRESS',
          message: 'Pickup address validation failed. Please configure your shipping address in Business Profile.',
          details: {
            errors: pickupValidation.errors,
            warnings: pickupValidation.warnings,
          },
        },
        { status: 400 }
      );
    }

    // Test API connection before saving
    try {
      const testService = createEasyParcelService({
        apiKey: settingsData.apiKey,
        environment: settingsData.environment,
      } as ShippingSettings);

      await testService.testConnection();
    } catch (error) {
      console.error('[API] EasyParcel connection test failed:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_API_KEY',
          message: 'Failed to connect to EasyParcel API. Please check your API key.',
        },
        { status: 400 }
      );
    }

    // Save settings
    const savedSettings = await saveShippingSettings(settingsData);

    console.log('[API] Shipping settings saved successfully by:', session.user.email);
    console.log('[API] WhatsApp notifications enabled:', savedSettings.whatsappNotificationsEnabled);

    return NextResponse.json({
      success: true,
      data: savedSettings,
      message: 'Shipping settings saved successfully',
    });
  } catch (error) {
    console.error('[API] Save shipping settings error:', error);

    // Handle validation errors from shipping-settings.ts
    if (error instanceof Error && error.message.includes('validation failed')) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to save shipping settings',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/shipping/settings
 *
 * Delete shipping settings from database
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized - Login required' }, { status: 401 });
    }

    // Authorization check - ADMIN or SUPERADMIN can delete settings
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required to delete settings' },
        { status: 403 }
      );
    }

    // Delete settings
    await deleteShippingSettings();

    console.log('[API] Shipping settings deleted by:', session.user.email);

    return NextResponse.json({
      success: true,
      message: 'Shipping settings deleted successfully',
    });
  } catch (error) {
    console.error('[API] Delete shipping settings error:', error);

    // Handle case where settings don't exist
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'No shipping settings found to delete',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to delete shipping settings',
      },
      { status: 500 }
    );
  }
}

/**
 * NOTE: Validation schema moved to centralized location
 * @see /src/lib/shipping/validation.ts
 *
 * All validation now uses ShippingSettingsValidationSchema imported above.
 * This ensures consistent validation across frontend, API, and service layers.
 */
