/**
 * Membership Status Query Hook
 * Uses React Query for automatic caching, deduplication, and background refetching
 * Replaces the old useFreshMembership hook with proper caching
 */

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { queryKeys } from '@/lib/react-query/query-client';

/**
 * Membership Status Interface
 */
export interface MembershipStatus {
  isLoggedIn: boolean;
  isMember: boolean;
  hasPendingMembership: boolean;
}

/**
 * Membership Status API Response
 */
interface MembershipStatusResponse extends MembershipStatus {
  error?: string;
}

/**
 * Fetch membership status from API
 */
async function fetchMembershipStatus(
  userId: string | undefined
): Promise<MembershipStatus> {
  if (!userId) {
    return {
      isLoggedIn: false,
      isMember: false,
      hasPendingMembership: false,
    };
  }

  // Add cache busting to ensure fresh data
  const response = await fetch(
    `/api/auth/membership-status?t=${Date.now()}`
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data: MembershipStatusResponse = await response.json();

  console.log('🔍 Membership status fetched:', {
    isLoggedIn: data.isLoggedIn,
    isMember: data.isMember,
    hasPendingMembership: data.hasPendingMembership,
  });

  return {
    isLoggedIn: data.isLoggedIn,
    isMember: data.isMember,
    hasPendingMembership: data.hasPendingMembership,
  };
}

/**
 * Use Membership Status Query Hook
 *
 * Features:
 * - Automatic caching (3 min stale time)
 * - Request deduplication (multiple calls = 1 API request)
 * - Background refetching on window focus
 * - Automatic retry on failure
 * - Disabled when user is not logged in
 *
 * @example
 * const { data, isLoading, error } = useMembershipStatus();
 * const isMember = data?.isMember || false;
 */
export function useMembershipStatus() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: queryKeys.membershipStatus(userId),
    queryFn: () => fetchMembershipStatus(userId),
    enabled: status !== 'loading', // Only fetch when session is ready
    staleTime: 1000 * 60 * 3, // 3 minutes - membership changes should reflect quickly
    gcTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: true, // Refetch when user returns to tab (membership might change)
    retry: 2,
  });
}

/**
 * Backward-compatible hook that matches the old useFreshMembership interface
 * @deprecated Use useMembershipStatus directly for better type safety
 */
export function useFreshMembership() {
  const { data, isLoading, error } = useMembershipStatus();

  return {
    isLoggedIn: data?.isLoggedIn || false,
    isMember: data?.isMember || false,
    hasPendingMembership: data?.hasPendingMembership || false,
    loading: isLoading,
    error: error?.message,
  };
}
