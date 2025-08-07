/**
 * Pending Membership Cleanup Utility
 * Cleans up expired pending membership records
 */

import { prisma } from '@/lib/db/prisma';

/**
 * Clean up expired pending memberships
 * This should be run periodically (e.g., daily cron job)
 */
export async function cleanupExpiredPendingMemberships(): Promise<{
  deletedCount: number;
  error?: string;
}> {
  try {
    const now = new Date();

    // Find expired pending memberships
    const expiredMemberships = await prisma.pendingMembership.findMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
            paymentStatus: true,
            status: true,
          },
        },
      },
    });

    console.log(
      `Found ${expiredMemberships.length} expired pending memberships`
    );

    // Delete expired pending memberships
    const result = await prisma.pendingMembership.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    // Log cleanup activity
    if (result.count > 0) {
      await prisma.auditLog.create({
        data: {
          userId: null, // System action
          action: 'DELETE',
          resource: 'PendingMembership',
          resourceId: 'batch-cleanup',
          details: {
            cleanupType: 'expired_pending_memberships',
            deletedCount: result.count,
            expiredMemberships: expiredMemberships.map(pm => ({
              id: pm.id,
              userId: pm.userId,
              userEmail: pm.user.email,
              orderNumber: pm.order?.orderNumber,
              expiredAt: pm.expiresAt,
              qualifyingAmount: pm.qualifyingAmount,
            })),
            cleanupAt: now.toISOString(),
          },
          ipAddress: 'system',
          userAgent: 'pending-membership-cleanup',
        },
      });
    }

    return {
      deletedCount: result.count,
    };
  } catch (error) {
    console.error('Error cleaning up expired pending memberships:', error);
    return {
      deletedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get pending memberships that will expire soon (within hours)
 */
export async function getPendingMembershipsExpiringSoon(
  withinHours = 2
): Promise<
  Array<{
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    orderNumber: string;
    qualifyingAmount: number;
    expiresAt: Date;
    hoursUntilExpiry: number;
  }>
> {
  try {
    const now = new Date();
    const expiresWithin = new Date(
      now.getTime() + withinHours * 60 * 60 * 1000
    );

    const pendingMemberships = await prisma.pendingMembership.findMany({
      where: {
        expiresAt: {
          gte: now,
          lte: expiresWithin,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
            paymentStatus: true,
          },
        },
      },
    });

    return pendingMemberships.map(pm => ({
      id: pm.id,
      userId: pm.userId,
      userEmail: pm.user.email,
      userName: `${pm.user.firstName} ${pm.user.lastName}`,
      orderNumber: pm.order?.orderNumber || 'N/A',
      qualifyingAmount: Number(pm.qualifyingAmount),
      expiresAt: pm.expiresAt,
      hoursUntilExpiry:
        (pm.expiresAt.getTime() - now.getTime()) / (60 * 60 * 1000),
    }));
  } catch (error) {
    console.error('Error getting pending memberships expiring soon:', error);
    return [];
  }
}

/**
 * Extend expiry time for a pending membership
 */
export async function extendPendingMembershipExpiry(
  pendingMembershipId: string,
  additionalHours = 24
): Promise<{ success: boolean; newExpiryTime?: Date; error?: string }> {
  try {
    const pending = await prisma.pendingMembership.findUnique({
      where: { id: pendingMembershipId },
    });

    if (!pending) {
      return { success: false, error: 'Pending membership not found' };
    }

    const newExpiryTime = new Date(
      pending.expiresAt.getTime() + additionalHours * 60 * 60 * 1000
    );

    await prisma.pendingMembership.update({
      where: { id: pendingMembershipId },
      data: {
        expiresAt: newExpiryTime,
      },
    });

    return { success: true, newExpiryTime };
  } catch (error) {
    console.error('Error extending pending membership expiry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
