'use client';

import { Archive } from 'lucide-react';

export default function ChatArchivePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-gray-600">
          View and restore archived chat sessions and historical data
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center">
          <Archive className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chat Archive Management
          </h3>
          <p className="text-gray-500 mb-4">
            Archive management, data export, and session restoration tools coming soon.
          </p>
          <p className="text-sm text-gray-400">
            Archived sessions are automatically stored and indexed.
          </p>
        </div>
      </div>
    </div>
  );
}