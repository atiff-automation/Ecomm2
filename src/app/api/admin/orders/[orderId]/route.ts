/**

export const dynamic = 'force-dynamic';

 * Admin Order Details API - JRM E-commerce Platform
 * API for admin to view and manage individual orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth/authorization';
import { prisma } from '@/lib/db/prisma';
import { logAudit } from '@/lib/audit/logger';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: {
    orderId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) return error;

    const orderId = params.orderId;

    // Fetch order with all related data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: {
                  select: {
                    url: true,
                    altText: true,
                    isPrimary: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isMember: true,
            memberSince: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Transform the data for the frontend
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      shippingCost: Number(order.shippingCost),
      discountAmount:
        order.discountAmount && Number(order.discountAmount) > 0
          ? Number(order.discountAmount)
          : null,
      memberDiscount:
        order.memberDiscount && Number(order.memberDiscount) > 0
          ? Number(order.memberDiscount)
          : null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      notes: order.notes,
      items: order.orderItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.regularPrice),
        finalPrice: Number(item.appliedPrice),
        product: {
          name: item.product.name,
          slug: item.product.slug,
          primaryImage: item.product.images?.find(img => img.isPrimary)
            ? {
                url: item.product.images.find(img => img.isPrimary)!.url,
                altText: item.product.images.find(img => img.isPrimary)!
                  .altText,
              }
            : item.product.images?.[0]
              ? {
                  url: item.product.images[0].url,
                  altText: item.product.images[0].altText,
                }
              : null,
        },
      })),
      shippingAddress: order.shippingAddress
        ? {
            firstName: order.shippingAddress.firstName,
            lastName: order.shippingAddress.lastName,
            email: order.shippingAddress.email,
            phone: order.shippingAddress.phone,
            address: order.shippingAddress.address,
            address2: order.shippingAddress.address2,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postcode: order.shippingAddress.postcode,
            country: order.shippingAddress.country,
          }
        : null,
      billingAddress: order.billingAddress
        ? {
            firstName: order.billingAddress.firstName,
            lastName: order.billingAddress.lastName,
            email: order.billingAddress.email,
            phone: order.billingAddress.phone,
            address: order.billingAddress.address,
            address2: order.billingAddress.address2,
            city: order.billingAddress.city,
            state: order.billingAddress.state,
            postcode: order.billingAddress.postcode,
            country: order.billingAddress.country,
          }
        : null,
      customer: order.user
        ? {
            id: order.user.id,
            firstName: order.user.firstName,
            lastName: order.user.lastName,
            email: order.user.email,
            isMember: order.user.isMember,
            memberSince: order.user.memberSince?.toISOString(),
          }
        : null,
    };

    return NextResponse.json({ order: transformedOrder });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { message: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) return error;

    const orderId = params.orderId;
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = [
      'PENDING',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: {
                  select: {
                    url: true,
                    altText: true,
                    isPrimary: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isMember: true,
            memberSince: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    // Transform the data for the frontend (same as GET)
    const transformedOrder = {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
      paymentMethod: updatedOrder.paymentMethod,
      total: Number(updatedOrder.total),
      subtotal: Number(updatedOrder.subtotal),
      taxAmount: Number(updatedOrder.taxAmount),
      shippingCost: Number(updatedOrder.shippingCost),
      discountAmount:
        updatedOrder.discountAmount && Number(updatedOrder.discountAmount) > 0
          ? Number(updatedOrder.discountAmount)
          : null,
      memberDiscount:
        updatedOrder.memberDiscount && Number(updatedOrder.memberDiscount) > 0
          ? Number(updatedOrder.memberDiscount)
          : null,
      createdAt: updatedOrder.createdAt.toISOString(),
      updatedAt: updatedOrder.updatedAt.toISOString(),
      notes: updatedOrder.notes,
      items: updatedOrder.orderItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.regularPrice),
        finalPrice: Number(item.appliedPrice),
        product: {
          name: item.product.name,
          slug: item.product.slug,
          primaryImage: item.product.images?.find(img => img.isPrimary)
            ? {
                url: item.product.images.find(img => img.isPrimary)!.url,
                altText: item.product.images.find(img => img.isPrimary)!
                  .altText,
              }
            : item.product.images?.[0]
              ? {
                  url: item.product.images[0].url,
                  altText: item.product.images[0].altText,
                }
              : null,
        },
      })),
      shippingAddress: updatedOrder.shippingAddress
        ? {
            firstName: updatedOrder.shippingAddress.firstName,
            lastName: updatedOrder.shippingAddress.lastName,
            email: updatedOrder.shippingAddress.email,
            phone: updatedOrder.shippingAddress.phone,
            address: updatedOrder.shippingAddress.address,
            address2: updatedOrder.shippingAddress.address2,
            city: updatedOrder.shippingAddress.city,
            state: updatedOrder.shippingAddress.state,
            postcode: updatedOrder.shippingAddress.postcode,
            country: updatedOrder.shippingAddress.country,
          }
        : null,
      billingAddress: updatedOrder.billingAddress
        ? {
            firstName: updatedOrder.billingAddress.firstName,
            lastName: updatedOrder.billingAddress.lastName,
            email: updatedOrder.billingAddress.email,
            phone: updatedOrder.billingAddress.phone,
            address: updatedOrder.billingAddress.address,
            address2: updatedOrder.billingAddress.address2,
            city: updatedOrder.billingAddress.city,
            state: updatedOrder.billingAddress.state,
            postcode: updatedOrder.billingAddress.postcode,
            country: updatedOrder.billingAddress.country,
          }
        : null,
      customer: updatedOrder.user
        ? {
            id: updatedOrder.user.id,
            firstName: updatedOrder.user.firstName,
            lastName: updatedOrder.user.lastName,
            email: updatedOrder.user.email,
            isMember: updatedOrder.user.isMember,
            memberSince: updatedOrder.user.memberSince?.toISOString(),
          }
        : null,
    };

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'order',
        resourceId: orderId,
        details: {
          orderNumber: updatedOrder.orderNumber,
          oldStatus: status, // This would ideally be the previous status
          newStatus: status,
          updatedBy: session.user.name || session.user.email,
        },
        ipAddress:
          request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: 'Order updated successfully',
      order: transformedOrder,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { message: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Authorization check - only admin can delete orders
    const { error, session } = await requireAdminRole();
    if (error) return error;

    const orderId = params.orderId;

    // First, fetch the order to get details for audit log
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        total: true,
        userId: true,
        guestEmail: true,
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Delete the order - cascade will automatically delete related OrderItems
    await prisma.order.delete({
      where: { id: orderId },
    });

    // Create audit log for the deletion
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        resource: 'order',
        resourceId: orderId,
        details: {
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: Number(order.total),
          deletedBy: session.user.name || session.user.email,
          customerUserId: order.userId,
          customerEmail: order.guestEmail,
        },
        ipAddress:
          request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: 'Order deleted successfully',
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { message: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
