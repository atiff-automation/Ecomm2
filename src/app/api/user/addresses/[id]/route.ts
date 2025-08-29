/**
 * Individual Address Management API - Malaysian E-commerce Platform
 * Update, delete, and set default addresses
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateAddressSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  company: z.string().optional(),
  addressLine1: z.string().min(1).optional(),
  addressLine2: z.string().optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  postalCode: z.string().min(1).optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  type: z.enum(['HOME', 'WORK', 'OTHER']).optional(),
  isDefault: z.boolean().optional(),
});

/**
 * PUT /api/user/addresses/[id] - Update address
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const addressId = params.id;
    const body = await request.json();
    const updateData = updateAddressSchema.parse(body);

    // Verify address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: session.user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { message: 'Address not found' },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async tx => {
      // Update the address
      const updatedAddress = await tx.address.update({
        where: { id: addressId },
        data: updateData,
      });

      // Handle default address logic
      if (updateData.isDefault === true) {
        // Remove default from other addresses
        await tx.address.updateMany({
          where: {
            userId: session.user.id,
            id: { not: addressId },
          },
          data: { isDefault: false },
        });
      }

      return updatedAddress;
    });

    return NextResponse.json({
      message: 'Address updated successfully',
      address: result,
    });
  } catch (error) {
    console.error('Error updating address:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid address data', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to update address' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/addresses/[id] - Delete address
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const addressId = params.id;

    // Verify address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: session.user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { message: 'Address not found' },
        { status: 404 }
      );
    }

    // Check if address is used in any orders
    const ordersUsingAddress = await prisma.order.findFirst({
      where: {
        OR: [{ shippingAddressId: addressId }, { billingAddressId: addressId }],
      },
    });

    if (ordersUsingAddress) {
      return NextResponse.json(
        {
          message: 'Cannot delete address that is used in existing orders',
          canDelete: false,
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async tx => {
      // Delete the address
      await tx.address.delete({
        where: { id: addressId },
      });

      // If this was the default address, set another one as default
      if (existingAddress.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: {
            userId: session.user.id,
            type: { in: ['HOME', 'WORK', 'OTHER'] },
          },
          orderBy: { updatedAt: 'desc' },
        });

        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      }

      return { deleted: true };
    });

    return NextResponse.json({
      message: 'Address deleted successfully',
      result,
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { message: 'Failed to delete address' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/addresses/[id] - Set as default address
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const addressId = params.id;

    // Verify address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: session.user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { message: 'Address not found' },
        { status: 404 }
      );
    }

    await prisma.$transaction(async tx => {
      // Remove default from all other addresses
      await tx.address.updateMany({
        where: {
          userId: session.user.id,
          id: { not: addressId },
        },
        data: { isDefault: false },
      });

      // Set this address as default
      await tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });

    return NextResponse.json({
      message: 'Default address updated successfully',
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    return NextResponse.json(
      { message: 'Failed to set default address' },
      { status: 500 }
    );
  }
}
