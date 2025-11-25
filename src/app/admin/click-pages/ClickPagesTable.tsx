'use client';

/**
 * Click Pages Table Component
 * Displays list of click pages with actions
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  MoreHorizontal,
  BarChart3,
  Copy,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { ClickPage } from '@prisma/client';

interface ClickPageWithStats extends ClickPage {
  _count?: {
    clicks: number;
    conversions: number;
  };
}

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
};

export function ClickPagesTable() {
  const router = useRouter();
  const [clickPages, setClickPages] = useState<ClickPageWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchClickPages();
  }, []);

  const fetchClickPages = async () => {
    try {
      const response = await fetch('/api/admin/click-pages');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setClickPages(data.clickPages || []);
    } catch (error) {
      console.error('Error fetching click pages:', error);
      toast.error('Failed to load click pages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this click page?')) return;

    setIsDeleting(id);
    try {
      const response = await fetch(`/api/admin/click-pages/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Click page deleted successfully');
      setClickPages((prev) => prev.filter((page) => page.id !== id));
    } catch (error) {
      console.error('Error deleting click page:', error);
      toast.error('Failed to delete click page');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const page = clickPages.find((p) => p.id === id);
      if (!page) return;

      const response = await fetch('/api/admin/click-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${page.title} (Copy)`,
          slug: `${page.slug}-copy-${Date.now()}`,
          blocks: page.blocks,
          status: 'DRAFT',
        }),
      });

      if (!response.ok) throw new Error('Failed to duplicate');

      toast.success('Click page duplicated successfully');
      fetchClickPages();
    } catch (error) {
      console.error('Error duplicating click page:', error);
      toast.error('Failed to duplicate click page');
    }
  };

  const copyPublicUrl = (slug: string) => {
    const url = `${window.location.origin}/click/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (clickPages.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-12 text-center">
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <MousePointerClick className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No click pages yet
        </h3>
        <p className="text-gray-500 mb-4">
          Create your first promotional click page to get started.
        </p>
        <Link href="/admin/click-pages/create">
          <Button>Create Click Page</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Views</TableHead>
            <TableHead className="text-center">Clicks</TableHead>
            <TableHead className="text-center">Conversions</TableHead>
            <TableHead className="text-center">Rate</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clickPages.map((page) => (
            <TableRow key={page.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{page.title}</div>
                  <div className="text-sm text-gray-500">/click/{page.slug}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={STATUS_COLORS[page.status]}>
                  {page.status}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                {page.viewCount.toLocaleString()}
              </TableCell>
              <TableCell className="text-center">
                {page.clickCount.toLocaleString()}
              </TableCell>
              <TableCell className="text-center">
                {page.conversionCount.toLocaleString()}
              </TableCell>
              <TableCell className="text-center">
                {Number(page.conversionRate).toFixed(1)}%
              </TableCell>
              <TableCell>
                {new Date(page.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {page.status === 'PUBLISHED' && (
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(`/click/${page.slug}`, '_blank')
                        }
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Live
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/admin/click-pages/${page.id}/edit`)
                      }
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/admin/click-pages/${page.id}/submissions`)
                      }
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Submissions
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyPublicUrl(page.slug)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy URL
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(page.id)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(page.id)}
                      disabled={isDeleting === page.id}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MousePointerClick(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 9 5 12 1.8-5.2L21 14Z" />
      <path d="M7.2 2.2 8 5.1" />
      <path d="m5.1 8-2.9-.8" />
      <path d="M14 4.1 12 6" />
      <path d="m6 12-1.9 2" />
    </svg>
  );
}
