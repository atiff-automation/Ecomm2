/**
 * React Query Configuration
 * Centralized QueryClient with optimal settings for e-commerce platform
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create QueryClient with production-ready defaults
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Caching Strategy
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 10, // 10 minutes - garbage collection (formerly cacheTime)

      // Refetch Strategy
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch on internet reconnection
      refetchOnMount: false, // Don't refetch if data is fresh

      // Retry Strategy
      retry: 2, // Retry failed requests twice
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Performance
      networkMode: 'online', // Only fetch when online
    },
    mutations: {
      // Retry Strategy for mutations
      retry: 1, // Retry once for failed mutations
      networkMode: 'online',
    },
  },
});

/**
 * Query Keys - Centralized for consistency
 */
export const queryKeys = {
  // Payment queries
  paymentMethods: ['payment', 'methods'] as const,

  // Membership queries
  membershipStatus: (userId?: string) =>
    userId
      ? (['membership', 'status', userId] as const)
      : (['membership', 'status'] as const),

  // Cart queries (for future migration)
  cart: (userId?: string) =>
    userId ? (['cart', userId] as const) : (['cart'] as const),

  // Product queries (for future migration)
  products: {
    all: ['products'] as const,
    detail: (slug: string) => ['products', 'detail', slug] as const,
    category: (categoryId: string) =>
      ['products', 'category', categoryId] as const,
  },

  // Shipping queries
  shippingSettings: ['shipping', 'settings'] as const,
} as const;
