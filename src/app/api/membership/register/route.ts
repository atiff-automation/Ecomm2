/**

export const dynamic = 'force-dynamic';

 * Membership Registration API - Malaysian E-commerce Platform
 * Handle membership activation during checkout process
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import {
  activateUserMembership,
  checkUserMembershipQualification,
} from '@/lib/membership';
import { z } from 'zod';

const membershipRegistrationSchema = z.object({
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the membership terms to continue',
  }),
  orderId: z.string().optional(),
  qualifyingAmount: z.number().positive('Qualifying amount must be positive'),
});

/**
 * POST /api/membership/register - Register user for membership
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { acceptTerms, orderId, qualifyingAmount } =
      membershipRegistrationSchema.parse(body);

    // Check if user is already a member
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isMember: true, memberSince: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user.isMember) {
      return NextResponse.json(
        { message: 'User is already a member' },
        { status: 400 }
      );
    }

    // Verify user qualification
    const qualification = await checkUserMembershipQualification(
      session.user.id
    );

    if (!qualification.qualifies && qualifyingAmount < 80) {
      return NextResponse.json(
        {
          message: 'User does not qualify for membership',
          qualification,
        },
        { status: 400 }
      );
    }

    // 🔒 SECURITY FIX: Do NOT activate membership here
    // Membership activation ONLY happens after payment success
    // via OrderStatusHandler.handlePaymentSuccess()
    //
    // This endpoint now only validates eligibility and confirms
    // that the user is ready to proceed with checkout.
    //
    // The actual flow is:
    // 1. User provides NRIC (via MembershipCheckoutBanner)
    // 2. Order created with pendingMembership (includes NRIC)
    // 3. Payment processed
    // 4. Payment success webhook → OrderStatusHandler → activateUserMembership()

    // Create audit log for membership registration intent (not activation)
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'Membership',
        resourceId: session.user.id,
        details: {
          membershipRegistrationIntent: true,
          qualifyingAmount,
          orderId,
          registeredAt: new Date().toISOString(),
          acceptedTerms: acceptTerms,
          note: 'User registered intent - activation pending payment',
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: 'Registration confirmed - proceed with checkout and payment to activate membership',
      membership: {
        isActive: false, // Not active yet - requires payment
        isPending: true,
        qualifyingAmount,
        note: 'Complete your purchase to activate membership',
      },
    });
  } catch (error) {
    console.error('Error registering membership:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid registration data', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to register membership' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/membership/register - Check membership eligibility
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is already a member
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isMember: true,
        memberSince: true,
        membershipTotal: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user.isMember) {
      return NextResponse.json({
        eligible: false,
        reason: 'Already a member',
        membership: {
          isActive: true,
          memberSince: user.memberSince,
          membershipTotal: user.membershipTotal,
        },
      });
    }

    // Check qualification based on cart or order history
    const qualification = await checkUserMembershipQualification(
      session.user.id
    );

    return NextResponse.json({
      eligible: qualification.qualifies,
      qualification,
      membership: {
        isActive: false,
        memberSince: null,
        membershipTotal: 0,
      },
    });
  } catch (error) {
    console.error('Error checking membership eligibility:', error);
    return NextResponse.json(
      { message: 'Failed to check eligibility' },
      { status: 500 }
    );
  }
}
