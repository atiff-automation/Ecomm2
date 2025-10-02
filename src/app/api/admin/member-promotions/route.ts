/**

export const dynamic = 'force-dynamic';

 * Admin Member Promotions API - JRM E-commerce Platform
 * Handles creation and management of member-exclusive promotions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UserRole } from '@prisma/client';
import { memberPromotionService } from '@/lib/member/member-promotion-service';
import { z } from 'zod';

const createMemberPromotionSchema = z.object({
  name: z.string().min(1, 'Promotion name is required'),
  description: z.string().min(1, 'Description is required'),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']),
  discountValue: z.number().min(0, 'Discount value must be positive'),
  minimumOrderValue: z.number().optional(),
  maximumDiscount: z.number().optional(),
  expiresAt: z.string().optional(),
  applicableToCategories: z.array(z.string()).optional(),
  applicableToProducts: z.array(z.string()).optional(),
  autoApply: z.boolean().default(false),
});

const createSeasonalPromotionSchema = z.object({
  season: z.enum(['NEW_YEAR', 'VALENTINE', 'RAYA', 'MERDEKA', 'CHRISTMAS']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.STAFF)
    ) {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'seasonal') {
      // Create seasonal promotion
      const { season } = createSeasonalPromotionSchema.parse(body);

      const code = await memberPromotionService.createSeasonalMemberPromotion(
        season,
        session.user.id
      );

      return NextResponse.json(
        {
          message: 'Seasonal member promotion created successfully',
          code,
        },
        { status: 201 }
      );
    } else {
      // Create custom member promotion
      const promotionData = createMemberPromotionSchema.parse(body);

      const config = {
        ...promotionData,
        expiresAt: promotionData.expiresAt
          ? new Date(promotionData.expiresAt)
          : undefined,
      };

      const code = await memberPromotionService.createMemberPromotion(
        config,
        session.user.id
      );

      return NextResponse.json(
        {
          message: 'Member promotion created successfully',
          code,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error creating member promotion:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid promotion data', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to create member promotion' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.STAFF)
    ) {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // This would return member promotion statistics and active promotions
    // For now, return a simple success response
    return NextResponse.json({
      message: 'Member promotions endpoint active',
    });
  } catch (error) {
    console.error('Error fetching member promotions:', error);
    return NextResponse.json(
      { message: 'Failed to fetch member promotions' },
      { status: 500 }
    );
  }
}
