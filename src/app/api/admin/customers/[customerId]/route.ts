import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const updateCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  isMember: z.boolean(),
});

// GET /api/admin/customers/[customerId] - Get single customer
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    const customer = await prisma.user.findUnique({
      where: {
        id: params.customerId,
      },
      include: {
        addresses: {
          orderBy: {
            isDefault: 'desc',
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      );
    }

    // Calculate total spent and count from paid orders
    const orderStats = await prisma.order.aggregate({
      where: {
        userId: customer.id,
        paymentStatus: 'PAID', // Count all paid orders, not just delivered
      },
      _count: {
        id: true, // Count paid orders
      },
      _sum: {
        total: true,
      },
      _max: {
        createdAt: true,
      },
    });

    const customerData = {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      isMember: customer.isMember,
      memberSince: customer.memberSince,
      status: customer.status,
      createdAt: customer.createdAt,
      totalOrders: orderStats._count.id || 0, // Use count of paid orders
      totalSpent: orderStats._sum.total || 0,
      lastOrderAt: orderStats._max.createdAt,
      addresses: customer.addresses.map(addr => ({
        id: addr.id,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
        isDefault: addr.isDefault,
      })),
      orders: customer.orders,
    };

    return NextResponse.json({
      customer: customerData,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/customers/[customerId] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    const body = await request.json();

    // Validate request body
    const validatedData = updateCustomerSchema.parse(body);

    // Check if customer exists
    const existingCustomer = await prisma.user.findUnique({
      where: { id: params.customerId },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    if (validatedData.email !== existingCustomer.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: params.customerId },
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { message: 'Email address is already in use' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      status: validatedData.status,
      isMember: validatedData.isMember,
    };

    // If granting membership for the first time, set memberSince
    if (validatedData.isMember && !existingCustomer.isMember) {
      updateData.memberSince = new Date();
    }

    // Update customer
    const updatedCustomer = await prisma.user.update({
      where: { id: params.customerId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isMember: true,
        memberSince: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: 'Customer updated successfully',
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error('Error updating customer:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Invalid customer data',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/customers/[customerId] - Delete customer (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    // Check if customer exists
    const existingCustomer = await prisma.user.findUnique({
      where: { id: params.customerId },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if customer has orders
    if (existingCustomer._count.orders > 0) {
      return NextResponse.json(
        {
          message:
            'Cannot delete customer with existing orders. Consider suspending the account instead.',
        },
        { status: 400 }
      );
    }

    // Soft delete by setting status to INACTIVE
    await prisma.user.update({
      where: { id: params.customerId },
      data: {
        status: 'INACTIVE',
        email: `deleted_${Date.now()}_${existingCustomer.email}`, // Prevent email conflicts
      },
    });

    return NextResponse.json({
      message: 'Customer account deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
