/**
 * Shopping Cart API - Malaysian E-commerce Platform
 * Handles cart operations with membership eligibility calculation
 * Supports both authenticated users and guest checkout
 * Protected with comprehensive security middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';
import {
  getMembershipConfig,
  calculateMembershipEligibility,
} from '@/lib/membership';
import {
  getGuestCartWithProducts,
  addToGuestCart,
  updateGuestCartItem,
  clearGuestCart,
} from '@/lib/cart/guest-cart';
import {
  getBestPrice,
  productQualifiesForMembership,
} from '@/lib/promotions/promotion-utils';
import { withApiProtection, protectionConfigs } from '@/lib/middleware/api-protection';
import config from '@/lib/config/app-config';

interface CartItemWithProduct {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    regularPrice: number;
    memberPrice: number;
    isPromotional: boolean;
    promotionalPrice?: number | null;
    promotionStartDate?: Date | null;
    promotionEndDate?: Date | null;
    isQualifyingForMembership: boolean;
    memberOnlyUntil?: Date | null;
    earlyAccessStart?: Date | null;
    status: string;
    categories: Array<{
      category: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
    images: Array<{
      url: string;
      altText?: string;
      isPrimary: boolean;
    }>;
  };
}

const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

const updateCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
});

/**
 * GET /api/cart - Get cart (authenticated user or guest)
 */
