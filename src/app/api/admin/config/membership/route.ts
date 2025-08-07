/**
 * Membership Configuration API - Malaysian E-commerce Platform
 * Admin API for managing membership system settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';

const membershipConfigSchema = z.object({
  membershipThreshold: z.number().min(1, 'Threshold must be at least RM 1'),
  enablePromotionalExclusion: z.boolean(),
  requireQualifyingCategories: z.boolean(),
  membershipBenefitsText: z.string().optional(),
  membershipTermsText: z.string().optional(),
});

/**
 * GET /api/admin/config/membership - Get membership configuration
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check admin permissions
    if (
      !session?.user ||
      !['ADMIN', 'STAFF', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get membership configuration from SystemConfig
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'membership_threshold',
            'enable_promotional_exclusion',
            'require_qualifying_categories',
            'membership_benefits_text',
            'membership_terms_text',
          ],
        },
      },
    });

    // Convert to object with defaults
    const configMap = configs.reduce(
      (acc, config) => {
        let value: string | number | boolean = config.value;

        // Parse based on type
        if (config.type === 'number') {
          value = parseFloat(config.value);
        } else if (config.type === 'boolean') {
          value = config.value === 'true';
        }

        acc[config.key] = value;
        return acc;
      },
      {} as Record<string, string | number | boolean>
    );

    // Apply defaults
    const membershipConfig = {
      membershipThreshold: configMap.membership_threshold || 80,
      enablePromotionalExclusion:
        configMap.enable_promotional_exclusion ?? true,
      requireQualifyingCategories:
        configMap.require_qualifying_categories ?? true,
      membershipBenefitsText:
        configMap.membership_benefits_text ||
        'Enjoy exclusive member pricing on all products and special promotions.',
      membershipTermsText:
        configMap.membership_terms_text ||
        'Membership is activated automatically when you spend the qualifying amount.',
    };

    return NextResponse.json({ config: membershipConfig });
  } catch (error) {
    console.error('Error fetching membership config:', error);
    return NextResponse.json(
      { message: 'Failed to fetch membership configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/config/membership - Update membership configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check admin permissions
    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedConfig = membershipConfigSchema.parse(body);

    // Update configuration in SystemConfig
    const configUpdates = [
      {
        key: 'membership_threshold',
        value: validatedConfig.membershipThreshold.toString(),
        type: 'number',
      },
      {
        key: 'enable_promotional_exclusion',
        value: validatedConfig.enablePromotionalExclusion.toString(),
        type: 'boolean',
      },
      {
        key: 'require_qualifying_categories',
        value: validatedConfig.requireQualifyingCategories.toString(),
        type: 'boolean',
      },
      {
        key: 'membership_benefits_text',
        value: validatedConfig.membershipBenefitsText || '',
        type: 'string',
      },
      {
        key: 'membership_terms_text',
        value: validatedConfig.membershipTermsText || '',
        type: 'string',
      },
    ];

    // Use transaction to update all configs
    await prisma.$transaction(
      configUpdates.map(config =>
        prisma.systemConfig.upsert({
          where: { key: config.key },
          update: {
            value: config.value,
            type: config.type,
          },
          create: {
            key: config.key,
            value: config.value,
            type: config.type,
          },
        })
      )
    );

    // Log the configuration change
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'SystemConfig',
        resourceId: 'membership_config',
        details: {
          old: 'Previous membership configuration',
          new: validatedConfig,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: 'Membership configuration updated successfully',
      config: validatedConfig,
    });
  } catch (error) {
    console.error('Error updating membership config:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid configuration data', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to update membership configuration' },
      { status: 500 }
    );
  }
}
