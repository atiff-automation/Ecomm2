'use client';

/**
 * Submissions Table Component
 * Displays form submissions with pagination, filtering, and actions
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Trash2, Eye, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { generateSubmissionPreview } from '@/lib/utils/submission-preview';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

interface FormSubmission {
  id: string;
  blockId: string;
  data: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface PaginationData {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface SubmissionsTableProps {
  clickPageId: string;
  searchParams: {
    page?: string;
    pageSize?: string;
    blockId?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function SubmissionsTable({ clickPageId, searchParams }: SubmissionsTableProps) {
  const router = useRouter();
  const params = useSearchParams();

  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch submissions
  useEffect(() => {
    fetchSubmissions();
  }, [clickPageId, searchParams]);

  async function fetchSubmissions() {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: searchParams.page || '1',
        pageSize: searchParams.pageSize || '50',
        ...(searchParams.blockId && { blockId: searchParams.blockId }),
        ...(searchParams.startDate && { startDate: searchParams.startDate }),
        ...(searchParams.endDate && { endDate: searchParams.endDate }),
      });

      const response = await fetch(
        `/api/admin/click-pages/${clickPageId}/submissions?${queryParams}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(data.submissions);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!submissionToDelete) return;

    try {
      setDeleting(true);
      const response = await fetchWithCSRF(`/api/admin/click-pages/${clickPageId}/submissions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionIds: [submissionToDelete] }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete submission');
      }

      toast.success('Submission deleted successfully');
      setSubmissionToDelete(null);
      fetchSubmissions(); // Refresh list
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to delete submission');
    } finally {
      setDeleting(false);
    }
  }

  // Handle pagination
  function handlePageChange(newPage: number) {
    const newParams = new URLSearchParams(params?.toString() || '');
    newParams.set('page', newPage.toString());
    router.push(`?${newParams.toString()}`);
  }

  // Format submission data for display
  function formatValue(value: unknown): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border mt-6">
        <p className="text-muted-foreground">No form submissions yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">Submitted At</TableHead>
              <TableHead>Preview</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow
                key={submission.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedSubmission(submission)}
              >
                <TableCell className="font-medium">
                  {format(new Date(submission.createdAt), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900">
                      {generateSubmissionPreview(submission.data)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {Object.keys(submission.data).length}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSubmissionToDelete(submission.id);
                      }}
                      aria-label="Delete submission"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} submissions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm px-4">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Submitted on {selectedSubmission && format(new Date(selectedSubmission.createdAt), 'MMMM dd, yyyy at HH:mm:ss')}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">

              {/* Submission Data */}
              <div>
                <h4 className="font-medium mb-3">Form Data:</h4>
                <div className="space-y-3">
                  {Object.entries(selectedSubmission.data).map(([key, value]) => (
                    <div key={key} className="border-l-2 border-blue-500 pl-4 py-2">
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                      </div>
                      <div className="text-sm text-gray-900">{formatValue(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!submissionToDelete} onOpenChange={() => setSubmissionToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Submission?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The submission data will be permanently deleted from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSubmissionToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
