/**

export const dynamic = 'force-dynamic';

 * Admin Shipping Credentials Status API
 * Production-ready credential status endpoint following @CLAUDE.md principles
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { easyParcelCredentialsService } from '@/lib/services/easyparcel-credentials';

/**
 * GET - Get credential status for admin UI
 * Follows @CLAUDE.md single source of truth principle
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

    // Get credential status from centralized service
    const status = await easyParcelCredentialsService.getCredentialStatus();

    // Add environment context for UI display
    const isProduction = process.env.NODE_ENV === 'production';
    const isStrictMode = isProduction || process.env.EASYPARCEL_STRICT_MODE === 'true';

    return NextResponse.json({
      success: true,
      status: {
        ...status,
        source: status.isUsingEnvFallback
          ? 'environment'
          : status.hasCredentials
            ? 'database'
            : 'none',
        productionMode: isProduction,
        strictMode: isStrictMode,
      },
    });
  } catch (error) {
    console.error('❌ Credential status error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve credential status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}