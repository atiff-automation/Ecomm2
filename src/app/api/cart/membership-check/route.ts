import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import {
  calculatePromotionStatus,
  productQualifiesForMembership,
  getBestPrice,
} from '@/lib/promotions/promotion-utils';

interface CartItem {
  productId: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { cartItems }: { cartItems: CartItem[] } = body;

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({
        eligible: false,
        qualifyingTotal: 0,
        threshold: 80,
        message: 'Cart is empty',
      });
    }

    // Get membership settings (threshold amount) - using system config instead
    const thresholdConfig = await prisma.systemConfig.findFirst({
      where: {
        key: 'membership_threshold',
      },
    });

    const threshold = Number(thresholdConfig?.value) || 80;

    // Get products with their categories
    const productIds = cartItems.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: 'ACTIVE',
      },
      include: {
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    let qualifyingTotal = 0;
    const qualifyingItems: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      subtotal: number;
    }> = [];

    const nonQualifyingItems: Array<{
      productId: string;
      name: string;
      reason: string;
      price: number;
      quantity: number;
    }> = [];

    // Calculate qualifying total
    for (const cartItem of cartItems) {
      const product = products.find(p => p.id === cartItem.productId);

      if (!product) {
        continue;
      }

      // Use comprehensive pricing logic that considers promotions, membership, and early access
      const isMember = session?.user?.isMember || false;
      const priceInfo = getBestPrice(
        {
          isPromotional: product.isPromotional,
          promotionalPrice: product.promotionalPrice,
          promotionStartDate: product.promotionStartDate,
          promotionEndDate: product.promotionEndDate,
          isQualifyingForMembership: product.isQualifyingForMembership,
          memberOnlyUntil: product.memberOnlyUntil,
          earlyAccessStart: product.earlyAccessStart,
          regularPrice: Number(product.regularPrice),
          memberPrice: Number(product.memberPrice || product.regularPrice),
        },
        isMember
      );

      const price = priceInfo.price;
      const subtotal = price * cartItem.quantity;

      // Debug logging - always show in development
      console.log(`🔍 Product: ${product.name}`);
      console.log(`   - isPromotional: ${product.isPromotional}`);
      console.log(`   - promotionalPrice: ${product.promotionalPrice}`);
      console.log(`   - regularPrice: ${product.regularPrice}`);
      console.log(`   - memberPrice: ${product.memberPrice}`);
      console.log(`   - priceInfo.priceType: ${priceInfo.priceType}`);
      console.log(`   - priceInfo.price: ${priceInfo.price}`);
      console.log(`   - isMember: ${isMember}`);
      console.log(`   - promotionStartDate: ${product.promotionStartDate}`);
      console.log(`   - promotionEndDate: ${product.promotionEndDate}`);

      // Check if product qualifies for membership calculation using comprehensive promotional logic
      const qualifiesForMembership = productQualifiesForMembership({
        isPromotional: product.isPromotional,
        promotionalPrice: product.promotionalPrice,
        promotionStartDate: product.promotionStartDate,
        promotionEndDate: product.promotionEndDate,
        isQualifyingForMembership: product.isQualifyingForMembership,
        memberOnlyUntil: product.memberOnlyUntil,
        earlyAccessStart: product.earlyAccessStart,
      });

      // CRITICAL: If the user is getting promotional pricing, the product should NOT qualify
      // This ensures consistency between pricing and qualification
      const isUsingPromotionalPrice = priceInfo.priceType === 'promotional';
      const finalQualification =
        qualifiesForMembership && !isUsingPromotionalPrice;

      // More debug logging
      console.log(`   - qualifiesForMembership: ${qualifiesForMembership}`);
      console.log(`   - isUsingPromotionalPrice: ${isUsingPromotionalPrice}`);
      console.log(`   - finalQualification: ${finalQualification}`);
      console.log('---');

      if (!finalQualification) {
        // Determine the specific reason for non-qualification
        let reason = 'Product not eligible for membership calculation';

        if (isUsingPromotionalPrice) {
          reason =
            'Currently using promotional pricing (promotional products do not qualify for membership)';
        } else if (!qualifiesForMembership) {
          // Check if it's due to promotional product configuration
          const promotionStatus = calculatePromotionStatus({
            isPromotional: product.isPromotional,
            promotionalPrice: product.promotionalPrice,
            promotionStartDate: product.promotionStartDate,
            promotionEndDate: product.promotionEndDate,
            isQualifyingForMembership: product.isQualifyingForMembership,
            memberOnlyUntil: product.memberOnlyUntil,
            earlyAccessStart: product.earlyAccessStart,
            regularPrice: Number(product.regularPrice),
            memberPrice: Number(product.memberPrice || product.regularPrice),
          });

          if (promotionStatus.isActive) {
            reason =
              'Active promotional pricing (promotional products do not qualify)';
          } else if (product.isPromotional) {
            reason = 'Product marked as promotional';
          } else if (!product.isQualifyingForMembership) {
            reason =
              'Product specifically excluded from membership qualification';
          }
        }

        nonQualifyingItems.push({
          productId: product.id,
          name: product.name,
          reason,
          price,
          quantity: cartItem.quantity,
        });
      } else {
        // Product qualifies for membership calculation
        qualifyingTotal += subtotal;
        qualifyingItems.push({
          productId: product.id,
          name: product.name,
          price,
          quantity: cartItem.quantity,
          subtotal,
        });
      }
    }

    const eligible = qualifyingTotal >= threshold;
    const remaining = eligible ? 0 : Math.max(0, threshold - qualifyingTotal);

    return NextResponse.json({
      eligible,
      qualifyingTotal,
      threshold,
      remaining,
      message: eligible
        ? `Congratulations! You qualify for membership with RM ${qualifyingTotal.toFixed(2)} in eligible purchases.`
        : `Add RM ${remaining.toFixed(2)} more in eligible products to qualify for membership.`,
      qualifyingItems,
      nonQualifyingItems,
      isExistingMember: session?.user?.isMember || false,
    });
  } catch (error) {
    console.error('Error checking membership eligibility:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
