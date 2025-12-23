/**
 * React Query hooks for shipping data with smart caching
 * Phase 3: Smart Caching with React Query
 * Phase 4: Combined init endpoint integration
 * Phase 5: Centralized mutation with cache invalidation
 *
 * @module lib/hooks/use-shipping-data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ShippingSettingsFormData } from '@/lib/shipping/validation';

// Generic fetcher for all endpoints
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'API request failed');
  }
  return res.json();
};

// Phase 4: React Query configuration for combined init endpoint
export function useShippingInit() {
  return useQuery({
    queryKey: ['shipping', 'init'],
    queryFn: () => fetcher('/api/admin/shipping/init'),
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute
    refetchOnWindowFocus: true, // Refetch on focus (ensure fresh data)
    refetchOnReconnect: true, // Refetch on reconnect
    retry: 1,
  });
}

// React Query configuration for balance (with caching)
export function useShippingBalance(enabled = true) {
  return useQuery({
    queryKey: ['shipping', 'balance'],
    queryFn: () => fetcher('/api/admin/shipping/balance'),
    enabled, // Allow conditional fetching
    staleTime: 60000, // Consider data fresh for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: 1, // Only retry once on failure
  });
}

// React Query configuration for couriers (with longer cache)
export function useAvailableCouriers(enabled = true) {
  return useQuery({
    queryKey: ['shipping', 'couriers'],
    queryFn: () => fetcher('/api/admin/shipping/couriers'),
    enabled, // Allow conditional fetching
    staleTime: 300000, // Consider data fresh for 5 minutes
    gcTime: 600000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}

/**
 * API Response type for save settings endpoint
 */
interface SaveSettingsResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
  details?: {
    errors: string[];
    warnings?: string[];
  };
}

/**
 * Mutation hook for saving shipping settings
 *
 * Features:
 * - Type-safe mutation with ShippingSettingsFormData
 * - Automatic cache invalidation for BOTH admin and public caches
 * - CSRF protection via fetchWithCSRF utility
 *
 * Cache Invalidation Strategy:
 * - ['shipping', 'init'] - Admin shipping settings page
 * - ['shipping', 'settings'] - Public free shipping display (product pages)
 *
 * @returns React Query mutation object with mutate/mutateAsync methods
 *
 * @example
 * const saveSettings = useSaveShippingSettings();
 * await saveSettings.mutateAsync(formData);
 */
export function useSaveShippingSettings() {
  const queryClient = useQueryClient();

  return useMutation<SaveSettingsResponse, Error, ShippingSettingsFormData>({
    mutationFn: async (data: ShippingSettingsFormData) => {
      // Import fetchWithCSRF dynamically to avoid circular dependencies
      const { fetchWithCSRF } = await import('@/lib/utils/fetch-with-csrf');

      const response = await fetchWithCSRF('/api/admin/shipping/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result: SaveSettingsResponse = await response.json();

      // Throw on non-ok response for proper error handling
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save settings');
      }

      return result;
    },
    onSuccess: () => {
      // CRITICAL: Invalidate ALL shipping-related caches to ensure consistency
      // This ensures both admin pages and public product pages get fresh data

      // 1. Admin shipping settings page cache
      queryClient.invalidateQueries({ queryKey: ['shipping', 'init'] });

      // 2. Public free shipping display cache (product pages)
      queryClient.invalidateQueries({ queryKey: ['shipping', 'settings'] });

      console.log('[Cache] Invalidated shipping caches: init + settings');
    },
    onError: (error) => {
      console.error('[Mutation] Save shipping settings failed:', error);
    },
  });
}
