/**
 * Shopping Cart API - Malaysian E-commerce Platform
 * Handles cart operations with membership eligibility calculation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';

interface CartItemWithProduct {
  id: string;
  quantity: number;
  product: {
    id: string;
    regularPrice: number;
    memberPrice: number;
    isPromotional: boolean;
    status: string;
    category: {
      isQualifyingCategory: boolean;
    };
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
 * GET /api/cart - Get user's cart with membership eligibility calculation
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

    // Get cart items with product details
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                isQualifyingCategory: true,
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

    // Calculate cart totals and membership eligibility
    const cartSummary = calculateCartSummary(cartItems, session.user.isMember);

    return NextResponse.json({
      items: cartItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          ...item.product,
          primaryImage: item.product.images[0] || null,
          images: undefined, // Remove images array to keep response clean
        },
      })),
      summary: cartSummary,
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
 * POST /api/cart - Add item to cart
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

    // Add or update cart item
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
            category: true,
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

      return NextResponse.json(
        {
          message: 'Added to cart (adjusted to available stock)',
          cartItem: {
            ...cartItem,
            quantity: product.stockQuantity,
          },
          availableStock: product.stockQuantity,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: 'Added to cart successfully',
        cartItem: {
          ...cartItem,
          product: {
            ...cartItem.product,
            primaryImage: cartItem.product.images[0] || null,
            images: undefined,
          },
        },
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
 * PUT /api/cart - Update cart item quantity
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, quantity } = updateCartSchema.parse(body);

    // If quantity is 0, remove the item
    if (quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: {
          userId: session.user.id,
          productId: productId,
        },
      });

      return NextResponse.json({
        message: 'Item removed from cart',
      });
    }

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
    const cartItem = await prisma.cartItem.update({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId,
        },
      },
      data: { quantity },
      include: {
        product: {
          include: {
            category: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Cart updated successfully',
      cartItem: {
        ...cartItem,
        product: {
          ...cartItem.product,
          primaryImage: cartItem.product.images[0] || null,
          images: undefined,
        },
      },
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
 * DELETE /api/cart - Clear entire cart
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

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
 * Calculate cart summary with membership eligibility
 */
function calculateCartSummary(
  cartItems: CartItemWithProduct[],
  isMember: boolean
) {
  let subtotal = 0;
  let memberSubtotal = 0;
  let qualifyingTotal = 0;
  let itemCount = 0;

  cartItems.forEach(item => {
    const product = item.product;
    const quantity = item.quantity;

    itemCount += quantity;

    const regularPrice = parseFloat(product.regularPrice.toString());
    const memberPrice = parseFloat(product.memberPrice.toString());

    subtotal += regularPrice * quantity;
    memberSubtotal += memberPrice * quantity;

    // Check if this product qualifies for membership calculation
    if (
      product.category.isQualifyingCategory &&
      !product.isPromotional &&
      product.status === 'ACTIVE'
    ) {
      qualifyingTotal += regularPrice * quantity;
    }
  });

  const membershipThreshold = 80; // RM 80 - could be configurable
  const isEligibleForMembership = qualifyingTotal >= membershipThreshold;
  const membershipProgress = Math.min(
    (qualifyingTotal / membershipThreshold) * 100,
    100
  );
  const amountNeededForMembership = Math.max(
    0,
    membershipThreshold - qualifyingTotal
  );

  // Calculate applicable total based on member status
  const applicableSubtotal = isMember ? memberSubtotal : subtotal;
  const potentialSavings = subtotal - memberSubtotal;

  return {
    itemCount,
    subtotal: parseFloat(subtotal.toFixed(2)),
    memberSubtotal: parseFloat(memberSubtotal.toFixed(2)),
    applicableSubtotal: parseFloat(applicableSubtotal.toFixed(2)),
    potentialSavings: parseFloat(potentialSavings.toFixed(2)),

    // Membership eligibility
    qualifyingTotal: parseFloat(qualifyingTotal.toFixed(2)),
    membershipThreshold,
    isEligibleForMembership,
    membershipProgress: parseFloat(membershipProgress.toFixed(1)),
    amountNeededForMembership: parseFloat(amountNeededForMembership.toFixed(2)),

    // Tax and shipping (to be calculated later)
    taxAmount: 0,
    shippingCost: 0,
    total: parseFloat(applicableSubtotal.toFixed(2)),
  };
}
