/**
 * Bulk Action Bar Component - JRM E-commerce Platform
 * Floating action bar for bulk operations following CLAUDE.md principles
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BULK_OPERATIONS_CONFIG } from '@/lib/config/bulk-operations';

interface BulkActionBarProps {
  selectedCount: number;
  onDelete?: () => void;
  onClearSelection?: () => void;
  loading?: boolean;
  className?: string;
  maxSelection?: number;
}

/**
 * Floating action bar that appears when items are selected
 */
export function BulkActionBar({
  selectedCount,
  onDelete,
  onClearSelection,
  loading = false,
  className,
  maxSelection = BULK_OPERATIONS_CONFIG.MAX_SELECTION_SIZE,
}: BulkActionBarProps) {
  // Don't render if no items selected
  if (selectedCount === 0) {
    return null;
  }

  const isMaxReached = selectedCount >= maxSelection;

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50',
        'bg-white dark:bg-gray-900 shadow-lg border rounded-lg',
        'flex items-center gap-4 px-4 py-3',
        'transition-all duration-200 ease-in-out',
        'animate-in slide-in-from-bottom-full',
        className
      )}
      style={{ height: BULK_OPERATIONS_CONFIG.UI.ACTION_BAR_HEIGHT }}
    >
      {/* Selection count */}
      <div className="flex items-center gap-2">
        <Badge
          variant={isMaxReached ? 'destructive' : 'secondary'}
          className="font-medium"
        >
          {selectedCount} selected
        </Badge>
        {isMaxReached && (
          <span className="text-xs text-orange-600 font-medium">
            Max limit reached
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Delete action */}
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        )}

        {/* Clear selection */}
        {onClearSelection && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

interface BulkActionSummaryProps {
  selectedCount: number;
  totalCount: number;
  maxSelection?: number;
  className?: string;
}

/**
 * Summary component for bulk selection (alternative to floating bar)
 */
export function BulkActionSummary({
  selectedCount,
  totalCount,
  maxSelection = BULK_OPERATIONS_CONFIG.MAX_SELECTION_SIZE,
  className,
}: BulkActionSummaryProps) {
  if (selectedCount === 0) {
    return null;
  }

  const percentage = Math.round((selectedCount / totalCount) * 100);
  const isMaxReached = selectedCount >= maxSelection;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 bg-muted/50 rounded-lg border',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="font-medium">
          {selectedCount} of {totalCount}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {percentage}% selected
        </span>
        {isMaxReached && (
          <Badge variant="destructive" className="text-xs">
            Maximum reached
          </Badge>
        )}
      </div>
    </div>
  );
}

interface BulkActionContainerProps {
  children: React.ReactNode;
  selectedCount: number;
  className?: string;
}

/**
 * Container component that adjusts layout when bulk actions are active
 */
export function BulkActionContainer({
  children,
  selectedCount,
  className,
}: BulkActionContainerProps) {
  return (
    <div
      className={cn(
        'relative',
        selectedCount > 0 && 'pb-24', // Add bottom padding when action bar is visible
        className
      )}
    >
      {children}
    </div>
  );
}
