/**
 * Products Error Component
 * Error boundary and error display for products page
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ProductsErrorProps {
  message: string;
  onRetry?: () => void;
}

export function ProductsError({ message, onRetry }: ProductsErrorProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-4">{message}</p>
          {onRetry && (
            <Button onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Global error boundary for products page
 */
export function ProductsErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-xl font-bold mb-4">Oops! Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              We encountered an error while loading the products page. This has been logged and we're looking into it.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={reset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
              >
                Go Home
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto">
                  {error.message}
                  {error.stack && '\n\n' + error.stack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}