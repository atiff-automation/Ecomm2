'use client';

import { MessageCircle } from 'lucide-react';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';

export default function ChatSessionsPage() {
  // Tab configuration for chat navigation - consistent across all chat pages
  const chatTabs: TabConfig[] = [
    {
      id: 'sessions',
      label: 'Sessions',
      href: '/admin/chat',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/admin/chat/analytics',
    },
    {
      id: 'configuration',
      label: 'Configuration',
      href: '/admin/chat/config',
    },
    {
      id: 'operations',
      label: 'Operations',
      href: '/admin/chat/operations',
    },
    {
      id: 'archive',
      label: 'Archive',
      href: '/admin/chat/archive',
    },
  ];

  return (
    <AdminPageLayout
      title="Chat Management"
      subtitle="Monitor and manage customer chat interactions"
      tabs={chatTabs}
      loading={false}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-gray-600">
            Detailed view of all chat sessions with advanced filtering and management options
          </p>
        </div>

        {/* Coming Soon */}
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="text-center">
            <MessageCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Advanced Sessions Management
            </h3>
            <p className="text-gray-500 mb-4">
              Detailed session management, filtering, and bulk operations coming soon.
            </p>
            <p className="text-sm text-gray-400">
              Use the Sessions tab (main page) to view and manage current sessions.
            </p>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}