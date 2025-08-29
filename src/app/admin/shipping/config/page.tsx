/**
 * Shipping Configuration Page - Redirects to Unified Admin Page
 * This page has been deprecated in favor of the unified shipping management interface
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShippingConfigRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the unified shipping management page
    router.replace('/admin/shipping');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">
          Redirecting to unified shipping management...
        </p>
      </div>
    </div>
  );
}
