/**
 * Centralized Pricing Service - Malaysian E-commerce Platform
 * Single source of truth for ALL pricing calculations and business logic
 *
 * This service consolidates all pricing logic that was previously
 * scattered across 8+ frontend components into one maintainable location.
 */

import {
  ProductPricing,
  ProductPricingData,
  UserPricingContext,
  PricingBadge,
  PricingDisplayClasses,
  PriceType,
  PricingServiceConfig,
  PromotionStatus,
  EarlyAccessStatus,
} from '@/lib/types/pricing';
import {
  getBestPrice,
  calculatePromotionStatus,
  getPromotionDisplayText,
} from '@/lib/promotions/promotion-utils';
import {
  canUserAccessProduct,
  getEarlyAccessPrice,
  calculateEarlyAccessStatus,
} from '@/lib/member/early-access-utils';
import { formatCurrency } from '@/lib/utils';

export class PricingService {
  private static config: PricingServiceConfig = {
    currency: 'MYR',
    locale: 'en-MY',
    timezone: 'Asia/Kuala_Lumpur',
    showCents: true,
  };

  /**
   * Main entry point - calculates complete pricing information for a product
   */
  static calculateProductPricing(
    product: ProductPricingData,
    userContext: UserPricingContext
  ): ProductPricing {
    // 1. Check access permissions
    const hasAccess = this.checkUserAccess(product, userContext);
    if (!hasAccess.allowed) {
      return this.createAccessDeniedPricing(product, hasAccess.reason);
    }

    // 2. Get promotion and early access status
    const promotionStatus = calculatePromotionStatus(product);
    const earlyAccessStatus = calculateEarlyAccessStatus(product);

    // 3. Calculate best price using existing utilities
    const priceInfo = getBestPrice(product, userContext.isMember);
    const earlyAccessPrice = getEarlyAccessPrice(product, userContext.isMember);

    // 4. Determine final price (early access takes precedence)
    const finalPrice = earlyAccessPrice.hasEarlyAccess
      ? earlyAccessPrice
      : priceInfo;

    // 5. Generate badges
    const badges = this.generatePricingBadges(
      product,
      promotionStatus,
      earlyAccessStatus,
      userContext
    );

    // 6. Calculate display classes
    const displayClasses = this.getDisplayClasses(finalPrice.priceType);

    // 7. Format prices
    const formattedPrice = this.formatPrice(finalPrice.price);
    const formattedOriginalPrice = this.formatPrice(finalPrice.originalPrice);
    const formattedSavings = this.formatPrice(finalPrice.savings);

    // 8. Generate member preview for non-members
    const memberPreview = this.generateMemberPreview(
      product,
      userContext,
      promotionStatus,
      earlyAccessStatus
    );

    return {
      effectivePrice: finalPrice.price,
      originalPrice: finalPrice.originalPrice,
      priceType: finalPrice.priceType as PriceType,
      savings: finalPrice.savings,
      savingsPercentage: this.calculateSavingsPercentage(
        finalPrice.originalPrice,
        finalPrice.price
      ),
      badges,
      displayClasses,
      formattedPrice,
      formattedOriginalPrice,
      formattedSavings,
      showOriginalPrice: finalPrice.savings > 0,
      showSavings: finalPrice.savings > 0,
      showMemberPreview: memberPreview.show,
      memberPreviewText: memberPreview.text,
      priceDescription: this.generatePriceDescription(finalPrice, product),
    };
  }

  /**
   * Format price using consistent Malaysian currency format
   */
  static formatPrice(amount: number): string {
    return formatCurrency(amount, this.config.currency);
  }

  /**
   * Check if user can access this product (early access, member-only, etc.)
   */
  private static checkUserAccess(
    product: ProductPricingData,
    userContext: UserPricingContext
  ): { allowed: boolean; reason?: string } {
    const canAccess = canUserAccessProduct(product, userContext.isMember);
    return {
      allowed: canAccess,
      reason: canAccess ? undefined : 'Member access required',
    };
  }

  /**
   * Generate appropriate pricing badges based on product status
   */
  private static generatePricingBadges(
    product: ProductPricingData,
    promotionStatus: PromotionStatus,
    earlyAccessStatus: EarlyAccessStatus,
    userContext: UserPricingContext
  ): PricingBadge[] {
    const badges: PricingBadge[] = [];

    // Featured badge
    if (product.featured) {
      badges.push({
        type: 'featured',
        text: 'Featured',
        variant: 'default',
        className: 'bg-blue-600 text-white',
      });
    }

    // Early access badges
    if (earlyAccessStatus.isMemberOnly && !userContext.isMember) {
      badges.push({
        type: 'members-only',
        text: 'Members Only',
        variant: 'outline',
        className: 'bg-purple-100 text-purple-800 border-purple-500',
      });
    }

    if (earlyAccessStatus.isEarlyAccessPromotion && userContext.isMember) {
      badges.push({
        type: 'early-access',
        text: 'Early Access',
        variant: 'secondary',
        className: 'bg-purple-500 text-white',
      });
    }

    // Promotion badges
    if (promotionStatus.isActive) {
      const promotionText = getPromotionDisplayText(promotionStatus);
      badges.push({
        type: 'promotional',
        text: promotionText || 'Special Price',
        variant: 'destructive',
        className: 'bg-red-500 text-white',
      });
    }

    if (promotionStatus.isScheduled) {
      const promotionText = getPromotionDisplayText(promotionStatus);
      badges.push({
        type: 'coming-soon',
        text: promotionText || 'Coming Soon',
        variant: 'outline',
        className: 'bg-blue-500 text-white border-blue-500',
      });
    }

    // Stock status
    if (product.stockQuantity === 0) {
      badges.push({
        type: 'out-of-stock',
        text: 'Out of Stock',
        variant: 'outline',
        className: 'bg-white text-gray-600',
      });
    }

    // Qualifying badge (only if no promotions active)
    if (
      product.isQualifyingForMembership &&
      !promotionStatus.isActive &&
      !promotionStatus.isScheduled
    ) {
      badges.push({
        type: 'qualifying',
        text: 'Membership Qualifying',
        variant: 'outline',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      });
    }

    return badges;
  }

