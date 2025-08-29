/**
 * Admin Tax Configuration API
 * Enhanced Malaysian tax settings with EasyParcel integration
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 6.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import {
  MalaysianTaxService,
  ProductTaxCategory,
  ServiceTaxCategory,
} from '@/lib/tax/malaysian-tax-service';
import { z } from 'zod';

const taxConfigSchema = z.object({
  salesTaxRate: z.number().min(0).max(1), // 0-100% as decimal
  serviceTaxRate: z.number().min(0).max(1), // 0-100% as decimal
  threshold: z.number().min(0), // Registration threshold in MYR
  isActive: z.boolean(),
  effectiveDate: z.string().transform(str => new Date(str)),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taxService = MalaysianTaxService.getInstance();

    // Get current configuration from our enhanced service
    const currentConfig = await (taxService as any).getTaxConfiguration();

    // Get registration information
    const registrationInfo = taxService.getTaxRegistrationInfo();

    // Sample calculation for demonstration
    const sampleCalculation = await taxService.calculateTaxBreakdown({
      productSubtotal: 1000,
      shippingCost: 50,
      taxInclusive: false,
    });

    // Get business registration from environment
    const registrationNumbers = {
      sstNumber: process.env.SST_NUMBER || '',
      businessRegistrationNumber:
        process.env.BUSINESS_REGISTRATION_NUMBER || '',
      taxAgentLicense: process.env.TAX_AGENT_LICENSE || '',
    };

    return NextResponse.json({
      success: true,
      configuration: {
        ...currentConfig,
        salesTaxRatePercentage: currentConfig.salesTaxRate * 100,
        serviceTaxRatePercentage: currentConfig.serviceTaxRate * 100,
      },
      registrationInfo,
      registrationNumbers,
      sampleCalculation,
      taxCategories: {
        productCategories: Object.values(ProductTaxCategory),
        serviceCategories: Object.values(ServiceTaxCategory),
      },
      malaysianTaxInfo: {
        description: 'Sales and Service Tax (SST) replaced GST in 2018',
        authority: 'Royal Malaysian Customs Department',
        website: 'https://gst.customs.gov.my/',
        currentRates: {
          salesTax: '10% (on most goods)',
          serviceTax: '6% (on specified services)',
          registrationThreshold: 'RM 500,000 annual revenue',
        },
        applicableServices: [
          'Logistics and courier services',
          'Freight and transportation',
          'Warehousing services',
          'Insurance services',
        ],
        exemptions: [
          'Basic food items',
          'Medical equipment and medicines',
          'Educational materials and books',
          'Essential goods',
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching tax configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedConfig = taxConfigSchema.parse(body);

    const taxService = MalaysianTaxService.getInstance();

    // Update configuration using our enhanced service
    await taxService.updateTaxConfiguration(validatedConfig);

    // Get updated configuration for confirmation
    const updatedConfig = await (taxService as any).getTaxConfiguration();

    // Create audit log for configuration change
    try {
      await prisma.systemConfig.upsert({
        where: { key: 'tax_config_audit' },
        update: {
          value: JSON.stringify({
            lastUpdate: new Date().toISOString(),
            updatedBy: session.user.email,
            userId: session.user.id,
            changes: validatedConfig,
          }),
        },
        create: {
          key: 'tax_config_audit',
          value: JSON.stringify({
            lastUpdate: new Date().toISOString(),
            updatedBy: session.user.email,
            userId: session.user.id,
            changes: validatedConfig,
          }),
          type: 'JSON',
        },
      });
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
      // Continue with success even if audit fails
    }

    return NextResponse.json({
      success: true,
      message: 'Tax configuration updated successfully',
      configuration: {
        ...updatedConfig,
        salesTaxRatePercentage: updatedConfig.salesTaxRate * 100,
        serviceTaxRatePercentage: updatedConfig.serviceTaxRate * 100,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating tax configuration:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid configuration data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update tax configuration' },
      { status: 500 }
    );
  }
}

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
    const { action, ...params } = body;

    const taxService = MalaysianTaxService.getInstance();

    switch (action) {
      case 'calculate_sample':
        const sampleCalc = await taxService.calculateTaxBreakdown({
          productSubtotal: params.productSubtotal || 1000,
          shippingCost: params.shippingCost || 50,
          productTaxCategory: params.productTaxCategory,
          shippingTaxCategory: params.shippingTaxCategory,
          taxInclusive: params.taxInclusive || false,
        });

        return NextResponse.json({
          success: true,
          calculation: sampleCalc,
          invoiceItems: taxService.generateTaxInvoiceItems(sampleCalc),
          formatted: {
            subtotal: taxService.formatTaxAmount(sampleCalc.subtotal),
            salesTax: taxService.formatTaxAmount(sampleCalc.salesTax),
            serviceTax: taxService.formatTaxAmount(sampleCalc.serviceTax),
            total: taxService.formatTaxAmount(sampleCalc.total),
          },
        });

      case 'calculate_shipping_tax':
        const shippingTax = await taxService.calculateShippingTax(
          params.shippingCost || 50,
          params.inclusive || false
        );

        return NextResponse.json({
          success: true,
          shippingTax,
          formatted: {
            taxExclusive: taxService.formatTaxAmount(
              shippingTax.taxExclusiveAmount
            ),
            taxAmount: taxService.formatTaxAmount(shippingTax.taxAmount),
            taxInclusive: taxService.formatTaxAmount(
              shippingTax.taxInclusiveAmount
            ),
          },
        });

      case 'check_registration_requirement':
        const shouldRegister = await taxService.shouldRegisterForSST(
          params.annualRevenue || 0
        );

        return NextResponse.json({
          success: true,
          shouldRegister,
          registrationRequired: shouldRegister,
          annualRevenue: params.annualRevenue || 0,
          threshold: 500000,
          registrationInfo: taxService.getTaxRegistrationInfo(),
        });

      case 'reset_to_defaults':
        await taxService.updateTaxConfiguration({
          salesTaxRate: 0.1, // 10%
          serviceTaxRate: 0.06, // 6%
          threshold: 500000, // RM500,000
          isActive: true,
          effectiveDate: new Date('2018-09-01'),
        });

        return NextResponse.json({
          success: true,
          message: 'Tax configuration reset to Malaysian defaults',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in tax configuration action:', error);
    return NextResponse.json(
      { error: 'Failed to process tax configuration action' },
      { status: 500 }
    );
  }
}
