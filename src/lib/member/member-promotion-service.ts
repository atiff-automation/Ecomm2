/**
 * Member Promotion Service - Malaysian E-commerce Platform
 * Handles special member-only promotions, exclusive offers, and automated benefits
 */

import { prisma } from '@/lib/db/prisma';
import { DiscountType, DiscountStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { discountService } from '@/lib/discounts/discount-service';

export interface MemberPromotionConfig {
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderValue?: number;
  maximumDiscount?: number;
  expiresAt?: Date;
  applicableToCategories?: string[];
  applicableToProducts?: string[];
  autoApply?: boolean;
  isWelcomeOffer?: boolean;
}

export interface MemberBenefitSummary {
  totalSavings: number;
  exclusiveOffers: number;
  memberSince: Date;
  orderCount: number;
  averageOrderValue: number;
  nextBenefitUnlock?: {
    name: string;
    requirement: string;
    progress: number;
    target: number;
  };
}

export class MemberPromotionService {
  /**
   * Create a new member-exclusive discount code
   */
  async createMemberPromotion(
    config: MemberPromotionConfig,
    createdById: string
  ): Promise<string> {
    const code = this.generateMemberPromotionCode(config.name);
    
    await prisma.discountCode.create({
      data: {
        code,
        name: config.name,
        description: config.description,
        discountType: config.discountType,
        discountValue: new Decimal(config.discountValue),
        minimumOrderValue: config.minimumOrderValue 
          ? new Decimal(config.minimumOrderValue) 
          : null,
        maximumDiscount: config.maximumDiscount 
          ? new Decimal(config.maximumDiscount) 
          : null,
        memberOnly: true, // All member promotions are member-only
        applicableToCategories: config.applicableToCategories || [],
        applicableToProducts: config.applicableToProducts || [],
        startsAt: new Date(),
        expiresAt: config.expiresAt,
        status: DiscountStatus.ACTIVE,
        isPublic: !config.autoApply, // Auto-apply codes are private
        createdById,
      },
    });

    return code;
  }

  /**
   * Create welcome offer for new members
   */
  async createWelcomeOffer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const config: MemberPromotionConfig = {
      name: `Welcome Offer for ${user.firstName}`,
      description: 'Welcome to our membership program! Enjoy 15% off your first order.',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 15,
      minimumOrderValue: 50,
      maximumDiscount: 100,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      autoApply: true,
      isWelcomeOffer: true,
    };

    return await this.createMemberPromotion(config, userId);
  }

  /**
   * Create birthday month promotion for a member
   */
  async createBirthdayPromotion(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, dateOfBirth: true },
    });

    if (!user || !user.dateOfBirth) {
      return null;
    }

    const now = new Date();
    const birthMonth = user.dateOfBirth.getMonth();
    const currentMonth = now.getMonth();

    // Only create if it's their birth month
    if (birthMonth !== currentMonth) {
      return null;
    }

    // Check if they already have a birthday offer this year
    const existingOffer = await prisma.discountCode.findFirst({
      where: {
        name: { contains: `Birthday ${now.getFullYear()}` },
        createdById: userId,
        status: DiscountStatus.ACTIVE,
      },
    });

    if (existingOffer) {
      return existingOffer.code;
    }

    const config: MemberPromotionConfig = {
      name: `Birthday ${now.getFullYear()} - ${user.firstName}`,
      description: 'Happy Birthday! Enjoy 20% off everything this month.',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      maximumDiscount: 200,
      expiresAt: new Date(now.getFullYear(), now.getMonth() + 1, 0), // End of month
      autoApply: true,
    };

    return await this.createMemberPromotion(config, userId);
  }

  /**
   * Create loyalty milestone promotion
   */
  async createLoyaltyMilestonePromotion(
    userId: string,
    milestone: 'FIRST_ORDER' | 'FIFTH_ORDER' | 'TENTH_ORDER' | 'HIGH_SPENDER'
  ): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let config: MemberPromotionConfig;

    switch (milestone) {
      case 'FIRST_ORDER':
        config = {
          name: `First Order Bonus - ${user.firstName}`,
          description: 'Congratulations on your first order! Here\'s 10% off your next purchase.',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
          minimumOrderValue: 30,
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          autoApply: true,
        };
        break;

      case 'FIFTH_ORDER':
        config = {
          name: `5th Order Celebration - ${user.firstName}`,
          description: 'You\'re a valued customer! Enjoy RM25 off your next order.',
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 25,
          minimumOrderValue: 100,
          expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
          autoApply: true,
        };
        break;

      case 'TENTH_ORDER':
        config = {
          name: `Loyalty Reward - ${user.firstName}`,
          description: '10 orders and counting! Here\'s 25% off your next purchase.',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 25,
          maximumDiscount: 150,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          autoApply: true,
        };
        break;

      case 'HIGH_SPENDER':
        config = {
          name: `VIP Appreciation - ${user.firstName}`,
          description: 'Thank you for being a valued customer! Enjoy exclusive VIP pricing.',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 30,
          minimumOrderValue: 200,
          maximumDiscount: 300,
          expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
          autoApply: true,
        };
        break;

      default:
        throw new Error('Invalid milestone type');
    }

    return await this.createMemberPromotion(config, userId);
  }

  /**
   * Get member benefit summary
   */
  async getMemberBenefitSummary(userId: string): Promise<MemberBenefitSummary> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        memberSince: true,
        orders: {
          select: {
            total: true,
            discountAmount: true,
            createdAt: true,
          },
          where: {
            status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
          },
        },
      },
    });

    if (!user || !user.memberSince) {
      throw new Error('User is not a member');
    }

    const orders = user.orders;
    const orderCount = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalSavings = orders.reduce((sum, order) => sum + Number(order.discountAmount), 0);
    const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

    // Get exclusive offers count
    const exclusiveOffers = await prisma.discountUsage.count({
      where: {
        userId,
        discountCode: {
          memberOnly: true,
        },
      },
    });

    // Calculate next benefit unlock
    let nextBenefitUnlock;
    if (orderCount < 10) {
      nextBenefitUnlock = {
        name: '25% Loyalty Reward',
        requirement: '10 completed orders',
        progress: orderCount,
        target: 10,
      };
    } else if (totalSpent < 1000) {
      nextBenefitUnlock = {
        name: 'VIP Status',
        requirement: 'RM1,000 total spent',
        progress: totalSpent,
        target: 1000,
      };
    }

    return {
      totalSavings,
      exclusiveOffers,
      memberSince: user.memberSince,
      orderCount,
      averageOrderValue,
      nextBenefitUnlock,
    };
  }

  /**
   * Get available member promotions for a user
   */
  async getAvailableMemberPromotions(userId: string): Promise<Array<{
    code: string;
    name: string;
    description: string | null;
    discountType: DiscountType;
    discountValue: Decimal;
    minimumOrderValue: Decimal | null;
    expiresAt: Date | null;
    isAutoApply: boolean;
  }>> {
    const now = new Date();

    return await prisma.discountCode.findMany({
      where: {
        status: DiscountStatus.ACTIVE,
        memberOnly: true,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
        AND: [
          {
            OR: [
              { usageLimit: null },
              { usageLimit: { gt: prisma.discountCode.fields.usageCount } },
            ],
          },
        ],
        // Either public member promotions or private ones created for this user
        OR: [
          { isPublic: true },
          { createdById: userId },
        ],
        // Ensure user hasn't used this code if there's a per-user limit
        NOT: {
          usageHistory: {
            some: {
              userId: userId,
            },
          },
        },
      },
      select: {
        code: true,
        name: true,
        description: true,
        discountType: true,
        discountValue: true,
        minimumOrderValue: true,
        expiresAt: true,
        isPublic: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check and create automated member benefits
   */
  async checkAndCreateAutomatedBenefits(userId: string): Promise<string[]> {
    const createdCodes: string[] = [];

    try {
      // Check for birthday promotion
      const birthdayCode = await this.createBirthdayPromotion(userId);
      if (birthdayCode) {
        createdCodes.push(birthdayCode);
      }

      // Check order milestones
      const orderCount = await prisma.order.count({
        where: {
          userId,
          status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
      });

      // First order bonus
      if (orderCount === 1) {
        const firstOrderCode = await this.createLoyaltyMilestonePromotion(userId, 'FIRST_ORDER');
        createdCodes.push(firstOrderCode);
      }

      // Fifth order celebration
      if (orderCount === 5) {
        const fifthOrderCode = await this.createLoyaltyMilestonePromotion(userId, 'FIFTH_ORDER');
        createdCodes.push(fifthOrderCode);
      }

      // Tenth order loyalty reward
      if (orderCount === 10) {
        const tenthOrderCode = await this.createLoyaltyMilestonePromotion(userId, 'TENTH_ORDER');
        createdCodes.push(tenthOrderCode);
      }

      // High spender check
      const totalSpent = await prisma.order.aggregate({
        where: {
          userId,
          status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
        _sum: { total: true },
      });

      if (totalSpent._sum.total && Number(totalSpent._sum.total) >= 1000) {
        // Check if they already have a VIP offer
        const existingVIP = await prisma.discountCode.findFirst({
          where: {
            name: { contains: 'VIP Appreciation' },
            createdById: userId,
            status: DiscountStatus.ACTIVE,
          },
        });

        if (!existingVIP) {
          const vipCode = await this.createLoyaltyMilestonePromotion(userId, 'HIGH_SPENDER');
          createdCodes.push(vipCode);
        }
      }

      return createdCodes;
    } catch (error) {
      console.error('Error creating automated member benefits:', error);
      return createdCodes;
    }
  }

  /**
   * Generate member promotion code
   */
  private generateMemberPromotionCode(promotionName: string): string {
    const prefix = 'MEMBER';
    const nameCode = promotionName
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 4);
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    
    return `${prefix}${nameCode}${timestamp}${random}`;
  }

  /**
   * Create seasonal member promotions
   */
  async createSeasonalMemberPromotion(
    season: 'NEW_YEAR' | 'VALENTINE' | 'RAYA' | 'MERDEKA' | 'CHRISTMAS',
    createdById: string
  ): Promise<string> {
    let config: MemberPromotionConfig;

    switch (season) {
      case 'NEW_YEAR':
        config = {
          name: 'New Year Member Special 2025',
          description: 'Start the year right with 20% off for members!',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 20,
          minimumOrderValue: 80,
          maximumDiscount: 200,
          expiresAt: new Date('2025-01-31'),
        };
        break;

      case 'VALENTINE':
        config = {
          name: 'Valentine\'s Day Member Love',
          description: 'Share the love! Members get RM30 off romantic gifts.',
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 30,
          minimumOrderValue: 120,
          expiresAt: new Date('2025-02-14'),
        };
        break;

      case 'RAYA':
        config = {
          name: 'Hari Raya Member Celebration',
          description: 'Celebrate with us! 25% off for our valued members.',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 25,
          minimumOrderValue: 100,
          maximumDiscount: 150,
          expiresAt: new Date('2025-05-15'),
        };
        break;

      case 'MERDEKA':
        config = {
          name: 'Merdeka Member Pride',
          description: 'Celebrating Malaysia! Members enjoy special 31% off.',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 31,
          minimumOrderValue: 80,
          maximumDiscount: 100,
          expiresAt: new Date('2025-08-31'),
        };
        break;

      case 'CHRISTMAS':
        config = {
          name: 'Christmas Member Joy',
          description: 'Merry Christmas! Members get RM50 off holiday shopping.',
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 50,
          minimumOrderValue: 200,
          expiresAt: new Date('2025-12-25'),
        };
        break;

      default:
        throw new Error('Invalid season type');
    }

    return await this.createMemberPromotion(config, createdById);
  }
}

// Export singleton instance
export const memberPromotionService = new MemberPromotionService();