'use client';

import React from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug } from 'lucide-react';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error boundary types for different contexts
export type ErrorBoundaryType = 'page' | 'section' | 'component';

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: ErrorBoundaryType;
  resetOnPropsChange?: boolean;
  maxRetries?: number;
  showErrorDetails?: boolean;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const enhancedErrorInfo: ErrorInfo = {
      componentStack: errorInfo.componentStack,
      errorBoundary: errorInfo.errorBoundary,
      errorBoundaryStack: errorInfo.errorBoundaryStack,
    };

    this.setState({ errorInfo: enhancedErrorInfo });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log error with enhanced context
    this.logError(error, enhancedErrorInfo);

    // Auto-retry for low-severity errors
    if (
      this.getErrorSeverity(error) === 'low' &&
      this.state.retryCount < (this.props.maxRetries || 3)
    ) {
      this.scheduleRetry();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error boundary when specific props change
    if (this.props.resetOnPropsChange && this.state.hasError) {
      if (this.props.children !== prevProps.children) {
        this.setState({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
        });
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const severity = this.getErrorSeverity(error);
    const context = {
      level: this.props.level || 'component',
      severity,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    console.error('Error boundary caught an error:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      context,
    });

    // In production, send to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry or other monitoring service
      this.reportToMonitoring(error, errorInfo, context);
    }
  };

  private reportToMonitoring = (
    error: Error,
    errorInfo: ErrorInfo,
    context: any
  ) => {
    // Placeholder for error monitoring integration
    // This would integrate with services like Sentry, LogRocket, etc.
    try {
      // Example: Sentry.captureException(error, { extra: { errorInfo, context } });
    } catch (reportingError) {
      console.error(
        'Failed to report error to monitoring service:',
        reportingError
      );
    }
  };

  private getErrorSeverity = (error: Error): ErrorSeverity => {
    // Determine error severity based on error type and message
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Critical errors
    if (
      errorName.includes('chunkerror') ||
      errorMessage.includes('loading css chunk') ||
      errorMessage.includes('loading chunk')
    ) {
      return 'critical';
    }

    // High severity
    if (
      errorName.includes('typeerror') ||
      errorMessage.includes('cannot read prop') ||
      errorMessage.includes('undefined is not a function')
    ) {
      return 'high';
    }

    // Medium severity
    if (
      errorName.includes('referenceerror') ||
      errorMessage.includes('is not defined')
    ) {
      return 'medium';
    }

    // Default to low severity
    return 'low';
  };

  private scheduleRetry = () => {
    const retryDelay = Math.min(
      1000 * Math.pow(2, this.state.retryCount),
      10000
    ); // Exponential backoff

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1,
      }));
    }, retryDelay);
  };

  retry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
    }));
  };

  reset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      const severity = this.state.error
        ? this.getErrorSeverity(this.state.error)
        : 'medium';
      const errorProps: ErrorFallbackProps = {
        error: this.state.error,
        errorInfo: this.state.errorInfo,
        retry: this.retry,
        reset: this.reset,
        level: this.props.level,
        severity,
        retryCount: this.state.retryCount,
        maxRetries: this.props.maxRetries || 3,
      };

      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent {...errorProps} />;
      }

      return <DefaultErrorFallback {...errorProps} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  retry: () => void;
  reset: () => void;
  level?: ErrorBoundaryType;
  severity?: ErrorSeverity;
  retryCount?: number;
  maxRetries?: number;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  retry,
  reset,
  level = 'component',
  severity = 'medium',
  retryCount = 0,
  maxRetries = 3,
}: ErrorFallbackProps) {
  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Bug className="w-5 h-5" />;
    }
  };

  const shouldShowDetails =
    process.env.NODE_ENV === 'development' || severity === 'critical';
  return (
    <div
      className={`${level === 'page' ? 'min-h-[60vh]' : level === 'section' ? 'min-h-[300px]' : 'min-h-[200px]'} flex items-center justify-center p-4`}
    >
      <Card
        className={`w-full ${level === 'page' ? 'max-w-2xl' : 'max-w-md'} border-l-4 ${getSeverityColor(severity).split(' ')[2]}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              {getIcon(severity)}
              <div>
                <CardTitle className="text-lg">
                  {level === 'page'
                    ? 'Page Error'
                    : level === 'section'
                      ? 'Section Error'
                      : 'Component Error'}
                </CardTitle>
                <Badge className={`mt-1 ${getSeverityColor(severity)}`}>
                  {severity.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              {severity === 'critical'
                ? 'A critical error occurred. Please refresh the page or contact support if the problem persists.'
                : severity === 'high'
                  ? 'An error occurred while loading this content. Please try again.'
                  : 'Something went wrong. This usually resolves itself with a retry.'}
            </p>

            {retryCount > 0 && (
              <p className="text-xs text-orange-600 mb-2">
                Retry attempt {retryCount} of {maxRetries}
              </p>
            )}

            {shouldShowDetails && error && (
              <details className="mt-4 p-3 bg-gray-50 rounded border text-xs">
                <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
                  Technical Details{' '}
                  {process.env.NODE_ENV === 'development'
                    ? '(Development)'
                    : ''}
                </summary>
                <div className="mt-3 space-y-2">
                  <div>
                    <strong>Error:</strong> {error.name}: {error.message}
                  </div>
                  {error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {retryCount < maxRetries && (
              <Button
                onClick={retry}
                variant="default"
                size="sm"
                className="flex items-center space-x-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </Button>
            )}

            <Button
              onClick={reset}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Reset</span>
            </Button>

            {level === 'page' && (
              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </Button>
            )}

            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
              size="sm"
            >
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Specialized error boundaries for different contexts
export function PageErrorBoundary({
  children,
  ...props
}: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="page" maxRetries={2} {...props}>
      {children}
    </ErrorBoundary>
  );
}

export function SectionErrorBoundary({
  children,
  ...props
}: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="section" maxRetries={3} {...props}>
      {children}
    </ErrorBoundary>
  );
}

export function ComponentErrorBoundary({
  children,
  ...props
}: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary
      level="component"
      maxRetries={5}
      resetOnPropsChange
      {...props}
    >
      {children}
    </ErrorBoundary>
  );
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallback?: React.ComponentType<ErrorFallbackProps>;
    level?: ErrorBoundaryType;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    maxRetries?: number;
  } = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary
        level={options.level || 'component'}
        fallback={options.fallback}
        onError={options.onError}
        maxRetries={options.maxRetries}
        resetOnPropsChange
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// React hook for error reporting
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: string) => {
    // Manual error reporting
    console.error('Manual error report:', { error, errorInfo });

    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to monitoring service
    }
  }, []);
}

// Global error handler for unhandled promises and errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    // TODO: Send to monitoring service
  });

  window.addEventListener('error', event => {
    console.error('Global error:', event.error);
    // TODO: Send to monitoring service
  });
}
