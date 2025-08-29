/**
 * Products Error Boundary - Next.js 14 App Router
 * Handles errors in the products page with recovery options
 */

'use client';

import { ProductsErrorBoundary } from './components/ProductsError';

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    console.error('Products page error:', error);
    // Here you would send to your error monitoring service
    // e.g., Sentry, LogRocket, etc.
  }

  return <ProductsErrorBoundary error={error} reset={reset} />;
}
