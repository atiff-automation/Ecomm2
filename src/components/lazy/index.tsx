/**
 * Lazy Loading Components - Malaysian E-commerce Platform
 * Dynamic imports for better code splitting and performance
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Admin components - Heavy components that should be loaded on demand
export const LazyAdminDashboard = dynamic(
  () => import('@/app/admin/dashboard/page'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false, // Admin components don't need SSR
  }
);

export const LazyProductManagement = dynamic(
  () => import('@/app/admin/products/page'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyOrderManagement = dynamic(
  () => import('@/app/admin/orders/page'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyCustomerManagement = dynamic(
  () => import('@/app/admin/customers/page'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyAnalytics = dynamic(() => import('@/app/admin/reports/page'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

// Shopping cart - Load on demand when user interacts
export const LazyShoppingCart = dynamic(
  () => import('@/components/cart/ShoppingCart'),
  {
    loading: () => (
      <div className="w-80 h-96 border rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }
);

// Product search and filters - Load when user starts searching
export const LazyProductFilters = dynamic(
  () => import('@/components/products/ProductFilters'),
  {
    loading: () => (
      <div className="w-64 space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    ),
  }
);

// Product comparison - Heavy feature, load on demand
export const LazyProductComparison = dynamic(
  () => import('@/components/products/ProductComparison'),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

// Wishlist - Load when user accesses wishlist
export const LazyWishlist = dynamic(
  () => import('@/components/wishlist/WishlistPage'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

// Chart components - Heavy data visualization libraries
export const LazyChart = dynamic(() => import('@/components/ui/chart'), {
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400">Loading chart...</div>
    </div>
  ),
  ssr: false,
});

export const LazyDataTable = dynamic(
  () => import('@/components/ui/data-table'),
  {
    loading: () => (
      <div className="space-y-2 animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded"></div>
        ))}
      </div>
    ),
  }
);

// Rich text editor - Heavy component for product descriptions
export const LazyRichTextEditor = dynamic(
  () => import('@/components/ui/rich-text-editor'),
  {
    loading: () => (
      <div className="border rounded-lg p-4 h-64 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-40 bg-gray-100 rounded"></div>
      </div>
    ),
    ssr: false,
  }
);

// Image gallery - Load when user views product images
export const LazyImageGallery = dynamic(
  () => import('@/components/ui/image-gallery'),
  {
    loading: () => (
      <div className="grid grid-cols-2 gap-2 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-[4/5] bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    ),
    ssr: false,
  }
);

// Video player - Load on demand
export const LazyVideoPlayer = dynamic(
  () => import('@/components/ui/video-player'),
  {
    loading: () => (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-white">Loading video...</div>
      </div>
    ),
    ssr: false,
  }
);

// PDF viewer - Load when user views documents
export const LazyPDFViewer = dynamic(
  () => import('@/components/ui/pdf-viewer'),
  {
    loading: () => (
      <div className="border rounded-lg p-8 text-center animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    ),
    ssr: false,
  }
);

// Calendar component - Load for date pickers and scheduling
export const LazyCalendar = dynamic(() => import('@/components/ui/calendar'), {
  loading: () => (
    <div className="w-80 h-80 border rounded-lg p-4 animate-pulse">
      <div className="grid grid-cols-7 gap-2">
        {[...Array(35)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded"></div>
        ))}
      </div>
    </div>
  ),
  ssr: false,
});

// Map component - Heavy mapping libraries
export const LazyMap = dynamic(() => import('@/components/ui/map'), {
  loading: () => (
    <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
  ssr: false,
});

// Notification center - Load when user accesses notifications
export const LazyNotificationCenter = dynamic(
  () => import('@/components/notifications/NotificationCenter'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

// Live chat - Load when user initiates chat
export const LazyLiveChat = dynamic(
  () => import('@/components/support/LiveChat'),
  {
    loading: () => (
      <div className="fixed bottom-4 right-4 w-80 h-96 bg-white border rounded-lg shadow-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    ),
    ssr: false,
  }
);

// Export utility function for creating lazy components
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    loading?: ComponentType;
    ssr?: boolean;
    displayName?: string;
  } = {}
): T {
  const LazyComponent = dynamic(importFn, {
    loading: options.loading || LoadingSpinner,
    ssr: options.ssr !== false,
  });

  if (options.displayName) {
    LazyComponent.displayName = options.displayName;
  }

  return LazyComponent as T;
}
