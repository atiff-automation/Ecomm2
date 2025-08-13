/**
 * Member Early Access Utilities - Malaysian E-commerce Platform
 * Handles member-only early access to products and promotions
 */

export interface EarlyAccessProduct {
  memberOnlyUntil?: Date | string | null;
  earlyAccessStart?: Date | string | null;
  promotionStartDate?: Date | string | null;
  promotionEndDate?: Date | string | null;
  isPromotional: boolean;
  promotionalPrice?: number | null;
}

export interface EarlyAccessStatus {
  isMemberOnly: boolean;
  isEarlyAccessPromotion: boolean;
  memberOnlyTimeRemaining?: number; // hours until public access
  earlyAccessTimeRemaining?: number; // hours until public promotion access
  publicAccessDate?: Date;
  publicPromotionDate?: Date;
}

/**
 * Check if product is currently member-only (early access period)
 */
export function isProductMemberOnly(
  product: EarlyAccessProduct,
  now: Date = new Date()
): boolean {
  if (!product.memberOnlyUntil) {
    return false;
  }

  const memberOnlyUntil = new Date(product.memberOnlyUntil);
  return now < memberOnlyUntil;
}

/**
 * Check if promotion is in early access period for members
 */
export function isPromotionEarlyAccess(
  product: EarlyAccessProduct,
  now: Date = new Date()
): boolean {
  if (
    !product.isPromotional ||
    !product.earlyAccessStart ||
    !product.promotionStartDate
  ) {
    return false;
  }

  const earlyAccessStart = new Date(product.earlyAccessStart);
  const promotionStart = new Date(product.promotionStartDate);

  return now >= earlyAccessStart && now < promotionStart;
}

/**
 * Calculate comprehensive early access status
 */
export function calculateEarlyAccessStatus(
  product: EarlyAccessProduct,
  now: Date = new Date()
): EarlyAccessStatus {
  const isMemberOnly = isProductMemberOnly(product, now);
  const isEarlyAccessPromotion = isPromotionEarlyAccess(product, now);

  let memberOnlyTimeRemaining: number | undefined;
  let earlyAccessTimeRemaining: number | undefined;
  let publicAccessDate: Date | undefined;
  let publicPromotionDate: Date | undefined;

  if (product.memberOnlyUntil && isMemberOnly) {
    publicAccessDate = new Date(product.memberOnlyUntil);
    const timeDiff = publicAccessDate.getTime() - now.getTime();
    memberOnlyTimeRemaining = Math.max(
      0,
      Math.ceil(timeDiff / (1000 * 60 * 60))
    ); // hours
  }

  if (product.promotionStartDate && isEarlyAccessPromotion) {
    publicPromotionDate = new Date(product.promotionStartDate);
    const timeDiff = publicPromotionDate.getTime() - now.getTime();
    earlyAccessTimeRemaining = Math.max(
      0,
      Math.ceil(timeDiff / (1000 * 60 * 60))
    ); // hours
  }

  return {
    isMemberOnly,
    isEarlyAccessPromotion,
    memberOnlyTimeRemaining,
    earlyAccessTimeRemaining,
    publicAccessDate,
    publicPromotionDate,
  };
}

/**
 * Check if user can access product (considering member status and early access)
 */
export function canUserAccessProduct(
  product: EarlyAccessProduct,
  isMember: boolean,
  now: Date = new Date()
): boolean {
  const earlyAccessStatus = calculateEarlyAccessStatus(product, now);

  // If product is member-only, only members can access
  if (earlyAccessStatus.isMemberOnly) {
    return isMember;
  }

  // Otherwise, everyone can access the product itself
  return true;
}

/**
 * Check if user can access promotional pricing (considering early access)
 */
