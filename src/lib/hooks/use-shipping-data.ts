/**
 * React Query hooks for shipping data with smart caching
 * Phase 3: Smart Caching with React Query
 * Phase 4: Combined init endpoint integration
 *
 * @module lib/hooks/use-shipping-data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

// Mutation hook for saving settings with optimistic updates
export function useSaveShippingSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/shipping/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save settings');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch init data after successful save
      queryClient.invalidateQueries({ queryKey: ['shipping', 'init'] });
    },
  });
}
