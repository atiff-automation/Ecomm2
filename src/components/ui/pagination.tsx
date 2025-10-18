/**
 * Pagination Component
 * Reusable pagination component for lists
 * Following CLAUDE.md principles: Reusable, systematic implementation
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  maxVisiblePages = 7,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const showLeftEllipsis = visiblePages[0] > 2;
  const showRightEllipsis =
    visiblePages[visiblePages.length - 1] < totalPages - 1;

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={cn('flex items-center justify-center space-x-1', className)}
    >
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="sr-only sm:not-sr-only sm:ml-2">Sebelum</span>
      </Button>

      {showPageNumbers && (
        <>
          {/* First Page */}
          {visiblePages[0] > 1 && (
            <>
              <Button
                variant={currentPage === 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(1)}
                aria-label="Go to page 1"
              >
                1
              </Button>
              {showLeftEllipsis && (
                <div className="flex items-center justify-center w-8 h-8">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </>
          )}

          {/* Visible Page Numbers */}
          {visiblePages.map(page => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </Button>
          ))}

          {/* Last Page */}
          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {showRightEllipsis && (
                <div className="flex items-center justify-center w-8 h-8">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <Button
                variant={currentPage === totalPages ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(totalPages)}
                aria-label={`Go to page ${totalPages}`}
              >
                {totalPages}
              </Button>
            </>
          )}
        </>
      )}

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Go to next page"
      >
        <span className="sr-only sm:not-sr-only sm:mr-2">Seterusnya</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </nav>
  );
}
