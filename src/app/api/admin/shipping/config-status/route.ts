/**
 * EasyParcel Configuration Status API
 * Returns detailed status about Business Profile shipping address configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { businessShippingConfig } from '@/lib/config/business-shipping-config';

/**
 * GET - Check EasyParcel configuration status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get detailed configuration status
    const status = await businessShippingConfig.getConfigurationStatus();

    return NextResponse.json({
      success: true,
      data: {
        configured: status.configured,
        errors: status.errors,
        warnings: status.warnings,
        message: status.configured
          ? 'EasyParcel is properly configured'
          : 'EasyParcel configuration incomplete',
        configurationUrl: '/admin/settings/business-profile'
      }
    });

  } catch (error) {
    console.error('❌ Configuration status check error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check configuration status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}