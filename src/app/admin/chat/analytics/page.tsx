'use client';

import { BarChart3 } from 'lucide-react';

export default function ChatAnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-gray-600">
          Advanced analytics, reports, and insights into chat performance and user engagement
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center">
          <BarChart3 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Advanced Analytics Dashboard
          </h3>
          <p className="text-gray-500 mb-4">
            Detailed analytics, performance metrics, and engagement reports coming soon.
          </p>
          <p className="text-sm text-gray-400">
            Basic metrics are available in the Overview tab.
          </p>
        </div>
      </div>
    </div>
  );
}