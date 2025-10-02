/**

export const dynamic = 'force-dynamic';

 * TEST ONLY - Payment Success Simulation API
 * Simulates successful payment and membership activation
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
        { message: 'User must be logged in to test payment success' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      orderId,
      totalAmount,
      qualifyingAmount,
      activateMembership = true,
    } = body;

    // Simulate payment processing
    console.log('🧪 TEST: Simulating payment success...');

    // For testing purposes, just create a simple record to track the test
    const testOrderId = orderId || `test_order_${Date.now()}`;
    console.log('🧪 TEST: Creating test order:', testOrderId);

    let membershipActivated = false;

    // Activate membership if qualifying
    if (activateMembership && qualifyingAmount >= 80) {
      console.log('🎯 TEST: Activating membership for user...');

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          isMember: true,
          memberSince: new Date(),
        },
      });

      membershipActivated = true;
      console.log('✅ TEST: Membership activated!');
    }

    // Clear any pending membership registration flags
    // This would normally be done in the frontend after successful payment

    return NextResponse.json({
      success: true,
      message: 'Payment success simulated',
      orderId: testOrderId,
      membershipActivated,
      user: {
        ...session.user,
        isMember: membershipActivated || session.user.isMember,
      },
      testData: {
        totalAmount: totalAmount || 100,
        qualifyingAmount: qualifyingAmount || 100,
        membershipThreshold: 80,
        qualified: qualifyingAmount >= 80,
      },
    });
  } catch (error) {
    console.error('TEST: Error simulating payment success:', error);
    return NextResponse.json(
      { message: 'Failed to simulate payment success', error: error.message },
      { status: 500 }
    );
  }
}
