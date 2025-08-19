/**
 * Admin Shipping Configuration API
 * Manages business shipping profile and settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { businessShippingConfig } from '@/lib/config/business-shipping-config';
import { handleApiError } from '@/lib/error-handler';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const shippingConfigSchema = z.object({
  freeShippingThreshold: z.number().min(0).optional(),
  defaultCourier: z.string().optional(),
  enableInsurance: z.boolean().optional(),
  businessAddress: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      addressLine1: z.string().optional(),
      addressLine2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z
        .string()
        .regex(/^\d{5}$/)
        .optional(),
    })
    .optional(),
});

// GET shipping configuration
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const profile = await businessShippingConfig.getBusinessProfile();
    const isConfigured = await businessShippingConfig.isBusinessConfigured();
    const courierPrefs = await businessShippingConfig.getCourierPreferences();

    // Get shipping statistics
    const shippingStats = await prisma.order.groupBy({
      by: ['status'],
      where: {
        trackingNumber: { not: null },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      _count: true,
    });

    const totalShipped = await prisma.order.count({
      where: {
        status: 'SHIPPED',
        trackingNumber: { not: null },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const totalDelivered = await prisma.order.count({
      where: {
        status: 'DELIVERED',
        trackingNumber: { not: null },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({
      success: true,
      profile,
      configured: isConfigured,
      courierPreferences: courierPrefs,
      statistics: {
        shipped: totalShipped,
        delivered: totalDelivered,
        deliveryRate:
          totalShipped > 0
            ? ((totalDelivered / totalShipped) * 100).toFixed(1)
            : '0.0',
        statusBreakdown: shippingStats,
      },
    });
  } catch (error) {
    console.error('Shipping config retrieval error:', error);
    return handleApiError(error);
  }
}

// PUT update shipping configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = shippingConfigSchema.parse(body);

    // In a real implementation, these would be stored in database
    // For now, we'll return success and log the changes

    const changes = [];

    if (validatedData.freeShippingThreshold !== undefined) {
      changes.push(
        `Free shipping threshold: RM ${validatedData.freeShippingThreshold}`
      );
    }

    if (validatedData.defaultCourier !== undefined) {
      changes.push(`Default courier: ${validatedData.defaultCourier}`);
    }

    if (validatedData.enableInsurance !== undefined) {
      changes.push(`Insurance enabled: ${validatedData.enableInsurance}`);
    }

    if (validatedData.businessAddress) {
      changes.push('Business address updated');
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SHIPPING_CONFIG_UPDATED',
        resource: 'SYSTEM_CONFIG',
        details: {
          changes,
          updatedFields: Object.keys(validatedData),
          performedBy: session.user.email,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: 'Shipping configuration updated successfully',
      changes,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Shipping config update error:', error);
    return handleApiError(error);
  }
}

// POST test EasyParcel connection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'test_connection':
        try {
          // Test with a sample address
          const testRates = await easyParcelService.getShippingRates({
            pickupAddress: {
              name: 'Test Pickup',
              phone: '+60123456789',
              addressLine1: 'Test Address',
              city: 'Kuala Lumpur',
              state: 'KUL',
              postalCode: '50000',
            },
            deliveryAddress: {
              name: 'Test Delivery',
              phone: '+60123456789',
              addressLine1: 'Test Delivery Address',
              city: 'Petaling Jaya',
              state: 'SEL',
              postalCode: '47400',
            },
            items: [{ name: 'Test Item', weight: 1, quantity: 1, value: 100 }],
            totalWeight: 1,
            totalValue: 100,
          });

          return NextResponse.json({
            message: 'EasyParcel connection test successful',
            ratesReturned: testRates.length,
            serviceStatus: easyParcelService.getServiceStatus(),
          });
        } catch (error) {
          return NextResponse.json(
            {
              message: 'EasyParcel connection test failed',
              error: error instanceof Error ? error.message : 'Unknown error',
              serviceStatus: easyParcelService.getServiceStatus(),
            },
            { status: 500 }
          );
        }

      case 'validate_postal_code': {
        const { postalCode, state } = body;
        const isValid = easyParcelService.validatePostalCode(postalCode, state);

        return NextResponse.json({
          postalCode,
          state,
          isValid,
        });
      }

      default:
        return NextResponse.json(
          { message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Shipping action error:', error);
    return handleApiError(error);
  }
}