// Internal handler functions
async function handleGET() {
  try {
    const session = await getServerSession(authOptions);

    // Handle guest cart
    if (!session?.user) {
      const guestCartData = await getGuestCartWithProducts();

      // Transform guest cart to match CartResponse structure
      return NextResponse.json({
        id: 'guest_cart',
        items: guestCartData.items.map(item => ({
          id: item.id,
          productId: item.product.id,
          quantity: item.quantity,
          product: item.product,
        })),
        totalItems: guestCartData.summary.itemCount,
        subtotal: guestCartData.summary.subtotal,
        memberDiscount: guestCartData.summary.potentialSavings,
        promotionalDiscount: 0,
        total: guestCartData.summary.total,
        // Membership qualification data for guest cart
        qualifyingTotal: guestCartData.summary.qualifyingTotal || 0,
        membershipThreshold: guestCartData.summary.membershipThreshold || config.business.membership.threshold,
        qualifiesForMembership: guestCartData.summary.isEligibleForMembership || false,
        membershipProgress: guestCartData.summary.membershipProgress || 0,
        membershipRemaining: Math.max(0, (guestCartData.summary.membershipThreshold || config.business.membership.threshold) - (guestCartData.summary.qualifyingTotal || 0)),
        updatedAt: new Date().toISOString(),
      });
    }

    // Handle authenticated user cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            categories: {
              select: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert Decimal prices to numbers for calculation
    const convertedCartItems: CartItemWithProduct[] = cartItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        regularPrice: Number(item.product.regularPrice),
        memberPrice: Number(item.product.memberPrice),
        isPromotional: item.product.isPromotional,
        promotionalPrice: item.product.promotionalPrice
          ? Number(item.product.promotionalPrice)
          : null,
        promotionStartDate: item.product.promotionStartDate,
        promotionEndDate: item.product.promotionEndDate,
        isQualifyingForMembership: item.product.isQualifyingForMembership,
        memberOnlyUntil: item.product.memberOnlyUntil,
        earlyAccessStart: item.product.earlyAccessStart,
        status: item.product.status,
        categories: item.product.categories.map(cat => ({
          category: {
            id: cat.category.id,
            name: cat.category.name,
            slug: cat.category.slug,
          },
        })),
        images: item.product.images.map(img => ({
          url: img.url,
          altText: img.altText || '',
          isPrimary: img.isPrimary,
        })),
      },
    }));

    // Calculate cart totals and membership eligibility
    const cartSummary = await calculateCartSummary(
      convertedCartItems,
      session.user.isMember
    );

    return NextResponse.json({
      id: `cart_${session.user.id}`,
      items: cartItems.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: {
          ...item.product,
          primaryImage: item.product.images[0] || null,
          images: undefined, // Remove images array to keep response clean
        },
      })),
      totalItems: cartSummary.itemCount,
      subtotal: cartSummary.subtotal,
      memberDiscount: cartSummary.potentialSavings,
      promotionalDiscount: 0, // TODO: Calculate promotional discounts
      total: cartSummary.total,
      // Membership qualification data
      qualifyingTotal: cartSummary.qualifyingTotal,
      membershipThreshold: cartSummary.membershipThreshold,
      qualifiesForMembership: cartSummary.isEligibleForMembership,
      membershipProgress: cartSummary.membershipProgress,
      membershipRemaining: cartSummary.amountNeededForMembership,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { message: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart - Add item to cart (authenticated user or guest)
 */
async function handlePOST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { productId, quantity } = addToCartSchema.parse(body);

    // Verify product exists and is active
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        status: 'ACTIVE',
      },
    });

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found or unavailable' },
        { status: 404 }
      );
    }

    // Check stock availability
    if (product.stockQuantity < quantity) {
      return NextResponse.json(
        {
          message: 'Insufficient stock',
          availableStock: product.stockQuantity,
        },
        { status: 400 }
      );
    }

    // Handle guest cart
    if (!session?.user) {
      addToGuestCart(productId, quantity);
      // Return full cart data like GET endpoint does
      const guestCartData = await getGuestCartWithProducts();

      return NextResponse.json(
        {
          id: 'guest_cart',
          items: guestCartData.items.map(item => ({
            id: item.id,
            productId: item.product.id,
            quantity: item.quantity,
            product: item.product,
          })),
          totalItems: guestCartData.summary.itemCount,
          subtotal: guestCartData.summary.subtotal,
          memberDiscount: guestCartData.summary.potentialSavings,
          promotionalDiscount: 0,
          total: guestCartData.summary.total,
          // Membership qualification data for guest cart
          qualifyingTotal: guestCartData.summary.qualifyingTotal || 0,
          membershipThreshold: guestCartData.summary.membershipThreshold || 80,
          qualifiesForMembership: guestCartData.summary.isEligibleForMembership || false,
          membershipProgress: guestCartData.summary.membershipProgress || 0,
          membershipRemaining: Math.max(0, (guestCartData.summary.membershipThreshold || 80) - (guestCartData.summary.qualifyingTotal || 0)),
          updatedAt: new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    // Handle authenticated user cart
    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId,
        },
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
      create: {
        userId: session.user.id,
        productId: productId,
        quantity: quantity,
      },
      include: {
        product: {
          include: {
            categories: {
              select: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });

    // Check final stock after update
    if (cartItem.quantity > product.stockQuantity) {
      // Update to max available stock
      await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: product.stockQuantity },
      });
    }

    // Get full cart data after the add operation (same as GET endpoint)
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            categories: {
              select: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert Decimal prices to numbers for calculation
    const convertedCartItems: CartItemWithProduct[] = cartItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        regularPrice: Number(item.product.regularPrice),
        memberPrice: Number(item.product.memberPrice),
        isPromotional: item.product.isPromotional,
        promotionalPrice: item.product.promotionalPrice
          ? Number(item.product.promotionalPrice)
          : null,
        promotionStartDate: item.product.promotionStartDate,
        promotionEndDate: item.product.promotionEndDate,
        isQualifyingForMembership: item.product.isQualifyingForMembership,
        memberOnlyUntil: item.product.memberOnlyUntil,
        earlyAccessStart: item.product.earlyAccessStart,
        status: item.product.status,
        categories: item.product.categories.map(cat => ({
          category: {
            id: cat.category.id,
            name: cat.category.name,
            slug: cat.category.slug,
          },
        })),
        images: item.product.images.map(img => ({
          url: img.url,
          altText: img.altText || '',
          isPrimary: img.isPrimary,
        })),
      },
    }));

    // Calculate cart totals and membership eligibility
    const cartSummary = await calculateCartSummary(
      convertedCartItems,
      session.user.isMember
    );

    return NextResponse.json(
      {
        id: `cart_${session.user.id}`,
        items: cartItems.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product: {
            ...item.product,
            primaryImage: item.product.images[0] || null,
            images: undefined, // Remove images array to keep response clean
          },
        })),
        totalItems: cartSummary.itemCount,
        subtotal: cartSummary.subtotal,
        memberDiscount: cartSummary.potentialSavings,
        promotionalDiscount: 0, // TODO: Calculate promotional discounts
        total: cartSummary.total,
        // Membership qualification data - CRITICAL: Match GET response structure
        qualifyingTotal: cartSummary.qualifyingTotal,
        membershipThreshold: cartSummary.membershipThreshold,
        qualifiesForMembership: cartSummary.isEligibleForMembership,
        membershipProgress: cartSummary.membershipProgress,
        membershipRemaining: cartSummary.amountNeededForMembership,
        updatedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding to cart:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid cart data', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cart - Update cart item quantity (authenticated user or guest)
 */
