/**
 * useAuth Hook - Malaysian E-commerce Platform
 * React hook for accessing centralized authentication logic
 *
 * This hook provides a clean React interface to the AuthService,
 * handling all session management and auth state centrally.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { AuthService } from '@/lib/services/auth-service';
import {
  User,
  Session,
  UseAuthReturn,
  SignInOptions,
  SignOutOptions,
  AuthEvent,
} from '@/lib/types/auth';

/**
 * Main authentication hook
 */
export function useAuth(): UseAuthReturn {
  const { data: nextAuthSession, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Convert NextAuth session to our enhanced session type
  const session: Session | null = useMemo(() => {
    if (!nextAuthSession?.user) {
      return null;
    }

    return {
      user: AuthService['enhanceUserData'](nextAuthSession.user),
      expires: nextAuthSession.expires,
    };
  }, [nextAuthSession]);

  // Derived state
  const isLoading = status === 'loading';
  const isLoggedIn = !!session?.user;
  const isMember = session?.user?.isMember || false;
  const isAdmin = session?.user?.role === 'ADMIN';
  const user = session?.user || null;

  // User info shortcuts
  const userId = user?.id;
  const userName = user?.name;
  const userEmail = user?.email;
  const membershipDate = user?.membershipDate;
  const totalSpent = user?.totalSpent || 0;

  // Calculated values
  const membershipProgress = useMemo(() => {
    return AuthService.calculateMembershipProgress(totalSpent);
  }, [totalSpent]);

  const isAuthenticated = isLoggedIn;
  const hasValidSession = useMemo(() => {
    if (!session) {
      return false;
    }
    return AuthService.validateSession(session);
  }, [session]);

  // Actions
  const signIn = useCallback(async (credentials?: SignInOptions) => {
    setError(null);
    const result = await AuthService.signIn(credentials);
    if (!result.success && result.error) {
      setError(result.error);
    }
  }, []);

  const signOut = useCallback(async (options?: SignOutOptions) => {
    setError(null);
    try {
      await AuthService.signOut(options);
    } catch (err) {
      setError('Sign out failed');
    }
  }, []);

  const refreshSession = useCallback(async () => {
    setError(null);
    try {
      const refreshedSession = await AuthService.refreshSession();
      setLastRefresh(new Date());
      return refreshedSession;
    } catch (err) {
      setError('Failed to refresh session');
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Utility methods
  const checkMembershipStatus = useCallback(() => {
    return isMember;
  }, [isMember]);

  const getMembershipProgress = useCallback(() => {
    return membershipProgress;
  }, [membershipProgress]);

  const canAccessMemberFeatures = useCallback(() => {
    return isMember;
  }, [isMember]);

  const getSessionTimeRemaining = useCallback(() => {
    if (!session) {
      return 0;
    }
    return AuthService.getSessionTimeRemaining(session);
  }, [session]);

  // Set up auth event listeners
  useEffect(() => {
    const unsubscribeError = AuthService.onAuthEvent('AUTH_ERROR', payload => {
      setError(payload.error || 'Authentication error occurred');
    });

    const unsubscribeUpdate = AuthService.onAuthEvent('SESSION_UPDATED', () => {
      setLastRefresh(new Date());
      setError(null);
    });

    return () => {
      unsubscribeError();
      unsubscribeUpdate();
    };
  }, []);

  return {
    // Session state
    session,
    isLoading,
    isLoggedIn,
    isMember,
    isAdmin,

    // User info
    user,
    userId,
    userName,
    userEmail,

    // Membership info
    membershipDate,
    totalSpent,
    membershipProgress,

    // Auth status checks
    isAuthenticated,
    hasValidSession,

    // Actions
    signIn,
    signOut,
    refreshSession,

    // Error handling
    error,
    clearError,

    // Utility methods
    checkMembershipStatus,
    getMembershipProgress,
    canAccessMemberFeatures,
    getSessionTimeRemaining,
  };
}

/**
 * Hook for checking if user is authenticated (lightweight)
 */
export function useIsAuthenticated(): boolean {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return false;
  }
  return !!session?.user;
}

/**
 * Hook for checking membership status (lightweight)
 */
export function useIsMember(): boolean {
  const { data: session, status } = useSession();

  if (status === 'loading' || !session?.user) {
    return false;
  }

  const user = session.user as any;
  const totalSpent = user.totalSpent || 0;
  return user.isMember || totalSpent >= 80; // RM 80 threshold
}

/**
 * Hook for getting user info (lightweight)
 */
export function useUser(): User | null {
  const { data: session, status } = useSession();

  if (status === 'loading' || !session?.user) {
    return null;
  }

  return AuthService['enhanceUserData'](session.user);
}

/**
 * Hook for admin-only features
 */
export function useIsAdmin(): boolean {
  const { data: session, status } = useSession();

  if (status === 'loading' || !session?.user) {
    return false;
  }

  const user = session.user as any;
  return user.role === 'ADMIN';
}

/**
 * Hook for membership progress tracking
 */
export function useMembershipProgress(): {
  progress: number;
  remaining: number;
  isMember: boolean;
  totalSpent: number;
} {
  const { data: session, status } = useSession();

  const defaultReturn = {
    progress: 0,
    remaining: 80,
    isMember: false,
    totalSpent: 0,
  };

  if (status === 'loading' || !session?.user) {
    return defaultReturn;
  }

  const user = session.user as any;
  const totalSpent = user.totalSpent || 0;
  const isMember = user.isMember || totalSpent >= 80;
  const progress = AuthService.calculateMembershipProgress(totalSpent);
  const remaining = AuthService.getMembershipRemaining(totalSpent);

  return {
    progress,
    remaining,
    isMember,
    totalSpent,
  };
}

/**
 * Hook for session expiry tracking
 */
export function useSessionExpiry(): {
  timeRemaining: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
} {
  const { data: session } = useSession();
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!session) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remaining = AuthService.getSessionTimeRemaining(session);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [session]);

  return {
    timeRemaining,
    isExpiringSoon: timeRemaining <= 5 && timeRemaining > 0,
    isExpired: timeRemaining <= 0,
  };
}

/**
 * Hook for auth event listening
 */
export function useAuthEvents(
  event: AuthEvent,
  callback: (payload: any) => void,
  deps: any[] = []
): void {
  useEffect(() => {
    const unsubscribe = AuthService.onAuthEvent(event, callback);
    return unsubscribe;
  }, deps);
}

/**
 * Hook for getting user avatar URL
 */
export function useUserAvatar(): string | null {
  const user = useUser();

  if (!user) {
    return null;
  }

  return AuthService.getAvatarUrl(user);
}

/**
 * Hook for getting display name
 */
export function useDisplayName(): string | null {
  const user = useUser();

  if (!user) {
    return null;
  }

  return AuthService.getDisplayName(user);
}
