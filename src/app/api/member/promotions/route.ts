/**

export const dynamic = 'force-dynamic';

 * Member Promotions API - JRM E-commerce Platform
 * Provides member-exclusive promotions and benefit information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { memberPromotionService } from '@/lib/member/member-promotion-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is a member
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isMember: true },
    });

    if (!user?.isMember) {
      return NextResponse.json(
        { message: 'Member access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'benefits') {
      // Get member benefit summary
      const benefits = await memberPromotionService.getMemberBenefitSummary(
        session.user.id
      );

      return NextResponse.json({
        benefits,
      });
    } else if (type === 'check-benefits') {
      // Check and create automated benefits
      const createdCodes =
        await memberPromotionService.checkAndCreateAutomatedBenefits(
          session.user.id
        );

      return NextResponse.json({
        message: 'Benefits checked',
        newBenefits: createdCodes.length,
        codes: createdCodes,
      });
    } else {
      // Get available member promotions
      const promotions =
        await memberPromotionService.getAvailableMemberPromotions(
          session.user.id
        );

      // Format response
      const formattedPromotions = promotions.map(promo => ({
        code: promo.code,
        name: promo.name,
        description: promo.description,
        discountType: promo.discountType,
        discountValue: Number(promo.discountValue),
        minimumOrderValue: promo.minimumOrderValue
          ? Number(promo.minimumOrderValue)
          : null,
        expiresAt: promo.expiresAt,
        isPublic: promo.isPublic,
      }));

      return NextResponse.json({
        promotions: formattedPromotions,
        count: formattedPromotions.length,
      });
    }
  } catch (error) {
    console.error('Error fetching member promotions:', error);
    return NextResponse.json(
      { message: 'Failed to fetch member promotions' },
      { status: 500 }
    );
  }
}
