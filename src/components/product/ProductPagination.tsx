/**
 * Product Pagination Component - JRM E-commerce Platform
 * Advanced pagination system with design system integration
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { designSystem } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Package,
  Users,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
  startItem: number;
  endItem: number;
}

export interface ProductPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  variant?: 'default' | 'compact' | 'detailed' | 'simple' | 'numbered';
  showPageSize?: boolean;
  showJumpToPage?: boolean;
  showTotalItems?: boolean;
  showItemRange?: boolean;
  showFirstLast?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  maxVisiblePages?: number;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

// Page size options for e-commerce
const defaultPageSizeOptions = [12, 24, 48, 96];

// Generate page range for pagination
function generatePageRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const halfVisible = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - halfVisible);
  let end = Math.min(totalPages, currentPage + halfVisible);

  // Adjust if we're near the beginning or end
  if (end - start + 1 < maxVisible) {
    if (start === 1) {
      end = Math.min(totalPages, start + maxVisible - 1);
    } else {
      start = Math.max(1, end - maxVisible + 1);
    }
  }

  const pages: (number | 'ellipsis')[] = [];

  // Always show first page
  if (start > 1) {
    pages.push(1);
    if (start > 2) {
      pages.push('ellipsis');
    }
  }

  // Add visible pages
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Always show last page
  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push('ellipsis');
    }
    pages.push(totalPages);
  }

  return pages;
}

// Page size selector component
function PageSizeSelector({
  pageSize,
  options,
  onPageSizeChange,
  loading,
  disabled,
}: {
  pageSize: number;
  options: number[];
  onPageSizeChange: (size: number) => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label
        htmlFor="page-size"
        className="text-sm text-muted-foreground whitespace-nowrap"
      >
        Show:
      </Label>
      <Select
        value={pageSize.toString()}
        onValueChange={value => onPageSizeChange(parseInt(value))}
        disabled={loading || disabled}
      >
        <SelectTrigger id="page-size" className="w-20 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(size => (
            <SelectItem key={size} value={size.toString()}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-sm text-muted-foreground">per page</span>
    </div>
  );
}

// Jump to page component
function JumpToPage({
  currentPage,
  totalPages,
  onPageChange,
  loading,
  disabled,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const page = parseInt(inputValue);
      if (page && page >= 1 && page <= totalPages) {
        onPageChange(page);
        setInputValue('');
      }
    },
    [inputValue, totalPages, onPageChange]
  );

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Label
        htmlFor="jump-page"
        className="text-sm text-muted-foreground whitespace-nowrap"
      >
        Go to:
      </Label>
      <Input
        id="jump-page"
        type="number"
        min={1}
        max={totalPages}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        placeholder={currentPage.toString()}
        className="w-16 h-8 text-sm"
        disabled={loading || disabled}
      />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={!inputValue || loading || disabled}
        className="h-8 px-2"
      >
        <ArrowRight className="h-3 w-3" />
        <span className="sr-only">Go to page</span>
      </Button>
    </form>
  );
}

// Pagination info display
function PaginationInfo({
  pagination,
  showTotalItems,
  showItemRange,
  loading,
}: {
  pagination: PaginationInfo;
  showTotalItems?: boolean;
  showItemRange?: boolean;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      {showItemRange && (
        <div className="flex items-center gap-1">
          <Package className="h-4 w-4" />
          <span>
            {pagination.startItem.toLocaleString()}-
            {pagination.endItem.toLocaleString()}
          </span>
        </div>
      )}
      {showTotalItems && (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{pagination.totalItems.toLocaleString()} total</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4" />
        <span>
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
      </div>
    </div>
  );
}

export function ProductPagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  variant = 'default',
  showPageSize = true,
  showJumpToPage = false,
  showTotalItems = true,
  showItemRange = true,
  showFirstLast = true,
  pageSize = 24,
  pageSizeOptions = defaultPageSizeOptions,
  maxVisiblePages = 7,
  loading = false,
  disabled = false,
  className,
}: ProductPaginationProps) {
  const pages = useMemo(
    () =>
      generatePageRange(
        pagination.currentPage,
        pagination.totalPages,
        maxVisiblePages
      ),
    [pagination.currentPage, pagination.totalPages, maxVisiblePages]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= pagination.totalPages && !loading && !disabled) {
        onPageChange(page);
      }
    },
    [pagination.totalPages, onPageChange, loading, disabled]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      if (onPageSizeChange && !loading && !disabled) {
        onPageSizeChange(newPageSize);
      }
    },
    [onPageSizeChange, loading, disabled]
  );

  if (pagination.totalPages <= 1 && variant !== 'detailed') {
    return null;
  }

  // Simple variant - just prev/next
  if (variant === 'simple') {
    return (
      <div className={cn('flex items-center justify-between', className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPrevious || loading || disabled}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <span className="text-sm text-muted-foreground">
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNext || loading || disabled}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }

  // Compact variant - minimal controls
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center justify-center gap-2', className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPrevious || loading || disabled}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {pages.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="w-8 h-8 flex items-center justify-center"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
              );
            }

            const isActive = page === pagination.currentPage;
            return (
              <Button
                key={page}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(page)}
                disabled={loading || disabled}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNext || loading || disabled}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Numbered variant - only page numbers
  if (variant === 'numbered') {
    return (
      <div className={cn('flex items-center justify-center gap-1', className)}>
        {pages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <div
                key={`ellipsis-${index}`}
                className="w-10 h-10 flex items-center justify-center"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            );
          }

          const isActive = page === pagination.currentPage;
          return (
            <Button
              key={page}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePageChange(page)}
              disabled={loading || disabled}
              className={cn(
                'w-10 h-10 p-0 font-medium',
                isActive && 'bg-primary text-primary-foreground shadow-sm'
              )}
            >
              {page}
            </Button>
          );
        })}
      </div>
    );
  }

  // Detailed variant - all features
  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Info bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PaginationInfo
            pagination={pagination}
            showTotalItems={showTotalItems}
            showItemRange={showItemRange}
            loading={loading}
          />

          <div className="flex items-center gap-4">
            {showPageSize && onPageSizeChange && (
              <PageSizeSelector
                pageSize={pageSize}
                options={pageSizeOptions}
                onPageSizeChange={handlePageSizeChange}
                loading={loading}
                disabled={disabled}
              />
            )}

            {showJumpToPage && (
              <JumpToPage
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                loading={loading}
                disabled={disabled}
              />
            )}
          </div>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-center gap-1">
          {showFirstLast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={pagination.currentPage === 1 || loading || disabled}
              className="hidden sm:flex"
            >
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">First page</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevious || loading || disabled}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>

          {pages.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="w-10 h-10 flex items-center justify-center"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
              );
            }

            const isActive = page === pagination.currentPage;
            return (
              <Button
                key={page}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(page)}
                disabled={loading || disabled}
                className={cn(
                  'w-10 h-10 p-0 font-medium',
                  isActive && 'shadow-sm',
                  'hidden sm:flex'
                )}
              >
                {page}
              </Button>
            );
          })}

          {/* Mobile: current page indicator */}
          <div className="sm:hidden flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
            <span className="text-sm font-medium">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNext || loading || disabled}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>

          {showFirstLast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={
                pagination.currentPage === pagination.totalPages ||
                loading ||
                disabled
              }
              className="hidden sm:flex"
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Last page</span>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default variant - standard pagination
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <PaginationInfo
          pagination={pagination}
          showTotalItems={showTotalItems}
          showItemRange={showItemRange}
          loading={loading}
        />

        {showPageSize && onPageSizeChange && (
          <PageSizeSelector
            pageSize={pageSize}
            options={pageSizeOptions}
            onPageSizeChange={handlePageSizeChange}
            loading={loading}
            disabled={disabled}
          />
        )}
      </div>

      <div className="flex items-center gap-1">
        {showFirstLast && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={pagination.currentPage === 1 || loading || disabled}
            className="hidden sm:flex"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPrevious || loading || disabled}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>

        <div className="hidden sm:flex items-center gap-1">
          {pages.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="w-10 h-10 flex items-center justify-center"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
              );
            }

            const isActive = page === pagination.currentPage;
            return (
              <Button
                key={page}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(page)}
                disabled={loading || disabled}
                className="w-10 h-10 p-0 font-medium"
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Mobile: current page display */}
        <div className="sm:hidden flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
          <span className="text-sm font-medium">
            {pagination.currentPage} / {pagination.totalPages}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNext || loading || disabled}
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {showFirstLast && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={
              pagination.currentPage === pagination.totalPages ||
              loading ||
              disabled
            }
            className="hidden sm:flex"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showJumpToPage && (
        <JumpToPage
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          loading={loading}
          disabled={disabled}
        />
      )}
    </div>
  );
}

