/**
 * usePricing Hook - Malaysian E-commerce Platform
 * React hook for accessing centralized pricing logic
 *
 * This hook provides a clean React interface to the PricingService,
 * handling all pricing calculations and business logic centrally.
 */

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { PricingService } from '@/lib/services/pricing-service';
import {
  ProductPricing,
  ProductPricingData,
  UserPricingContext,
} from '@/lib/types/pricing';
import { useFreshMembership } from './use-fresh-membership';

/**
 * Hook for getting complete pricing information for a product
 */
export function usePricing(product: ProductPricingData): ProductPricing {
  const { data: session } = useSession();
  const freshMembership = useFreshMembership();

  const userContext: UserPricingContext = useMemo(
    () => {
      console.log('🔍 usePricing userContext:', {
        freshMembershipLoading: freshMembership.loading,
        freshMembershipLoggedIn: freshMembership.isLoggedIn,
        freshMembershipIsMember: freshMembership.isMember,
        sessionIsMember: session?.user?.isMember,
        userId: session?.user?.id
      });
      
      return {
        isLoggedIn: freshMembership.isLoggedIn,
        isMember: freshMembership.isMember, // Use fresh membership status
        userId: session?.user?.id,
      };
    },
    [freshMembership.isLoggedIn, freshMembership.isMember, session?.user?.id, freshMembership.loading]
  );

  const pricing = useMemo(() => {
    return PricingService.calculateProductPricing(product, userContext);
  }, [product, userContext]);

  return pricing;
}

/**
 * Hook for getting just the formatted price string (lightweight)
 */
export function useSimplePrice(product: ProductPricingData): string {
  const { data: session } = useSession();

  const userContext: UserPricingContext = useMemo(
    () => ({
      isLoggedIn: !!session?.user,
      isMember: session?.user?.isMember || false,
      userId: session?.user?.id,
    }),
    [session]
  );

  return useMemo(() => {
    return PricingService.getSimplePrice(product, userContext);
  }, [product, userContext]);
}

/**
 * Hook for checking if a product has active promotions
 */
export function useHasPromotion(product: ProductPricingData): boolean {
  return useMemo(() => {
    return PricingService.hasActivePromotion(product);
  }, [product]);
}

/**
 * Hook for getting savings amount
 */
export function useSavings(product: ProductPricingData): number {
  const { data: session } = useSession();

  const userContext: UserPricingContext = useMemo(
    () => ({
      isLoggedIn: !!session?.user,
      isMember: session?.user?.isMember || false,
      userId: session?.user?.id,
    }),
    [session]
  );

  return useMemo(() => {
    return PricingService.getSavings(product, userContext);
  }, [product, userContext]);
}

/**
 * Hook for getting user pricing context (useful for multiple components)
 */
export function useUserPricingContext(): UserPricingContext {
  const { data: session } = useSession();

  return useMemo(
    () => ({
      isLoggedIn: !!session?.user,
      isMember: session?.user?.isMember || false,
      userId: session?.user?.id,
    }),
    [session]
  );
}

/**
 * Hook for multiple products pricing (optimized for lists)
 */
export function useMultiplePricing(
  products: ProductPricingData[]
): ProductPricing[] {
  const { data: session } = useSession();

  const userContext: UserPricingContext = useMemo(
    () => ({
      isLoggedIn: !!session?.user,
      isMember: session?.user?.isMember || false,
      userId: session?.user?.id,
    }),
    [session]
  );

  return useMemo(() => {
    return products.map(product =>
      PricingService.calculateProductPricing(product, userContext)
    );
  }, [products, userContext]);
}
