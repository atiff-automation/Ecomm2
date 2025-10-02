/**

export const dynamic = 'force-dynamic';

 * TEST ONLY - Reset Membership Status API
 * Allows resetting membership status for testing purposes
 * Remove this in production
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { message: 'Test endpoint not available in production' },
      { status: 403 }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'User must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { isMember = false } = body;

    console.log(
      `🧪 TEST: ${isMember ? 'Activating' : 'Deactivating'} membership for user...`
    );

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isMember,
        memberSince: isMember ? new Date() : null,
      },
    });

    // Note: Test orders cleanup skipped for simplicity
    console.log('🧪 TEST: Membership status updated successfully');

    console.log(
      `✅ TEST: Membership ${isMember ? 'activated' : 'deactivated'}!`
    );

    return NextResponse.json({
      success: true,
      message: `Membership ${isMember ? 'activated' : 'deactivated'} successfully`,
      user: {
        ...session.user,
        isMember,
      },
    });
  } catch (error) {
    console.error('TEST: Error resetting membership:', error);
    return NextResponse.json(
      { message: 'Failed to reset membership status', error: error.message },
      { status: 500 }
    );
  }
}
