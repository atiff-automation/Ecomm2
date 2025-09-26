/**
 * Bulk Selection Checkbox Component - JRM E-commerce Platform
 * Reusable checkbox component for bulk operations following CLAUDE.md principles
 */

'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { BULK_OPERATIONS_CONFIG } from '@/lib/config/bulk-operations';

interface BulkSelectionCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  indeterminate?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  'aria-label'?: string;
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

/**
 * Individual product selection checkbox
 */
export function BulkSelectionCheckbox({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  size = 'md',
  'aria-label': ariaLabel,
}: BulkSelectionCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(sizeClasses[size], className)}
      aria-label={ariaLabel || 'Select item for bulk operation'}
    />
  );
}

interface BulkSelectAllCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  selectedCount?: number;
  totalCount?: number;
  maxSelection?: number;
}

/**
 * Select all checkbox with indeterminate state support
 */
export function BulkSelectAllCheckbox({
  checked,
  indeterminate = false,
  onCheckedChange,
  disabled = false,
  className,
  selectedCount = 0,
  totalCount = 0,
  maxSelection = BULK_OPERATIONS_CONFIG.MAX_SELECTION_SIZE,
}: BulkSelectAllCheckboxProps) {
  const handleCheckedChange = (newChecked: boolean) => {
    onCheckedChange(newChecked);
  };

  // Determine the visual state
  const isChecked = indeterminate ? 'indeterminate' : checked;

  // Calculate if we should show a warning about max selection
  const willExceedMax = !checked && totalCount > maxSelection;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={isChecked}
          onCheckedChange={handleCheckedChange}
          disabled={disabled}
          className={cn('h-4 w-4', className)}
          aria-label={
            indeterminate
              ? `${selectedCount} of ${totalCount} items selected`
              : checked
              ? 'Unselect all items'
              : 'Select all items'
          }
        />
        <span className="text-sm font-medium whitespace-nowrap">
          Select all
        </span>
      </div>
      {(indeterminate || checked) && (
        <div className="text-xs text-muted-foreground pl-6">
          {selectedCount} of {totalCount}
          {selectedCount >= maxSelection && (
            <span className="text-orange-600 ml-1">
              (max)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface BulkSelectionStatusProps {
  selectedCount: number;
  totalCount: number;
  maxSelection?: number;
  className?: string;
}

/**
 * Status indicator for bulk selection
 */
export function BulkSelectionStatus({
  selectedCount,
  totalCount,
  maxSelection = BULK_OPERATIONS_CONFIG.MAX_SELECTION_SIZE,
  className,
}: BulkSelectionStatusProps) {
  if (selectedCount === 0) {
    return null;
  }

  const isMaxReached = selectedCount >= maxSelection;
  const percentage = Math.round((selectedCount / totalCount) * 100);

  return (
    <div className={cn('text-sm', className)}>
      <span className="font-medium">{selectedCount}</span>
      <span className="text-muted-foreground">
        {' '}of {totalCount} items selected
      </span>
      {percentage > 0 && (
        <span className="text-muted-foreground ml-1">
          ({percentage}%)
        </span>
      )}
      {isMaxReached && (
        <span className="text-orange-600 ml-1 font-medium">
          Maximum reached
        </span>
      )}
    </div>
  );
}