/**
 * Member Referral Rewards API Route - Malaysian E-commerce Platform
 * Handles referral rewards management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { getUserReferralRewards } from '@/lib/referrals/referral-utils';
import { RewardStatus } from '@prisma/client';

// GET /api/member/referrals/rewards - Get user referral rewards
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
    const status = searchParams.get('status') as RewardStatus | undefined;

    const rewards = await getUserReferralRewards(session.user.id, status);

    return NextResponse.json({ rewards });
  } catch (error) {
    console.error('Referral rewards GET error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch referral rewards' },
      { status: 500 }
    );
  }
}

// PUT /api/member/referrals/rewards/:id - Claim/Use reward
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rewardId = searchParams.get('id');

    if (!rewardId) {
      return NextResponse.json(
        { message: 'Reward ID is required' },
        { status: 400 }
      );
    }

    // Verify reward belongs to user
    const reward = await prisma.referralReward.findFirst({
      where: {
        id: rewardId,
        userId: session.user.id,
        status: RewardStatus.PENDING,
      },
    });

    if (!reward) {
      return NextResponse.json(
        { message: 'Reward not found or already claimed' },
        { status: 404 }
      );
    }

    // Update reward status
    const updatedReward = await prisma.referralReward.update({
      where: { id: rewardId },
      data: {
        status: RewardStatus.ISSUED,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Reward claimed successfully',
      reward: updatedReward,
    });
  } catch (error) {
    console.error('Referral rewards PUT error:', error);
    return NextResponse.json(
      { message: 'Failed to claim reward' },
      { status: 500 }
    );
  }
}
