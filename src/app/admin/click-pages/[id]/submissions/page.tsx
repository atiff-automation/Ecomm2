/**
 * Admin Click Page Form Submissions Page
 * View and manage form submissions for a specific click page
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { SubmissionsTable } from './SubmissionsTable';
import { SubmissionsHeader } from './SubmissionsHeader';

export const metadata: Metadata = {
  title: 'Form Submissions | Admin',
  description: 'View and manage form submissions from click pages',
};

interface PageProps {
  params: { id: string };
  searchParams: {
    page?: string;
    pageSize?: string;
    blockId?: string;
    startDate?: string;
    endDate?: string;
  };
}

export default function FormSubmissionsPage({ params, searchParams }: PageProps) {
  return (
    <div className="container mx-auto py-6 px-4">
      <SubmissionsHeader clickPageId={params.id} />
      <Suspense fallback={<div className="animate-pulse bg-gray-100 h-96 rounded-lg mt-6" />}>
        <SubmissionsTable clickPageId={params.id} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
