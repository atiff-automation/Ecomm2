import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/settings/membership/referrals - Get user referral data
 * Following @CLAUDE.md principles - systematic, DRY, single source of truth
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user referral code
    let userReferral = await prisma.memberReferral.findFirst({
      where: {
        referrerId: session.user.id,
        status: 'ACTIVE', // User's own referral record
      },
      select: {
        referralCode: true,
      }
    });

    // If no referral code exists, create one
    if (!userReferral) {
      const referralCode = await generateUniqueReferralCode(session.user.id);
      userReferral = await prisma.memberReferral.create({
        data: {
          referrerId: session.user.id,
          referralCode,
          status: 'ACTIVE',
        },
        select: {
          referralCode: true,
        }
      });
    }

    // Get referral statistics
    const [
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      totalRewards,
      availableRewards,
      recentReferrals
    ] = await Promise.all([
      // Total referrals made by this user
      prisma.memberReferral.count({
        where: {
          referrerId: session.user.id,
          referredId: { not: null }, // Only count actual referrals
        }
      }),
      
      // Pending referrals
      prisma.memberReferral.count({
        where: {
          referrerId: session.user.id,
          status: 'PENDING',
          referredId: { not: null },
        }
      }),
      
      // Completed referrals
      prisma.memberReferral.count({
        where: {
          referrerId: session.user.id,
          status: 'COMPLETED',
          referredId: { not: null },
        }
      }),
      
      // Total rewards earned
      prisma.referralReward.aggregate({
        where: {
          userId: session.user.id,
          status: { in: ['PENDING', 'PAID'] },
        },
        _sum: {
          rewardAmount: true,
        }
      }),
      
      // Available rewards (not yet paid)
      prisma.referralReward.aggregate({
        where: {
          userId: session.user.id,
          status: 'PENDING',
        },
        _sum: {
          rewardAmount: true,
        }
      }),
      
      // Recent referrals (last 10)
      prisma.memberReferral.findMany({
        where: {
          referrerId: session.user.id,
          referredId: { not: null },
        },
        select: {
          id: true,
          referredEmail: true,
          status: true,
          referralDate: true,
          referrerRewardAmount: true,
        },
        orderBy: {
          referralDate: 'desc',
        },
        take: 10,
      })
    ]);

    const referralData = {
      referralCode: userReferral.referralCode,
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      totalRewards: Number(totalRewards._sum.rewardAmount || 0),
      availableRewards: Number(availableRewards._sum.rewardAmount || 0),
      recentReferrals: recentReferrals.map(referral => ({
        id: referral.id,
        referredEmail: referral.referredEmail,
        status: referral.status,
        rewardAmount: referral.referrerRewardAmount ? Number(referral.referrerRewardAmount) : undefined,
        createdAt: referral.referralDate,
      })),
    };

    return NextResponse.json({
      success: true,
      data: referralData
    });

  } catch (error) {
    console.error('Get referral data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate a unique referral code for the user
 */
async function generateUniqueReferralCode(userId: string): Promise<string> {
  const maxAttempts = 10;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    // Generate code based on user ID and random suffix
    const userIdShort = userId.slice(-4).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referralCode = `${userIdShort}${randomSuffix}`;
    
    // Check if code already exists
    const existingCode = await prisma.memberReferral.findUnique({
      where: { referralCode },
      select: { id: true }
    });
    
    if (!existingCode) {
      return referralCode;
    }
    
    attempts++;
  }
  
  // Fallback to timestamp-based code if all attempts fail
  const timestamp = Date.now().toString(36).toUpperCase();
  return `REF${timestamp}`;
}