import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { taxConfigurationSchema } from '@/lib/validation/settings';
import { AuditLogger } from '@/lib/security';

/**
 * GET /api/admin/settings/tax-configuration - Get tax configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and superadmins can access tax configuration
    if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get active tax configurations
    const taxConfigurations = await prisma.taxConfiguration.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!taxConfigurations || taxConfigurations.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No tax configuration found'
      });
    }

    // For simplicity, we'll take the first (most recent) active configuration
    // In a more complex system, you might want to handle multiple configurations
    const primaryConfig = taxConfigurations[0];

    // Transform to match frontend expected format
    const configData = {
      id: primaryConfig.id,
      gstRegistered: primaryConfig.taxType === 'GST' || taxConfigurations.some(c => c.taxType === 'GST'),
      gstNumber: taxConfigurations.find(c => c.taxType === 'GST')?.taxNumber || '',
      sstRegistered: primaryConfig.taxType === 'SST' || taxConfigurations.some(c => c.taxType === 'SST'),
      sstNumber: taxConfigurations.find(c => c.taxType === 'SST')?.taxNumber || '',
      defaultGstRate: taxConfigurations.find(c => c.taxType === 'GST')?.rate || 6.0,
      defaultSstRate: taxConfigurations.find(c => c.taxType === 'SST')?.rate || 10.0,
      taxInclusivePricing: primaryConfig.settings?.taxInclusivePricing || false,
      autoCalculateTax: primaryConfig.settings?.autoCalculateTax !== false,
      taxRates: [], // We'll implement custom tax rates in a future update
      createdAt: primaryConfig.createdAt,
      updatedAt: primaryConfig.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: configData
    });

  } catch (error) {
    console.error('Get tax configuration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/tax-configuration - Update tax configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and superadmins can update tax configuration
    if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = taxConfigurationSchema.parse(body);

    // Get current configurations for audit logging
    const currentConfigs = await prisma.taxConfiguration.findMany({
      where: { isActive: true }
    });

    // Deactivate existing configurations in a transaction
    const updatedConfigs = await prisma.$transaction(async (tx) => {
      // Deactivate all current configurations
      await tx.taxConfiguration.updateMany({
        where: { isActive: true },
        data: { 
          isActive: false,
          updatedAt: new Date(),
          updatedBy: session.user.id
        }
      });

      const newConfigs = [];

      // Create GST configuration if registered
      if (validatedData.gstRegistered) {
        const gstConfig = await tx.taxConfiguration.create({
          data: {
            taxType: 'GST',
            taxNumber: validatedData.gstNumber || null,
            rate: validatedData.defaultGstRate,
            isActive: true,
            settings: {
              taxInclusivePricing: validatedData.taxInclusivePricing,
              autoCalculateTax: validatedData.autoCalculateTax
            },
            createdBy: session.user.id,
            updatedBy: session.user.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        newConfigs.push(gstConfig);
      }

      // Create SST configuration if registered
      if (validatedData.sstRegistered) {
        const sstConfig = await tx.taxConfiguration.create({
          data: {
            taxType: 'SST',
            taxNumber: validatedData.sstNumber || null,
            rate: validatedData.defaultSstRate,
            isActive: true,
            settings: {
              taxInclusivePricing: validatedData.taxInclusivePricing,
              autoCalculateTax: validatedData.autoCalculateTax
            },
            createdBy: session.user.id,
            updatedBy: session.user.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        newConfigs.push(sstConfig);
      }

      // If no tax registration is selected, create a default configuration
      if (!validatedData.gstRegistered && !validatedData.sstRegistered) {
        const defaultConfig = await tx.taxConfiguration.create({
          data: {
            taxType: 'NONE',
            taxNumber: null,
            rate: 0,
            isActive: true,
            settings: {
              taxInclusivePricing: validatedData.taxInclusivePricing,
              autoCalculateTax: validatedData.autoCalculateTax
            },
            createdBy: session.user.id,
            updatedBy: session.user.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        newConfigs.push(defaultConfig);
      }

      return newConfigs;
    });

    // Log the change for audit
    await AuditLogger.logUserSettingsChange(
      session.user.id,
      'TAX_CONFIGURATION',
      {
        action: 'UPDATE_TAX_CONFIGURATION',
        oldConfigs: currentConfigs.map(config => ({
          taxType: config.taxType,
          rate: config.rate,
          isActive: config.isActive
        }))
      },
      {
        action: 'UPDATE_TAX_CONFIGURATION',
        newConfigs: updatedConfigs.map(config => ({
          taxType: config.taxType,
          rate: config.rate,
          isActive: config.isActive
        })),
        gstRegistered: validatedData.gstRegistered,
        sstRegistered: validatedData.sstRegistered
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Tax configuration updated successfully',
      data: {
        configurationsCreated: updatedConfigs.length,
        gstEnabled: validatedData.gstRegistered,
        sstEnabled: validatedData.sstRegistered
      }
    });

  } catch (error) {
    console.error('Update tax configuration error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}