async function handlePUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { productId, quantity } = updateCartSchema.parse(body);

    // Handle guest cart
    if (!session?.user) {
      if (quantity === 0) {
        updateGuestCartItem(productId, 0);
      } else {
        // Verify product exists and check stock
        const product = await prisma.product.findFirst({
          where: {
            id: productId,
            status: 'ACTIVE',
          },
        });

        if (!product) {
          return NextResponse.json(
            { message: 'Product not found or unavailable' },
            { status: 404 }
          );
        }

        if (product.stockQuantity < quantity) {
          return NextResponse.json(
            {
              message: 'Insufficient stock',
              availableStock: product.stockQuantity,
            },
            { status: 400 }
          );
        }

        updateGuestCartItem(productId, quantity);
      }

      // Return full cart data like GET endpoint does
      const guestCartData = await getGuestCartWithProducts();
      
      return NextResponse.json({
        id: 'guest_cart',
        items: guestCartData.items.map(item => ({
          id: item.id,
          productId: item.product.id,
          quantity: item.quantity,
          product: item.product,
        })),
        totalItems: guestCartData.summary.itemCount,
        subtotal: guestCartData.summary.subtotal,
        memberDiscount: guestCartData.summary.potentialSavings,
        promotionalDiscount: 0,
        total: guestCartData.summary.total,
        // Membership qualification data for guest cart
        qualifyingTotal: guestCartData.summary.qualifyingTotal || 0,
        membershipThreshold: guestCartData.summary.membershipThreshold || config.business.membership.threshold,
        qualifiesForMembership: guestCartData.summary.isEligibleForMembership || false,
        membershipProgress: guestCartData.summary.membershipProgress || 0,
        membershipRemaining: Math.max(0, (guestCartData.summary.membershipThreshold || config.business.membership.threshold) - (guestCartData.summary.qualifyingTotal || 0)),
        updatedAt: new Date().toISOString(),
      });
    }

    // Handle authenticated user cart
    // If quantity is 0, remove the item
    if (quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: {
          userId: session.user.id,
          productId: productId,
        },
      });
    } else {
      // Verify product exists and check stock
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          status: 'ACTIVE',
        },
      });

      if (!product) {
        return NextResponse.json(
          { message: 'Product not found or unavailable' },
          { status: 404 }
        );
      }

      if (product.stockQuantity < quantity) {
        return NextResponse.json(
          {
            message: 'Insufficient stock',
            availableStock: product.stockQuantity,
          },
          { status: 400 }
        );
      }

      // Update cart item
      await prisma.cartItem.update({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId: productId,
          },
        },
        data: { quantity },
      });
    }

    // Get full cart data after the update operation (same as GET endpoint)
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            categories: {
              select: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert Decimal prices to numbers for calculation
    const convertedCartItems: CartItemWithProduct[] = cartItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        regularPrice: Number(item.product.regularPrice),
        memberPrice: Number(item.product.memberPrice),
        isPromotional: item.product.isPromotional,
        promotionalPrice: item.product.promotionalPrice
          ? Number(item.product.promotionalPrice)
          : null,
        promotionStartDate: item.product.promotionStartDate,
        promotionEndDate: item.product.promotionEndDate,
        isQualifyingForMembership: item.product.isQualifyingForMembership,
        memberOnlyUntil: item.product.memberOnlyUntil,
        earlyAccessStart: item.product.earlyAccessStart,
        status: item.product.status,
        categories: item.product.categories.map(cat => ({
          category: {
            id: cat.category.id,
            name: cat.category.name,
            slug: cat.category.slug,
          },
        })),
        images: item.product.images.map(img => ({
          url: img.url,
          altText: img.altText || '',
          isPrimary: img.isPrimary,
        })),
      },
    }));

    // Calculate cart totals and membership eligibility
    const cartSummary = await calculateCartSummary(
      convertedCartItems,
      session.user.isMember
    );

    return NextResponse.json({
      id: `cart_${session.user.id}`,
      items: cartItems.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: {
          ...item.product,
          primaryImage: item.product.images[0] || null,
          images: undefined, // Remove images array to keep response clean
        },
      })),
      totalItems: cartSummary.itemCount,
      subtotal: cartSummary.subtotal,
      memberDiscount: cartSummary.potentialSavings,
      promotionalDiscount: 0, // TODO: Calculate promotional discounts
      total: cartSummary.total,
      // Membership qualification data
      qualifyingTotal: cartSummary.qualifyingTotal,
      membershipThreshold: cartSummary.membershipThreshold,
      qualifiesForMembership: cartSummary.isEligibleForMembership,
      membershipProgress: cartSummary.membershipProgress,
      membershipRemaining: cartSummary.amountNeededForMembership,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating cart:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid cart data', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart - Clear entire cart (authenticated user or guest)
 */
