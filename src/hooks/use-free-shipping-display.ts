/**
 * Free Shipping Display Hook
 *
 * React Query hook for fetching and displaying dynamic free shipping information
 * based on admin-configured state-based eligibility settings.
 *
 * Features:
 * - Automatic caching (15 min stale time)
 * - Request deduplication (multiple components = 1 API call)
 * - Background refetching on window focus
 * - Stale-while-revalidate pattern
 *
 * @module hooks/use-free-shipping-display
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-client';
import { getFreeShippingText } from '@/lib/shipping/utils/free-shipping-display';

interface ShippingSettings {
  freeShippingEnabled: boolean;
  freeShippingThreshold?: number;
  freeShippingEligibleStates?: string[];
}

interface ShippingSettingsResponse {
  success: boolean;
  data?: {
    settings: ShippingSettings | null;
  };
}

/**
 * Fetch shipping settings from public API
 */
async function fetchShippingSettings(): Promise<string | null> {
  const response = await fetch('/api/shipping/init');

  if (!response.ok) {
    throw new Error('Failed to fetch shipping settings');
  }

  const data: ShippingSettingsResponse = await response.json();

  if (!data.success || !data.data?.settings) {
    return null;
  }

  const settings = data.data.settings;

  return getFreeShippingText(
    settings.freeShippingThreshold,
    settings.freeShippingEligibleStates,
    settings.freeShippingEnabled
  );
}

/**
 * Use Free Shipping Display Query Hook
 *
 * @returns Object containing free shipping text, loading state, and error
 *
 * @example
 * const { freeShippingText, isLoading } = useFreeShippingDisplay();
 *
 * if (!isLoading && freeShippingText) {
 *   return <span>{freeShippingText}</span>
 * }
 */
export function useFreeShippingDisplay() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.shippingSettings,
    queryFn: fetchShippingSettings,
    staleTime: 1000 * 60 * 15, // 15 minutes - settings rarely change
    gcTime: 1000 * 60 * 30, // 30 minutes cache
    refetchOnWindowFocus: true, // Refetch when user returns (admin might update settings)
    retry: 2,
  });

  return {
    freeShippingText: data ?? null,
    loading: isLoading,
    error: error ? (error instanceof Error ? error : new Error('Unknown error')) : null,
  };
}