// Specialized pagination components
export const SimplePagination = ({
  className,
  ...props
}: Omit<ProductPaginationProps, 'variant'>) => (
  <ProductPagination
    variant="simple"
    showPageSize={false}
    showJumpToPage={false}
    showTotalItems={false}
    showItemRange={false}
    className={className}
    {...props}
  />
);

export const CompactPagination = ({
  className,
  ...props
}: Omit<ProductPaginationProps, 'variant'>) => (
  <ProductPagination
    variant="compact"
    showPageSize={false}
    showJumpToPage={false}
    maxVisiblePages={5}
    className={className}
    {...props}
  />
);

export const MobilePagination = ({
  className,
  ...props
}: Omit<ProductPaginationProps, 'variant'>) => (
  <ProductPagination
    variant="simple"
    showPageSize={false}
    showJumpToPage={false}
    showTotalItems={false}
    showItemRange={true}
    className={className}
    {...props}
  />
);

export const AdvancedPagination = ({
  className,
  ...props
}: Omit<ProductPaginationProps, 'variant'>) => (
  <ProductPagination
    variant="detailed"
    showPageSize={true}
    showJumpToPage={true}
    showTotalItems={true}
    showItemRange={true}
    showFirstLast={true}
    className={className}
    {...props}
  />
);

export default ProductPagination;