async function handleDELETE() {
  try {
    const session = await getServerSession(authOptions);

    // Handle guest cart
    if (!session?.user) {
      clearGuestCart();
      return NextResponse.json({
        message: 'Cart cleared successfully',
      });
    }

    // Handle authenticated user cart
    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { message: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}

/**
 * Calculate cart summary with membership eligibility using comprehensive promotional logic
 */
async function calculateCartSummary(
  cartItems: CartItemWithProduct[],
  isMember: boolean
) {
  // Get membership threshold from system config (consistent with membership-check endpoint)
  const thresholdConfig = await prisma.systemConfig.findFirst({
    where: {
      key: 'membership_threshold',
    },
  });
  const membershipThreshold = Number(thresholdConfig?.value) || config.business.membership.threshold;

  let totalItems = 0;
  let subtotal = 0;
  let memberSubtotal = 0;
  let applicableSubtotal = 0;
  let qualifyingTotal = 0;

  // Calculate totals using comprehensive promotional logic
  for (const cartItem of cartItems) {
    const { product, quantity } = cartItem;
    totalItems += quantity;

    // Use comprehensive pricing logic that considers promotions, membership, and early access
    const priceInfo = getBestPrice(
      {
        isPromotional: product.isPromotional,
        promotionalPrice: product.promotionalPrice,
        promotionStartDate: product.promotionStartDate,
        promotionEndDate: product.promotionEndDate,
        isQualifyingForMembership: product.isQualifyingForMembership,
        memberOnlyUntil: product.memberOnlyUntil,
        earlyAccessStart: product.earlyAccessStart,
        regularPrice: product.regularPrice,
        memberPrice: product.memberPrice,
      },
      isMember
    );

    const itemSubtotal = product.regularPrice * quantity;
    const memberItemSubtotal = product.memberPrice * quantity;
    const applicableItemSubtotal = priceInfo.price * quantity;

    subtotal += itemSubtotal;
    memberSubtotal += memberItemSubtotal;
    applicableSubtotal += applicableItemSubtotal;

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

    if (finalQualification) {
      qualifyingTotal += applicableItemSubtotal;
    }
  }

  // Calculate potential savings and membership progress
  const potentialSavings = isMember
    ? subtotal - applicableSubtotal
    : subtotal - memberSubtotal;
  const membershipProgress = Math.min(
    (qualifyingTotal / membershipThreshold) * 100,
    100
  );
  const isEligibleForMembership = qualifyingTotal >= membershipThreshold;
  const amountNeededForMembership = Math.max(
    0,
    membershipThreshold - qualifyingTotal
  );

  return {
    itemCount: totalItems,
    subtotal,
    memberSubtotal,
    applicableSubtotal,
    potentialSavings: Math.max(0, potentialSavings),

    // Membership eligibility using comprehensive promotional logic
    qualifyingTotal,
    membershipThreshold,
    isEligibleForMembership,
    membershipProgress,
    amountNeededForMembership,

    // Tax and shipping (to be calculated later)
    taxAmount: 0,
    shippingCost: 0,
    total: applicableSubtotal,
  };
}

// Protected API exports with security middleware
export const GET = withApiProtection(handleGET, protectionConfigs.standard);
export const POST = withApiProtection(handlePOST, protectionConfigs.standard);
export const PUT = withApiProtection(handlePUT, protectionConfigs.standard);
export const DELETE = withApiProtection(handleDELETE, protectionConfigs.standard);
