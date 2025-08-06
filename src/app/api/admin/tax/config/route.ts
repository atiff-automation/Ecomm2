/**
 * Admin Tax Configuration API
 * Manages Malaysian tax settings (GST, SST, Service Tax)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { handleApiError } from '@/lib/error-handler';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const taxConfigSchema = z.object({
  gstRate: z.number().min(0).max(1),
  sstRate: z.number().min(0).max(1),
  serviceTaxRate: z.number().min(0).max(1),
  isGstActive: z.boolean(),
  isSstActive: z.boolean(),
  defaultTaxType: z.enum(['GST', 'SST']),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get current tax rates from database
    const taxRates = await prisma.taxRate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Format tax configuration
    const config = {
      gstRate:
        taxRates.find(rate => rate.name.toUpperCase().includes('GST'))?.rate ||
        0,
      sstRate:
        taxRates.find(rate => rate.name.toUpperCase().includes('SST'))?.rate ||
        0,
      serviceTaxRate:
        taxRates.find(rate => rate.name.toUpperCase().includes('SERVICE'))
          ?.rate || 0,
      isGstActive: taxRates.some(
        rate => rate.name.toUpperCase().includes('GST') && Number(rate.rate) > 0
      ),
      isSstActive: taxRates.some(
        rate => rate.name.toUpperCase().includes('SST') && Number(rate.rate) > 0
      ),
      defaultTaxType: taxRates.some(
        rate => rate.name.toUpperCase().includes('GST') && Number(rate.rate) > 0
      )
        ? 'GST'
        : 'SST',
      allTaxRates: taxRates.map(rate => ({
        id: rate.id,
        name: rate.name,
        rate: Number(rate.rate),
        isActive: rate.isActive,
        description: rate.description,
      })),
    };

    // Get tax registration numbers
    const registrationNumbers = {
      gstNumber: process.env.GST_NUMBER || '',
      sstNumber: process.env.SST_NUMBER || '',
      businessRegistrationNumber:
        process.env.BUSINESS_REGISTRATION_NUMBER || '',
    };

    return NextResponse.json({
      config,
      registrationNumbers,
      malaysianTaxInfo: {
        currentSystem: 'SST', // Malaysia currently uses SST
        gstSuspended: true, // GST is suspended since 2018
        sstImplemented: true, // SST was reintroduced
        standardSstRate: 0.06, // 6% SST
        serviceTaxRate: 0.06, // 6% Service Tax
      },
    });
  } catch (error) {
    console.error('Tax configuration fetch error:', error);
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = taxConfigSchema.parse(body);

    const {
      gstRate,
      sstRate,
      serviceTaxRate,
      isGstActive,
      isSstActive,
      defaultTaxType,
    } = validatedData;

    // Update or create GST tax rate
    await prisma.taxRate.upsert({
      where: { name: 'GST' },
      update: {
        rate: gstRate,
        isActive: isGstActive,
        description: `Goods and Services Tax - ${isGstActive ? 'Active' : 'Suspended'}`,
        updatedAt: new Date(),
      },
      create: {
        name: 'GST',
        rate: gstRate,
        isActive: isGstActive,
        description: `Goods and Services Tax - ${isGstActive ? 'Active' : 'Suspended'}`,
      },
    });

    // Update or create SST tax rate
    await prisma.taxRate.upsert({
      where: { name: 'SST' },
      update: {
        rate: sstRate,
        isActive: isSstActive,
        description: `Sales and Service Tax - ${isSstActive ? 'Active' : 'Inactive'}`,
        updatedAt: new Date(),
      },
      create: {
        name: 'SST',
        rate: sstRate,
        isActive: isSstActive,
        description: `Sales and Service Tax - ${isSstActive ? 'Active' : 'Inactive'}`,
      },
    });

    // Update or create Service Tax rate
    await prisma.taxRate.upsert({
      where: { name: 'Service Tax' },
      update: {
        rate: serviceTaxRate,
        isActive: serviceTaxRate > 0,
        description: 'Malaysian Service Tax',
        updatedAt: new Date(),
      },
      create: {
        name: 'Service Tax',
        rate: serviceTaxRate,
        isActive: serviceTaxRate > 0,
        description: 'Malaysian Service Tax',
      },
    });

    // Create audit log for configuration change
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TAX_CONFIG_UPDATE',
        resource: 'TAX_CONFIGURATION',
        details: {
          changes: {
            gstRate,
            sstRate,
            serviceTaxRate,
            isGstActive,
            isSstActive,
            defaultTaxType,
          },
          updatedBy: session.user.email,
          timestamp: new Date().toISOString(),
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: 'Tax configuration updated successfully',
      config: {
        gstRate,
        sstRate,
        serviceTaxRate,
        isGstActive,
        isSstActive,
        defaultTaxType,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Tax configuration update error:', error);
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, rate, description } = body;

    if (!name || rate === undefined) {
      return NextResponse.json(
        { message: 'Name and rate are required' },
        { status: 400 }
      );
    }

    // Create new custom tax rate
    const taxRate = await prisma.taxRate.create({
      data: {
        name,
        rate: parseFloat(rate),
        description: description || '',
        isActive: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TAX_RATE_CREATED',
        resource: 'TAX_RATE',
        resourceId: taxRate.id,
        details: {
          name,
          rate: parseFloat(rate),
          description,
          createdBy: session.user.email,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: 'Tax rate created successfully',
      taxRate: {
        id: taxRate.id,
        name: taxRate.name,
        rate: Number(taxRate.rate),
        description: taxRate.description,
        isActive: taxRate.isActive,
      },
    });
  } catch (error) {
    console.error('Tax rate creation error:', error);
    return handleApiError(error);
  }
}
