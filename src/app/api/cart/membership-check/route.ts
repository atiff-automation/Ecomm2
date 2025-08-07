import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

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
        category: {
          select: {
            id: true,
            name: true,
            isQualifyingCategory: true,
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

      const price = session?.user?.isMember
        ? Number(product.memberPrice || product.regularPrice)
        : Number(product.regularPrice);

      const subtotal = price * cartItem.quantity;

      // Check if product qualifies for membership calculation
      if (product.isPromotional) {
        // Promotional products don't count toward membership
        nonQualifyingItems.push({
          productId: product.id,
          name: product.name,
          reason: 'Promotional product',
          price,
          quantity: cartItem.quantity,
        });
      } else if (!product.category?.isQualifyingCategory) {
        // Category doesn't qualify for membership
        nonQualifyingItems.push({
          productId: product.id,
          name: product.name,
          reason: 'Category not eligible for membership',
          price,
          quantity: cartItem.quantity,
        });
      } else {
        // Product qualifies
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
