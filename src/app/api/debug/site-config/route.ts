/**
 * Debug endpoint to test site customization configuration
 */

import { NextResponse } from 'next/server';
import { siteCustomizationService } from '@/lib/services/site-customization.service';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get raw database record
    const dbRecord = await prisma.siteCustomization.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
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
        rawDbConfig: dbRecord?.config
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
