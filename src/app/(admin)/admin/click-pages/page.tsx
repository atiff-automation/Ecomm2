/**
 * Admin Click Pages List Page
 * Lists all click pages with filtering and actions
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { ClickPagesTable } from './ClickPagesTable';
import { ClickPagesHeader } from './ClickPagesHeader';

export const metadata: Metadata = {
  title: 'Click Pages | Admin',
  description: 'Manage click pages for promotions and campaigns',
};

export default function ClickPagesPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <ClickPagesHeader />
      <Suspense fallback={<div className="animate-pulse bg-gray-100 h-96 rounded-lg" />}>
        <ClickPagesTable />
      </Suspense>
    </div>
  );
}
