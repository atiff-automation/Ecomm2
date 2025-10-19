/**
 * useRealTimeUpdates Hook
 * Real-time data updates following centralized architecture
 * Following @CLAUDE.md approach with systematic polling and error handling
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';

interface UseRealTimeUpdatesOptions {
  enabled: boolean;
  interval: number;
  onUpdate: () => Promise<void>;
  onError?: (error: Error) => void;
  maxRetries?: number;
  backoffMultiplier?: number;
}

export function useRealTimeUpdates({
  enabled,
  interval,
  onUpdate,
  onError,
  maxRetries = 3,
  backoffMultiplier = 2,
}: UseRealTimeUpdatesOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isUpdatingRef = useRef(false);

  const stopUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const performUpdate = useCallback(async () => {
    if (isUpdatingRef.current) {
      return;
    }

    try {
      isUpdatingRef.current = true;
      await onUpdate();
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.error('Real-time update failed:', error);
      retryCountRef.current += 1;

      if (retryCountRef.current >= maxRetries) {
        // Stop updates after max retries
        stopUpdates();
        onError?.(error as Error);
      } else {
        // Exponential backoff for retries
        const backoffDelay =
          interval * Math.pow(backoffMultiplier, retryCountRef.current - 1);
        setTimeout(() => {
          if (enabled) {
            performUpdate();
          }
        }, backoffDelay);
      }
    } finally {
      isUpdatingRef.current = false;
    }
  }, [
    onUpdate,
    onError,
    maxRetries,
    backoffMultiplier,
    interval,
    enabled,
    stopUpdates,
  ]);

  const startUpdates = useCallback(() => {
    stopUpdates(); // Clear any existing interval
    retryCountRef.current = 0;

    if (enabled) {
      // Immediate update
      performUpdate();

      // Set up recurring updates
      intervalRef.current = setInterval(() => {
        if (enabled && retryCountRef.current < maxRetries) {
          performUpdate();
        }
      }, interval);
    }
  }, [enabled, interval, performUpdate, maxRetries, stopUpdates]);

  useEffect(() => {
    if (enabled) {
      startUpdates();
    } else {
      stopUpdates();
    }

    return stopUpdates;
  }, [enabled, startUpdates, stopUpdates]);

  // Handle visibility change to pause/resume updates
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopUpdates();
      } else if (enabled) {
        startUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, startUpdates, stopUpdates]);

  return {
    startUpdates,
    stopUpdates,
    retryCount: retryCountRef.current,
    isUpdating: isUpdatingRef.current,
  };
}
