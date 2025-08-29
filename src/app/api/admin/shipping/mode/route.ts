/**
 * Shipping Mode Configuration API
 * Toggle between EasyParcel API mode and CSV export mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const modeConfigSchema = z.object({
  mode: z.enum(['api', 'csv']),
  reason: z.string().optional(),
});

/**
 * GET - Get current shipping mode configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current mode configuration
    const modeConfig = await prisma.systemConfig.findUnique({
      where: { key: 'shipping_mode' },
    });

    const currentMode = modeConfig?.value
      ? JSON.parse(modeConfig.value)
      : {
          mode: 'api',
          reason: null,
          updatedAt: null,
          updatedBy: null,
        };

    // Get EasyParcel API status
    const easyParcelStatus = {
      configured: !!(
        process.env.EASYPARCEL_API_KEY && process.env.EASYPARCEL_API_SECRET
      ),
      sandbox: process.env.EASYPARCEL_SANDBOX === 'true',
      hasApiKey: !!process.env.EASYPARCEL_API_KEY,
      hasApiSecret: !!process.env.EASYPARCEL_API_SECRET,
    };

    return NextResponse.json({
      success: true,
      currentMode: currentMode.mode,
      configuration: currentMode,
      easyParcelStatus,
      recommendations: {
        useAPI: easyParcelStatus.configured && easyParcelStatus.hasApiKey,
        useCSV: !easyParcelStatus.configured || currentMode.mode === 'csv',
        note: easyParcelStatus.configured
          ? 'EasyParcel API is configured and available'
          : 'EasyParcel API not configured - CSV mode recommended',
      },
    });
  } catch (error) {
    console.error('Error getting shipping mode:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get shipping mode configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST - Update shipping mode configuration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mode, reason } = modeConfigSchema.parse(body);

    console.log(
      `[Shipping Mode] Mode change to "${mode}" requested by ${session.user.email}`,
      {
        previousMode: 'unknown',
        reason,
      }
    );

    // Update system configuration
    const configuration = {
      mode,
      reason: reason || null,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.email,
      updatedById: session.user.id,
    };

    await prisma.systemConfig.upsert({
      where: { key: 'shipping_mode' },
      update: {
        value: JSON.stringify(configuration),
        updatedAt: new Date(),
      },
      create: {
        key: 'shipping_mode',
        value: JSON.stringify(configuration),
        type: 'JSON',
      },
    });

    // Log the mode change
    console.log(
      `[Shipping Mode] Successfully changed to "${mode}" by ${session.user.email}`
    );

    return NextResponse.json({
      success: true,
      message: `Shipping mode changed to ${mode.toUpperCase()}`,
      configuration,
      effectiveImmediately: true,
    });
  } catch (error) {
    console.error('Error updating shipping mode:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid mode configuration',
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update shipping mode' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Reset to automatic mode detection
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine automatic mode based on API availability
    const easyParcelConfigured = !!(
      process.env.EASYPARCEL_API_KEY && process.env.EASYPARCEL_API_SECRET
    );
    const automaticMode = easyParcelConfigured ? 'api' : 'csv';

    const configuration = {
      mode: automaticMode,
      reason: `Automatically detected - API ${easyParcelConfigured ? 'available' : 'not configured'}`,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.email,
      updatedById: session.user.id,
      automatic: true,
    };

    await prisma.systemConfig.upsert({
      where: { key: 'shipping_mode' },
      update: {
        value: JSON.stringify(configuration),
        updatedAt: new Date(),
      },
      create: {
        key: 'shipping_mode',
        value: JSON.stringify(configuration),
        type: 'JSON',
      },
    });

    console.log(
      `[Shipping Mode] Auto-detected mode: ${automaticMode} by ${session.user.email}`
    );

    return NextResponse.json({
      success: true,
      message: `Shipping mode automatically set to ${automaticMode.toUpperCase()}`,
      configuration,
      autoDetected: true,
    });
  } catch (error) {
    console.error('Error auto-detecting shipping mode:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to auto-detect shipping mode' },
      { status: 500 }
    );
  }
}
