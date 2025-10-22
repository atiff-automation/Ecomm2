/**
 * Global Error Boundary - Malaysian E-commerce Platform
 * Comprehensive error handling with monitoring and recovery
 */

'use client';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug, Copy } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: (
    error: Error,
    errorInfo: ErrorInfo,
    resetError: () => void
  ) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;

    // Update state with error info
    this.setState({ errorInfo });

    // Log error details
    this.logError(error, errorInfo);

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }

    // Send to monitoring service
    this.reportToMonitoring(error, errorInfo);
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    const errorDetails = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      retryCount: this.state.retryCount,
    };

    console.group(`🚨 Error Boundary Caught Error (${this.state.errorId})`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Full Details:', errorDetails);
    console.groupEnd();
  }

  private async reportToMonitoring(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'SSR',
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
        retryCount: this.state.retryCount,
        environment: process.env.NODE_ENV,
        buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'unknown',
        severity: this.categorizeErrorSeverity(error),
        breadcrumbs: this.getBreadcrumbs(),
        user: this.getUserContext(),
      };

      // Send to monitoring service (e.g., Sentry, LogRocket)
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: true,
          custom_map: {
            errorId: this.state.errorId,
            componentStack: errorInfo.componentStack,
          },
        });
      }

      // Send to custom error endpoint
      fetchWithCSRF('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      }).catch(reportError => {
        console.error('Failed to report error to monitoring:', reportError);
      });
    } catch (reportError) {
      console.error('Error reporting failed:', reportError);
    }
  }

  private categorizeErrorSeverity(
    error: Error
  ): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Critical errors
    if (
      message.includes('chunkloaderror') ||
      message.includes('loading chunk') ||
      stack.includes('payment') ||
      stack.includes('checkout')
    ) {
      return 'critical';
    }

    // High severity
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      stack.includes('auth')
    ) {
      return 'high';
    }

    // Medium severity
    if (
      message.includes('validation') ||
      message.includes('form') ||
      stack.includes('form')
    ) {
      return 'medium';
    }

    return 'low';
  }

  private getBreadcrumbs(): string[] {
    if (typeof window === 'undefined') {
      return [];
    }

    // Simple breadcrumb from URL path
    const path = window.location.pathname;
    return path.split('/').filter(Boolean);
  }

  private getUserContext() {
    if (typeof window === 'undefined') {
      return null;
    }

    // Get user context from session storage or local storage
    try {
      const userStr =
        sessionStorage.getItem('user') || localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          id: user.id,
          role: user.role,
          isMember: user.isMember,
        };
      }
    } catch {
      // Ignore JSON parse errors
    }

    return null;
  }

  private resetError = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  private copyErrorDetails = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      timestamp: new Date().toISOString(),
    };

    navigator.clipboard
      .writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        // Could show a toast notification here
        console.log('Error details copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy error details:', err);
      });
  };

  render() {
    const { hasError, error, errorInfo, errorId, retryCount } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo!, this.resetError);
      }

      // Check if we've exceeded max retries
      const canRetry = retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-red-600">
                Oops! Something went wrong
              </CardTitle>
              <p className="text-gray-600 mt-2">
                We encountered an unexpected error. Don't worry, our team has
                been notified.
              </p>
              {errorId && (
                <p className="text-sm text-gray-500 mt-2">
                  Error ID:{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    {errorId}
                  </code>
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {canRetry && (
                  <Button onClick={this.resetError} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again{' '}
                    {retryCount > 0 && `(${retryCount}/${this.maxRetries})`}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => (window.location.href = '/')}
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </Button>
              </div>

              {/* Developer Information (development or when SHOW_ERROR_DETAILS is enabled) */}
              {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SHOW_ERROR_DETAILS === 'true') && error && (
                <details className="mt-6">
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                    <Bug className="inline h-4 w-4 mr-2" />
                    Developer Information
                  </summary>
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-red-800">
                        Error Details
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={this.copyErrorDetails}
                        className="gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <strong className="text-red-800">Message:</strong>
                        <pre className="mt-1 bg-white p-2 rounded text-red-600 overflow-x-auto">
                          {error.message}
                        </pre>
                      </div>

                      {error.stack && (
                        <div>
                          <strong className="text-red-800">Stack Trace:</strong>
                          <pre className="mt-1 bg-white p-2 rounded text-gray-600 text-xs overflow-x-auto">
                            {error.stack}
                          </pre>
                        </div>
                      )}

                      {errorInfo?.componentStack && (
                        <div>
                          <strong className="text-red-800">
                            Component Stack:
                          </strong>
                          <pre className="mt-1 bg-white p-2 rounded text-gray-600 text-xs overflow-x-auto">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              )}

              {/* User Help */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border">
                <h4 className="font-medium text-blue-800 mb-2">
                  What can you do?
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Try refreshing the page or clicking "Try Again"</li>
                  <li>• Check your internet connection</li>
                  <li>• Clear your browser cache and cookies</li>
                  <li>• Contact support if the problem persists</li>
                </ul>
              </div>

              {!canRetry && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border">
                  <p className="text-yellow-800 text-sm">
                    <strong>Multiple attempts failed.</strong> Please refresh
                    the page or contact support if the issue continues.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <GlobalErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </GlobalErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for programmatic error reporting
 */
export function useErrorReporter() {
  const reportError = (error: Error, context?: Record<string, any>) => {
    console.error('Manual error report:', error, context);

    // Create synthetic error info
    const errorInfo: ErrorInfo = {
      componentStack: context?.componentStack || 'Unknown component stack',
    };

    // Create temporary error boundary instance to use its reporting logic
    const boundary = new GlobalErrorBoundary({});
    boundary['reportToMonitoring'](error, errorInfo);
  };

  return { reportError };
}