  /**
   * Get CSS classes for price display based on price type
   */
  private static getDisplayClasses(priceType: string): PricingDisplayClasses {
    const classMap = {
      'early-access': {
        priceColor: 'text-purple-600',
        badgeVariant: 'secondary',
        savingsColor: 'text-purple-600',
      },
      promotional: {
        priceColor: 'text-red-600',
        badgeVariant: 'destructive',
        savingsColor: 'text-red-600',
      },
      member: {
        priceColor: 'text-green-600',
        badgeVariant: 'secondary',
        savingsColor: 'text-green-600',
      },
      regular: {
        priceColor: 'text-gray-900',
        badgeVariant: 'default',
        savingsColor: 'text-green-600',
      },
    };

    return classMap[priceType as keyof typeof classMap] || classMap.regular;
  }

  /**
   * Generate member price preview for non-members
   */
  private static generateMemberPreview(
    product: ProductPricingData,
    userContext: UserPricingContext,
    promotionStatus: PromotionStatus,
    earlyAccessStatus: EarlyAccessStatus
  ): { show: boolean; text?: string } {
    // Don't show member preview if user is already a member
    if (userContext.isMember) {
      return { show: false };
    }

    // Don't show if product is member-only or has active promotions
    if (earlyAccessStatus.isMemberOnly || promotionStatus.isActive) {
      return { show: false };
    }

    // Only show if there's actual member savings
    if (product.memberPrice >= product.regularPrice) {
      return { show: false };
    }

    const memberPriceFormatted = this.formatPrice(product.memberPrice);
    return {
      show: true,
      text: `Member price: ${memberPriceFormatted}`,
    };
  }

  /**
   * Calculate savings percentage
   */
  private static calculateSavingsPercentage(
    original: number,
    effective: number
  ): number {
    if (original <= 0) {
      return 0;
    }
    return Math.round(((original - effective) / original) * 100);
  }

  /**
   * Generate accessible price description for screen readers
   */
  private static generatePriceDescription(
    finalPrice: any,
    product: ProductPricingData
  ): string {
    let description = `Price: ${this.formatPrice(finalPrice.price)}`;

    if (finalPrice.savings > 0) {
      description += `, reduced from ${this.formatPrice(finalPrice.originalPrice)}, save ${this.formatPrice(finalPrice.savings)}`;
    }

    if (finalPrice.priceType === 'promotional') {
      description += ', promotional price';
    } else if (finalPrice.priceType === 'member') {
      description += ', member price';
    } else if (finalPrice.priceType === 'early-access') {
      description += ', early access price';
    }

    return description;
  }

  /**
   * Create pricing object for access-denied products
   */
  private static createAccessDeniedPricing(
    product: ProductPricingData,
    reason: string
  ): ProductPricing {
    return {
      effectivePrice: 0,
      originalPrice: product.regularPrice,
      priceType: 'regular',
      savings: 0,
      savingsPercentage: 0,
      badges: [
        {
          type: 'members-only',
          text: 'Members Only',
          variant: 'outline',
          className: 'bg-purple-100 text-purple-800 border-purple-500',
        },
      ],
      displayClasses: {
        priceColor: 'text-gray-400',
        badgeVariant: 'outline',
        savingsColor: 'text-gray-400',
      },
      formattedPrice: 'Members Only',
      formattedOriginalPrice: this.formatPrice(product.regularPrice),
      formattedSavings: '',
      showOriginalPrice: false,
      showSavings: false,
      showMemberPreview: false,
      priceDescription: `Access restricted: ${reason}`,
    };
  }

  /**
   * Get simplified pricing for components that only need basic price info
   */
  static getSimplePrice(
    product: ProductPricingData,
    userContext: UserPricingContext
  ): string {
    const pricing = this.calculateProductPricing(product, userContext);
    return pricing.formattedPrice;
  }

  /**
   * Check if product has any active promotions
   */
  static hasActivePromotion(product: ProductPricingData): boolean {
    const promotionStatus = calculatePromotionStatus(product);
    return promotionStatus.isActive;
  }

  /**
   * Get savings amount for a product
   */
  static getSavings(
    product: ProductPricingData,
    userContext: UserPricingContext
  ): number {
    const pricing = this.calculateProductPricing(product, userContext);
    return pricing.savings;
  }

  /**
   * Update configuration
   */
  static updateConfig(newConfig: Partial<PricingServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
