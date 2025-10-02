/**

export const dynamic = 'force-dynamic';

 * Admin Referrals API Route - Malaysian E-commerce Platform
 * Admin management of referral system
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import {
  getReferralSettings,
  updateReferralSettings,
} from '@/lib/referrals/referral-utils';
import { ReferralRewardType } from '@prisma/client';

const referralSettingsSchema = z.object({
  referrerRewardType: z.nativeEnum(ReferralRewardType),
  referrerRewardAmount: z.number().positive(),
  refereeRewardType: z.nativeEnum(ReferralRewardType),
  refereeRewardAmount: z.number().positive(),
  minimumOrderAmount: z.number().positive(),
  rewardExpiryDays: z.number().positive(),
  maxReferralsPerMember: z.number().positive().nullable(),
  isActive: z.boolean(),
});

// GET /api/admin/referrals - Get referral analytics and settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    switch (type) {
      case 'overview':
        // Get referral analytics
        const [
          totalReferrals,
          successfulReferrals,
          pendingReferrals,
          totalRewards,
          settings,
        ] = await Promise.all([
          prisma.memberReferral.count(),
          prisma.memberReferral.count({ where: { status: 'COMPLETED' } }),
          prisma.memberReferral.count({ where: { status: 'PENDING' } }),
          prisma.referralReward.aggregate({
            _sum: { rewardAmount: true },
            where: { status: 'ISSUED' },
          }),
          getReferralSettings(),
        ]);

        const conversionRate =
          totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0;

        return NextResponse.json({
          analytics: {
            totalReferrals,
            successfulReferrals,
            pendingReferrals,
            totalRewards: Number(totalRewards._sum.rewardAmount || 0),
            conversionRate,
          },
          settings,
        });

      case 'referrals':
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const [referrals, total] = await Promise.all([
          prisma.memberReferral.findMany({
            include: {
              referrer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              referred: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              rewards: {
                include: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.memberReferral.count(),
        ]);

        return NextResponse.json({
          referrals,
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
        });

      case 'rewards':
        const rewardPage = parseInt(searchParams.get('page') || '1');
        const rewardLimit = parseInt(searchParams.get('limit') || '20');
        const rewardSkip = (rewardPage - 1) * rewardLimit;

        const [rewards, rewardTotal] = await Promise.all([
          prisma.referralReward.findMany({
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              referral: {
                include: {
                  referrer: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                  referred: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip: rewardSkip,
            take: rewardLimit,
          }),
          prisma.referralReward.count(),
        ]);

        return NextResponse.json({
          rewards,
          total: rewardTotal,
          pages: Math.ceil(rewardTotal / rewardLimit),
          currentPage: rewardPage,
        });

      default:
        return NextResponse.json(
          { message: 'Invalid type parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin referrals GET error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch referral data' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/referrals - Update referral settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const settings = referralSettingsSchema.parse(body);

    const updatedSettings = await updateReferralSettings(
      settings,
      session.user.id
    );

    return NextResponse.json({
      message: 'Referral settings updated successfully',
      settings: updatedSettings,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid settings data', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Admin referrals PUT error:', error);
    return NextResponse.json(
      { message: 'Failed to update referral settings' },
      { status: 500 }
    );
  }
}
