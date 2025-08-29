/**
 * Guest Cart Management - Session-based cart for non-authenticated users
 */

import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import {
  getBestPrice,
  productQualifiesForMembership,
} from '@/lib/promotions/promotion-utils';

export interface GuestCartItem {
  productId: string;
  quantity: number;
  addedAt: string;
}

export interface GuestCart {
  items: GuestCartItem[];
  updatedAt: string;
}

const GUEST_CART_COOKIE_NAME = 'guest_cart';
const GUEST_CART_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Get guest cart from cookies
 */
export function getGuestCart(): GuestCart {
  const cookieStore = cookies();
  const cartCookie = cookieStore.get(GUEST_CART_COOKIE_NAME);

  if (!cartCookie?.value) {
    return { items: [], updatedAt: new Date().toISOString() };
  }

  try {
    const cart = JSON.parse(cartCookie.value);

    // Validate cart structure
    if (!cart.items || !Array.isArray(cart.items)) {
      return { items: [], updatedAt: new Date().toISOString() };
    }

    // Filter out invalid items
    const validItems = cart.items.filter(
      (item: any) =>
        item.productId && typeof item.quantity === 'number' && item.quantity > 0
    );

    return {
      items: validItems,
      updatedAt: cart.updatedAt || new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Invalid guest cart cookie:', error);
    return { items: [], updatedAt: new Date().toISOString() };
  }
}

/**
 * Set guest cart in cookies
 */
export function setGuestCart(cart: GuestCart): void {
  const cookieStore = cookies();

  cookieStore.set(GUEST_CART_COOKIE_NAME, JSON.stringify(cart), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: GUEST_CART_MAX_AGE,
    path: '/',
  });
}

/**
 * Add item to guest cart
 */
export function addToGuestCart(productId: string, quantity: number): GuestCart {
  const cart = getGuestCart();
  const existingItemIndex = cart.items.findIndex(
    item => item.productId === productId
  );

  if (existingItemIndex >= 0) {
    // Update existing item
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    cart.items.push({
      productId,
      quantity,
      addedAt: new Date().toISOString(),
    });
  }

  cart.updatedAt = new Date().toISOString();
  setGuestCart(cart);
  return cart;
}

/**
 * Update item quantity in guest cart
 */
export function updateGuestCartItem(
  productId: string,
  quantity: number
): GuestCart {
  const cart = getGuestCart();

  if (quantity <= 0) {
    // Remove item
    cart.items = cart.items.filter(item => item.productId !== productId);
  } else {
    // Update quantity
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === productId
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity = quantity;
    } else {
      // Add new item if it doesn't exist
      cart.items.push({
        productId,
        quantity,
        addedAt: new Date().toISOString(),
      });
    }
  }

  cart.updatedAt = new Date().toISOString();
  setGuestCart(cart);
  return cart;
}

/**
 * Remove item from guest cart
 */
export function removeFromGuestCart(productId: string): GuestCart {
  return updateGuestCartItem(productId, 0);
}

/**
 * Clear guest cart
 */
export function clearGuestCart(): void {
  const cookieStore = cookies();
  cookieStore.delete(GUEST_CART_COOKIE_NAME);
}

/**
 * Get guest cart with product details
 */
