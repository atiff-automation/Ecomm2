/**

export const dynamic = 'force-dynamic';

 * Admin Pending Memberships API - JRM E-commerce Platform
 * Get all pending membership registrations waiting for payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * GET /api/admin/pending-memberships - Get pending membership registrations
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and admin permissions
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has admin permissions (ADMIN, STAFF, or SUPERADMIN)
    if (
      !['ADMIN', 'STAFF', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get pending memberships with related order and user data
    const pendingMemberships = await prisma.pendingMembership.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isMember: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            paymentStatus: true,
            wasEligibleForMembership: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform data for easier consumption
    const transformedData = pendingMemberships.map(pending => ({
      id: pending.order.id,
      orderNumber: pending.order.orderNumber,
      total: Number(pending.order.total),
      status: pending.order.status,
      paymentStatus: pending.order.paymentStatus,
      wasEligibleForMembership: pending.order.wasEligibleForMembership,
      createdAt: pending.order.createdAt,
      user: pending.user,
      pendingMembership: {
        id: pending.id,
        qualifyingAmount: Number(pending.qualifyingAmount),
        expiresAt: pending.expiresAt,
        registrationData: pending.registrationData,
      },
    }));

    // Get some stats
    const stats = {
      totalPending: pendingMemberships.length,
      totalQualifyingAmount: pendingMemberships.reduce(
        (sum, pending) => sum + Number(pending.qualifyingAmount),
        0
      ),
      expiringSoon: pendingMemberships.filter(
        pending =>
          new Date(pending.expiresAt) <
          new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
      ).length,
    };

    return NextResponse.json({
      pendingMemberships: transformedData,
      stats,
      message: `Found ${pendingMemberships.length} pending memberships`,
    });
  } catch (error) {
    console.error('Error fetching pending memberships:', error);
    return NextResponse.json(
      { message: 'Failed to fetch pending memberships' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/pending-memberships - Clean up expired pending memberships
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and admin permissions
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'cleanup-expired') {
      // Delete expired pending memberships
      const deletedCount = await prisma.pendingMembership.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      return NextResponse.json({
        message: `Cleaned up ${deletedCount.count} expired pending memberships`,
        deletedCount: deletedCount.count,
      });
    }

    return NextResponse.json(
      { message: 'Invalid action. Use ?action=cleanup-expired' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error cleaning up pending memberships:', error);
    return NextResponse.json(
      { message: 'Failed to cleanup pending memberships' },
      { status: 500 }
    );
  }
}
