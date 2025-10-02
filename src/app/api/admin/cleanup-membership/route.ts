/**

export const dynamic = 'force-dynamic';

 * Admin Cleanup Endpoint - Fix Membership Inconsistencies
 * Remove orphaned pending membership records for users who are already approved members
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    // Find users who are approved members but still have pending membership records
    const conflictingUsers = await prisma.user.findMany({
      where: {
        isMember: true, // User is already an approved member
        pendingMemberships: {
          some: {}, // But still has pending membership records
        },
      },
      include: {
        pendingMemberships: true,
      },
    });

    console.log(
      `🔍 Found ${conflictingUsers.length} users with conflicting membership status`
    );

    let cleanedCount = 0;

    for (const user of conflictingUsers) {
      console.log(`🧹 Cleaning up user ${user.id} (${user.email})`);

      // Remove all pending membership records for this approved member
      const deleted = await prisma.pendingMembership.deleteMany({
        where: { userId: user.id },
      });

      cleanedCount += deleted.count;
      console.log(
        `✅ Removed ${deleted.count} orphaned pending membership records for user ${user.id}`
      );
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanedCount} orphaned pending membership records for ${conflictingUsers.length} users`,
      cleanedUsers: conflictingUsers.map(u => ({
        id: u.id,
        email: u.email,
        pendingRecordsRemoved: u.pendingMemberships.length,
      })),
    });
  } catch (error) {
    console.error('❌ Membership cleanup error:', error);
    return NextResponse.json(
      { message: 'Cleanup failed', error: error.message },
      { status: 500 }
    );
  }
}
