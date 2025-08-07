/**
 * Discount Code Service for Malaysian E-commerce
 * Handles promotional discount codes and coupon validation
 */

import { prisma } from '@/lib/db/prisma';
import { DiscountType, DiscountStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface DiscountValidationResult {
  isValid: boolean;
  discountAmount: number;
  discountType: DiscountType;
  errors: string[];
  discountCode?: {
    id: string;
    code: string;
    name: string;
    discountType: DiscountType;
    discountValue: Decimal;
  };
}

export interface CartItem {
  productId: string;
  categoryId: string;
  quantity: number;
  regularPrice: number;
  memberPrice: number;
  appliedPrice: number;
}

export interface DiscountValidationRequest {
  code: string;
  userId: string | null;
  cartItems: CartItem[];
  subtotal: number;
  isMember: boolean;
}

export class DiscountService {
  /**
   * Validate and calculate discount for a given code
   */
  async validateDiscount(
    request: DiscountValidationRequest
  ): Promise<DiscountValidationResult> {
    const errors: string[] = [];

    try {
      // Find the discount code
      const discountCode = await prisma.discountCode.findUnique({
        where: { code: request.code.toUpperCase() },
        include: {
          _count: {
            select: { usageHistory: true },
          },
          usageHistory: request.userId
            ? {
                where: { userId: request.userId },
              }
            : false,
        },
      });

      if (!discountCode) {
        errors.push('Invalid discount code');
        return {
          isValid: false,
          discountAmount: 0,
          discountType: DiscountType.PERCENTAGE,
          errors,
        };
      }

      // Check if code is active
      if (discountCode.status !== DiscountStatus.ACTIVE) {
        errors.push('This discount code is no longer active');
        return {
          isValid: false,
          discountAmount: 0,
          discountType: discountCode.discountType,
          errors,
        };
      }

      // Check time restrictions
      const now = new Date();
      if (discountCode.startsAt > now) {
        errors.push('This discount code is not yet active');
        return {
          isValid: false,
          discountAmount: 0,
          discountType: discountCode.discountType,
          errors,
        };
      }

      if (discountCode.expiresAt && discountCode.expiresAt < now) {
        errors.push('This discount code has expired');
        return {
          isValid: false,
          discountAmount: 0,
          discountType: discountCode.discountType,
          errors,
        };
      }

      // Check usage limits
      if (
        discountCode.usageLimit &&
        discountCode.usageCount >= discountCode.usageLimit
      ) {
        errors.push('This discount code has reached its usage limit');
        return {
          isValid: false,
          discountAmount: 0,
          discountType: discountCode.discountType,
          errors,
        };
      }

      // Check per-user limit
      if (request.userId && discountCode.perUserLimit) {
        const userUsageCount = Array.isArray(discountCode.usageHistory)
          ? discountCode.usageHistory.length
          : 0;

        if (userUsageCount >= discountCode.perUserLimit) {
          errors.push(
            'You have reached the usage limit for this discount code'
          );
          return {
            isValid: false,
            discountAmount: 0,
            discountType: discountCode.discountType,
            errors,
          };
        }
      }

      // Check member restrictions
      if (discountCode.memberOnly && !request.isMember) {
        errors.push('This discount code is only available for members');
        return {
          isValid: false,
          discountAmount: 0,
          discountType: discountCode.discountType,
          errors,
        };
      }

      // Check minimum order value
      if (
        discountCode.minimumOrderValue &&
        request.subtotal < Number(discountCode.minimumOrderValue)
      ) {
        errors.push(
          `Minimum order value of RM ${discountCode.minimumOrderValue} required`
        );
        return {
          isValid: false,
          discountAmount: 0,
          discountType: discountCode.discountType,
          errors,
        };
      }

      // Check product/category restrictions
      const applicableItems = this.getApplicableItems(
        request.cartItems,
        discountCode
      );
      if (applicableItems.length === 0) {
        errors.push(
          'This discount code is not applicable to items in your cart'
        );
        return {
          isValid: false,
          discountAmount: 0,
          discountType: discountCode.discountType,
          errors,
        };
      }

      // Calculate discount amount
      const discountAmount = this.calculateDiscountAmount(
        discountCode,
        applicableItems,
        request.subtotal
      );

      return {
        isValid: true,
        discountAmount,
        discountType: discountCode.discountType,
        errors: [],
        discountCode: {
          id: discountCode.id,
          code: discountCode.code,
          name: discountCode.name,
          discountType: discountCode.discountType,
          discountValue: discountCode.discountValue,
        },
      };
    } catch (error) {
      console.error('Discount validation error:', error);
      errors.push('Error validating discount code');
      return {
        isValid: false,
        discountAmount: 0,
        discountType: DiscountType.PERCENTAGE,
        errors,
      };
    }
  }

  /**
   * Apply discount to an order and create usage record
   */
  async applyDiscountToOrder(
    discountCodeId: string,
    orderId: string,
    userId: string,
    discountAmount: number
  ): Promise<void> {
    await prisma.$transaction(async tx => {
      // Create usage record
      await tx.discountUsage.create({
        data: {
          discountCodeId,
          userId,
          orderId,
          discountAmount: new Decimal(discountAmount),
        },
      });

      // Increment usage count
      await tx.discountCode.update({
        where: { id: discountCodeId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });
    });
  }

  /**
   * Get applicable items based on discount restrictions
   */
  private getApplicableItems(
    cartItems: CartItem[],
    discountCode: any
  ): CartItem[] {
    return cartItems.filter(item => {
      // Check if item is in applicable categories
      if (discountCode.applicableToCategories.length > 0) {
        if (!discountCode.applicableToCategories.includes(item.categoryId)) {
          return false;
        }
      }

      // Check if item is in applicable products
      if (discountCode.applicableToProducts.length > 0) {
        if (!discountCode.applicableToProducts.includes(item.productId)) {
          return false;
        }
      }

      // Check if item is in excluded categories
      if (discountCode.excludeCategories.includes(item.categoryId)) {
        return false;
      }

      // Check if item is in excluded products
      if (discountCode.excludeProducts.includes(item.productId)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calculate discount amount based on type
   */
  private calculateDiscountAmount(
    discountCode: any,
    applicableItems: CartItem[],
    subtotal: number
  ): number {
    let discountAmount = 0;
    const discountValue = Number(discountCode.discountValue);

    switch (discountCode.discountType) {
      case DiscountType.PERCENTAGE:
        const applicableSubtotal = applicableItems.reduce(
          (sum, item) => sum + item.appliedPrice * item.quantity,
          0
        );
        discountAmount = (applicableSubtotal * discountValue) / 100;
        break;

      case DiscountType.FIXED_AMOUNT:
        discountAmount = discountValue;
        break;

      case DiscountType.FREE_SHIPPING:
        // Free shipping discount - amount will be set to shipping cost during checkout
        discountAmount = 0; // Will be updated with actual shipping cost
        break;

      case DiscountType.BUY_X_GET_Y:
        // Buy X Get Y logic would be more complex and depend on additional configuration
        // For now, treating as percentage discount
        discountAmount = (subtotal * discountValue) / 100;
        break;

      default:
        discountAmount = 0;
    }

    // Apply maximum discount limit if set
    if (discountCode.maximumDiscount) {
      discountAmount = Math.min(
        discountAmount,
        Number(discountCode.maximumDiscount)
      );
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get active discount codes for public display
   */
  async getPublicDiscountCodes(): Promise<
    Array<{
      code: string;
      name: string;
      description: string | null;
      discountType: DiscountType;
      discountValue: Decimal;
      minimumOrderValue: Decimal | null;
      memberOnly: boolean;
      expiresAt: Date | null;
    }>
  > {
    const now = new Date();

    return await prisma.discountCode.findMany({
      where: {
        status: DiscountStatus.ACTIVE,
        isPublic: true,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
        AND: [
          {
            OR: [
              { usageLimit: null },
              {
                usageLimit: { gt: prisma.discountCode.fields.usageCount },
              },
            ],
          },
        ],
      },
      select: {
        code: true,
        name: true,
        description: true,
        discountType: true,
        discountValue: true,
        minimumOrderValue: true,
        memberOnly: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  /**
   * Generate a unique discount code
   */
  generateDiscountCode(prefix: string = 'SAVE'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }
}

// Export singleton instance
export const discountService = new DiscountService();
