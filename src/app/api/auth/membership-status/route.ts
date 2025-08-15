/**
 * Membership Status API - Get Fresh Membership Status
 * Returns current membership status from database (not session)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({
        isLoggedIn: false,
        isMember: false,
        hasPendingMembership: false
      });
    }

    // Get fresh membership status from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        isMember: true,
        memberSince: true 
      }
    });

    // Check for pending membership
    const pendingMembership = await prisma.pendingMembership.findFirst({
      where: { userId: session.user.id }
    });

    // Effective membership status (pending membership overrides approved status)
    const effectiveMemberStatus = pendingMembership ? false : (user?.isMember || false);

    return NextResponse.json({
      isLoggedIn: true,
      isMember: effectiveMemberStatus,
      hasPendingMembership: !!pendingMembership,
      sessionIsMember: session.user.isMember, // For debugging
      databaseIsMember: user?.isMember || false
    });

  } catch (error) {
    console.error('❌ Membership status error:', error);
    return NextResponse.json(
      { error: 'Failed to get membership status' },
      { status: 500 }
    );
  }
}