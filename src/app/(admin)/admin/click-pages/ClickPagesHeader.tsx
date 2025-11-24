'use client';

/**
 * Click Pages Header Component
 * Title and create button
 */

import Link from 'next/link';
import { Plus, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ClickPagesHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <MousePointerClick className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Click Pages</h1>
          <p className="text-gray-500 text-sm">
            Create and manage promotional landing pages
          </p>
        </div>
      </div>
      <Link href="/admin/click-pages/create">
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Click Page
        </Button>
      </Link>
    </div>
  );
}
