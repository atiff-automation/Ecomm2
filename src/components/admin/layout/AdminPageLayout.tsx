'use client';

import { ReactNode } from 'react';
import { ResponsiveSidebar } from './ResponsiveSidebar';
import { MobileNavigation } from './MobileNavigation';
import { PageHeader } from './PageHeader';
import { ContextualTabs } from './ContextualTabs';

export interface TabConfig {
  id: string;
  label: string;
  href: string;
  badge?: number;
}

interface AdminPageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  tabs?: TabConfig[];
  filters?: ReactNode;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  error?: Error | string;
  showBackButton?: boolean;
}

export function AdminPageLayout({
  title,
  subtitle,
  actions,
  tabs,
  filters,
  children,
  className = '',
  loading = false,
  error,
  showBackButton = false,
}: AdminPageLayoutProps) {
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          <ResponsiveSidebar />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0 md:pb-16">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-red-500 text-lg font-medium mb-2">Error</div>
                <div className="text-gray-600">
                  {typeof error === 'string' ? error : error.message}
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
          <MobileNavigation />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <ResponsiveSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0 md:pb-16">
          {/* Page Header - 64px height */}
          <PageHeader
            title={title}
            subtitle={subtitle}
            actions={actions}
            showBackButton={showBackButton}
            loading={loading}
          />

          {/* Contextual Tabs - 48px height when present */}
          {tabs && tabs.length > 0 && (
            <ContextualTabs tabs={tabs} />
          )}

          {/* Filters/Search Bar - 52px height when present */}
          {filters && (
            <div className="bg-white border-b border-gray-200 px-6 py-3">
              <div className="h-7 flex items-center">
                {filters}
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className={`flex-1 overflow-auto ${className}`}>
            {loading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 pb-20 md:pb-6">
                {children}
              </div>
            )}
          </main>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
}