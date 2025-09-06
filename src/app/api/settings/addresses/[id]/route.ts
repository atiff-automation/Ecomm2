import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { addressSchema } from '@/lib/validation/settings';
import { AuditLogger } from '@/lib/security';

/**
 * PUT /api/settings/addresses/[id] - Update address
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only customers can update their addresses
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const addressId = params.id;
    const body = await request.json();
    
    // Validate request body
    const validatedData = addressSchema.parse(body);

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: session.user.id
      }
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // If this is set as default, remove default from other addresses of same type
    if (validatedData.isDefault && !existingAddress.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
          type: validatedData.type,
          id: { not: addressId }
        },
        data: {
          isDefault: false
        }
      });
    }

    // Update address
    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        type: validatedData.type,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        company: validatedData.company || null,
        addressLine1: validatedData.addressLine1,
        addressLine2: validatedData.addressLine2 || null,
        city: validatedData.city,
        state: validatedData.state,
        postalCode: validatedData.postalCode,
        country: validatedData.country,
        phone: validatedData.phone || null,
        isDefault: validatedData.isDefault,
        updatedAt: new Date()
      }
    });

    // Log the change for audit
    await AuditLogger.logUserSettingsChange(
      session.user.id,
      'ADDRESS',
      {
        action: 'UPDATE_ADDRESS',
        addressId,
        oldData: {
          type: existingAddress.type,
          city: existingAddress.city,
          state: existingAddress.state,
          isDefault: existingAddress.isDefault
        }
      },
      {
        action: 'UPDATE_ADDRESS',
        addressId,
        newData: {
          type: validatedData.type,
          city: validatedData.city,
          state: validatedData.state,
          isDefault: validatedData.isDefault
        }
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully',
      data: updatedAddress
    });

  } catch (error) {
    console.error('Update address error:', error);
    
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

/**
 * DELETE /api/settings/addresses/[id] - Delete address
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only customers can delete their addresses
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const addressId = params.id;

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: session.user.id
      }
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Check if address is being used in any orders
    const ordersUsingAddress = await prisma.order.count({
      where: {
        OR: [
          { shippingAddressId: addressId },
          { billingAddressId: addressId }
        ]
      }
    });

    if (ordersUsingAddress > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete address that has been used in orders',
          details: `This address is associated with ${ordersUsingAddress} order(s)`
        },
        { status: 409 }
      );
    }

    // Delete address
    await prisma.address.delete({
      where: { id: addressId }
    });

    // Log the deletion for audit
    await AuditLogger.logUserSettingsChange(
      session.user.id,
      'ADDRESS',
      {
        action: 'DELETE_ADDRESS',
        addressId,
        deletedData: {
          type: existingAddress.type,
          city: existingAddress.city,
          state: existingAddress.state
        }
      },
      {
        action: 'DELETE_ADDRESS',
        addressId,
        timestamp: new Date()
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully'
    });

  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}