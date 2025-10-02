/**

export const dynamic = 'force-dynamic';

 * Individual Address Management API
 * Handles update and delete operations for specific addresses
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const addressUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  type: z.string().optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().min(1, 'Phone number is required').optional(),
  addressLine1: z.string().min(1, 'Address line 1 is required').optional(),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().min(1, 'State is required').optional(),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, 'Postal code must be 5 digits')
    .optional(),
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
});

interface RouteParams {
  params: {
    addressId: string;
  };
}

// GET - Get specific address
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const address = await prisma.address.findFirst({
      where: {
        id: params.addressId,
        userId: session.user.id,
      },
    });

    if (!address) {
      return NextResponse.json(
        { message: 'Address not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      address: {
        ...address,
        userId: undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching address:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update address
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = addressUpdateSchema.parse(body);

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: params.addressId,
        userId: session.user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { message: 'Address not found' },
        { status: 404 }
      );
    }

    // If this is being set as default, unset other default addresses
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
          id: {
            not: params.addressId,
          },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Filter out undefined values
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([, v]) => v !== undefined)
    );

    const updatedAddress = await prisma.address.update({
      where: {
        id: params.addressId,
      },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Address updated successfully',
      address: {
        ...updatedAddress,
        userId: undefined,
      },
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

    console.error('Error updating address:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete address
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: params.addressId,
        userId: session.user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { message: 'Address not found' },
        { status: 404 }
      );
    }

    // Check if this address is used in any orders
    const ordersUsingAddress = await prisma.order.count({
      where: {
        OR: [
          { shippingAddressId: params.addressId },
          { billingAddressId: params.addressId },
        ],
      },
    });

    if (ordersUsingAddress > 0) {
      return NextResponse.json(
        { message: 'Cannot delete address that is used in existing orders' },
        { status: 400 }
      );
    }

    await prisma.address.delete({
      where: {
        id: params.addressId,
      },
    });

    // If this was the default address, set another address as default
    if (existingAddress.isDefault) {
      const remainingAddresses = await prisma.address.findFirst({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (remainingAddresses) {
        await prisma.address.update({
          where: {
            id: remainingAddresses.id,
          },
          data: {
            isDefault: true,
          },
        });
      }
    }

    return NextResponse.json({
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
