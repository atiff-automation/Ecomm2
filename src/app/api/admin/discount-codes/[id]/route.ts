/**

export const dynamic = 'force-dynamic';

 * Individual Discount Code API - JRM E-commerce Platform
 * API for managing individual discount codes (view, update, delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth/authorization';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) return error;

    const discountCode = await prisma.discountCode.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        usageHistory: {
          select: {
            id: true,
            usedAt: true,
            orderValue: true,
            discountAmount: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { usedAt: 'desc' },
          take: 10, // Last 10 uses
        },
      },
    });

    if (!discountCode) {
      return NextResponse.json(
        { message: 'Discount code not found' },
        { status: 404 }
      );
    }

    // Transform the data
    const transformed = {
      ...discountCode,
      discountValue: Number(discountCode.discountValue),
      minimumOrderValue: discountCode.minimumOrderValue
        ? Number(discountCode.minimumOrderValue)
        : null,
      maximumDiscount: discountCode.maximumDiscount
        ? Number(discountCode.maximumDiscount)
        : null,
      createdBy: discountCode.createdBy
        ? {
            name: `${discountCode.createdBy.firstName} ${discountCode.createdBy.lastName}`.trim(),
          }
        : null,
      usageHistory: discountCode.usageHistory.map(usage => ({
        ...usage,
        orderValue: Number(usage.orderValue),
        discountAmount: Number(usage.discountAmount),
        user: usage.user
          ? {
              name: `${usage.user.firstName} ${usage.user.lastName}`.trim(),
              email: usage.user.email,
            }
          : null,
      })),
    };

    return NextResponse.json({ code: transformed });
  } catch (error) {
    console.error('Error fetching discount code:', error);
    return NextResponse.json(
      { message: 'Failed to fetch discount code' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) return error;

    const body = await request.json();

    const allowedUpdates = [
      'name',
      'description',
      'status',
      'usageLimit',
      'expiresAt',
      'isPublic',
    ];

    // Filter only allowed updates
    const updateData: any = {};
    for (const key of allowedUpdates) {
      if (body.hasOwnProperty(key)) {
        updateData[key] = body[key];
      }
    }

    // Handle date conversion
    if (updateData.expiresAt) {
      updateData.expiresAt = new Date(updateData.expiresAt);
    }

    const updatedCode = await prisma.discountCode.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Discount code updated successfully',
      code: updatedCode,
    });
  } catch (error) {
    console.error('Error updating discount code:', error);
    return NextResponse.json(
      { message: 'Failed to update discount code' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) return error;

    // Check if the discount code has been used
    const usageCount = await prisma.discountUsage.count({
      where: { discountCodeId: params.id },
    });

    if (usageCount > 0) {
      // Don't delete codes that have been used, just deactivate them
      await prisma.discountCode.update({
        where: { id: params.id },
        data: { status: 'INACTIVE' },
      });

      return NextResponse.json({
        message:
          'Discount code has been deactivated (cannot delete used codes)',
      });
    }

    // Delete the discount code if never used
    await prisma.discountCode.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Discount code deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting discount code:', error);
    return NextResponse.json(
      { message: 'Failed to delete discount code' },
      { status: 500 }
    );
  }
}
