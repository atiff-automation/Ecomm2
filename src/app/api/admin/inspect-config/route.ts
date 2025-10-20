/**
 * Admin endpoint to inspect site customization configuration
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { siteCustomizationService } from '@/lib/services/site-customization.service';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get raw database record
    const dbRecord = await prisma.siteCustomization.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // Get service configuration
    const serviceConfig = await siteCustomizationService.getConfiguration();

    return NextResponse.json({
      success: true,
      debug: {
        hasDbRecord: !!dbRecord,
        dbRecordId: dbRecord?.id,
        dbConfigHero: dbRecord?.config ? (dbRecord.config as any).hero : null,
        serviceConfigHero: serviceConfig.hero,
        fullServiceConfig: serviceConfig,
        rawDbConfig: dbRecord?.config,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
