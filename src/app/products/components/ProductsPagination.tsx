/**
 * Products Pagination Component
 * Optimized pagination with accessibility and responsive design
 */

'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function ProductsPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: ProductsPaginationProps) {
  // Generate page numbers to show
  const generatePageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const pages: (number | 'ellipsis')[] = [];
    
    // Always show first page
    pages.push(1);
    
    // Calculate start and end of middle range
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);
    
    // Add ellipsis after first page if needed
    if (start > 2) {
      pages.push('ellipsis');
    }
    
    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (end < totalPages - 1) {
      pages.push('ellipsis');
    }
    
    // Always show last page (if more than 1 page)
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pages = generatePageNumbers();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn("flex justify-center items-center gap-2", className)}>
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      {/* Page numbers */}
      <div className="flex gap-1">
        {pages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <div
                key={`ellipsis-${index}`}
                className="flex items-center justify-center w-9 h-9"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            );
          }

          return (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              className={cn(
                "w-9 h-9",
                currentPage === page && "bg-primary text-primary-foreground"
              )}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </Button>
          );
        })}
      </div>

      {/* Next button */}
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="gap-1"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Page info for screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}

/**
 * Simple pagination for mobile/compact views
 */
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: ProductsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn("flex justify-between items-center gap-4", className)}>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Page</span>
        <span className="font-medium">{currentPage}</span>
        <span>of</span>
        <span className="font-medium">{totalPages}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="gap-1"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}