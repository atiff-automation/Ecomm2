/**
 * Sentry Configuration for Error Tracking
 * Provides centralized error monitoring and performance tracking
 */

import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  // Only initialize Sentry if DSN is provided
  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn) {
    console.warn('Sentry DSN not provided. Error tracking is disabled.');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Error Filtering
    beforeSend(event, hint) {
      // Filter out development errors
      if (process.env.NODE_ENV === 'development') {
        console.log('Sentry Event:', event);
        return null; // Don't send to Sentry in development
      }

      // Filter out specific errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Don't send client-side network errors
        if (
          error.message?.includes('Network Error') ||
          error.message?.includes('fetch')
        ) {
          return null;
        }

        // Don't send authentication errors (these are expected)
        if (
          error.message?.includes('Authentication') ||
          error.message?.includes('Unauthorized')
        ) {
          return null;
        }
      }

      return event;
    },

    // Set user context for better error tracking
    initialScope: {
      tags: {
        component: 'jrm-ecommerce',
        region: 'malaysia',
      },
    },

    // Integration configuration - simplified for Next.js
    integrations: [],

    // Release information
    release: process.env.npm_package_version || '1.0.0',
  });
}

/**
 * Capture exception with additional context
 */
export function captureException(
  error: Error,
  context?: {
    userId?: string;
    userRole?: string;
    action?: string;
    resource?: string;
    additionalData?: Record<string, unknown>;
  }
) {
  Sentry.withScope(scope => {
    // Set user context
    if (context?.userId) {
      scope.setUser({
        id: context.userId,
        role: context.userRole,
      });
    }

    // Set tags for better filtering
    if (context?.action) {
      scope.setTag('action', context.action);
    }

    if (context?.resource) {
      scope.setTag('resource', context.resource);
    }

    // Add additional context
    if (context?.additionalData) {
      scope.setContext('additional', context.additionalData);
    }

    // Capture the exception
    Sentry.captureException(error);
  });
}

/**
 * Capture message with context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    userId?: string;
    userRole?: string;
    action?: string;
    resource?: string;
    additionalData?: Record<string, unknown>;
  }
) {
  Sentry.withScope(scope => {
    // Set user context
    if (context?.userId) {
      scope.setUser({
        id: context.userId,
        role: context.userRole,
      });
    }

    // Set tags
    if (context?.action) {
      scope.setTag('action', context.action);
    }

    if (context?.resource) {
      scope.setTag('resource', context.resource);
    }

    // Add additional context
    if (context?.additionalData) {
      scope.setContext('additional', context.additionalData);
    }

    scope.setLevel(level);

    // Capture the message
    Sentry.captureMessage(message);
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  operation: string,
  data?: Record<string, unknown>
) {
  // Simplified transaction tracking
  console.log(`Starting transaction: ${name} (${operation})`, data);

  return {
    transaction: null,
    finish: () => console.log(`Finished transaction: ${name}`),
    setStatus: (status: string) => console.log(`Transaction status: ${status}`),
    setData: (key: string, value: unknown) =>
      console.log(`Transaction data: ${key}`, value),
  };
}

/**
 * Add breadcrumb for better error context
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data: data || {},
    timestamp: Date.now(),
  });
}

/**
 * Set user context for current session
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  role?: string;
  isMember?: boolean;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email || '',
    role: user.role || '',
    isMember: user.isMember || false,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

// Export Sentry for direct usage if needed
export { Sentry };
