/**
 * Membership Service - Malaysian E-commerce Platform
 * Handles all membership-related business logic
 * Separated from payment processing for proper architecture
 */

import { prisma } from '@/lib/db/prisma';
import { getMembershipConfiguration } from '@/lib/config/membership-config';
import { productQualifiesForMembership } from '@/lib/promotions/promotion-utils';

export interface OrderForMembership {
  id: string;
  orderNumber: string;
  userId: string | null;
  total: number;
  orderItems: Array<{
    id: string;
    quantity: number;
    regularPrice: number;
    product: {
      id: string;
      name: string;
      isPromotional: boolean;
      isQualifyingForMembership: boolean;
    };
  }>;
  user?: {
    id: string;
    isMember: boolean;
  } | null;
  pendingMembership?: {
    id: string;
    qualifyingAmount: number;
  } | null;
}

export class MembershipService {
  // REMOVED: Hardcoded threshold - now uses dynamic config

  /**
   * Main entry point: Process an order for potential membership activation
   * This is called AFTER payment is confirmed
   */
  static async processOrderForMembership(orderId: string): Promise<{
    membershipActivated: boolean;
    reason: string;
    qualifyingTotal?: number;
  }> {
    console.log(
      '🎯 MembershipService: Processing order for membership:',
      orderId
    );

    try {
      // Get order with all necessary data
      const order = await this.getOrderForMembership(orderId);

      if (!order) {
        return {
          membershipActivated: false,
          reason: 'Order not found',
        };
      }

      if (!order.userId) {
        return {
          membershipActivated: false,
          reason: 'Guest orders do not qualify for membership activation',
        };
      }

      if (order.user?.isMember) {
        return {
          membershipActivated: false,
          reason: 'User is already a member',
        };
      }

      // Get membership configuration
      const membershipConfig = await getMembershipConfiguration();

      // Calculate qualifying total using dynamic business rules
      const qualifyingTotal = await this.calculateQualifyingTotal(
        order.orderItems,
        membershipConfig.enablePromotionalExclusion,
        membershipConfig.requireQualifyingProducts
      );

      console.log('🔍 Membership qualification check:', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        qualifyingTotal,
        threshold: membershipConfig.membershipThreshold,
        qualifies: qualifyingTotal >= membershipConfig.membershipThreshold,
        config: {
          enablePromotionalExclusion: membershipConfig.enablePromotionalExclusion,
          requireQualifyingProducts: membershipConfig.requireQualifyingProducts,
        },
      });

      // Check if order qualifies for membership
      if (qualifyingTotal >= membershipConfig.membershipThreshold) {
        await this.activateMembership(order.userId, qualifyingTotal);

        // Clean up pending membership if exists
        if (order.pendingMembership) {
          await this.cleanupPendingMembership(order.pendingMembership.id);
        }

        console.log('✅ Membership activated successfully:', {
          userId: order.userId,
          qualifyingTotal,
          orderNumber: order.orderNumber,
        });

        return {
          membershipActivated: true,
          reason: 'Order qualifies for membership',
          qualifyingTotal,
        };
      } else {
        // Clean up pending membership if exists (order didn't qualify)
        if (order.pendingMembership) {
          await this.cleanupPendingMembership(order.pendingMembership.id);
        }

        console.log('❌ Membership NOT activated:', {
          userId: order.userId,
          qualifyingTotal,
          threshold: membershipConfig.membershipThreshold,
          shortfall: membershipConfig.membershipThreshold - qualifyingTotal,
          reason: 'Order does not meet membership requirements',
        });

        return {
          membershipActivated: false,
          reason:
            'Order does not meet membership requirements (contains promotional items or below threshold)',
          qualifyingTotal,
        };
      }
    } catch (error) {
      console.error('❌ MembershipService error:', error);
      return {
        membershipActivated: false,
        reason: 'Error processing membership',
      };
    }
  }

  /**
   * Calculate qualifying total based on dynamic membership configuration
   * Uses centralized config instead of hardcoded rules
   */
  private static async calculateQualifyingTotal(
    orderItems: OrderForMembership['orderItems'],
    enablePromotionalExclusion: boolean,
    requireQualifyingProducts: boolean
  ): Promise<number> {
    let qualifyingTotal = 0;

    for (const item of orderItems) {
      // Use centralized qualification logic with dynamic config
      const qualifies = productQualifiesForMembership(
        {
          isPromotional: item.product.isPromotional,
          promotionalPrice: null, // Not needed for qualification
          promotionStartDate: null,
          promotionEndDate: null,
          isQualifyingForMembership: item.product.isQualifyingForMembership,
          memberOnlyUntil: null,
          earlyAccessStart: null,
        },
        enablePromotionalExclusion,
        requireQualifyingProducts
      );

      if (qualifies) {
        qualifyingTotal += Number(item.regularPrice) * item.quantity;
      }
    }

    return qualifyingTotal;
  }

  /**
   * Activate membership for a user
   */
  private static async activateMembership(
    userId: string,
    qualifyingTotal: number
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isMember: true,
        memberSince: new Date(),
        membershipTotal: qualifyingTotal,
      },
    });
  }

  /**
   * Clean up pending membership record
   */
  private static async cleanupPendingMembership(
    pendingMembershipId: string
  ): Promise<void> {
    await prisma.pendingMembership.delete({
      where: { id: pendingMembershipId },
    });
  }

  /**
   * Get order with all data needed for membership processing
   */
  private static async getOrderForMembership(
    orderId: string
  ): Promise<OrderForMembership | null> {
    return await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, isMember: true },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                isPromotional: true,
                isQualifyingForMembership: true,
              },
            },
          },
        },
        pendingMembership: {
          select: { id: true, qualifyingAmount: true },
        },
      },
    });
  }

  /**
   * Check if an order would qualify for membership (without activating)
   * Useful for preview/validation purposes
   */
  static async checkMembershipEligibility(orderId: string): Promise<{
    qualifies: boolean;
    qualifyingTotal: number;
    threshold: number;
    reason: string;
  }> {
    const order = await this.getOrderForMembership(orderId);
    const membershipConfig = await getMembershipConfiguration();

    if (!order) {
      return {
        qualifies: false,
        qualifyingTotal: 0,
        threshold: membershipConfig.membershipThreshold,
        reason: 'Order not found',
      };
    }

    const qualifyingTotal = await this.calculateQualifyingTotal(
      order.orderItems,
      membershipConfig.enablePromotionalExclusion,
      membershipConfig.requireQualifyingProducts
    );
    const qualifies = qualifyingTotal >= membershipConfig.membershipThreshold;

    return {
      qualifies,
      qualifyingTotal,
      threshold: membershipConfig.membershipThreshold,
      reason: qualifies
        ? 'Order qualifies for membership'
        : 'Order does not meet membership requirements',
    };
  }
}
