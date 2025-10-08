/**
 * Payment Methods Query Hook
 * Uses React Query for automatic caching, deduplication, and background refetching
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-client';

/**
 * Payment Method Interface
 */
export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  features: string[];
  processingTime: string;
  available: boolean;
}

/**
 * Payment Methods API Response
 */
export interface PaymentMethodsResponse {
  success: boolean;
  methods: PaymentMethod[];
  activeMethods: PaymentMethod[];
  defaultMethod: string | null;
  availability: {
    toyyibpay: {
      available: boolean;
      configured: boolean;
      error?: string;
    };
  };
  hasAvailableGateways: boolean;
  error?: string;
}

/**
 * Fetch payment methods from API
 */
async function fetchPaymentMethods(): Promise<PaymentMethodsResponse> {
  const response = await fetch('/api/payment/methods');

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data: PaymentMethodsResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch payment methods');
  }

  console.log('💳 Payment methods fetched:', {
    total: data.methods.length,
    active: data.activeMethods.length,
    hasGateways: data.hasAvailableGateways,
    default: data.defaultMethod,
  });

  return data;
}

/**
 * Use Payment Methods Query Hook
 *
 * Features:
 * - Automatic caching (5 min stale time)
 * - Request deduplication (multiple calls = 1 API request)
 * - Background refetching on window focus
 * - Automatic retry on failure
 *
 * @example
 * const { data, isLoading, error } = usePaymentMethods();
 */
export function usePaymentMethods() {
  return useQuery({
    queryKey: queryKeys.paymentMethods,
    queryFn: fetchPaymentMethods,
    staleTime: 1000 * 60 * 5, // 5 minutes - payment methods rarely change
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnWindowFocus: false, // Payment methods don't change often
    retry: 2,
  });
}