export async function getGuestCartWithProducts() {
  const cart = getGuestCart();

  if (cart.items.length === 0) {
    return {
      items: [],
      summary: {
        itemCount: 0,
        subtotal: 0,
        memberSubtotal: 0,
        applicableSubtotal: 0,
        potentialSavings: 0,
        qualifyingTotal: 0,
        membershipThreshold: 80,
        isEligibleForMembership: false,
        membershipProgress: 0,
        amountNeededForMembership: 80,
        taxAmount: 0,
        shippingCost: 0,
        total: 0,
      },
    };
  }

  // Get products for cart items
  const productIds = cart.items.map(item => item.productId);
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
              slug: true,
            },
          },
        },
      },
      images: {
        select: {
          url: true,
          altText: true,
          isPrimary: true,
        },
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
      },
    },
  });

  // Build cart items with product data
  const cartItems = cart.items
    .map(cartItem => {
      const product = products.find(p => p.id === cartItem.productId);
      if (!product) {
        return null;
      }

      return {
        id: `guest_${cartItem.productId}`,
        quantity: cartItem.quantity,
        addedAt: cartItem.addedAt,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription,
          regularPrice: Number(product.regularPrice),
          memberPrice: Number(product.memberPrice),
          promotionalPrice: product.promotionalPrice
            ? Number(product.promotionalPrice)
            : null,
          promotionStartDate: product.promotionStartDate,
          promotionEndDate: product.promotionEndDate,
          stockQuantity: product.stockQuantity,
          isPromotional: product.isPromotional,
          isQualifyingForMembership: product.isQualifyingForMembership,
          memberOnlyUntil: product.memberOnlyUntil,
          earlyAccessStart: product.earlyAccessStart,
          category: {
            id: product.categories?.[0]?.category?.id || '',
            name: product.categories?.[0]?.category?.name || 'Uncategorized',
            slug: product.categories?.[0]?.category?.slug || '',
          },
          primaryImage:
            product.images.find(img => img.isPrimary) ||
            product.images[0] ||
            null,
        },
      };
    })
    .filter(Boolean);

  // Calculate cart summary using centralized pricing logic
  let itemCount = 0;
  let subtotal = 0;
  let memberSubtotal = 0;
  let applicableSubtotal = 0;
  let qualifyingTotal = 0;

  cartItems.forEach(item => {
    if (!item) {
      return;
    }

    itemCount += item.quantity;

    // Use centralized pricing logic for guests (isMember = false)
    const priceInfo = getBestPrice(
      {
        isPromotional: item.product.isPromotional,
        promotionalPrice: item.product.promotionalPrice,
        promotionStartDate: item.product.promotionStartDate,
        promotionEndDate: item.product.promotionEndDate,
        isQualifyingForMembership: item.product.isQualifyingForMembership,
        memberOnlyUntil: item.product.memberOnlyUntil,
        earlyAccessStart: item.product.earlyAccessStart,
        regularPrice: item.product.regularPrice,
        memberPrice: item.product.memberPrice,
      },
      false // Guests are not members
    );

    // Debug log for guest cart pricing
    if (process.env.NODE_ENV === 'development') {
      console.log(`🛒 Guest Cart - Product: ${item.product.name}`);
      console.log(`   - isPromotional: ${item.product.isPromotional}`);
      console.log(`   - promotionalPrice: ${item.product.promotionalPrice}`);
      console.log(`   - regularPrice: ${item.product.regularPrice}`);
      console.log(`   - priceInfo.priceType: ${priceInfo.priceType}`);
      console.log(`   - priceInfo.price: ${priceInfo.price}`);
      console.log(`   - quantity: ${item.quantity}`);
      console.log(`   - item subtotal: ${priceInfo.price * item.quantity}`);
      console.log('---');
    }

    const regularPrice = item.product.regularPrice * item.quantity;
    const memberPrice = item.product.memberPrice * item.quantity;
    const effectivePrice = priceInfo.price * item.quantity;

    subtotal += regularPrice;
    memberSubtotal += memberPrice;
    applicableSubtotal += effectivePrice;

    // Check if product qualifies for membership using centralized logic
    const qualifiesForMembership = productQualifiesForMembership({
      isPromotional: item.product.isPromotional,
      promotionalPrice: item.product.promotionalPrice,
      promotionStartDate: item.product.promotionStartDate,
      promotionEndDate: item.product.promotionEndDate,
      isQualifyingForMembership: item.product.isQualifyingForMembership,
      memberOnlyUntil: item.product.memberOnlyUntil,
      earlyAccessStart: item.product.earlyAccessStart,
    });

    // CRITICAL: If using promotional price, don't count towards membership qualification
    const isUsingPromotionalPrice = priceInfo.priceType === 'promotional';
    const finalQualification =
      qualifiesForMembership && !isUsingPromotionalPrice;

    if (finalQualification) {
      qualifyingTotal += effectivePrice;
    }
  });

  const potentialSavings = subtotal - memberSubtotal;
  const membershipThreshold = 80;
  const isEligibleForMembership = qualifyingTotal >= membershipThreshold;
  const membershipProgress = Math.min(
    (qualifyingTotal / membershipThreshold) * 100,
    100
  );
  const amountNeededForMembership = Math.max(
    0,
    membershipThreshold - qualifyingTotal
  );

  // Tax and shipping to be calculated at checkout (matches authenticated cart approach)
  const taxAmount = 0; // Tax calculation deferred to checkout
  const shippingCost = 0; // Shipping calculation deferred to checkout
  const total = applicableSubtotal; // Total = price user actually pays (before tax/shipping)

  return {
    items: cartItems,
    summary: {
      itemCount,
      subtotal: Math.round(subtotal * 100) / 100,
      memberSubtotal: Math.round(memberSubtotal * 100) / 100,
      applicableSubtotal: Math.round(applicableSubtotal * 100) / 100,
      potentialSavings: Math.round(potentialSavings * 100) / 100,
      qualifyingTotal: Math.round(qualifyingTotal * 100) / 100,
      membershipThreshold,
      isEligibleForMembership,
      membershipProgress: Math.round(membershipProgress * 10) / 10,
      amountNeededForMembership:
        Math.round(amountNeededForMembership * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      shippingCost,
      total: Math.round(total * 100) / 100,
    },
  };
}

/**
 * Transfer guest cart to user account
 */
export async function transferGuestCartToUser(userId: string): Promise<void> {
  const guestCart = getGuestCart();

  if (guestCart.items.length === 0) {
    return;
  }

  try {
    // Get existing user cart items
    const existingCartItems = await prisma.cartItem.findMany({
      where: { userId },
      select: { productId: true, quantity: true },
    });

    // Validate that all guest cart products exist in the database
    const guestProductIds = guestCart.items.map(item => item.productId);
    const validProducts = await prisma.product.findMany({
      where: {
        id: { in: guestProductIds },
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    const validProductIds = new Set(validProducts.map(p => p.id));

    // Transfer only valid guest cart items to user's cart
    for (const guestItem of guestCart.items) {
      // Skip items with invalid product IDs
      if (!validProductIds.has(guestItem.productId)) {
        console.warn(`Skipping invalid product ID: ${guestItem.productId}`);
        continue;
      }

      const existingItem = existingCartItems.find(
        item => item.productId === guestItem.productId
      );

      if (existingItem) {
        // Update existing item quantity
        await prisma.cartItem.updateMany({
          where: {
            userId,
            productId: guestItem.productId,
          },
          data: {
            quantity: existingItem.quantity + guestItem.quantity,
          },
        });
      } else {
        // Create new cart item
        await prisma.cartItem.create({
          data: {
            userId,
            productId: guestItem.productId,
            quantity: guestItem.quantity,
          },
        });
      }
    }

    // Clear guest cart after successful transfer
    clearGuestCart();
  } catch (error) {
    console.error('Error transferring guest cart to user:', error);
    throw error;
  }
}
