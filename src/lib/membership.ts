/**
 * Membership Service - Malaysian E-commerce Platform
 * Core membership logic and qualification system
 */

import { prisma } from '@/lib/db/prisma';
import { productQualifiesForMembership } from '@/lib/promotions/promotion-utils';

export interface MembershipConfig {
  membershipThreshold: number;
  enablePromotionalExclusion: boolean;
  requireQualifyingCategories: boolean;
  membershipBenefitsText: string;
  membershipTermsText: string;
}

export interface CartItemWithProduct {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    regularPrice: number;
    memberPrice: number;
    isPromotional: boolean;
    isQualifyingForMembership: boolean;
    promotionalPrice?: number | null;
    promotionStartDate?: Date | string | null;
    promotionEndDate?: Date | string | null;
    category: {
      id: string;
      name: string;
    };
  };
}

export interface MembershipCalculation {
  qualifyingTotal: number;
  totalItems: number;
  subtotal: number;
  memberSubtotal: number;
  potentialSavings: number;
  membershipThreshold: number;
  isEligibleForMembership: boolean;
  membershipProgress: number;
  amountNeededForMembership: number;
  applicableSubtotal: number;
}

/**
 * Get membership configuration from SystemConfig
 */
export async function getMembershipConfig(): Promise<MembershipConfig> {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'membership_threshold',
            'enable_promotional_exclusion',
            'require_qualifying_categories',
            'membership_benefits_text',
            'membership_terms_text',
          ],
        },
      },
    });

    const configMap = configs.reduce(
      (acc, config) => {
        let value: string | number | boolean = config.value;

        if (config.type === 'number') {
          value = parseFloat(config.value);
        } else if (config.type === 'boolean') {
          value = config.value === 'true';
        }

        acc[config.key] = value;
        return acc;
      },
      {} as Record<string, string | number | boolean>
    );

    return {
      membershipThreshold: Number(configMap.membership_threshold) || 80,
      enablePromotionalExclusion:
        Boolean(configMap.enable_promotional_exclusion) ?? true,
      requireQualifyingCategories:
        Boolean(configMap.require_qualifying_categories) ?? true,
      membershipBenefitsText:
        String(configMap.membership_benefits_text) ||
        'Enjoy exclusive member pricing on all products and special promotions.',
      membershipTermsText:
        String(configMap.membership_terms_text) ||
        'Membership is activated automatically when you spend the qualifying amount.',
    };
  } catch (error) {
    console.error('Error getting membership config:', error);
    // Return defaults on error
    return {
      membershipThreshold: 80,
      enablePromotionalExclusion: true,
      requireQualifyingCategories: true,
      membershipBenefitsText:
        'Enjoy exclusive member pricing on all products and special promotions.',
      membershipTermsText:
        'Membership is activated automatically when you spend the qualifying amount.',
    };
  }
}

/**
 * Calculate membership eligibility and cart summary
 */
export function calculateMembershipEligibility(
  cartItems: CartItemWithProduct[],
  isMember: boolean,
  config: MembershipConfig
): MembershipCalculation {
  let qualifyingTotal = 0;
  let totalItems = 0;
  let subtotal = 0;
  let memberSubtotal = 0;

  cartItems.forEach(item => {
    const quantity = item.quantity;
    const regularPrice = item.product.regularPrice;
    const memberPrice = item.product.memberPrice;

    totalItems += quantity;
    subtotal += regularPrice * quantity;
    memberSubtotal += memberPrice * quantity;

    // Check if item qualifies for membership calculation using new promotional system
    const qualifiesForMembership = productQualifiesForMembership({
      isPromotional: item.product.isPromotional,
      promotionalPrice: item.product.promotionalPrice ? Number(item.product.promotionalPrice) : null,
      promotionStartDate: item.product.promotionStartDate,
      promotionEndDate: item.product.promotionEndDate,
      isQualifyingForMembership: item.product.isQualifyingForMembership
    }, config.enablePromotionalExclusion);

    if (qualifiesForMembership) {
      qualifyingTotal += regularPrice * quantity;
    }
  });

  const potentialSavings = subtotal - memberSubtotal;
  const isEligibleForMembership = qualifyingTotal >= config.membershipThreshold;
  const membershipProgress = Math.min(
    (qualifyingTotal / config.membershipThreshold) * 100,
    100
  );
  const amountNeededForMembership = Math.max(
    0,
    config.membershipThreshold - qualifyingTotal
  );

  // Calculate applicable total based on member status
  const applicableSubtotal = isMember ? memberSubtotal : subtotal;

  return {
    qualifyingTotal: parseFloat(qualifyingTotal.toFixed(2)),
    totalItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    memberSubtotal: parseFloat(memberSubtotal.toFixed(2)),
    potentialSavings: parseFloat(potentialSavings.toFixed(2)),
    membershipThreshold: config.membershipThreshold,
    isEligibleForMembership,
    membershipProgress: parseFloat(membershipProgress.toFixed(1)),
    amountNeededForMembership: parseFloat(amountNeededForMembership.toFixed(2)),
    applicableSubtotal: parseFloat(applicableSubtotal.toFixed(2)),
  };
}

/**
 * Activate user membership
 */
export async function activateUserMembership(
  userId: string,
  qualifyingAmount: number,
  orderId?: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isMember: true, membershipTotal: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // If already a member, just update the total
    if (user.isMember) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          membershipTotal: {
            increment: qualifyingAmount,
          },
        },
      });
      return true;
    }

    // Activate membership
    await prisma.user.update({
      where: { id: userId },
      data: {
        isMember: true,
        memberSince: new Date(),
        membershipTotal: qualifyingAmount,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'CREATE',
        resource: 'Membership',
        resourceId: userId,
        details: {
          membershipActivated: true,
          qualifyingAmount,
          orderId,
          activatedAt: new Date().toISOString(),
        },
        ipAddress: 'system',
        userAgent: 'membership-service',
      },
    });

    return true;
  } catch (error) {
    console.error('Error activating membership:', error);
    return false;
  }
}

/**
 * Check if user qualifies for membership based on purchase history
 */
export async function checkUserMembershipQualification(
  userId: string
): Promise<{ qualifies: boolean; totalSpent: number; orders: number }> {
  try {
    const config = await getMembershipConfig();

    // Get user's order history for qualification check
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: 'DELIVERED', // Only count completed orders
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    let qualifyingTotal = 0;

    orders.forEach(order => {
      order.orderItems.forEach(item => {
        // Use new promotional system for membership qualification
        const qualifiesForMembership = productQualifiesForMembership({
          isPromotional: item.product.isPromotional,
          promotionalPrice: item.product.promotionalPrice ? Number(item.product.promotionalPrice) : null,
          promotionStartDate: item.product.promotionStartDate,
          promotionEndDate: item.product.promotionEndDate,
          isQualifyingForMembership: item.product.isQualifyingForMembership
        }, config.enablePromotionalExclusion);

        if (qualifiesForMembership) {
          qualifyingTotal += Number(item.regularPrice) * item.quantity;
        }
      });
    });

    return {
      qualifies: qualifyingTotal >= config.membershipThreshold,
      totalSpent: parseFloat(qualifyingTotal.toFixed(2)),
      orders: orders.length,
    };
  } catch (error) {
    console.error('Error checking membership qualification:', error);
    return {
      qualifies: false,
      totalSpent: 0,
      orders: 0,
    };
  }
}
