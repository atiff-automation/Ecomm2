/**
 * useFreshMembership Hook - Get Fresh Membership Status
 * Fetches current membership status from database instead of relying on stale session
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

interface MembershipStatus {
  isLoggedIn: boolean;
  isMember: boolean;
  hasPendingMembership: boolean;
  loading: boolean;
  error?: string;
}

export function useFreshMembership(): MembershipStatus {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>({
    isLoggedIn: false,
    isMember: false,
    hasPendingMembership: false,
    loading: true
  });

  useEffect(() => {
    async function fetchMembershipStatus() {
      if (status === 'loading') return;
      
      if (!session?.user) {
        setMembershipStatus({
          isLoggedIn: false,
          isMember: false,
          hasPendingMembership: false,
          loading: false
        });
        return;
      }

      try {
        // Add cache busting parameter to ensure fresh data
        const response = await fetch(`/api/auth/membership-status?t=${Date.now()}`);
        const data = await response.json();

        console.log('🔍 Fresh membership status API response:', {
          status: response.status,
          data
        });

        if (response.ok) {
          setMembershipStatus({
            isLoggedIn: data.isLoggedIn,
            isMember: data.isMember,
            hasPendingMembership: data.hasPendingMembership,
            loading: false
          });
          console.log('✅ Fresh membership status updated:', {
            isLoggedIn: data.isLoggedIn,
            isMember: data.isMember,
            hasPendingMembership: data.hasPendingMembership
          });
        } else {
          throw new Error(data.error || 'Failed to fetch membership status');
        }
      } catch (error) {
        console.error('Error fetching membership status:', error);
        setMembershipStatus({
          isLoggedIn: !!session?.user,
          isMember: session?.user?.isMember || false, // Fallback to session
          hasPendingMembership: false,
          loading: false,
          error: 'Failed to get fresh membership status'
        });
      }
    }

    fetchMembershipStatus();
  }, [session, status, pathname]); // Add pathname to dependencies to refresh on navigation

  return membershipStatus;
}