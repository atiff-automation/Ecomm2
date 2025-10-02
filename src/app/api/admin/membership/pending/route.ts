/**

export const dynamic = 'force-dynamic';

 * Admin API - Pending Memberships Management
 * View and manage pending membership registrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.STAFF)
    ) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeExpired = searchParams.get('includeExpired') === 'true';

    const now = new Date();

    const whereClause = includeExpired
      ? {}
      : {
          expiresAt: {
            gte: now,
          },
        };

    const [pendingMemberships, totalCount] = await Promise.all([
      prisma.pendingMembership.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              paymentStatus: true,
              total: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.pendingMembership.count({
        where: whereClause,
      }),
    ]);

    const formattedMemberships = pendingMemberships.map(pm => ({
      id: pm.id,
      userId: pm.userId,
      orderId: pm.orderId,
      qualifyingAmount: Number(pm.qualifyingAmount),
      expiresAt: pm.expiresAt,
      isExpired: pm.expiresAt < now,
      hoursUntilExpiry: Math.max(
        0,
        (pm.expiresAt.getTime() - now.getTime()) / (60 * 60 * 1000)
      ),
      registrationData: pm.registrationData,
      createdAt: pm.createdAt,
      updatedAt: pm.updatedAt,
      user: {
        email: pm.user.email,
        name: `${pm.user.firstName} ${pm.user.lastName}`,
        registeredAt: pm.user.createdAt,
      },
      order: pm.order
        ? {
            orderNumber: pm.order.orderNumber,
            status: pm.order.status,
            paymentStatus: pm.order.paymentStatus,
            total: Number(pm.order.total),
            createdAt: pm.order.createdAt,
          }
        : null,
    }));

    return NextResponse.json({
      pendingMemberships: formattedMemberships,
      count: totalCount,
      summary: {
        total: totalCount,
        active: formattedMemberships.filter(pm => !pm.isExpired).length,
        expired: formattedMemberships.filter(pm => pm.isExpired).length,
        expiringSoon: formattedMemberships.filter(
          pm => !pm.isExpired && pm.hoursUntilExpiry <= 2
        ).length,
      },
    });
  } catch (error) {
    console.error('Error fetching pending memberships:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Manually cancel a pending membership
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pendingId = searchParams.get('id');

    if (!pendingId) {
      return NextResponse.json(
        { message: 'Pending membership ID required' },
        { status: 400 }
      );
    }

    const pending = await prisma.pendingMembership.findUnique({
      where: { id: pendingId },
      include: {
        user: { select: { email: true } },
        order: { select: { orderNumber: true } },
      },
    });

    if (!pending) {
      return NextResponse.json(
        { message: 'Pending membership not found' },
        { status: 404 }
      );
    }

    await prisma.pendingMembership.delete({
      where: { id: pendingId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        resource: 'PendingMembership',
        resourceId: pendingId,
        details: {
          reason: 'manual_cancellation',
          userEmail: pending.user.email,
          orderNumber: pending.order?.orderNumber,
          qualifyingAmount: Number(pending.qualifyingAmount),
          cancelledBy: session.user.email,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: 'Pending membership cancelled successfully',
      cancelledId: pendingId,
    });
  } catch (error) {
    console.error('Error cancelling pending membership:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
