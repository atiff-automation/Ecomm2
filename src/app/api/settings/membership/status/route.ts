import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/settings/membership/status - Get user membership status
 * Following @CLAUDE.md principles - systematic, DRY, single source of truth
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with membership information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        isMember: true,
        memberSince: true,
        membershipTotal: true,
        // Include pending membership for progress calculation
        pendingMembership: {
          select: {
            qualifyingAmount: true,
          }
        },
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate membership status
    const membershipStatus = {
      isMember: user.isMember,
      memberSince: user.memberSince,
      membershipTotal: Number(user.membershipTotal),
      currentTier: user.isMember ? 'Member' : null,
      nextTierThreshold: user.isMember ? null : 80, // RM 80 membership threshold
    };

    return NextResponse.json({
      success: true,
      data: membershipStatus
    });

  } catch (error) {
    console.error('Get membership status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}