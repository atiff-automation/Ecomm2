/**
 * Member Referrals API Route - Malaysian E-commerce Platform
 * Handles member referral system endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import {
  getUserReferralMetrics,
  getUserReferralHistory,
  createReferral,
  generateReferralCode,
  generateReferralUrl,
} from '@/lib/referrals/referral-utils';

const createReferralSchema = z.object({
  email: z.string().email('Valid email is required'),
});

// GET /api/member/referrals - Get user referral data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    switch (type) {
      case 'overview':
        const metrics = await getUserReferralMetrics(session.user.id);

        // Generate user's referral code if they don't have one
        const existingReferral = await prisma.memberReferral.findFirst({
          where: { referrerId: session.user.id },
        });

        let referralCode = existingReferral?.referralCode;
        if (!referralCode) {
          referralCode = await generateReferralCode(
            session.user.id,
            session.user.name || 'USER'
          );
        }

        const referralUrl = generateReferralUrl(referralCode);

        return NextResponse.json({
          metrics,
          referralCode,
          referralUrl,
        });

      case 'history':
        const history = await getUserReferralHistory(
          session.user.id,
          page,
          limit
        );
        return NextResponse.json(history);

      default:
        return NextResponse.json(
          { message: 'Invalid type parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Referrals GET error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch referral data' },
      { status: 500 }
    );
  }
}

// POST /api/member/referrals - Create new referral
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
    const { email } = createReferralSchema.parse(body);

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'This email is already registered' },
        { status: 400 }
      );
    }

    // Check for existing referral to this email
    const existingReferral = await prisma.memberReferral.findFirst({
      where: {
        referrerId: session.user.id,
        referredEmail: email,
        status: { in: ['PENDING', 'REGISTERED'] },
      },
    });

    if (existingReferral) {
      return NextResponse.json(
        { message: 'You have already referred this email address' },
        { status: 400 }
      );
    }

    // Create the referral
    const referral = await createReferral(session.user.id, email);
    const referralUrl = generateReferralUrl(referral.referralCode);

    return NextResponse.json({
      message: 'Referral created successfully',
      referral: {
        id: referral.id,
        referralCode: referral.referralCode,
        referredEmail: referral.referredEmail,
        referralUrl,
        status: referral.status,
        createdAt: referral.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Referrals POST error:', error);
    return NextResponse.json(
      { message: 'Failed to create referral' },
      { status: 500 }
    );
  }
}
