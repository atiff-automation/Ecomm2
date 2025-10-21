/**
 * CSRF Token Management Hook - JRM E-commerce Platform
 * CENTRALIZED CSRF token fetching, storage, and auto-refresh
 *
 * SINGLE SOURCE OF TRUTH for frontend CSRF token management
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface CSRFTokenResponse {
  success: boolean;
  csrfToken: string;
  expiresIn: number; // milliseconds
  headerName: string;
  error?: string;
  message?: string;
}

interface CSRFTokenState {
  token: string | null;
  headerName: string;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for CSRF token management
 *
 * Features:
 * - Automatic token fetching on mount
 * - Auto-refresh before expiration
 * - Error handling and retry logic
 * - Centralized token storage
 *
 * Usage:
 * ```typescript
 * const { token, headerName, loading, error, refreshToken } = useCsrfToken();
 *
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 *
 * // Use token in requests
 * await fetch('/api/admin/products', {
 *   method: 'POST',
 *   headers: { [headerName]: token },
 *   body: JSON.stringify(data)
 * });
 * ```
 */
export function useCsrfToken() {
  const [state, setState] = useState<CSRFTokenState>({
    token: null,
    headerName: 'x-csrf-token',
    loading: true,
    error: null,
  });

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  /**
   * CENTRALIZED token fetch function - DRY PRINCIPLE
   */
  const fetchToken = useCallback(async (): Promise<void> => {
    // Prevent concurrent refresh attempts
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Never cache CSRF tokens
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
      }

      const data: CSRFTokenResponse = await response.json();

      if (!data.success || !data.csrfToken) {
        throw new Error(data.message || 'Invalid CSRF token response');
      }

      // Update state with new token - CENTRALIZED STATE MANAGEMENT
      setState({
        token: data.csrfToken,
        headerName: data.headerName,
        loading: false,
        error: null,
      });

      // Schedule auto-refresh before token expires - SYSTEMATIC TOKEN REFRESH
      // Refresh at 90% of token lifetime to avoid edge cases
      const refreshInterval = data.expiresIn * 0.9;

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = setTimeout(() => {
        fetchToken();
      }, refreshInterval);

    } catch (error) {
      console.error('CSRF token fetch error:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch CSRF token';

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      // Retry after 5 seconds on error - SYSTEMATIC ERROR RECOVERY
      refreshTimerRef.current = setTimeout(() => {
        fetchToken();
      }, 5000);

    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  /**
   * Manual token refresh function - SYSTEMATIC REFRESH
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    await fetchToken();
  }, [fetchToken]);

  /**
   * Initialize token fetch on mount - SYSTEMATIC INITIALIZATION
   */
  useEffect(() => {
    fetchToken();

    // Cleanup on unmount - SYSTEMATIC RESOURCE MANAGEMENT
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [fetchToken]);

  return {
    /**
     * Current CSRF token (null if loading or error)
     */
    token: state.token,

    /**
     * Header name to use when sending token (default: 'x-csrf-token')
     */
    headerName: state.headerName,

    /**
     * Loading state
     */
    loading: state.loading,

    /**
     * Error state (null if no error)
     */
    error: state.error,

    /**
     * Manual refresh function
     */
    refreshToken,

    /**
     * Helper to get headers object with CSRF token included
     */
    getHeaders: (additionalHeaders?: Record<string, string>) => ({
      ...additionalHeaders,
      [state.headerName]: state.token || '',
    }),
  };
}

/**
 * Utility function to get CSRF token synchronously
 * Use this when you need the token outside of React components
 *
 * NOTE: This fetches a new token on each call - use sparingly
 */
export async function getCsrfToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
    }

    const data: CSRFTokenResponse = await response.json();

    if (!data.success || !data.csrfToken) {
      throw new Error('Invalid CSRF token response');
    }

    return data.csrfToken;
  } catch (error) {
    console.error('CSRF token fetch error:', error);
    throw error;
  }
}

/**
 * CENTRALIZED CSRF token storage for non-React contexts
 * Singleton pattern for consistent token access
 */
class CSRFTokenManager {
  private static instance: CSRFTokenManager;
  private token: string | null = null;
  private headerName: string = 'x-csrf-token';
  private refreshTimer: NodeJS.Timeout | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): CSRFTokenManager {
    if (!CSRFTokenManager.instance) {
      CSRFTokenManager.instance = new CSRFTokenManager();
    }
    return CSRFTokenManager.instance;
  }

  /**
   * Initialize token manager - call once at app startup
   */
  async initialize(): Promise<void> {
    await this.refreshToken();
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get header name
   */
  getHeaderName(): string {
    return this.headerName;
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<void> {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
      }

      const data: CSRFTokenResponse = await response.json();

      if (!data.success || !data.csrfToken) {
        throw new Error('Invalid CSRF token response');
      }

      this.token = data.csrfToken;
      this.headerName = data.headerName;

      // Schedule auto-refresh
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
      }

      const refreshInterval = data.expiresIn * 0.9;
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshInterval);

    } catch (error) {
      console.error('CSRF token manager refresh error:', error);

      // Retry after 5 seconds
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
      }

      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, 5000);
    }
  }

  /**
   * Get headers with CSRF token
   */
  getHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    return {
      ...additionalHeaders,
      [this.headerName]: this.token || '',
    };
  }
}

/**
 * Export singleton instance
 */
export const csrfTokenManager = CSRFTokenManager.getInstance();
