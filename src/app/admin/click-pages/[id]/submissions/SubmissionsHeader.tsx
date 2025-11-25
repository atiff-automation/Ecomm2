'use client';

/**
 * Submissions Page Header Component
 * Shows page title and back navigation
 */

import { useRouter } from 'next/navigation';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubmissionsHeaderProps {
  clickPageId: string;
}

export function SubmissionsHeader({ clickPageId }: SubmissionsHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/admin/click-pages/${clickPageId}/edit`)}
          aria-label="Back to click page"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight">Form Submissions</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            View and manage form submissions from this click page
          </p>
        </div>
      </div>
    </div>
  );
}