export function canUserAccessPromotionalPrice(
  product: EarlyAccessProduct,
  isMember: boolean,
  now: Date = new Date()
): boolean {
  const earlyAccessStatus = calculateEarlyAccessStatus(product, now);

  // If promotion is in early access period, only members can access promotional price
  if (earlyAccessStatus.isEarlyAccessPromotion) {
    return isMember;
  }

  // Check if regular promotion is active (using existing logic)
  if (
    product.isPromotional &&
    product.promotionStartDate &&
    product.promotionEndDate
  ) {
    const promotionStart = new Date(product.promotionStartDate);
    const promotionEnd = new Date(product.promotionEndDate);
    return now >= promotionStart && now <= promotionEnd;
  }

  return false;
}

/**
 * Get early access display text for UI
 */
export function getEarlyAccessDisplayText(
  earlyAccessStatus: EarlyAccessStatus
): string | null {
  if (earlyAccessStatus.isMemberOnly) {
    if (earlyAccessStatus.memberOnlyTimeRemaining !== undefined) {
      if (earlyAccessStatus.memberOnlyTimeRemaining <= 1) {
        return 'Member exclusive - Public access soon!';
      } else if (earlyAccessStatus.memberOnlyTimeRemaining <= 24) {
        return `Member exclusive - Public in ${earlyAccessStatus.memberOnlyTimeRemaining}h`;
      } else {
        const days = Math.ceil(earlyAccessStatus.memberOnlyTimeRemaining / 24);
        return `Member exclusive - Public in ${days}d`;
      }
    }
    return 'Member exclusive';
  }

  if (earlyAccessStatus.isEarlyAccessPromotion) {
    if (earlyAccessStatus.earlyAccessTimeRemaining !== undefined) {
      if (earlyAccessStatus.earlyAccessTimeRemaining <= 1) {
        return 'Member early access - Public pricing soon!';
      } else if (earlyAccessStatus.earlyAccessTimeRemaining <= 24) {
        return `Member early access - Public in ${earlyAccessStatus.earlyAccessTimeRemaining}h`;
      } else {
        const days = Math.ceil(earlyAccessStatus.earlyAccessTimeRemaining / 24);
        return `Member early access - Public in ${days}d`;
      }
    }
    return 'Member early access';
  }

  return null;
}

/**
 * Filter products based on user's access level
 */
export function filterProductsByAccess<T extends EarlyAccessProduct>(
  products: T[],
  isMember: boolean,
  now: Date = new Date()
): T[] {
  return products.filter(product =>
    canUserAccessProduct(product, isMember, now)
  );
}

/**
 * Get the effective promotional price considering early access
 */
export function getEarlyAccessPrice(
  product: EarlyAccessProduct & { regularPrice: number; memberPrice: number },
  isMember: boolean,
  now: Date = new Date()
): {
  price: number;
  priceType: 'regular' | 'member' | 'promotional' | 'early-access';
  hasEarlyAccess: boolean;
} {
  const canAccessPromotion = canUserAccessPromotionalPrice(
    product,
    isMember,
    now
  );
  const earlyAccessStatus = calculateEarlyAccessStatus(product, now);

  // Early access promotional price (members only during early access period)
  if (
    canAccessPromotion &&
    earlyAccessStatus.isEarlyAccessPromotion &&
    product.promotionalPrice
  ) {
    return {
      price: product.promotionalPrice,
      priceType: 'early-access',
      hasEarlyAccess: true,
    };
  }

  // Regular promotional price (when promotion is publicly active)
  if (canAccessPromotion && product.promotionalPrice) {
    return {
      price: product.promotionalPrice,
      priceType: 'promotional',
      hasEarlyAccess: false,
    };
  }

  // Member price (when no active promotion)
  if (isMember && product.memberPrice < product.regularPrice) {
    return {
      price: product.memberPrice,
      priceType: 'member',
      hasEarlyAccess: false,
    };
  }

  // Regular price
  return {
    price: product.regularPrice,
    priceType: 'regular',
    hasEarlyAccess: false,
  };
}
