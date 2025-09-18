/**
 * Monitoring Provider - Malaysian E-commerce Platform
 * React context provider for monitoring functionality
 * Refactored to use centralized monitoring service - Phase 3 DRY Implementation
 */

'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { errorMonitor, useErrorMonitor } from './error-monitor';
import { monitoringService, MonitoringType } from './monitoring-service';
import { isFeatureEnabled } from './monitoring-config';

interface MonitoringContextType {
  reportError: (error: Error, context?: Record<string, any>) => void;
  addBreadcrumb: (
    message: string,
    level?: 'info' | 'warn' | 'error' | 'user' | 'navigation'
  ) => void;
  trackUserAction: (action: string, properties?: Record<string, any>) => void;
  getStats: () => any;
}

const MonitoringContext = createContext<MonitoringContextType | null>(null);

interface MonitoringProviderProps {
  children: ReactNode;
  config?: {
    enableErrorReporting?: boolean;
    enablePerformanceMonitoring?: boolean;
    enableUserTracking?: boolean;
    sampleRate?: number;
  };
}

export function MonitoringProvider({
  children,
  config = {},
}: MonitoringProviderProps) {
  const { reportError, addBreadcrumb, getStats } = useErrorMonitor();

  useEffect(() => {
    // Initialize centralized monitoring service - DRY approach - TEMPORARILY DISABLED
    // monitoringService.initialize(); // DISABLED due to fetch interference
    
    // Update legacy monitoring configuration if provided
    if (Object.keys(config).length > 0) {
      errorMonitor.updateConfig(config);
    }

    // Add breadcrumb for provider initialization
    addBreadcrumb('Monitoring provider initialized', 'info');

    // Track page load using centralized service
    if (isFeatureEnabled('userTracking')) {
      trackUserAction('page_load', {
        url: window.location.href,
        timestamp: new Date().toISOString(),
      });
    }

    return () => {
      addBreadcrumb('Monitoring provider cleanup', 'info');
    };
  }, [addBreadcrumb, config]);

  const trackUserAction = async (
    action: string,
    properties?: Record<string, any>
  ) => {
    try {
      // DRY: Use centralized monitoring service instead of duplicate API calls
      if (isFeatureEnabled('userTracking')) {
        await monitoringService.trackUserAction(action, properties);
        
        // Add breadcrumb for legacy compatibility
        addBreadcrumb(`User action: ${action}`, 'user');
      }
    } catch (error) {
      console.error('Error tracking user action:', error);
      // Report error through centralized service
      reportError(error instanceof Error ? error : new Error('User action tracking failed'));
    }
  };

  const contextValue: MonitoringContextType = {
    reportError,
    addBreadcrumb,
    trackUserAction,
    getStats,
  };

  return (
    <MonitoringContext.Provider value={contextValue}>
      {children}
    </MonitoringContext.Provider>
  );
}

/**
 * Hook to use monitoring functionality
 */
export function useMonitoring(): MonitoringContextType {
  const context = useContext(MonitoringContext);

  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }

  return context;
}

/**
 * Get or generate session ID
 */
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('monitoring_session_id');

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('monitoring_session_id', sessionId);
  }

  return sessionId;
}

/**
 * Get user ID from session/local storage
 */
function getUserId(): string | null {
  try {
    const userStr =
      sessionStorage.getItem('user') || localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || null;
    }
  } catch {
    // Ignore errors
  }

  return null;
}
