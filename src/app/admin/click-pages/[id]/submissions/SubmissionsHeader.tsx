'use client';

/**
 * Submissions Page Header Component
 * Shows page title and back navigation
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SubmissionsHeaderProps {
  clickPageId: string;
}

interface ClickPageInfo {
  title: string;
  slug: string;
  status: string;
}

export function SubmissionsHeader({ clickPageId }: SubmissionsHeaderProps) {
  const router = useRouter();
  const [clickPage, setClickPage] = useState<ClickPageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClickPageInfo();
  }, [clickPageId]);

  async function fetchClickPageInfo() {
    try {
      const response = await fetch(`/api/admin/click-pages/${clickPageId}`);
      if (!response.ok) throw new Error('Failed to fetch click page');
      const data = await response.json();
      setClickPage({
        title: data.clickPage.title,
        slug: data.clickPage.slug,
        status: data.clickPage.status,
      });
    } catch (error) {
      console.error('Error fetching click page:', error);
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    SCHEDULED: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/click-pages')}
          aria-label="Back to click pages"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight">Form Submissions</h1>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 mt-1">
              <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : clickPage ? (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">
                From click page:{' '}
                <span className="font-medium text-gray-900">{clickPage.title}</span>
              </p>
              <span className="text-muted-foreground">•</span>
              <p className="text-sm text-muted-foreground">/click/{clickPage.slug}</p>
              <Badge className={statusColors[clickPage.status]}>
                {clickPage.status}
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              View and manage form submissions
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
