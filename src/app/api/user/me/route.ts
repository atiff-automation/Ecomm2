/**
 * User Profile API - Get current user data
 * Returns fresh user data from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isMember: true,
        memberSince: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Combine firstName and lastName into name for compatibility
    const userData = {
      ...user,
      name:
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        'Unknown User',
    };

    console.log('📋 Fresh user data fetched:', {
      userId: user.id,
      name: userData.name,
      isMember: user.isMember,
      memberSince: user.memberSince,
    });

    return NextResponse.json(userData);
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user data', error: error.message },
      { status: 500 }
    );
  }
}
