/**

export const dynamic = 'force-dynamic';

 * Admin Membership Configuration API - Malaysian E-commerce Platform
 * Handles admin membership configuration management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logAudit } from '@/lib/audit/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * GET /api/admin/membership/config - Get membership configuration
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
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

    const configMap = configs.reduce(
      (acc, config) => {
        let value: string | number | boolean = config.value;

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

    const membershipConfig = {
      membershipThreshold: configMap.membership_threshold
        ? parseFloat(configMap.membership_threshold.toString())
        : 80,
      enablePromotionalExclusion: Boolean(
        configMap.enable_promotional_exclusion
      ),
      requireQualifyingCategories: Boolean(
        configMap.require_qualifying_categories
      ),
      membershipBenefitsText:
        configMap.membership_benefits_text?.toString() ||
        'Enjoy exclusive member pricing on all products and special promotions.',
      membershipTermsText:
        configMap.membership_terms_text?.toString() ||
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
 * PUT /api/admin/membership/config - Update membership configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      membershipThreshold,
      enablePromotionalExclusion,
      requireQualifyingCategories,
      membershipBenefitsText,
      membershipTermsText,
    } = body;

    // Validate membership threshold
    if (!membershipThreshold || membershipThreshold <= 0) {
      return NextResponse.json(
        { message: 'Membership threshold must be greater than 0' },
        { status: 400 }
      );
    }

    if (membershipThreshold > 10000) {
      return NextResponse.json(
        { message: 'Membership threshold cannot exceed MYR 10,000' },
        { status: 400 }
      );
    }

    // Validate text fields
    if (!membershipBenefitsText?.trim() || !membershipTermsText?.trim()) {
      return NextResponse.json(
        { message: 'Benefits and terms text are required' },
        { status: 400 }
      );
    }

    // Configuration updates
    const configUpdates = [
      {
        key: 'membership_threshold',
        value: membershipThreshold.toString(),
        type: 'number',
      },
      {
        key: 'enable_promotional_exclusion',
        value: enablePromotionalExclusion.toString(),
        type: 'boolean',
      },
      {
        key: 'require_qualifying_categories',
        value: requireQualifyingCategories.toString(),
        type: 'boolean',
      },
      {
        key: 'membership_benefits_text',
        value: membershipBenefitsText.trim(),
        type: 'text',
      },
      {
        key: 'membership_terms_text',
        value: membershipTermsText.trim(),
        type: 'text',
      },
    ];

    // Update configuration using upsert for each setting
    await Promise.all(
      configUpdates.map(async config => {
        await prisma.systemConfig.upsert({
          where: { key: config.key },
          update: {
            value: config.value,
            updatedAt: new Date(),
          },
          create: {
            key: config.key,
            value: config.value,
            type: config.type,
          },
        });
      })
    );

    // Create audit log for configuration changes
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'MembershipConfig',
        resourceId: 'membership-settings',
        details: {
          configUpdates: {
            membershipThreshold,
            enablePromotionalExclusion,
            requireQualifyingCategories,
            membershipBenefitsText: membershipBenefitsText.trim(),
            membershipTermsText: membershipTermsText.trim(),
          },
          updatedAt: new Date().toISOString(),
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: 'Membership configuration updated successfully',
      config: {
        membershipThreshold,
        enablePromotionalExclusion,
        requireQualifyingCategories,
        membershipBenefitsText: membershipBenefitsText.trim(),
        membershipTermsText: membershipTermsText.trim(),
      },
    });
  } catch (error) {
    console.error('Error updating membership config:', error);
    return NextResponse.json(
      { message: 'Failed to update membership configuration' },
      { status: 500 }
    );
  }
}
